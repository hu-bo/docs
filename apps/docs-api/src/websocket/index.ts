import type { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import { verifyWsToken } from './auth.js';
import { loadDocumentContent, saveDocumentContent } from './persistence.js';
import { logger } from '../utils/logger.js';
import type { UserInfo } from '../types/index.js';

// 消息类型
const messageSync = 0;
const messageAwareness = 1;

// 存储所有文档实例
const docs = new Map<string, WSSharedDoc>();

// 防抖保存的定时器
const saveTimers = new Map<string, NodeJS.Timeout>();
const SAVE_DEBOUNCE_MS = 3000; // 3秒防抖

interface WSClient extends WebSocket {
  user?: UserInfo;
  docName?: string;
  isAlive?: boolean;
}

class WSSharedDoc extends Y.Doc {
  name: string;
  conns: Map<WSClient, Set<number>>;
  awareness: awarenessProtocol.Awareness;

  constructor(name: string) {
    super({ gc: true });
    this.name = name;
    this.conns = new Map();
    this.awareness = new awarenessProtocol.Awareness(this);
    this.awareness.setLocalState(null);

    // 监听 awareness 变化
    this.awareness.on('update', ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }) => {
      const changedClients = added.concat(updated, removed);
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
      );
      const buff = encoding.toUint8Array(encoder);
      this.conns.forEach((_, conn) => {
        if (conn.readyState === WebSocket.OPEN) {
          conn.send(buff);
        }
      });
    });

    // 监听文档更新
    this.on('update', (update: Uint8Array, origin: unknown) => {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageSync);
      syncProtocol.writeUpdate(encoder, update);
      const message = encoding.toUint8Array(encoder);

      this.conns.forEach((_, conn) => {
        if (conn !== origin && conn.readyState === WebSocket.OPEN) {
          conn.send(message);
        }
      });

      // 触发防抖保存
      this.scheduleSave();
    });
  }

  scheduleSave() {
    // 清除之前的定时器
    const existingTimer = saveTimers.get(this.name);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // 设置新的定时器
    const timer = setTimeout(async () => {
      try {
        await saveDocumentContent(this.name, this);
        saveTimers.delete(this.name);
      } catch (error) {
        logger.error(`[WS] Failed to save document ${this.name}:`, error);
      }
    }, SAVE_DEBOUNCE_MS);

    saveTimers.set(this.name, timer);
  }
}

function getYDoc(docName: string): WSSharedDoc {
  let doc = docs.get(docName);
  if (!doc) {
    doc = new WSSharedDoc(docName);
    docs.set(docName, doc);
    logger.info(`[WS] Created new doc: ${docName}`);
  }
  return doc;
}

function messageListener(conn: WSClient, doc: WSSharedDoc, message: Uint8Array) {
  try {
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);

    switch (messageType) {
      case messageSync: {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageSync);
        const syncMessageType = syncProtocol.readSyncMessage(decoder, encoder, doc, conn);

        // 如果是 sync step 2，发送响应
        if (syncMessageType === syncProtocol.messageYjsSyncStep2) {
          // 同步完成
        }

        if (encoding.length(encoder) > 1) {
          conn.send(encoding.toUint8Array(encoder));
        }
        break;
      }
      case messageAwareness: {
        awarenessProtocol.applyAwarenessUpdate(
          doc.awareness,
          decoding.readVarUint8Array(decoder),
          conn
        );
        break;
      }
    }
  } catch (error) {
    logger.error('[WS] Error handling message:', error);
  }
}

function setupWSConnection(conn: WSClient, docName: string, user: UserInfo) {
  conn.user = user;
  conn.docName = docName;
  conn.isAlive = true;

  const doc = getYDoc(docName);
  doc.conns.set(conn, new Set());

  // 发送同步步骤1
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeSyncStep1(encoder, doc);
  conn.send(encoding.toUint8Array(encoder));

  // 发送当前 awareness 状态
  const awarenessStates = doc.awareness.getStates();
  if (awarenessStates.size > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, messageAwareness);
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(
        doc.awareness,
        Array.from(awarenessStates.keys())
      )
    );
    conn.send(encoding.toUint8Array(awarenessEncoder));
  }

  conn.on('message', (message: Buffer) => {
    messageListener(conn, doc, new Uint8Array(message));
  });

  conn.on('pong', () => {
    conn.isAlive = true;
  });

  conn.on('close', () => {
    closeConn(doc, conn);
  });

  conn.on('error', (error) => {
    logger.error(`[WS] Connection error for ${user.username}:`, error);
    closeConn(doc, conn);
  });
}

function closeConn(doc: WSSharedDoc, conn: WSClient) {
  const controlledIds = doc.conns.get(conn);
  doc.conns.delete(conn);

  if (controlledIds) {
    awarenessProtocol.removeAwarenessStates(
      doc.awareness,
      Array.from(controlledIds),
      null
    );
  }

  logger.info(`[WS] Connection closed: ${conn.user?.username} from ${doc.name}`);

  // 如果没有连接了，延迟清理文档
  if (doc.conns.size === 0) {
    // 先保存文档
    saveDocumentContent(doc.name, doc).catch((error) => {
      logger.error(`[WS] Failed to save on close:`, error);
    });

    // 延迟清理（给重连留时间）
    setTimeout(() => {
      if (doc.conns.size === 0) {
        docs.delete(doc.name);
        logger.info(`[WS] Cleaned up doc: ${doc.name}`);
      }
    }, 30000); // 30秒后清理
  }
}

export function setupWebSocketServer(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws/collab' });

  wss.on('connection', async (ws: WSClient, req) => {
    try {
      // 从 URL 获取 token 和文档 ID
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      const docName = url.searchParams.get('doc');

      if (!token) {
        logger.warn('[WS] Missing token');
        ws.close(4001, 'Missing token');
        return;
      }

      if (!docName) {
        logger.warn('[WS] Missing doc parameter');
        ws.close(4002, 'Missing doc parameter');
        return;
      }

      // 验证 token
      const user = verifyWsToken(token);
      if (!user) {
        logger.warn('[WS] Invalid token');
        ws.close(4003, 'Invalid token');
        return;
      }

      logger.info(`[WS] User ${user.username} connecting to doc: ${docName}`);

      // 如果是新文档（没有其他连接），从数据库加载内容
      const existingDoc = docs.get(docName);
      if (!existingDoc || existingDoc.conns.size === 0) {
        const doc = getYDoc(docName);
        await loadDocumentContent(docName, doc);
      }

      // 建立连接
      setupWSConnection(ws, docName, user);

    } catch (error) {
      logger.error('[WS] Connection setup error:', error);
      ws.close(4000, 'Connection error');
    }
  });

  // 心跳检测
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const client = ws as WSClient;
      if (client.isAlive === false) {
        return client.terminate();
      }
      client.isAlive = false;
      client.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  logger.info('[WS] WebSocket server initialized at /ws/collab');
  return wss;
}

export { docs };

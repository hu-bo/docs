import { ref, computed, onUnmounted, watch } from 'vue';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Collaboration } from '@tiptap/extension-collaboration';
import { CollaborationCursor } from '@tiptap/extension-collaboration-cursor';
import { getCollaborationToken, getWebSocketUrl } from '@/api/collaboration';

export interface CollaborationUser {
  clientId: number;
  username: string;
  name: string;
  color: string;
  avatar?: string;
}

export interface UseCollaborationOptions {
  documentId: string;
  username: string;
  displayName?: string;
  userColor?: string;
  avatar?: string;
  enabled?: boolean;
}

// 生成随机颜色
function generateUserColor(): string {
  const colors = [
    '#f56a00', '#7265e6', '#ffbf00', '#00a2ae',
    '#eb2f96', '#52c41a', '#1890ff', '#722ed1',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function useCollaboration(options: UseCollaborationOptions) {
  const {
    documentId,
    username,
    displayName = username,
    userColor = generateUserColor(),
    avatar,
    enabled = true,
  } = options;

  const ydoc = ref<Y.Doc | null>(null);
  const provider = ref<WebsocketProvider | null>(null);
  const isConnected = ref(false);
  const connectionStatus = ref<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const onlineUsers = ref<CollaborationUser[]>([]);
  const error = ref<string | null>(null);

  // 协作扩展配置
  const collaborationExtensions = computed(() => {
    if (!enabled || !ydoc.value || !provider.value) {
      return [];
    }

    return [
      Collaboration.configure({
        document: ydoc.value,
        field: 'default', // Yjs fragment 名称
      }),
      CollaborationCursor.configure({
        provider: provider.value,
        user: {
          name: displayName,
          color: userColor,
          avatar,
        },
      }),
    ];
  });

  // 初始化协作连接
  async function connect() {
    if (!enabled || provider.value) return;

    try {
      connectionStatus.value = 'connecting';
      error.value = null;

      // 获取 WebSocket token
      const { token } = await getCollaborationToken();

      // 创建 Yjs 文档
      ydoc.value = new Y.Doc();

      // 创建 WebSocket 连接
      const wsUrl = getWebSocketUrl(documentId, token);
      console.log('WebSocket URL:', wsUrl);
      // use the full websocket URL returned by the server (including path)
      provider.value = new WebsocketProvider(
        wsUrl,
        `doc-${documentId}`,
        ydoc.value,
        {
          params: { token },
          connect: true,
        }
      );

      // 监听连接状态
      provider.value.on('status', (event: { status: string }) => {
        isConnected.value = event.status === 'connected';
        connectionStatus.value = event.status as typeof connectionStatus.value;
      });

      // 监听 awareness 变化
      provider.value.awareness.on('change', () => {
        updateOnlineUsers();
      });

      // 设置本地用户信息
      provider.value.awareness.setLocalStateField('user', {
        name: displayName,
        color: userColor,
        avatar,
        username,
      });

    } catch (err) {
      console.error('Failed to connect collaboration:', err);
      error.value = err instanceof Error ? err.message : '连接失败';
      connectionStatus.value = 'disconnected';
    }
  }

  // 更新在线用户列表
  function updateOnlineUsers() {
    if (!provider.value) {
      onlineUsers.value = [];
      return;
    }

    const states = provider.value.awareness.getStates();
    const users: CollaborationUser[] = [];

    states.forEach((state, clientId) => {
      if (state.user && clientId !== provider.value?.awareness.clientID) {
        users.push({
          clientId,
          username: state.user.username || state.user.name,
          name: state.user.name,
          color: state.user.color,
          avatar: state.user.avatar,
        });
      }
    });

    onlineUsers.value = users;
  }

  // 断开连接
  function disconnect() {
    if (provider.value) {
      provider.value.destroy();
      provider.value = null;
    }

    if (ydoc.value) {
      ydoc.value.destroy();
      ydoc.value = null;
    }

    isConnected.value = false;
    connectionStatus.value = 'disconnected';
    onlineUsers.value = [];
  }

  // 组件卸载时清理
  onUnmounted(() => {
    disconnect();
  });

  // 监听 documentId 变化，重新连接
  watch(
    () => options.documentId,
    (newId, oldId) => {
      if (newId !== oldId && enabled) {
        disconnect();
        connect();
      }
    }
  );

  return {
    ydoc,
    provider,
    isConnected,
    connectionStatus,
    onlineUsers,
    error,
    collaborationExtensions,
    connect,
    disconnect,
  };
}

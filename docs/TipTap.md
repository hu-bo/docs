# Vue + Express 多人协作（TipTap + Yjs + Hocuspocus）可执行方案

这是一份不依赖任何现有项目的“从零可跑通”方案：

- 前端：Vue 3 + TipTap（ProseMirror）
- 协作协议：Yjs（CRDT）
- 传输/房间管理：Hocuspocus（WebSocket）
- 本地离线：IndexedDB（可选）
- 身份认证：HTTP 接口签发协作 JWT，WebSocket 握手时校验
- 持久化：使用 Redis 保存 Yjs 文档状态（可直接运行），可进一步扩展为多实例

---

## 0. 运行前提

- Node.js 18+（建议 20+）
- npm/pnpm/yarn 任选

---

## 1. 目录结构（建议）

你可以按下面结构创建一个工作区：

- [server/package.json](server/package.json)
- [server/tsconfig.json](server/tsconfig.json)
- [server/.env](server/.env)
- [server/src/index.ts](server/src/index.ts)
- [server/src/collab.ts](server/src/collab.ts)
- [server/src/extensions/auth.extension.ts](server/src/extensions/auth.extension.ts)
- [server/src/extensions/persistence.extension.ts](server/src/extensions/persistence.extension.ts)
- [client/package.json](client/package.json)
- [client/vite.config.ts](client/vite.config.ts)
- [client/src/main.ts](client/src/main.ts)
- [client/src/App.vue](client/src/App.vue)
- [client/src/editor/CollabEditor.vue](client/src/editor/CollabEditor.vue)
- [client/src/api.ts](client/src/api.ts)

---

## 2. 协作链路说明（最小闭环）

1. Vue 页面加载时向后端请求 `POST /auth/collab-token` 获取协作 JWT。
2. Vue 使用 `HocuspocusProvider` 连接 `ws(s)://<host>/collab?doc=<docName>`，把 JWT 作为 `token` 传给 provider。
3. 后端在 Hocuspocus 的 `onAuthenticate` 钩子里校验 JWT 并决定是否设置 `connection.readOnly = true`。
4. 客户端 TipTap 挂载：
    - `@tiptap/extension-collaboration`：把编辑操作映射到同一个 Yjs 文档
    - `@tiptap/extension-collaboration-cursor`：广播光标/选区与昵称
5. 后端在 `onStoreDocument` 中保存 Yjs state（示例用 Map），下次 `onLoadDocument` 能恢复。

---

## 3. 后端：Express + WebSocket + Hocuspocus + Redis 持久化（完整可跑）

### 3.1 安装与启动命令

创建 [server/package.json](server/package.json)：

```json
{
   "name": "collab-server",
   "private": true,
   "type": "module",
   "scripts": {
      "dev": "tsx watch src/index.ts",
      "start": "node dist/index.js",
      "build": "tsc -p tsconfig.json"
   },
   "dependencies": {
      "@hocuspocus/server": "^2.13.0",
      "@hocuspocus/extension-redis": "^2.13.0",
      "cors": "^2.8.5",
      "dotenv": "^16.4.5",
      "express": "^4.19.2",
      "ioredis": "^5.4.2",
      "jsonwebtoken": "^9.0.2",
      "ws": "^8.18.0",
      "yjs": "^13.6.23"
   },
   "devDependencies": {
      "@types/cors": "^2.8.17",
      "@types/express": "^4.17.21",
      "@types/jsonwebtoken": "^9.0.6",
      "@types/node": "^22.10.2",
      "@types/ws": "^8.5.13",
      "tsx": "^4.19.2",
      "typescript": "^5.7.3"
   }
}
```

创建 [server/tsconfig.json](server/tsconfig.json)：

```json
{
   "compilerOptions": {
      "target": "ES2022",
      "module": "ES2022",
      "moduleResolution": "Bundler",
      "outDir": "dist",
      "rootDir": "src",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true
   },
   "include": ["src"]
}
```

创建 [server/.env](server/.env)：

```bash
PORT=3000
JWT_SECRET=dev-secret-change-me
ALLOWED_ORIGIN=http://localhost:5173
REDIS_URL=redis://localhost:6379

# 可选：如果你要多实例横向扩展（多个 Node 进程/容器）
# 启用后会使用 @hocuspocus/extension-redis 在实例间广播更新
# COLLAB_ENABLE_REDIS_PUBSUB=true
```

### 3.2 Web 服务入口（HTTP + WS upgrade）

创建 [server/src/index.ts](server/src/index.ts)：

```ts
import "dotenv/config";
import http from "node:http";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { createCollabServer } from "./collab.js";
import { signCollabToken } from "./extensions/auth.extension.js";

const port = Number(process.env.PORT ?? 3000);
const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "http://localhost:5173";

const app = express();
app.use(express.json());
app.use(
   cors({
      origin: allowedOrigin,
      credentials: true,
   }),
);

// 1) 演示用：签发协作 token
// 真实项目里：这里应该从你自己的登录态/Session/JWT 中识别用户。
app.post("/auth/collab-token", (req, res) => {
   const { userName, role } = (req.body ?? {}) as {
      userName?: string;
      role?: "editor" | "reader";
   };

   const token = signCollabToken({
      sub: "user-" + Math.random().toString(16).slice(2),
      name: userName ?? "Anonymous",
      role: role ?? "editor",
   });

   res.json({ token });
});

// 2) 创建 HTTP server（用于 upgrade WebSocket）
const server = http.createServer(app);

// 3) 创建 WS server（noServer: true 由我们手动 upgrade）
const wss = new WebSocketServer({ noServer: true });

// 4) 创建 hocuspocus 协作服务
const collab = createCollabServer();

// 5) 只把 /collab 的 upgrade 转给 wss
server.on("upgrade", (request, socket, head) => {
   try {
      const baseUrl = "http://" + request.headers.host;
      const { pathname } = new URL(request.url ?? "", baseUrl);

      if (pathname !== "/collab") {
         socket.destroy();
         return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
         wss.emit("connection", ws, request);
      });
   } catch (err) {
      socket.destroy();
   }
});

// 6) WS connection 交给 hocuspocus
wss.on("connection", (ws, request) => {
   collab.handleConnection(ws, request);
});

server.listen(port, () => {
   // eslint-disable-next-line no-console
   console.log(`HTTP listening on http://localhost:${port}`);
   // eslint-disable-next-line no-console
   console.log(`WS  listening on ws://localhost:${port}/collab?doc=mydoc`);
});

### 3.2.1 启动 Redis（开发环境）

本方案默认使用本机 Redis。你可以二选一：

1) Docker 方式：

```bash
docker run --rm -p 6379:6379 --name collab-redis redis:7
```

2) 本机安装 Redis（略）并确保 `REDIS_URL` 指向正确地址。
```

### 3.3 Hocuspocus 配置

创建 [server/src/collab.ts](server/src/collab.ts)：

```ts
import { Server as HocuspocusServer } from "@hocuspocus/server";
import { Redis } from "@hocuspocus/extension-redis";
import { AuthExtension } from "./extensions/auth.extension.js";
import { RedisPersistenceExtension } from "./extensions/persistence.extension.js";

export function createCollabServer() {
   const enableRedisPubSub =
      String(process.env.COLLAB_ENABLE_REDIS_PUBSUB ?? "").toLowerCase() ===
      "true";

   const redisUrl = process.env.REDIS_URL;
   if (!redisUrl) {
      throw new Error("REDIS_URL is required");
   }

   return HocuspocusServer.configure({
      // 持久化频率：客户端持续编辑时，服务端会 debounce 存储
      debounce: 2000,
      maxDebounce: 10000,
      unloadImmediately: false,
      extensions: [
         new AuthExtension(),
         new RedisPersistenceExtension({ redisUrl }),
         // 可选：多实例横向扩展时启用（单实例不需要）
         ...(enableRedisPubSub
            ? [
                 new Redis({
                    url: redisUrl,
                 }),
              ]
            : []),
      ],
   });
}
```

### 3.4 认证扩展（JWT）

创建 [server/src/extensions/auth.extension.ts](server/src/extensions/auth.extension.ts)：

```ts
import type { Extension, onAuthenticatePayload } from "@hocuspocus/server";
import jwt from "jsonwebtoken";

type CollabRole = "editor" | "reader";

export type CollabJwtPayload = {
   sub: string;
   name: string;
   role: CollabRole;
   type: "collab";
};

function getJwtSecret(): string {
   const secret = process.env.JWT_SECRET;
   if (!secret) throw new Error("JWT_SECRET is required");
   return secret;
}

export function signCollabToken(input: Omit<CollabJwtPayload, "type">): string {
   const payload: CollabJwtPayload = { ...input, type: "collab" };
   return jwt.sign(payload, getJwtSecret(), { expiresIn: "24h" });
}

export class AuthExtension implements Extension {
   async onAuthenticate(data: onAuthenticatePayload) {
      const token = data.token;
      if (!token) throw new Error("Missing token");

      const payload = jwt.verify(token, getJwtSecret()) as CollabJwtPayload;
      if (payload.type !== "collab") throw new Error("Invalid token type");

      if (payload.role === "reader") {
         data.connection.readOnly = true;
      }

      // 这个对象会进入 data.context，可在持久化扩展里读到
      return { user: payload };
   }
}
```

### 3.5 持久化扩展（Redis 保存 Yjs 文档状态）

创建 [server/src/extensions/persistence.extension.ts](server/src/extensions/persistence.extension.ts)：

```ts
import type {
   Extension,
   onLoadDocumentPayload,
   onStoreDocumentPayload,
} from "@hocuspocus/server";
import * as Y from "yjs";
import Redis from "ioredis";

type RedisPersistenceOptions = {
   redisUrl: string;
   /** 可选：Redis key 前缀 */
   keyPrefix?: string;
   /** 可选：设置 TTL（秒），不设置则永久保存 */
   ttlSeconds?: number;
};

export class RedisPersistenceExtension implements Extension {
   private readonly redis: Redis;
   private readonly keyPrefix: string;
   private readonly ttlSeconds?: number;

   constructor(opts: RedisPersistenceOptions) {
      this.redis = new Redis(opts.redisUrl, {
         // 断线重连策略可按需调整
         maxRetriesPerRequest: null,
      });
      this.keyPrefix = opts.keyPrefix ?? "ydoc:";
      this.ttlSeconds = opts.ttlSeconds;
   }

   private key(documentName: string) {
      return this.keyPrefix + documentName;
   }

   async onLoadDocument(data: onLoadDocumentPayload) {
      const { documentName } = data;
      const key = this.key(documentName);

      // ioredis：getBuffer 能直接取 Buffer（如果 key 不存在会返回 null）
      const buf = await this.redis.getBuffer(key);
      if (!buf) return new Y.Doc();

      const doc = new Y.Doc();
      Y.applyUpdate(doc, new Uint8Array(buf));
      return doc;
   }

   async onStoreDocument(data: onStoreDocumentPayload) {
      const { documentName, document, context } = data;

      // 这里可以从 context.user 拿到用户信息（审计/归因等）
      void context?.user;

      const key = this.key(documentName);
      const update = Y.encodeStateAsUpdate(document);
      const value = Buffer.from(update);

      if (typeof this.ttlSeconds === "number") {
         await this.redis.set(key, value, "EX", this.ttlSeconds);
      } else {
         await this.redis.set(key, value);
      }
   }
}
```

### 3.6 启动后端

```bash
cd server
npm i
npm run dev
```

---

## 4. 前端：Vue 3 + TipTap + HocuspocusProvider（完整可跑）

### 4.1 安装与启动命令

创建 [client/package.json](client/package.json)：

```json
{
   "name": "collab-client",
   "private": true,
   "type": "module",
   "scripts": {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview"
   },
   "dependencies": {
      "@hocuspocus/provider": "^2.13.0",
      "@tiptap/extension-collaboration": "^2.10.3",
      "@tiptap/extension-collaboration-cursor": "^2.10.3",
      "@tiptap/starter-kit": "^2.10.3",
      "@tiptap/vue-3": "^2.10.3",
      "axios": "^1.7.9",
      "vue": "^3.5.13",
      "y-indexeddb": "^9.0.12",
      "yjs": "^13.6.23"
   },
   "devDependencies": {
      "@vitejs/plugin-vue": "^5.2.1",
      "typescript": "^5.7.3",
      "vite": "^6.0.7"
   }
}
```

创建 [client/vite.config.ts](client/vite.config.ts)：

```ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
   plugins: [vue()],
   server: {
      proxy: {
         // 让浏览器以同源方式访问 HTTP API（避免 CORS）
         "/auth": {
            target: "http://localhost:3000",
            changeOrigin: true,
         },
      },
   },
});
```

### 4.2 前端入口

创建 [client/src/main.ts](client/src/main.ts)：

```ts
import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");
```

创建 [client/src/App.vue](client/src/App.vue)：

```vue
<template>
   <div style="max-width: 900px; margin: 32px auto; padding: 0 16px;">
      <h2>Vue + Express 协作编辑 Demo</h2>
      <p>
         打开两个浏览器窗口，输入相同的 docName，就能看到多人协作与光标。
      </p>

      <div style="display: flex; gap: 8px; margin: 12px 0;">
         <input v-model="docName" placeholder="docName" style="flex: 1; padding: 8px;" />
         <input v-model="userName" placeholder="userName" style="width: 200px; padding: 8px;" />
         <select v-model="role" style="width: 140px; padding: 8px;">
            <option value="editor">editor</option>
            <option value="reader">reader</option>
         </select>
      </div>

      <CollabEditor :doc-name="docName" :user-name="userName" :role="role" />
   </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import CollabEditor from "./editor/CollabEditor.vue";

const docName = ref("mydoc");
const userName = ref("Alice");
const role = ref<"editor" | "reader">("editor");
</script>
```

### 4.3 API 封装（获取协作 token）

创建 [client/src/api.ts](client/src/api.ts)：

```ts
import axios from "axios";

export async function getCollabToken(input: {
   userName: string;
   role: "editor" | "reader";
}): Promise<string> {
   const res = await axios.post("/auth/collab-token", input, {
      headers: { "Content-Type": "application/json" },
   });
   return res.data.token as string;
}
```

### 4.4 协作编辑器组件（TipTap + HocuspocusProvider）

创建 [client/src/editor/CollabEditor.vue](client/src/editor/CollabEditor.vue)：

```vue
<template>
   <div>
      <div style="display: flex; align-items: center; gap: 8px; margin: 8px 0;">
         <strong>Status:</strong>
         <span>{{ status }}</span>
      </div>

      <div class="editor">
         <EditorContent v-if="editor" :editor="editor" />
      </div>
   </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { HocuspocusProvider, WebSocketStatus } from "@hocuspocus/provider";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { getCollabToken } from "../api";

const props = defineProps<{
   docName: string;
   userName: string;
   role: "editor" | "reader";
}>();

const ydoc = new Y.Doc();

// 本地离线缓存（可选）：如果不需要，可以删除这两行。
const idb = new IndexeddbPersistence("demo." + props.docName, ydoc);
void idb;

const provider = ref<HocuspocusProvider | null>(null);
const wsStatus = ref<WebSocketStatus>(WebSocketStatus.Disconnected);

const status = computed(() => wsStatus.value);

async function connect() {
   // 清理旧连接
   provider.value?.destroy();
   provider.value = null;

   const token = await getCollabToken({
      userName: props.userName,
      role: props.role,
   });

   const url = `ws://localhost:3000/collab?doc=${encodeURIComponent(props.docName)}`;

   const p = new HocuspocusProvider({
      url,
      name: props.docName,
      document: ydoc,
      token,
      connect: true,
      onStatus: (event) => {
         wsStatus.value = event.status;
      },
      onAuthenticationFailed: async () => {
         // 重新获取 token 并重连
         const newToken = await getCollabToken({
            userName: props.userName,
            role: props.role,
         });
         p.disconnect();
         // provider configuration 里 token 是可变的
         // @ts-expect-error - hocuspocus provider types sometimes differ by version
         p.configuration.token = newToken;
         p.connect();
      },
   });

   provider.value = p;
}

const editor = useEditor({
   content: "<p>Hello collaboration!</p>",
   extensions: [
      StarterKit.configure({ history: false }),
      Collaboration.configure({ document: ydoc }),
      CollaborationCursor.configure({
         provider: provider.value as any,
         user: {
            name: props.userName,
            color: props.role === "reader" ? "#6b7280" : "#f97316",
         },
      }),
   ],
   editorProps: {
      attributes: {
         spellcheck: "false",
         style: "min-height: 240px; outline: none;",
      },
   },
});

// 当 provider 创建/变化时，需要把新的 provider 传给 Cursor 扩展。
// 这里采用最稳妥的方式：每次连接完成后重建 editor。
async function reconnectAndRecreateEditor() {
   await connect();
   editor.value?.destroy();
   editor.value = null as any;

   editor.value = useEditor({
      extensions: [
         StarterKit.configure({ history: false }),
         Collaboration.configure({ document: ydoc }),
         CollaborationCursor.configure({
            provider: provider.value as any,
            user: {
               name: props.userName,
               color: props.role === "reader" ? "#6b7280" : "#f97316",
            },
         }),
      ],
   }).value;
}

watch(
   () => [props.docName, props.userName, props.role],
   () => {
      // docName 或身份变化时重建连接与 editor
      void reconnectAndRecreateEditor();
   },
   { immediate: true },
);

onBeforeUnmount(() => {
   provider.value?.destroy();
   editor.value?.destroy();
});
</script>

<style>
.editor {
   border: 1px solid #e5e7eb;
   border-radius: 8px;
   padding: 12px;
}

/* TipTap collaboration cursor 默认 class：.collaboration-cursor__caret/.collaboration-cursor__label */
.collaboration-cursor__caret {
   border-left: 2px solid;
   margin-left: -1px;
   margin-right: -1px;
   pointer-events: none;
   position: relative;
}

.collaboration-cursor__label {
   border-radius: 6px;
   color: white;
   font-size: 12px;
   font-weight: 600;
   padding: 2px 6px;
   position: absolute;
   top: -1.4em;
   left: -1px;
   white-space: nowrap;
}
</style>
```

### 4.5 启动前端

```bash
cd client
npm i
npm run dev
```

打开 `http://localhost:5173`，在两个窗口中输入相同 `docName` 测试协作。

---

## 5. 常见问题与生产化建议

### 5.1 为什么要单独签发协作 token？

- WebSocket 连接不一定自带同源 Cookie/session，且在多服务拆分时更难统一认证。
- 用短期/中期有效的协作 JWT（例如 1h/24h）更容易做权限校验与撤销策略。

### 5.2 如何接入真实权限？


- 从 token payload 里拿到 `sub`（用户 ID）
- 根据 `docName` 或 query 参数（如 `doc`）去数据库检查权限
- 对只读用户设置 `data.connection.readOnly = true`

### 5.3 如何做数据库持久化？

本方案已经使用 Redis 持久化：

- 写入：在 `onStoreDocument` 中存 `Y.encodeStateAsUpdate(document)` 到 Redis（binary）
- 读取：在 `onLoadDocument` 中从 Redis 取出并 `Y.applyUpdate` 恢复

如果你要换成数据库（如 Postgres）：思路一致，把 Redis 的 `SET/GET` 换成数据库的 `INSERT/SELECT` 存储二进制字段即可。

### 5.4 横向扩展（多进程/多实例）

- 若你会启动多个协作服务实例（多进程/多容器），建议：
   - 启用 `@hocuspocus/extension-redis`（本文已在 [server/src/collab.ts](server/src/collab.ts) 中提供开关 `COLLAB_ENABLE_REDIS_PUBSUB=true`）用来跨实例广播更新
   - 保持 `documentName` 唯一且可索引（通常用业务侧的 docId/pageId）


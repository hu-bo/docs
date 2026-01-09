# docs-web 项目文档

## 项目概述
参考/Users/hubo/Work/Coding/MyProject/docs/apps/knowledge-workspace-ui（gemini生成的react项目，需要转为vue）
**docs-web** 是"向日葵文档系统"的前端应用，基于 Vue 3 构建的协作文档管理平台。提供空间管理、文档编辑、权限控制、评论协作、实时协同编辑等功能的用户界面。

- **项目名称**: 向日葵文档
- **运行端口**: 8082
- **后端 API**: http://localhost:3001 (docs-api)
- **协同服务**: ws://127.0.0.1:3002 (WebSocket)

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 ^3.5.24 (Composition API) |
| 语言 | TypeScript ~5.9.3 |
| 构建工具 | Vite ^7.2.4 |
| 路由 | Vue Router ^4.5.0 |
| 状态管理 | Pinia ^3.0.0 |
| UI 组件库 | DaisyUI + Headless(DaisyUI无法解决再用Headless封装) |
| 富文本编辑器 | @tiptap/vue-3 @tiptap/starter-kit @tiptap/extension-collaboration @tiptap/extension-collaboration-cursor yjs|
| HTTP 客户端 | Axios ^1.9.0 |
| 样式 | less - |
| 日期处理 | dayjs ^1.11.13 |

---

## 目录结构

```
docs-web/
├── src/
│   ├── api/                       # API 集成层
│   │   ├── request.ts             # Axios 实例配置
│   │   ├── space.ts               # 空间 API
│   │   ├── document.ts            # 文档 API
│   │   ├── comment.ts             # 评论 API
│   │   ├── access.ts              # 权限申请 API
│   │   ├── user.ts                # 用户 API
│   │   ├── collaboration.ts       # 协同编辑 API
│   │   └── index.ts               # 导出
│   │
│   ├── stores/                    # Pinia 状态管理
│   │   ├── space.ts               # 空间相关状态
│   │   ├── document.ts            # 文档相关状态
│   │   ├── user.ts                # 用户状态
│   │   ├── collaboration.ts       # 协同编辑状态
│   │   └── index.ts               # 导出
│   │
│   ├── composables/               # Vue 组合式函数
│   │   ├── useCollaboration.ts    # 协同编辑逻辑
│   │   └── useCreateDocument.ts   # 创建文档逻辑
│   │
│   ├── router/
│   │   └── index.ts               # 路由定义和守卫
│   │
│   ├── views/                     # 页面组件
│   │   ├── Home.vue               # 首页 参考/Users/hubo/Work/Coding/MyProject/docs/apps/knowledge-workspace-ui（需改为vue版本）
│   │   ├── NotFound.vue           # 404 页面
│   │   ├── space/
│   │   │   ├── SpaceList.vue      # 空间列表
│   │   │   ├── SpaceDetail.vue    # 空间详情(含文档树)
│   │   │   ├── SpaceHome.vue      # 空间首页/文件夹视图
│   │   │   ├── SpaceMembers.vue   # 成员管理
│   │   │   └── SpaceAccessDenied.vue # 访问申请
│   │   └── document/
│   │       ├── DocumentView.vue   # 文档查看(评论在右侧)
│   │       ├── DocumentEdit.vue   # 文档编辑(含协同)
│   │       ├── DocumentMembers.vue # 文档成员
│   │       └── DocumentSpaces.vue  # 多空间绑定
│   │
│   ├── layouts/
│   │   └── MainLayout.vue         # 主布局
│   │
│   ├── components/                # 可复用组件
│   │   ├── MemberList.vue         # 成员列表组件
│   │   ├── Comment.vue            # 文档评论
│   │   ├── FolderPermissionModal.vue # 文件夹权限弹窗
│   │   └── editor/
│   │       ├── TiptapEditor.vue   # Tiptap 编辑器组件
│   │       └── CollaborationUsers.vue # 在线协作用户
│   │
│   ├── types/
│   │   └── index.ts               # TypeScript 类型定义
│   │
│   ├── utils/
│   │   └── content-converter.ts   # 内容格式转换
│   │
│   ├── styles/
│   │   ├── global.less            # 全局样式
│   │   └── variables.less         # 样式变量
│   │
│   ├── assets/                    # 静态资源
│   ├── App.vue                    # 根组件
│   └── main.ts                    # 应用入口
│
├── vite.config.ts                 # Vite 配置
├── tsconfig.json                  # TypeScript 配置
└── package.json
```

---

## 类型定义

### 空间相关
```typescript
// 空间类型: 1=公共空间, 2=个人空间
type SpaceType = 1 | 2;

interface Space {
  id: string;
  documentId: string;
  name: string;
  codeName: string;
  creator: string;
  icon: string;
  datasetId: string;
  space_type: SpaceType;
  isDeleted: boolean;
  ctime: string;
  mtime: string;
}

interface Folder {
  id: string;
  documentId: string;
  spaceId: string;
  parentId: string;
  name: string;
  visibilityScope: 'ALL' | 'DEPT_ONLY';
  order: number;
  isDeleted: boolean;
  ctime: string;
  mtime: string;
}
```

### 文档相关
```typescript
type AccessMode = 'OPEN_EDIT' | 'OPEN_READONLY' | 'WHITELIST_ONLY';

interface Doc {
  id: string;
  documentId: string;
  spaceId: string;      // 来自 doc_folder 关联
  folderId: string;     // 来自 doc_folder 关联
  title: string;
  content: string;
  accessMode: AccessMode;
  owner: string;
  tags: string;
  isDeleted: boolean;
  ctime: string;
  mtime: string;
  hasSpaceAuth?: boolean; // API返回：用户是否在 user_space_auth 表中
}

interface RecentDoc {
  id: string;
  documentId: string;
  title: string;
  spaceId: string;
  folderId: string;
  mtime: string;
  lastViewedAt: string;
  spaceName?: string;
}
```

### 权限相关
```typescript
type PermSource = 'AUTO_INIT' | 'MANUAL';
type DocPerm = 'READ' | 'EDIT';

interface UserSpaceAuth {
  id: string;
  documentId: string;
  spaceId: string;
  username: string;
  canRead: boolean;
  canCreateFolder: boolean;
  canCreateDoc: boolean;
  superAdmin: boolean;
  source: PermSource;
  ctime: string;
  mtime: string;
}

interface DocUserAcl {
  id: string;
  documentId: string;
  docId: string;
  username: string;
  perm: DocPerm;
  ctime: string;
  mtime: string;
}

interface DocSpaceBinding {
  spaceId: string;
  spaceName?: string;
  folderId: string;
  folderName?: string;
  perm?: DocPerm;
  isPrimary: boolean;
}
```

### 权限申请相关
```typescript
type AccessRequestType = 'SPACE' | 'DOC';
type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface AccessRequest {
  id: string;
  documentId: string;
  type: AccessRequestType;
  targetId: string;
  username: string;
  requestedPerm: string;
  reason: string;
  status: AccessRequestStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  ctime: string;
  mtime: string;
}
```

### 树形结构
```typescript
interface TreeNode {
  key: string;
  title: string;
  type: 'folder' | 'doc';
  data: Folder | Doc;
  children?: TreeNode[];
  isLeaf?: boolean;
}
```

---

## 页面组件

### 1. Home.vue (首页)
**路径**: `/`

**功能**:
- Hero 区域快速入口按钮
- 最近访问文档网格展示（调用 `GET /api/documents/recent`）
- 个人空间入口（调用 `GET /api/spaces/personal`）
- 待审批申请提醒（调用 `GET /api/access/pending-requests`）
- 创建空间弹窗

### 2. SpaceList.vue (空间列表)
**路径**: `/spaces`

**功能**:
- 卡片式空间网格布局
- 公开/个人空间标签（space_type: 1=公共, 2=个人）
- 分页（每页 20 条）
- 创建空间功能

**API 调用**:
- `GET /api/spaces` - 获取社区空间列表
- `POST /api/spaces` - 创建空间

### 3. SpaceDetail.vue (空间详情)
**路径**: `/space/:spaceId`

**功能**:
- 左侧边栏：目录+文档树（懒加载）
- 右键菜单：编辑、添加子文档、删除
- 创建文档/文件夹弹窗
- 成员管理入口（仅 superAdmin）

**布局**:
```
┌─────────────────────────────────────────────┐
│  Header                                      │
├──────────────┬──────────────────────────────┤
│  文档树      │  <router-view />              │
│  (侧边栏)    │  (内容区)                     │
│              │                               │
│  - 目录1     │  SpaceHome / DocumentView    │
│    - 文档    │  / DocumentEdit              │
│  - 目录2     │                               │
│              │                               │
└──────────────┴──────────────────────────────┘
```

**API 调用**:
- `GET /api/spaces/:spaceId` - 获取空间详情
- `GET /api/spaces/:spaceId/access-status` - 检查访问权限
- `GET /api/documents/tree?spaceId=xxx&folderId=xxx` - 获取文档树

### 4. SpaceHome.vue (空间首页/文件夹视图)
**路径**:
- `/space/:spaceId` (空间首页)
- `/space/:spaceId/folder/:folderPath+` (文件夹视图)

**功能**:
- 空间欢迎信息
- 当前目录下的文档/文件夹网格
- 最近文档展示
- 快速创建文档入口

**API 调用**:
- `GET /api/documents?spaceId=xxx&folderId=xxx` - 获取文档列表
- `GET /api/spaces/:spaceId/folders?parentFolderId=xxx` - 获取文件夹列表

### 5. SpaceMembers.vue (成员管理)
**路径**: `/space/:spaceId/members`

**权限要求**: superAdmin

**功能**:
- **成员标签页**: 已有成员表格
  - 权限显示（superAdmin, canCreateFolder, canCreateDoc）
  - 编辑/移除操作
  - 来源标签（AUTO_INIT/MANUAL）
- **待审批标签页**: 待审批申请列表
  - 审批/拒绝操作

**API 调用**:
- `GET /api/spaces/:spaceId/members` - 获取成员列表
- `POST /api/spaces/:spaceId/members` - 批量添加成员
- `PUT /api/spaces/:spaceId/members` - 更新成员权限
- `DELETE /api/spaces/:spaceId/members` - 移除成员

### 6. SpaceAccessDenied.vue (访问申请)
**路径**: `/space/:spaceId/access-denied`

**功能**:
- 私有空间访问申请表单
- 申请理由输入

**API 调用**:
- `POST /api/access/apply` - 提交权限申请

### 7. DocumentView.vue (文档查看)
**路径**:
- `/space/:spaceId/doc/:documentId`
- `/space/:spaceId/folder/:folderPath+/doc/:documentId`

**功能**:
- 文档标题和元信息
- HTML 内容渲染
- 访问模式标签（OPEN_EDIT/OPEN_READONLY/WHITELIST_ONLY）
- 编辑按钮（根据权限显示）
- 成员管理和空间绑定入口（owner/superAdmin）
- 评论区（支持回复）

**API 调用**:
- `GET /api/documents/:documentId` - 获取文档详情
- `GET /api/comments/:documentId` - 获取评论列表
- `POST /api/comments` - 创建评论

### 8. DocumentEdit.vue (文档编辑)
**路径**:
- `/space/:spaceId/doc/:documentId/edit`
- `/space/:spaceId/folder/:folderPath+/doc/:documentId/edit`

**功能**:
- 标题输入（大号无边框）
- Tiptap 富文本编辑器
- **实时协同编辑**（Yjs + WebSocket）
- 在线用户头像显示
- 保存/取消/删除按钮
- 访问模式设置

**API 调用**:
- `GET /api/documents/:documentId` - 获取文档详情
- `PUT /api/documents/:documentId` - 更新文档
- `DELETE /api/documents/:documentId` - 删除文档
- `POST /api/collaboration/token` - 获取 WebSocket Token

### 9. DocumentMembers.vue (文档成员)
**路径**: `/space/:spaceId/doc/:documentId/members`

**权限要求**: owner 或 superAdmin

**功能**:
- 文档访问白名单管理（doc_user_acl）
- 权限级别（READ/EDIT）
- 添加/编辑/移除成员

**API 调用**:
- `GET /api/documents/:documentId/members` - 获取成员列表
- `POST /api/documents/:documentId/members` - 批量添加成员
- `PUT /api/documents/:documentId/members` - 更新成员权限
- `DELETE /api/documents/:documentId/members` - 移除成员

### 10. DocumentSpaces.vue (文档空间绑定)
**路径**: `/space/:spaceId/doc/:documentId/spaces`

**权限要求**: owner 或 superAdmin

**功能**:
- 多空间绑定管理（doc_space_acl + doc_folder）
- 绑定/解绑空间
- 设置绑定权限（READ/EDIT）

**API 调用**:
- `GET /api/documents/:documentId/spaces` - 获取绑定的空间
- `POST /api/documents/:documentId/spaces` - 绑定到新空间
- `DELETE /api/documents/:documentId/spaces` - 解除绑定

---

## 路由配置

### 路由结构
```typescript
/                                    # 首页
/spaces                              # 空间列表
/space/:spaceId                      # 空间详情（嵌套路由）
  /                                  # 空间首页 (SpaceHome)
  /folder/:folderPath+               # 文件夹视图 (SpaceHome)
  /doc/:documentId                   # 文档查看
  /doc/:documentId/edit              # 文档编辑
  /doc/:documentId/members           # 文档成员
  /doc/:documentId/spaces            # 文档空间绑定
  /folder/:folderPath+/doc/:documentId      # 目录下文档查看
  /folder/:folderPath+/doc/:documentId/edit # 目录下文档编辑
  /members                           # 空间成员管理
/space/:spaceId/access-denied        # 访问申请
/:pathMatch(.*)*                     # 404
```

### 路由守卫
```typescript
// 空间访问检查
meta: { requiresSpaceAccess: true }
→ 调用 GET /api/spaces/:spaceId/access-status
→ 无权限则重定向到 /space/:spaceId/access-denied
→ 有权限则将 auth 信息存入 spaceStore

// 管理员权限检查
meta: { requiresSuperAdmin: true }
→ 检查 status.isSuperAdmin
→ 非管理员重定向到空间首页

// 访问状态缓存
→ 1 分钟 TTL 缓存，避免重复请求
→ 权限变更后可调用 clearAccessStatusCache() 清除
```

---

## 状态管理 (Pinia)

### User Store
**文件**: `stores/user.ts`

**状态**:
```typescript
{
  userInfo: OAUserInfo | null   // 当前用户信息
  loading: boolean
  mockUsers: string[]           // 开发环境 mock 用户列表
  isDev: boolean
}
```

**计算属性**:
- `isLoggedIn`: 是否已登录
- `displayName`: 显示名称
- `avatar`: 头像 URL
- `username`: 用户名

**操作**:
- `fetchCurrentUser()` - 获取当前用户信息
- `fetchMockUsers()` - 获取 mock 用户列表（开发环境）
- `switchUser(username)` - 切换用户（开发环境）

### Space Store
**文件**: `stores/space.ts`

**状态**:
```typescript
{
  spaces: Space[]                      // 空间列表
  spacesTotal: number                  // 总数
  currentSpace: Space | null           // 当前空间
  currentSpaceMembers: UserSpaceAuth[] // 空间成员
  currentUserAuth: UserSpaceAuth | null // 当前用户在此空间的权限
  personalSpace: Space | null          // 个人空间
  loading: boolean
}
```

**计算属性**:
- `isSuperAdmin`: 当前用户是否为空间管理员
- `canCreateFolder`: 是否可创建文件夹
- `canCreateDoc`: 是否可创建文档
- `publicSpaces`: 公共空间列表

**操作**:
- `fetchSpaces(page, pageSize, spaceType)` - 获取空间列表
- `fetchPersonalSpace()` - 获取/创建个人空间
- `fetchSpaceById(spaceId)` - 获取空间详情
- `createSpace(data)` - 创建空间
- `updateSpace(spaceId, data)` - 更新空间
- `deleteSpace(spaceId)` - 删除空间
- `fetchSpaceMembers(spaceId)` - 获取成员列表
- `addMembers(spaceId, members)` - 批量添加成员
- `updateMember(spaceId, data)` - 更新成员权限
- `removeMembers(spaceId, usernames)` - 移除成员
- `createFolder(spaceId, data)` - 创建文件夹
- `setCurrentUserAuth(auth)` - 设置当前用户权限

### Document Store
**文件**: `stores/document.ts`

**状态**:
```typescript
{
  documentTree: TreeNode[]        // 文档树结构
  currentDocument: Doc | null     // 当前文档
  documents: Doc[]                // 文档列表
  documentsTotal: number          // 总数
  recentDocuments: RecentDoc[]    // 最近访问文档
  loading: boolean
}
```

**操作**:
- `fetchDocumentTree(spaceId, folderId)` - 获取文档树
- `loadTreeNodeChildren(spaceId, folderId)` - 懒加载子节点
- `fetchDocuments(spaceId, folderId, page, pageSize)` - 获取文档列表
- `fetchDocumentById(documentId)` - 获取文档详情
- `fetchRecentDocuments(spaceId, limit)` - 获取最近访问文档
- `createDocument(data)` - 创建文档
- `updateDocument(documentId, data)` - 更新文档
- `moveDocument(documentId, folderId)` - 移动文档
- `deleteDocument(documentId)` - 删除文档

### Collaboration Store
**文件**: `stores/collaboration.ts`

**状态**:
```typescript
{
  isConnected: boolean                    // WebSocket 连接状态
  connectionStatus: 'connecting' | 'connected' | 'disconnected'
  onlineUsers: CollaborationUser[]        // 在线协作用户
  currentDocumentId: string | null        // 当前文档 ID
  wsToken: string | null                  // WebSocket Token（带缓存）
}
```

**操作**:
- `fetchWsToken()` - 获取 WebSocket Token（带 5 分钟缓存）
- `updateOnlineUsers(users)` - 更新在线用户
- `setConnectionStatus(status)` - 设置连接状态
- `reset()` - 重置状态

---

## 组合式函数 (Composables)

### useCollaboration
**文件**: `composables/useCollaboration.ts`

**功能**: 封装实时协同编辑逻辑

```typescript
interface UseCollaborationOptions {
  documentId: string;
  username: string;
  displayName?: string;
  userColor?: string;
  avatar?: string;
  enabled?: boolean;
}

const {
  ydoc,                    // Yjs 文档实例
  provider,                // WebSocket Provider
  isConnected,             // 连接状态
  connectionStatus,        // 'connecting' | 'connected' | 'disconnected'
  onlineUsers,             // 在线用户列表
  error,                   // 错误信息
  collaborationExtensions, // Tiptap 扩展配置
  connect,                 // 建立连接
  disconnect,              // 断开连接
} = useCollaboration(options);
```

**工作流程**:
1. 调用 `POST /api/collaboration/token` 获取认证 Token
2. 创建 Yjs 文档实例
3. 建立 WebSocket 连接到 `ws://127.0.0.1:3002/ws/collab`
4. 监听连接状态和 awareness 变化
5. 返回 Tiptap Collaboration 扩展配置

### useCreateDocument
**文件**: `composables/useCreateDocument.ts`

**功能**: 封装创建文档弹窗逻辑

```typescript
const {
  modalVisible,      // 弹窗显示状态
  creating,          // 创建中状态
  form,              // 表单数据 { title, accessMode }
  openCreateModal,   // 打开弹窗
  closeModal,        // 关闭弹窗
  handleCreate,      // 提交创建
} = useCreateDocument();
```
### TipTap多人协作
参考：/Users/hubo/Work/Coding/MyProject/docs/docs/TipTap.md
---

## API 层å

### 请求配置
**文件**: `api/request.ts`

```typescript
// Axios 实例配置
baseURL: '/api'
timeout: 30000
withCredentials: true  // 携带 Cookie

// 响应拦截器
success: code === 0 → 返回 data
error:
  401 → 跳转登录
  403 → 权限不足提示
  404 → 资源不存在
```
### id规范
```
spaceId,docId 在url中，get/post接口使用documentId(strapi自动生成的)
其他还是保持使用自增的id字段
```
### 空间 API (`api/space.ts`)
| 方法 | 函数 | 说明 |
|------|------|------|
| GET | `getSpaces(params)` | 获取空间列表 |
| GET | `getOrCreatePersonalSpace()` | 获取/创建个人空间 |
| GET | `getSpaceById(spaceId)` | 获取空间详情 |
| GET | `checkAccessStatus(spaceId)` | 检查访问权限 |
| POST | `createSpace(data)` | 创建空间 |
| PUT | `updateSpace(spaceId, data)` | 更新空间 |
| DELETE | `deleteSpace(spaceId)` | 删除空间 |
| GET | `getFolders(spaceId, parentFolderId)` | 获取文件夹列表 |
| POST | `createFolder(spaceId, data)` | 创建文件夹 |
| PUT | `updateFolder(spaceId, folderId, data)` | 更新文件夹 |
| GET | `getSpaceMembers(spaceId, params)` | 获取成员列表 |
| POST | `addSpaceMembers(spaceId, members)` | 批量添加成员 |
| PUT | `updateSpaceMember(spaceId, data)` | 更新成员权限 |
| DELETE | `removeSpaceMembers(spaceId, usernames)` | 移除成员 |

### 文档 API (`api/document.ts`)
| 方法 | 函数 | 说明 |
|------|------|------|
| GET | `getRecentDocuments(params)` | 获取最近访问文档 |
| GET | `getDocuments(params)` | 获取文档列表 |
| GET | `getDocumentTree(params)` | 获取文档树（懒加载） |
| GET | `getDocumentById(documentId)` | 获取文档详情 |
| POST | `createDocument(data)` | 创建文档 |
| PUT | `updateDocument(documentId, data)` | 更新文档 |
| PUT | `moveDocument(documentId, folderId)` | 移动文档 |
| DELETE | `deleteDocument(documentId)` | 删除文档 |
| GET | `getDocMembers(documentId, params)` | 获取文档成员 |
| POST | `addDocMembers(documentId, members)` | 批量添加成员 |
| PUT | `updateDocMember(documentId, data)` | 更新成员权限 |
| DELETE | `removeDocMembers(documentId, usernames)` | 移除成员 |
| GET | `getDocSpaces(documentId)` | 获取绑定的空间 |
| POST | `bindDocToSpace(documentId, data)` | 绑定到空间 |
| DELETE | `unbindDocFromSpace(documentId, spaceId)` | 解除绑定 |

### 评论 API (`api/comment.ts`)
| 方法 | 函数 | 说明 |
|------|------|------|
| GET | `getComments(documentId, params)` | 获取文档评论 |
| POST | `createComment(data)` | 创建评论 |
| PUT | `updateComment(commentId, content)` | 更新评论 |
| DELETE | `deleteComment(commentId)` | 删除评论 |

### 权限申请 API (`api/access.ts`)
| 方法 | 函数 | 说明 |
|------|------|------|
| POST | `applyAccess(data)` | 申请权限 |
| GET | `getPendingRequests(params)` | 获取待审批申请 |
| PUT | `approveAccess(data)` | 审批申请 |

### 用户 API (`api/user.ts`)
| 方法 | 函数 | 说明 |
|------|------|------|
| GET | `getCurrentUser()` | 获取当前用户信息 |
| POST | `switchMockUser(username)` | 切换 mock 用户（开发环境） |
| GET | `getMockUsers()` | 获取 mock 用户列表（开发环境） |

### 协同 API (`api/collaboration.ts`)
| 方法 | 函数 | 说明 |
|------|------|------|
| POST | `getCollaborationToken()` | 获取 WebSocket Token |
| - | `getWebSocketUrl(documentId, token)` | 构建 WebSocket URL |

---

## 核心功能流程

### 1. 用户认证流程
```
应用启动
    ↓
调用 GET /api/user/current
    ↓
成功 → 存入 userStore.userInfo
失败 → 跳转登录页（生产环境）
```

### 2. 访问控制流程
```
用户访问空间 /space/:spaceId
    ↓
路由守卫检查 requiresSpaceAccess
    ↓
调用 GET /api/spaces/:spaceId/access-status
    ↓
hasAccess=true → 进入空间，auth 存入 spaceStore
hasAccess=false → 重定向到 /space/:spaceId/access-denied
    ↓
用户提交申请 POST /api/access/apply
    ↓
管理员在成员管理页审批 PUT /api/access/approve
    ↓
审批通过 → 用户获得权限
```

### 3. 文档编辑流程（含协同）
```
点击编辑按钮
    ↓
进入 DocumentEdit 页面
    ↓
useCollaboration 初始化
    ↓
POST /api/collaboration/token 获取 Token
    ↓
建立 WebSocket 连接 ws://127.0.0.1:3002/ws/collab
    ↓
Yjs + Tiptap 实时同步
    ↓
显示在线协作用户头像
    ↓
离开页面 → 断开连接
```

### 4. 多空间绑定流程
```
文档在空间 A 创建
    ↓
进入 DocumentSpaces 页面
    ↓
GET /api/documents/:documentId/spaces 获取绑定列表
    ↓
POST /api/documents/:documentId/spaces 绑定到空间 B
    ↓
选择目标文件夹和权限（READ/EDIT）
    ↓
文档同时出现在两个空间
    ↓
数据表已解耦（doc_folder + doc_space_acl）
```

### 5. 文档权限判断逻辑
```
访问文档
    ↓
检查 accessMode
    ↓
OPEN_EDIT → 所有人可编辑
OPEN_READONLY →
  - doc_user_acl.perm=EDIT 可编辑
  - doc_space_acl.perm=EDIT + user_space_auth 可编辑
  - owner/superAdmin 可编辑
  - 其他只读
WHITELIST_ONLY →
  - doc_user_acl.perm 决定权限
  - doc_space_acl.perm + user_space_auth 决定权限
  - owner/superAdmin 有权限
  - 无记录则 403
```

---

## 配置说明

### Vite 配置
**文件**: `vite.config.ts`

```typescript
{
  plugins: [vue()],
  resolve: {
    alias: { '@': 'src/' }
  },
  server: {
    port: 8082,
    allowedHosts: ['ff-dev.bilibili.co', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
}
```

### TypeScript 配置
- 严格类型检查
- Vue SFC 支持
- ES2020 目标

---

## Vue 规则
- 'v-model' directives require no argument.

---

## 系统架构关系

```
┌─────────────────────────────────────────────────────────────┐
│  docs-web (前端) ← 本项目                                    │
│  http://localhost:8082                                       │
│  - 用户界面                                                   │
│  - 状态管理                                                   │
│  - 路由控制                                                   │
│  - 实时协同（Yjs + WebSocket）                                │
├─────────────────────────────────────────────────────────────┤
│                     ↓ /api 代理        ↓ WebSocket           │
├─────────────────────────────────────────────────────────────┤
│  docs-api (BFF 层)              │  协同服务                   │
│  http://localhost:3001          │  ws://127.0.0.1:3002        │
│  - 业务逻辑                      │  - y-websocket              │
│  - 权限验证                      │  - 实时同步                  │
├─────────────────────────────────────────────────────────────┤
│                          ↓ Strapi REST API                   │
├─────────────────────────────────────────────────────────────┤
│  docs-strapi (数据层)                                         │
│  http://localhost:1337                                       │
│  - 数据持久化                                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 开发命令

```bash
# 开发模式
pnpm dev

# 类型检查 + 构建
pnpm build        # vue-tsc && vite build

# 预览构建结果
pnpm preview

# 代码检查
pnpm lint
```

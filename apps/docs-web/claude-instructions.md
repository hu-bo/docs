# Claude Instructions - docs-web

## 项目概述

docs-web 是向日葵文档系统的 Vue.js 前端应用，提供文档管理、实时协作编辑和权限控制功能。

## 技术栈

- **框架**: Vue 3.5.x (Composition API)
- **路由**: Vue Router 4.x
- **状态管理**: Pinia 3.x
- **UI 组件库**: Ant Design Vue 4.x
- **富文本编辑器**: Tiptap 3.x
- **实时协作**: Yjs + y-websocket (CRDT)
- **构建工具**: Vite 7.x
- **语言**: TypeScript 5.x
- **样式**: Less

## 项目结构

```
docs-web/
├── src/
│   ├── api/              # API 请求层
│   │   ├── request.ts    # Axios 实例和拦截器
│   │   ├── space.ts      # 空间相关 API
│   │   ├── document.ts   # 文档相关 API
│   │   ├── comment.ts    # 评论 API
│   │   ├── access.ts     # 访问请求 API
│   │   ├── collaboration.ts  # 协作 API
│   │   └── user.ts       # 用户 API
│   ├── components/       # 可复用组件
│   │   └── editor/       # 编辑器相关组件
│   ├── composables/      # Vue 3 Composables
│   │   ├── useCollaboration.ts   # 实时协作逻辑
│   │   └── useCreateDocument.ts  # 创建文档逻辑
│   ├── layouts/          # 布局组件
│   ├── router/           # 路由配置
│   ├── stores/           # Pinia 状态管理
│   │   ├── space.ts      # 空间状态
│   │   ├── document.ts   # 文档状态
│   │   └── user.ts       # 用户状态
│   ├── styles/           # 全局样式 (Less)
│   ├── types/            # TypeScript 类型定义
│   ├── utils/            # 工具函数
│   ├── views/            # 页面组件
│   │   ├── space/        # 空间相关页面
│   │   └── document/     # 文档相关页面
│   ├── App.vue           # 根组件
│   └── main.ts           # 应用入口
├── public/               # 静态资源
├── vite.config.ts        # Vite 配置
└── tsconfig.json         # TypeScript 配置
```

## 开发命令

```bash
pnpm dev      # 开发服务器 (端口 8082)
pnpm build    # 类型检查 + 生产构建
pnpm preview  # 预览生产构建
pnpm lint     # ESLint 检查并修复
```

## 核心模式

### 1. 状态管理 (Pinia)

**useSpaceStore**:
- 管理空间列表、当前空间、用户权限
- 计算属性: `isSuperAdmin`, `canCreateFolder`, `canCreateDoc`

**useDocumentStore**:
- 管理文档树、当前文档、最近文档
- 支持文件夹和文档的懒加载树结构

**useUserStore**:
- 管理用户会话信息
- 开发模式支持用户切换

### 2. API 层

```typescript
// 自动解包响应数据
// ApiResponse<T> { code, message, data } -> T
const data = await api.getDocument(id);  // 直接获取 data
```

**错误处理**: 全局拦截器自动显示错误消息，401 自动跳转登录

### 3. Composables

**useCollaboration**:
- 管理 WebSocket 连接和 Yjs 文档同步
- 提供多光标感知和在线用户列表
- 自动重连机制

**useCreateDocument**:
- 封装文档创建的 Modal 和表单逻辑

### 4. 路由结构

```
/                           # 首页
/spaces                     # 空间列表
/space/:spaceId             # 空间详情 (父路由)
  ├── (空)                  # 空间首页
  ├── members               # 成员管理 (仅管理员)
  ├── folder/:folderPath+   # 文件夹视图
  └── doc/:documentId       # 文档视图/编辑
```

**路由守卫**: 检查空间访问权限，支持 1 分钟缓存

### 5. 权限系统

**空间级别**:
- `superAdmin`: 超级管理员
- `canCreateFolder`: 可创建文件夹
- `canCreateDoc`: 可创建文档

**文档级别** (accessMode):
- `OPEN_EDIT`: 所有人可编辑
- `OPEN_READONLY`: 所有人只读
- `WHITELIST_ONLY`: 仅白名单

## 组件规范

### Vue SFC 结构

```vue
<script setup lang="ts">
// 1. imports
// 2. props/emits 定义
// 3. composables 和 stores
// 4. 响应式状态
// 5. 计算属性
// 6. 方法
// 7. 生命周期钩子
</script>

<template>
  <!-- 模板 -->
</template>

<style scoped lang="less">
/* 局部样式 */
</style>
```

### 编辑器组件

`TiptapEditor.vue`:
- Props: `modelValue`, `readonly`, `extensions`, `placeholder`
- Emits: `update:modelValue`, `ready`
- 支持 20+ 语言的代码高亮

## 类型定义

```typescript
// API 响应格式
interface ApiResponse<T> {
  code: number;      // 0 = 成功
  message: string;
  data: T;
}

// 分页响应
interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

## Vite 配置

```typescript
{
  server: {
    host: '0.0.0.0',
    port: 8082,
    proxy: {
      '/api': 'http://127.0.0.1:3002',
      '/ws/': { target: 'ws://127.0.0.1:3002', ws: true }
    }
  },
  resolve: {
    alias: { '@': './src' }
  }
}
```

## 重要注意事项

1. **国际化**: 使用 zh-CN 中文，dayjs 已配置中文 locale
2. **内容格式**: 支持 HTML 和 Tiptap JSON 格式自动转换
3. **协作冲突**: 使用 Yjs CRDT 自动解决编辑冲突
4. **权限缓存**: 空间访问检查有 1 分钟缓存
5. **开发模式**: 支持 mock 用户切换功能

## 相关项目

- docs-api: Node.js 后端 API
- docs-strapi: Strapi CMS 数据层

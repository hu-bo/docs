# docs-web 项目文档

## 项目概述

**docs-web** 是"向日葵文档系统"的前端应用，基于 Vue 3 构建的协作文档管理平台。提供空间管理、文档编辑、权限控制、评论协作等功能的用户界面。

- **项目名称**: 向日葵文档
- **运行端口**: 8082
- **后端 API**: http://localhost:3001 (docs-api)

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 ^3.5.24 (Composition API) |
| 语言 | TypeScript ~5.9.3 |
| 构建工具 | Vite ^7.2.4 |
| 路由 | Vue Router ^4.5.0 |
| 状态管理 | Pinia ^3.0.0 |
| UI 组件库 | Ant Design Vue ^4.2.0 |
| 富文本编辑器 | Tiptap + Yjs |
| HTTP 客户端 | Axios ^1.9.0 |
| 样式 | less - |
| 日期处理 | dayjs ^1.11.13 |

---

## 目录结构

```
docs-web/
├── src/
│   ├── api/                    # API 集成层
│   │   ├── request.ts          # Axios 实例配置
│   │   ├── spaces.ts            # 空间 API
│   │   ├── documents.ts         # 文档 API
│   │   ├── comments.ts          # 评论 API
│   │   ├── access.ts            # 权限 API
│   │   └── index.ts            # 导出
│   │
│   ├── stores/                  # Pinia 状态管理
│   │   ├── space.ts             # 空间相关数据
│   │   ├── document.ts          # 文档关数据
│   │   ├── access.ts            # 待审批列表
│   │   └── index.ts             # 导出
│   │
│   ├── router/
│   │   └── index.ts            # 路由定义和守卫
│   │
│   ├── views/                  # 页面组件
│   │   ├── Home.vue            # 首页
│   │   ├── NotFound.vue        # 404 页面
│   │   ├── space/
│   │   │   ├── SpaceList.vue   # 空间列表
│   │   │   ├── SpaceDetail.vue # 空间详情(含文档树)
│   │   │   ├── SpaceHome.vue   # 空间首页
│   │   │   ├── SpaceMembers.vue # 成员管理
│   │   │   └── SpaceAccessDenied.vue # 访问申请
│   │   └── document/
│   │       ├── DocumentView.vue   # 文档查看
│   │       ├── DocumentEdit.vue   # 文档编辑
│   │       ├── DocumentMembers.vue # 文档成员
│   │       └── DocumentSpaces.vue  # 多空间绑定
│   │
│   ├── layouts/
│   │   └── MainLayout.vue      # 主布局
│   │
│   ├── components/             # 可复用组件
│   │   └── Members.vue         # 空间成员管理和文档成员复用部分
│   ├── composables/            # Vue 组合式函数
│   │
│   ├── types/
│   │   └── index.ts            # TypeScript 类型定义
│   │
│   ├── styles/
│   │   ├── global.less         # 全局样式
│   │   └── variables.less      # 样式变量
│   │
│   ├── assets/                 # 静态资源
│   ├── App.vue                 # 根组件
│   └── main.ts                 # 应用入口
│
├── vite.config.ts              # Vite 配置
├── tsconfig.json               # TypeScript 配置
└── package.json
```

---

## 页面组件

### 1. Home.vue (首页)
**路径**: `/`

**功能**:
- Hero 区域快速入口按钮
- 最近访问空间网格展示
- 待审批申请提醒（空间管理员，个人空间owner）
- 创建空间弹窗

### 2. SpaceList.vue (空间列表)
**路径**: `/spaces`

**功能**:
- 卡片式空间网格布局
- 公开/私有标签
- 分页（每页 20 条）
- 创建空间功能

### 3. SpaceDetail.vue (空间详情)
**路径**: `/space/:spaceId`

**功能**:
- 左侧边栏：目录+文档树（懒加载）
- 右键菜单：编辑、添加子文档、删除
- 创建文档弹窗
- 可弹出侧边栏
  - 成员管理入口（仅管理员）

**布局**:
```
┌─────────────────────────────────────────────┐
│  Header                                      │
├──────────────┬──────────────────────────────┤
│  文档树      │  <router-view />              │
│  (侧边栏)    │  (内容区)                     │
│              │                               │
│  - 目录1    │  SpaceHome / DocumentView    │
│    - 文档  │  / DocumentEdit              │
│  - 目录2     │                               │
│              │                               │
└──────────────┴──────────────────────────────┘
```

### 4. SpaceHome.vue (空间首页)
**路径**: `/space/:spaceId` (默认)

**功能**:
- 空间欢迎信息
- 最近文档网格
- 快速创建文档入口

### 5. SpaceMembers.vue (成员管理)
**路径**: `/space/:spaceId/members`

**功能**:
- **成员标签页**: 已审批成员表格
  - 权限显示（superAdmin, createFolder, createDoc）
  - 编辑/移除操作
  - 来源标签（AUTO_INIT/MANUAL）
- **待审批标签页**: 待审批申请列表
  - 审批/拒绝操作

### 6. SpaceAccessDenied.vue (访问申请)
**路径**: `/space/:spaceId/access-denied`

**功能**:
- 私有空间访问申请表单
- 申请理由输入

### 7. DocumentView.vue (文档查看)
**路径**: `/space/:spaceId/doc/:documentId`

**功能**:
- 文档标题和元信息
- HTML 内容渲染
- 状态标签（草稿/已发布/归档）
- 编辑按钮
- 成员管理和空间绑定入口
- 评论区（支持回复）
- 评论提交表单

### 8. DocumentEdit.vue (文档编辑)
**路径**: `/space/:spaceId/doc/:documentId/edit`

**功能**:
- 标题输入（大号无边框）
- Tiptap + Yjs
- 草稿/保存/取消/删除按钮
- 全高度编辑器

### 9. DocumentMembers.vue (文档成员)
**路径**: `/space/:spaceId/doc/:documentId/members`

**功能**:
- 文档访问白名单管理
- 权限级别（READ/EDIT）
- 添加/编辑/移除成员

### 10. DocumentSpaces.vue (文档空间绑定)
**路径**: `/space/:spaceId/doc/:documentId/spaces`

**功能**:
- 多空间绑定管理
- 绑定/解绑空间
- 修改绑定文件夹

---

## 路由配置

### 路由结构
```typescript
/                           # 首页
/spaces                     # 空间列表
/space/:spaceId             # 空间详情（嵌套路由）
  /                         # 空间首页 (SpaceHome)
  /doc/:documentId          # 文档查看
  /doc/:documentId/edit     # 文档编辑
  /doc/:documentId/members  # 文档成员
  /doc/:documentId/spaces   # 文档空间绑定
  /members                  # 空间成员管理
  /access-denied            # 访问申请
/:pathMatch(.*)*            # 404
```

### 路由守卫
```typescript
// 空间访问检查
meta: { requiresSpaceAccess: true }
→ 调用 spaceApi.checkAccessStatus()
→ 无权限则重定向到 /space/:spaceId/access-denied

// 管理员权限检查
meta: { requiresSuperAdmin: true }
→ 检查 superAdmin 权限
```

---

## 状态管理 (Pinia)

### Space Store
**文件**: `stores/space.ts`

**状态**:
```typescript
{
  spaces: Space[]                    // 空间列表
  currentSpace: Space | null         // 当前空间
  currentSpaceMembers: SpaceMember[] // 空间成员
  currentAccessStatus: SpaceAccessStatus | null
  currentSpaceAuths: UserSpaceAuth[] // 空间授权列表
}
```

**计算属性**:
- `isSuperAdmin`: 当前用户是否为空间管理员

**操作**:
- 获取空间列表/详情
- 空间 CRUD
- 检查访问状态
- 管理授权

### Document Store
**文件**: `stores/document.ts`

**状态**:
```typescript
{
  documentTree: TreeNode[]      // 文档树结构
  currentDocument: Doc | null   // 当前文档
  documents: Doc[]              // 文档列表
}
```

**操作**:
- 获取文档树
- 文档 CRUD
- 移动/排序
- 树节点导航

---

## API 层

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
  403 → 权限不足
  404 → 资源不存在
```

### API
参考：/Users/hubo/Work/Coding/MyProject/app-nodejs/docs/docs-api.md

---

## 样式系统

### 全局样式
**文件**: `styles/global.less`

- 自定义滚动条样式
- Flex 布局工具类
- 间距工具类
- 通用样式重置

---

## vue 规则
- 'v-model' directives require no argument.
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

## 核心功能流程

### 1. 访问控制流程
```
用户访问空间
    ↓
路由守卫检查 requiresSpaceAccess
    ↓
调用 checkAccessStatus API
    ↓
有权限 → 进入空间
无权限 → 重定向到申请页面
    ↓
用户提交申请 (requestReason)
    ↓
管理员在成员管理页审批
    ↓
审批通过 → 用户获得权限
```

### 2. 文档编辑流程
```
点击编辑按钮
    ↓
进入 DocumentEdit 页面
    ↓
编辑器编辑内容
    ↓
yjs y-websocket
    ↓
返回文档查看页
```

### 3. 多空间绑定流程
```
文档在空间 A 创建
    ↓
进入 DocumentSpaces 页面
    ↓
绑定到空间 B
    ↓
选择目标文件夹
    ↓
文档同时出现在两个空间
    ↓
内容保持同步(数据表已解偶，无需手动实现)
```

---

## UI/UX 特性

- **色彩方案**: 蓝色主色调 (#1890ff)
- **组件库**: Ant Design Vue 企业级组件
- **布局**: Header + 可折叠侧边栏 + 内容区
- **响应式**: 基于网格的响应式卡片布局
- **图标**: Ant Design Icons
- **弹窗**: 模态框用于创建和编辑
- **树形导航**: 左侧可展开的文档树
- **状态指示**: 标签显示发布状态、权限、隐私
- **空状态**: 友好的无内容提示

---

## 系统架构关系

```
┌─────────────────────────────────────────────────────────────┐
│  docs-web (前端) ← 本项目                                    │
│  http://localhost:8082                                       │
│  - 用户界面                                                   │
│  - 状态管理                                                   │
│  - 路由控制                                                   │
├─────────────────────────────────────────────────────────────┤
│                          ↓ /api 代理                         │
├─────────────────────────────────────────────────────────────┤
│  docs-api (BFF 层)                                           │
│  http://localhost:3001                                       │
│  - 业务逻辑                                                   │
│  - 权限验证                                                   │
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

# 类型检查
pnpm build        # vue-tsc && vite build

# 预览构建结果
pnpm preview
```

# Claude Instructions - docs-strapi

## 项目概述

docs-strapi 是向日葵文档系统的 Strapi 后端服务，提供 Headless CMS 数据存储和 REST API。

## 技术栈

- **框架**: Strapi 5.33.0
- **运行时**: Node.js 20.x - 24.x
- **数据库**: MySQL 2 (主要)
- **语言**: TypeScript 5.x
- **包管理**: npm >= 6.0.0

## 项目结构

```
docs-strapi/
├── src/
│   ├── api/                    # Content Types 和 API 模块
│   │   ├── space/              # 空间
│   │   ├── space-folder/       # 空间文件夹 (层级结构)
│   │   ├── space-dept/         # 空间部门关联
│   │   ├── doc/                # 文档
│   │   ├── doc-folder/         # 文档与空间文件夹关联
│   │   ├── comment/            # 评论
│   │   ├── access-request/     # 访问请求
│   │   ├── doc-user-acl/       # 文档用户 ACL
│   │   ├── doc-space-acl/      # 文档空间 ACL
│   │   ├── user-space-auth/    # 用户空间授权
│   │   └── doc-user-activity/  # 用户活动追踪
│   ├── index.ts                # 主入口和全局中间件
│   └── middlewares/            # 自定义中间件
├── config/                     # Strapi 配置
│   ├── admin.ts               # 管理面板配置
│   ├── api.ts                 # API 配置
│   ├── database.ts            # 数据库连接
│   ├── middlewares.ts         # 中间件栈
│   ├── plugins.ts             # 插件配置
│   └── server.ts              # 服务器配置
├── types/generated/            # 自动生成的类型定义
├── database/                   # 数据库相关
│   ├── dump.sql               # Schema 导出
│   └── migrations/            # 迁移文件
└── scripts/                    # 工具脚本
    ├── auto-compliance-fields.js  # 添加标准字段
    └── dump-create-tables.js      # 导出表结构
```

## 开发命令

```bash
npm run dev               # 开发服务器 (热重载)
npm run develop           # 同上
npm run build             # 构建生产版本
npm start                 # 启动生产服务器
npm run console           # Strapi 交互式控制台
npm run ts:generate-types # 生成 TypeScript 类型
```

## Content Types (11 个)

### 核心业务类型

| 类型 | 集合名 | 说明 |
|------|--------|------|
| Space | `spaces` | 工作空间/项目 |
| Doc | `docs` | 文档 |
| SpaceFolder | `space_folders` | 空间文件夹 (层级结构，包含 parentId, name, visibilityScope, order) |
| SpaceDept | `space_depts` | 空间与部门关联 (space_id, dept_id) |
| DocFolder | `doc_folders` | 文档与空间文件夹关联 (doc_id, space_id) |
| Comment | `comments` | 文档评论 |

### 权限控制类型

| 类型 | 集合名 | 说明 |
|------|--------|------|
| DocUserAcl | `doc_user_acls` | 文档用户级权限 |
| DocSpaceAcl | `doc_space_acls` | 文档空间级权限 |
| UserSpaceAuth | `user_space_auths` | 用户空间授权 |

### 管理类型

| 类型 | 集合名 | 说明 |
|------|--------|------|
| AccessRequest | `access_requests` | 权限请求工作流 |
| DocUserActivity | `doc_user_activities` | 用户活动追踪 |

### 关键字段说明

**SpaceFolder**:
- `spaceId`: 所属空间 ID
- `parentId`: 父文件夹 ID (0 表示根级)
- `name`: 文件夹名称
- `visibilityScope`: 可见性范围 (`ALL` | `DEPT_ONLY`)
- `order`: 排序权重
- `isDeleted`: 软删除标志

**DocFolder**:
- `doc_id`: 文档 ID
- `space_id`: 空间 ID (用于关联文档到特定空间的文件夹结构)

**SpaceDept**:
- `space_id`: 空间 ID
- `dept_id`: 部门 ID (用于部门级别的空间访问控制)

## 核心模式

### 1. 全局中间件 (src/index.ts)

**ID 转换**: 所有 API 响应中的数字 ID 转为字符串

**软删除**: 拦截删除操作，改为设置 `isDeleted` 标志

**时间戳管理**:
- `ctime`: 创建时自动设置
- `mtime`: 更新时自动设置

### 2. 字段命名约定

- 业务类型使用 camelCase: `isDeleted`, `docId`, `spaceId`
- Strapi 内部类型使用 snake_case: `is_deleted`

### 3. 标准字段

每个 Content Type 都包含：
- `isDeleted` (boolean): 软删除标志
- `ctime` (datetime): 创建时间
- `mtime` (datetime): 修改时间

## API 配置

```typescript
// config/api.ts
{
  rest: {
    defaultLimit: 25,
    maxLimit: 100,
    withCount: true
  }
}
```

## 环境变量

```bash
# 服务器
HOST=0.0.0.0
PORT=1337
APP_KEYS=xxx,xxx  # 必需

# 安全
API_TOKEN_SALT=xxx
ADMIN_JWT_SECRET=xxx
TRANSFER_TOKEN_SALT=xxx
ENCRYPTION_KEY=xxx

# 数据库
DATABASE_CLIENT=mysql
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=docs_strapi
DATABASE_USERNAME=root
DATABASE_PASSWORD=xxx
```

## 工具脚本

```bash
# 添加标准字段到所有表
node scripts/auto-compliance-fields.js [--dry-run]

# 导出表结构
node scripts/dump-create-tables.js
```

## 重要注意事项

1. **禁用插件**: Upload 和 Email 插件已禁用以减少开销
2. **草稿/发布**: 大多数类型禁用了草稿发布功能
3. **类型生成**: Schema 变更后运行 `npm run ts:generate-types`
4. **软删除**: 所有删除都是逻辑删除，数据不会物理删除

## 相关项目

- docs-web: Vue.js 前端
- docs-api: Node.js API 网关/BFF 层

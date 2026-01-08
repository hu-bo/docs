# docs-strapi 向日葵文档系统数据服务

> **安全精简策略（减少数据库表）：**
> - 禁用 upload 插件（媒体库）
> - 禁用 email 插件
> - 仅开放必要 API 和内容类型

## 项目概述

**docs-strapi** 是"向日葵文档系统"的数据持久化层，基于 Strapi v5 Headless CMS 构建。作为系统底层数据服务，提供标准化的 REST API 供 docs-api（BFF 层）调用，负责数据模型定义、存储与 CRUD 操作。

- **运行端口**: 1337
- **上游调用方**: http://localhost:3001 (docs-api)
- **数据库**: MySQL 8.0+

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Strapi v5.13.0 |
| 语言 | TypeScript 5.x |
| 数据库 | MySQL |
| ORM | Strapi Document Service |
| 认证 | API Token (Bearer) |
| 运行时 | Node.js >= 18.x |

---

## 目录结构

```
docs-strapi/
├── config/
│   ├── admin.ts              # 管理面板配置
│   ├── api.ts                # API 配置
│   ├── database.ts           # 数据库连接配置
│   ├── middlewares.ts        # 中间件配置
│   ├── plugins.ts            # 插件配置
│   └── server.ts             # 服务器配置
│
├── src/
│   ├── api/                  # 内容类型定义
│   │   ├── space/            # 空间
│   │   │   ├── content-types/space/schema.json
│   │   │   ├── controllers/space.ts
│   │   │   ├── routes/space.ts
│   │   │   └── services/space.ts
│   │   │
│   │   ├── space-folder/     # 目录（原 folder）
│   │   │   ├── content-types/space-folder/schema.json
│   │   │   ├── controllers/space-folder.ts
│   │   │   ├── routes/space-folder.ts
│   │   │   └── services/space-folder.ts
│   │   │
│   │   ├── space-dept/       # 空间部门映射
│   │   │   ├── content-types/space-dept/schema.json
│   │   │   ├── controllers/space-dept.ts
│   │   │   ├── routes/space-dept.ts
│   │   │   └── services/space-dept.ts
│   │   │
│   │   ├── doc/              # 文档
│   │   │   ├── content-types/doc/schema.json
│   │   │   ├── controllers/doc.ts
│   │   │   ├── routes/doc.ts
│   │   │   └── services/doc.ts
│   │   │
│   │   ├── doc-folder/       # 文档文件夹关联
│   │   │   ├── content-types/doc-folder/schema.json
│   │   │   ├── controllers/doc-folder.ts
│   │   │   ├── routes/doc-folder.ts
│   │   │   └── services/doc-folder.ts
│   │   │
│   │   ├── comment/          # 评论
│   │   │   ├── content-types/comment/schema.json
│   │   │   ├── controllers/comment.ts
│   │   │   ├── routes/comment.ts
│   │   │   └── services/comment.ts
│   │   │
│   │   ├── user-space-auth/  # 空间授权
│   │   │   ├── content-types/user-space-auth/schema.json
│   │   │   ├── controllers/user-space-auth.ts
│   │   │   ├── routes/user-space-auth.ts
│   │   │   └── services/user-space-auth.ts
│   │   │
│   │   ├── doc-user-acl/     # 文档用户权限
│   │   │   ├── content-types/doc-user-acl/schema.json
│   │   │   ├── controllers/doc-user-acl.ts
│   │   │   ├── routes/doc-user-acl.ts
│   │   │   └── services/doc-user-acl.ts
│   │   │
│   │   ├── doc-space-acl/    # 文档空间权限
│   │   │   ├── content-types/doc-space-acl/schema.json
│   │   │   ├── controllers/doc-space-acl.ts
│   │   │   ├── routes/doc-space-acl.ts
│   │   │   └── services/doc-space-acl.ts
│   │   │
│   │   ├── doc-user-activity/ # 用户行为
│   │   │   ├── content-types/doc-user-activity/schema.json
│   │   │   ├── controllers/doc-user-activity.ts
│   │   │   ├── routes/doc-user-activity.ts
│   │   │   └── services/doc-user-activity.ts
│   │   │
│   │   └── access-request/   # 访问申请
│   │       ├── content-types/access-request/schema.json
│   │       ├── controllers/access-request.ts
│   │       ├── routes/access-request.ts
│   │       └── services/access-request.ts
│   │
│   ├── extensions/           # Strapi 扩展
│   └── index.ts              # 应用入口
│
├── database/
│   └── migrations/           # 数据库迁移文件
│
├── types/
│   └── generated/            # 自动生成的类型定义
│       ├── components.d.ts
│       └── contentTypes.d.ts
│
├── public/                   # 静态资源
└── package.json
```

---

## 内容类型 (Content Types)

### 1. Space (空间)
**API 标识**: `api::space.space`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键（自增） |
| documentId | string | Strapi 文档 ID（用于 URL） |
| name | string(128) | 空间名称，必填 |
| codeName | string(128) | 空间代号（唯一），必填 |
| creator | string(128) | 创建人 username，必填 |
| icon | string(255) | 图标 URL |
| datasetId | string(255) | 知识库 ID |
| space_type | integer | 空间类型：1=公共空间, 2=个人空间 |
| isDeleted | boolean | 软删除标记，默认 false |
| ctime | datetime | 创建时间 |
| mtime | datetime | 修改时间 |

### 2. SpaceFolder (目录)
**API 标识**: `api::space-folder.space-folder`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键（自增） |
| documentId | string | Strapi 文档 ID |
| spaceId | biginteger | 所属空间 ID |
| parentId | biginteger | 父文件夹 ID（0 为顶级），默认 0 |
| name | string(128) | 文件夹名称，必填 |
| visibilityScope | enum | 可见性：ALL / DEPT_ONLY，默认 ALL |
| order | integer | 排序值，默认 0 |
| isDeleted | boolean | 软删除标记，默认 false |
| ctime | datetime | 创建时间 |
| mtime | datetime | 修改时间 |

### 3. SpaceDept (空间部门映射)
**API 标识**: `api::space-dept.space-dept`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键（自增） |
| documentId | string | Strapi 文档 ID |
| space_id | biginteger | 空间 ID |
| dept_id | biginteger | 部门 ID |
| ctime | datetime | 创建时间 |
| mtime | datetime | 修改时间 |

### 4. Doc (文档)
**API 标识**: `api::doc.doc`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键（自增） |
| documentId | string | Strapi 文档 ID（用于 URL） |
| title | string(128) | 文档标题 |
| content | richtext | 文档内容（HTML/JSON） |
| accessMode | enum | 访问模式：OPEN_EDIT / OPEN_READONLY / WHITELIST_ONLY，默认 OPEN_READONLY |
| owner | string(64) | 创建人 username，必填 |
| tags | string(512) | 标签（逗号分隔） |
| isDeleted | boolean | 软删除标记，默认 false |
| ctime | datetime | 创建时间 |
| mtime | datetime | 修改时间 |

> **注意**: 文档不再直接存储 spaceId/folderId，通过 `doc_folder` 表关联

### 5. DocFolder (文档文件夹关联)
**API 标识**: `api::doc-folder.doc-folder`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键（自增） |
| documentId | string | Strapi 文档 ID |
| doc_id | biginteger | 文档 ID |
| space_id | biginteger | 空间 ID |
| ctime | datetime | 创建时间 |
| mtime | datetime | 修改时间 |

> **说明**: 解耦文档与空间的直接关联，支持文档多空间绑定

### 6. Comment (评论)
**API 标识**: `api::comment.comment`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键（自增） |
| documentId | string | Strapi 文档 ID |
| docId | biginteger | 所属文档 ID，必填 |
| parentId | biginteger | 父评论 ID（0 为顶级评论），默认 0 |
| username | string(128) | 评论者，必填 |
| content | text | 评论内容 |
| isDeleted | boolean | 软删除标记，默认 false |
| ctime | datetime | 创建时间 |
| mtime | datetime | 修改时间 |

### 7. UserSpaceAuth (空间授权)
**API 标识**: `api::user-space-auth.user-space-auth`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键（自增） |
| documentId | string | Strapi 文档 ID |
| spaceId | biginteger | 空间 ID，必填 |
| username | string(128) | 用户名，必填 |
| canRead | boolean | 读取权限，默认 true |
| canCreateFolder | boolean | 创建文件夹权限，默认 false |
| canCreateDoc | boolean | 创建文档权限，默认 false |
| superAdmin | boolean | 超级管理员权限，默认 false |
| source | enum | 来源：AUTO_INIT / MANUAL，默认 MANUAL |
| ctime | datetime | 创建时间 |
| mtime | datetime | 修改时间 |

### 8. DocUserAcl (文档用户权限)
**API 标识**: `api::doc-user-acl.doc-user-acl`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键（自增） |
| documentId | string | Strapi 文档 ID |
| docId | biginteger | 文档 ID，必填 |
| username | string(128) | 用户名，必填 |
| perm | enum | 权限：READ / EDIT，必填 |
| ctime | datetime | 创建时间 |
| mtime | datetime | 修改时间 |

### 9. DocSpaceAcl (文档空间绑定)
**API 标识**: `api::doc-space-acl.doc-space-acl`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键（自增） |
| documentId | string | Strapi 文档 ID |
| docId | biginteger | 文档 ID，必填 |
| spaceId | biginteger | 空间 ID，必填 |
| perm | enum | 权限：READ / EDIT，必填 |
| ctime | datetime | 创建时间 |
| mtime | datetime | 修改时间 |

> **注意**: 移除了 folderId 字段，文件夹关联通过 `doc_folder` 表管理

### 10. DocUserActivity (用户行为)
**API 标识**: `api::doc-user-activity.doc-user-activity`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键（自增） |
| documentId | string | Strapi 文档 ID |
| docId | biginteger | 文档 ID，必填 |
| username | string(64) | 用户名，必填 |
| lastViewedAt | datetime | 最后访问时间 |
| visitCount | integer | 访问次数，默认 0 |
| lastEditedAt | datetime | 最后编辑时间 |
| ctime | datetime | 创建时间 |
| mtime | datetime | 修改时间 |

### 11. AccessRequest (访问申请)
**API 标识**: `api::access-request.access-request`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键（自增） |
| documentId | string | Strapi 文档 ID |
| type | enum | 申请类型：SPACE / DOC，必填 |
| targetId | biginteger | 目标 ID（空间 ID 或文档 ID），必填 |
| username | string(128) | 申请人，必填 |
| requestedPerm | string(64) | 申请的权限 |
| reason | text | 申请理由 |
| status | enum | 状态：PENDING / APPROVED / REJECTED，默认 PENDING |
| reviewedBy | string(128) | 审核人 |
| reviewedAt | datetime | 审核时间 |
| ctime | datetime | 创建时间 |
| mtime | datetime | 修改时间 |

---

## REST API 端点

Strapi 自动生成标准 REST API，所有接口均需携带 API Token 认证。

### 认证方式
```
Authorization: Bearer <API_TOKEN>
```

### 基础端点格式

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/{plural}` | 获取列表 |
| GET | `/api/{plural}/:documentId` | 获取单条记录 |
| POST | `/api/{plural}` | 创建记录 |
| PUT | `/api/{plural}/:documentId` | 更新记录 |
| DELETE | `/api/{plural}/:documentId` | 删除记录 |

### 各内容类型端点

| 内容类型 | 端点前缀 | 说明 |
|----------|----------|------|
| Space | `/api/spaces` | 空间 |
| SpaceFolder | `/api/space-folders` | 目录 |
| SpaceDept | `/api/space-depts` | 空间部门映射 |
| Doc | `/api/docs` | 文档 |
| DocFolder | `/api/doc-folders` | 文档文件夹关联 |
| Comment | `/api/comments` | 评论 |
| UserSpaceAuth | `/api/user-space-auths` | 空间授权 |
| DocUserAcl | `/api/doc-user-acls` | 文档用户权限 |
| DocSpaceAcl | `/api/doc-space-acls` | 文档空间权限 |
| DocUserActivity | `/api/doc-user-activities` | 用户行为 |
| AccessRequest | `/api/access-requests` | 访问申请 |

### ID 规范

```
URL 参数使用 documentId（Strapi 自动生成的字符串 ID）
其他场景使用自增的 id 字段
```

### 查询参数

Strapi v5 使用标准查询参数进行过滤、排序、分页：

```bash
# 过滤
?filters[field][$eq]=value
?filters[field][$contains]=keyword

# 排序
?sort=field:asc
?sort=field:desc

# 分页
?pagination[page]=1
?pagination[pageSize]=20

# 字段选择
?fields[0]=name&fields[1]=codeName

# 关联查询
?populate=*
?populate[relation][fields][0]=name
```

### 复合查询示例

```bash
# 获取某空间下未删除的文件夹，按排序值升序
GET /api/space-folders?filters[spaceId][$eq]=1&filters[isDeleted][$eq]=false&sort=order:asc

# 获取某用户在某空间的权限
GET /api/user-space-auths?filters[spaceId][$eq]=1&filters[username][$eq]=zhangsan

# 获取文档及关联的空间信息
GET /api/doc-folders?filters[doc_id][$eq]=123

# 获取待审批的访问申请
GET /api/access-requests?filters[status][$eq]=PENDING&filters[type][$eq]=DOC
```

---

## 请求/响应格式

### 成功响应 (单条)
```json
{
  "data": {
    "id": 1,
    "documentId": "abc123xyz",
    "name": "技术空间",
    "codeName": "tech",
    "creator": "admin",
    "space_type": 1,
    "ctime": "2024-01-01T00:00:00.000Z",
    "mtime": "2024-01-01T00:00:00.000Z"
  },
  "meta": {}
}
```

### 成功响应 (列表)
```json
{
  "data": [
    {
      "id": 1,
      "documentId": "abc123xyz",
      "name": "技术空间",
      ...
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "pageCount": 5,
      "total": 100
    }
  }
}
```

### 错误响应
```json
{
  "data": null,
  "error": {
    "status": 400,
    "name": "ValidationError",
    "message": "Missing required field",
    "details": {}
  }
}
```

### 状态码说明
| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证（Token 无效） |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 配置说明

### 数据库配置
**文件**: `config/database.ts`


### 服务器配置
**文件**: `config/server.ts`

```typescript
export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_URL', 'http://localhost:1337'),
  app: {
    keys: env.array('APP_KEYS'),
  },
});
```

### API 配置
**文件**: `config/api.ts`

```typescript
export default {
  rest: {
    defaultLimit: 25,
    maxLimit: 100,
    withCount: true,
  },
};
```

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| HOST | 服务监听地址 | 0.0.0.0 |
| PORT | 服务端口 | 1337 |
| DATABASE_HOST | 数据库地址 | localhost |
| DATABASE_PORT | 数据库端口 | 15001 |
| DATABASE_NAME | 数据库名称 | strapi |
| DATABASE_USERNAME | 数据库用户名 | - |
| DATABASE_PASSWORD | 数据库密码 | - |
| APP_KEYS | 应用密钥（逗号分隔） | - |
| API_TOKEN_SALT | API Token 盐值 | - |
| ADMIN_JWT_SECRET | 管理面板 JWT 密钥 | - |
| JWT_SECRET | JWT 密钥 | - |

---

## 软删除机制

部分内容类型采用软删除策略：

**支持软删除的表**：
- space
- space_folder
- doc
- comment

**不使用软删除的表**（直接删除）：
- space_dept
- doc_folder
- user_space_auth
- doc_user_acl
- doc_space_acl
- doc_user_activity
- access_request

**软删除规则**：
- **字段**: `isDeleted` (boolean, 默认 false)
- **删除操作**: 将 `isDeleted` 设为 true，而非物理删除
- **查询约定**: docs-api 调用时需显式过滤 `filters[isDeleted][$eq]=false`

---

## 与 docs-api 的集成

### 调用方式

docs-api 通过 `strapiService` 封装调用 Strapi REST API：

```typescript
// docs-api/src/services/strapi.ts
import axios from 'axios';
import { config } from '../app-config';

const strapiClient = axios.create({
  baseURL: config.strapi.baseUrl,
  headers: {
    Authorization: `Bearer ${config.strapi.apiToken}`,
    'Content-Type': 'application/json',
  },
});

// 获取空间列表
export async function getSpaces(params?: object) {
  const { data } = await strapiClient.get('/api/spaces', { params });
  return data;
}

// 创建文档
export async function createDoc(payload: object) {
  const { data } = await strapiClient.post('/api/docs', { data: payload });
  return data;
}
```

### 数据流向

```
┌─────────────────────────────────────────────────────────────┐
│  docs-api (BFF 层)                                          │
│  - 业务逻辑组装                                              │
│  - 权限验证                                                  │
│  - 多表查询聚合                                              │
├─────────────────────────────────────────────────────────────┤
│                          ↓ HTTP + Bearer Token               │
├─────────────────────────────────────────────────────────────┤
│  docs-strapi (数据层)  ← 本项目                              │
│  - 数据持久化                                                │
│  - 标准 CRUD                                                 │
│  - 字段验证                                                  │
├─────────────────────────────────────────────────────────────┤
│                          ↓ SQL                               │
├─────────────────────────────────────────────────────────────┤
│  MySQL 8.0+                                                  │
│  - 数据存储                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 开发命令

```bash
# 开发模式（热重载）
pnpm develop

# 生产构建
pnpm build

# 生产启动
pnpm start

# 重新生成类型定义
pnpm strapi ts:generate-types
```

---

## API Token 管理

### 创建 Token

1. 访问管理面板: `http://localhost:1337/admin`
2. 进入 Settings → API Tokens
3. 点击 "Create new API Token"
4. 配置：
   - Name: docs-api-token
   - Token type: Full access 或 Custom
   - 如选 Custom，需为每个内容类型配置读写权限

### Token 类型

| 类型 | 说明 |
|------|------|
| Read-only | 仅读取权限 |
| Full access | 完整 CRUD 权限 |
| Custom | 自定义权限配置 |

---

## 数据模型关系

```
Space (空间)
  ├── space_type: 1=公共空间, 2=个人空间
  │
  ├── SpaceFolder (目录) [1:N, spaceId]
  │
  ├── SpaceDept (部门映射) [1:N, space_id]
  │     └── 用于自动授权同部门用户
  │
  ├── UserSpaceAuth (空间授权) [1:N, spaceId]
  │     └── 控制 canRead, canCreateFolder, canCreateDoc, superAdmin
  │
  └── DocSpaceAcl (文档空间绑定) [1:N, spaceId]
        └── 控制跨空间文档的权限 (READ/EDIT)

Doc (文档)
  ├── DocFolder (文件夹关联) [1:N, doc_id]
  │     └── 关联 space_id，支持多空间绑定
  │
  ├── Comment (评论) [1:N, docId]
  │     └── 支持嵌套回复 (parentId)
  │
  ├── DocUserAcl (用户权限) [1:N, docId]
  │     └── 白名单权限 (READ/EDIT)
  │
  ├── DocSpaceAcl (空间绑定) [1:N, docId]
  │     └── 跨空间绑定权限
  │
  └── DocUserActivity (用户行为) [1:N, docId]
        └── 访问记录 (lastViewedAt, visitCount, lastEditedAt)

AccessRequest (访问申请)
  ├── type: SPACE / DOC
  ├── targetId: 空间ID 或 文档ID
  └── status: PENDING / APPROVED / REJECTED
```

---

## 系统架构关系

```
┌─────────────────────────────────────────────────────────────┐
│  docs-web (前端)                                             │
│  http://localhost:8082                                       │
├─────────────────────────────────────────────────────────────┤
│                          ↓ API 调用                          │
├─────────────────────────────────────────────────────────────┤
│  docs-api (BFF 层)                                           │
│  http://localhost:3001                                       │
│  - 业务逻辑处理                                               │
│  - 权限验证                                                   │
│  - 请求聚合                                                   │
├─────────────────────────────────────────────────────────────┤
│                          ↓ Strapi REST API                   │
├─────────────────────────────────────────────────────────────┤
│  docs-strapi (数据层) ← 本项目                                │
│  http://localhost:1337                                       │
│  - 数据持久化                                                 │
│  - 内容管理                                                   │
│  - 标准化 CRUD API                                           │
├─────────────────────────────────────────────────────────────┤
│                          ↓ SQL                               │
├─────────────────────────────────────────────────────────────┤
│  MySQL 8.0+                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 注意事项

1. **仅供 docs-api 调用**: Strapi 不直接对外暴露，所有外部请求需经过 docs-api 层
2. **Token 安全**: API Token 需妥善保管，不可泄露至前端或版本库
3. **软删除**: 部分表使用软删除，部分表直接删除，需注意区分
4. **字段命名**: Strapi 使用 camelCase，数据库使用 snake_case，Strapi 自动转换
5. **分页限制**: 默认分页 25 条，最大 100 条，防止大数据量查询
6. **类型生成**: 修改 schema 后需重新运行 `pnpm strapi ts:generate-types`
7. **ID 使用**: URL 中使用 documentId，业务关联使用自增 id

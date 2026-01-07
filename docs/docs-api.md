# docs-api 向日葵文档系统

## 项目概述

**docs-api** 是"向日葵文档系统"的后端 REST API 服务层。作为 BFF（Backend for Frontend）层，负责业务逻辑处理、权限验证，并与 Strapi CMS 后端通信进行数据持久化。

- **运行端口**: 3001
- **前端地址**: http://localhost:5173 (docs-web)
- **Strapi 地址**: http://localhost:1337 (docs-strapi)

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Express.js ^4.21.0 |
| 语言 | TypeScript 5.9.3 |
| HTTP 客户端 | Axios ^1.9.0 |
| 参数验证 | Zod ^3.23.8 |
| 配置管理 | config ^4.1.1 |
| 安全 | Helmet ^7.1.0 |
| 日志 | @repo/logger |
| 测试 | Vitest ^2.0.0 |

---

## 目录结构

```
docs-api/
├── src/
│   ├── index.ts                # 应用入口
│   ├── app-config/
│   │   └── index.ts            # 配置加载器
│   ├── controllers/
│   │   ├── space.ts            # 空间管理（包含目录管理）
│   │   ├── document.ts         # 文档管理
│   │   ├── comment.ts          # 评论管理
│   │   └── access-request.ts   # 权限申请处理
│   ├── routes/
│   │   ├── index.ts            # 主路由
│   │   ├── space.ts            # 空间路由
│   │   ├── document.ts         # 文档路由
│   │   └── comment.ts          # 评论路由
│   ├── services/
│   │   ├── strapi.ts           # Strapi API 封装
│   │   └── permission.ts       # 权限检查逻辑
│   ├── middlewares/
│   │   ├── permit.ts           # 认证中间件
│   │   └── errorHandler.ts     # 错误处理
│   ├── types/
│   │   └── index.ts            # 类型定义
│   └── utils/
│       ├── response.ts         # 标准化响应
│       └── logger.ts           # 日志配置
├── config/
│   ├── default.js              # 默认配置
│   ├── local.js                # 本地开发配置
│   └── production.js           # 生产环境配置
└── dist/                       # 编译输出
```

---

## API 端点

### 健康检查
```
GET /health
响应: { status: 'ok', timestamp: '...' }
```
### DELETE 都用软删除

### 空间管理 `/api/spaces`

| 方法 | 路径 | 说明 | 权限要求 |
|------|------|------|----------|
| GET | `/` | 获取空间列表 | 无 |
| GET | `/:spaceId` | 获取空间详情 | read |
| POST | `/` | 创建空间 | 无(创建者成为 superAdmin) |
| PUT | `/:spaceId` | 更新空间 | superAdmin |
| DELETE | `/:spaceId` | 删除空间 | superAdmin |
| GET | `/:spaceId/folders` | 获取文件夹列表 | read |
| GET | `/:spaceId/folders?parentFolderId={parentFolderId}` | 获取某个文件夹列表 | read |

#### 空间成员管理
| 方法 | 路径 | 说明 | 权限要求 |
|------|------|------|----------|
| GET | `/:spaceId/members` | 获取成员列表 | superAdmin |
| POST | `/:spaceId/members` | 批量添加成员(单个也用批量) | superAdmin |
| PUT | `/:spaceId/members` | 更新成员权限 | superAdmin |
| DELETE | `/:spaceId/members` | 移除成员 | superAdmin |

---

### 文档管理 `/api/documents`

| 方法 | 路径 | 说明 | 权限要求 |
|------|------|------|----------|
| GET | `/?spaceId=1111&folderId=111` | 文档列表 | 无 |
| GET | `/tree?spaceId=1111&folderId=111` | 获取文档树(懒加载) | read |
| GET | `/:documentId` | 获取文档详情 | view |
| POST | `/` | 创建文档 | createDoc |
| PUT | `/:documentId` | 更新文档 | edit |
| PUT | `/:documentId/move` | 移动文档, 当前space，参数是folderId | edit |
| DELETE | `/:documentId` | 删除文档 | edit |

#### 文档成员管理
| 方法 | 路径 | 说明 | 权限要求 |
|------|------|------|----------|
| GET | `/:documentId/members` | 获取成员列表 | owner |
| POST | `/:documentId/members` | 批量添加成员(单个也用批量) | owner |
| PUT | `/:documentId/members` | 更新成员权限 | owner |
| DELETE | `/:documentId/members` | 移除成员 | owner |

#### 文档跨空间绑定
| 方法 | 路径 | 说明 | 权限要求 |
|------|------|------|----------|
| GET | `/:documentId/spaces` | 获取绑定的空间 | view |
| POST | `/:documentId/spaces` | 绑定到新空间(folder=0放到根目录，spaceId是原来的等同于当前空间移动目录) | edit |
| DELETE | `/:documentId/spaces/` | 解除绑定，参数spaceId | edit |


### 文档评论管理 `/api/comments`
#### 评论管理
| 方法 | 路径 | 说明 | 权限要求 |
|------|------|------|----------|
| GET | `/:documentId` | 获取文档评论(含回复) | view |
| POST | `/` | 创建评论 | view |
| PUT | `/:commentId` | 更新评论 | author |
| DELETE | `/:commentId` | 删除评论 | author |

---
### 权限申请 `/api/access`

#### 权限申请
| 方法 | 路径 | 说明 | 权限要求 |
|------|------|------|----------|
| POST | `/apply` | type=space空间申请权限,type=doc文档申请权限 | 无 |
| GET | `/pending-requests` | 获取待审批申请(前端全局展示) | superAdmin |
| PUT | `approve` | type=space|doc审批申请 申请通过user_space_auth需要 开放can_read、can_create_folder、can_create_doc | superAdmin |

---


## 认证与授权

### 认证机制
```
请求 → Cookie(_AJSESSIONID) → Dashboard 服务验证 → 用户信息
```

- 通过 `_AJSESSIONID` Cookie 进行会话认证
- 与外部 Dashboard 服务 (http://dashboard-mng.bilibili.co) 验证
- 使用 MD5 签名请求（caller, session_id, timestamp）
- 返回用户信息：username, department, deptId
```ts
import type { Response, NextFunction } from 'express';
import axios from 'axios';
import md5 from 'md5';
import { config } from '../app-config/index';
import { logger } from '../utils/logger.js';
import { unauthorized } from '../utils/response.js';
import type { AuthenticatedRequest } from '../types/index.js';

interface VerifyResponse {
  code: number;
  username: string;
  department?: string;
  dept_id?: string;
}

/**
 * 用户认证中间件
 * 从 Cookie 中获取 session，调用 Dashboard 验证接口
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // 开发/测试环境跳过认证
  // if (config.env === 'development' || config.env === 'test') {
  //   const mockUsername = req.cookies?.username || 'dev_user';
  //   req.user = {
  //     username: mockUsername,
  //     department: '技术中心',
  //     deptId: '1001',
  //   };
  //   logger.debug(`[Auth] Dev mode, using mock user: ${mockUsername}`);
  //   return next();
  // }

  try {
    const { caller, apikey } = config.dashboard;
    const sessionId = req.cookies?._AJSESSIONID;

    if (!sessionId) {
      logger.warn('[Auth] Missing session cookie');
      return unauthorized(res, '请先登录');
    }

    const ts = Date.now();
    const sign = md5(`caller=${caller}&session_id=${sessionId}&ts=${ts}${apikey}`);
    const url = `http://dashboard-mng.bilibili.co/api/session/verify?ts=${ts}&caller=${caller}&session_id=${sessionId}&sign=${sign}`;

    const { data, status } = await axios.get<VerifyResponse>(url, {
      timeout: 5000,
    });

    if (status === 200 && data.code === 0) {
      req.user = {
        username: data.username,
        department: data.department,
        deptId: data.dept_id,
      };
      logger.debug(`[Auth] User verified: ${data.username}`);
      return next();
    }

    logger.warn(`[Auth] Verify failed: ${JSON.stringify(data)}`);
    return unauthorized(res, '登录已过期，请重新登录');
  } catch (error) {
    logger.error('[Auth] Verify error:', error);
    return unauthorized(res, '认证服务异常');
  }
}

```
### 权限体系

#### 空间级权限 (user_space_auth)
| 权限 | 说明 |
|------|------|
| read | 查看空间（默认所有用户） |
| createFolder | 创建文件夹 |
| createDoc | 创建文档 |
| superAdmin | 空间管理员（成员、权限管理） |

#### 文档访问模式
| 模式 | 说明 |
|------|------|
| OPEN_EDIT | 所有人可编辑 |
| OPEN_READONLY | doc_user_acl.perm=EDIT或owner可编辑，其他人只读 |
| WHITELIST_ONLY | 私密文档，需要判断doc_user_acl.perm |
注意：优先判断super_admin

#### 文档级权限 (doc_user_acl)
| 权限 | 说明 |
|------|------|
| READ | 只读访问 |
| EDIT | 读写访问 |

### 权限判断逻辑
```
空间权限:
  检查 user_space_auth 记录
  同部门用户自动初始化权限 space_dept(可不具体实现，预留空方法)

文档读取:
  非白名单文档 → 所有人可读
  白名单文档 → 需要 doc_user_acl 记录或 owner/super_admin 身份

文档编辑:
  OPEN_EDIT → 所有人可编辑
  OPEN_READONLY → doc_user_acl.perm EDIT 权限 or super_admin or owner
  WHITELIST_ONLY → doc_user_acl.perm EDIT 权限 or super_admin or owner
```

---

## 请求/响应格式

### 成功响应
```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

### 分页响应
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

### 错误响应
```json
{
  "code": 400|401|403|404|500,
  "message": "错误信息"
}
```

### 响应码说明
| 码 | 说明 |
|------|------|
| 0 | 成功 |
| 400 | 请求参数错误（验证失败） |
| 401 | 未认证（认证失败） |
| 403 | 无权限（权限不足） |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 配置说明

### 配置结构
```typescript
{
  port: 3001,
  env: 'development' | 'production',
  dashboard: {
    caller: 'mlive',
    apikey: '70f1b6f...'  // Dashboard API 验证
  },
  strapi: {
    baseUrl: 'http://localhost:1337',
    apiToken: '4576229d...'  // Strapi API Token
  },
  corsOrigins: ['http://localhost:5173']
}
```

### 环境变量
| 变量 | 说明 |
|------|------|
| STRAPI_URL | Strapi 服务地址 |
| STRAPI_API_TOKEN | Strapi API Token |
| NODE_ENV | 运行环境 |

---
## 数据模型
参考：/Users/hubo/Work/Coding/MyProject/app-nodejs/docs/docs-sql.md
---

## 请求处理流程

```
┌──────────────────────────────────────────────────────────────┐
│  1. 认证                                                      │
│     请求 → _AJSESSIONID Cookie → Dashboard 验证 → 用户信息     │
├──────────────────────────────────────────────────────────────┤
│  2. 路由匹配                                                   │
│     Express Router → Controller                               │
├──────────────────────────────────────────────────────────────┤
│  3. 权限检查                                                   │
│     Controller → permissionService → 空间/文档权限验证         │
├──────────────────────────────────────────────────────────────┤
│  4. 参数验证                                                   │
│     Zod Schema → 验证请求体 → 400 错误或继续                   │
├──────────────────────────────────────────────────────────────┤
│  5. 数据访问                                                   │
│     Controller → strapiService → Strapi REST API              │
├──────────────────────────────────────────────────────────────┤
│  6. 响应                                                       │
│     成功: 标准化响应 / 错误: errorHandler 中间件处理            │
└──────────────────────────────────────────────────────────────┘
```

---

## 核心功能

### 1. 基于角色的访问控制 (RBAC)
- 空间级别：read, createFolder, createDoc, superAdmin
- 文档级别：READ, EDIT

### 2. 权限申请工作流
```
用户申请 → pending → 管理员审批 → approved/rejected
                         ↓
                  可重新提交申请
```

### 3. 多空间文档
- 文档可绑定到多个空间
- 主空间标记
- 每个空间可指定不同文件夹

### 4. 层级组织
- 空间包含文件夹
- 文件夹包含文档和子文件夹
- 支持嵌套结构

### 5. 嵌套评论
- 支持回复（父子关系）
- 前端load more 模式

### 6. 活动追踪
- 最后查看时间
- 访问次数
- 最后编辑时间

---

## 安全特性

- **Helmet.js**: HTTP 安全头
- **会话认证**: 外部 Dashboard 服务验证
- **权限检查**: 每个操作都进行权限验证
- **输入验证**: Zod Schema 验证
- **CORS 配置**: 限制跨域来源
- **请求压缩**: gzip 压缩
- **错误处理**: 不暴露内部错误详情

---

## 系统架构关系

```
┌─────────────────────────────────────────────────────────────┐
│  docs-web (前端)                                             │
│  http://localhost:5173                                       │
├─────────────────────────────────────────────────────────────┤
│                          ↓ API 调用                          │
├─────────────────────────────────────────────────────────────┤
│  docs-api (BFF 层)  ← 本项目                                  │
│  http://localhost:3001                                       │
│  - 业务逻辑处理                                               │
│  - 权限验证                                                   │
│  - 请求聚合                                                   │
├─────────────────────────────────────────────────────────────┤
│                          ↓ Strapi REST API                   │
├─────────────────────────────────────────────────────────────┤
│  docs-strapi (数据层)                                         │
│  http://localhost:1337                                       │
│  - 数据持久化                                                 │
│  - 内容管理                                                   │
└─────────────────────────────────────────────────────────────┘
```

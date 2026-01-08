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
| 框架 | Express.js ^5.2.1 |
| 语言 | TypeScript 5.9.3 |
| HTTP 客户端 | Axios ^1.9.0 |
| 参数验证 | Zod ^3.23.8 |
| 配置管理 | config ^4.1.1 |
| 安全 | Helmet ^7.1.0 |
| 日志 | @repo/logger |
| 测试 | Vitest ^2.0.0 |
| 工具函数 ｜ lodash ^4.17.21 |
｜实时文档编辑｜   "y-protocols": "^1.0.7",  "y-websocket": "^3.0.0", "yjs": "^13.6.28" ｜
---

## 目录结构

```
docs-api/

├── src/
│   ├── index.ts                # 应用入口
│   ├── app-config/
│   │   └── index.ts            # 配置加载器
│   ├── controllers/
│   │   ├── space/
│   │   │   └── index.ts            # 空间管理
│   │   ├── space-folder/
│   │   │   └── index.ts            # 空间目录管理
│   │   ├── document/
│   │   │   └── index.ts            # 文档管理
│   │   ├── comment/
│   │   │   └── index.ts            # 评论管理
│   │   └── access-request/
│   │       └── index.ts            # 权限申请处理
│   ├── entities/                   # typeORM，参考 apps/docs-strapi/src/api 创建 entity
│   ├── routes/                     # 路由聚合（可按 controller 目录分发）
│   │   ├── space/
│   │   │   └── index.ts            # 空间管理
│   │   ├── space-folder/
│   │   │   └── index.ts            # 空间目录管理
│   │   ├── document/
│   │   │   └── index.ts            # 文档管理
│   │   ├── comment/
│   │   │   └── index.ts            # 评论管理
│   │   ├── access-request/
│   │   │   └── index.ts            # 权限申请处理
│   │   └── index.ts            # 主路由
│   ├── services/
│   ├── schemas/                # zod的schema，参数校验
│   │   ├── strapi.ts           # Strapi API 封装
│   │   └── permission.ts       # 权限检查逻辑
│   ├── middlewares/
│   │   ├── permit.ts           # 认证中间件
│   │   └── errorHandler.ts     # 错误处理
│   ├── websocket/              # WSSharedDoc ws auth
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
### id规范
```
space_id,doc_id get/post接口使用documentId(strapi自动生成的)
其他还是保持使用自增的id字段
```
### 空间管理 `/api/spaces` (DELETE 都用软删除, 查询时需要filter isDeleted)

| 方法 | 路径 | 说明 | 权限要求 |
|------|------|------|----------|
| GET | `/` | 获取社区空间列表(需要返回总文档数，最近一次文档更新时间) |  登录用户 |
| GET | `/personal` | 个人空间 | creator (Space.space_type = 2)(需要返回总文档数，最近一次文档更新时间) |
| GET | `/joined` | 获取我参与的空间列表(我在 user-space-auth 里)(需要返回总文档数，最近一次文档更新时间) | 登录用户 |
| GET | `/:spaceId` | 获取空间详情 | read |
| POST | `/` | 创建空间 | 无(创建者成为 superAdmin) |
| PUT | `/:spaceId` | 更新空间 | superAdmin |
| DELETE | `/:spaceId` | 删除空间 | superAdmin |
| GET | `/:spaceId/folders` | 获取文件夹列表 | read |
| GET | `/:spaceId/folders?parentFolderId={parentFolderId}` | 获取某个文件夹列表 | read |
| POST | `/sync-from-space-dept` | 用户登录/首页加载时，根据 `req.user.deptId` 查 `space_dept`，为匹配的空间批量 upsert `user_space_auth`（`canRead=1`、`canCreateFolder=1`、`canCreateDoc=1`） | 登录用户

#### 空间成员管理 (DELETE 正常删除) user_space_auth

| 方法 | 路径 | 说明 | 权限要求 |
|------|------|------|----------|
| GET | `/:spaceId/members` | 获取成员列表 | superAdmin |
| POST | `/:spaceId/members` | 批量添加成员(单个也用批量) | superAdmin |
| PUT | `/:spaceId/members/:username` | 更新成员权限(都是单个即时操作) | superAdmin |
| DELETE | `/:spaceId/members/:username` | 移除成员 | superAdmin |

---

### 目录管理 `/api/space-folder`

目录模块负责统一处理 `space_folder.visibility_scope`（目录可见性）与“按目录浏览内容”（文档列表/树），避免在文档模块中散落过滤逻辑导致信息泄露。

| 方法 | 路径 | 说明 | 权限要求 |
|------|------|------|----------|
| GET | `/documents?spaceId=1111&folderId=111` | 获取目录下的文档列表（同时返回文档 perm；只返回可见目录下的文档） | read |
| GET | `/tree?spaceId=1111&folderId=111` | 获取目录下文档树（懒加载；同时返回文档 perm；只返回可见节点） | read |

#### 目录可见性（space_folder.visibility_scope）
| 值 | 说明 |
|------|------|
| ALL | 对当前空间内“所有可读用户”可见 |
| DEPT_ONLY | 仅当用户在该空间存在 `user_space_auth` 记录时可见 |

#### 过滤与返回策略（关键：防止泄露）
1. 目录列表/树/文档列表在返回前必须先做目录可见性过滤：不可见目录及其子孙节点（folders/docs）都不能出现在返回结果中。
2. 若请求的 `folderId` 本身不可见：
  - 推荐直接返回 403（或按产品策略返回 404 以隐藏存在性），不要返回“空列表”。
3. 文档在目录列表都可见，但内容详情需要判断权限

---

### 文档管理 `/api/documents` (DELETE 都用软删除, 查询时需要filter isDeleted)

| 方法 | 路径 | 说明 | 权限要求 |
|------|------|------|----------|
| PUT | `/move/:documentId` | 移动文档, 当前space，参数是folderId | edit |
| GET | `/:documentId` | 获取文档详情 | read |
| GET | `/:documentId?shareCode=abc123` | 通过分享码读取文档（只读：不落库、不修改 ACL） | 需要登录（或按产品策略允许匿名） |
| POST | `/:documentId/share/accept` | 接受分享并写入 `doc_user_acl`（读写分离：显式授予 READ/EDIT，或由分享码类型决定） | 需要登录 |
| POST | `/` | 创建文档 | createDoc |
| PUT | `/:documentId` | 更新文档 | edit |
| DELETE | `/:documentId` | 删除文档 | edit |

编辑权限示例
1.access_mode=OPEN_EDIT，那不判断doc_user_acl和doc_space_acl
2.access_mode=OPEN_READONLY，判断doc_user_acl里username是否可编辑 or 判断doc_space_acl是否可编辑
3.access_mode=WHITELIST_ONLY，判断doc_user_acl里username的perm是否>read(也就是EDIT)，判断doc_space_acl里space是否大于read，否则403
view示例：
1.access_mode=OPEN_EDIT
2.access_mode=OPEN_READONLY
3.access_mode=WHITELIST_ONLY doc_user_acl.perm=read or doc_space_acl.perm=read

#### 文档成员管理 (doc_user_acl)(DELETE 正常删除)
| 方法 | 路径 | 说明 | 权限要求 |
|------|------|------|----------|
| GET | `/:documentId/members` | 获取成员列表 | owner/superAdmin |
| POST | `/:documentId/members` | 批量添加成员(单个也用批量) | owner/superAdmin |
| PUT | `/:documentId/members/:username` | 更新成员权限 | owner/superAdmin |
| DELETE | `/:documentId/members/:username` | 移除成员 | owner/superAdmin |

#### 文档跨空间绑定 (doc_space_acl)(DELETE 正常删除)
| 方法 | 路径 | 说明 | 权限要求 |
|------|------|------|----------|
| GET | `/:documentId/spaces` | 获取绑定的空间 | owner/superAdmin |
| POST | `/:documentId/spaces` | 绑定到新空间(folderId=0放到根目录) | owner/superAdmin |
| DELETE | `/:documentId/spaces/:spaceId` | 解除与指定空间的绑定 | owner/superAdmin |


### 文档评论管理 `/api/comments`(DELETE 正常删除)
#### 评论管理
| 方法 | 路径 | 说明 | 权限要求 |
|------|------|------|----------|
| GET | `/:documentId` | 获取文档评论(含回复) | read |
| POST | `/` | 创建评论 | read  |
| PUT | `/:commentId` | 更新评论 | author |
| DELETE | `/:commentId` | 删除评论 | author/superAdmin |

---
### 权限申请 `/api/access`

#### 权限申请
| 方法 | 路径 | 说明 | 权限要求 |
|------|------|------|----------|
| POST | `/apply` | type=doc文档申请权限 | 无 |
| GET | `/pending-requests` | 获取待审批申请(前端全局展示) | 审批人是doc作者 |
| PUT | `approve` | type=doc 新增 doc_user_acl | 审批人是doc作者 |

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
import { config } from '../app-config/index.js';
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
  // 开发/测试环境可跳过认证（取消注释以启用）
  if (config.env === 'development' || config.env === 'test') {
    const mockUsername = req.cookies?.username || 'dev_user';
    req.user = {
      username: mockUsername,
      department: '技术中心',
      deptId: '1001',
    };
    logger.debug(`[Auth] Dev mode, using mock user: ${mockUsername}`);
    return next();
  }

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
| read | 查看空间（默认=1, 所有人都可以访问） |
| createFolder | 创建文件夹 |
| createDoc | 创建文档 |
| superAdmin | 空间管理员（成员、权限管理、文档、目录） |

用户访问space时能获取到dept_id, 去space_dept表获取，把匹配上的space都添加到user_space_auth，表示同一个部门的space都赋予createFolder + createDoc权限

案例：（can_read用于访问限制+返回列表时是否出现在列表中）
个人空间can_read权限：仅自己访问
社区空间can_read权限：全员可读
createFolder + createDoc权限：用户进去space，判断user_space_auth

#### 文档访问模式
| 模式 | 说明 |
|------|------|
| OPEN_EDIT | 所有人可编辑 |
| OPEN_READONLY | doc_space_acl.perm/doc_user_acl.perm=EDIT或owner可编辑，其他人只读 |
| WHITELIST_ONLY | 私密文档，需要判断doc_user_acl.perm |
注意：优先判断super_admin

#### 文档级权限 (doc_user_acl)
| 权限 | 说明 |
|------|------|
| READ | 只读访问 |
| EDIT | 读写访问 |
#### 空间文档权限 (doc_space_acl) 先判断是否在 user_space_auth 在判断 doc_space_acl.perm
| 权限 | 说明 |
|------|------|
| READ | 只读访问 |
| EDIT | 读写访问 |

#### 目录可见性（space_folder.visibility_scope）
目录可见性规则与过滤策略统一由 `/api/space-folder` 模块负责（目录列表/文档列表/树必须先过滤再返回），避免泄露不可见目录下的文档元信息。

### 权限判断逻辑
```
空间权限:
  访问：个人空间自己能访问、社区空间所有人都能访问
  创建文档、创建目录权限：检查 user_space_auth 记录
  space是谁创建的，谁就是admin，且根据创建者的dept_id写入到space_dept
  同部门用户自动初始化权限 根据space_dept写入user_space_auth，并给can_read=1、can_create_folder=1、can_create_doc=1
get api-mlive.bilibili.co/base/oa/user
{
    "code": 0,
    "data": {
        "name": "dev_user",
        "login_id": "dev_user",
        "nick_name": "开发用户",
        "manager": "admin",
        "dept_id": -11876,
        "department_name": "用户技术中心-生态技术部-前端技术部",
        "avatar": "https://wework.qpic.cn/wwpic3az/133033_IdTkFyx1STGoRjd_1707475541/0",
        "workcode": "021366",
        "other_group": 1
    },
    "message": ""
}
目录获取：
  统一走 `/api/space-folder` 的过滤逻辑：
    - visibility_scope=ALL：可直接下发
    - visibility_scope=DEPT_ONLY：仅 user_space_auth 有记录才可见
目录创建
  user_space_auth.can_create_folder=1
文档读取:
  access_mode!=WHITELIST_ONLY → 所有登录用户
  access_mode=WHITELIST_ONLY → 需要 doc_user_acl 记录或 owner/super_admin 身份 或 doc_space_acl.perm READ+user_space_auth有记录
  注意：文档没有read权限，需要在返回文档列表/tree时体现
文档编辑:
  OPEN_EDIT → 所有人可编辑
  OPEN_READONLY → doc_user_acl.perm EDIT 权限 or super_admin or owner or doc_space_acl.perm EDIT+user_space_auth有记录
  WHITELIST_ONLY → doc_user_acl.perm EDIT 权限 or super_admin or owner or doc_space_acl.perm EDIT+user_space_auth有记录
文档创建：
  user_space_auth.can_create_doc = 1 or super_admin
```
注意：
1.用户访问首页时，需要根据space_dept批量添加 user_space_auth
2.用户访问分享链接不自动写入 doc_user_acl；需要显式调用 `POST /api/documents/:documentId/share/accept`
---
### mock用户（用于调试权限）
```ts
// Mock 用户列表 (仅开发环境)
const MOCK_USERS = [
  {
    name: 'dev_user',
    login_id: 'dev_user',
    nick_name: '开发用户',
    manager: 'admin',
    dept_id: 1001,
    department_name: '技术中心',
    avatar: '',
    workcode: '000001',
    other_group: 0,
  },
  {
    name: 'test_admin',
    login_id: 'test_admin',
    nick_name: '测试管理员',
    manager: 'admin',
    dept_id: 1001,
    department_name: '技术中心',
    avatar: '',
    workcode: '000002',
    other_group: 0,
  },
  {
    name: 'test_user',
    login_id: 'test_user',
    nick_name: '测试用户',
    manager: 'test_admin',
    dept_id: 1002,
    department_name: '产品中心',
    avatar: '',
    workcode: '000003',
    other_group: 0,
  },
];
```
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
  }
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

### 6. 活动追踪(doc_user_activity
)
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
│  - 请求聚合(查询类的请求不经过strapi，直接使用typeORM自连数据库， 其他走strapi) │
├─────────────────────────────────────────────────────────────┤
│                          ↓ Strapi REST API                   │
├─────────────────────────────────────────────────────────────┤
│  docs-strapi (数据层)                                         │
│  http://localhost:1337                                       │
│  - 数据持久化                                                 │
│  - 内容管理                                                   │
└─────────────────────────────────────────────────────────────┘
```

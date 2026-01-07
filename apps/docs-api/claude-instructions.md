# Claude Instructions - docs-api

## 项目概述

docs-api 是向日葵文档系统的后端 API 服务，作为 BFF（Backend for Frontend）层，连接前端应用与 Strapi CMS，并提供实时协作编辑功能。

## 技术栈

- **运行时**: Node.js >= 18.0.0
- **框架**: Express.js 4.x
- **语言**: TypeScript 5.x (ES2022, ESNext 模块)
- **实时协作**: Yjs + y-websocket (CRDT 协同编辑)
- **HTTP 客户端**: Axios (与 Strapi 通信)
- **验证**: Zod (请求参数校验)
- **认证**: JWT + Session
- **安全**: helmet, cors, compression

## 项目结构

```
docs-api/
├── src/
│   ├── index.ts              # 服务器入口，中间件配置
│   ├── app-config/           # 配置管理
│   ├── controllers/          # 控制器层 (业务逻辑入口)
│   │   ├── document.ts       # 文档 CRUD 和成员管理
│   │   ├── space.ts          # 空间和文件夹管理
│   │   ├── comment.ts        # 评论管理
│   │   ├── access-request.ts # 访问请求工作流
│   │   └── user.ts           # 用户相关
│   ├── routes/               # 路由定义
│   ├── services/             # 服务层
│   │   ├── strapi.ts         # Strapi API 封装
│   │   └── permission.ts     # 权限/授权逻辑
│   ├── middlewares/          # 中间件
│   │   ├── permit.ts         # JWT/Session 认证
│   │   └── errorHandler.ts   # 全局错误处理
│   ├── utils/                # 工具函数
│   ├── types/                # TypeScript 类型定义
│   └── websocket/            # WebSocket 服务 (Yjs 协作)
├── config/                   # 环境配置文件
└── dist/                     # 编译输出
```

## 开发命令

```bash
npm run dev      # 开发模式 (tsx watch 热重载)
npm run build    # 编译 TypeScript
npm start        # 运行编译后的代码
npm run lint     # ESLint 检查
```

## 核心模式

### 1. 控制器模式

控制器负责：
1. 使用 Zod 校验请求参数
2. 调用权限服务检查授权
3. 调用 Strapi 服务执行业务
4. 返回标准化响应

```typescript
// 示例流程
async function createDoc(req: AuthenticatedRequest, res: Response) {
  const validated = createDocSchema.parse(req.body);  // 1. 验证
  const canCreate = await canCreateDoc(spaceId, user); // 2. 权限
  const doc = await strapiService.createDoc(data);     // 3. 业务
  return success(res, doc);                            // 4. 响应
}
```

### 2. 响应格式

```typescript
// 成功
{ code: 0, message: "success", data: {...} }

// 分页
{ code: 0, message: "success", data: { list: [], total: 10, page: 1, pageSize: 20 } }

// 错误
{ code: 400|401|403|404|500, message: "错误描述" }
```

### 3. 权限模型

**空间级别**:
- `read`: 可查看空间
- `canCreateFolder`: 可创建文件夹
- `canCreateDoc`: 可创建文档
- `superAdmin`: 超级管理员

**文档级别** (accessMode):
- `OPEN_EDIT`: 所有人可编辑
- `OPEN_READONLY`: 所有人只读
- `WHITELIST_ONLY`: 仅白名单用户

### 4. 软删除

所有删除操作设置 `isDeleted: true`，不执行物理删除。

## API 路由

```
/api/spaces/*        # 空间管理
/api/documents/*     # 文档 CRUD
/api/comments/*      # 评论
/api/access/*        # 访问请求
/api/user/*          # 用户信息
/api/collaboration/* # 协作功能
/ws/collab           # WebSocket 实时编辑
/health              # 健康检查 (无需认证)
```

## 重要注意事项

1. **路由顺序**: 静态路由 (如 `/recent`) 必须在参数路由 (`:documentId`) 之前定义
2. **ID 类型**: Strapi 返回 bigInteger 为字符串，代码中需转换为 number
3. **开发模式**: 跳过 Dashboard 认证，使用 mock 用户
4. **WebSocket**: 独立于 REST API，使用 Yjs 处理实时协作
5. **配置优先级**: 环境变量 > config/production.js > config/default.js > config/local.js

## 配置

使用 `config` 库管理配置，主要环境变量：
- `STRAPI_URL`: Strapi 服务地址
- `STRAPI_API_TOKEN`: Strapi API Token

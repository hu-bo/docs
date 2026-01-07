# Strapi 二次开发最佳实践文档

## 概述

本文档为 Strapi v5 二次开发最佳实践指南，涵盖项目架构、自定义开发、插件开发、安全配置等核心内容

---

## 技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| 框架 | Strapi 5.x | Headless CMS |
| 语言 | TypeScript 5 | 类型安全 |
| 数据库 | MySQL 2  | 生产环境推荐 |
| 运行时 | Node.js 20.x - 24.x | LTS 版本 |

---

## 目录结构

```
strapi-project/
├── config/
│   ├── admin.ts              # 管理面板配置
│   ├── api.ts                # API 配置
│   ├── database.ts           # 数据库连接
│   ├── middlewares.ts        # 中间件配置
│   ├── plugins.ts            # 插件配置
│   └── server.ts             # 服务器配置
├── src/
│   ├── admin/                # 管理面板自定义
│   │   └── app.tsx           # 管理面板入口
│   ├── api/                  # 自定义 API
│   │   └── [content-type]/
│   │       ├── content-types/
│   │       │   └── [name]/
│   │       │       └── schema.json
│   │       ├── controllers/
│   │       │   └── [name].ts
│   │       ├── routes/
│   │       │   └── [name].ts
│   │       └── services/
│   │           └── [name].ts
│   ├── components/           # 可复用组件
│   ├── extensions/           # 插件扩展/覆盖
│   ├── middlewares/          # 自定义中间件
│   ├── plugins/              # 本地插件
│   └── index.ts              # 应用入口
├── types/
│   └── generated/            # 自动生成的类型
├── database/
│   └── migrations/           # 数据库迁移
├── public/                   # 静态资源
├── .env                      # 环境变量
├── package.json
└── tsconfig.json
```

---

## 核心概念

### 三层架构

```
┌──────────────────────────────────────────────────────────────┐
│  Routes (路由层)                                              │
│  - URL 与控制器方法的绑定                                      │
│  - 定义 HTTP 方法、路径、中间件                                │
├──────────────────────────────────────────────────────────────┤
│  Controllers (控制器层)                                       │
│  - 处理请求的主入口                                           │
│  - 参数收集、结果转发                                         │
│  - 调用服务层执行业务逻辑                                      │
├──────────────────────────────────────────────────────────────┤
│  Services (服务层)                                            │
│  - 核心业务逻辑                                               │
│  - 数据访问与处理                                             │
│  - 全局可复用方法                                             │
└──────────────────────────────────────────────────────────────┘
```

**最佳实践**：将复杂业务逻辑拆分到服务层，控制器只负责参数收集和结果转发。

---

## 自定义控制器

### 扩展默认控制器

```typescript
// src/api/article/controllers/article.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::article.article',
  ({ strapi }) => ({
    // 扩展默认 find 方法
    async find(ctx) {
      // 前置处理
      ctx.query = { ...ctx.query, populate: '*' };

      // 调用父类方法
      const { data, meta } = await super.find(ctx);

      // 后置处理
      return { data, meta };
    },

    // 完全自定义方法
    async customAction(ctx) {
      try {
        const { id } = ctx.params;
        const result = await strapi
          .service('api::article.article')
          .customMethod(id);

        return ctx.send({ code: 0, data: result });
      } catch (error) {
        return ctx.badRequest('操作失败', { error: error.message });
      }
    },
  })
);
```

### 控制器最佳实践

| 原则 | 说明 |
|------|------|
| 单一职责 | 每个方法只处理一个请求 |
| 参数验证 | 使用 ctx.request.body 前先验证 |
| 错误处理 | 统一使用 ctx.badRequest / ctx.notFound 等 |
| 日志记录 | 关键操作记录日志 |
| 无业务逻辑 | 复杂逻辑下沉到服务层 |

---

## 自定义服务

### 扩展默认服务

```typescript
// src/api/article/services/article.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreService(
  'api::article.article',
  ({ strapi }) => ({
    // 自定义方法
    async customMethod(id: number) {
      const entity = await strapi.entityService.findOne(
        'api::article.article',
        id,
        { populate: ['author', 'category'] }
      );

      if (!entity) {
        throw new Error('文章不存在');
      }

      return entity;
    },

    // 批量操作
    async batchUpdate(ids: number[], data: object) {
      const results = await Promise.all(
        ids.map((id) =>
          strapi.entityService.update('api::article.article', id, { data })
        )
      );
      return results;
    },

    // 事务操作
    async createWithRelations(articleData, authorData) {
      return strapi.db.transaction(async ({ trx }) => {
        const author = await strapi.entityService.create(
          'api::author.author',
          { data: authorData }
        );

        const article = await strapi.entityService.create(
          'api::article.article',
          { data: { ...articleData, author: author.id } }
        );

        return article;
      });
    },
  })
);
```

### Entity Service API

```typescript
// 查询
strapi.entityService.findOne(uid, id, { populate, fields });
strapi.entityService.findMany(uid, { filters, sort, pagination, populate });

// 创建
strapi.entityService.create(uid, { data, populate });

// 更新
strapi.entityService.update(uid, id, { data, populate });

// 删除
strapi.entityService.delete(uid, id);

// 计数
strapi.entityService.count(uid, { filters });
```

---

## 自定义路由

### 核心路由配置

```typescript
// src/api/article/routes/article.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::article.article', {
  // 路由前缀
  prefix: '/articles',

  // 仅启用部分路由
  only: ['find', 'findOne', 'create', 'update'],

  // 路由配置
  config: {
    find: {
      middlewares: ['api::article.rate-limit'],
      policies: ['api::article.is-authenticated'],
    },
    create: {
      middlewares: ['api::article.validate-input'],
    },
  },
});
```

### 自定义路由

```typescript
// src/api/article/routes/custom-routes.ts
export default {
  routes: [
    {
      method: 'GET',
      path: '/articles/featured',
      handler: 'article.findFeatured',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/articles/:id/publish',
      handler: 'article.publish',
      config: {
        policies: ['api::article.is-owner'],
      },
    },
  ],
};
```

---

## 自定义中间件

### 全局中间件

```typescript
// src/middlewares/request-logger.ts
import type { Core } from '@strapi/strapi';

export default (config, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx, next) => {
    const start = Date.now();

    await next();

    const duration = Date.now() - start;
    strapi.log.info(
      `${ctx.method} ${ctx.url} - ${ctx.status} [${duration}ms]`
    );
  };
};
```

### 中间件配置

```typescript
// config/middlewares.ts
export default [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  // 自定义中间件
  {
    name: 'global::request-logger',
    config: {
      enabled: true,
    },
  },
];
```

---

## 自定义策略 (Policies)

```typescript
// src/policies/is-owner.ts
export default async (policyContext, config, { strapi }) => {
  const { id } = policyContext.params;
  const userId = policyContext.state.user?.id;

  if (!userId) {
    return false;
  }

  const entity = await strapi.entityService.findOne(
    'api::article.article',
    id,
    { populate: ['owner'] }
  );

  if (!entity || entity.owner?.id !== userId) {
    return false;
  }

  return true;
};
```

---

## 生命周期钩子

```typescript
// src/api/article/content-types/article/lifecycles.ts
export default {
  // 创建前
  async beforeCreate(event) {
    const { data } = event.params;
    data.slug = generateSlug(data.title);
  },

  // 创建后
  async afterCreate(event) {
    const { result } = event;
    await strapi.service('api::notification.notification').send({
      type: 'article_created',
      entityId: result.id,
    });
  },

  // 更新前
  async beforeUpdate(event) {
    const { data } = event.params;
    data.updatedAt = new Date();
  },

  // 删除前 (软删除处理)
  async beforeDelete(event) {
    const { where } = event.params;
    // 改为软删除
    await strapi.entityService.update('api::article.article', where.id, {
      data: { isDeleted: true },
    });
    // 阻止实际删除
    event.state.shouldContinue = false;
  },
};
```

---

## 插件开发

### 创建插件

```bash
# 使用 Plugin SDK
npx @strapi/sdk-plugin init my-plugin

# 开发时热重载
pnpm develop --watch-admin

# 链接到项目测试
pnpm watch:link
```

### 插件结构

```
src/plugins/my-plugin/
├── admin/
│   └── src/
│       ├── index.tsx         # 管理面板入口
│       ├── pages/            # 插件页面
│       └── components/       # UI 组件
├── server/
│   └── src/
│       ├── index.ts          # 服务端入口
│       ├── controllers/
│       ├── services/
│       ├── routes/
│       └── content-types/
├── package.json
└── strapi-admin.js
```

### 插件注册

```typescript
// config/plugins.ts
export default {
  'my-plugin': {
    enabled: true,
    resolve: './src/plugins/my-plugin',
    config: {
      // 插件配置
    },
  },
};
```

---

## 数据库配置

### MySQL 配置

```typescript
// config/database.ts
import path from 'path';

export default ({ env }) => ({
  connection: {
    client: 'mysql2',
    connection: {
      host: env('DATABASE_HOST', 'localhost'),
      port: env.int('DATABASE_PORT', 3306),
      database: env('DATABASE_NAME', 'strapi'),
      user: env('DATABASE_USERNAME', 'root'),
      password: env('DATABASE_PASSWORD', ''),
      charset: 'utf8mb4',
      collation: 'utf8mb4_unicode_ci',
    },
    pool: {
      min: env.int('DATABASE_POOL_MIN', 2),
      max: env.int('DATABASE_POOL_MAX', 10),
    },
    acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
  },
});
```

### 数据模型定义

```json
// src/api/article/content-types/article/schema.json
{
  "kind": "collectionType",
  "collectionName": "articles",
  "info": {
    "singularName": "article",
    "pluralName": "articles",
    "displayName": "Article"
  },
  "options": {
    "draftAndPublish": true
  },
  "attributes": {
    "title": {
      "type": "string",
      "required": true,
      "maxLength": 128
    },
    "content": {
      "type": "richtext"
    },
    "accessMode": {
      "type": "enumeration",
      "enum": ["OPEN_EDIT", "OPEN_READONLY", "WHITELIST_ONLY"],
      "default": "OPEN_READONLY"
    },
    "owner": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    },
    "isDeleted": {
      "type": "boolean",
      "default": false
    }
  }
}
```

---

## 安全配置

### 安全最佳实践

| 类别 | 配置 | 说明 |
|------|------|------|
| 环境变量 | `.env` | 敏感信息不入库 |
| API Token | Admin Panel | 生产环境使用 Full Access Token |
| CORS | config/middlewares.ts | 限制允许的域名 |
| Rate Limit | 自定义中间件 | 防止暴力请求 |
| Helmet | 默认启用 | HTTP 安全头 |

### 禁用不需要的插件

```typescript
// config/plugins.ts
export default {
  // 禁用媒体库 (减少数据库表)
  upload: {
    enabled: false,
  },
  // 禁用邮件插件
  email: {
    enabled: false,
  },
};
```

### CORS 配置

```typescript
// config/middlewares.ts
export default [
  // ...
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      headers: '*',
      origin: ['http://localhost:5173', 'https://your-domain.com'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    },
  },
];
```

---

## API 调用示例

### REST API

```bash
# 获取列表
GET /api/articles?populate=*&filters[isDeleted][$eq]=false

# 获取单条
GET /api/articles/1?populate[owner][fields][0]=username

# 创建
POST /api/articles
Content-Type: application/json
Authorization: Bearer <token>
{
  "data": {
    "title": "新文章",
    "content": "内容..."
  }
}

# 更新
PUT /api/articles/1
{
  "data": {
    "title": "更新标题"
  }
}

# 删除
DELETE /api/articles/1
```

### 请求头配置

```typescript
// 调用方 (如 BFF 层)
const response = await axios.get(`${STRAPI_URL}/api/articles`, {
  headers: {
    Authorization: `Bearer ${STRAPI_API_TOKEN}`,
    'Content-Type': 'application/json',
  },
  params: {
    populate: '*',
    'filters[isDeleted][$eq]': false,
    'pagination[page]': 1,
    'pagination[pageSize]': 20,
  },
});
```

---

## 环境变量

```bash
# .env
HOST=0.0.0.0
PORT=1337
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=your-api-token-salt
ADMIN_JWT_SECRET=your-admin-jwt-secret
TRANSFER_TOKEN_SALT=your-transfer-token-salt
JWT_SECRET=your-jwt-secret

# 数据库
DATABASE_CLIENT=mysql2
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=strapi
DATABASE_USERNAME=root
DATABASE_PASSWORD=password

# 生产环境
NODE_ENV=production
```

---

## 开发命令

```bash
# 开发模式
pnpm develop

# 开发模式 (热重载管理面板)
pnpm develop --watch-admin

# 构建
pnpm build

# 生产启动
pnpm start

# 控制台
pnpm strapi console

# 升级 Strapi
pnpm upgrade
pnpm upgrade:dry  # 预览升级
```

---

## 性能优化

### 查询优化

```typescript
// 避免 N+1 查询 - 使用 populate
const articles = await strapi.entityService.findMany('api::article.article', {
  populate: {
    owner: {
      fields: ['username', 'email'],
    },
    category: true,
  },
  fields: ['id', 'title', 'createdAt'],
});

// 分页查询
const { results, pagination } = await strapi.entityService.findPage(
  'api::article.article',
  {
    page: 1,
    pageSize: 20,
    filters: { isDeleted: false },
  }
);
```

### 缓存策略

```typescript
// 使用内存缓存
const cache = new Map();

async function getCachedData(key: string, fetcher: () => Promise<any>) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  const data = await fetcher();
  cache.set(key, data);
  setTimeout(() => cache.delete(key), 60000); // 60s 过期
  return data;
}
```

---

## 测试策略

| 类型 | 工具 | 说明 |
|------|------|------|
| 单元测试 | Jest / Vitest | 服务层逻辑测试 |
| 集成测试 | Supertest | API 端点测试 |
| E2E 测试 | Playwright | 管理面板测试 |

```typescript
// 单元测试示例
describe('ArticleService', () => {
  it('should create article', async () => {
    const article = await strapi
      .service('api::article.article')
      .create({ data: { title: 'Test' } });

    expect(article).toHaveProperty('id');
    expect(article.title).toBe('Test');
  });
});
```

---

## 部署清单

- [ ] 环境变量配置完整
- [ ] 数据库连接池配置
- [ ] 禁用不需要的插件
- [ ] CORS 域名白名单
- [ ] API Token 权限最小化
- [ ] 日志级别配置
- [ ] 健康检查端点
- [ ] 数据库备份策略
- [ ] 监控告警配置

---

## 参考资源

- [Strapi 5 官方文档](https://docs.strapi.io)
- [Strapi 5 中文文档](https://www.strapi.cn)
- [Strapi GitHub](https://github.com/strapi/strapi)
- [Strapi 社区插件](https://market.strapi.io)

---

## 数据模型

参考：docs-sql.md

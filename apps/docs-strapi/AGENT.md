# LLM Agent Guide - docs-strapi

本文档为 LLM 代码生成提供 Strapi 5 的详细模式参考和代码示例。

## 技术栈

- Strapi 5.33.0
- Node.js 20.x - 24.x
- MySQL 2 (主数据库)
- TypeScript 5.x

## 代码生成规范

### 1. Content Type Schema 模式

#### 完整业务实体 Schema

```json
// src/api/example/content-types/example/schema.json
{
  "kind": "collectionType",
  "collectionName": "examples",
  "info": {
    "singularName": "example",
    "pluralName": "examples",
    "displayName": "Example"
  },
  "options": {
    "draftAndPublish": false,
    "timestamps": false
  },
  "pluginOptions": {},
  "attributes": {
    "name": {
      "type": "string",
      "maxLength": 128,
      "required": true
    },
    "codeName": {
      "type": "string",
      "maxLength": 128,
      "required": true,
      "unique": true
    },
    "description": {
      "type": "text"
    },
    "content": {
      "type": "richtext"
    },
    "creator": {
      "type": "string",
      "maxLength": 128,
      "required": true
    },
    "status": {
      "type": "enumeration",
      "enum": ["DRAFT", "PUBLISHED", "ARCHIVED"],
      "default": "DRAFT"
    },
    "type": {
      "type": "integer",
      "default": 1
    },
    "order": {
      "type": "integer",
      "default": 0
    },
    "icon": {
      "type": "string",
      "maxLength": 255
    },
    "isDeleted": {
      "type": "boolean",
      "default": false
    },
    "ctime": {
      "type": "datetime"
    },
    "mtime": {
      "type": "datetime"
    }
  }
}
```

#### 层级结构 Schema (带 parentId)

```json
// src/api/example-folder/content-types/example-folder/schema.json
{
  "kind": "collectionType",
  "collectionName": "example_folders",
  "info": {
    "singularName": "example-folder",
    "pluralName": "example-folders",
    "displayName": "ExampleFolder"
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {},
  "attributes": {
    "parentId": {
      "type": "biginteger",
      "default": "0"
    },
    "exampleId": {
      "type": "biginteger"
    },
    "name": {
      "type": "string",
      "required": true,
      "maxLength": 128
    },
    "visibilityScope": {
      "type": "enumeration",
      "enum": ["ALL", "DEPT_ONLY"],
      "default": "ALL"
    },
    "order": {
      "type": "integer",
      "default": 0
    },
    "isDeleted": {
      "type": "boolean",
      "default": false
    },
    "ctime": {
      "type": "datetime"
    },
    "mtime": {
      "type": "datetime"
    }
  }
}
```

#### 关联表 Schema (多对多)

```json
// src/api/example-user/content-types/example-user/schema.json
{
  "kind": "collectionType",
  "collectionName": "example_users",
  "info": {
    "singularName": "example-user",
    "pluralName": "example-users",
    "displayName": "ExampleUser"
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {},
  "attributes": {
    "example_id": {
      "type": "biginteger"
    },
    "user_id": {
      "type": "biginteger"
    },
    "ctime": {
      "type": "datetime"
    },
    "mtime": {
      "type": "datetime"
    }
  }
}
```

#### ACL 权限表 Schema

```json
// src/api/example-acl/content-types/example-acl/schema.json
{
  "kind": "collectionType",
  "collectionName": "example_acls",
  "info": {
    "singularName": "example-acl",
    "pluralName": "example-acls",
    "displayName": "ExampleAcl"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "exampleId": {
      "type": "biginteger"
    },
    "username": {
      "type": "string",
      "maxLength": 128,
      "required": true
    },
    "perm": {
      "type": "enumeration",
      "enum": ["READ", "EDIT", "ADMIN"],
      "default": "READ"
    },
    "source": {
      "type": "enumeration",
      "enum": ["AUTO_INIT", "MANUAL"],
      "default": "MANUAL"
    },
    "isDeleted": {
      "type": "boolean",
      "default": false
    },
    "ctime": {
      "type": "datetime"
    },
    "mtime": {
      "type": "datetime"
    }
  }
}
```

### 2. Controller 模式

```typescript
// src/api/example/controllers/example.ts
import { factories } from '@strapi/strapi';

// 默认 CRUD（继承 Strapi 核心）
export default factories.createCoreController('api::example.example');
```

#### 自定义 Controller

```typescript
// src/api/example/controllers/example.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::example.example', ({ strapi }) => ({
  // 覆盖默认的 find 方法
  async find(ctx) {
    // 添加自定义过滤
    ctx.query = {
      ...ctx.query,
      filters: {
        ...ctx.query.filters,
        isDeleted: false,
      },
    };

    const { data, meta } = await super.find(ctx);
    return { data, meta };
  },

  // 自定义方法
  async findByCreator(ctx) {
    const { creator } = ctx.params;

    const entities = await strapi.documents('api::example.example').findMany({
      filters: {
        creator: { $eq: creator },
        isDeleted: { $eq: false },
      },
      sort: { ctime: 'desc' },
    });

    return { data: entities };
  },

  // 批量操作
  async batchUpdate(ctx) {
    const { ids, updates } = ctx.request.body;

    const results = await Promise.all(
      ids.map(id =>
        strapi.documents('api::example.example').update({
          documentId: id,
          data: updates,
        })
      )
    );

    return { data: results };
  },
}));
```

### 3. Route 模式

```typescript
// src/api/example/routes/example.ts
import { factories } from '@strapi/strapi';

// 默认 RESTful 路由
export default factories.createCoreRouter('api::example.example');
```

#### 自定义路由

```typescript
// src/api/example/routes/custom-example.ts
export default {
  routes: [
    {
      method: 'GET',
      path: '/examples/creator/:creator',
      handler: 'example.findByCreator',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/examples/batch-update',
      handler: 'example.batchUpdate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
```

### 4. Service 模式

```typescript
// src/api/example/services/example.ts
import { factories } from '@strapi/strapi';

// 默认服务
export default factories.createCoreService('api::example.example');
```

#### 自定义服务

```typescript
// src/api/example/services/example.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::example.example', ({ strapi }) => ({
  // 自定义查询方法
  async findByCondition(condition: Record<string, unknown>) {
    return strapi.documents('api::example.example').findMany({
      filters: {
        ...condition,
        isDeleted: { $eq: false },
      },
    });
  },

  // 带事务的操作
  async createWithRelations(data: any, relations: any[]) {
    const example = await strapi.documents('api::example.example').create({
      data,
    });

    for (const relation of relations) {
      await strapi.documents('api::example-relation.example-relation').create({
        data: {
          exampleId: example.id,
          ...relation,
        },
      });
    }

    return example;
  },

  // 统计方法
  async countByStatus(status: string) {
    const results = await strapi.documents('api::example.example').findMany({
      filters: {
        status: { $eq: status },
        isDeleted: { $eq: false },
      },
    });
    return results.length;
  },
}));
```

### 5. 全局中间件模式 (src/index.ts)

```typescript
// src/index.ts
import type { Core } from '@strapi/strapi';

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    // ============ ID 转换函数 ============
    function transformIdsToString(data: unknown): unknown {
      if (Array.isArray(data)) {
        return data.map(transformIdsToString);
      }
      if (data !== null && typeof data === 'object') {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data)) {
          if (key === 'id' && typeof value === 'number') {
            result[key] = String(value);
          } else if (typeof value === 'object') {
            result[key] = transformIdsToString(value);
          } else {
            result[key] = value;
          }
        }
        return result;
      }
      return data;
    }

    // ============ 自定义业务类型列表 ============
    const CUSTOM_CONTENT_TYPES = [
      'api::example.example',
      'api::example-folder.example-folder',
      'api::example-acl.example-acl',
      // 添加新类型到此列表
    ];

    // ============ 需要软删除的类型 ============
    const SOFT_DELETION_CONTENT_TYPES = [
      'api::example.example',
      'api::example-folder.example-folder',
    ];

    // ============ Document 中间件 ============
    strapi.documents.use(async (context, next) => {
      const now = new Date().toISOString();
      const params = context.params as Record<string, any>;
      const uid = context.uid;

      const isCustomType = CUSTOM_CONTENT_TYPES.includes(uid);
      const deletedField = isCustomType ? 'isDeleted' : 'is_deleted';

      // 创建时设置时间戳
      if (context.action === 'create' && params?.data) {
        params.data.ctime = now;
        params.data.mtime = now;
      }

      // 更新时设置修改时间
      if (context.action === 'update' && params?.data) {
        params.data.mtime = now;
      }

      // 删除转软删除
      if (context.action === 'delete' && SOFT_DELETION_CONTENT_TYPES.includes(uid)) {
        const documentId = params?.documentId;
        if (documentId) {
          await strapi.documents(uid as any).update({
            documentId,
            data: {
              [deletedField]: isCustomType ? true : 1,
              mtime: now,
            } as any,
          });
          return strapi.documents(uid as any).findOne({ documentId }) as Awaited<ReturnType<typeof next>>;
        }
      }

      return next();
    });

    // ============ HTTP 响应中间件 ============
    strapi.server.use(async (ctx, next) => {
      await next();
      if (ctx.url.startsWith('/api/') && ctx.body) {
        ctx.body = transformIdsToString(ctx.body);
      }
    });
  },

  bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // 启动时执行的逻辑
  },
};
```

### 6. 目录结构模板

创建新 Content Type 时的完整目录结构：

```
src/api/example/
├── content-types/
│   └── example/
│       └── schema.json          # Schema 定义
├── controllers/
│   └── example.ts               # 控制器
├── routes/
│   ├── example.ts               # 默认路由
│   └── custom-example.ts        # 自定义路由（可选）
└── services/
    └── example.ts               # 服务层
```

## Schema 字段类型参考

| 类型 | 说明 | 示例 |
|------|------|------|
| `string` | 短文本 | `{ "type": "string", "maxLength": 128 }` |
| `text` | 长文本 | `{ "type": "text" }` |
| `richtext` | 富文本 | `{ "type": "richtext" }` |
| `integer` | 整数 | `{ "type": "integer", "default": 0 }` |
| `biginteger` | 大整数(ID) | `{ "type": "biginteger" }` |
| `boolean` | 布尔值 | `{ "type": "boolean", "default": false }` |
| `datetime` | 日期时间 | `{ "type": "datetime" }` |
| `enumeration` | 枚举 | `{ "type": "enumeration", "enum": ["A", "B"], "default": "A" }` |

## 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| Content Type 名称 | kebab-case | `example-folder` |
| 集合名 | snake_case 复数 | `example_folders` |
| Display Name | PascalCase | `ExampleFolder` |
| 业务字段 | camelCase | `isDeleted`, `spaceId` |
| 外键字段 | snake_case | `example_id`, `user_id` |
| API UID | `api::name.name` | `api::example.example` |

## 标准字段

每个业务 Content Type 应包含：

```json
{
  "isDeleted": {
    "type": "boolean",
    "default": false
  },
  "ctime": {
    "type": "datetime"
  },
  "mtime": {
    "type": "datetime"
  }
}
```

## 注意事项

1. **draftAndPublish**: 业务实体通常设为 `false`，关联表可设为 `true`
2. **timestamps**: 设为 `false`，使用自定义 `ctime`/`mtime`
3. **软删除**: 通过全局中间件实现，不要硬删除数据
4. **ID 转换**: 全局中间件自动将数字 ID 转为字符串
5. **新类型注册**: 创建新类型后需添加到 `src/index.ts` 的类型列表中

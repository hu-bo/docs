# LLM Agent Guide - docs-api

本文档为 LLM 代码生成提供详细的模式参考和代码示例。

## 技术栈

- Node.js >= 18.0.0
- Express.js 4.x
- TypeScript 5.x (ES2022, ESNext 模块)
- Zod (请求验证)
- Axios (HTTP 客户端)
- Yjs + y-websocket (实时协作)

## 代码生成规范

### 1. 控制器模式 (Controller Pattern)

```typescript
// src/controllers/example.ts
import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/index.js';
import * as strapiService from '../services/strapi.js';
import * as permissionService from '../services/permission.js';
import { success, badRequest, forbidden, notFound, serverError, paginated } from '../utils/response.js';
import { logger } from '../utils/logger.js';

// ============ 1. Zod 验证 Schema 定义在文件顶部 ============
const createExampleSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().optional().default(''),
  type: z.enum(['TYPE_A', 'TYPE_B']).optional().default('TYPE_A'),
});

const updateExampleSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  description: z.string().optional(),
});

// ============ 2. 控制器函数 ============
export async function createExample(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Step 1: 验证请求参数
    const validation = createExampleSchema.safeParse(req.body);
    if (!validation.success) {
      return badRequest(res, validation.error.errors[0].message);
    }

    // Step 2: 获取认证用户
    const username = req.user!.username;
    const { name, description, type } = validation.data;

    // Step 3: 权限检查
    const canCreate = await permissionService.canCreateExample(username);
    if (!canCreate) {
      return forbidden(res, '无权创建');
    }

    // Step 4: 调用服务层
    const result = await strapiService.createExample({
      name,
      description,
      type,
      creator: username,
    });

    // Step 5: 记录日志并返回
    logger.info(`[Example] Created: ${name} by ${username}`);
    success(res, result.data);
  } catch (error) {
    logger.error('[Example] createExample error:', error);
    return serverError(res);
  }
}

// ============ 3. 列表查询（带分页） ============
export async function getExamples(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const username = req.user!.username;

    const result = await strapiService.getExamples({
      'pagination[page]': page,
      'pagination[pageSize]': pageSize,
      'sort': 'ctime:desc',
    });

    // 可选：按权限过滤
    const filtered = [];
    for (const item of result.data) {
      const canView = await permissionService.canViewExample(item, username);
      if (canView) {
        filtered.push(item);
      }
    }

    paginated(res, filtered, result.meta.pagination.total, page, pageSize);
  } catch (error) {
    logger.error('[Example] getExamples error:', error);
    return serverError(res);
  }
}

// ============ 4. 单个查询 ============
export async function getExampleById(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { exampleId } = req.params;
    const username = req.user!.username;

    const result = await strapiService.getExampleById(exampleId);
    if (!result.data) {
      return notFound(res, '资源不存在');
    }

    const canView = await permissionService.canViewExample(result.data, username);
    if (!canView) {
      return forbidden(res, '无权查看');
    }

    success(res, result.data);
  } catch (error) {
    logger.error('[Example] getExampleById error:', error);
    return serverError(res);
  }
}

// ============ 5. 更新操作 ============
export async function updateExample(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { exampleId } = req.params;
    const username = req.user!.username;

    const validation = updateExampleSchema.safeParse(req.body);
    if (!validation.success) {
      return badRequest(res, validation.error.errors[0].message);
    }

    const existing = await strapiService.getExampleById(exampleId);
    if (!existing.data) {
      return notFound(res, '资源不存在');
    }

    const canEdit = await permissionService.canEditExample(existing.data, username);
    if (!canEdit) {
      return forbidden(res, '无权编辑');
    }

    const result = await strapiService.updateExample(exampleId, validation.data);
    logger.info(`[Example] Updated: ${exampleId} by ${username}`);
    success(res, result.data);
  } catch (error) {
    logger.error('[Example] updateExample error:', error);
    return serverError(res);
  }
}

// ============ 6. 删除操作（软删除） ============
export async function deleteExample(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { exampleId } = req.params;
    const username = req.user!.username;

    const existing = await strapiService.getExampleById(exampleId);
    if (!existing.data) {
      return notFound(res, '资源不存在');
    }

    const canDelete = await permissionService.canDeleteExample(existing.data, username);
    if (!canDelete) {
      return forbidden(res, '无权删除');
    }

    await strapiService.deleteExample(exampleId);
    logger.info(`[Example] Deleted: ${exampleId} by ${username}`);
    success(res, null);
  } catch (error) {
    logger.error('[Example] deleteExample error:', error);
    return serverError(res);
  }
}
```

### 2. 服务层模式 (Service Pattern)

```typescript
// src/services/strapi.ts 中添加新实体

// ============ CRUD 操作模板 ============

// 列表查询
export async function getExamples(params?: Record<string, unknown>): Promise<StrapiListResponse<Example>> {
  const { data } = await strapiClient.get('/api/examples', {
    params: { ...buildNotDeletedFilter(), ...params },
  });
  return data;
}

// 单个查询
export async function getExampleById(documentId: string): Promise<StrapiSingleResponse<Example>> {
  const { data } = await strapiClient.get(`/api/examples/${documentId}`, {
    params: buildNotDeletedFilter(),
  });
  return data;
}

// 创建
export async function createExample(payload: Partial<Example>): Promise<StrapiSingleResponse<Example>> {
  const { data } = await strapiClient.post('/api/examples', { data: payload });
  return data;
}

// 更新
export async function updateExample(documentId: string, payload: Partial<Example>): Promise<StrapiSingleResponse<Example>> {
  const { data } = await strapiClient.put(`/api/examples/${documentId}`, { data: payload });
  return data;
}

// 软删除
export async function deleteExample(documentId: string): Promise<StrapiSingleResponse<Example>> {
  const { data } = await strapiClient.put(`/api/examples/${documentId}`, { data: { isDeleted: true } });
  return data;
}

// ============ 条件查询模板 ============
export async function getExamplesByUser(username: string): Promise<StrapiListResponse<Example>> {
  const { data } = await strapiClient.get('/api/examples', {
    params: {
      ...buildNotDeletedFilter(),
      'filters[creator][$eq]': username,
      'sort': 'ctime:desc',
    },
  });
  return data;
}

// ============ Upsert 模板 ============
export async function upsertExample(
  key: string,
  value: string,
  updates: Partial<Example>
): Promise<StrapiSingleResponse<Example>> {
  const existing = await getExamples({
    'filters[key][$eq]': key,
    'filters[value][$eq]': value,
  });

  if (existing.data.length > 0) {
    return updateExample(existing.data[0].documentId, updates);
  } else {
    return createExample({ key, value, ...updates });
  }
}
```

### 3. 权限服务模式 (Permission Pattern)

```typescript
// src/services/permission.ts 中添加

// ============ 简单权限检查 ============
export async function canCreateExample(username: string): Promise<boolean> {
  // 基于角色或其他条件
  const userAuth = await getUserAuth(username);
  return userAuth?.canCreate === true;
}

// ============ 资源级权限检查 ============
export async function canViewExample(example: Example, username: string): Promise<boolean> {
  // 1. 所有者可查看
  if (example.creator === username) {
    return true;
  }

  // 2. 管理员可查看
  if (await isAdmin(username)) {
    return true;
  }

  // 3. 公开资源可查看
  if (example.visibility === 'PUBLIC') {
    return true;
  }

  // 4. 检查 ACL
  const acl = await getExampleAcl(example.id, username);
  return acl !== null;
}

export async function canEditExample(example: Example, username: string): Promise<boolean> {
  // 所有者可编辑
  if (example.creator === username) {
    return true;
  }

  // 管理员可编辑
  if (await isAdmin(username)) {
    return true;
  }

  // 检查编辑权限
  const acl = await getExampleAcl(example.id, username);
  return acl?.perm === 'EDIT';
}

export async function canDeleteExample(example: Example, username: string): Promise<boolean> {
  // 只有所有者或管理员可删除
  if (example.creator === username) {
    return true;
  }
  return isAdmin(username);
}
```

### 4. 路由模式 (Route Pattern)

```typescript
// src/routes/example.ts
import { Router } from 'express';
import * as exampleController from '../controllers/example.js';

const router = Router();

// ============ 特殊路由必须在参数路由之前 ============
router.get('/recent', exampleController.getRecentExamples);
router.get('/stats', exampleController.getExampleStats);

// ============ RESTful CRUD ============
router.get('/', exampleController.getExamples);
router.post('/', exampleController.createExample);
router.get('/:exampleId', exampleController.getExampleById);
router.put('/:exampleId', exampleController.updateExample);
router.delete('/:exampleId', exampleController.deleteExample);

// ============ 子资源路由 ============
router.get('/:exampleId/members', exampleController.getExampleMembers);
router.post('/:exampleId/members', exampleController.addExampleMembers);
router.put('/:exampleId/members', exampleController.updateExampleMember);
router.delete('/:exampleId/members', exampleController.removeExampleMembers);

// ============ 操作路由 ============
router.put('/:exampleId/move', exampleController.moveExample);
router.post('/:exampleId/copy', exampleController.copyExample);

export default router;
```

### 5. 类型定义模式 (Type Pattern)

```typescript
// src/types/index.ts 中添加

// ============ 枚举类型 ============
export type ExampleType = 'TYPE_A' | 'TYPE_B' | 'TYPE_C';
export type ExampleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type ExamplePerm = 'READ' | 'EDIT' | 'ADMIN';

// ============ 实体接口 ============
export interface Example {
  id: string;
  documentId: string;
  name: string;
  description: string;
  type: ExampleType;
  status: ExampleStatus;
  creator: string;
  isDeleted: boolean;
  ctime: string;
  mtime: string;
}

// ============ 扩展接口（带额外字段） ============
export interface ExampleWithPermission extends Example {
  userPerm: ExamplePerm | null;
  canEdit: boolean;
}

// ============ ACL 接口 ============
export interface ExampleAcl {
  id: string;
  documentId: string;
  exampleId: string;
  username: string;
  perm: ExamplePerm;
  isDeleted: boolean;
  ctime: string;
  mtime: string;
}

// ============ 创建/更新 DTO ============
export interface CreateExampleInput {
  name: string;
  description?: string;
  type?: ExampleType;
}

export interface UpdateExampleInput {
  name?: string;
  description?: string;
  type?: ExampleType;
  status?: ExampleStatus;
}
```

### 6. 响应工具使用

```typescript
import { success, paginated, badRequest, unauthorized, forbidden, notFound, serverError } from '../utils/response.js';

// 成功响应
success(res, data);                    // { code: 0, message: "success", data: {...} }
success(res, data, '操作成功');         // 自定义消息

// 分页响应
paginated(res, list, total, page, pageSize);
// { code: 0, message: "success", data: { list: [...], total: 100, page: 1, pageSize: 20 } }

// 错误响应
badRequest(res, '参数错误');            // 400
unauthorized(res, '请先登录');          // 401
forbidden(res, '无权限');               // 403
notFound(res, '资源不存在');            // 404
serverError(res);                      // 500
```

## 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 控制器函数 | camelCase，动词开头 | `createDocument`, `getSpaces` |
| 路由文件 | kebab-case | `access-request.ts` |
| 类型接口 | PascalCase | `UserSpaceAuth`, `DocUserAcl` |
| 枚举值 | SCREAMING_SNAKE_CASE | `OPEN_EDIT`, `WHITELIST_ONLY` |
| 日志前缀 | `[Feature]` 格式 | `[Document]`, `[Space]` |

## 错误处理规范

1. 所有控制器函数使用 `try-catch` 包裹
2. 验证失败使用 `badRequest`
3. 权限不足使用 `forbidden`
4. 资源不存在使用 `notFound`
5. 服务器错误使用 `serverError`
6. 每个 catch 块都要记录日志

## 注意事项

1. **路由顺序**：静态路由 (`/recent`) 必须在参数路由 (`/:id`) 之前
2. **软删除**：所有删除操作设置 `isDeleted: true`
3. **权限检查**：在服务调用前检查权限
4. **类型安全**：使用 Zod 验证所有输入
5. **日志记录**：关键操作记录 info 日志，错误记录 error 日志

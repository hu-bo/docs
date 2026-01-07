import type { Response } from 'express';
import { z } from 'zod';
import * as strapiService from '../services/strapi.js';
import * as permissionService from '../services/permission.js';
import { success, paginated, badRequest, forbidden, notFound, serverError } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import type { AuthenticatedRequest, DocWithPermission } from '../types/index.js';

// ============ 验证 Schema ============
const createDocSchema = z.object({
  spaceId: z.string(),
  folderId: z.string(),
  title: z.string().min(1).max(128),
  content: z.string().optional().default(''),
  accessMode: z.enum(['OPEN_EDIT', 'OPEN_READONLY', 'WHITELIST_ONLY']).optional().default('OPEN_READONLY'),
  tags: z.string().optional().default(''),
});

const updateDocSchema = z.object({
  title: z.string().min(1).max(128).optional(),
  content: z.string().optional(),
  accessMode: z.enum(['OPEN_EDIT', 'OPEN_READONLY', 'WHITELIST_ONLY']).optional(),
  tags: z.string().optional(),
});

const moveDocSchema = z.object({
  folderId: z.string(),
});

const memberSchema = z.object({
  username: z.string().min(1),
  perm: z.enum(['READ', 'EDIT']),
});

const batchMembersSchema = z.object({
  members: z.array(memberSchema).min(1),
});

const updateMemberSchema = z.object({
  username: z.string().min(1),
  perm: z.enum(['READ', 'EDIT']),
});

const removeMemberSchema = z.object({
  usernames: z.array(z.string().min(1)).min(1),
});

const bindSpaceSchema = z.object({
  spaceId: z.string(),
  folderId: z.string(),
  perm: z.enum(['READ', 'EDIT']).optional().default('READ'),
});

const unbindSpaceSchema = z.object({
  spaceId: z.string(),
});

// ============ 文档管理 ============

/**
 * 获取最近访问的文档
 * GET /api/documents/recent?spaceId=xxx&limit=6
 */
export async function getRecentDocuments(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const spaceId = req.query.spaceId as string | undefined;
    const limit = parseInt(req.query.limit as string) || 6;
    const username = req.user!.username;

    // 查询用户访问记录，按 lastViewedAt 降序
    const activities = await strapiService.getDocUserActivities({
      'filters[username][$eq]': username,
      'filters[isDeleted][$eq]': false,
      'filters[lastViewedAt][$notNull]': true,
      'sort': 'lastViewedAt:desc',
      'pagination[pageSize]': limit * 3, // 多取一些，后面过滤
    });

    // 获取文档详情并过滤
    const docs = [];
    const spaceCache = new Map<string, string>(); // spaceId -> spaceName

    for (const activity of activities.data) {
      if (docs.length >= limit) break;

      // activity.docId 是数字 ID，需要用 getDocByNumericId 查询
      const docResult = await strapiService.getDocByNumericId(activity.docId);
      const doc = docResult.data;
      if (!doc || doc.isDeleted) continue;

      // 如果指定了空间，则过滤
      if (spaceId && doc.spaceId !== spaceId) continue;

      // 获取空间名称（跨空间场景需要，使用缓存避免重复查询）
      // doc.spaceId 是数字 ID，需要用 getSpaceByNumericId 查询
      let spaceName = '';
      if (!spaceId) {
        if (spaceCache.has(doc.spaceId)) {
          spaceName = spaceCache.get(doc.spaceId)!;
        } else {
          const spaceResult = await strapiService.getSpaceByNumericId(doc.spaceId);
          spaceName = spaceResult.data?.name || '';
          spaceCache.set(doc.spaceId, spaceName);
        }
      }

      docs.push({
        id: doc.id,
        documentId: doc.documentId,
        title: doc.title,
        spaceId: doc.spaceId,
        folderId: doc.folderId,
        mtime: doc.mtime,
        lastViewedAt: activity.lastViewedAt,
        spaceName,
      });
    }

    success(res, docs);
  } catch (error) {
    logger.error('[Document] getRecentDocuments error:', error);
    return serverError(res);
  }
}

/**
 * 获取文档列表
 * GET /api/documents?spaceId=xxx&folderId=xxx
 */
export async function getDocuments(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const spaceId = req.query.spaceId as string;
    const folderId = req.query.folderId ? req.query.folderId : undefined;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const username = req.user!.username;

    if (!spaceId) {
      return badRequest(res, 'spaceId 参数必填');
    }

    // 检查用户对空间的读取权限
    const canRead = await permissionService.canReadSpace(spaceId, username);
    if (!canRead) {
      return forbidden(res, '无权访问此空间');
    }

    // 获取用户在该空间的权限记录
    const userSpaceAuth = await permissionService.getUserSpaceAuth(spaceId, username);
    const hasSpaceAuth = userSpaceAuth !== null;

    const filters: Record<string, unknown> = {
      'filters[spaceId][$eq]': spaceId,
      'pagination[page]': page,
      'pagination[pageSize]': pageSize,
      'sort': 'mtime:desc',
    };

    if (folderId !== undefined) {
      filters['filters[folderId][$eq]'] = folderId;
    }

    const result = await strapiService.getDocs(filters);

    // 过滤用户有权查看的文档，并添加权限字段
    const filteredDocs: DocWithPermission[] = [];
    for (const doc of result.data) {
      const canView = await permissionService.canViewDoc(doc, username);
      if (canView) {
        filteredDocs.push({
          ...doc,
          hasSpaceAuth,
        });
      }
    }

    paginated(res, filteredDocs, filteredDocs.length, page, pageSize);
  } catch (error) {
    logger.error('[Document] getDocuments error:', error);
    return serverError(res);
  }
}

/**
 * 获取文档树（懒加载）
 * GET /api/documents/tree?spaceId=xxx&folderId=xxx
 */
export async function getDocumentTree(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const spaceId = req.query.spaceId as string;
    const folderId = req.query.folderId ? req.query.folderId as string : 0;
    const username = req.user!.username;

    if (!spaceId) {
      return badRequest(res, 'spaceId 参数必填');
    }

    // 检查读取权限
    const canRead = await permissionService.canReadSpace(spaceId, username);
    if (!canRead) {
      return forbidden(res, '无权访问此空间');
    }

    // 获取用户在该空间的权限记录
    const userSpaceAuth = await permissionService.getUserSpaceAuth(spaceId, username);
    const hasSpaceAuth = userSpaceAuth !== null;

    // 获取当前层级的文件夹
    const folders = await strapiService.getFolders({
      'filters[spaceId][$eq]': spaceId,
      'filters[parentId][$eq]': folderId,
      'sort': 'order:asc',
    });

    // 获取当前层级的文档
    const docs = await strapiService.getDocs({
      'filters[spaceId][$eq]': spaceId,
      'filters[folderId][$eq]': folderId,
      'sort': 'mtime:desc',
    });

    // 为文档添加权限字段
    const docsWithPermission: DocWithPermission[] = docs.data.map(doc => ({
      ...doc,
      hasSpaceAuth,
    }));

    success(res, {
      folders: folders.data,
      docs: docsWithPermission,
    });
  } catch (error) {
    logger.error('[Document] getDocumentTree error:', error);
    return serverError(res);
  }
}

/**
 * 获取文档详情
 * GET /api/documents/:documentId
 */
export async function getDocumentById(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { documentId } = req.params;
    const username = req.user!.username;

    const result = await strapiService.getDocById(documentId);
    if (!result.data) {
      return notFound(res, '文档不存在');
    }

    const doc = result.data;

    // 检查查看权限
    const canView = await permissionService.canViewDoc(doc, username);
    if (!canView) {
      return forbidden(res, '无权查看此文档');
    }

    // 更新用户访问记录（visitCount 增量更新）
    const now = new Date().toISOString();
    await strapiService.upsertDocUserActivity(
      doc.id,
      username,
      { lastViewedAt: now },
      { incrementVisitCount: true }
    );

    success(res, doc);
  } catch (error) {
    logger.error('[Document] getDocumentById error:', error);
    return serverError(res);
  }
}

/**
 * 创建文档
 * POST /api/documents
 */
export async function createDocument(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const validation = createDocSchema.safeParse(req.body);
    if (!validation.success) {
      return badRequest(res, validation.error.errors[0].message);
    }

    const username = req.user!.username;
    const { spaceId, folderId, title, content, accessMode, tags } = validation.data;

    // 检查创建文档权限
    const canCreate = await permissionService.canCreateDoc(spaceId, username);
    if (!canCreate) {
      return forbidden(res, '无权在此空间创建文档');
    }

    const result = await strapiService.createDoc({
      spaceId,
      folderId,
      title,
      content,
      accessMode,
      owner: username,
      tags,
    });

    logger.info(`[Document] Created doc: ${title} by ${username}`);
    success(res, result.data);
  } catch (error) {
    logger.error('[Document] createDocument error:', error);
    return serverError(res);
  }
}

/**
 * 更新文档
 * PUT /api/documents/:documentId
 */
export async function updateDocument(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { documentId } = req.params;
    const username = req.user!.username;

    const validation = updateDocSchema.safeParse(req.body);
    if (!validation.success) {
      return badRequest(res, validation.error.errors[0].message);
    }

    // 检查文档是否存在
    const docResult = await strapiService.getDocById(documentId);
    if (!docResult.data) {
      return notFound(res, '文档不存在');
    }

    const doc = docResult.data;

    // 检查编辑权限
    const canEdit = await permissionService.canEditDoc(doc, username);
    if (!canEdit) {
      return forbidden(res, '无权编辑此文档');
    }

    const result = await strapiService.updateDoc(documentId, validation.data);

    // 更新编辑时间
    await strapiService.upsertDocUserActivity(doc.id, username, {
      lastEditedAt: new Date().toISOString(),
    });

    success(res, result.data);
  } catch (error) {
    logger.error('[Document] updateDocument error:', error);
    return serverError(res);
  }
}

/**
 * 移动文档
 * PUT /api/documents/:documentId/move
 */
export async function moveDocument(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { documentId } = req.params;
    const username = req.user!.username;

    const validation = moveDocSchema.safeParse(req.body);
    if (!validation.success) {
      return badRequest(res, validation.error.errors[0].message);
    }

    // 检查文档是否存在
    const docResult = await strapiService.getDocById(documentId);
    if (!docResult.data) {
      return notFound(res, '文档不存在');
    }

    const doc = docResult.data;

    // 检查编辑权限
    const canEdit = await permissionService.canEditDoc(doc, username);
    if (!canEdit) {
      return forbidden(res, '无权移动此文档');
    }

    const result = await strapiService.updateDoc(documentId, {
      folderId: validation.data.folderId,
    });

    success(res, result.data);
  } catch (error) {
    logger.error('[Document] moveDocument error:', error);
    return serverError(res);
  }
}

/**
 * 删除文档（软删除）
 * DELETE /api/documents/:documentId
 */
export async function deleteDocument(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { documentId } = req.params;
    const username = req.user!.username;

    // 检查文档是否存在
    const docResult = await strapiService.getDocById(documentId);
    if (!docResult.data) {
      return notFound(res, '文档不存在');
    }

    const doc = docResult.data;

    // 检查编辑权限
    const canEdit = await permissionService.canEditDoc(doc, username);
    if (!canEdit) {
      return forbidden(res, '无权删除此文档');
    }

    await strapiService.deleteDoc(documentId);
    logger.info(`[Document] Deleted doc: ${documentId} by ${username}`);
    success(res, null);
  } catch (error) {
    logger.error('[Document] deleteDocument error:', error);
    return serverError(res);
  }
}

// ============ 文档成员管理 ============

/**
 * 获取文档成员列表
 * GET /api/documents/:documentId/members
 */
export async function getDocMembers(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { documentId } = req.params;
    const username = req.user!.username;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    // 检查文档是否存在
    const docResult = await strapiService.getDocById(documentId);
    if (!docResult.data) {
      return notFound(res, '文档不存在');
    }

    const doc = docResult.data;

    // 只有 owner 可以查看成员
    if (!permissionService.isDocOwner(doc, username)) {
      return forbidden(res, '仅文档所有者可查看成员');
    }

    const result = await strapiService.getDocUserAcls({
      'filters[docId][$eq]': doc.id,
      'pagination[page]': page,
      'pagination[pageSize]': pageSize,
    });

    paginated(res, result.data, result.meta.pagination.total, page, pageSize);
  } catch (error) {
    logger.error('[Document] getDocMembers error:', error);
    return serverError(res);
  }
}

/**
 * 批量添加文档成员
 * POST /api/documents/:documentId/members
 */
export async function addDocMembers(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { documentId } = req.params;
    const username = req.user!.username;

    const validation = batchMembersSchema.safeParse(req.body);
    if (!validation.success) {
      return badRequest(res, validation.error.errors[0].message);
    }

    // 检查文档是否存在
    const docResult = await strapiService.getDocById(documentId);
    if (!docResult.data) {
      return notFound(res, '文档不存在');
    }

    const doc = docResult.data;

    // 只有 owner 可以添加成员
    if (!permissionService.isDocOwner(doc, username)) {
      return forbidden(res, '仅文档所有者可添加成员');
    }

    const results = [];
    for (const member of validation.data.members) {
      // 检查是否已存在
      const existing = await strapiService.getDocUserAcls({
        'filters[docId][$eq]': doc.id,
        'filters[username][$eq]': member.username,
      });

      if (existing.data.length > 0) {
        // 更新现有权限
        const result = await strapiService.updateDocUserAcl(existing.data[0].documentId, {
          perm: member.perm,
          isDeleted: false,
        });
        results.push(result.data);
      } else {
        // 创建新权限
        const result = await strapiService.createDocUserAcl({
          docId: doc.id,
          username: member.username,
          perm: member.perm,
        });
        results.push(result.data);
      }
    }

    success(res, results);
  } catch (error) {
    logger.error('[Document] addDocMembers error:', error);
    return serverError(res);
  }
}

/**
 * 更新文档成员权限
 * PUT /api/documents/:documentId/members
 */
export async function updateDocMember(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { documentId } = req.params;
    const username = req.user!.username;

    const validation = updateMemberSchema.safeParse(req.body);
    if (!validation.success) {
      return badRequest(res, validation.error.errors[0].message);
    }

    // 检查文档是否存在
    const docResult = await strapiService.getDocById(documentId);
    if (!docResult.data) {
      return notFound(res, '文档不存在');
    }

    const doc = docResult.data;

    // 只有 owner 可以修改成员权限
    if (!permissionService.isDocOwner(doc, username)) {
      return forbidden(res, '仅文档所有者可修改成员权限');
    }

    // 查找成员
    const existing = await strapiService.getDocUserAcls({
      'filters[docId][$eq]': doc.id,
      'filters[username][$eq]': validation.data.username,
    });

    if (existing.data.length === 0) {
      return notFound(res, '成员不存在');
    }

    const result = await strapiService.updateDocUserAcl(existing.data[0].documentId, {
      perm: validation.data.perm,
    });

    success(res, result.data);
  } catch (error) {
    logger.error('[Document] updateDocMember error:', error);
    return serverError(res);
  }
}

/**
 * 移除文档成员
 * DELETE /api/documents/:documentId/members
 */
export async function removeDocMembers(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { documentId } = req.params;
    const username = req.user!.username;

    const validation = removeMemberSchema.safeParse(req.body);
    if (!validation.success) {
      return badRequest(res, validation.error.errors[0].message);
    }

    // 检查文档是否存在
    const docResult = await strapiService.getDocById(documentId);
    if (!docResult.data) {
      return notFound(res, '文档不存在');
    }

    const doc = docResult.data;

    // 只有 owner 可以移除成员
    if (!permissionService.isDocOwner(doc, username)) {
      return forbidden(res, '仅文档所有者可移除成员');
    }

    for (const memberUsername of validation.data.usernames) {
      const existing = await strapiService.getDocUserAcls({
        'filters[docId][$eq]': doc.id,
        'filters[username][$eq]': memberUsername,
      });

      if (existing.data.length > 0) {
        await strapiService.deleteDocUserAcl(existing.data[0].documentId);
      }
    }

    success(res, null);
  } catch (error) {
    logger.error('[Document] removeDocMembers error:', error);
    return serverError(res);
  }
}

// ============ 文档跨空间绑定 ============

/**
 * 获取文档绑定的空间
 * GET /api/documents/:documentId/spaces
 */
export async function getDocSpaces(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { documentId } = req.params;
    const username = req.user!.username;

    // 检查文档是否存在
    const docResult = await strapiService.getDocById(documentId);
    if (!docResult.data) {
      return notFound(res, '文档不存在');
    }

    const doc = docResult.data;

    // 检查查看权限
    const canView = await permissionService.canViewDoc(doc, username);
    if (!canView) {
      return forbidden(res, '无权查看此文档');
    }

    const result = await strapiService.getDocSpaceAcls({
      'filters[docId][$eq]': doc.id,
    });

    // 收集所有需要查询的 spaceId 和 folderId（统一转为数字，Strapi biginteger 返回字符串）
    const docSpaceId = Number(doc.spaceId);
    const docFolderId = Number(doc.folderId);
    const allSpaceIds = new Set<number>([docSpaceId]);
    const allFolderIds = new Set<number>();
    if (docFolderId > 0) allFolderIds.add(docFolderId);

    result.data.forEach((acl) => {
      allSpaceIds.add(Number(acl.spaceId));
      if (Number(acl.folderId) > 0) allFolderIds.add(Number(acl.folderId));
    });

    // 批量查询空间名称
    const spaceMap = new Map<number, string>();
    if (allSpaceIds.size > 0) {
      const spacesResult = await strapiService.getSpaces({
        'filters[id][$in]': Array.from(allSpaceIds),
      });
      spacesResult.data.forEach((space) => {
        spaceMap.set(Number(space.id), space.name);
      });
    }

    // 批量查询文件夹名称
    const folderMap = new Map<number, string>();
    if (allFolderIds.size > 0) {
      const foldersResult = await strapiService.getFolders({
        'filters[id][$in]': Array.from(allFolderIds),
      });
      foldersResult.data.forEach((folder) => {
        folderMap.set(Number(folder.id), folder.name);
      });
    }

    // 添加主空间信息，包含名称
    const spaces = [
      {
        spaceId: docSpaceId,
        spaceName: spaceMap.get(docSpaceId) || '',
        folderId: docFolderId,
        folderName: docFolderId > 0 ? (folderMap.get(docFolderId) || '') : '',
        isPrimary: true,
      },
      ...result.data.map((acl) => {
        const aclSpaceId = Number(acl.spaceId);
        const aclFolderId = Number(acl.folderId);
        return {
          spaceId: aclSpaceId,
          spaceName: spaceMap.get(aclSpaceId) || '',
          folderId: aclFolderId,
          folderName: aclFolderId > 0 ? (folderMap.get(aclFolderId) || '') : '',
          perm: acl.perm,
          isPrimary: false,
        };
      }),
    ];

    success(res, spaces);
  } catch (error) {
    logger.error('[Document] getDocSpaces error:', error);
    return serverError(res);
  }
}

/**
 * 绑定文档到新空间
 * POST /api/documents/:documentId/spaces
 */
export async function bindDocToSpace(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { documentId } = req.params;
    const username = req.user!.username;

    const validation = bindSpaceSchema.safeParse(req.body);
    if (!validation.success) {
      return badRequest(res, validation.error.errors[0].message);
    }

    // 检查文档是否存在
    const docResult = await strapiService.getDocById(documentId);
    if (!docResult.data) {
      return notFound(res, '文档不存在');
    }

    const doc = docResult.data;

    // 检查编辑权限
    const canEdit = await permissionService.canEditDoc(doc, username);
    if (!canEdit) {
      return forbidden(res, '无权操作此文档');
    }

    const { spaceId, folderId, perm } = validation.data;

    // 如果是同一个空间，则相当于移动目录
    if (spaceId === doc.spaceId) {
      const result = await strapiService.updateDoc(documentId, { folderId });
      return success(res, result.data);
    }

    // 检查是否已绑定
    const existing = await strapiService.getDocSpaceAcls({
      'filters[docId][$eq]': doc.id,
      'filters[spaceId][$eq]': spaceId,
    });

    if (existing.data.length > 0) {
      // 更新绑定
      const result = await strapiService.updateDocSpaceAcl(existing.data[0].documentId, {
        folderId,
        perm,
        isDeleted: false,
      });
      return success(res, result.data);
    }

    // 创建新绑定
    const result = await strapiService.createDocSpaceAcl({
      docId: doc.id,
      spaceId,
      folderId,
      perm,
    });

    success(res, result.data);
  } catch (error) {
    logger.error('[Document] bindDocToSpace error:', error);
    return serverError(res);
  }
}

/**
 * 解除文档与空间的绑定
 * DELETE /api/documents/:documentId/spaces
 */
export async function unbindDocFromSpace(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { documentId } = req.params;
    const username = req.user!.username;

    const validation = unbindSpaceSchema.safeParse(req.body);
    if (!validation.success) {
      return badRequest(res, validation.error.errors[0].message);
    }

    // 检查文档是否存在
    const docResult = await strapiService.getDocById(documentId);
    if (!docResult.data) {
      return notFound(res, '文档不存在');
    }

    const doc = docResult.data;

    // 检查编辑权限
    const canEdit = await permissionService.canEditDoc(doc, username);
    if (!canEdit) {
      return forbidden(res, '无权操作此文档');
    }

    const { spaceId } = validation.data;

    // 不能解除主空间绑定
    if (spaceId === doc.spaceId) {
      return badRequest(res, '不能解除主空间绑定');
    }

    // 查找绑定
    const existing = await strapiService.getDocSpaceAcls({
      'filters[docId][$eq]': doc.id,
      'filters[spaceId][$eq]': spaceId,
    });

    if (existing.data.length > 0) {
      await strapiService.deleteDocSpaceAcl(existing.data[0].documentId);
    }

    success(res, null);
  } catch (error) {
    logger.error('[Document] unbindDocFromSpace error:', error);
    return serverError(res);
  }
}

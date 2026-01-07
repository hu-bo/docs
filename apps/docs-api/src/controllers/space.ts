import type { Response } from 'express';
import { z } from 'zod';
import * as strapiService from '../services/strapi.js';
import * as permissionService from '../services/permission.js';
import { success, paginated, badRequest, forbidden, notFound, serverError } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { SPACE_TYPE } from '../types/index.js';

// ============ 验证 Schema ============
const createSpaceSchema = z.object({
  name: z.string().min(1).max(128),
  codeName: z.string().min(1).max(128),
  icon: z.string().optional().default(''),
  datasetId: z.string().optional().default(''),
  spaceType: z.union([z.literal(1), z.literal(2)]).optional().default(1),
});

const updateSpaceSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  icon: z.string().optional(),
  datasetId: z.string().optional(),
});

const createFolderSchema = z.object({
  name: z.string().min(1).max(128),
  parentId: z.string(),
  visibilityScope: z.enum(['ALL', 'DEPT_ONLY']).optional().default('ALL'),
  order: z.number().int().optional().default(0),
});

const updateFolderSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  visibilityScope: z.enum(['ALL', 'DEPT_ONLY']).optional(),
});

const memberSchema = z.object({
  username: z.string().min(1),
  canRead: z.boolean().optional().default(true),
  canCreateFolder: z.boolean().optional().default(false),
  canCreateDoc: z.boolean().optional().default(false),
  superAdmin: z.boolean().optional().default(false),
});

const batchMembersSchema = z.object({
  members: z.array(memberSchema).min(1),
});

const updateMemberSchema = z.object({
  username: z.string().min(1),
  canRead: z.boolean().optional(),
  canCreateFolder: z.boolean().optional(),
  canCreateDoc: z.boolean().optional(),
  superAdmin: z.boolean().optional(),
});

const removeMemberSchema = z.object({
  usernames: z.array(z.string().min(1)).min(1),
});

// ============ 空间管理 ============

/**
 * 获取空间列表
 * GET /api/spaces
 */
export async function getSpaces(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const username = req.user!.username;

    const result = await strapiService.getSpaces({
      'pagination[page]': page,
      'pagination[pageSize]': pageSize,
      'sort': 'ctime:desc',
    });
    console.log('result', result.data[0]);
    // 过滤用户有权访问的空间
    const filteredSpaces = [];
    for (const space of result.data) {
      const canRead = await permissionService.canReadSpace(space.id, username);
      if (canRead) {
        filteredSpaces.push(space);
      }
    }

    paginated(res, filteredSpaces, filteredSpaces.length, page, pageSize);
  } catch (error) {
    logger.error('[Space] getSpaces error:', error);
    return serverError(res);
  }
}

/**
 * 获取空间详情
 * GET /api/spaces/:spaceId
 */
export async function getSpaceById(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { spaceId } = req.params;
    const username = req.user!.username;

    const result = await strapiService.getSpaceById(spaceId);
    if (!result.data) {
      return notFound(res, '空间不存在');
    }

    // 检查读取权限
    const canRead = await permissionService.canReadSpace(result.data.id, username);
    if (!canRead) {
      return forbidden(res, '无权访问此空间');
    }

    success(res, result.data);
  } catch (error) {
    logger.error('[Space] getSpaceById error:', error);
    return serverError(res);
  }
}

/**
 * 创建空间
 * POST /api/spaces
 */
export async function createSpace(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const validation = createSpaceSchema.safeParse(req.body);
    if (!validation.success) {
      return badRequest(res, validation.error.errors[0].message);
    }

    const username = req.user!.username;
    const { name, codeName, icon, datasetId, spaceType } = validation.data;

    // 创建空间
    const spaceResult = await strapiService.createSpace({
      name,
      codeName,
      creator: username,
      icon,
      datasetId,
      space_type: spaceType,
    });

    if (!spaceResult.data) {
      return badRequest(res, '创建空间失败');
    }

    // 创建者成为 superAdmin
    await strapiService.createUserSpaceAuth({
      spaceId: spaceResult.data.id,
      username,
      canRead: true,
      canCreateFolder: true,
      canCreateDoc: true,
      superAdmin: true,
      source: 'MANUAL',
    });

    logger.info(`[Space] Created space: ${codeName} by ${username}`);
    success(res, spaceResult.data);
  } catch (error) {
    logger.error('[Space] createSpace error:', error);
    return serverError(res);
  }
}

/**
 * 更新空间
 * PUT /api/spaces/:spaceId
 */
export async function updateSpace(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { spaceId } = req.params;
    const username = req.user!.username;

    const validation = updateSpaceSchema.safeParse(req.body);
    if (!validation.success) {
      return badRequest(res, validation.error.errors[0].message);
    }

    // 检查空间是否存在
    const space = await strapiService.getSpaceById(spaceId);
    if (!space.data) {
      return notFound(res, '空间不存在');
    }

    // 检查 superAdmin 权限
    const isSuperAdmin = await permissionService.isSpaceSuperAdmin(space.data.id, username);
    if (!isSuperAdmin) {
      return forbidden(res, '仅空间管理员可修改');
    }

    const result = await strapiService.updateSpace(spaceId, validation.data);
    success(res, result.data);
  } catch (error) {
    logger.error('[Space] updateSpace error:', error);
    return serverError(res);
  }
}

/**
 * 删除空间（软删除）
 * DELETE /api/spaces/:spaceId
 */
export async function deleteSpace(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { spaceId } = req.params;
    const username = req.user!.username;

    // 检查空间是否存在
    const space = await strapiService.getSpaceById(spaceId);
    if (!space.data) {
      return notFound(res, '空间不存在');
    }

    // 检查 superAdmin 权限
    const isSuperAdmin = await permissionService.isSpaceSuperAdmin(space.data.id, username);
    if (!isSuperAdmin) {
      return forbidden(res, '仅空间管理员可删除');
    }

    await strapiService.deleteSpace(spaceId);
    logger.info(`[Space] Deleted space: ${spaceId} by ${username}`);
    success(res, null);
  } catch (error) {
    logger.error('[Space] deleteSpace error:', error);
    return serverError(res);
  }
}

/**
 * 检查用户对空间的访问状态
 * GET /api/spaces/:spaceId/access-status
 */
export async function checkAccessStatus(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { spaceId } = req.params;
    const username = req.user!.username;

    // 检查空间是否存在
    const space = await strapiService.getSpaceById(spaceId);
    if (!space.data) {
      return notFound(res, '空间不存在');
    }

    // 获取用户权限
    const auth = await permissionService.getUserSpaceAuth(space.data.id, username);
    const canRead = await permissionService.canReadSpace(space.data.id, username);
    const isSuperAdmin = auth?.superAdmin === true;

    success(res, {
      hasAccess: canRead,
      isSuperAdmin,
      canCreateFolder: auth?.canCreateFolder || isSuperAdmin,
      canCreateDoc: auth?.canCreateDoc || isSuperAdmin,
      auth,
    });
  } catch (error) {
    logger.error('[Space] checkAccessStatus error:', error);
    return serverError(res);
  }
}

// ============ 文件夹管理 ============

/**
 * 获取文件夹列表
 * GET /api/spaces/:spaceId/folders
 */
export async function getFolders(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { spaceId } = req.params;
    const parentFolderId = req.query.parentFolderId
      ? req.query.parentFolderId
      : undefined;
    const username = req.user!.username;

    // 检查空间是否存在
    const space = await strapiService.getSpaceById(spaceId);
    if (!space.data) {
      return notFound(res, '空间不存在');
    }

    // 检查读取权限
    const canRead = await permissionService.canReadSpace(space.data.id, username);
    if (!canRead) {
      return forbidden(res, '无权访问此空间');
    }

    const filters: Record<string, unknown> = {
      'filters[spaceId][$eq]': space.data.id,
      'sort': 'order:asc',
    };

    if (parentFolderId !== undefined) {
      filters['filters[parentId][$eq]'] = parentFolderId;
    }

    const result = await strapiService.getFolders(filters);
    success(res, result.data);
  } catch (error) {
    logger.error('[Space] getFolders error:', error);
    return serverError(res);
  }
}

/**
 * 创建文件夹
 * POST /api/spaces/:spaceId/folders
 */
export async function createFolder(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { spaceId } = req.params;
    const username = req.user!.username;

    const validation = createFolderSchema.safeParse(req.body);
    if (!validation.success) {
      return badRequest(res, validation.error.errors[0].message);
    }

    // 检查空间是否存在
    const space = await strapiService.getSpaceById(spaceId);
    if (!space.data) {
      return notFound(res, '空间不存在');
    }

    // 检查创建文件夹权限
    const canCreate = await permissionService.canCreateFolder(space.data.id, username);
    if (!canCreate) {
      return forbidden(res, '无权在此空间创建文件夹');
    }

    const result = await strapiService.createFolder({
      spaceId: space.data.id,
      ...validation.data,
    });

    success(res, result.data);
  } catch (error) {
    logger.error('[Space] createFolder error:', error);
    return serverError(res);
  }
}

/**
 * 更新文件夹
 * PUT /api/spaces/:spaceId/folders/:folderId
 */
export async function updateFolder(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { spaceId, folderId } = req.params;
    const username = req.user!.username;

    const validation = updateFolderSchema.safeParse(req.body);
    if (!validation.success) {
      return badRequest(res, validation.error.errors[0].message);
    }

    // 检查空间是否存在
    const space = await strapiService.getSpaceById(spaceId);
    if (!space.data) {
      return notFound(res, '空间不存在');
    }

    // 检查文件夹是否存在（folderId 是数字 id）
    const folder = await strapiService.getFolderByNumericId(folderId);
    if (!folder) {
      return notFound(res, '文件夹不存在');
    }

    // 检查文件夹是否属于该空间（都转为字符串比较，避免类型不一致）
    if (String(folder.spaceId) !== String(space.data.id)) {
      return badRequest(res, '文件夹不属于该空间');
    }

    // 检查权限：需要 superAdmin 或 canCreateFolder
    const canCreate = await permissionService.canCreateFolder(space.data.id, username);
    if (!canCreate) {
      return forbidden(res, '无权修改此文件夹');
    }

    const result = await strapiService.updateFolder(folder.documentId, validation.data);
    logger.info(`[Space] Updated folder: ${folderId} by ${username}`);
    success(res, result.data);
  } catch (error) {
    logger.error('[Space] updateFolder error:', error);
    return serverError(res);
  }
}

// ============ 成员管理 ============

/**
 * 获取空间成员列表
 * GET /api/spaces/:spaceId/members
 */
export async function getMembers(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { spaceId } = req.params;
    const username = req.user!.username;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    // 检查空间是否存在
    const space = await strapiService.getSpaceById(spaceId);
    if (!space.data) {
      return notFound(res, '空间不存在');
    }

    // 检查 superAdmin 权限
    const isSuperAdmin = await permissionService.isSpaceSuperAdmin(space.data.id, username);
    if (!isSuperAdmin) {
      return forbidden(res, '仅空间管理员可查看成员');
    }

    const result = await strapiService.getUserSpaceAuths({
      'filters[spaceId][$eq]': space.data.id,
      'pagination[page]': page,
      'pagination[pageSize]': pageSize,
    });

    paginated(res, result.data, result.meta.pagination.total, page, pageSize);
  } catch (error) {
    logger.error('[Space] getMembers error:', error);
    return serverError(res);
  }
}

/**
 * 批量添加成员
 * POST /api/spaces/:spaceId/members
 */
export async function addMembers(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { spaceId } = req.params;
    const username = req.user!.username;

    const validation = batchMembersSchema.safeParse(req.body);
    if (!validation.success) {
      return badRequest(res, validation.error.errors[0].message);
    }

    // 检查空间是否存在
    const space = await strapiService.getSpaceById(spaceId);
    if (!space.data) {
      return notFound(res, '空间不存在');
    }

    // 检查 superAdmin 权限
    const isSuperAdmin = await permissionService.isSpaceSuperAdmin(space.data.id, username);
    if (!isSuperAdmin) {
      return forbidden(res, '仅空间管理员可添加成员');
    }

    const results = [];
    for (const member of validation.data.members) {
      // 检查是否已存在
      const existing = await strapiService.getUserSpaceAuths({
        'filters[spaceId][$eq]': space.data.id,
        'filters[username][$eq]': member.username,
      });

      if (existing.data.length > 0) {
        // 更新现有权限
        const result = await strapiService.updateUserSpaceAuth(existing.data[0].documentId, {
          canRead: member.canRead,
          canCreateFolder: member.canCreateFolder,
          canCreateDoc: member.canCreateDoc,
          superAdmin: member.superAdmin,
          isDeleted: false,
        });
        results.push(result.data);
      } else {
        // 创建新权限
        const result = await strapiService.createUserSpaceAuth({
          spaceId: space.data.id,
          username: member.username,
          canRead: member.canRead,
          canCreateFolder: member.canCreateFolder,
          canCreateDoc: member.canCreateDoc,
          superAdmin: member.superAdmin,
          source: 'MANUAL',
        });
        results.push(result.data);
      }
    }

    success(res, results);
  } catch (error) {
    logger.error('[Space] addMembers error:', error);
    return serverError(res);
  }
}

/**
 * 更新成员权限
 * PUT /api/spaces/:spaceId/members
 */
export async function updateMember(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { spaceId } = req.params;
    const username = req.user!.username;

    const validation = updateMemberSchema.safeParse(req.body);
    if (!validation.success) {
      return badRequest(res, validation.error.errors[0].message);
    }

    // 检查空间是否存在
    const space = await strapiService.getSpaceById(spaceId);
    if (!space.data) {
      return notFound(res, '空间不存在');
    }

    // 检查 superAdmin 权限
    const isSuperAdmin = await permissionService.isSpaceSuperAdmin(space.data.id, username);
    if (!isSuperAdmin) {
      return forbidden(res, '仅空间管理员可修改成员权限');
    }

    // 查找成员
    const existing = await strapiService.getUserSpaceAuths({
      'filters[spaceId][$eq]': space.data.id,
      'filters[username][$eq]': validation.data.username,
    });

    if (existing.data.length === 0) {
      return notFound(res, '成员不存在');
    }

    const { username: _, ...updateData } = validation.data;
    const result = await strapiService.updateUserSpaceAuth(existing.data[0].documentId, updateData);
    success(res, result.data);
  } catch (error) {
    logger.error('[Space] updateMember error:', error);
    return serverError(res);
  }
}

/**
 * 移除成员
 * DELETE /api/spaces/:spaceId/members
 */
export async function removeMembers(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { spaceId } = req.params;
    const username = req.user!.username;

    const validation = removeMemberSchema.safeParse(req.body);
    if (!validation.success) {
      return badRequest(res, validation.error.errors[0].message);
    }

    // 检查空间是否存在
    const space = await strapiService.getSpaceById(spaceId);
    if (!space.data) {
      return notFound(res, '空间不存在');
    }

    // 检查 superAdmin 权限
    const isSuperAdmin = await permissionService.isSpaceSuperAdmin(space.data.id, username);
    if (!isSuperAdmin) {
      return forbidden(res, '仅空间管理员可移除成员');
    }

    for (const memberUsername of validation.data.usernames) {
      const existing = await strapiService.getUserSpaceAuths({
        'filters[spaceId][$eq]': space.data.id,
        'filters[username][$eq]': memberUsername,
      });

      if (existing.data.length > 0) {
        await strapiService.deleteUserSpaceAuth(existing.data[0].documentId);
      }
    }

    success(res, null);
  } catch (error) {
    logger.error('[Space] removeMembers error:', error);
    return serverError(res);
  }
}

// ============ 个人空间 ============

/**
 * 获取或创建当前用户的个人空间
 * GET /api/spaces/personal
 * 如果不存在则自动创建
 */
export async function getOrCreatePersonalSpace(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const username = req.user!.username;

    // 查找用户的个人空间
    const existingSpaces = await strapiService.getSpaces({
      'filters[creator][$eq]': username,
      'filters[space_type][$eq]': SPACE_TYPE.PERSONAL,
      'pagination[pageSize]': 1,
    });

    if (existingSpaces.data.length > 0) {
      // 已有个人空间，直接返回
      return success(res, existingSpaces.data[0]);
    }

    // 创建个人空间
    const spaceResult = await strapiService.createSpace({
      name: `${username}的个人空间`,
      codeName: `personal_${username}`,
      creator: username,
      icon: '',
      datasetId: '',
      space_type: SPACE_TYPE.PERSONAL,
    });

    if (!spaceResult.data) {
      return badRequest(res, '创建个人空间失败');
    }

    // 创建者成为 superAdmin
    await strapiService.createUserSpaceAuth({
      spaceId: spaceResult.data.id,
      username,
      canRead: true,
      canCreateFolder: true,
      canCreateDoc: true,
      superAdmin: true,
      source: 'AUTO_INIT',
    });

    logger.info(`[Space] Created personal space for user: ${username}`);
    success(res, spaceResult.data);
  } catch (error) {
    logger.error('[Space] getOrCreatePersonalSpace error:', error);
    return serverError(res);
  }
}

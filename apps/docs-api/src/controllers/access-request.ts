import type { Response } from 'express';
import { z } from 'zod';
import * as strapiService from '../services/strapi.js';
import * as permissionService from '../services/permission.js';
import { success, paginated, badRequest, forbidden, notFound, serverError } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import type { AuthenticatedRequest } from '../types/index.js';

// ============ 验证 Schema ============
const applyAccessSchema = z.object({
  type: z.enum(['space', 'doc']),
  targetId: z.string(),
  requestedPerm: z.string().min(1),
  reason: z.string().optional().default(''),
});

const approveAccessSchema = z.object({
  requestId: z.string().min(1), // documentId
  approved: z.boolean(),
});

// ============ 权限申请 ============

/**
 * 申请权限
 * POST /api/access/apply
 */
export async function applyAccess(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const validation = applyAccessSchema.safeParse(req.body);
    if (!validation.success) {
      return badRequest(res, validation.error.errors[0].message);
    }

    const username = req.user!.username;
    const { type, targetId, requestedPerm, reason } = validation.data;

    if (type === 'space') {
      // 检查空间是否存在
      const spaces = await strapiService.getSpaces({
        'filters[id][$eq]': targetId,
      });

      if (spaces.data.length === 0) {
        return notFound(res, '空间不存在');
      }

      // 检查是否已有权限
      const existingAuth = await permissionService.getUserSpaceAuth(targetId, username);
      if (existingAuth) {
        return badRequest(res, '您已有此空间的权限');
      }

      // 检查是否已有待审批的申请
      const existingRequest = await strapiService.getAccessRequests({
        'filters[type][$eq]': 'SPACE',
        'filters[targetId][$eq]': targetId,
        'filters[username][$eq]': username,
        'filters[status][$eq]': 'PENDING',
      });

      if (existingRequest.data.length > 0) {
        return badRequest(res, '您已有待审批的申请');
      }

      // 创建申请记录
      const result = await strapiService.createAccessRequest({
        type: 'SPACE',
        targetId,
        username,
        requestedPerm,
        reason,
        status: 'PENDING',
      });

      logger.info(`[AccessRequest] User ${username} applied for space ${targetId}`);
      success(res, { message: '申请已提交，等待管理员审批', request: result.data });
    } else if (type === 'doc') {
      // 检查文档是否存在
      const docs = await strapiService.getDocs({
        'filters[id][$eq]': targetId,
      });

      if (docs.data.length === 0) {
        return notFound(res, '文档不存在');
      }

      // 检查是否已有权限
      const existingAcl = await permissionService.getDocUserAcl(targetId, username);
      if (existingAcl) {
        return badRequest(res, '您已有此文档的权限');
      }

      // 检查是否已有待审批的申请
      const existingRequest = await strapiService.getAccessRequests({
        'filters[type][$eq]': 'DOC',
        'filters[targetId][$eq]': targetId,
        'filters[username][$eq]': username,
        'filters[status][$eq]': 'PENDING',
      });

      if (existingRequest.data.length > 0) {
        return badRequest(res, '您已有待审批的申请');
      }

      // 创建申请记录
      const result = await strapiService.createAccessRequest({
        type: 'DOC',
        targetId,
        username,
        requestedPerm,
        reason,
        status: 'PENDING',
      });

      logger.info(`[AccessRequest] User ${username} applied for doc ${targetId}`);
      success(res, { message: '申请已提交，等待管理员审批', request: result.data });
    } else {
      return badRequest(res, '无效的申请类型');
    }
  } catch (error) {
    logger.error('[AccessRequest] applyAccess error:', error);
    return serverError(res);
  }
}

/**
 * 获取待审批申请列表
 * GET /api/access/pending-requests
 */
export async function getPendingRequests(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const username = req.user!.username;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    // 获取用户管理的所有空间
    const userAuths = await strapiService.getUserSpaceAuths({
      'filters[username][$eq]': username,
      'filters[superAdmin][$eq]': true,
      'filters[isDeleted][$eq]': false,
    });

    if (userAuths.data.length === 0) {
      return paginated(res, [], 0, page, pageSize);
    }

    // 获取用户管理的空间ID列表
    const managedSpaceIds = userAuths.data.map(auth => auth.spaceId);

    // 查询这些空间的待审批申请
    const pendingRequests = await strapiService.getAccessRequests({
      'filters[type][$eq]': 'SPACE',
      'filters[targetId][$in]': managedSpaceIds,
      'filters[status][$eq]': 'PENDING',
      'filters[isDeleted][$eq]': false,
      'pagination[page]': page,
      'pagination[pageSize]': pageSize,
      'sort': 'ctime:desc',
    });

    // 同时查询文档申请（需要检查文档所在空间）
    // 先获取用户管理空间下的所有文档
    const docsInManagedSpaces = await strapiService.getDocs({
      'filters[spaceId][$in]': managedSpaceIds,
      'filters[isDeleted][$eq]': false,
    });

    const docIds = docsInManagedSpaces.data.map(doc => doc.id);

    let docRequests: typeof pendingRequests.data = [];
    if (docIds.length > 0) {
      const docPendingRequests = await strapiService.getAccessRequests({
        'filters[type][$eq]': 'DOC',
        'filters[targetId][$in]': docIds,
        'filters[status][$eq]': 'PENDING',
        'filters[isDeleted][$eq]': false,
      });
      docRequests = docPendingRequests.data;
    }

    // 合并结果
    const allRequests = [...pendingRequests.data, ...docRequests];
    const total = pendingRequests.meta.pagination.total + docRequests.length;

    logger.debug(`[AccessRequest] Found ${total} pending requests for spaces managed by ${username}`);

    paginated(res, allRequests, total, page, pageSize);
  } catch (error) {
    logger.error('[AccessRequest] getPendingRequests error:', error);
    return serverError(res);
  }
}

/**
 * 审批权限申请
 * PUT /api/access/approve
 */
export async function approveAccess(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const validation = approveAccessSchema.safeParse(req.body);
    if (!validation.success) {
      return badRequest(res, validation.error.errors[0].message);
    }

    const username = req.user!.username;
    const { requestId, approved } = validation.data;

    // 获取申请记录
    const requestResult = await strapiService.getAccessRequestById(requestId);
    if (!requestResult.data) {
      return notFound(res, '申请记录不存在');
    }

    const accessRequest = requestResult.data;

    // 检查申请状态
    if (accessRequest.status !== 'PENDING') {
      return badRequest(res, '该申请已被处理');
    }

    // 验证审批权限
    if (accessRequest.type === 'SPACE') {
      const isSuperAdmin = await permissionService.isSpaceSuperAdmin(accessRequest.targetId, username);
      if (!isSuperAdmin) {
        return forbidden(res, '仅空间管理员可审批');
      }
    } else if (accessRequest.type === 'DOC') {
      // 检查文档所在空间的管理权限
      const docs = await strapiService.getDocs({
        'filters[id][$eq]': accessRequest.targetId,
      });
      if (docs.data.length === 0) {
        return notFound(res, '关联文档不存在');
      }
      const doc = docs.data[0];
      const isSuperAdmin = await permissionService.isSpaceSuperAdmin(doc.spaceId, username);
      const isOwner = permissionService.isDocOwner(doc, username);
      if (!isSuperAdmin && !isOwner) {
        return forbidden(res, '仅空间管理员或文档所有者可审批');
      }
    }

    const now = new Date().toISOString();

    if (!approved) {
      // 拒绝申请
      await strapiService.updateAccessRequest(requestId, {
        status: 'REJECTED',
        reviewedBy: username,
        reviewedAt: now,
      });
      logger.info(`[AccessRequest] Request ${requestId} rejected by ${username}`);
      return success(res, { message: '申请已拒绝' });
    }

    // 通过申请
    if (accessRequest.type === 'SPACE') {
      // 检查是否已有权限记录
      const existing = await strapiService.getUserSpaceAuths({
        'filters[spaceId][$eq]': accessRequest.targetId,
        'filters[username][$eq]': accessRequest.username,
      });

      if (existing.data.length > 0) {
        // 更新权限
        await strapiService.updateUserSpaceAuth(existing.data[0].documentId, {
          canRead: true,
          canCreateFolder: true,
          canCreateDoc: true,
          isDeleted: false,
        });
      } else {
        // 创建权限
        await strapiService.createUserSpaceAuth({
          spaceId: accessRequest.targetId,
          username: accessRequest.username,
          canRead: true,
          canCreateFolder: true,
          canCreateDoc: true,
          superAdmin: false,
          source: 'MANUAL',
        });
      }

      // 更新申请状态
      await strapiService.updateAccessRequest(requestId, {
        status: 'APPROVED',
        reviewedBy: username,
        reviewedAt: now,
      });

      logger.info(`[AccessRequest] Space request ${requestId} approved by ${username}`);
      success(res, { message: '空间权限申请已通过' });
    } else if (accessRequest.type === 'DOC') {
      // 解析申请的权限
      const permValue = (accessRequest.requestedPerm === 'EDIT' ? 'EDIT' : 'READ') as 'READ' | 'EDIT';

      // 检查是否已有权限记录
      const existing = await strapiService.getDocUserAcls({
        'filters[docId][$eq]': accessRequest.targetId,
        'filters[username][$eq]': accessRequest.username,
      });

      if (existing.data.length > 0) {
        // 更新权限
        await strapiService.updateDocUserAcl(existing.data[0].documentId, {
          perm: permValue,
          isDeleted: false,
        });
      } else {
        // 创建权限
        await strapiService.createDocUserAcl({
          docId: accessRequest.targetId,
          username: accessRequest.username,
          perm: permValue,
        });
      }

      // 更新申请状态
      await strapiService.updateAccessRequest(requestId, {
        status: 'APPROVED',
        reviewedBy: username,
        reviewedAt: now,
      });

      logger.info(`[AccessRequest] Doc request ${requestId} approved by ${username}`);
      success(res, { message: '文档权限申请已通过' });
    } else {
      return badRequest(res, '无效的申请类型');
    }
  } catch (error) {
    logger.error('[AccessRequest] approveAccess error:', error);
    return serverError(res);
  }
}

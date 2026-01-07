import type { Response } from 'express';
import { z } from 'zod';
import * as strapiService from '../services/strapi.js';
import * as permissionService from '../services/permission.js';
import { success, paginated, badRequest, forbidden, notFound, serverError } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import type { AuthenticatedRequest } from '../types/index.js';

// ============ 验证 Schema ============
const createCommentSchema = z.object({
  docId: z.string(),
  parentId: z.string(),
  content: z.string().min(1),
});

const updateCommentSchema = z.object({
  content: z.string().min(1),
});

// ============ 评论管理 ============

/**
 * 获取文档评论（含回复）
 * GET /api/comments/:documentId
 */
export async function getCommentsByDocId(
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

    // 检查查看权限
    const canView = await permissionService.canViewDoc(doc, username);
    if (!canView) {
      return forbidden(res, '无权查看此文档');
    }

    // 获取顶级评论
    const result = await strapiService.getComments({
      'filters[docId][$eq]': doc.id,
      'filters[parentId][$eq]': 0,
      'pagination[page]': page,
      'pagination[pageSize]': pageSize,
      'sort': 'ctime:desc',
    });

    // 获取每个顶级评论的回复
    const commentsWithReplies = await Promise.all(
      result.data.map(async (comment) => {
        const replies = await strapiService.getComments({
          'filters[docId][$eq]': doc.id,
          'filters[parentId][$eq]': comment.id,
          'sort': 'ctime:asc',
        });
        return {
          ...comment,
          replies: replies.data,
        };
      })
    );

    paginated(res, commentsWithReplies, result.meta.pagination.total, page, pageSize);
  } catch (error) {
    logger.error('[Comment] getCommentsByDocId error:', error);
    return serverError(res);
  }
}

/**
 * 创建评论
 * POST /api/comments
 */
export async function createComment(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const validation = createCommentSchema.safeParse(req.body);
    if (!validation.success) {
      return badRequest(res, validation.error.errors[0].message);
    }

    const username = req.user!.username;
    const { docId, parentId, content } = validation.data;

    // 检查文档是否存在（通过 id 而不是 documentId）
    const docs = await strapiService.getDocs({
      'filters[id][$eq]': docId,
    });

    if (docs.data.length === 0) {
      return notFound(res, '文档不存在');
    }

    const doc = docs.data[0];

    // 检查查看权限（有查看权限才能评论）
    const canView = await permissionService.canViewDoc(doc, username);
    if (!canView) {
      return forbidden(res, '无权评论此文档');
    }

    // 如果是回复，检查父评论是否存在
    if (Number(parentId) > 0) {
      const parentComments = await strapiService.getComments({
        'filters[id][$eq]': parentId,
        'filters[docId][$eq]': docId,
      });

      if (parentComments.data.length === 0) {
        return notFound(res, '父评论不存在');
      }
    }

    const result = await strapiService.createComment({
      docId,
      parentId,
      username,
      content,
    });

    logger.info(`[Comment] Created comment on doc ${docId} by ${username}`);
    success(res, result.data);
  } catch (error) {
    logger.error('[Comment] createComment error:', error);
    return serverError(res);
  }
}

/**
 * 更新评论
 * PUT /api/comments/:commentId
 */
export async function updateComment(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { commentId } = req.params;
    const username = req.user!.username;

    const validation = updateCommentSchema.safeParse(req.body);
    if (!validation.success) {
      return badRequest(res, validation.error.errors[0].message);
    }

    // 检查评论是否存在
    const commentResult = await strapiService.getCommentById(commentId);
    if (!commentResult.data) {
      return notFound(res, '评论不存在');
    }

    const comment = commentResult.data;

    // 只有作者可以修改评论
    if (!permissionService.isCommentAuthor(comment.username, username)) {
      return forbidden(res, '仅评论作者可修改');
    }

    const result = await strapiService.updateComment(commentId, {
      content: validation.data.content,
    });

    success(res, result.data);
  } catch (error) {
    logger.error('[Comment] updateComment error:', error);
    return serverError(res);
  }
}

/**
 * 删除评论（软删除）
 * DELETE /api/comments/:commentId
 */
export async function deleteComment(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { commentId } = req.params;
    const username = req.user!.username;

    // 检查评论是否存在
    const commentResult = await strapiService.getCommentById(commentId);
    if (!commentResult.data) {
      return notFound(res, '评论不存在');
    }

    const comment = commentResult.data;

    // 只有作者可以删除评论
    if (!permissionService.isCommentAuthor(comment.username, username)) {
      return forbidden(res, '仅评论作者可删除');
    }

    await strapiService.deleteComment(commentId);
    logger.info(`[Comment] Deleted comment ${commentId} by ${username}`);
    success(res, null);
  } catch (error) {
    logger.error('[Comment] deleteComment error:', error);
    return serverError(res);
  }
}

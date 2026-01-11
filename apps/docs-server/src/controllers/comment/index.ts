import type { Response } from 'express'
import { permissionService } from '../../services/permission'
import { commentService } from '../../services/comment'
import { successResponse, paginated, forbidden, notFound, errorResponse } from '../../utils/response'
import { logger } from '../../utils/logger'
import type { AuthenticatedRequest } from '../../types/index'
import { createCommentSchema, updateCommentSchema, commentQuerySchema } from '../../schemas/comment'

/**
 * 获取文档评论（含回复）
 */
export async function getDocComments(req: AuthenticatedRequest, res: Response) {
    try {
        const documentId = req.params.documentId
        const { page, pageSize } = commentQuerySchema.parse(req.query)
        const username = req.user!.username

        // 检查文档读权限
        const perm = await permissionService.getDocPermission({username, docId: documentId})
        if (!perm.canRead) {
            return forbidden(res, '无权访问此文档')
        }

        const { comments, total } = await commentService.getDocComments({ documentId, page, pageSize })
        return paginated(res, comments, total, page, pageSize)
    } catch (error) {
        return errorResponse(res, error)
    }
}

/**
 * 创建评论
 */
export async function createComment(req: AuthenticatedRequest, res: Response) {
    try {
        const input = createCommentSchema.parse(req.body)
        const username = req.user!.username

        // 检查文档读权限（有读权限即可评论）
        const perm = await permissionService.getDocPermission({username, docId: input.docId})
        if (!perm.canRead) {
            return forbidden(res, '无权访问此文档')
        }

        // 如果是回复，检查父评论是否存在
        console.log('input.parentId', input.parentId);
        if (input.parentId) {
            const parentComment = await commentService.getParentComment({ parentId: input.parentId, docId: input.docId })
            if (!parentComment) {
                return notFound(res, '父评论不存在')
            }
        }

        const comment = await commentService.createComment({ ...input, username })

        logger.info(`[Comment] Created comment ${comment.id} on doc ${input.docId} by ${username}`)
        return successResponse(res, comment)
    } catch (error) {
        return errorResponse(res, error)
    }
}

/**
 * 更新评论
 */
export async function updateComment(req: AuthenticatedRequest, res: Response) {
    try {
        const commentId = req.params.commentId
        const { content } = updateCommentSchema.parse(req.body)
        const username = req.user!.username

        const comment = await commentService.getCommentById(commentId)
        if (!comment) {
            return notFound(res, '评论不存在')
        }

        // 只有作者可以修改评论
        if (comment.username !== username) {
            return forbidden(res, '只有评论作者可以修改评论')
        }

        const updated = await commentService.updateComment(commentId, content)

        logger.info(`[Comment] Updated comment ${commentId} by ${username}`)
        return successResponse(res, updated)
    } catch (error) {
        return errorResponse(res, error)
    }
}

/**
 * 删除评论
 */
export async function deleteComment(req: AuthenticatedRequest, res: Response) {
    try {
        const commentId = req.params.commentId
        const username = req.user!.username

        const comment = await commentService.getCommentById(commentId)
        if (!comment) {
            return notFound(res, '评论不存在')
        }

        // 检查是否是作者或空间超管
        const isAuthor = comment.username === username
        const docPerm = await permissionService.getDocPermission({ username, docId: comment.docId })
        const canDelete = isAuthor || docPerm.isSuperAdmin

        if (!canDelete) {
            return forbidden(res, '只有评论作者或空间管理员可以删除评论')
        }

        await commentService.deleteComment(commentId)

        logger.info(`[Comment] Deleted comment ${commentId} by ${username}`)
        return successResponse(res, null)
    } catch (error) {
        return errorResponse(res, error)
    }
}

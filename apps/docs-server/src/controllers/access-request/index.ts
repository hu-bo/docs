import type { Response } from 'express'
import { AccessRequestStatus } from '../../entities/AccessRequest.js'
import { accessRequestService } from '../../services/access-request.js'
import { successResponse, paginated, forbidden, notFound, badRequest, errorResponse } from '../../utils/response.js'
import { logger } from '../../utils/logger.js'
import type { AuthenticatedRequest } from '../../types/index.js'
import { applyAccessSchema, approveAccessSchema } from '../../schemas/access-request.js'
import { paginationSchema } from '../../schemas/space.js'

/**
 * 申请权限
 */
export async function applyAccess(req: AuthenticatedRequest, res: Response) {
    try {
        const input = applyAccessSchema.parse(req.body)
        const username = req.user!.username

        // 目前只支持文档权限申请
        if (input.type !== 'DOC') {
            return badRequest(res, '暂只支持文档权限申请')
        }

        // 检查文档是否存在
        const doc = await accessRequestService.getDocById(input.targetId)
        if (!doc) {
            return notFound(res, '文档不存在')
        }

        // 检查是否已有待审批的申请
        if (await accessRequestService.hasPendingRequest('DOC' as any, input.targetId, username)) {
            return badRequest(res, '您已有待审批的权限申请')
        }

        // 检查是否已有权限
        if (await accessRequestService.hasDocAcl(input.targetId, username)) {
            return badRequest(res, '您已有此文档的访问权限')
        }

        const request = await accessRequestService.createAccessRequest(input, username)

        logger.info(`[AccessRequest] User ${username} applied for ${input.type} ${input.targetId}`)
        return successResponse(res, request)
    } catch (error) {
        logger.error('[AccessRequest] applyAccess error:', error)
        return errorResponse(res, error)
    }
}

/**
 * 获取待审批申请列表
 */
export async function getPendingRequests(req: AuthenticatedRequest, res: Response) {
    try {
        const username = req.user!.username
        const { page, pageSize } = paginationSchema.parse(req.query)

        // 获取用户创建的文档ID列表
        const myDocIds = await accessRequestService.getUserDocIds(username)

        if (myDocIds.length === 0) {
            return paginated(res, [], 0, page, pageSize)
        }

        const { requests, total } = await accessRequestService.getPendingRequests(myDocIds, page, pageSize)
        return paginated(res, requests, total, page, pageSize)
    } catch (error) {
        logger.error('[AccessRequest] getPendingRequests error:', error)
        return errorResponse(res, error)
    }
}

/**
 * 审批权限申请
 */
export async function approveAccess(req: AuthenticatedRequest, res: Response) {
    try {
        const input = approveAccessSchema.parse(req.body)
        const username = req.user!.username

        const request = await accessRequestService.getAccessRequestById(input.requestId)
        if (!request) {
            return notFound(res, '申请不存在')
        }

        if (request.status !== AccessRequestStatus.PENDING) {
            return badRequest(res, '该申请已被处理')
        }

        // 检查审批权限（文档作者才能审批）
        const doc = await accessRequestService.getDocById(request.targetId)
        if (!doc) {
            return notFound(res, '文档不存在')
        }

        if (doc.owner !== username) {
            return forbidden(res, '只有文档作者可以审批权限申请')
        }

        const updated = await accessRequestService.approveRequest(request, input.approved, input.perm, username)

        logger.info(`[AccessRequest] Request ${input.requestId} ${input.approved ? 'approved' : 'rejected'} by ${username}`)
        return successResponse(res, updated)
    } catch (error) {
        logger.error('[AccessRequest] approveAccess error:', error)
        return errorResponse(res, error)
    }
}

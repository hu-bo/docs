import type { Response } from 'express'
import { z } from 'zod'
import { signCollabToken } from '../../websocket/index'
import { permissionService } from '../../services/permission'
import { documentService } from '../../services/document'
import { successResponse, forbidden, notFound, errorResponse } from '../../utils/response'
import type { AuthenticatedRequest } from '../../types/index'

// 请求协作token的schema
const collabTokenSchema = z.object({
    docId: z.string()
})

/**
 * 获取协作Token
 * POST /api/collab/token
 */
export async function getCollabToken(req: AuthenticatedRequest, res: Response) {
    try {
        const { docId } = collabTokenSchema.parse(req.body)
        const username = req.user!.username

        // 检查文档是否存在
        const doc = await documentService.getDocById(docId)
        if (!doc) {
            return notFound(res, '文档不存在')
        }

        // 检查用户权限
        const perm = await permissionService.getDocPermission({ username, doc })

        if (!perm.canRead) {
            return forbidden(res, '无权访问此文档')
        }

        // 签发协作token
        const token = signCollabToken({
            sub: username,
            name: req.user!.department || username,
            docId,
            role: perm.canEdit ? 'editor' : 'reader'
        })
        return successResponse(res, {
            token,
            docName: `doc_${docId}`,
            role: perm.canEdit ? 'editor' : 'reader',
            wsUrl: `/collab` // 前端需要拼接完整URL
        })
    } catch (error) {
        return errorResponse(res, error)
    }
}

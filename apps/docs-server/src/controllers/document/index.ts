import type { Response } from 'express'
import { DocPerm } from '../../entities/DocUserAcl'
import { DocSpacePerm } from '../../entities/DocSpaceAcl'
import { permissionService } from '../../services/permission'
import { documentService } from '../../services/document'
import { successResponse, paginated, forbidden, notFound, badRequest, errorResponse } from '../../utils/response'
import { logger } from '../../utils/logger'
import type { AuthenticatedRequest } from '../../types/index'
import {
    documentIdParamSchema,
    documentSpaceIdParamSchema,
    createDocumentSchema,
    updateDocumentSchema,
    moveDocumentSchema,
    addDocMembersSchema,
    updateDocMemberSchema,
    bindDocSpaceSchema,
    docRecentSchema
} from '../../schemas/document'
import { paginationSchema } from '../../schemas/space'

/**
 * 获取用户最近访问的文档
 */
export async function getRecentDocuments(req: AuthenticatedRequest, res: Response) {
    try {
        const username = req.user!.username
        const { limit } = docRecentSchema.parse(req.query)

        const docs = await documentService.getRecentDocuments(username, {
            limit: Number(limit),
            // spaceId
        })
        return successResponse(res, docs)
    } catch (error) {
        return errorResponse(res, error)
    }
}

/**
 * 获取用户参与的文档（在文档白名单 DocUserAcl 中的文档）
 */
export async function getParticipatedDocuments(req: AuthenticatedRequest, res: Response) {
    try {
        const username = req.user!.username
        const { limit } = docRecentSchema.parse(req.query)

        const docs = await documentService.getParticipatedDocuments(username, {
            limit: Number(limit),
        })
        return successResponse(res, docs)
    } catch (error) {
        return errorResponse(res, error)
    }
}

/**
 * 获取文档详情
 */
export async function getDocument(req: AuthenticatedRequest, res: Response) {
    try {
        const { documentId } = documentIdParamSchema.parse(req.params)
        const shareCode = req.query.shareCode as string | undefined
        const username = req.user!.username

        const doc = await documentService.getDocById(documentId)
        if (!doc) {
            return notFound(res, '文档不存在')
        }

        // TODO: 如果有 shareCode，验证分享码（暂不实现分享码逻辑）
        if (shareCode) {
            // 分享码验证逻辑
            // 这里只做只读访问，不写入 ACL
        }

        const perm = await permissionService.getDocPermission({ username, doc })
        if (!perm.canRead) {
            return forbidden(res, '无权访问此文档')
        }

        // 更新访问记录
        await documentService.updateDocActivity({ docId: documentId, username, action: 'view' })

        return successResponse(res, {
            ...doc,
            perm: {
                canRead: perm.canRead,
                canEdit: perm.canEdit,
                isOwner: perm.isOwner,
                isSuperAdmin: perm.isSuperAdmin
            }
        })
    } catch (error) {
        return errorResponse(res, error)
    }
}

/**
 * 创建文档
 */
export async function createDocument(req: AuthenticatedRequest, res: Response) {
    try {
        const input = createDocumentSchema.parse(req.body)
        const username = req.user!.username

        // 检查空间创建文档权限
        const spacePerm = await permissionService.getSpacePermission({username, spaceId: input.spaceId})
        if (!spacePerm.canCreateDoc && !spacePerm.isSuperAdmin) {
            return forbidden(res, '无权在此空间创建文档')
        }

        // 检查目录可见性
        if (input.folderId) {
            const canView = await permissionService.canViewFolder(username, input.folderId)
            if (!canView) {
                return forbidden(res, '无权访问此目录')
            }
        }

        const doc = await documentService.createDocument({ ...input, username })

        logger.info(`[Document] Created document ${doc.id} in space ${input.spaceId} by ${username}`)
        return successResponse(res, doc)
    } catch (error) {
        return errorResponse(res, error)
    }
}

/**
 * 更新文档
 */
export async function updateDocument(req: AuthenticatedRequest, res: Response) {
    try {
        const { documentId } = documentIdParamSchema.parse(req.params)
        const input = updateDocumentSchema.parse(req.body)
        const username = req.user!.username

        const doc = await documentService.getDocById(documentId)
        if (!doc) {
            return notFound(res, '文档不存在')
        }

        const perm = await permissionService.getDocPermission({username, docId: documentId})
        if (!perm.canEdit) {
            return forbidden(res, '无权编辑此文档')
        }

        const updated = await documentService.updateDocument(documentId, input)

        // 更新编辑记录
        await documentService.updateDocActivity({ docId: documentId, username, action: 'edit' })

        logger.info(`[Document] Updated document ${documentId} by ${username}`)
        return successResponse(res, updated)
    } catch (error) {
        return errorResponse(res, error)
    }
}

/**
 * 删除文档（软删除）
 */
export async function deleteDocument(req: AuthenticatedRequest, res: Response) {
    try {
        const { documentId } = documentIdParamSchema.parse(req.params)
        const username = req.user!.username

        const perm = await permissionService.getDocPermission({username, docId: documentId})
        if (!perm.canEdit) {
            return forbidden(res, '无权删除此文档')
        }

        await documentService.deleteDocument(documentId)

        logger.info(`[Document] Deleted document ${documentId} by ${username}`)
        return successResponse(res, null)
    } catch (error) {
        return errorResponse(res, error)
    }
}

/**
 * 移动文档到其他目录
 */
export async function moveDocument(req: AuthenticatedRequest, res: Response) {
    try {
        const { documentId } = documentIdParamSchema.parse(req.params)
        const { folderId } = moveDocumentSchema.parse(req.body)
        const username = req.user!.username

        const perm = await permissionService.getDocPermission({username, docId: documentId})
        if (!perm.canEdit) {
            return forbidden(res, '无权移动此文档')
        }

        const docFolder = await documentService.getDocFolder(documentId)
        if (!docFolder) {
            return notFound(res, '文档位置信息不存在')
        }

        // 检查目标目录可见性
        if (folderId) {
            const canView = await permissionService.canViewFolder(username, folderId)
            if (!canView) {
                return forbidden(res, '无权访问目标目录')
            }
        }

        await documentService.moveDocument({ documentId, folderId })

        logger.info(`[Document] Moved document ${documentId} to folder ${folderId} by ${username}`)
        return successResponse(res, null)
    } catch (error) {
        return errorResponse(res, error)
    }
}

/**
 * 接受分享并写入 doc_user_acl
 */
export async function acceptShare(req: AuthenticatedRequest, res: Response) {
    try {
        const { documentId } = documentIdParamSchema.parse(req.params)
        const username = req.user!.username

        const doc = await documentService.getDocById(documentId)
        if (!doc) {
            return notFound(res, '文档不存在')
        }

        // TODO: 验证分享码，根据分享码类型决定权限
        // 暂时默认给 READ 权限

        const existing = await documentService.getDocUserAcl({ documentId, username })
        if (existing) {
            return successResponse(res, existing)
        }

        const acl = await documentService.createDocUserAcl({ documentId, username, perm: DocPerm.READ })

        logger.info(`[Document] User ${username} accepted share for document ${documentId}`)
        return successResponse(res, acl)
    } catch (error) {
        return errorResponse(res, error)
    }
}

// ========== 文档成员管理 ==========

/**
 * 获取文档成员列表
 */
export async function getDocMembers(req: AuthenticatedRequest, res: Response) {
    try {
        const { documentId } = documentIdParamSchema.parse(req.params)
        const username = req.user!.username
        const isOwnerOrAdmin = await permissionService.isDocOwnerOrSuperAdmin(username, documentId)
        if (!isOwnerOrAdmin) {
            return forbidden(res, '只有文档所有者或空间管理员可以查看成员列表')
        }

        const members = await documentService.getDocMembers({ documentId })
        return successResponse(res, members)
    } catch (error) {

        return errorResponse(res, error)
    }
}

/**
 * 批量添加文档成员
 */
export async function addDocMembers(req: AuthenticatedRequest, res: Response) {
    try {
        const { documentId } = documentIdParamSchema.parse(req.params)
        const { members } = addDocMembersSchema.parse(req.body)
        const username = req.user!.username

        const isOwnerOrAdmin = await permissionService.isDocOwnerOrSuperAdmin(username, documentId)
        if (!isOwnerOrAdmin) {
            return forbidden(res, '只有文档所有者或空间管理员可以添加成员')
        }

        const added = await documentService.addDocMembers({ documentId, members })

        logger.info(`[Document] Added ${added.length} members to document ${documentId} by ${username}`)
        return successResponse(res, added)
    } catch (error) {

        return errorResponse(res, error)
    }
}

/**
 * 更新文档成员权限
 */
export async function updateDocMember(req: AuthenticatedRequest, res: Response) {
    try {
        const { documentId } = documentIdParamSchema.parse(req.params)
        const memberUsername = req.params.username
        const { perm } = updateDocMemberSchema.parse(req.body)
        const username = req.user!.username

        const isOwnerOrAdmin = await permissionService.isDocOwnerOrSuperAdmin(username, documentId)
        if (!isOwnerOrAdmin) {
            return forbidden(res, '只有文档所有者或空间管理员可以修改成员权限')
        }

        const acl = await documentService.updateDocMember({ documentId, username: memberUsername, perm: perm as DocPerm })
        if (!acl) {
            return notFound(res, '成员不存在')
        }

        logger.info(`[Document] Updated member ${memberUsername} perm in document ${documentId} by ${username}`)
        return successResponse(res, acl)
    } catch (error) {

        return errorResponse(res, error)
    }
}

/**
 * 移除文档成员
 */
export async function removeDocMember(req: AuthenticatedRequest, res: Response) {
    try {
        const { documentId } = documentIdParamSchema.parse(req.params)
        const memberUsername = req.params.username
        const username = req.user!.username

        const isOwnerOrAdmin = await permissionService.isDocOwnerOrSuperAdmin(username, documentId)
        if (!isOwnerOrAdmin) {
            return forbidden(res, '只有文档所有者或空间管理员可以移除成员')
        }

        await documentService.removeDocMember({ documentId, username: memberUsername })

        logger.info(`[Document] Removed member ${memberUsername} from document ${documentId} by ${username}`)
        return successResponse(res, null)
    } catch (error) {
        return errorResponse(res, error)
    }
}

// ========== 文档跨空间绑定 ==========

/**
 * 获取文档绑定的空间列表
 */
export async function getDocSpaces(req: AuthenticatedRequest, res: Response) {
    try {
        const { documentId } = documentIdParamSchema.parse(req.params)
        const username = req.user!.username

        const isOwnerOrAdmin = await permissionService.isDocOwnerOrSuperAdmin(username, documentId)
        if (!isOwnerOrAdmin) {
            return forbidden(res, '只有文档所有者或空间管理员可以查看绑定空间')
        }

        const bindings = await documentService.getDocSpaces(documentId)
        return successResponse(res, bindings)
    } catch (error) {

        return errorResponse(res, error)
    }
}

/**
 * 绑定文档到新空间
 */
export async function bindDocToSpace(req: AuthenticatedRequest, res: Response) {
    try {
        const { documentId } = documentIdParamSchema.parse(req.params)
        const { spaceId, folderId = '', perm } = bindDocSpaceSchema.parse(req.body)
        const username = req.user!.username

        const isOwnerOrAdmin = await permissionService.isDocOwnerOrSuperAdmin(username, documentId)
        if (!isOwnerOrAdmin) {
            return forbidden(res, '只有文档所有者或空间管理员可以绑定空间')
        }

        if (await documentService.isDocBoundToSpace({ documentId, spaceId })) {
            return badRequest(res, '文档已绑定到此空间')
        }

        const acl = await documentService.bindDocToSpace({ documentId, spaceId, folderId, perm: perm as DocSpacePerm })

        logger.info(`[Document] Bound document ${documentId} to space ${spaceId} by ${username}`)
        return successResponse(res, acl)
    } catch (error) {

        return errorResponse(res, error)
    }
}

/**
 * 解除文档与空间的绑定
 */
export async function unbindDocFromSpace(req: AuthenticatedRequest, res: Response) {
    try {
        const { documentId, spaceId } = documentSpaceIdParamSchema.parse(req.params)
        const username = req.user!.username

        const isOwnerOrAdmin = await permissionService.isDocOwnerOrSuperAdmin(username, documentId)
        if (!isOwnerOrAdmin) {
            return forbidden(res, '只有文档所有者或空间管理员可以解除绑定')
        }

        await documentService.unbindDocFromSpace({ documentId, spaceId })

        logger.info(`[Document] Unbound document ${documentId} from space ${spaceId} by ${username}`)
        return successResponse(res, null)
    } catch (error) {

        return errorResponse(res, error)
    }
}

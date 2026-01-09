import type { Response } from 'express'
import { permissionService } from '../../services/permission'
import { spaceFolderService } from '../../services/space-folder'
import { successResponse, paginated, forbidden, notFound, badRequest, errorResponse } from '../../utils/response'
import { logger } from '../../utils/logger'
import type { AuthenticatedRequest } from '../../types/index'
import {
    createFolderSchema,
    updateFolderSchema,
    folderDocumentsQuerySchema,
    folderTreeQuerySchema
} from '../../schemas/space-folder'

/**
 * 获取目录下的文档列表
 */
export async function getFolderDocuments(req: AuthenticatedRequest, res: Response) {
    try {
        const { spaceId, folderId, page, pageSize } = folderDocumentsQuerySchema.parse(req.query)
        const username = req.user!.username

        // 检查空间读权限
        const spacePerm = await permissionService.getSpacePermission(username, spaceId)
        if (!spacePerm.canRead) {
            return forbidden(res, '无权访问此空间')
        }

        // 检查目录可见性
        if (folderId !== '0') {
            const canView = await permissionService.canViewFolder(username, folderId)
            if (!canView) {
                return forbidden(res, '无权访问此目录')
            }
        }

        // 获取可见目录ID列表
        const visibleFolderIds = await permissionService.getVisibleFolderIds(username, spaceId)

        // 如果请求的folderId不在可见列表中（且不是根目录），返回403
        if (folderId !== '0' && !visibleFolderIds.includes(folderId)) {
            return forbidden(res, '无权访问此目录')
        }

        const { docs, total } = await spaceFolderService.getFolderDocuments(spaceId, folderId, username, page, pageSize)
        return paginated(res, docs, total, page, pageSize)
    } catch (error) {

        return errorResponse(res, error)
    }
}

/**
 * 获取目录树（懒加载）
 */
export async function getFolderTree(req: AuthenticatedRequest, res: Response) {
    try {
        const { spaceId, folderId } = folderTreeQuerySchema.parse(req.query)
        const username = req.user!.username

        // 检查空间读权限
        const spacePerm = await permissionService.getSpacePermission(username, spaceId)
        if (!spacePerm.canRead) {
            return forbidden(res, '无权访问此空间')
        }

        // 检查目录可见性
        if (folderId !== '0') {
            const canView = await permissionService.canViewFolder(username, folderId)
            if (!canView) {
                return forbidden(res, '无权访问此目录')
            }
        }

        // 获取可见目录ID列表
        const visibleFolderIds = await permissionService.getVisibleFolderIds(username, spaceId)

        const data = await spaceFolderService.getFolderTreeData(spaceId, folderId, username, visibleFolderIds)
        return successResponse(res, data)
    } catch (error) {

        return errorResponse(res, error)
    }
}

/**
 * 创建目录
 */
export async function createFolder(req: AuthenticatedRequest, res: Response) {
    try {
        const input = createFolderSchema.parse(req.body)
        const username = req.user!.username

        // 检查创建目录权限
        const spacePerm = await permissionService.getSpacePermission(username, input.spaceId)
        if (!spacePerm.canCreateFolder && !spacePerm.isSuperAdmin) {
            return forbidden(res, '无权在此空间创建目录')
        }

        // 如果有父目录，检查父目录是否存在且可见
        if (input.parentId !== '0') {
            const parentFolder = await spaceFolderService.getParentFolder(input.parentId, input.spaceId)
            if (!parentFolder) {
                return notFound(res, '父目录不存在')
            }

            const canView = await permissionService.canViewFolder(username, input.parentId)
            if (!canView) {
                return forbidden(res, '无权访问父目录')
            }
        }

        const folder = await spaceFolderService.createFolder(input)

        logger.info(`[SpaceFolder] Created folder ${folder.id} in space ${input.spaceId} by ${username}`)
        return successResponse(res, folder)
    } catch (error) {

        return errorResponse(res, error)
    }
}

/**
 * 更新目录
 */
export async function updateFolder(req: AuthenticatedRequest, res: Response) {
    try {
        const folderId = req.params.folderId
        const input = updateFolderSchema.parse(req.body)
        const username = req.user!.username

        const folder = await spaceFolderService.getFolderById(folderId)
        if (!folder) {
            return notFound(res, '目录不存在')
        }

        // 检查权限
        const spacePerm = await permissionService.getSpacePermission(username, folder.spaceId)
        if (!spacePerm.canCreateFolder && !spacePerm.isSuperAdmin) {
            return forbidden(res, '无权修改此目录')
        }

        // 如果修改父目录，检查新父目录
        if (input.parentId !== undefined && input.parentId !== folder.parentId) {
            if (input.parentId !== '0') {
                const newParent = await spaceFolderService.getParentFolder(input.parentId, folder.spaceId)
                if (!newParent) {
                    return notFound(res, '新父目录不存在')
                }
                // 防止循环引用
                if (input.parentId === folderId) {
                    return badRequest(res, '不能将目录移动到自身')
                }
            }
        }

        const updated = await spaceFolderService.updateFolder(folderId, input)

        logger.info(`[SpaceFolder] Updated folder ${folderId} by ${username}`)
        return successResponse(res, updated)
    } catch (error) {

        return errorResponse(res, error)
    }
}

/**
 * 删除目录（软删除）
 */
export async function deleteFolder(req: AuthenticatedRequest, res: Response) {
    try {
        const folderId = req.params.folderId
        const username = req.user!.username

        const folder = await spaceFolderService.getFolderById(folderId)
        if (!folder) {
            return notFound(res, '目录不存在')
        }

        // 检查权限
        const spacePerm = await permissionService.getSpacePermission(username, folder.spaceId)
        if (!spacePerm.isSuperAdmin) {
            return forbidden(res, '只有空间管理员可以删除目录')
        }

        await spaceFolderService.deleteFolder(folderId)

        logger.info(`[SpaceFolder] Deleted folder ${folderId} by ${username}`)
        return successResponse(res, null)
    } catch (error) {

        return errorResponse(res, error)
    }
}

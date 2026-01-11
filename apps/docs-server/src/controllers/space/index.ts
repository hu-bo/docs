import type { Response } from 'express'
import { permissionService } from '../../services/permission'
import { spaceService } from '../../services/space'
import { successResponse, paginated, forbidden, notFound, badRequest, errorResponse } from '../../utils/response'
import { logger } from '../../utils/logger'
import type { AuthenticatedRequest } from '../../types/index'
import {
    createSpaceSchema,
    updateSpaceSchema,
    addMembersSchema,
    updateMemberSchema,
    paginationSchema
} from '../../schemas/space'

/**
 * 获取社区空间列表
 */
export async function getSpaces(req: AuthenticatedRequest, res: Response) {
    try {
        const { page, pageSize } = paginationSchema.parse(req.query)
        const { spaces, total } = await spaceService.getCommunitySpaces({ page, pageSize })
        return paginated(res, spaces, total, page, pageSize)
    } catch (error) {
        return errorResponse(res, error)
    }
}

/**
 * 获取个人空间
 */
export async function getPersonalSpace(req: AuthenticatedRequest, res: Response) {
    try {
        const username = req.user!.username
        const space = await spaceService.getOrCreatePersonalSpace(username)
        return successResponse(res, space)
    } catch (error) {
        logger.error('Error getting/creating personal space:', error)
        return errorResponse(res, error)
    }
}

/**
 * 获取我参与的空间列表
 */
export async function getJoinedSpaces(req: AuthenticatedRequest, res: Response) {
    try {
        const username = req.user!.username
        const { page, pageSize } = paginationSchema.parse(req.query)
        const { spaces, total } = await spaceService.getJoinedSpaces({ username, page, pageSize })
        return paginated(res, spaces, total, page, pageSize)
    } catch (error) {
        return errorResponse(res, error)
    }
}

/**
 * 获取空间详情
 */
export async function getSpaceDetail(req: AuthenticatedRequest, res: Response) {
    try {
        const spaceId = req.params.spaceId
        const username = req.user!.username

        const space = await spaceService.getSpaceById(spaceId)
        if (!space) {
            return notFound(res, '空间不存在')
        }

        const perm = await permissionService.getSpacePermission({username, space: space})
        if (!perm.canRead) {
            return forbidden(res, '无权访问此空间')
        }

        return successResponse(res, { ...space, permission: perm })
    } catch (error) {

        return errorResponse(res, error)
    }
}

/**
 * 创建空间
 */
export async function createSpace(req: AuthenticatedRequest, res: Response) {
    try {

        const input = createSpaceSchema.parse(req.body)
        const username = req.user!.username
        // 检查 codeName 是否重复
        if (await spaceService.isCodeNameExists(input.codeName)) {
            return badRequest(res, '空间代号已存在')
        }
        const space = await spaceService.createSpace({ ...input, username, deptId: String(input.deptId) })
        return successResponse(res, space)
    } catch (error) {
        logger.error('Error creating space:', error)
        return errorResponse(res, error)
    }
}

/**
 * 更新空间
 */
export async function updateSpace(req: AuthenticatedRequest, res: Response) {
    try {
        const spaceId = req.params.spaceId
        const input = updateSpaceSchema.parse(req.body)
        const username = req.user!.username

        const isSuperAdmin = await permissionService.isSpaceSuperAdmin(username, spaceId)
        if (!isSuperAdmin) {
            return forbidden(res, '只有空间管理员可以修改空间')
        }

        const space = await spaceService.updateSpace(spaceId, input)
        if (!space) {
            return notFound(res, '空间不存在')
        }

        logger.info(`[Space] Updated space ${spaceId} by ${username}`)
        return successResponse(res, space)
    } catch (error) {

        return errorResponse(res, error)
    }
}

/**
 * 删除空间（软删除）
 */
export async function deleteSpace(req: AuthenticatedRequest, res: Response) {
    try {
        const spaceId = req.params.spaceId
        const username = req.user!.username

        const isSuperAdmin = await permissionService.isSpaceSuperAdmin(username, spaceId)
        if (!isSuperAdmin) {
            return forbidden(res, '只有空间管理员可以删除空间')
        }

        await spaceService.deleteSpace(spaceId)

        logger.info(`[Space] Deleted space ${spaceId} by ${username}`)
        return successResponse(res, null)
    } catch (error) {

        return errorResponse(res, error)
    }
}

/**
 * 获取空间文件夹列表
 */
export async function getSpaceFolders(req: AuthenticatedRequest, res: Response) {
    try {
        const spaceId = req.params.spaceId
        const parentFolderId = (req.query.parentFolderId as string) || ''
        const username = req.user!.username

        const perm = await permissionService.getSpacePermission({username, spaceId: spaceId})
        if (!perm.canRead) {
            return forbidden(res, '无权访问此空间')
        }

        const visibleIds = await permissionService.getVisibleFolderIds(username, spaceId)
        const folders = await spaceService.getSpaceFolders({ spaceId, parentFolderId, visibleIds })

        return successResponse(res, folders)
    } catch (error) {

        return errorResponse(res, error)
    }
}

/**
 * 同步部门权限
 */
export async function syncFromSpaceDept(req: AuthenticatedRequest, res: Response) {
    try {
        const username = req.user!.username
        const deptId = req.user!.deptId

        if (!deptId) {
            return successResponse(res, { synced: 0 })
        }

        const synced = await spaceService.syncFromSpaceDept({ username, deptId: String(deptId) })

        logger.info(`[Space] Synced ${synced} space permissions for ${username}`)
        return successResponse(res, { synced })
    } catch (error) {

        return errorResponse(res, error)
    }
}

// ========== 成员管理 ==========

/**
 * 获取空间成员列表
 */
export async function getSpaceMembers(req: AuthenticatedRequest, res: Response) {
    try {
        const spaceId = req.params.spaceId
        const username = req.user!.username

        const isSuperAdmin = await permissionService.isSpaceSuperAdmin(username, spaceId)
        if (!isSuperAdmin) {
            return forbidden(res, '只有空间管理员可以查看成员列表')
        }

        const members = await spaceService.getSpaceMembers({ spaceId })
        return successResponse(res, members)
    } catch (error) {

        return errorResponse(res, error)
    }
}

/**
 * 批量添加成员
 */
export async function addSpaceMembers(req: AuthenticatedRequest, res: Response) {
    try {
        const spaceId = req.params.spaceId
        const { members } = addMembersSchema.parse(req.body)
        const username = req.user!.username

        const isSuperAdmin = await permissionService.isSpaceSuperAdmin(username, spaceId)
        if (!isSuperAdmin) {
            return forbidden(res, '只有空间管理员可以添加成员')
        }

        const added = await spaceService.addSpaceMembers({ spaceId, members })

        logger.info(`[Space] Added ${added.length} members to space ${spaceId} by ${username}`)
        return successResponse(res, added)
    } catch (error) {

        return errorResponse(res, error)
    }
}

/**
 * 更新成员权限
 */
export async function updateSpaceMember(req: AuthenticatedRequest, res: Response) {
    try {
        const spaceId = req.params.spaceId
        const memberUsername = req.params.username
        const input = updateMemberSchema.parse(req.body)
        const username = req.user!.username

        const isSuperAdmin = await permissionService.isSpaceSuperAdmin(username, spaceId)
        if (!isSuperAdmin) {
            return forbidden(res, '只有空间管理员可以修改成员权限')
        }

        const auth = await spaceService.updateSpaceMember({ spaceId, username: memberUsername, input })
        if (!auth) {
            return notFound(res, '成员不存在')
        }

        logger.info(`[Space] Updated member ${memberUsername} in space ${spaceId} by ${username}`)
        return successResponse(res, auth)
    } catch (error) {

        return errorResponse(res, error)
    }
}

/**
 * 移除成员
 */
export async function removeSpaceMember(req: AuthenticatedRequest, res: Response) {
    try {
        const spaceId = req.params.spaceId
        const memberUsername = req.params.username
        const username = req.user!.username

        const isSuperAdmin = await permissionService.isSpaceSuperAdmin(username, spaceId)
        if (!isSuperAdmin) {
            return forbidden(res, '只有空间管理员可以移除成员')
        }

        await spaceService.removeSpaceMember({ spaceId, username: memberUsername })

        logger.info(`[Space] Removed member ${memberUsername} from space ${spaceId} by ${username}`)
        return successResponse(res, null)
    } catch (error) {

        return errorResponse(res, error)
    }
}

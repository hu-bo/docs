import { getDataSource } from '../config/dataSource'
import { strapiClient } from '../tools/strapi/strapiClient'
import { Space } from '../entities/Space'
import { SpaceDept } from '../entities/SpaceDept'
import { UserSpaceAuth, AuthSource } from '../entities/UserSpaceAuth'
import { SpaceFolder } from '../entities/SpaceFolder'
import { Doc } from '../entities/Doc'
import { DocFolder } from '../entities/DocFolder'
import { SpaceType } from '../types/index'
import { In } from 'typeorm'
import { DocSpaceAcl } from '../entities'
import { logger } from '../utils/logger'

export interface SpaceWithStats extends Space {
    docCount: number
    folderCount: number
}

export interface CreateSpaceInput {
    name: string
    codeName: string
    description?: string
    icon?: string
    spaceType?: SpaceType
}

export interface UpdateSpaceInput {
    name?: string
    description?: string
    icon?: string
}

export interface AddMemberInput {
    username: string
    canRead?: number
    canCreateFolder?: number
    canCreateDoc?: number
    superAdmin?: number
}

export interface UpdateMemberInput {
    canRead?: number
    canCreateFolder?: number
    canCreateDoc?: number
    superAdmin?: number
}

class SpaceService {
    /**
     * 获取空间的文档统计信息
     */
    async getSpaceDocStats(spaceId: string): Promise<{ docCount: number; folderCount: number }> {
        const docCount = await getDataSource()
            .getRepository(DocSpaceAcl)
            .count({
                where: { spaceId }
            })
        const folderCount = await getDataSource()
            .getRepository(SpaceFolder)
            .count({
                where: { spaceId }
            })

        return { docCount, folderCount }
    }

    /**
     * 获取社区空间列表（带分页）
     */
    async getCommunitySpaces(page: number, pageSize: number): Promise<{ spaces: SpaceWithStats[]; total: number }> {

        const [spaces, total] = await getDataSource()
        .getRepository(Space)
        .findAndCount({
            where: { isDeleted: 0, spaceType: SpaceType.COMMUNITY },
            order: { mtime: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize
        })

        const spaceData: SpaceWithStats[] = spaces as SpaceWithStats[]
        const allPromises = []
        for (const space of spaces) {
            allPromises.push(this.getSpaceDocStats(space.documentId))
        }
        const statsArray = await Promise.all(allPromises)
        for (let i = 0; i < spaceData.length; i++) {
            spaceData[i].docCount = statsArray[i].docCount
            spaceData[i].folderCount = statsArray[i].folderCount
        }
        return { spaces: spaceData, total }
    }

    /**
     * 获取或创建个人空间
     */
    async getOrCreatePersonalSpace(username: string): Promise<SpaceWithStats> {
        const ds = getDataSource()

        let space = await ds.getRepository(Space).findOne({
            where: { creator: username, spaceType: SpaceType.PERSONAL, isDeleted: 0 }
        })

        if (!space) {
            // 通过 Strapi 创建空间
            const spaceResult = await strapiClient.create<Space>('spaces', {
                name: `${username}的个人空间`,
                codeName: `personal_${username}_${Date.now()}`,
                creator: username,
                space_type: SpaceType.PERSONAL,
                isDeleted: false
            })
            const spaceId = spaceResult.data.documentId

            // 通过 Strapi 创建用户空间权限
            await strapiClient.create<any>('user-space-auths', {
                spaceId: spaceResult.data.documentId,
                username,
                canRead: true,
                canCreateFolder: true,
                canCreateDoc: true,
                superAdmin: true,
                source: AuthSource.AUTO_INIT
            })

            // 重新查询获取完整数据
            space = await ds.getRepository(Space).findOne({
                where: { documentId: spaceId }
            })
        }

        const stats = await this.getSpaceDocStats(space!.documentId)
        return { ...space!, ...stats }
    }

    /**
     * 获取用户参与的空间列表
     */
    async getJoinedSpaces(username: string, page: number, pageSize: number): Promise<{ spaces: SpaceWithStats[]; total: number }> {
        const ds = getDataSource()

        const auths = await ds.getRepository(UserSpaceAuth).find({
            where: { username }
        })
        const spaceIds = auths.map(a => a.spaceId)

        if (spaceIds.length === 0) {
            return { spaces: [], total: 0 }
        }

        const [spaces, total] = await ds.getRepository(Space).findAndCount({
            where: { documentId: In(spaceIds), isDeleted: 0 },
            order: { mtime: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize
        })

        const spaceData = await Promise.all(
            spaces.map(async (space) => {
                const stats = await this.getSpaceDocStats(space.documentId)
                return { ...space, ...stats }
            })
        )

        return { spaces: spaceData, total }
    }

    /**
     * 获取空间详情
     */
    async getSpaceById(spaceId: string): Promise<Space | null> {
        const ds = getDataSource()
        return ds.getRepository(Space).findOne({
            where: { documentId: spaceId, isDeleted: 0 }
        })
    }

    /**
     * 检查 codeName 是否存在
     */
    async isCodeNameExists(codeName: string): Promise<boolean> {
        const ds = getDataSource()
        const existing = await ds.getRepository(Space).findOne({
            where: { codeName, isDeleted: 0 }
        })
        return !!existing
    }

    /**
     * 创建空间
     */
    async createSpace(input: CreateSpaceInput, username: string, deptId: string): Promise<Space> {
        const ds = getDataSource()

        // 通过 Strapi 创建空间
        const spaceResult = await strapiClient.create<Space>('spaces', {
            name: input.name,
            codeName: input.codeName,
            creator: username,
            icon: input.icon || '',
            spaceType: input.spaceType ?? SpaceType.COMMUNITY,
            isDeleted: false,
            datasetId: ''
        })
        const spaceId = spaceResult.data.documentId

        // 通过 Strapi 创建者成为 superAdmin
        await strapiClient.create<UserSpaceAuth>('user-space-auths', {
            spaceId: spaceResult.data.documentId,
            username,
            canRead: true,
            canCreateFolder: true,
            canCreateDoc: true,
            superAdmin: true,
            source: AuthSource.MANUAL
        })

        // 写入 space_dept
        if (deptId) {
            await strapiClient.create<SpaceDept>('space-depts', {
                space_id: spaceResult.data.documentId,
                dept_id: deptId
            })
        } else {
            console.warn('No deptId provided, skipping space_dept creation', spaceResult.data.creator)
        }

        // 重新查询获取完整数据
        const space = await ds.getRepository(Space).findOne({
            where: { documentId: spaceId }
        })

        return space!
    }

    /**
     * 更新空间
     */
    async updateSpace(spaceId: string, input: UpdateSpaceInput): Promise<Space | null> {
        const ds = getDataSource()
        const space = await ds.getRepository(Space).findOne({
            where: { documentId: spaceId, isDeleted: 0 }
        })

        if (!space) {
            return null
        }

        // 通过 Strapi 更新空间
        await strapiClient.update<Space>('spaces', space.documentId, input as Record<string, unknown>)

        // 重新查询获取完整数据
        const updatedSpace = await ds.getRepository(Space).findOne({
            where: { documentId: spaceId }
        })
        return updatedSpace
    }

    /**
     * 删除空间（软删除）
     */
    async deleteSpace(spaceId: string): Promise<void> {
        const ds = getDataSource()
        const space = await ds.getRepository(Space).findOne({
            where: { documentId: spaceId }
        })

        if (space) {
            // 通过 Strapi 软删除空间
            await strapiClient.update<any>('spaces', space.documentId, { isDeleted: true })
        }
    }

    /**
     * 获取空间下的文件夹
     */
    async getSpaceFolders(spaceId: string, parentFolderId: string, visibleIds: string[]): Promise<SpaceFolder[]> {
        const ds = getDataSource()
        const folders = await ds.getRepository(SpaceFolder).find({
            where: { spaceId, parentId: parentFolderId, isDeleted: 0 },
            order: { order: 'ASC', id: 'ASC' }
        })

        return folders.filter(f => visibleIds.includes(f.documentId))
    }

    /**
     * 同步部门权限
     */
    async syncFromSpaceDept(username: string, deptId: string): Promise<number> {
        const ds = getDataSource()

        const spaceDepts = await ds.getRepository(SpaceDept).find({
            where: { deptId }
        })

        let synced = 0
        for (const sd of spaceDepts) {
            const existing = await ds.getRepository(UserSpaceAuth).findOne({
                where: { spaceId: sd.spaceId, username }
            })

            if (!existing) {
                // 通过 Strapi 创建用户空间权限
                await strapiClient.create<any>('user-space-auths', {
                    spaceId: Number(sd.spaceId),
                    username,
                    canRead: true,
                    canCreateFolder: true,
                    canCreateDoc: true,
                    superAdmin: false,
                    source: AuthSource.AUTO_INIT
                })
                synced++
            }
        }

        return synced
    }

    /**
     * 获取空间成员列表
     */
    async getSpaceMembers(spaceId: string, page: number, pageSize: number): Promise<{ members: UserSpaceAuth[]; total: number }> {
        const ds = getDataSource()
        const [members, total] = await ds.getRepository(UserSpaceAuth).findAndCount({
            where: { spaceId },
            order: { ctime: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize
        })
        return { members, total }
    }

    /**
     * 批量添加成员
     */
    async addSpaceMembers(spaceId: string, members: AddMemberInput[]): Promise<UserSpaceAuth[]> {
        const ds = getDataSource()
        const added: UserSpaceAuth[] = []

        for (const member of members) {
            const existing = await ds.getRepository(UserSpaceAuth).findOne({
                where: { spaceId, username: member.username }
            })

            if (!existing) {
                // 通过 Strapi 创建用户空间权限
                const result = await strapiClient.create<UserSpaceAuth>('user-space-auths', {
                    spaceId: Number(spaceId),
                    username: member.username,
                    canRead: member.canRead === 1 || member.canRead === undefined,
                    canCreateFolder: member.canCreateFolder === 1,
                    canCreateDoc: member.canCreateDoc === 1,
                    superAdmin: member.superAdmin === 1,
                    source: AuthSource.MANUAL
                })

                // 查询新创建的记录
                const auth = await ds.getRepository(UserSpaceAuth).findOne({
                    where: { documentId: result.data.documentId }
                })
                if (auth) {
                    added.push(auth)
                }
            }
        }

        return added
    }

    /**
     * 获取空间成员
     */
    async getSpaceMember(spaceId: string, username: string): Promise<UserSpaceAuth | null> {
        const ds = getDataSource()
        return ds.getRepository(UserSpaceAuth).findOne({
            where: { spaceId, username }
        })
    }

    /**
     * 更新成员权限
     */
    async updateSpaceMember(spaceId: string, username: string, input: UpdateMemberInput): Promise<UserSpaceAuth | null> {
        const ds = getDataSource()
        const auth = await ds.getRepository(UserSpaceAuth).findOne({
            where: { spaceId, username }
        })

        if (!auth) {
            return null
        }

        // 转换为 Strapi 格式的 boolean
        const strapiInput: Record<string, unknown> = {}
        if (input.canRead !== undefined) strapiInput.canRead = input.canRead === 1
        if (input.canCreateFolder !== undefined) strapiInput.canCreateFolder = input.canCreateFolder === 1
        if (input.canCreateDoc !== undefined) strapiInput.canCreateDoc = input.canCreateDoc === 1
        if (input.superAdmin !== undefined) strapiInput.superAdmin = input.superAdmin === 1

        // 通过 Strapi 更新
        await strapiClient.update<any>('user-space-auths', auth.documentId, strapiInput)

        // 重新查询获取完整数据
        const updatedAuth = await ds.getRepository(UserSpaceAuth).findOne({
            where: { spaceId, username }
        })
        return updatedAuth
    }

    /**
     * 移除成员
     */
    async removeSpaceMember(spaceId: string, username: string): Promise<void> {
        const ds = getDataSource()
        const auth = await ds.getRepository(UserSpaceAuth).findOne({
            where: { spaceId, username }
        })

        if (auth) {
            // 通过 Strapi 删除
            await strapiClient.delete('user-space-auths', auth.documentId)
        }
    }
}

export const spaceService = new SpaceService()

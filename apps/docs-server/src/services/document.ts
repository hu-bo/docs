import { getDataSource } from '../config/dataSource'
import { strapiClient } from '../tools/strapi/strapiClient'
import { Doc, AccessMode } from '../entities/Doc'
import { DocFolder } from '../entities/DocFolder'
import { DocUserAcl, DocPerm } from '../entities/DocUserAcl'
import { DocSpaceAcl, DocSpacePerm } from '../entities/DocSpaceAcl'
import { SpaceFolder } from '../entities/SpaceFolder'
import { DocUserActivity } from '../entities/DocUserActivity'
import { logger } from '../utils/logger'
import { spaceFolderService } from './space-folder'

export interface CreateDocumentInput {
    spaceId: string
    folderId: string
    parentId?: string
    title: string
    content?: string
    accessMode?: string
    tags?: string[]
    username: string
}

export interface UpdateDocumentInput {
    title?: string
    content?: string
    accessMode?: string
    tags?: string
}

export interface AddDocMemberInput {
    username: string
    perm: string
}

export interface UpdateDocActivityInput {
    docId: string
    username: string
    action: 'view' | 'edit'
}

export interface GetDocMembersInput {
    documentId: string
}

export interface AddDocMembersInput {
    documentId: string
    members: AddDocMemberInput[]
}

export interface UpdateDocMemberInput {
    documentId: string
    username: string
    perm: DocPerm
}

export interface RemoveDocMemberInput {
    documentId: string
    username: string
}

export interface CreateDocUserAclInput {
    documentId: string
    username: string
    perm: DocPerm
}

export interface GetDocUserAclInput {
    documentId: string
    username: string
}

export interface BindDocToSpaceInput {
    documentId: string
    spaceId: string
    folderId: string
    perm: DocSpacePerm
}

export interface UnbindDocFromSpaceInput {
    documentId: string
    spaceId: string
}

export interface IsDocBoundToSpaceInput {
    documentId: string
    spaceId: string
}

export interface MoveDocumentInput {
    documentId: string
    folderId: string
}

class DocumentService {
    /**
     * 获取用户最近访问的文档
     */
    async getRecentDocuments(username: string, options: {
         limit?: number
         spaceId?: string
    }) {
        const ds = getDataSource()
        const { limit = 100, spaceId } = options

        // 使用 relations 一次性加载关联的 doc
        const activities = await ds.getRepository(DocUserActivity).find({
            where: { username },
            relations: ['doc'],
            order: { lastViewedAt: 'DESC' },
            take: limit
        })

        if (activities.length === 0) {
            return []
        }

        // 过滤掉已删除的文档
        const validActivities = activities.filter(a => a.doc && a.doc.isDeleted === 0)
        const docIds = validActivities.map(a => a.docId)

        if (docIds.length === 0) {
            return []
        }

        // 使用 relations 加载空间信息
        const docSpaceAcls = await ds.getRepository(DocSpaceAcl).find({
            where: docIds.map(id => ({ docId: id })),
            relations: ['space']
        })

        // 构建 docId -> spaceDocumentId 映射（取第一个）
        const docSpaceMap = new Map<string, string>()
        for (const acl of docSpaceAcls) {
            if (!docSpaceMap.has(acl.docId) && acl.space) {
                docSpaceMap.set(acl.docId, acl.space.documentId)
            }
        }

        const result = validActivities.map(activity => ({
            ...activity.doc,
            spaceId: docSpaceMap.get(activity.docId) || null,
            lastViewedAt: activity.lastViewedAt,
            lastEditedAt: activity.lastEditedAt,
            visitCount: activity.visitCount
        }))

        return result
    }

    /**
     * 获取用户参与的文档（在 DocUserAcl 白名单中的文档）
     */
    async getParticipatedDocuments(username: string, options: {
        limit?: number
    }) {
        const ds = getDataSource()
        const { limit = 100 } = options

        // 使用 relations 一次性加载关联的 doc
        const acls = await ds.getRepository(DocUserAcl).find({
            where: { username },
            relations: ['doc'],
            order: { ctime: 'DESC' },
            take: limit
        })

        if (acls.length === 0) {
            return []
        }

        // 过滤掉已删除的文档
        const validAcls = acls.filter(a => a.doc && a.doc.isDeleted === 0)
        const docIds = validAcls.map(a => a.docId)

        if (docIds.length === 0) {
            return []
        }

        // 使用 relations 加载空间信息
        const docSpaceAcls = await ds.getRepository(DocSpaceAcl).find({
            where: docIds.map(id => ({ docId: id })),
            relations: ['space']
        })

        // 构建 docId -> space 信息映射（取第一个）
        const docSpaceMap = new Map<string, { spaceId: string; spaceName: string }>()
        for (const acl of docSpaceAcls) {
            if (!docSpaceMap.has(acl.docId) && acl.space) {
                docSpaceMap.set(acl.docId, {
                    spaceId: acl.space.documentId,
                    spaceName: acl.space.name
                })
            }
        }

        const result = validAcls.map(acl => {
            const spaceInfo = docSpaceMap.get(acl.docId)
            return {
                ...acl.doc,
                spaceId: spaceInfo?.spaceId || null,
                spaceName: spaceInfo?.spaceName || null,
                perm: acl.perm
            }
        })

        return result
    }

    /**
     * 获取文档
     */
    async getDocById(documentId: string): Promise<Doc | null> {
        const ds = getDataSource()
        return ds.getRepository(Doc).findOne({
            where: { documentId: documentId, isDeleted: 0 }
        })
    }

    /**
     * 创建文档
     */
    async createDocument(input: CreateDocumentInput): Promise<Doc> {
        const { username } = input
        const ds = getDataSource()

        // 通过 Strapi 创建文档
        const docResult = await strapiClient.create<Doc>('docs', {
            title: input.title,
            content: input.content || '',
            accessMode: input.accessMode || AccessMode.OPEN_READONLY,
            owner: username,
            tags: input.tags ? JSON.stringify(input.tags) : '[]',
            isDeleted: false
        })
        const docId = docResult.data.documentId

        // 如果没有指定 folderId，获取空间根目录
        let folderId = input.folderId
        if (!folderId) {
            const rootFolder = await ds.getRepository(SpaceFolder).findOne({
                where: { spaceId: input.spaceId, parentId: '' }
            })
            if (rootFolder) {
                folderId = rootFolder.documentId
            }
        }

        // 通过 Strapi 创建文档-目录关联
        await strapiClient.create<DocFolder>('doc-folders', {
            docId: docId,
            folderId: folderId || ''
        })

        // 通过 Strapi 创建文档-空间ACL（默认READ权限）
        await strapiClient.create<DocSpaceAcl>('doc-space-acls', {
            docId: docResult.data.documentId,
            spaceId: input.spaceId,
            perm: DocSpacePerm.READ
        })

        // 重新查询获取完整数据
        const doc = await ds.getRepository(Doc).findOne({
            where: { documentId: docId }
        })

        return doc!
    }

    /**
     * 更新文档
     */
    async updateDocument(documentId: string, input: UpdateDocumentInput): Promise<Doc | null> {
        const ds = getDataSource()

        const doc = await ds.getRepository(Doc).findOne({
            where: { documentId: documentId, isDeleted: 0 }
        })

        if (!doc) {
            return null
        }

        // 构建 Strapi 更新数据
        const strapiInput: Record<string, unknown> = {}
        if (input.title !== undefined) strapiInput.title = input.title
        if (input.content !== undefined) strapiInput.content = input.content
        if (input.accessMode !== undefined) strapiInput.accessMode = input.accessMode
        if (input.tags !== undefined) strapiInput.tags = input.tags

        // 通过 Strapi 更新
        await strapiClient.update<Doc>('docs', doc.documentId, strapiInput)

        // 重新查询获取完整数据
        const updatedDoc = await ds.getRepository(Doc).findOne({
            where: { documentId: documentId }
        })
        return updatedDoc
    }

    /**
     * 删除文档（软删除）
     */
    async deleteDocument(documentId: string): Promise<void> {
        const ds = getDataSource()
        const doc = await ds.getRepository(Doc).findOne({
            where: { documentId: documentId }
        })

        if (doc) {
            // 通过 Strapi 软删除
            await strapiClient.update<Doc>('docs', doc.documentId, { isDeleted: true })
        }
    }

    /**
     * 获取文档位置信息
     */
    async getDocFolder(documentId: string): Promise<DocFolder | null> {
        const ds = getDataSource()
        return ds.getRepository(DocFolder).findOne({
            where: { docId: documentId }
        })
    }

    /**
     * 移动文档到其他目录
     */
    async moveDocument(input: MoveDocumentInput): Promise<void> {
        const { documentId, folderId } = input
        const ds = getDataSource()
        const docFolder = await ds.getRepository(DocFolder).findOne({
            where: { docId: documentId }
        })

        if (docFolder) {
            // 通过 Strapi 更新文档目录
            await strapiClient.update<DocFolder>('doc-folders', docFolder.documentId, {
                folder_id: folderId
            })
        }
    }

    /**
     * 更新文档访问/编辑记录
     */
    async updateDocActivity(input: UpdateDocActivityInput): Promise<void> {
        const { docId, username, action } = input
        const ds = getDataSource()

        let activity = await ds.getRepository(DocUserActivity).findOne({
            where: { docId, username }
        })

        const now = new Date().toISOString()

        if (!activity) {
            // 通过 Strapi 创建活动记录
            await strapiClient.create<DocUserActivity>('doc-user-activities', {
                docId: docId,
                username,
                lastViewedAt: action === 'view' ? now : null,
                visitCount: action === 'view' ? 1 : 0,
                lastEditedAt: action === 'edit' ? now : null
            })
        } else {
            // 通过 Strapi 更新活动记录
            const updateData: Record<string, unknown> = {}
            if (action === 'view') {
                updateData.lastViewedAt = now
                updateData.visitCount = activity.visitCount + 1
            } else {
                updateData.lastEditedAt = now
            }
            await strapiClient.update<DocUserActivity>('doc-user-activities', activity.documentId, updateData)
        }
    }

    /**
     * 获取用户文档ACL
     */
    async getDocUserAcl(input: GetDocUserAclInput): Promise<DocUserAcl | null> {
        const { documentId, username } = input
        const ds = getDataSource()
        return ds.getRepository(DocUserAcl).findOne({
            where: { docId: documentId, username }
        })
    }

    /**
     * 创建用户文档ACL
     */
    async createDocUserAcl(input: CreateDocUserAclInput): Promise<DocUserAcl> {
        const { documentId, username, perm } = input
        const ds = getDataSource()

        // 通过 Strapi 创建
        const result = await strapiClient.create<DocUserAcl>('doc-user-acls', {
            docId: documentId,
            username,
            perm
        })

        // 重新查询获取完整数据
        const acl = await ds.getRepository(DocUserAcl).findOne({
            where: { documentId: result.data.documentId }
        })

        return acl!
    }

    /**
     * 获取文档成员列表
     */
    async getDocMembers(input: GetDocMembersInput): Promise<DocUserAcl[]> {
        const { documentId } = input
        const ds = getDataSource()
        const members = await ds.getRepository(DocUserAcl).find({
            where: { docId: documentId },
            order: { ctime: 'DESC' }
        })
        return members
    }

    /**
     * 批量添加文档成员
     */
    async addDocMembers(input: AddDocMembersInput): Promise<DocUserAcl[]> {
        const { documentId, members } = input
        const ds = getDataSource()
        const added: DocUserAcl[] = []

        for (const member of members) {
            const existing = await ds.getRepository(DocUserAcl).findOne({
                where: { docId: documentId, username: member.username }
            })

            if (!existing) {
                // 通过 Strapi 创建
                const result = await strapiClient.create<DocUserAcl>('doc-user-acls', {
                    docId: documentId,
                    username: member.username,
                    perm: member.perm
                })

                // 查询新创建的记录
                const acl = await ds.getRepository(DocUserAcl).findOne({
                    where: { documentId: result.data.documentId }
                })
                if (acl) {
                    added.push(acl)
                }
            }
        }

        return added
    }

    /**
     * 更新文档成员权限
     */
    async updateDocMember(input: UpdateDocMemberInput): Promise<DocUserAcl | null> {
        const { documentId, username, perm } = input
        const ds = getDataSource()
        const acl = await ds.getRepository(DocUserAcl).findOne({
            where: { docId: documentId, username }
        })

        if (!acl) {
            return null
        }

        // 通过 Strapi 更新
        await strapiClient.update<DocUserAcl>('doc-user-acls', acl.documentId, { perm })

        // 重新查询获取完整数据
        const updatedAcl = await ds.getRepository(DocUserAcl).findOne({
            where: { docId: documentId, username }
        })
        return updatedAcl
    }

    /**
     * 移除文档成员
     */
    async removeDocMember(input: RemoveDocMemberInput): Promise<void> {
        const { documentId, username } = input
        const ds = getDataSource()
        const acl = await ds.getRepository(DocUserAcl).findOne({
            where: { docId: documentId, username }
        })

        if (acl) {
            // 通过 Strapi 删除
            await strapiClient.delete('doc-user-acls', acl.documentId)
        }
    }

    /**
     * 获取文档绑定的空间列表（含空间名称）
     */
    async getDocSpaces(documentId: string) {
        const ds = getDataSource()
        const acls = await ds.getRepository(DocSpaceAcl).find({
            where: { docId: documentId },
            relations: ['space']
        })

        return acls
            .filter(acl => acl.space)
            .map(acl => ({
                id: acl.id,
                spaceId: acl.spaceId,
                perm: acl.perm,
                spaceName: acl.space.name,
                spaceDocumentId: acl.space.documentId
            }))
    }

    /**
     * 检查文档是否已绑定到空间
     */
    async isDocBoundToSpace(input: IsDocBoundToSpaceInput): Promise<boolean> {
        const { documentId, spaceId } = input
        const ds = getDataSource()
        const existing = await ds.getRepository(DocSpaceAcl).findOne({
            where: { docId: documentId, spaceId }
        })
        return !!existing
    }

    /**
     * 绑定文档到新空间
     */
    async bindDocToSpace(input: BindDocToSpaceInput): Promise<DocSpaceAcl> {
        const { documentId, spaceId, perm } = input
        let { folderId } = input
        const ds = getDataSource()

        // 如果没有指定 folderId，获取空间根目录
        if (!folderId) {
            console.log('No folderId specified, fetching root folder')
            const rootFolder = await ds.getRepository(SpaceFolder).findOne({
                where: { spaceId, parentId: '' }
            })
            if (rootFolder) {
                folderId = rootFolder.documentId
            }
        }

        // 通过 Strapi 创建文档目录关联
        let df = await strapiClient.create<DocFolder>('doc-folders', {
            docId: documentId,
            folderId: folderId || ''
        })
        console.log('Created DocFolder:', df.data)
        // 通过 Strapi 创建文档空间ACL
        const aclResult = await strapiClient.create<DocSpaceAcl>('doc-space-acls', {
            docId: documentId,
            spaceId: spaceId,
            perm
        })
        console.log('Created DocSpaceAcl:', aclResult.data)
        // 重新查询获取完整数据
        const acl = await ds.getRepository(DocSpaceAcl).findOne({
            where: { documentId: aclResult.data.documentId }
        })

        return acl!
    }

    /**
     * 解除文档与空间的绑定
     */
    async unbindDocFromSpace(input: UnbindDocFromSpaceInput): Promise<void> {
        const { documentId, spaceId } = input
        const ds = getDataSource()

        // 查找并删除 DocSpaceAcl
        const acl = await ds.getRepository(DocSpaceAcl).findOne({
            where: { docId: documentId, spaceId }
        })
        if (acl) {
            await strapiClient.delete('doc-space-acls', acl.documentId)
        }

        // 查找并删除 DocFolder
        const docFolder = await ds.getRepository(DocFolder).findOne({
            where: { docId: documentId }
        })
        const spaceFolder = await ds.getRepository(SpaceFolder).findOne({
            where: { spaceId, documentId: docFolder ? docFolder.folderId : '' }
        })
        if (docFolder && spaceFolder) {
            await strapiClient.delete('doc-folders', docFolder.documentId)
            await spaceFolderService.deleteFolder(spaceFolder.documentId)
        }

    }
}

export const documentService = new DocumentService()

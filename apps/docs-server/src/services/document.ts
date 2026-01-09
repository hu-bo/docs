import { getDataSource } from '../config/dataSource'
import { strapiClient } from '../tools/strapi/strapiClient'
import { Doc, AccessMode } from '../entities/Doc'
import { DocFolder } from '../entities/DocFolder'
import { DocUserAcl, DocPerm } from '../entities/DocUserAcl'
import { DocSpaceAcl, DocSpacePerm } from '../entities/DocSpaceAcl'
import { DocUserActivity } from '../entities/DocUserActivity'

export interface CreateDocumentInput {
    spaceId: string
    folderId: string
    title: string
    content?: string
    accessMode?: string
    tags?: string
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

class DocumentService {
    /**
     * 获取用户最近访问的文档
     */
    async getRecentDocuments(username: string, limit: number = 100) {
        const ds = getDataSource()

        const [activities, total] = await ds.getRepository(DocUserActivity).findAndCount({
            where: { username },
            order: { lastViewedAt: 'DESC' },
            take: limit
        })

        if (activities.length === 0) {
            return []
        }

        const docIds = activities.map(a => a.docId)
        const docs = await ds.getRepository(Doc).find({
            where: docIds.map(id => ({ documentId: id, isDeleted: 0 }))
        })

        const docMap = new Map(docs.map(d => [d.documentId, d]))

        const result = activities
            .map(activity => {
                const doc = docMap.get(activity.docId)
                if (!doc) return null
                return {
                    ...doc,
                    lastViewedAt: activity.lastViewedAt,
                    lastEditedAt: activity.lastEditedAt,
                    visitCount: activity.visitCount
                }
            })
            .filter(Boolean)

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
    async createDocument(input: CreateDocumentInput, username: string): Promise<Doc> {
        const ds = getDataSource()

        // 通过 Strapi 创建文档
        const docResult = await strapiClient.create<any>('docs', {
            title: input.title,
            content: input.content || '',
            accessMode: input.accessMode || AccessMode.OPEN_READONLY,
            owner: username,
            tags: input.tags || '',
            isDeleted: false
        })
        const docId = docResult.data.document_id

        // 通过 Strapi 创建文档-目录关联
        await strapiClient.create<any>('doc-folders', {
            doc_id: docResult.data.id,
            folder_id: Number(input.folderId)
        })

        // 通过 Strapi 创建文档-空间ACL（默认READ权限）
        await strapiClient.create<any>('doc-space-acls', {
            docId: docResult.data.id,
            spaceId: Number(input.spaceId),
            perm: DocSpacePerm.READ
        })

        // 重新查询获取完整数据
        const doc = await ds.getRepository(Doc).findOne({
            where: { id: docId }
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
        await strapiClient.update<any>('docs', doc.documentId, strapiInput)

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
            await strapiClient.update<any>('docs', doc.documentId, { isDeleted: true })
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
    async moveDocument(documentId: string, folderId: string): Promise<void> {
        const ds = getDataSource()
        const docFolder = await ds.getRepository(DocFolder).findOne({
            where: { docId: documentId }
        })

        if (docFolder) {
            // 通过 Strapi 更新文档目录
            await strapiClient.update<any>('doc-folders', docFolder.documentId, {
                folder_id: Number(folderId)
            })
        }
    }

    /**
     * 更新文档访问/编辑记录
     */
    async updateDocActivity(docId: string, username: string, action: 'view' | 'edit'): Promise<void> {
        const ds = getDataSource()

        let activity = await ds.getRepository(DocUserActivity).findOne({
            where: { docId, username }
        })

        const now = new Date().toISOString()

        if (!activity) {
            // 通过 Strapi 创建活动记录
            await strapiClient.create<any>('doc-user-activities', {
                docId: Number(docId),
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
            await strapiClient.update<any>('doc-user-activities', activity.documentId, updateData)
        }
    }

    /**
     * 获取用户文档ACL
     */
    async getDocUserAcl(documentId: string, username: string): Promise<DocUserAcl | null> {
        const ds = getDataSource()
        return ds.getRepository(DocUserAcl).findOne({
            where: { docId: documentId, username }
        })
    }

    /**
     * 创建用户文档ACL
     */
    async createDocUserAcl(documentId: string, username: string, perm: DocPerm): Promise<DocUserAcl> {
        const ds = getDataSource()

        // 通过 Strapi 创建
        const result = await strapiClient.create<any>('doc-user-acls', {
            docId: Number(documentId),
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
    async getDocMembers(documentId: string, page: number, pageSize: number): Promise<{ members: DocUserAcl[]; total: number }> {
        const ds = getDataSource()
        const [members, total] = await ds.getRepository(DocUserAcl).findAndCount({
            where: { docId: documentId },
            order: { ctime: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize
        })
        return { members, total }
    }

    /**
     * 批量添加文档成员
     */
    async addDocMembers(documentId: string, members: AddDocMemberInput[]): Promise<DocUserAcl[]> {
        const ds = getDataSource()
        const added: DocUserAcl[] = []

        for (const member of members) {
            const existing = await ds.getRepository(DocUserAcl).findOne({
                where: { docId: documentId, username: member.username }
            })

            if (!existing) {
                // 通过 Strapi 创建
                const result = await strapiClient.create<DocUserAcl>('doc-user-acls', {
                    docId: Number(documentId),
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
    async updateDocMember(documentId: string, username: string, perm: DocPerm): Promise<DocUserAcl | null> {
        const ds = getDataSource()
        const acl = await ds.getRepository(DocUserAcl).findOne({
            where: { docId: documentId, username }
        })

        if (!acl) {
            return null
        }

        // 通过 Strapi 更新
        await strapiClient.update<any>('doc-user-acls', acl.documentId, { perm })

        // 重新查询获取完整数据
        const updatedAcl = await ds.getRepository(DocUserAcl).findOne({
            where: { docId: documentId, username }
        })
        return updatedAcl
    }

    /**
     * 移除文档成员
     */
    async removeDocMember(documentId: string, username: string): Promise<void> {
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
     * 获取文档绑定的空间列表
     */
    async getDocSpaces(documentId: string): Promise<DocSpaceAcl[]> {
        const ds = getDataSource()
        return ds.getRepository(DocSpaceAcl).find({
            where: { docId: documentId }
        })
    }

    /**
     * 检查文档是否已绑定到空间
     */
    async isDocBoundToSpace(documentId: string, spaceId: string): Promise<boolean> {
        const ds = getDataSource()
        const existing = await ds.getRepository(DocSpaceAcl).findOne({
            where: { docId: documentId, spaceId }
        })
        return !!existing
    }

    /**
     * 绑定文档到新空间
     */
    async bindDocToSpace(documentId: string, spaceId: string, folderId: string, perm: DocSpacePerm): Promise<DocSpaceAcl> {
        const ds = getDataSource()

        // 通过 Strapi 创建文档空间ACL
        const aclResult = await strapiClient.create<DocSpaceAcl>('doc-space-acls', {
            docId: Number(documentId),
            spaceId: Number(spaceId),
            perm
        })

        // 通过 Strapi 创建文档目录关联
        await strapiClient.create<DocFolder>('doc-folders', {
            doc_id: Number(documentId),
            folder_id: Number(folderId)
        })

        // 重新查询获取完整数据
        const acl = await ds.getRepository(DocSpaceAcl).findOne({
            where: { documentId: aclResult.data.documentId }
        })

        return acl!
    }

    /**
     * 解除文档与空间的绑定
     */
    async unbindDocFromSpace(documentId: string, spaceId: string): Promise<void> {
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
        if (docFolder) {
            await strapiClient.delete('doc-folders', docFolder.documentId)
        }
    }
}

export const documentService = new DocumentService()

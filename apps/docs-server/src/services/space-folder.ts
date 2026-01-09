import { getDataSource } from '../config/dataSource'
import { strapiClient } from '../tools/strapi/strapiClient'
import { SpaceFolder, VisibilityScope } from '../entities/SpaceFolder'
import { Doc } from '../entities/Doc'
import { DocFolder } from '../entities/DocFolder'
import { permissionService } from './permission'
import { In } from 'typeorm'

export interface DocWithPerm extends Doc {
    perm?: {
        canRead: boolean
        canEdit: boolean
    }
}

export interface FolderTreeNode {
    id: string
    name: string
    parentId: string
    visibilityScope: VisibilityScope
    order: number
    children: FolderTreeNode[]
    documents?: DocWithPerm[]
}

export interface CreateFolderInput {
    spaceId: string
    parentId: string
    name: string
    visibilityScope?: string
    order?: number
}

export interface UpdateFolderInput {
    name?: string
    visibilityScope?: string
    order?: number
    parentId?: string
}

class SpaceFolderService {
    /**
     * 获取目录下的文档列表（带权限信息）
     */
    async getFolderDocuments(
        spaceId: string,
        folderId: string,
        username: string,
        page: number,
        pageSize: number
    ): Promise<{ docs: DocWithPerm[]; total: number }> {
        const ds = getDataSource()

        const docFolders = await ds.getRepository(DocFolder).find({
            where: { folderId }
        })
        const docIds = docFolders.map(df => df.docId)

        if (docIds.length === 0) {
            return { docs: [], total: 0 }
        }

        const [docs, total] = await ds.getRepository(Doc).findAndCount({
            where: { id: In(docIds), isDeleted: 0 },
            order: { mtime: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize
        })

        const docsWithPerm: DocWithPerm[] = await Promise.all(
            docs.map(async (doc) => {
                const perm = await permissionService.getDocPermission(username, doc.documentId)
                return {
                    ...doc,
                    perm: {
                        canRead: perm.canRead,
                        canEdit: perm.canEdit
                    }
                }
            })
        )

        return { docs: docsWithPerm, total }
    }

    /**
     * 获取目录树数据（懒加载模式）
     */
    async getFolderTreeData(
        spaceId: string,
        folderId: string,
        username: string,
        visibleFolderIds: string[]
    ): Promise<{ folders: FolderTreeNode[]; documents: DocWithPerm[] }> {
        const ds = getDataSource()

        // 获取子目录
        const folders = await ds.getRepository(SpaceFolder).find({
            where: { parentId: folderId, isDeleted: 0 },
            order: { order: 'ASC', id: 'ASC' }
        })

        // 过滤不可见目录
        const visibleFolders = folders.filter(f => visibleFolderIds.includes(f.documentId))

        // 获取当前目录下的文档
        const docFolders = await ds.getRepository(DocFolder).find({
            where: { folderId }
        })
        const docIds = docFolders.map(df => df.docId)

        let documents: DocWithPerm[] = []
        if (docIds.length > 0) {
            const docs = await ds.getRepository(Doc).find({
                where: { id: In(docIds), isDeleted: 0 },
                order: { mtime: 'DESC' }
            })

            documents = await Promise.all(
                docs.map(async (doc) => {
                    const perm = await permissionService.getDocPermission(username, doc.documentId)
                    return {
                        ...doc,
                        perm: {
                            canRead: perm.canRead,
                            canEdit: perm.canEdit
                        }
                    }
                })
            )
        }

        // 构建树节点
        const treeNodes: FolderTreeNode[] = visibleFolders.map(f => ({
            id: f.documentId,
            name: f.name,
            parentId: f.parentId,
            visibilityScope: f.visibilityScope,
            order: f.order,
            children: [],
            documents: []
        }))

        return { folders: treeNodes, documents }
    }

    /**
     * 获取父目录
     */
    async getParentFolder(parentId: string, spaceId: string): Promise<SpaceFolder | null> {
        const ds = getDataSource()
        return ds.getRepository(SpaceFolder).findOne({
            where: { documentId: parentId, isDeleted: 0 }
        })
    }

    /**
     * 创建目录
     */
    async createFolder(input: CreateFolderInput): Promise<SpaceFolder> {
        const ds = getDataSource()

        // 查找父目录的 documentId（用于设置 parent 关系）
        let parentDocumentId: string | null = null
        if (input.parentId && input.parentId !== '0') {
            const parentFolder = await ds.getRepository(SpaceFolder).findOne({
                where: { documentId: input.parentId }
            })
            if (parentFolder) {
                parentDocumentId = parentFolder.documentId
            }
        }

        // 通过 Strapi 创建目录
        const createData: Record<string, unknown> = {
            spaceId: String(input.spaceId),
            parentId: String(input.parentId),
            name: input.name,
            visibilityScope: input.visibilityScope || VisibilityScope.ALL,
            order: input.order ?? 0,
            isDeleted: false
        }

        // 设置 parent 关系字段
        if (parentDocumentId) {
            createData.parent = parentDocumentId
        }

        const result = await strapiClient.create<any>('space-folders', createData)

        // 重新查询获取完整数据
        const folder = await ds.getRepository(SpaceFolder).findOne({
            where: { documentId: result.data.documentId }
        })

        return folder!
    }

    /**
     * 获取目录
     */
    async getFolderById(folderId: string): Promise<SpaceFolder | null> {
        const ds = getDataSource()
        return ds.getRepository(SpaceFolder).findOne({
            where: { documentId: folderId, isDeleted: 0 }
        })
    }

    /**
     * 更新目录
     */
    async updateFolder(folderId: string, input: UpdateFolderInput): Promise<SpaceFolder | null> {
        const ds = getDataSource()
        const folder = await ds.getRepository(SpaceFolder).findOne({
            where: { documentId: folderId, isDeleted: 0 }
        })

        if (!folder) {
            return null
        }

        // 构建 Strapi 更新数据
        const strapiInput: Record<string, unknown> = {}
        if (input.name !== undefined) strapiInput.name = input.name
        if (input.visibilityScope !== undefined) strapiInput.visibilityScope = input.visibilityScope
        if (input.order !== undefined) strapiInput.order = input.order

        // 更新 parentId 时同时更新 parent 关系
        if (input.parentId !== undefined) {
            strapiInput.parentId = String(input.parentId)

            // 查找新父目录的 documentId
            if (input.parentId && input.parentId !== '0') {
                const newParentFolder = await ds.getRepository(SpaceFolder).findOne({
                    where: { documentId: input.parentId }
                })
                if (newParentFolder) {
                    strapiInput.parent = newParentFolder.documentId
                } else {
                    strapiInput.parent = null
                }
            } else {
                strapiInput.parent = null
            }
        }

        // 通过 Strapi 更新
        await strapiClient.update<any>('space-folders', folder.documentId, strapiInput)

        // 重新查询获取完整数据
        const updatedFolder = await ds.getRepository(SpaceFolder).findOne({
            where: { documentId: folderId }
        })
        return updatedFolder
    }

    /**
     * 软删除目录（递归）
     */
    async deleteFolder(folderId: string): Promise<void> {
        const ds = getDataSource()
        await this.softDeleteFolderRecursive(ds, folderId)
    }

    /**
     * 递归软删除目录
     */
    private async softDeleteFolderRecursive(ds: ReturnType<typeof getDataSource>, folderId: string) {
        const folder = await ds.getRepository(SpaceFolder).findOne({
            where: { documentId: folderId }
        })

        if (folder) {
            // 通过 Strapi 软删除
            await strapiClient.update<any>('space-folders', folder.documentId, { isDeleted: true })
        }

        const children = await ds.getRepository(SpaceFolder).find({
            where: { parentId: folderId, isDeleted: 0 }
        })

        for (const child of children) {
            await this.softDeleteFolderRecursive(ds, child.documentId)
        }
    }
}

export const spaceFolderService = new SpaceFolderService()

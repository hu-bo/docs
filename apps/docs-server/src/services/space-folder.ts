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

export interface TreeNode {
    key: string
    title: string
    type: 'folder' | 'doc'
    children?: TreeNode[]
    isLeaf?: boolean
    loaded?: boolean
    // folder fields
    visibilityScope?: VisibilityScope
    // doc fields
    accessMode?: string
    perm?: {
        canRead: boolean
        canEdit: boolean
    }
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

export interface GetFolderDocumentsInput {
    spaceId: string
    folderId: string
    username: string
    page: number
    pageSize: number
}

export interface GetFolderTreeDataInput {
    spaceId: string
    folderId: string
    username: string
    visibleFolderIds: string[]
}

export interface GetFolderContentsInput {
    spaceId: string
    folderId: string
    username: string
    visibleFolderIds: string[]
}

export interface FolderContentItem {
    key: string
    title: string
    type: 'folder' | 'doc'
    // folder fields
    visibilityScope?: VisibilityScope
    // doc fields
    accessMode?: string
    owner?: string
    mtime?: string
    ctime?: string
    perm?: {
        canRead: boolean
        canEdit: boolean
    }
}

class SpaceFolderService {
    /**
     * 获取目录下的文档列表（带权限信息）
     */
    async getFolderDocuments(input: GetFolderDocumentsInput): Promise<{ docs: DocWithPerm[]; total: number }> {
        const { folderId, username, page, pageSize } = input
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
                const perm = await permissionService.getDocPermission({ username, doc })
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
     * 返回统一的 TreeNode 数组，目录和文档混合在同一层级
     */
    async getFolderTreeData(input: GetFolderTreeDataInput): Promise<TreeNode[]> {
        const { folderId, username, visibleFolderIds } = input
        const ds = getDataSource()

        // 获取子目录
        const folders = await ds.getRepository(SpaceFolder).find({
            where: { parentId: folderId },
            order: { order: 'ASC', id: 'ASC' }
        })

        // 过滤不可见目录
        const visibleFolders = folders.filter(f => visibleFolderIds.includes(f.documentId))

        // 获取当前目录下的文档
        const docFolders = await ds.getRepository(DocFolder).find({
            where: { folderId }
        })
        const docIds = docFolders.map(df => df.docId)

        // 构建目录节点
        const folderNodes: TreeNode[] = visibleFolders.map(f => ({
            key: f.documentId,
            title: f.name,
            type: 'folder' as const,
            isLeaf: false,
            loaded: false,
            visibilityScope: f.visibilityScope
        }))

        // 构建文档节点
        let docNodes: TreeNode[] = []
        if (docIds.length > 0) {
            const docs = await ds.getRepository(Doc).find({
                where: { documentId: In(docIds), isDeleted: 0 },
                order: { mtime: 'DESC' }
            })

            docNodes = await Promise.all(
                docs.map(async (doc) => {
                    const perm = await permissionService.getDocPermission({ username, doc })
                    return {
                        key: doc.documentId,
                        title: doc.title,
                        type: 'doc' as const,
                        isLeaf: true,
                        accessMode: doc.accessMode,
                        perm: {
                            canRead: perm.canRead,
                            canEdit: perm.canEdit
                        }
                    }
                })
            )
        }

        // 目录在前，文档在后
        return [...folderNodes, ...docNodes]
    }

    /**
     * 获取目录内容（子目录 + 文档详细列表）
     * 用于右侧内容区展示
     */
    async getFolderContents(input: GetFolderContentsInput): Promise<FolderContentItem[]> {
        const { folderId, username, visibleFolderIds } = input
        const ds = getDataSource()

        // 获取子目录
        const folders = await ds.getRepository(SpaceFolder).find({
            where: { parentId: folderId },
            order: { order: 'ASC', id: 'ASC' }
        })

        // 过滤不可见目录
        const visibleFolders = folders.filter(f => visibleFolderIds.includes(f.documentId))

        // 获取当前目录下的文档
        const docFolders = await ds.getRepository(DocFolder).find({
            where: { folderId }
        })

        const docIds = docFolders.map(df => df.docId)

        // 构建目录内容项
        const folderItems: FolderContentItem[] = visibleFolders.map(f => ({
            key: f.documentId,
            title: f.name,
            type: 'folder' as const,
            visibilityScope: f.visibilityScope,
            mtime: f.mtime?.toISOString(),
            ctime: f.ctime?.toISOString()
        }))

        // 构建文档内容项
        let docItems: FolderContentItem[] = []
        if (docIds.length > 0) {
            const docs = await ds.getRepository(Doc).find({
                where: { documentId: In(docIds), isDeleted: 0 },
                order: { mtime: 'DESC' }
            })

            docItems = await Promise.all(
                docs.map(async (doc) => {
                    const perm = await permissionService.getDocPermission({ username, doc })
                    return {
                        key: doc.documentId,
                        title: doc.title,
                        type: 'doc' as const,
                        accessMode: doc.accessMode,
                        owner: doc.owner,
                        mtime: doc.mtime?.toISOString(),
                        ctime: doc.ctime?.toISOString(),
                        perm: {
                            canRead: perm.canRead,
                            canEdit: perm.canEdit
                        }
                    }
                })
            )
        }

        // 目录在前，文档在后
        return [...folderItems, ...docItems]
    }

    /**
     * 获取父目录
     */
    async getParentFolder(parentId: string, spaceId: string): Promise<SpaceFolder | null> {
        const ds = getDataSource()
        return ds.getRepository(SpaceFolder).findOne({
            where: { documentId: parentId }
        })
    }

    /**
     * 创建目录
     */
    async createFolder(input: CreateFolderInput): Promise<SpaceFolder> {
        const ds = getDataSource()

        // 查找父目录的 documentId（用于设置 parent 关系）
        let parentDocumentId: string | null = null

        if (input.parentId) {
            const parentFolder = await ds.getRepository(SpaceFolder).findOne({
                where: { documentId: input.parentId }
            })
            if (parentFolder) {
                parentDocumentId = parentFolder.documentId
            }
        } else {
            // 根目录
            const rootFolder = await ds.getRepository(SpaceFolder).findOne({
                where: { spaceId: input.spaceId, parentId: '' }
            })
            if (rootFolder) {
                parentDocumentId = rootFolder.documentId
            }
        }

        // 通过 Strapi 创建目录
        const createData: Partial<SpaceFolder> = {
            spaceId: input.spaceId,
            parentId: input.parentId || '',
            name: input.name,
            visibilityScope: (input.visibilityScope as VisibilityScope) || VisibilityScope.ALL,
            order: input.order ?? 0
        }

        // 设置 parent 关系字段
        if (parentDocumentId) {
            createData.parentId = parentDocumentId
        }

        const result = await strapiClient.create<SpaceFolder>('space-folders', createData)

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
            where: { documentId: folderId }
        })
    }

    /**
     * 更新目录
     */
    async updateFolder(folderId: string, input: UpdateFolderInput): Promise<SpaceFolder | null> {
        const ds = getDataSource()
        const folder = await ds.getRepository(SpaceFolder).findOne({
            where: { documentId: folderId }
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
            if (input.parentId) {
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
        await strapiClient.update<SpaceFolder>('space-folders', folder.documentId, strapiInput)

        // 重新查询获取完整数据
        const updatedFolder = await ds.getRepository(SpaceFolder).findOne({
            where: { documentId: folderId }
        })
        return updatedFolder
    }

    /**
     * 物理删除目录
     */
    async deleteFolder(folderId: string): Promise<void> {
        await strapiClient.delete('space-folders', folderId)
    }
}

export const spaceFolderService = new SpaceFolderService()

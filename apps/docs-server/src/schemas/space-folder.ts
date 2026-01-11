import { z } from 'zod'

// Create folder
export const createFolderSchema = z.object({
    spaceId: z.string(),
    parentId: z.string().default(''),
    name: z.string().min(1).max(128),
    visibilityScope: z.enum(['ALL', 'DEPT_ONLY']).default('ALL'),
    order: z.number().int().min(0).optional()
})

// Update folder
export const updateFolderSchema = z.object({
    name: z.string().min(1).max(128).optional(),
    visibilityScope: z.enum(['ALL', 'DEPT_ONLY']).optional(),
    order: z.number().int().min(0).optional(),
    parentId: z.string().optional()
})

// Query folder documents
export const folderDocumentsQuerySchema = z.object({
    spaceId: z.string(),
    folderId: z.string().default(''),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20)
})

// Query folder tree
export const folderTreeQuerySchema = z.object({
    spaceId: z.string(),
    folderId: z.string().default('')
})

// Query folder contents (子目录 + 文档详细列表)
export const folderContentsQuerySchema = z.object({
    spaceId: z.string(),
    folderId: z.string().default('')
})

export type CreateFolderInput = z.infer<typeof createFolderSchema>
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>
export type FolderDocumentsQuery = z.infer<typeof folderDocumentsQuerySchema>
export type FolderTreeQuery = z.infer<typeof folderTreeQuerySchema>
export type FolderContentsQuery = z.infer<typeof folderContentsQuerySchema>

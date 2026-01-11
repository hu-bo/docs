import { z } from 'zod'

// Document ID param validation
export const documentIdParamSchema = z.object({
    documentId: z.string()
})

// Document and Space ID param validation
export const documentSpaceIdParamSchema = z.object({
    documentId: z.string(),
    spaceId: z.string()
})

// Create document
export const createDocumentSchema = z.object({
    title: z.string().min(1).max(128),
    content: z.string().default(''),
    accessMode: z.enum(['OPEN_EDIT', 'OPEN_READONLY', 'WHITELIST_ONLY']).default('OPEN_READONLY'),
    tags: z.array(z.string()).optional(),
    spaceId: z.string(),
    folderId: z.string().default('')
})

// Update document
export const updateDocumentSchema = z.object({
    title: z.string().min(1).max(128).optional(),
    content: z.string().optional(),
    accessMode: z.enum(['OPEN_EDIT', 'OPEN_READONLY', 'WHITELIST_ONLY']).optional(),
    tags: z.string().max(512).optional()
})

// Move document
export const moveDocumentSchema = z.object({
    folderId: z.string()
})

// Accept share
export const acceptShareSchema = z.object({
    shareCode: z.string().min(1)
})

// Add document members
export const addDocMembersSchema = z.object({
    members: z.array(
        z.object({
            username: z.string().min(1).max(128),
            perm: z.enum(['READ', 'EDIT'])
        })
    ).min(1)
})

// Update document member
export const updateDocMemberSchema = z.object({
    perm: z.enum(['READ', 'EDIT'])
})

// Bind document to space
export const bindDocSpaceSchema = z.object({
    spaceId: z.string(),
    folderId: z.string().default(''),
    perm: z.enum(['READ', 'EDIT'])
})
export const docRecentSchema = z.object({
    limit: z.string(),
    // spaceId: z.string().optional()
})
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>
export type MoveDocumentInput = z.infer<typeof moveDocumentSchema>
export type AcceptShareInput = z.infer<typeof acceptShareSchema>
export type AddDocMembersInput = z.infer<typeof addDocMembersSchema>
export type UpdateDocMemberInput = z.infer<typeof updateDocMemberSchema>
export type BindDocSpaceInput = z.infer<typeof bindDocSpaceSchema>
export type DocRecentInput = z.infer<typeof docRecentSchema>

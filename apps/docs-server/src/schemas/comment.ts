import { z } from 'zod'

// Create comment
export const createCommentSchema = z.object({
    docId: z.string(),
    parentId: z.string().default('0'),
    content: z.string().min(1)
})

// Update comment
export const updateCommentSchema = z.object({
    content: z.string().min(1)
})

// Query comments
export const commentQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20)
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>
export type CommentQuery = z.infer<typeof commentQuerySchema>

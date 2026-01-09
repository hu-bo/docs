import { z } from 'zod'

// Create space
export const createSpaceSchema = z.object({
    name: z.string().min(1).max(128),
    codeName: z.string().min(1).max(128),
    icon: z.string().max(255).optional(),
    spaceType: z.number().int().min(0).max(2).optional(),
    datasetId: z.string().max(255).optional(),
    deptId: z.number()
})

// Update space
export const updateSpaceSchema = z.object({
    name: z.string().min(1).max(128).optional(),
    icon: z.string().max(255).optional(),
    datasetId: z.string().max(255).optional()
})

// Add member
export const addMembersSchema = z.object({
    members: z.array(
        z.object({
            username: z.string().min(1).max(128),
            canRead: z.number().int().min(0).max(1).optional(),
            canCreateFolder: z.number().int().min(0).max(1).optional(),
            canCreateDoc: z.number().int().min(0).max(1).optional(),
            superAdmin: z.number().int().min(0).max(1).optional()
        })
    ).min(1)
})

// Update member permission
export const updateMemberSchema = z.object({
    canRead: z.number().int().min(0).max(1).optional(),
    canCreateFolder: z.number().int().min(0).max(1).optional(),
    canCreateDoc: z.number().int().min(0).max(1).optional(),
    superAdmin: z.number().int().min(0).max(1).optional()
})

// Pagination query
export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20)
})

export type CreateSpaceInput = z.infer<typeof createSpaceSchema>
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>
export type AddMembersInput = z.infer<typeof addMembersSchema>
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>
export type PaginationInput = z.infer<typeof paginationSchema>

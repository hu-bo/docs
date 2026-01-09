import { z } from 'zod'

// Apply for access
export const applyAccessSchema = z.object({
    type: z.enum(['DOC']),
    targetId: z.string(),
    requestedPerm: z.enum(['READ', 'EDIT']).optional(),
    reason: z.string().max(500).optional()
})

// Approve/Reject request
export const approveAccessSchema = z.object({
    requestId: z.string(),
    approved: z.boolean(),
    perm: z.enum(['READ', 'EDIT']).optional()
})

export type ApplyAccessInput = z.infer<typeof applyAccessSchema>
export type ApproveAccessInput = z.infer<typeof approveAccessSchema>

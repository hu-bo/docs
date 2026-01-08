import { z } from 'zod'

export const mcpBindingSchema = z.object({
    body: z.object({
        id: z.string().min(1, 'ID不能为空'),
        name: z.string().min(1, '名称不能为空'),
        description: z.string().optional(),
        // 对应 string | object
        serverConfig: z.union([z.string(), z.record(z.string(), z.any())]).optional()
    })
})

export const createChatSchema = z.object({
    body: z.object({
        prompt: z.string().min(1, 'Prompt不能为空'),
        topic: z.string().optional(),
        model: z.string().optional(),
        username: z.string().optional(),
        sessionId: z.string().optional(),
        // 嵌套数组
        mcpBindings: z.array(mcpBindingSchema.shape.body).optional(),
        // 对应 Record<string, unknown>
        context: z.record(z.string(), z.unknown()).optional()
    })
})

// 导出类型供 Controller 使用
export type CreateChatInput = z.infer<typeof createChatSchema>['body']
export type MCPBindingInput = z.infer<typeof mcpBindingSchema>['body']

export interface HttpBinding {
    id: string
    name: string
    url: string
    method?: 'GET' | 'POST' | 'GRPC'
    discoveryId?: string
    description?: string
    headers?: Record<string, string>
    metadata?: Record<string, unknown>
}

export interface MCPBinding {
    id: string
    name: string
    description?: string
    serverConfig?: string | object
}

export interface ResearchRequestPayload {
    prompt: string
    topic?: string
    model?: string
    username?: string
    sessionId?: string
    mcpBindings?: MCPBinding[]
    context?: Record<string, unknown>
}

export interface ResearchStreamChunk {
    type: 'status' | 'step' | 'agent_event' | 'final' | 'error'
    data: unknown
}

export interface ResearchResult {
    messageId?: string
    report: unknown
    reasoning?: unknown
}

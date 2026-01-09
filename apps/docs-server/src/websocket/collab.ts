import { Hocuspocus, type Extension, type onConnectPayload, type onDisconnectPayload } from '@hocuspocus/server'
import { Redis } from '@hocuspocus/extension-redis'
import { AuthExtension } from './extensions/auth.extension'
import { RedisPersistenceExtension } from './extensions/persistence.extension'
import { logger } from '../utils/logger'

let collabServer: Hocuspocus | null = null
let persistenceExtension: RedisPersistenceExtension | null = null

/**
 * 创建Hocuspocus协作服务器
 */
export function createCollabServer(): Hocuspocus {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    const enableRedisPubSub = process.env.COLLAB_ENABLE_REDIS_PUBSUB === 'true'

    logger.info(`[Collab] Creating collab server with Redis: ${redisUrl}`)
    logger.info(`[Collab] Redis PubSub enabled: ${enableRedisPubSub}`)

    // 创建持久化扩展实例（用于后续销毁）
    persistenceExtension = new RedisPersistenceExtension({
        redisUrl,
        keyPrefix: 'docs:ydoc:',
        // 可选：设置TTL，例如30天
        // ttlSeconds: 30 * 24 * 60 * 60
    })

    const extensions: Extension[] = [
        new AuthExtension(),
        persistenceExtension
    ]

    // 多实例横向扩展时启用Redis PubSub
    if (enableRedisPubSub) {
        extensions.push(
            new Redis({
                host: new URL(redisUrl).hostname,
                port: Number(new URL(redisUrl).port) || 6379
            })
        )
    }

    collabServer = new Hocuspocus({
        // 持久化频率：客户端持续编辑时，服务端会 debounce 存储
        debounce: 2000,
        maxDebounce: 10000,
        // 文档卸载策略
        unloadImmediately: false,
        // 扩展
        extensions,
        // 连接回调
        onConnect: async (data: onConnectPayload) => {
            logger.debug(`[Collab] Client connecting to document: ${data.documentName}`)
        },
        onDisconnect: async (data: onDisconnectPayload) => {
            logger.debug(`[Collab] Client disconnected from document: ${data.documentName}`)
        },
        onDestroy: async () => {
            logger.info('[Collab] Hocuspocus server destroyed')
        }
    })

    return collabServer
}

/**
 * 获取协作服务器实例
 */
export function getCollabServer(): Hocuspocus {
    if (!collabServer) {
        throw new Error('Collab server not initialized. Call createCollabServer() first.')
    }
    return collabServer
}

/**
 * 销毁协作服务器
 */
export async function destroyCollabServer(): Promise<void> {
    if (persistenceExtension) {
        await persistenceExtension.destroy()
        persistenceExtension = null
    }
    if (collabServer) {
        await collabServer.destroy()
        collabServer = null
    }
    logger.info('[Collab] Collab server destroyed')
}

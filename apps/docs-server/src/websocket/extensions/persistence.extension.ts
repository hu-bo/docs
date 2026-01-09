import type {
    Extension,
    onLoadDocumentPayload,
    onStoreDocumentPayload
} from '@hocuspocus/server'
import * as Y from 'yjs'
import Redis from 'ioredis'
import { logger } from '../../utils/logger'

interface RedisPersistenceOptions {
    redisUrl: string
    /** Redis key 前缀 */
    keyPrefix?: string
    /** TTL（秒），不设置则永久保存 */
    ttlSeconds?: number
}

/**
 * Redis持久化扩展
 * 保存和加载Yjs文档状态
 */
export class RedisPersistenceExtension implements Extension {
    private readonly redis: Redis
    private readonly keyPrefix: string
    private readonly ttlSeconds?: number

    constructor(opts: RedisPersistenceOptions) {
        this.redis = new Redis(opts.redisUrl, {
            maxRetriesPerRequest: null,
            retryStrategy: (times) => {
                if (times > 3) {
                    logger.error('[Collab] Redis connection failed after 3 retries')
                    return null
                }
                return Math.min(times * 200, 2000)
            }
        })

        this.redis.on('error', (err) => {
            logger.error('[Collab] Redis error:', err)
        })

        this.redis.on('connect', () => {
            logger.info('[Collab] Redis connected')
        })

        this.keyPrefix = opts.keyPrefix ?? 'ydoc:'
        this.ttlSeconds = opts.ttlSeconds
    }

    private key(documentName: string): string {
        return this.keyPrefix + documentName
    }

    /**
     * 加载文档
     */
    async onLoadDocument(data: onLoadDocumentPayload): Promise<Y.Doc> {
        const { documentName } = data
        const key = this.key(documentName)

        try {
            const buf = await this.redis.getBuffer(key)

            if (!buf) {
                logger.debug(`[Collab] No existing document found for ${documentName}, creating new`)
                return new Y.Doc()
            }

            const doc = new Y.Doc()
            Y.applyUpdate(doc, new Uint8Array(buf))
            logger.debug(`[Collab] Loaded document ${documentName} from Redis`)
            return doc
        } catch (error) {
            logger.error(`[Collab] Failed to load document ${documentName}:`, error)
            return new Y.Doc()
        }
    }

    /**
     * 保存文档
     */
    async onStoreDocument(data: onStoreDocumentPayload): Promise<void> {
        const { documentName, document, context } = data
        const key = this.key(documentName)

        try {
            const update = Y.encodeStateAsUpdate(document)
            const value = Buffer.from(update)

            if (typeof this.ttlSeconds === 'number') {
                await this.redis.set(key, value, 'EX', this.ttlSeconds)
            } else {
                await this.redis.set(key, value)
            }

            const user = context?.user as { username?: string } | undefined
            logger.debug(`[Collab] Stored document ${documentName} by ${user?.username || 'unknown'}`)
        } catch (error) {
            logger.error(`[Collab] Failed to store document ${documentName}:`, error)
        }
    }

    /**
     * 销毁Redis连接
     */
    async destroy(): Promise<void> {
        await this.redis.quit()
    }
}

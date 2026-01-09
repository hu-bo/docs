import type { Extension, onAuthenticatePayload } from '@hocuspocus/server'
import jwt from 'jsonwebtoken'
import { logger } from '../../utils/logger'
import { permissionService } from '../../services/permission'

type CollabRole = 'editor' | 'reader'

export interface CollabJwtPayload {
    sub: string // username
    name: string // 显示名
    docId: string // 文档ID
    role: CollabRole
    type: 'collab'
    iat?: number
    exp?: number
}

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET || 'docs-collab-secret-change-me'
    return secret
}

/**
 * 签发协作Token
 */
export function signCollabToken(input: Omit<CollabJwtPayload, 'type'>): string {
    const payload: CollabJwtPayload = { ...input, type: 'collab' }
    return jwt.sign(payload, getJwtSecret(), { expiresIn: '24h' })
}

/**
 * 验证协作Token
 */
export function verifyCollabToken(token: string): CollabJwtPayload {
    const payload = jwt.verify(token, getJwtSecret()) as CollabJwtPayload
    if (payload.type !== 'collab') {
        throw new Error('Invalid token type')
    }
    return payload
}

/**
 * Hocuspocus认证扩展
 * 在WebSocket握手时校验JWT并检查文档权限
 */
export class AuthExtension implements Extension {
    async onAuthenticate(data: onAuthenticatePayload) {
        const { token, documentName } = data

        if (!token) {
            logger.warn('[Collab] Missing token')
            throw new Error('Missing token')
        }

        try {
            const payload = verifyCollabToken(token)

            // 从documentName中提取docId（格式: doc_{docId}）
            const docIdMatch = documentName.match(/^doc_(\d+)$/)
            if (!docIdMatch) {
                logger.warn(`[Collab] Invalid document name format: ${documentName}`)
                throw new Error('Invalid document name')
            }

            const docId = docIdMatch[1]

            // 验证token中的docId与请求的docId是否匹配
            if (payload.docId !== docId) {
                logger.warn(`[Collab] Token docId mismatch: ${payload.docId} vs ${docId}`)
                throw new Error('Document ID mismatch')
            }

            // 检查用户对文档的权限
            const perm = await permissionService.getDocPermission(payload.sub, docId)

            if (!perm.canRead) {
                logger.warn(`[Collab] User ${payload.sub} has no read permission for doc ${docId}`)
                throw new Error('No permission to access this document')
            }

            // 如果用户没有编辑权限，设置为只读
            if (!perm.canEdit) {
                data.connection.readOnly = true
                logger.debug(`[Collab] User ${payload.sub} connected as reader to doc ${docId}`)
            } else {
                logger.debug(`[Collab] User ${payload.sub} connected as editor to doc ${docId}`)
            }

            // 返回用户信息，会进入 data.context
            return {
                user: {
                    username: payload.sub,
                    name: payload.name,
                    role: perm.canEdit ? 'editor' : 'reader',
                    docId
                }
            }
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                logger.warn('[Collab] Token expired')
                throw new Error('Token expired')
            }
            if (error instanceof jwt.JsonWebTokenError) {
                logger.warn('[Collab] Invalid token')
                throw new Error('Invalid token')
            }
            throw error
        }
    }
}

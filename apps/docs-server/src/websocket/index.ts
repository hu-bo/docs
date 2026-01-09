export { createCollabServer, getCollabServer, destroyCollabServer } from './collab'
export { signCollabToken, verifyCollabToken, AuthExtension } from './extensions/auth.extension'
export type { CollabJwtPayload } from './extensions/auth.extension'
export { RedisPersistenceExtension } from './extensions/persistence.extension'

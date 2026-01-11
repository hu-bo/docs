import { Router, type IRouter } from 'express'
import permitMiddleware from '../../middlewares/permit'
import {
    getRecentDocuments,
    getParticipatedDocuments,
    getDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    moveDocument,
    acceptShare,
    getDocMembers,
    addDocMembers,
    updateDocMember,
    removeDocMember,
    getDocSpaces,
    bindDocToSpace,
    unbindDocFromSpace
} from '../../controllers/document/index'

const router: IRouter = Router()

// 所有文档相关接口需要认证
router.use(permitMiddleware)

// 最近访问的文档
router.get('/recent', getRecentDocuments)

// 我参与的文档
router.get('/participated', getParticipatedDocuments)

// 文档 CRUD
router.get('/:documentId', getDocument)
router.post('/', createDocument)
router.put('/:documentId', updateDocument)
router.delete('/:documentId', deleteDocument)

// 移动文档
router.put('/move/:documentId', moveDocument)

// 接受分享
router.post('/:documentId/share/accept', acceptShare)

// 文档成员管理
router.get('/:documentId/members', getDocMembers)
router.post('/:documentId/members', addDocMembers)
router.put('/:documentId/members/:username', updateDocMember)
router.delete('/:documentId/members/:username', removeDocMember)

// 文档跨空间绑定
router.get('/:documentId/spaces', getDocSpaces)
router.post('/:documentId/spaces', bindDocToSpace)
router.delete('/:documentId/spaces/:spaceId', unbindDocFromSpace)

export default router

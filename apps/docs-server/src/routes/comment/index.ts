import { Router, type IRouter } from 'express'
import permitMiddleware from '../../middlewares/permit'
import {
    getDocComments,
    createComment,
    updateComment,
    deleteComment
} from '../../controllers/comment/index'

const router: IRouter = Router()

// 所有评论相关接口需要认证
router.use(permitMiddleware)

// 评论 CRUD
router.get('/:documentId', getDocComments)
router.post('/', createComment)
router.put('/:commentId', updateComment)
router.delete('/:commentId', deleteComment)

export default router

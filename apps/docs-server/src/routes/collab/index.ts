import { Router, type IRouter } from 'express'
import permitMiddleware from '../../middlewares/permit'
import { getCollabToken } from '../../controllers/collab/index'

const router: IRouter = Router()

// 需要认证
router.use(permitMiddleware)

// 获取协作token
router.post('/token', getCollabToken)

export default router

import { Router } from 'express'
import permitMiddleware from '../../middlewares/permit'
import {
    applyAccess,
    getPendingRequests,
    approveAccess
} from '../../controllers/access-request/index'

const router: Router = Router()

// 所有权限申请相关接口需要认证
router.use(permitMiddleware)

// 权限申请
router.post('/apply', applyAccess)
router.get('/pending-requests', getPendingRequests)
router.put('/approve', approveAccess)

export default router

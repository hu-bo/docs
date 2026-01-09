import { Router } from 'express'
import permitMiddleware from '../../middlewares/permit'
import { getCurrentUser, getMockUsers, setMockUser, clearMockUser } from '../../controllers/user/index'

const router: Router = Router()
router.use(permitMiddleware)
router.get('/current', getCurrentUser)
router.get('/mock-users', getMockUsers)
router.post('/mock', setMockUser)
router.delete('/mock', clearMockUser)
export default router

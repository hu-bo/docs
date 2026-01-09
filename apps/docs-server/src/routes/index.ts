import { Router } from 'express'
// import research from './research/index
// import mcp from './mcp/index
import spaceRouter from './space/index'
import spaceFolderRouter from './space-folder/index'
import documentRouter from './document/index'
import commentRouter from './comment/index'
import accessRequestRouter from './access-request/index'
import collabRouter from './collab/index'
import userRouter from './user/index'

const router: Router = Router()

// router.use('/research', research)
// router.use('/mcp', mcp)

// 用户 API
router.use('/user', userRouter)

// 文档系统 API
router.use('/spaces', spaceRouter)
router.use('/space-folder', spaceFolderRouter)
router.use('/documents', documentRouter)
router.use('/comments', commentRouter)
router.use('/access', accessRequestRouter)
router.use('/collab', collabRouter)

export default router

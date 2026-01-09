import { Router, type IRouter } from 'express'
import permitMiddleware from '../../middlewares/permit'
import {
    getFolderDocuments,
    getFolderTree,
    createFolder,
    updateFolder,
    deleteFolder
} from '../../controllers/space-folder/index'

const router: IRouter = Router()

// 所有目录相关接口需要认证
router.use(permitMiddleware)

// 目录内容查询
router.get('/documents', getFolderDocuments)
router.get('/tree', getFolderTree)

// 目录 CRUD
router.post('/', createFolder)
router.put('/:folderId', updateFolder)
router.delete('/:folderId', deleteFolder)

export default router

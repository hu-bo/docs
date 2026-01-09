import { Router, type IRouter } from 'express'
import permitMiddleware from '../../middlewares/permit'
import {
    getSpaces,
    getPersonalSpace,
    getJoinedSpaces,
    getSpaceDetail,
    createSpace,
    updateSpace,
    deleteSpace,
    getSpaceFolders,
    syncFromSpaceDept,
    getSpaceMembers,
    addSpaceMembers,
    updateSpaceMember,
    removeSpaceMember
} from '../../controllers/space/index'

const router: IRouter = Router()

// 所有空间相关接口需要认证
router.use(permitMiddleware)

// 空间列表
router.get('/', getSpaces)
router.get('/personal', getPersonalSpace)
router.get('/joined', getJoinedSpaces)

// 同步部门权限
router.post('/sync-from-space-dept', syncFromSpaceDept)

// 空间 CRUD
router.get('/:spaceId', getSpaceDetail)
router.post('/', createSpace)
router.put('/:spaceId', updateSpace)
router.delete('/:spaceId', deleteSpace)

// 空间文件夹
router.get('/:spaceId/folders', getSpaceFolders)

// 成员管理
router.get('/:spaceId/members', getSpaceMembers)
router.post('/:spaceId/members', addSpaceMembers)
router.put('/:spaceId/members/:username', updateSpaceMember)
router.delete('/:spaceId/members/:username', removeSpaceMember)

export default router

import { Router } from 'express';
import * as spaceController from '../controllers/space.js';

const router = Router();

// 空间管理
router.get('/', spaceController.getSpaces);
router.get('/personal', spaceController.getOrCreatePersonalSpace);
router.get('/:spaceId', spaceController.getSpaceById);
router.get('/:spaceId/access-status', spaceController.checkAccessStatus);
router.post('/', spaceController.createSpace);
router.put('/:spaceId', spaceController.updateSpace);
router.delete('/:spaceId', spaceController.deleteSpace);

// 文件夹管理
router.get('/:spaceId/folders', spaceController.getFolders);
router.post('/:spaceId/folders', spaceController.createFolder);
router.put('/:spaceId/folders/:folderId', spaceController.updateFolder);

// 空间成员管理
router.get('/:spaceId/members', spaceController.getMembers);
router.post('/:spaceId/members', spaceController.addMembers);
router.put('/:spaceId/members', spaceController.updateMember);
router.delete('/:spaceId/members', spaceController.removeMembers);

export default router;

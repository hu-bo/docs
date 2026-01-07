import { Router } from 'express';
import * as documentController from '../controllers/document.js';

const router = Router();

// 文档管理
router.get('/', documentController.getDocuments);
router.get('/recent', documentController.getRecentDocuments); // 注意: /recent 必须在 /:documentId 之前
router.get('/tree', documentController.getDocumentTree); // 注意: /tree 必须在 /:documentId 之前
router.get('/:documentId', documentController.getDocumentById);
router.post('/', documentController.createDocument);
router.put('/:documentId', documentController.updateDocument);
router.put('/:documentId/move', documentController.moveDocument);
router.delete('/:documentId', documentController.deleteDocument);

// 文档成员管理
router.get('/:documentId/members', documentController.getDocMembers);
router.post('/:documentId/members', documentController.addDocMembers);
router.put('/:documentId/members', documentController.updateDocMember);
router.delete('/:documentId/members', documentController.removeDocMembers);

// 文档跨空间绑定
router.get('/:documentId/spaces', documentController.getDocSpaces);
router.post('/:documentId/spaces', documentController.bindDocToSpace);
router.delete('/:documentId/spaces', documentController.unbindDocFromSpace);

export default router;

import { Router } from 'express';
import * as commentController from '../controllers/comment.js';

const router = Router();

// 评论管理
router.get('/:documentId', commentController.getCommentsByDocId);
router.post('/', commentController.createComment);
router.put('/:commentId', commentController.updateComment);
router.delete('/:commentId', commentController.deleteComment);

export default router;

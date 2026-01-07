import { Router } from 'express';
import spaceRoutes from './space.js';
import documentRoutes from './document.js';
import commentRoutes from './comment.js';
import accessRoutes from './access.js';
import userRoutes from './user.js';
import collaborationRoutes from './collaboration.js';

const router = Router();

// 挂载各模块路由
router.use('/spaces', spaceRoutes);
router.use('/documents', documentRoutes);
router.use('/comments', commentRoutes);
router.use('/access', accessRoutes);
router.use('/user', userRoutes);
router.use('/collaboration', collaborationRoutes);

export default router;

import { Router } from 'express';
import { getCurrentUser, switchMockUser, getMockUsers } from '../controllers/user.js';

const router = Router();

// 获取当前用户信息
router.get('/current', getCurrentUser);

// 切换 mock 用户 (仅开发环境)
router.post('/mock', switchMockUser);

// 获取 mock 用户列表 (仅开发环境)
router.get('/mock/list', getMockUsers);

export default router;

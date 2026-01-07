import { Router } from 'express';
import { generateWsToken } from '../websocket/auth.js';
import { success } from '../utils/response.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

/**
 * 获取 WebSocket 认证 token
 * POST /api/collaboration/token
 *
 * 返回用于 WebSocket 连接的短期 token
 */
router.post('/token', (req: AuthenticatedRequest, res) => {
  const token = generateWsToken(req.user!);
  success(res, { token });
});

export default router;

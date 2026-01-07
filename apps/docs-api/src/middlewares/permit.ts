import type { Response, NextFunction } from 'express';
import axios from 'axios';
import md5 from 'md5';
import { config } from '../app-config/index.js';
import { logger } from '../utils/logger.js';
import { unauthorized } from '../utils/response.js';
import type { AuthenticatedRequest } from '../types/index.js';

interface VerifyResponse {
  code: number;
  username: string;
  department?: string;
  dept_id?: string;
}

/**
 * 用户认证中间件
 * 从 Cookie 中获取 session，调用 Dashboard 验证接口
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // 开发/测试环境可跳过认证（取消注释以启用）
  if (config.env === 'development' || config.env === 'test') {
    const mockUsername = req.cookies?.username || 'dev_user';
    req.user = {
      username: mockUsername,
      department: '技术中心',
      deptId: '1001',
    };
    logger.debug(`[Auth] Dev mode, using mock user: ${mockUsername}`);
    return next();
  }

  try {
    const { caller, apikey } = config.dashboard;
    const sessionId = req.cookies?._AJSESSIONID;

    if (!sessionId) {
      logger.warn('[Auth] Missing session cookie');
      return unauthorized(res, '请先登录');
    }

    const ts = Date.now();
    const sign = md5(`caller=${caller}&session_id=${sessionId}&ts=${ts}${apikey}`);
    const url = `http://dashboard-mng.bilibili.co/api/session/verify?ts=${ts}&caller=${caller}&session_id=${sessionId}&sign=${sign}`;

    const { data, status } = await axios.get<VerifyResponse>(url, {
      timeout: 5000,
    });

    if (status === 200 && data.code === 0) {
      req.user = {
        username: data.username,
        department: data.department,
        deptId: data.dept_id,
      };
      logger.debug(`[Auth] User verified: ${data.username}`);
      return next();
    }

    logger.warn(`[Auth] Verify failed: ${JSON.stringify(data)}`);
    return unauthorized(res, '登录已过期，请重新登录');
  } catch (error) {
    logger.error('[Auth] Verify error:', error);
    return unauthorized(res, '认证服务异常');
  }
}

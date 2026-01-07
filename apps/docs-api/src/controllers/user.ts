import type { Response } from 'express';
import axios from 'axios';
import { config } from '../app-config/index.js';
import { logger } from '../utils/logger.js';
import { success, badRequest, serverError } from '../utils/response.js';
import type { AuthenticatedRequest } from '../types/index.js';

interface OAUserResponse {
  code: number;
  data: {
    name: string;
    login_id: string;
    nick_name: string;
    manager: string;
    dept_id: number;
    department_name: string;
    avatar: string;
    workcode: string;
    other_group: number;
  };
  message: string;
}

// Mock 用户列表 (仅开发环境)
const MOCK_USERS = [
  {
    name: 'dev_user',
    login_id: 'dev_user',
    nick_name: '开发用户',
    manager: 'admin',
    dept_id: 1001,
    department_name: '技术中心',
    avatar: '',
    workcode: '000001',
    other_group: 0,
  },
  {
    name: 'test_admin',
    login_id: 'test_admin',
    nick_name: '测试管理员',
    manager: 'admin',
    dept_id: 1001,
    department_name: '技术中心',
    avatar: '',
    workcode: '000002',
    other_group: 0,
  },
  {
    name: 'test_user',
    login_id: 'test_user',
    nick_name: '测试用户',
    manager: 'test_admin',
    dept_id: 1002,
    department_name: '产品中心',
    avatar: '',
    workcode: '000003',
    other_group: 0,
  },
];

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const isDev = config.env === 'development' || config.env === 'test';

  // 开发环境：返回 mock 用户
  if (isDev) {
    const mockUsername = req.cookies?.mock_username || req.user?.username || 'dev_user';
    const mockUser = MOCK_USERS.find(u => u.login_id === mockUsername) || MOCK_USERS[0];
    logger.debug(`[User] Dev mode, returning mock user: ${mockUser.login_id}`);
    return success(res, mockUser);
  }

  // 生产环境：从 OA 系统获取用户信息
  try {
    const sessionId = req.cookies?._AJSESSIONID;
    if (!sessionId) {
      return badRequest(res, '未登录');
    }

    const response = await axios.get<OAUserResponse>('http://api-mlive.bilibili.co/base/oa/user', {
      headers: {
        Cookie: `_AJSESSIONID=${sessionId}`,
      },
      timeout: 5000,
    });

    if (response.data.code === 0) {
      return success(res, response.data.data);
    }

    logger.warn(`[User] OA API failed: ${response.data.message}`);
    return serverError(res, '获取用户信息失败');
  } catch (error) {
    logger.error('[User] OA API error:', error);
    return serverError(res, '获取用户信息失败');
  }
}

/**
 * 切换 mock 用户 (仅开发环境)
 */
export async function switchMockUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const isDev = config.env === 'development' || config.env === 'test';

  if (!isDev) {
    return badRequest(res, '仅开发环境可用');
  }

  const { username } = req.body;
  if (!username || typeof username !== 'string') {
    return badRequest(res, '请提供用户名');
  }

  // 验证用户是否在 mock 列表中
  const mockUser = MOCK_USERS.find(u => u.login_id === username);
  if (!mockUser) {
    return badRequest(res, '无效的用户名');
  }

  // 设置 cookie 来记住选择的 mock 用户
  res.cookie('mock_username', username, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax',
  });

  // 同时设置 username cookie 供 authMiddleware 使用
  res.cookie('username', username, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
  });

  logger.debug(`[User] Switched mock user to: ${username}`);
  return success(res, { username });
}

/**
 * 获取 mock 用户列表 (仅开发环境)
 */
export async function getMockUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const isDev = config.env === 'development' || config.env === 'test';

  if (!isDev) {
    return success(res, []);
  }

  return success(res, MOCK_USERS.map(u => u.login_id));
}

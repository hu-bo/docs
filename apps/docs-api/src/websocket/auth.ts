import jwt from 'jsonwebtoken';
import axios from 'axios';
import md5 from 'md5';
import { config } from '../app-config/index.js';
import { logger } from '../utils/logger.js';
import type { UserInfo } from '../types/index.js';

// WebSocket Token 密钥（生产环境应从配置读取）
const WS_TOKEN_SECRET = process.env.WS_TOKEN_SECRET || 'ws-collaboration-secret-key';
const WS_TOKEN_EXPIRY = '1h'; // 1小时有效期

interface WsTokenPayload {
  username: string;
  department?: string;
  deptId?: string;
  iat: number;
  exp: number;
}

/**
 * 为已认证用户生成 WebSocket token
 */
export function generateWsToken(user: UserInfo): string {
  return jwt.sign(
    {
      username: user.username,
      department: user.department,
      deptId: user.deptId,
    },
    WS_TOKEN_SECRET,
    { expiresIn: WS_TOKEN_EXPIRY }
  );
}

/**
 * 验证 WebSocket token
 */
export function verifyWsToken(token: string): UserInfo | null {
  try {
    const payload = jwt.verify(token, WS_TOKEN_SECRET) as WsTokenPayload;
    return {
      username: payload.username,
      department: payload.department,
      deptId: payload.deptId,
    };
  } catch (error) {
    logger.warn('[WS Auth] Token verification failed:', error);
    return null;
  }
}

/**
 * 通过 Dashboard Session 验证用户（用于直接 WebSocket 连接带 session 的情况）
 */
export async function verifySessionForWs(sessionId: string): Promise<UserInfo | null> {
  // 开发环境跳过验证
  if (config.env === 'development' || config.env === 'test') {
    return {
      username: 'dev_user',
      department: '技术中心',
      deptId: '1001',
    };
  }

  try {
    const { caller, apikey } = config.dashboard;
    const ts = Date.now();
    const sign = md5(`caller=${caller}&session_id=${sessionId}&ts=${ts}${apikey}`);
    const url = `http://dashboard-mng.bilibili.co/api/session/verify?ts=${ts}&caller=${caller}&session_id=${sessionId}&sign=${sign}`;

    const { data, status } = await axios.get(url, { timeout: 5000 });

    if (status === 200 && data.code === 0) {
      return {
        username: data.username,
        department: data.department,
        deptId: data.dept_id,
      };
    }

    return null;
  } catch (error) {
    logger.error('[WS Auth] Session verify error:', error);
    return null;
  }
}

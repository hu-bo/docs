import request from './request';

export interface OAUserInfo {
  name: string;
  login_id: string;
  nick_name: string;
  manager: string;
  dept_id: number;
  department_name: string;
  avatar: string;
  workcode: string;
  other_group: number;
}

/**
 * 获取当前用户信息 (从 OA 系统)
 */
export function getCurrentUser() {
  return request.get<OAUserInfo>('/user/current');
}

/**
 * 切换 mock 用户 (仅本地开发环境有效)
 */
export function switchMockUser(username: string) {
  return request.post<{ username: string }>('/user/mock', { username });
}

/**
 * 获取可用的 mock 用户列表 (仅本地开发环境有效)
 */
export function getMockUsers() {
  return request.get<string[]>('/user/mock/list');
}

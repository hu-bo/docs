import request from './request';
import type { UserInfo } from '@/types';

export function getCurrentUser() {
  return request<UserInfo>({ method: 'GET', url: '/user/current' });
}

// Development only
export function switchMockUser(username: string) {
  return request<void>({ method: 'POST', url: '/user/mock', data: { username } });
}

export function getMockUsers() {
  return request<UserInfo[]>({ method: 'GET', url: '/user/mock-users' });
}

// Development only - clear mock user and use real account
export function clearMockUser() {
  return request<UserInfo>({ method: 'DELETE', url: '/user/mock' });
}

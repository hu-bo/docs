import request from './request';
import type { UserInfo } from '@/types';

export function getCurrentUser() {
  return request.get<any, UserInfo>('/user/current');
}

// Development only
export function switchMockUser(username: string) {
  return request.post('/user/mock', { username });
}

export function getMockUsers() {
  return request.get<any, UserInfo[]>('/user/mock-users');
}

// Development only - clear mock user and use real account
export function clearMockUser() {
  return request.delete<any, UserInfo>('/user/mock');
}

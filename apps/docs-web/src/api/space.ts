import request from './request';
import type { Space, Folder, UserSpaceAuth, PageResult } from '@/types';

export function getSpaces(params: { page: number; pageSize: number; type?: number }) {
  return request<PageResult<Space>>({ method: 'GET', url: '/spaces', params });
}

export function getJoinedSpaces(params?: { page?: number; pageSize?: number }) {
  return request<PageResult<Space>>({ method: 'GET', url: '/spaces/joined', params });
}

export function getOrCreatePersonalSpace() {
  return request<Space>({ method: 'GET', url: '/spaces/personal' });
}

export function getSpaceById(spaceId: string) {
  return request<Space>({ method: 'GET', url: `/spaces/${spaceId}` });
}

export function checkAccessStatus(spaceId: string) {
  return request<{ hasAccess: boolean; auth?: UserSpaceAuth }>({ method: 'GET', url: `/spaces/${spaceId}/access-status` });
}

export function createSpace(data: Partial<Space> & { deptId: number }) {
  return request<Space>({ method: 'POST', url: '/spaces', data });
}

export function updateSpace(spaceId: string, data: Partial<Space>) {
  return request<Space>({ method: 'PUT', url: `/spaces/${spaceId}`, data });
}

export function deleteSpace(spaceId: string) {
  return request<void>({ method: 'DELETE', url: `/spaces/${spaceId}` });
}

export function getFolders(spaceId: string, parentFolderId?: string) {
  return request<Folder[]>({ method: 'GET', url: `/spaces/${spaceId}/folders`, params: { parentFolderId } });
}

export function createFolder(spaceId: string, data: Partial<Folder>) {
  return request<Folder>({ method: 'POST', url: '/space-folder', data: { ...data, spaceId } });
}

export function updateFolder(spaceId: string, folderId: string, data: Partial<Folder>) {
  return request<Folder>({ method: 'PUT', url: `/spaces/${spaceId}/folders/${folderId}`, data });
}

export function getSpaceMembers(spaceId: string, params?: any) {
  return request<UserSpaceAuth[]>({ method: 'GET', url: `/spaces/${spaceId}/members`, params });
}

export function addSpaceMembers(spaceId: string, members: any[]) {
  return request<void>({ method: 'POST', url: `/spaces/${spaceId}/members`, data: { members } });
}

export function updateSpaceMember(spaceId: string, username: string, data: any) {
  return request<void>({ method: 'PUT', url: `/spaces/${spaceId}/members/${username}`, data });
}

export function removeSpaceMembers(spaceId: string, username: string) {
  return request<void>({ method: 'DELETE', url: `/spaces/${spaceId}/members/${username}` });
}

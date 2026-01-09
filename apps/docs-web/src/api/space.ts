import request from './request';
import type { Space, Folder, UserSpaceAuth, PageResult } from '@/types';

export function getSpaces(params: { page: number; pageSize: number; type?: number }) {
  return request.get<any, PageResult<Space>>('/spaces', { params });
}

export function getJoinedSpaces(params?: { page?: number; pageSize?: number }) {
  return request.get<any, PageResult<Space>>('/spaces/joined', { params });
}

export function getOrCreatePersonalSpace() {
  return request.get<any, Space>('/spaces/personal');
}

export function getSpaceById(spaceId: string) {
  return request.get<any, Space>(`/spaces/${spaceId}`);
}

export function checkAccessStatus(spaceId: string) {
  return request.get<any, { hasAccess: boolean; auth?: UserSpaceAuth }>(`/spaces/${spaceId}/access-status`);
}

export function createSpace(data: Partial<Space> & { deptId: number }) {
  return request.post<any, Space>('/spaces', data);
}

export function updateSpace(spaceId: string, data: Partial<Space>) {
  return request.put<any, Space>(`/spaces/${spaceId}`, data);
}

export function deleteSpace(spaceId: string) {
  return request.delete(`/spaces/${spaceId}`);
}

export function getFolders(spaceId: string, parentFolderId?: string) {
  return request.get<any, Folder[]>(`/spaces/${spaceId}/folders`, {
    params: { parentFolderId },
  });
}

export function createFolder(spaceId: string, data: Partial<Folder>) {
  return request.post<any, Folder>(`/spaces/${spaceId}/folders`, data);
}

export function updateFolder(spaceId: string, folderId: string, data: Partial<Folder>) {
  return request.put<any, Folder>(`/spaces/${spaceId}/folders/${folderId}`, data);
}

export function getSpaceMembers(spaceId: string, params?: any) {
  return request.get<any, UserSpaceAuth[]>(`/spaces/${spaceId}/members`, { params });
}

export function addSpaceMembers(spaceId: string, members: any[]) {
  return request.post(`/spaces/${spaceId}/members`, members);
}

export function updateSpaceMember(spaceId: string, username: string, data: any) {
  return request.put(`/spaces/${spaceId}/members/${username}`, data);
}

export function removeSpaceMembers(spaceId: string, username: string) {
  return request.delete(`/spaces/${spaceId}/members/${username}`);
}

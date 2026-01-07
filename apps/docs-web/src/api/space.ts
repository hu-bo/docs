import request from './request';
import type {
  Space,
  Folder,
  UserSpaceAuth,
  PaginatedData,
  CreateSpaceForm,
  CreateFolderForm,
  SpaceMemberForm,
  SpaceType,
} from '@/types';

// 获取空间列表
export function getSpaces(params?: { page?: number; pageSize?: number; spaceType?: SpaceType }) {
  return request.get<PaginatedData<Space>>('/spaces', { params });
}

// 获取或创建个人空间
export function getOrCreatePersonalSpace() {
  return request.get<Space>('/spaces/personal');
}

// 获取空间详情
export function getSpaceById(spaceId: string) {
  return request.get<Space>(`/spaces/${spaceId}`);
}

// 检查用户对空间的访问状态
export interface SpaceAccessStatus {
  hasAccess: boolean;
  isSuperAdmin: boolean;
  canCreateFolder: boolean;
  canCreateDoc: boolean;
  auth: UserSpaceAuth | null;
}

export function checkAccessStatus(spaceId: string) {
  return request.get<SpaceAccessStatus>(`/spaces/${spaceId}/access-status`);
}

// 创建空间
export function createSpace(data: CreateSpaceForm) {
  return request.post<Space>('/spaces', data);
}

// 更新空间
export function updateSpace(spaceId: string, data: Partial<CreateSpaceForm>) {
  return request.put<Space>(`/spaces/${spaceId}`, data);
}

// 删除空间
export function deleteSpace(spaceId: string) {
  return request.delete(`/spaces/${spaceId}`);
}

// 获取文件夹列表
export function getFolders(spaceId: string, parentFolderId?: string) {
  const params: Record<string, unknown> = {};
  if (parentFolderId !== undefined) {
    params.parentFolderId = parentFolderId;
  }
  return request.get<Folder[]>(`/spaces/${spaceId}/folders`, { params });
}

// 创建文件夹
export function createFolder(spaceId: string, data: CreateFolderForm) {
  return request.post<Folder>(`/spaces/${spaceId}/folders`, data);
}

// 更新文件夹
export function updateFolder(spaceId: string, folderId: string, data: { name?: string; visibilityScope?: 'ALL' | 'DEPT_ONLY' }) {
  return request.put<Folder>(`/spaces/${spaceId}/folders/${folderId}`, data);
}

// 获取空间成员列表
export function getSpaceMembers(spaceId: string, params?: { page?: number; pageSize?: number }) {
  return request.get<PaginatedData<UserSpaceAuth>>(`/spaces/${spaceId}/members`, { params });
}

// 批量添加成员
export function addSpaceMembers(spaceId: string, members: SpaceMemberForm[]) {
  return request.post<UserSpaceAuth[]>(`/spaces/${spaceId}/members`, { members });
}

// 更新成员权限
export function updateSpaceMember(spaceId: string, data: SpaceMemberForm) {
  return request.put<UserSpaceAuth>(`/spaces/${spaceId}/members`, data);
}

// 移除成员
export function removeSpaceMembers(spaceId: string, usernames: string[]) {
  return request.delete(`/spaces/${spaceId}/members`, { data: { usernames } });
}

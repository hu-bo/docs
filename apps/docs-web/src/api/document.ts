import request from './request';
import type {
  Doc,
  Folder,
  DocUserAcl,
  DocSpaceBinding,
  PaginatedData,
  CreateDocForm,
  DocMemberForm,
  DocPerm,
  RecentDoc,
} from '@/types';

// 获取最近访问的文档
export function getRecentDocuments(params: { spaceId?: string; limit?: number }) {
  return request.get<RecentDoc[]>('/documents/recent', { params });
}

// 获取文档列表
export function getDocuments(params: { spaceId: string; folderId?: string; page?: number; pageSize?: number }) {
  return request.get<PaginatedData<Doc>>('/documents', { params });
}

// 获取文档树（懒加载）
export function getDocumentTree(params: { spaceId: string; folderId?: string }) {
  return request.get<{ folders: Folder[]; docs: Doc[] }>('/documents/tree', { params });
}

// 获取文档详情
export function getDocumentById(documentId: string) {
  return request.get<Doc>(`/documents/${documentId}`);
}

// 创建文档
export function createDocument(data: CreateDocForm) {
  return request.post<Doc>('/documents', data);
}

// 更新文档
export function updateDocument(documentId: string, data: Partial<CreateDocForm>) {
  return request.put<Doc>(`/documents/${documentId}`, data);
}

// 移动文档
export function moveDocument(documentId: string, folderId: string) {
  return request.put<Doc>(`/documents/${documentId}/move`, { folderId });
}

// 删除文档
export function deleteDocument(documentId: string) {
  return request.delete(`/documents/${documentId}`);
}

// 获取文档成员列表
export function getDocMembers(documentId: string, params?: { page?: number; pageSize?: number }) {
  return request.get<PaginatedData<DocUserAcl>>(`/documents/${documentId}/members`, { params });
}

// 批量添加文档成员
export function addDocMembers(documentId: string, members: DocMemberForm[]) {
  return request.post<DocUserAcl[]>(`/documents/${documentId}/members`, { members });
}

// 更新文档成员权限
export function updateDocMember(documentId: string, data: DocMemberForm) {
  return request.put<DocUserAcl>(`/documents/${documentId}/members`, data);
}

// 移除文档成员
export function removeDocMembers(documentId: string, usernames: string[]) {
  return request.delete(`/documents/${documentId}/members`, { data: { usernames } });
}

// 获取文档绑定的空间
export function getDocSpaces(documentId: string) {
  return request.get<DocSpaceBinding[]>(`/documents/${documentId}/spaces`);
}

// 绑定文档到空间
export function bindDocToSpace(documentId: string, data: { spaceId: string; folderId?: string; perm?: DocPerm }) {
  return request.post(`/documents/${documentId}/spaces`, data);
}

// 解除文档与空间的绑定
export function unbindDocFromSpace(documentId: string, spaceId: string) {
  return request.delete(`/documents/${documentId}/spaces`, { data: { spaceId } });
}

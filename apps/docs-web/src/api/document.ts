import request from './request';
import type { Doc, RecentDoc, TreeNode, PageResult, DocUserAcl, DocSpaceBinding } from '@/types';

export function getRecentDocuments(params?: { limit?: number }) {
  return request.get<any, RecentDoc[]>('/documents/recent', { params });
}

export function getDocuments(params: { spaceId: string; folderId?: string; page?: number; pageSize?: number }) {
  return request.get<any, PageResult<Doc>>('/documents', { params });
}

export function getDocumentTree(params: { spaceId: string; folderId?: string }) {
  return request.get<any, TreeNode[]>('/space-folder/tree', { params });
}

export function getDocumentById(documentId: string) {
  return request.get<any, Doc>(`/documents/${documentId}`);
}

export function createDocument(data: Partial<Doc>) {
  return request.post<any, Doc>('/documents', data);
}

export function updateDocument(documentId: string, data: Partial<Doc>) {
  return request.put<any, Doc>(`/documents/${documentId}`, data);
}

export function moveDocument(documentId: string, folderId: string) {
  return request.put(`/documents/move/${documentId}`, { folderId });
}

export function deleteDocument(documentId: string) {
  return request.delete(`/documents/${documentId}`);
}

export function getDocMembers(documentId: string) {
  return request.get<any, DocUserAcl[]>(`/documents/${documentId}/members`);
}

export function addDocMembers(documentId: string, members: any[]) {
  return request.post(`/documents/${documentId}/members`, members);
}

export function updateDocMember(documentId: string, username: string, data: any) {
  return request.put(`/documents/${documentId}/members/${username}`, data);
}

export function removeDocMembers(documentId: string, username: string) {
  return request.delete(`/documents/${documentId}/members/${username}`);
}

export function getDocSpaces(documentId: string) {
  return request.get<any, DocSpaceBinding[]>(`/documents/${documentId}/spaces`);
}

export function bindDocToSpace(documentId: string, data: any) {
  return request.post(`/documents/${documentId}/spaces`, data);
}

export function unbindDocFromSpace(documentId: string, spaceId: string) {
  return request.delete(`/documents/${documentId}/spaces/${spaceId}`);
}

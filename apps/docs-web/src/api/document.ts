import request from './request';
import type { Doc, RecentDoc, TreeNode, PageResult, DocUserAcl, DocSpaceBinding, FolderContentItem } from '@/types';

export function getRecentDocuments(params?: { limit?: number }) {
  return request<RecentDoc[]>({ method: 'GET', url: '/documents/recent', params });
}

export function getMyParticipatedDocuments(params?: { limit?: number }) {
  return request<RecentDoc[]>({ method: 'GET', url: '/documents/participated', params });
}

export function getDocuments(params: { spaceId: string; folderId?: string; page?: number; pageSize?: number }) {
  return request<PageResult<Doc>>({ method: 'GET', url: '/documents', params });
}

export function getDocumentTree(params: { spaceId: string; folderId?: string }) {
  return request<TreeNode[]>({ method: 'GET', url: '/space-folder/tree', params });
}

export function getFolderContents(params: { spaceId: string; folderId?: string }) {
  return request<FolderContentItem[]>({ method: 'GET', url: '/space-folder/contents', params });
}

export function getDocumentById(documentId: string) {
  return request<Doc>({ method: 'GET', url: `/documents/${documentId}` });
}

export function createDocument(data: Partial<Doc>) {
  return request<Doc>({ method: 'POST', url: '/documents', data });
}

export function updateDocument(documentId: string, data: Partial<Doc>) {
  return request<Doc>({ method: 'PUT', url: `/documents/${documentId}`, data });
}

export function moveDocument(documentId: string, folderId: string) {
  return request<void>({ method: 'PUT', url: `/documents/move/${documentId}`, data: { folderId } });
}

export function deleteDocument(documentId: string) {
  return request<void>({ method: 'DELETE', url: `/documents/${documentId}` });
}

export function getDocMembers(documentId: string) {
  return request<DocUserAcl[]>({ method: 'GET', url: `/documents/${documentId}/members` });
}

export function addDocMembers(documentId: string, data: { members: any[] }) {
  return request<void>({ method: 'POST', url: `/documents/${documentId}/members`, data });
}

export function updateDocMember(documentId: string, username: string, data: any) {
  return request<void>({ method: 'PUT', url: `/documents/${documentId}/members/${username}`, data });
}

export function removeDocMembers(documentId: string, username: string) {
  return request<void>({ method: 'DELETE', url: `/documents/${documentId}/members/${username}` });
}

export function getDocSpaces(documentId: string) {
  return request<DocSpaceBinding[]>({ method: 'GET', url: `/documents/${documentId}/spaces` });
}

export function bindDocToSpace(documentId: string, data: any) {
  return request<void>({ method: 'POST', url: `/documents/${documentId}/spaces`, data });
}

export function unbindDocFromSpace(documentId: string, spaceId: string) {
  return request<void>({ method: 'DELETE', url: `/documents/${documentId}/spaces/${spaceId}` });
}

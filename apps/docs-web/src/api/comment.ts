import request from './request';
import { Comment, PageResult } from '@/types';

export function getComments(documentId: string, params?: any) {
  return request<PageResult<Comment>>({ method: 'GET', url: `/comments/${documentId}`, params });
}

export function createComment(data: any) {
  return request<Comment>({ method: 'POST', url: '/comments', data });
}

export function updateComment(commentId: string, content: string) {
  return request<Comment>({ method: 'PUT', url: `/comments/${commentId}`, data: { content } });
}

export function deleteComment(commentId: string) {
  return request<void>({ method: 'DELETE', url: `/comments/${commentId}` });
}

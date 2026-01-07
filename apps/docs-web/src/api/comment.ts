import request from './request';
import type { Comment, PaginatedData } from '@/types';

// 获取文档评论
export function getComments(documentId: string, params?: { page?: number; pageSize?: number }) {
  return request.get<PaginatedData<Comment>>(`/comments/${documentId}`, { params });
}

// 创建评论
export function createComment(data: { docId: string; parentId?: string; content: string }) {
  return request.post<Comment>('/comments', data);
}

// 更新评论
export function updateComment(commentId: string, content: string) {
  return request.put<Comment>(`/comments/${commentId}`, { content });
}

// 删除评论
export function deleteComment(commentId: string) {
  return request.delete(`/comments/${commentId}`);
}

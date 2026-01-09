import request from './request';

export function getComments(documentId: string, params?: any) {
  return request.get(`/comments/${documentId}`, { params });
}

export function createComment(data: any) {
  return request.post('/comments', data);
}

export function updateComment(commentId: string, content: string) {
  return request.put(`/comments/${commentId}`, { content });
}

export function deleteComment(commentId: string) {
  return request.delete(`/comments/${commentId}`);
}

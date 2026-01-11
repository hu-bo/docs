import request from './request';

export function getCollaborationToken(docId: string) {
  return request<{ token: string; docName: string; role: 'editor' | 'reader'; wsUrl: string }>({
    method: 'POST',
    url: '/collab/token',
    data: { docId },
  });
}

export function getWebSocketUrl(documentId: string, token: string) {
  // WebSocket URL: /collab path proxied to server
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/collab?token=${token}`;
}

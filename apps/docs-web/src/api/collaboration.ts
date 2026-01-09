import request from './request';

export function getCollaborationToken() {
  return request.post<any, { token: string }>('/collaboration/token');
}

export function getWebSocketUrl(documentId: string, token: string) {
  // Use relative path if proxy is set up for WS, or absolute URL if needed.
  // Based on vite.config.ts, /ws/ points to ws://127.0.0.1:3002
  // We can use the current host but replace protocol with ws/wss and path with /ws
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws/collab/${documentId}?token=${token}`;
}

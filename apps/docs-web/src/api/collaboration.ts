import request from './request';

interface WsTokenResponse {
  token: string;
}

/**
 * 获取 WebSocket 认证 token
 */
export function getCollaborationToken(): Promise<WsTokenResponse> {
  return request.post<WsTokenResponse>('/collaboration/token');
}

/**
 * 获取 WebSocket 连接 URL
 */
export function getWebSocketUrl(documentId: string, token: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = "127.0.0.1:3002"; // Adjusted for local development
  return `${protocol}//${host}/ws/collab?doc=doc-${documentId}&token=${token}`;
}

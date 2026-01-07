import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getCollaborationToken } from '@/api/collaboration';

export interface CollaborationUser {
  clientId: number;
  username: string;
  name: string;
  color: string;
  avatar?: string;
}

export const useCollaborationStore = defineStore('collaboration', () => {
  // 连接状态
  const isConnected = ref(false);
  const connectionStatus = ref<'connecting' | 'connected' | 'disconnected'>('disconnected');

  // 在线用户
  const onlineUsers = ref<CollaborationUser[]>([]);

  // 当前文档 ID
  const currentDocumentId = ref<string | null>(null);

  // WebSocket token 缓存
  const wsToken = ref<string | null>(null);
  const tokenExpiry = ref<number>(0);

  /**
   * 获取 WebSocket token
   * 带缓存，避免重复请求
   */
  async function fetchWsToken(): Promise<string> {
    const now = Date.now();

    // 如果 token 还有效（至少还有 5 分钟），直接返回
    if (wsToken.value && tokenExpiry.value > now + 5 * 60 * 1000) {
      return wsToken.value;
    }

    // 请求新 token
    const response = await getCollaborationToken();
    wsToken.value = response.token;
    // token 有效期 1 小时
    tokenExpiry.value = now + 60 * 60 * 1000;

    return response.token;
  }

  /**
   * 更新在线用户列表
   */
  function updateOnlineUsers(users: CollaborationUser[]) {
    onlineUsers.value = users;
  }

  /**
   * 设置连接状态
   */
  function setConnectionStatus(status: typeof connectionStatus.value) {
    connectionStatus.value = status;
    isConnected.value = status === 'connected';
  }

  /**
   * 设置当前文档 ID
   */
  function setCurrentDocument(documentId: string | null) {
    currentDocumentId.value = documentId;
  }

  /**
   * 重置状态
   */
  function reset() {
    isConnected.value = false;
    connectionStatus.value = 'disconnected';
    onlineUsers.value = [];
    currentDocumentId.value = null;
  }

  return {
    // 状态
    isConnected,
    connectionStatus,
    onlineUsers,
    currentDocumentId,
    wsToken,

    // 方法
    fetchWsToken,
    updateOnlineUsers,
    setConnectionStatus,
    setCurrentDocument,
    reset,
  };
});

import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ConnectionStatus, CollaborationUser } from '@/types';
import * as collaborationApi from '@/api/collaboration';

// Token cache with TTL
let tokenCache: { token: string; expiresAt: number } | null = null;
const TOKEN_TTL = 5 * 60 * 1000; // 5 minutes

export const useCollaborationStore = defineStore('collaboration', () => {
  // State
  const isConnected = ref(false);
  const connectionStatus = ref<ConnectionStatus>('disconnected');
  const onlineUsers = ref<CollaborationUser[]>([]);
  const currentDocumentId = ref<string | null>(null);
  const wsToken = ref<string | null>(null);

  // Actions
  async function fetchWsToken(forceRefresh = false): Promise<string> {
    // Check cache first
    if (!forceRefresh && tokenCache && Date.now() < tokenCache.expiresAt) {
      wsToken.value = tokenCache.token;
      return tokenCache.token;
    }

    try {
      const data = await collaborationApi.getCollaborationToken();
      const token = data.token;

      // Update cache
      tokenCache = {
        token,
        expiresAt: Date.now() + TOKEN_TTL,
      };

      wsToken.value = token;
      return token;
    } catch (error) {
      console.error('Failed to fetch collaboration token:', error);
      throw error;
    }
  }

  function getWebSocketUrl(documentId: string, token: string): string {
    return collaborationApi.getWebSocketUrl(documentId, token);
  }

  function updateOnlineUsers(users: CollaborationUser[]) {
    onlineUsers.value = users;
  }

  function setConnectionStatus(status: ConnectionStatus) {
    connectionStatus.value = status;
    isConnected.value = status === 'connected';
  }

  function setCurrentDocumentId(documentId: string | null) {
    currentDocumentId.value = documentId;
  }

  function reset() {
    isConnected.value = false;
    connectionStatus.value = 'disconnected';
    onlineUsers.value = [];
    currentDocumentId.value = null;
    wsToken.value = null;
  }

  function clearTokenCache() {
    tokenCache = null;
    wsToken.value = null;
  }

  return {
    // State
    isConnected,
    connectionStatus,
    onlineUsers,
    currentDocumentId,
    wsToken,
    // Actions
    fetchWsToken,
    getWebSocketUrl,
    updateOnlineUsers,
    setConnectionStatus,
    setCurrentDocumentId,
    reset,
    clearTokenCache,
  };
});

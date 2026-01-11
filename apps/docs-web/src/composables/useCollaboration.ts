import { ref, shallowRef, computed, onBeforeUnmount, watch, type Ref } from 'vue';
import { HocuspocusProvider, WebSocketStatus } from '@hocuspocus/provider';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import type { ConnectionStatus, CollaborationUser } from '@/types';
import { useCollaborationStore } from '@/stores/collaboration';

export interface UseCollaborationOptions {
  documentId: string;
  username: string;
  displayName?: string;
  userColor?: string;
  avatar?: string;
  enabled?: boolean;
}

export function useCollaboration(options: Ref<UseCollaborationOptions>) {
  const collaborationStore = useCollaborationStore();

  // Yjs document instance - created per connection (use shallowRef for reactivity)
  const ydoc = shallowRef<Y.Doc | null>(null);

  // Local offline cache (optional)
  let idbPersistence: IndexeddbPersistence | null = null;

  // WebSocket provider
  const provider = ref<HocuspocusProvider | null>(null);
  const wsStatus = ref<WebSocketStatus>(WebSocketStatus.Disconnected);
  const error = ref<string | null>(null);

  // Connection status
  const connectionStatus = computed<ConnectionStatus>(() => {
    switch (wsStatus.value) {
      case WebSocketStatus.Connected:
        return 'connected';
      case WebSocketStatus.Connecting:
        return 'connecting';
      default:
        return 'disconnected';
    }
  });

  const isConnected = computed(() => connectionStatus.value === 'connected');

  // Online users from awareness
  const onlineUsers = ref<CollaborationUser[]>([]);

  // Random color generator for cursor
  function generateColor(): string {
    const colors = [
      '#f97316', '#ef4444', '#22c55e', '#3b82f6', '#8b5cf6',
      '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#84cc16'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Connect to collaboration server
  async function connect() {
    if (!options.value.enabled) return;

    // Cleanup old connection
    disconnect();

    try {
      error.value = null;

      // Create new Yjs document for this connection
      ydoc.value = new Y.Doc();

      // Get collaboration token
      const token = await collaborationStore.fetchWsToken(options.value.documentId);
      const wsUrl = collaborationStore.getWebSocketUrl(options.value.documentId, token);

      // Setup local offline cache
      idbPersistence = new IndexeddbPersistence(`doc.${options.value.documentId}`, ydoc.value);

      // Create HocuspocusProvider
      const p = new HocuspocusProvider({
        url: wsUrl,
        name: options.value.documentId,
        document: ydoc.value,
        token,
        connect: true,
        onStatus: (event) => {
          wsStatus.value = event.status;
          collaborationStore.setConnectionStatus(connectionStatus.value);
        },
        onAuthenticationFailed: async () => {
          // Re-fetch token and reconnect
          try {
            const newToken = await collaborationStore.fetchWsToken(options.value.documentId, true);
            p.disconnect();
            // @ts-expect-error - hocuspocus provider token is configurable
            p.configuration.token = newToken;
            p.connect();
          } catch (err) {
            error.value = 'Authentication failed';
            console.error('Collaboration auth failed:', err);
          }
        },
        onSynced: () => {
          // Document synced with server
          console.log('Document synced');
        },
        onAwarenessUpdate: ({ states }) => {
          // Update online users from awareness
          const users: CollaborationUser[] = [];
          states.forEach((state) => {
            if (state.user) {
              users.push({
                username: state.user.name || 'Anonymous',
                displayName: state.user.displayName,
                avatar: state.user.avatar,
                color: state.user.color || generateColor(),
              });
            }
          });
          onlineUsers.value = users;
          collaborationStore.updateOnlineUsers(users);
        },
      });

      // Set awareness user info
      const userColor = options.value.userColor || generateColor();
      p.setAwarenessField('user', {
        name: options.value.username,
        displayName: options.value.displayName || options.value.username,
        avatar: options.value.avatar,
        color: userColor,
      });

      provider.value = p;
      collaborationStore.setCurrentDocumentId(options.value.documentId);
    } catch (err) {
      error.value = 'Failed to connect';
      console.error('Collaboration connect error:', err);
    }
  }

  // Disconnect from collaboration server
  function disconnect() {
    if (provider.value) {
      provider.value.destroy();
      provider.value = null;
    }
    if (idbPersistence) {
      idbPersistence.destroy();
      idbPersistence = null;
    }
    if (ydoc.value) {
      ydoc.value.destroy();
      ydoc.value = null;
    }
    wsStatus.value = WebSocketStatus.Disconnected;
    onlineUsers.value = [];
    collaborationStore.reset();
  }

  // Get Tiptap collaboration extensions
  const collaborationExtensions = computed(() => {
    if (!provider.value || !ydoc.value) return [];

    return [
      Collaboration.configure({
        document: ydoc.value,
      }),
      CollaborationCursor.configure({
        provider: provider.value,
        user: {
          name: options.value.displayName || options.value.username,
          color: options.value.userColor || generateColor(),
        },
      }),
    ];
  });

  // Watch for option changes
  watch(
    () => options.value.documentId,
    (newId, oldId) => {
      if (newId !== oldId && options.value.enabled) {
        connect();
      }
    }
  );

  watch(
    () => options.value.enabled,
    (enabled) => {
      if (enabled) {
        connect();
      } else {
        disconnect();
      }
    }
  );

  // Cleanup on unmount
  onBeforeUnmount(() => {
    disconnect();
  });

  return {
    provider,
    isConnected,
    connectionStatus,
    onlineUsers,
    error,
    collaborationExtensions,
    connect,
    disconnect,
  };
}

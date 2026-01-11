<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Save, X, Trash2, Settings, Clock } from 'lucide-vue-next';
import dayjs from 'dayjs';
import { useDocumentStore } from '@/stores/document';
import { useSpaceStore } from '@/stores/space';
import { useUserStore } from '@/stores/user';
import { useCollaboration } from '@/composables/useCollaboration';
import TiptapEditor from '@/components/editor/TiptapEditor.vue';
import CollaborationUsers from '@/components/editor/CollaborationUsers.vue';
import type { AccessMode } from '@/types';

const route = useRoute();
const router = useRouter();
const documentStore = useDocumentStore();
const spaceStore = useSpaceStore();
const userStore = useUserStore();

const spaceId = computed(() => route.params.spaceId as string);
const documentId = computed(() => route.params.documentId as string);
const isNewDocument = computed(() => route.name === 'DocumentNew' || route.name === 'FolderDocumentNew');
const folderPath = computed(() => route.params.folderPath as string | string[] | undefined);
const folderId = computed(() => {
  // First check query param (from context menu "add document in folder")
  if (route.query.folderId) {
    return route.query.folderId as string;
  }
  // Then check route params (from FolderDocumentNew route)
  if (folderPath.value) {
    const segments = Array.isArray(folderPath.value) ? folderPath.value : [folderPath.value];
    return segments[segments.length - 1];
  }
  return undefined;
});

const title = ref('');
const content = ref('');
const accessMode = ref<AccessMode>('OPEN_EDIT');
const saving = ref(false);
const deleting = ref(false);
const showSettingsModal = ref(false);
const hasChanges = ref(false);
const lastSavedAt = ref<string | null>(null);

const collabOptions = computed(() => ({
  documentId: documentId.value,
  username: userStore.username,
  displayName: userStore.displayName,
  avatar: userStore.avatar,
  enabled: true,
}));

const {
  isConnected,
  connectionStatus,
  onlineUsers,
  collaborationExtensions,
  connect,
  disconnect,
} = useCollaboration(collabOptions);

onMounted(async () => {
  if (!isNewDocument.value) {
    await loadDocument();
    await connect();
  }
});

onBeforeUnmount(() => {
  disconnect();
});

watch(documentId, async (newId, oldId) => {
  if (newId !== oldId) {
    await loadDocument();
    disconnect();
    await connect();
  }
});

async function loadDocument() {
  if (!documentId.value) return;

  try {
    const doc = await documentStore.fetchDocumentById(documentId.value);
    title.value = doc.title;
    content.value = doc.content || '';
    accessMode.value = doc.accessMode;
    lastSavedAt.value = doc.mtime;
    hasChanges.value = false;
  } catch (error) {
    console.error('Failed to load document:', error);
  }
}

function handleContentUpdate(newContent: string) {
  content.value = newContent;
  hasChanges.value = true;
}

function handleTitleInput() {
  hasChanges.value = true;
}

async function handleSave() {
  if (!title.value.trim()) {
    alert('请输入文档标题');
    return;
  }

  saving.value = true;
  try {
    if (isNewDocument.value) {
      // 创建新文档
      const newDoc = await documentStore.createDocument({
        title: title.value.trim(),
        spaceId: spaceId.value,
        folderId: folderId.value || '',
        accessMode: accessMode.value,
        content: content.value,
      });

      await documentStore.fetchDocumentTree(spaceId.value);
      hasChanges.value = false;

      // 跳转到编辑页面
      router.replace({
        name: 'DocumentEdit',
        params: { spaceId: spaceId.value, documentId: newDoc.documentId },
      });
    } else {
      const updated = await documentStore.updateDocument(documentId.value, {
        title: title.value.trim(),
        content: content.value,
        accessMode: accessMode.value,
      });

      lastSavedAt.value = updated.mtime;
      hasChanges.value = false;
      await documentStore.fetchDocumentTree(spaceId.value);
    }
  } catch (error) {
    console.error('Failed to save document:', error);
    alert('保存失败，请重试');
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (!confirm('确定要删除这个文档吗？此操作不可撤销。')) return;

  deleting.value = true;
  try {
    await documentStore.deleteDocument(documentId.value);
    await documentStore.fetchDocumentTree(spaceId.value);
    router.push({ name: 'SpaceHome', params: { spaceId: spaceId.value } });
  } catch (error) {
    console.error('Failed to delete document:', error);
    alert('删除失败，请重试');
  } finally {
    deleting.value = false;
  }
}

function handleCancel() {
  if (hasChanges.value && !confirm('有未保存的更改，确定要离开吗？')) {
    return;
  }

  if (isNewDocument.value) {
    // 新建文档取消时返回空间首页
    router.push({ name: 'SpaceHome', params: { spaceId: spaceId.value } });
    return;
  }

  const folderPath = route.params.folderPath;
  if (folderPath) {
    router.push({
      name: 'FolderDocumentView',
      params: { spaceId: spaceId.value, folderPath, documentId: documentId.value },
    });
  } else {
    router.push({
      name: 'DocumentView',
      params: { spaceId: spaceId.value, documentId: documentId.value },
    });
  }
}

function saveSettings() {
  hasChanges.value = true;
  showSettingsModal.value = false;
}
</script>

<template>
  <div class="min-h-[calc(100vh-64px)] bg-base-200">
    <!-- Toolbar -->
    <div class="sticky top-16 z-40 bg-base-100 border-b border-base-300 px-6 py-3">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <!-- Left: Connection Status & Online Users -->
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <div
              class="w-2 h-2 rounded-full"
              :class="{
                'bg-success': isConnected,
                'bg-warning': connectionStatus === 'connecting',
                'bg-error': connectionStatus === 'disconnected',
              }"
            ></div>
            <span class="text-xs opacity-60">
              {{ isConnected ? '已连接' : connectionStatus === 'connecting' ? '连接中...' : '未连接' }}
            </span>
          </div>

          <CollaborationUsers v-if="onlineUsers.length > 0" :users="onlineUsers" />

          <div v-if="lastSavedAt" class="flex items-center gap-1 text-xs opacity-60">
            <Clock class="w-3 h-3" />
            <span>{{ dayjs(lastSavedAt).format('YYYY-MM-DD HH:mm:ss') }}</span>
          </div>
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-2">
          <button
            class="btn btn-ghost btn-sm btn-square"
            title="文档设置"
            @click="showSettingsModal = true"
          >
            <Settings class="w-5 h-5" />
          </button>

          <button class="btn btn-ghost btn-sm" @click="handleCancel">
            <X class="w-4 h-4" />
            取消
          </button>

          <button class="btn btn-primary btn-sm" :disabled="saving" @click="handleSave">
            <span v-if="saving" class="loading loading-spinner loading-sm"></span>
            <Save v-else class="w-4 h-4" />
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- Editor Area -->
    <div class="max-w-4xl mx-auto py-18 px-6">
      <input
        v-model="title"
        type="text"
        placeholder="无标题文档"
        class="input input-ghost w-full text-4xl font-bold p-0 mb-6 focus:outline-none"
        @input="handleTitleInput"
      />

      <TiptapEditor
        :model-value="content"
        :collaboration-extensions="collaborationExtensions"
        placeholder="开始编写内容..."
        :editable="true"
        @update:model-value="handleContentUpdate"
      />
    </div>

    <!-- Settings Modal -->
    <dialog class="modal" :class="{ 'modal-open': showSettingsModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">文档设置</h3>

        <div class="py-4 space-y-4">
          <!-- Access Mode -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">访问模式</span>
            </label>
            <div class="space-y-2">
              <label
                class="label cursor-pointer justify-start gap-4 border rounded-lg p-4"
                :class="{ 'border-success bg-success/10': accessMode === 'OPEN_EDIT' }"
              >
                <input type="radio" v-model="accessMode" value="OPEN_EDIT" class="radio radio-success" />
                <div>
                  <p class="font-medium">公开编辑</p>
                  <p class="text-xs opacity-60">所有人可查看和编辑</p>
                </div>
              </label>

              <label
                class="label cursor-pointer justify-start gap-4 border rounded-lg p-4"
                :class="{ 'border-info bg-info/10': accessMode === 'OPEN_READONLY' }"
              >
                <input type="radio" v-model="accessMode" value="OPEN_READONLY" class="radio radio-info" />
                <div>
                  <p class="font-medium">公开只读</p>
                  <p class="text-xs opacity-60">所有人可查看，指定用户可编辑</p>
                </div>
              </label>

              <label
                class="label cursor-pointer justify-start gap-4 border rounded-lg p-4"
                :class="{ 'border-warning bg-warning/10': accessMode === 'WHITELIST_ONLY' }"
              >
                <input type="radio" v-model="accessMode" value="WHITELIST_ONLY" class="radio radio-warning" />
                <div>
                  <p class="font-medium">白名单</p>
                  <p class="text-xs opacity-60">仅白名单用户可访问</p>
                </div>
              </label>
            </div>
          </div>

          <!-- Delete Button -->
          <div class="divider"></div>
          <button
            class="btn btn-ghost btn-sm text-error"
            :disabled="deleting"
            @click="handleDelete"
          >
            <Trash2 class="w-4 h-4" />
            {{ deleting ? '删除中...' : '删除文档' }}
          </button>
        </div>

        <div class="modal-action">
          <button class="btn" @click="showSettingsModal = false">取消</button>
          <button class="btn btn-primary" @click="saveSettings">确定</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showSettingsModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>

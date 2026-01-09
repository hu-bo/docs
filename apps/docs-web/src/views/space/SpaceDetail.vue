<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  Users,
  MoreHorizontal,
  Folder,
  FolderPlus,
  FilePlus,
} from 'lucide-vue-next';
import { useSpaceStore } from '@/stores/space';
import { useDocumentStore } from '@/stores/document';
import type { TreeNode } from '@/types';

const route = useRoute();
const router = useRouter();
const spaceStore = useSpaceStore();
const documentStore = useDocumentStore();

const spaceId = computed(() => route.params.spaceId as string);
const expandedFolders = ref<Set<string>>(new Set());
const showContextMenu = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const contextMenuTarget = ref<TreeNode | null>(null);

// Create modals
const showCreateFolderModal = ref(false);
const showCreateDocModal = ref(false);
const newFolderName = ref('');
const newDocTitle = ref('');
const creating = ref(false);

onMounted(async () => {
  await loadSpaceData();
});

watch(spaceId, async () => {
  await loadSpaceData();
});

async function loadSpaceData() {
  if (!spaceId.value) return;

  try {
    await Promise.all([
      spaceStore.fetchSpaceById(spaceId.value),
      documentStore.fetchDocumentTree(spaceId.value),
    ]);
  } catch (error) {
    console.error('Failed to load space data:', error);
  }
}

function toggleFolder(folderId: string) {
  if (expandedFolders.value.has(folderId)) {
    expandedFolders.value.delete(folderId);
  } else {
    expandedFolders.value.add(folderId);
  }
}

function handleNodeClick(node: TreeNode) {
  if (node.type === 'folder') {
    toggleFolder(node.key);
  } else {
    router.push({
      name: 'DocumentView',
      params: { spaceId: spaceId.value, documentId: node.key },
    });
  }
}

function handleContextMenu(event: MouseEvent, node: TreeNode) {
  event.preventDefault();
  contextMenuTarget.value = node;
  contextMenuPosition.value = { x: event.clientX, y: event.clientY };
  showContextMenu.value = true;
}

function closeContextMenu() {
  showContextMenu.value = false;
  contextMenuTarget.value = null;
}

function handleEditNode() {
  if (!contextMenuTarget.value) return;

  if (contextMenuTarget.value.type === 'doc') {
    router.push({
      name: 'DocumentEdit',
      params: { spaceId: spaceId.value, documentId: contextMenuTarget.value.key },
    });
  }
  closeContextMenu();
}

function handleAddSubDoc() {
  if (!contextMenuTarget.value || contextMenuTarget.value.type !== 'folder') return;
  showCreateDocModal.value = true;
  closeContextMenu();
}

async function handleCreateFolder() {
  if (!newFolderName.value.trim()) return;

  creating.value = true;
  try {
    const parentId = contextMenuTarget.value?.type === 'folder'
      ? contextMenuTarget.value.key
      : undefined;

    await spaceStore.createFolder(spaceId.value, {
      name: newFolderName.value.trim(),
      parentId,
      visibilityScope: 'ALL',
    });

    await documentStore.fetchDocumentTree(spaceId.value);
    showCreateFolderModal.value = false;
    newFolderName.value = '';
  } catch (error) {
    console.error('Failed to create folder:', error);
  } finally {
    creating.value = false;
  }
}

async function handleCreateDoc() {
  if (!newDocTitle.value.trim()) return;

  creating.value = true;
  try {
    const folderId = contextMenuTarget.value?.type === 'folder'
      ? contextMenuTarget.value.key
      : undefined;

    const newDoc = await documentStore.createDocument({
      title: newDocTitle.value.trim(),
      spaceId: spaceId.value,
      folderId,
      accessMode: 'OPEN_EDIT',
      content: '',
    });

    await documentStore.fetchDocumentTree(spaceId.value);
    showCreateDocModal.value = false;
    newDocTitle.value = '';

    router.push({
      name: 'DocumentEdit',
      params: { spaceId: spaceId.value, documentId: newDoc.documentId },
    });
  } catch (error) {
    console.error('Failed to create document:', error);
  } finally {
    creating.value = false;
  }
}

function goToMembers() {
  router.push({ name: 'SpaceMembers', params: { spaceId: spaceId.value } });
}
</script>

<template>
  <div class="flex h-[calc(100vh-64px)]">
    <!-- Sidebar - Document Tree -->
    <aside class="w-72 bg-base-100 border-r border-base-300 flex flex-col">
      <!-- Space Header -->
      <div class="p-4 border-b border-base-300">
        <div class="flex items-center justify-between">
          <h2 class="font-bold truncate">
            {{ spaceStore.currentSpace?.name || '加载中...' }}
          </h2>
          <div class="flex items-center gap-1">
            <button
              v-if="spaceStore.isSuperAdmin"
              class="btn btn-ghost btn-xs btn-square"
              title="成员管理"
              @click="goToMembers"
            >
              <Users class="w-4 h-4" />
            </button>
            <div class="dropdown dropdown-end">
              <button tabindex="0" class="btn btn-ghost btn-xs btn-square">
                <MoreHorizontal class="w-4 h-4" />
              </button>
              <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-40">
                <li v-if="spaceStore.canCreateFolder">
                  <a @click="showCreateFolderModal = true">
                    <FolderPlus class="w-4 h-4" />
                    新建文件夹
                  </a>
                </li>
                <li v-if="spaceStore.canCreateDoc">
                  <a @click="showCreateDocModal = true">
                    <FilePlus class="w-4 h-4" />
                    新建文档
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Tree View -->
      <div class="flex-1 overflow-y-auto p-2">
        <template v-if="documentStore.documentTree.length > 0">
          <div
            v-for="node in documentStore.documentTree"
            :key="node.key"
            class="select-none"
          >
            <!-- Tree Node -->
            <div
              class="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-base-200 transition-colors"
              :class="{ 'bg-primary/10 text-primary': route.params.documentId === node.key }"
              @click="handleNodeClick(node)"
              @contextmenu="handleContextMenu($event, node)"
            >
              <span v-if="node.type === 'folder'" class="w-4 h-4 flex items-center justify-center">
                <ChevronDown v-if="expandedFolders.has(node.key)" class="w-4 h-4 opacity-50" />
                <ChevronRight v-else class="w-4 h-4 opacity-50" />
              </span>
              <span v-else class="w-4"></span>

              <Folder v-if="node.type === 'folder'" class="w-4 h-4 text-warning shrink-0" />
              <FileText v-else class="w-4 h-4 text-info shrink-0" />

              <span class="text-sm truncate">{{ node.title }}</span>
            </div>

            <!-- Children -->
            <div
              v-if="node.type === 'folder' && expandedFolders.has(node.key) && node.children"
              class="ml-4"
            >
              <div
                v-for="child in node.children"
                :key="child.key"
                class="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-base-200 transition-colors"
                :class="{ 'bg-primary/10 text-primary': route.params.documentId === child.key }"
                @click="handleNodeClick(child)"
                @contextmenu="handleContextMenu($event, child)"
              >
                <span class="w-4"></span>
                <FileText v-if="child.type === 'doc'" class="w-4 h-4 text-info shrink-0" />
                <Folder v-else class="w-4 h-4 text-warning shrink-0" />
                <span class="text-sm truncate">{{ child.title }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- Empty State -->
        <div v-else class="text-center py-8 opacity-50">
          <FolderOpen class="w-12 h-12 mx-auto mb-2" />
          <p class="text-sm">暂无内容</p>
          <button
            v-if="spaceStore.canCreateDoc"
            class="link link-primary text-sm mt-3"
            @click="showCreateDocModal = true"
          >
            创建第一个文档
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto bg-base-200">
      <router-view />
    </main>

    <!-- Context Menu -->
    <Teleport to="body">
      <div
        v-if="showContextMenu"
        class="fixed z-50"
        :style="{ top: `${contextMenuPosition.y}px`, left: `${contextMenuPosition.x}px` }"
      >
        <ul class="menu bg-base-100 rounded-box shadow-lg w-36">
          <li v-if="contextMenuTarget?.type === 'doc'">
            <a @click="handleEditNode">编辑</a>
          </li>
          <li v-if="contextMenuTarget?.type === 'folder' && spaceStore.canCreateDoc">
            <a @click="handleAddSubDoc">添加文档</a>
          </li>
        </ul>
      </div>
      <div v-if="showContextMenu" class="fixed inset-0 z-40" @click="closeContextMenu" />
    </Teleport>

    <!-- Create Folder Modal -->
    <dialog class="modal" :class="{ 'modal-open': showCreateFolderModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">新建文件夹</h3>
        <div class="py-4">
          <input
            v-model="newFolderName"
            type="text"
            placeholder="文件夹名称"
            class="input input-bordered w-full"
            @keydown.enter="handleCreateFolder"
          />
        </div>
        <div class="modal-action">
          <button class="btn" @click="showCreateFolderModal = false">取消</button>
          <button class="btn btn-primary" :disabled="creating" @click="handleCreateFolder">
            <span v-if="creating" class="loading loading-spinner loading-sm"></span>
            创建
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showCreateFolderModal = false">close</button>
      </form>
    </dialog>

    <!-- Create Doc Modal -->
    <dialog class="modal" :class="{ 'modal-open': showCreateDocModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">新建文档</h3>
        <div class="py-4">
          <input
            v-model="newDocTitle"
            type="text"
            placeholder="文档标题"
            class="input input-bordered w-full"
            @keydown.enter="handleCreateDoc"
          />
        </div>
        <div class="modal-action">
          <button class="btn" @click="showCreateDocModal = false">取消</button>
          <button class="btn btn-primary" :disabled="creating" @click="handleCreateDoc">
            <span v-if="creating" class="loading loading-spinner loading-sm"></span>
            创建
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showCreateDocModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>

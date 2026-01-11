<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  FolderOpen,
  Users,
  MoreHorizontal,
  FolderPlus,
  FilePlus,
} from 'lucide-vue-next';
import TreeNodeItem from '@/components/TreeNodeItem.vue';
import { useSpaceStore } from '@/stores/space';
import { useDocumentStore } from '@/stores/document';
import type { TreeNode } from '@/types';

const route = useRoute();
const router = useRouter();
const spaceStore = useSpaceStore();
const documentStore = useDocumentStore();

const spaceId = computed(() => route.params.spaceId as string);
const currentDocId = computed(() => route.params.documentId as string | undefined);
const currentFolderPath = computed(() => route.params.folderPath as string | string[] | undefined);
const currentFolderId = computed(() => {
  const folderPath = route.params.folderPath;
  if (folderPath) {
    const segments = Array.isArray(folderPath) ? folderPath : [folderPath];
    return segments[segments.length - 1];
  }
  return undefined;
});
const expandedFolders = ref<Set<string>>(new Set());
const loadingFolders = ref<Set<string>>(new Set());
const showContextMenu = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const contextMenuTarget = ref<TreeNode | null>(null);

// Create modals
const showCreateFolderModal = ref(false);
const newFolderName = ref('');
const newFolderVisibility = ref<'ALL' | 'DEPT_ONLY'>('ALL');
const creating = ref(false);

onMounted(async () => {
  await loadSpaceData();
  // 如果 URL 中有 folderId，自动展开到该目录
  const folderId = currentFolderId.value;
  if (folderId && documentStore.documentTree.length > 0) {
    await expandToFolder(folderId);
  }
});

watch(spaceId, async () => {
  expandedFolders.value.clear();
  loadingFolders.value.clear();
  await loadSpaceData();
});

// 当 URL 中的 folderId 变化时，自动展开到该目录
watch(currentFolderId, async (newFolderId) => {
  if (newFolderId && documentStore.documentTree.length > 0) {
    await expandToFolder(newFolderId);
  }
});

// 当树加载完成后，如果已有 folderId，自动展开
watch(() => documentStore.documentTree.length, async (newLength) => {
  if (newLength > 0 && currentFolderId.value) {
    await expandToFolder(currentFolderId.value);
  }
}, { immediate: false });

async function loadSpaceData() {
  if (!spaceId.value) return;

  try {
    await Promise.all([
      spaceStore.fetchSpaceById(spaceId.value),
      // 左侧树始终获取根目录的树结构，不受选中目录影响
      documentStore.fetchDocumentTree(spaceId.value),
    ]);
  } catch (error) {
    console.error('Failed to load space data:', error);
  }
}

// 自动展开到指定目录
async function expandToFolder(folderId: string) {
  // 递归查找并展开到目标节点
  await expandToFolderRecursive(documentStore.documentTree, folderId);
}

// 递归查找并展开目录
async function expandToFolderRecursive(nodes: TreeNode[], targetKey: string): Promise<boolean> {
  for (const node of nodes) {
    if (node.type !== 'folder') continue;

    // 找到目标节点
    if (node.key === targetKey) {
      // 展开目标节点本身，以便看到其内容
      expandedFolders.value.add(node.key);
      // 如果未加载子节点，也加载一下
      if (!node.loaded && !loadingFolders.value.has(node.key)) {
        loadingFolders.value.add(node.key);
        try {
          const children = await documentStore.loadTreeNodeChildren(spaceId.value, node.key);
          node.children = children;
          node.loaded = true;
        } catch (error) {
          console.error('Failed to load target folder children:', error);
        } finally {
          loadingFolders.value.delete(node.key);
        }
      }
      return true;
    }

    // 如果当前节点未加载子节点，先加载
    if (!node.loaded && !loadingFolders.value.has(node.key)) {
      loadingFolders.value.add(node.key);
      try {
        const children = await documentStore.loadTreeNodeChildren(spaceId.value, node.key);
        node.children = children;
        node.loaded = true;
      } catch (error) {
        console.error('Failed to load folder children:', error);
        loadingFolders.value.delete(node.key);
        continue;
      } finally {
        loadingFolders.value.delete(node.key);
      }
    }

    // 递归查找子节点
    if (node.children && node.children.length > 0) {
      const found = await expandToFolderRecursive(node.children, targetKey);
      if (found) {
        // 找到了，展开当前节点
        expandedFolders.value.add(node.key);
        return true;
      }
    }
  }
  return false;
}

async function toggleFolder(node: TreeNode) {
  const folderId = node.key;

  if (expandedFolders.value.has(folderId)) {
    expandedFolders.value.delete(folderId);
  } else {
    expandedFolders.value.add(folderId);

    // 懒加载子节点
    if (!node.loaded && !loadingFolders.value.has(folderId)) {
      loadingFolders.value.add(folderId);
      try {
        const children = await documentStore.loadTreeNodeChildren(spaceId.value, folderId);
        node.children = children;
        node.loaded = true;
      } catch (error) {
        console.error('Failed to load folder children:', error);
      } finally {
        loadingFolders.value.delete(folderId);
      }
    }
  }
}

function handleNodeClick(node: TreeNode) {
  // 点击文档节点，跳转到文档
  if (node.type === 'doc') {
    if (currentFolderId.value) {
      router.push({
        name: 'FolderDocumentView',
        params: { spaceId: spaceId.value, folderPath: currentFolderId.value, documentId: node.key },
      });
    } else {
      router.push({
        name: 'DocumentView',
        params: { spaceId: spaceId.value, documentId: node.key },
      });
    }
  }
}

function handleFolderSelect(node: TreeNode) {
  // 点击目录名称，导航到目录列表页
  router.push({
    name: 'FolderView',
    params: { spaceId: spaceId.value, folderPath: node.key },
  });
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
  router.push({
    name: 'DocumentNew',
    params: { spaceId: spaceId.value },
    query: { folderId: contextMenuTarget.value.key },
  });
  closeContextMenu();
}

function handleAddSubFolder() {
  if (!contextMenuTarget.value || contextMenuTarget.value.type !== 'folder') return;
  showCreateFolderModal.value = true;
  // 不关闭 contextMenu，以便 handleCreateFolder 可以获取到 contextMenuTarget
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
      visibilityScope: newFolderVisibility.value,
    });

    await documentStore.fetchDocumentTree(spaceId.value);
    showCreateFolderModal.value = false;
    newFolderName.value = '';
    newFolderVisibility.value = 'ALL';
    closeContextMenu();
  } catch (error) {
    console.error('Failed to create folder:', error);
  } finally {
    creating.value = false;
  }
}

function handleCreateNewDoc() {
  if (currentFolderId.value) {
    router.push({
      name: 'FolderDocumentNew',
      params: { spaceId: spaceId.value, folderPath: currentFolderId.value },
    });
  } else {
    router.push({
      name: 'DocumentNew',
      params: { spaceId: spaceId.value },
    });
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
          <h2
            class="font-bold truncate cursor-pointer hover:text-primary transition-colors"
            @click="router.push({ name: 'SpaceHome', params: { spaceId: spaceId } })"
          >
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
                <li v-if="spaceStore.spaceAccess?.canCreateFolder">
                  <a @click="showCreateFolderModal = true">
                    <FolderPlus class="w-4 h-4" />
                    新建文件夹
                  </a>
                </li>
                <li v-if="spaceStore.spaceAccess?.canCreateDoc">
                  <a @click="handleCreateNewDoc">
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
          <TreeNodeItem
            v-for="node in documentStore.documentTree"
            :key="node.key"
            :node="node"
            :depth="0"
            :expanded-folders="expandedFolders"
            :loading-folders="loadingFolders"
            :current-doc-id="currentDocId"
            :current-folder-id="currentFolderId"
            @node-click="handleNodeClick"
            @toggle-expand="toggleFolder"
            @folder-select="handleFolderSelect"
            @context-menu="handleContextMenu"
          />
        </template>

        <!-- Empty State -->
        <div v-else class="text-center py-8 opacity-50">
          <FolderOpen class="w-12 h-12 mx-auto mb-2" />
          <p class="text-sm">暂无内容</p>
          <button
            v-if="spaceStore.spaceAccess?.canCreateDoc"
            class="link link-primary text-sm mt-3"
            @click="handleCreateNewDoc"
          >
            创建第一个文档/目录
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
          <li v-if="contextMenuTarget?.type === 'folder' && spaceStore.spaceAccess?.canCreateDoc">
            <a @click="handleAddSubDoc">添加文档</a>
          </li>
          <li v-if="contextMenuTarget?.type === 'folder' && spaceStore.spaceAccess?.canCreateFolder">
            <a @click="handleAddSubFolder">添加子目录</a>
          </li>
        </ul>
      </div>
      <div v-if="showContextMenu" class="fixed inset-0 z-40" @click="closeContextMenu" />
    </Teleport>

    <!-- Create Folder Modal -->
    <dialog class="modal" :class="{ 'modal-open': showCreateFolderModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">新建文件夹</h3>
        <div class="py-4 space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">文件夹名称</span>
            </label>
            <input
              v-model="newFolderName"
              type="text"
              placeholder="请输入文件夹名称"
              class="input input-bordered w-full"
              @keydown.enter="handleCreateFolder"
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">可见范围</span>
            </label>
            <div class="flex gap-4">
              <label class="label cursor-pointer gap-2">
                <input
                  v-model="newFolderVisibility"
                  type="radio"
                  value="ALL"
                  class="radio radio-sm"
                />
                <span class="label-text">所有成员可见</span>
              </label>
              <label class="label cursor-pointer gap-2">
                <input
                  v-model="newFolderVisibility"
                  type="radio"
                  value="DEPT_ONLY"
                  class="radio radio-sm"
                />
                <span class="label-text">仅部门成员可见</span>
              </label>
            </div>
          </div>
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
  </div>
</template>

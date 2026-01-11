<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Link2, Plus, Trash2, Star, Folder } from 'lucide-vue-next';
import { useDocumentStore } from '@/stores/document';
import type { DocSpaceBinding, DocPerm, TreeNode, Space } from '@/types';
import * as documentApi from '@/api/document';
import * as spaceApi from '@/api/space';
import FolderTreeItem from '@/components/FolderTreeItem.vue';

const route = useRoute();
const router = useRouter();
const documentStore = useDocumentStore();

const spaceId = computed(() => route.params.spaceId as string);
const documentId = computed(() => route.params.documentId as string);

// 本地空间列表，不使用全局 store
const spaces = ref<Space[]>([]);

// Bind form
const bindModalRef = ref<HTMLDialogElement | null>(null);
const selectedSpaceId = ref('');
const selectedFolderId = ref('');
const selectedFolderName = ref('');
const bindPerm = ref<DocPerm>('READ');
const binding = ref(false);

// Folder tree
const folderTree = ref<TreeNode[]>([]);
const expandedFolders = ref<Set<string>>(new Set());
const loadingFolders = ref<Set<string>>(new Set());
const loadingTree = ref(false);

function openBindModal() {
  bindModalRef.value?.showModal();
}

function closeBindModal() {
  bindModalRef.value?.close();
}

// Available spaces for binding (排除当前空间)
const availableSpaces = computed(() => {
  const bindedSpaceMap = documentStore.documentSpaces.reduce((map, binding) => {
    map.set(binding.spaceId, true);
    return map;
  }, new Map<string, boolean>());
  return spaces.value.filter(s => !bindedSpaceMap.has(s.documentId));
});
// Filter only folders from tree
const foldersOnly = computed(() => filterFolders(folderTree.value));

function filterFolders(nodes: TreeNode[]): TreeNode[] {
  return nodes
    .filter(n => n.type === 'folder')
    .map(n => ({
      ...n,
      children: n.children ? filterFolders(n.children) : undefined,
    }));
}

onMounted(async () => {
  await loadData();
});

async function loadData() {
  if (!documentId.value) return;

  await documentStore.fetchDocumentById(documentId.value);
  await documentStore.fetchDocSpaces(documentId.value);
  // 直接调用 API 获取空间列表，不影响全局 store
  const result = await spaceApi.getSpaces({ page: 1, pageSize: 100 });
  spaces.value = result.list;
}

function goBack() {
  router.push({
    name: 'DocumentView',
    params: { spaceId: spaceId.value, documentId: documentId.value },
  });
}

async function handleBind() {
  if (!selectedSpaceId.value) return;

  binding.value = true;
  try {
    await documentStore.bindDocToSpace(documentId.value, {
      spaceId: selectedSpaceId.value,
      folderId: selectedFolderId.value || '',
      perm: bindPerm.value,
    });

    closeBindModal();
    selectedSpaceId.value = '';
    selectedFolderId.value = '';
    selectedFolderName.value = '';
    bindPerm.value = 'READ';
    folderTree.value = [];
    expandedFolders.value.clear();
  } catch (error) {
    console.error('Failed to bind document to space:', error);
  } finally {
    binding.value = false;
  }
}

async function handleUnbind(spaceBinding: DocSpaceBinding) {
  if (spaceBinding.isPrimary) {
    alert('不能解绑主空间');
    return;
  }

  if (!confirm(`确定要从空间 "${spaceBinding.spaceName || spaceBinding.spaceId}" 中解绑吗？`)) {
    return;
  }

  try {
    await documentStore.unbindDocFromSpace(documentId.value, spaceBinding.spaceId);
    // 如果解绑的是当前空间，需要刷新树数据
    if (spaceBinding.spaceId === spaceId.value) {
      await documentStore.fetchDocumentTree(spaceId.value);
    }
  } catch (error) {
    console.error('Failed to unbind document from space:', error);
  }
}

async function handleSelectSpace(id: string) {
  selectedSpaceId.value = id;
  selectedFolderId.value = '';
  selectedFolderName.value = '';
  folderTree.value = [];
  expandedFolders.value.clear();

  if (id) {
    loadingTree.value = true;
    try {
      // 直接调用 API 获取树，不影响全局 store
      const data = await documentApi.getDocumentTree({ spaceId: id });
      folderTree.value = data;
    } catch (error) {
      console.error('Failed to load folder tree:', error);
    } finally {
      loadingTree.value = false;
    }
  }
}

function selectFolder(folderId: string, folderName: string) {
  selectedFolderId.value = folderId;
  selectedFolderName.value = folderName;
}

function clearFolderSelection() {
  selectedFolderId.value = '';
  selectedFolderName.value = '';
}

async function toggleFolder(node: TreeNode) {
  const folderId = node.key;
  if (expandedFolders.value.has(folderId)) {
    expandedFolders.value.delete(folderId);
  } else {
    expandedFolders.value.add(folderId);
    // Lazy load children
    if (!node.loaded && !loadingFolders.value.has(folderId)) {
      loadingFolders.value.add(folderId);
      try {
        // 直接调用 API，不影响全局 store
        const children = await documentApi.getDocumentTree({ spaceId: selectedSpaceId.value, folderId });
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
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <button
        @click="goBack"
        class="p-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <ArrowLeft class="w-5 h-5 text-slate-500" />
      </button>
      <div class="flex-1">
        <h1 class="text-xl font-bold text-slate-800">空间绑定管理</h1>
        <p class="text-sm text-slate-500 mt-1">
          {{ documentStore.currentDocument?.title }}
        </p>
      </div>
      <button
        @click="openBindModal"
        class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
      >
        <Plus class="w-4 h-4" />
        绑定空间
      </button>
    </div>

    <!-- Info Box -->
    <div class="bg-blue-50 text-blue-700 rounded-xl p-4 mb-6 text-sm">
      <p>
        文档可以绑定到多个空间，在不同空间中显示。
      </p>
    </div>

    <!-- Bound Spaces List -->
    <div class="bg-white rounded-xl shadow-sm p-6">
      <div v-if="documentStore.documentSpaces.length === 0" class="text-center py-10 text-slate-400">
        暂无绑定的空间
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="binding in documentStore.documentSpaces"
          :key="binding.spaceId"
          class="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Link2 class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-medium text-slate-800">
                  {{ binding.spaceName || binding.spaceId }}
                </span>
                <Star
                  v-if="binding.isPrimary"
                  class="w-4 h-4 text-amber-500 fill-amber-500"
                  title="主空间"
                />
              </div>
              <p class="text-sm text-slate-500">
                {{ binding.folderName || '根目录' }}
                <span class="mx-1">·</span>
                <span :class="{
                  'text-green-600': binding.perm === 'EDIT',
                  'text-blue-600': binding.perm === 'READ'
                }">
                  {{ binding.perm === 'EDIT' ? '可编辑' : '只读' }}
                </span>
              </p>
            </div>
          </div>

          <button
            v-if="documentStore.documentSpaces.length > 1"
            @click="handleUnbind(binding)"
            class="p-2 rounded-lg hover:bg-red-50 transition-colors"
            title="解绑"
          >
            <Trash2 class="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>
    </div>

    <!-- Bind Modal (daisyUI) -->
    <dialog ref="bindModalRef" class="modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold mb-4">绑定到空间</h3>

        <div class="space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">选择空间</span>
            </label>
            <select
              v-model="selectedSpaceId"
              @change="handleSelectSpace(selectedSpaceId)"
              class="select select-bordered w-full"
            >
              <option value="">请选择空间</option>
              <option
                v-for="space in availableSpaces"
                :key="space.id"
                :value="space.documentId"
              >
                {{ space.name }}
              </option>
            </select>
          </div>

          <div v-if="selectedSpaceId" class="form-control">
            <label class="label">
              <span class="label-text">选择目录（可选）</span>
            </label>

            <!-- Selected folder display -->
            <div v-if="selectedFolderId" class="flex items-center gap-2 p-2 bg-primary/10 rounded-lg mb-2">
              <Folder class="w-4 h-4 text-warning" />
              <span class="flex-1 text-sm">{{ selectedFolderName }}</span>
              <button type="button" class="btn btn-ghost btn-xs" @click="clearFolderSelection">清除</button>
            </div>
            <div v-else class="text-sm text-base-content/50 mb-2">未选择（将放入根目录）</div>

            <!-- Folder tree -->
            <div class="border rounded-lg max-h-48 overflow-y-auto p-2 bg-base-200">
              <div v-if="loadingTree" class="flex justify-center py-4">
                <span class="loading loading-spinner loading-sm"></span>
              </div>
              <div v-else-if="foldersOnly.length === 0" class="text-center py-4 text-sm opacity-50">
                暂无文件夹
              </div>
              <template v-else>
                <FolderTreeItem
                  v-for="node in foldersOnly"
                  :key="node.key"
                  :node="node"
                  :depth="0"
                  :expanded-folders="expandedFolders"
                  :loading-folders="loadingFolders"
                  :selected-folder-id="selectedFolderId"
                  @toggle="toggleFolder"
                  @select="selectFolder"
                />
              </template>
            </div>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">权限级别</span>
            </label>
            <div class="flex gap-4">
              <label
                class="flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all flex-1"
                :class="{
                  'border-blue-500 bg-blue-50': bindPerm === 'READ',
                  'border-slate-200 hover:border-slate-300': bindPerm !== 'READ'
                }"
              >
                <input
                  type="radio"
                  v-model="bindPerm"
                  value="READ"
                  class="hidden"
                />
                <div>
                  <p class="font-medium text-slate-800">只读</p>
                  <p class="text-xs text-slate-500">只能查看</p>
                </div>
              </label>

              <label
                class="flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all flex-1"
                :class="{
                  'border-green-500 bg-green-50': bindPerm === 'EDIT',
                  'border-slate-200 hover:border-slate-300': bindPerm !== 'EDIT'
                }"
              >
                <input
                  type="radio"
                  v-model="bindPerm"
                  value="EDIT"
                  class="hidden"
                />
                <div>
                  <p class="font-medium text-slate-800">编辑</p>
                  <p class="text-xs text-slate-500">可以编辑</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button @click="closeBindModal" class="btn">取消</button>
          <button @click="handleBind" :disabled="binding || !selectedSpaceId" class="btn btn-primary">
            {{ binding ? '绑定中...' : '绑定' }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

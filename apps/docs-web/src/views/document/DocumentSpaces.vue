<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Link2, Plus, Trash2, Star } from 'lucide-vue-next';
import { useDocumentStore } from '@/stores/document';
import { useSpaceStore } from '@/stores/space';
import type { DocSpaceBinding, DocPerm } from '@/types';

const route = useRoute();
const router = useRouter();
const documentStore = useDocumentStore();
const spaceStore = useSpaceStore();

const spaceId = computed(() => route.params.spaceId as string);
const documentId = computed(() => route.params.documentId as string);

// Bind form
const showBindModal = ref(false);
const selectedSpaceId = ref('');
const selectedFolderId = ref('');
const bindPerm = ref<DocPerm>('READ');
const binding = ref(false);

// Available spaces for binding
const availableSpaces = computed(() => {
  const boundSpaceIds = documentStore.documentSpaces.map(s => s.spaceId);
  return spaceStore.spaces.filter(s => !boundSpaceIds.includes(s.documentId));
});

onMounted(async () => {
  await loadData();
});

async function loadData() {
  if (!documentId.value) return;

  await documentStore.fetchDocumentById(documentId.value);
  await documentStore.fetchDocSpaces(documentId.value);
  await spaceStore.fetchSpaces({ page: 1, pageSize: 100 });
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
      folderId: selectedFolderId.value || null,
      perm: bindPerm.value,
    });

    showBindModal.value = false;
    selectedSpaceId.value = '';
    selectedFolderId.value = '';
    bindPerm.value = 'READ';
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
  } catch (error) {
    console.error('Failed to unbind document from space:', error);
  }
}

async function handleSelectSpace(id: string) {
  selectedSpaceId.value = id;
  selectedFolderId.value = '';

  // Load folders for selected space
  if (id) {
    await spaceStore.fetchFolders(id);
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
        @click="showBindModal = true"
        class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
      >
        <Plus class="w-4 h-4" />
        绑定空间
      </button>
    </div>

    <!-- Info Box -->
    <div class="bg-blue-50 text-blue-700 rounded-xl p-4 mb-6 text-sm">
      <p>
        文档可以绑定到多个空间，在不同空间中显示。主空间是文档创建时所在的空间，不能解绑。
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
            v-if="!binding.isPrimary"
            @click="handleUnbind(binding)"
            class="p-2 rounded-lg hover:bg-red-50 transition-colors"
            title="解绑"
          >
            <Trash2 class="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>
    </div>

    <!-- Bind Modal -->
    <Teleport to="body">
      <div v-if="showBindModal" class="modal-backdrop" @click.self="showBindModal = false">
        <div class="modal-content w-full max-w-md p-6">
          <h3 class="text-lg font-bold mb-4">绑定到空间</h3>

          <div class="space-y-4">
            <div>
              <label class="form-label">选择空间</label>
              <select
                v-model="selectedSpaceId"
                @change="handleSelectSpace(selectedSpaceId)"
                class="form-input"
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

            <div v-if="selectedSpaceId && spaceStore.folders.length > 0">
              <label class="form-label">选择文件夹（可选）</label>
              <select v-model="selectedFolderId" class="form-input">
                <option value="">根目录</option>
                <option
                  v-for="folder in spaceStore.folders"
                  :key="folder.id"
                  :value="folder.documentId"
                >
                  {{ folder.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="form-label">权限级别</label>
              <div class="flex gap-4 mt-2">
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

          <div class="flex justify-end gap-3 mt-6">
            <button @click="showBindModal = false" class="btn-custom secondary">取消</button>
            <button @click="handleBind" :disabled="binding || !selectedSpaceId" class="btn-custom primary">
              {{ binding ? '绑定中...' : '绑定' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

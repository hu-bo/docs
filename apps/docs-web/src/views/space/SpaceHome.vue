<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { FileText, Folder, Plus, Clock } from 'lucide-vue-next';
import { useSpaceStore } from '@/stores/space';
import { useDocumentStore } from '@/stores/document';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const route = useRoute();
const router = useRouter();
const spaceStore = useSpaceStore();
const documentStore = useDocumentStore();

const spaceId = computed(() => route.params.spaceId as string);
const folderPath = computed(() => route.params.folderPath as string | undefined);
const currentFolderId = computed(() => {
  if (folderPath.value) {
    const segments = Array.isArray(folderPath.value) ? folderPath.value : [folderPath.value];
    return segments[segments.length - 1];
  }
  return undefined;
});

const showCreateDocModal = ref(false);
const newDocTitle = ref('');
const creating = ref(false);

onMounted(async () => {
  await loadData();
});

watch([spaceId, currentFolderId], async () => {
  await loadData();
});

async function loadData() {
  if (!spaceId.value) return;

  await Promise.all([
    documentStore.fetchDocuments({
      spaceId: spaceId.value,
      folderId: currentFolderId.value,
    }),
    spaceStore.fetchFolders(spaceId.value, currentFolderId.value),
  ]);
}

function navigateToFolder(folderId: string) {
  router.push({
    name: 'FolderView',
    params: {
      spaceId: spaceId.value,
      folderPath: folderId,
    },
  });
}

function navigateToDoc(documentId: string) {
  if (currentFolderId.value) {
    router.push({
      name: 'FolderDocumentView',
      params: {
        spaceId: spaceId.value,
        folderPath: currentFolderId.value,
        documentId,
      },
    });
  } else {
    router.push({
      name: 'DocumentView',
      params: {
        spaceId: spaceId.value,
        documentId,
      },
    });
  }
}

async function handleCreateDoc() {
  if (!newDocTitle.value.trim()) return;

  creating.value = true;
  try {
    const newDoc = await documentStore.createDocument({
      title: newDocTitle.value.trim(),
      spaceId: spaceId.value,
      folderId: currentFolderId.value,
      accessMode: 'OPEN_EDIT',
      content: '',
    });

    showCreateDocModal.value = false;
    newDocTitle.value = '';
    navigateToDoc(newDoc.documentId);
  } catch (error) {
    console.error('Failed to create document:', error);
  } finally {
    creating.value = false;
  }
}

function getAccessModeBadge(mode: string) {
  switch (mode) {
    case 'OPEN_EDIT':
      return { class: 'badge-success', text: '公开编辑' };
    case 'OPEN_READONLY':
      return { class: 'badge-info', text: '公开只读' };
    default:
      return { class: 'badge-warning', text: '白名单' };
  }
}
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto">
    <!-- Welcome Section -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold">
        {{ spaceStore.currentSpace?.name || '空间首页' }}
      </h1>
      <p class="opacity-60 mt-1">欢迎来到知识空间，开始探索或创建内容</p>
    </div>

    <!-- Quick Actions -->
    <div class="mb-8" v-if="spaceStore.canCreateDoc">
      <button class="btn btn-primary" @click="showCreateDocModal = true">
        <Plus class="w-4 h-4" />
        新建文档
      </button>
    </div>

    <!-- Folders -->
    <section v-if="spaceStore.folders.length > 0" class="mb-8">
      <h2 class="text-lg font-semibold mb-4">文件夹</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div
          v-for="folder in spaceStore.folders"
          :key="folder.id"
          class="card bg-base-100 shadow-sm hover:shadow-md cursor-pointer transition-shadow"
          @click="navigateToFolder(folder.documentId)"
        >
          <div class="card-body p-4 flex-row items-center gap-3">
            <Folder class="w-8 h-8 text-warning shrink-0" />
            <div class="min-w-0">
              <p class="font-medium truncate">{{ folder.name }}</p>
              <p class="text-xs opacity-50">
                {{ folder.visibilityScope === 'ALL' ? '所有人可见' : '部门可见' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Documents -->
    <section>
      <h2 class="text-lg font-semibold mb-4">文档</h2>

      <div v-if="documentStore.loading" class="flex justify-center py-10">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <div v-else-if="documentStore.documents.length === 0" class="text-center py-10">
        <FileText class="w-16 h-16 opacity-30 mx-auto mb-4" />
        <p class="opacity-50">暂无文档</p>
        <button
          v-if="spaceStore.canCreateDoc"
          class="link link-primary mt-4"
          @click="showCreateDocModal = true"
        >
          创建第一个文档
        </button>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="doc in documentStore.documents"
          :key="doc.id"
          class="card bg-base-100 shadow-sm hover:shadow-lg cursor-pointer transition-shadow"
          @click="navigateToDoc(doc.documentId)"
        >
          <div class="card-body p-5">
            <div class="flex items-start gap-3 mb-3">
              <div class="p-2 bg-primary/10 rounded-lg">
                <FileText class="w-5 h-5 text-primary" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-medium truncate">{{ doc.title }}</h3>
                <p class="text-xs opacity-50 mt-1">{{ doc.owner }}</p>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <span class="badge badge-sm" :class="getAccessModeBadge(doc.accessMode).class">
                {{ getAccessModeBadge(doc.accessMode).text }}
              </span>
              <div class="flex items-center gap-1 text-xs opacity-50">
                <Clock class="w-3 h-3" />
                <span>{{ dayjs(doc.mtime).fromNow() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

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

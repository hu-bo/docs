<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { FileText, Folder, Clock, Edit3, User } from 'lucide-vue-next';
import { useSpaceStore } from '@/stores/space';
import { useDocumentStore } from '@/stores/document';
import dayjs from 'dayjs';

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

// 分离文件夹和文档（使用 store 中的数据）
const folders = computed(() => documentStore.folderContents.filter(item => item.type === 'folder'));
const documents = computed(() => documentStore.folderContents.filter(item => item.type === 'doc'));

watch([spaceId, currentFolderId], async () => {
  await loadData();
}, { immediate: true });

async function loadData() {
  if (!spaceId.value) return;

  try {
    // 使用新的 contents API 获取当前目录下的内容
    await documentStore.fetchFolderContents(spaceId.value, currentFolderId.value);
  } catch (error) {
    console.error('Failed to load folder contents:', error);
  }
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

function handleEditDoc(event: MouseEvent, documentId: string) {
  event.stopPropagation();
  if (currentFolderId.value) {
    router.push({
      name: 'FolderDocumentEdit',
      params: {
        spaceId: spaceId.value,
        folderPath: currentFolderId.value,
        documentId,
      },
    });
  } else {
    router.push({
      name: 'DocumentEdit',
      params: {
        spaceId: spaceId.value,
        documentId,
      },
    });
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
    <!-- <div class="mb-8" v-if="spaceStore.currentSpace?.permission?.canCreateDoc">
      <button class="btn btn-primary" @click="showCreateDocModal = true">
        <Plus class="w-4 h-4" />
        新建文档
      </button>
    </div> -->

    <!-- Folders -->
    <section v-if="folders.length > 0" class="mb-8">
      <h2 class="text-lg font-semibold mb-4">文件夹</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div
          v-for="folder in folders"
          :key="folder.key"
          class="card bg-base-100 shadow-sm hover:shadow-md cursor-pointer transition-shadow"
          @click="navigateToFolder(folder.key)"
        >
          <div class="card-body p-4 flex-row items-center gap-3">
            <Folder class="w-8 h-8 text-warning shrink-0" />
            <div class="min-w-0">
              <p class="font-medium truncate">{{ folder.title }}</p>
              <p class="text-xs opacity-50">
                {{ folder.visibilityScope === 'DEPT_ONLY' ? '部门可见' : '所有人可见' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Documents Table -->
    <section>
      <h2 class="text-lg font-semibold mb-4">文档</h2>

      <div v-if="documentStore.folderContentsLoading" class="flex justify-center py-10">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <div v-else-if="documents.length === 0" class="text-center py-10">
        <FileText class="w-16 h-16 opacity-30 mx-auto mb-4" />
        <p class="opacity-50">暂无文档</p>
        <button
          v-if="spaceStore.currentSpace?.permission?.canCreateDoc"
          class="link link-primary mt-4"
          @click="handleCreateNewDoc"
        >
          创建第一个文档
        </button>
      </div>

      <div v-else class="overflow-x-auto bg-base-100 rounded-lg shadow-sm">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>文档名称</th>
              <th>作者</th>
              <th>访问权限</th>
              <th>更新时间</th>
              <th v-if="spaceStore.currentSpace?.permission?.canCreateDoc" class="w-20">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="doc in documents"
              :key="doc.key"
              class="cursor-pointer hover:bg-base-200"
              @click="navigateToDoc(doc.key)"
            >
              <td>
                <div class="flex items-center gap-3">
                  <FileText class="w-5 h-5 text-info shrink-0" />
                  <span class="font-medium">{{ doc.title }}</span>
                </div>
              </td>
              <td>
                <div class="flex items-center gap-1 text-sm opacity-70">
                  <User class="w-4 h-4" />
                  <span>{{ doc.owner || '-' }}</span>
                </div>
              </td>
              <td>
                <span class="badge badge-sm" :class="getAccessModeBadge(doc.accessMode || '').class">
                  {{ getAccessModeBadge(doc.accessMode || '').text }}
                </span>
              </td>
              <td>
                <div class="flex items-center gap-1 text-sm opacity-70">
                  <Clock class="w-4 h-4" />
                  <span>{{ doc.mtime ? dayjs(doc.mtime).fromNow() : '-' }}</span>
                </div>
              </td>
              <td v-if="spaceStore.currentSpace?.permission?.canCreateDoc">
                <button
                  v-if="doc.perm?.canEdit"
                  class="btn btn-ghost btn-xs btn-square"
                  title="编辑"
                  @click="handleEditDoc($event, doc.key)"
                >
                  <Edit3 class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

  </div>
</template>

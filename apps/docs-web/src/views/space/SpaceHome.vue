<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Button,
  Empty,
  Spin,
  Table,
  Tooltip,
  Modal,
  Form,
  FormItem,
  Input,
  Select,
  SelectOption,
} from 'ant-design-vue';
import type { TableColumnsType } from 'ant-design-vue';
import {
  PlusOutlined,
  FileTextOutlined,
  FolderOutlined,
  LockOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue';
import FolderPermissionModal from '@/components/FolderPermissionModal.vue';
import { useSpaceStore } from '@/stores/space';
import { useDocumentStore } from '@/stores/document';
import { useCreateDocument } from '@/composables/useCreateDocument';
import type { Doc, Folder, RecentDoc } from '@/types';
import dayjs from 'dayjs';

const route = useRoute();
const router = useRouter();
const spaceStore = useSpaceStore();
const documentStore = useDocumentStore();
const {
  modalVisible: createDocModalVisible,
  creating: creatingDoc,
  form: createDocForm,
  openCreateModal: openCreateDocModal,
  handleCreate: handleCreateDoc,
} = useCreateDocument();

const spaceId = computed(() => route.params.spaceId as string);
const recentDocs = ref<RecentDoc[]>([]);
const allDocs = ref<Doc[]>([]);
const folders = ref<Folder[]>([]);
const loading = ref(false);
const tableLoading = ref(false);

// 分页
const pagination = ref({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: false,
  showTotal: (total: number) => `共 ${total} 条`,
});

// 判断是否在根目录（没有folderPath表示在根目录）
const isRootFolder = computed(() => {
  const folderPath = route.params.folderPath;
  return !folderPath || (Array.isArray(folderPath) && folderPath.length === 0);
});

// 当前文件夹ID
const currentFolderId = computed(() => {
  const folderPath = route.params.folderPath;
  if (!folderPath) return '0';
  const pathArray = Array.isArray(folderPath) ? folderPath : folderPath.split('/').filter(Boolean);
  if (pathArray.length === 0) return '0';
  return pathArray[pathArray.length - 1] || '0';
});

// 文件夹权限编辑弹窗
const folderPermissionVisible = ref(false);
const editingFolder = ref<Folder | null>(null);

// 表格列定义
const columns = computed<TableColumnsType>(() => {
  const cols: TableColumnsType = [
    {
      title: '名称',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '所有者',
      dataIndex: 'owner',
      key: 'owner',
      width: 120,
    },
    {
      title: '更新时间',
      dataIndex: 'mtime',
      key: 'mtime',
      width: 180,
    },
  ];
  // 有权限时显示操作列
  if (spaceStore.isSuperAdmin || spaceStore.canCreateFolder) {
    cols.push({
      title: '操作',
      key: 'action',
      width: 80,
    });
  }
  return cols;
});

// 表格数据项类型
interface TableDataItem {
  key: string;
  type: 'folder' | 'doc';
  title: string;
  owner: string;
  mtime: string;
  data: Folder | Doc;
  hasSpaceAuth?: boolean;
}

// 合并文件夹和文档的列表数据
const tableData = computed<TableDataItem[]>(() => {
  const folderItems: TableDataItem[] = folders.value.map(folder => ({
    key: `folder-${folder.documentId}`,
    type: 'folder',
    title: folder.name,
    owner: '-',
    mtime: dayjs(folder.mtime).format('YYYY-MM-DD HH:mm'),
    data: folder,
    hasSpaceAuth: true, // 文件夹不显示锁
  }));

  const docItems: TableDataItem[] = allDocs.value.map(doc => ({
    key: `doc-${doc.documentId}`,
    type: 'doc',
    title: doc.title || '无标题',
    owner: doc.owner,
    mtime: dayjs(doc.mtime).format('YYYY-MM-DD HH:mm'),
    data: doc,
    hasSpaceAuth: doc.hasSpaceAuth,
  }));

  return [...folderItems, ...docItems];
});

onMounted(async () => {
  await loadData();
});

// 监听 currentSpace 变化，确保刷新页面时能正确加载数据
watch(() => spaceStore.currentSpace, async (newSpace) => {
  if (newSpace) {
    await loadData();
  }
});

watch([spaceId, currentFolderId], async () => {
  await loadData();
});

async function loadData() {
  if (!spaceStore.currentSpace) return;

  loading.value = true;
  tableLoading.value = true;

  try {
    // 只在根目录加载最近文档
    if (isRootFolder.value) {
      await loadRecentDocs();
    }
    // 加载当前目录的文件夹和文档
    await loadFolderContent();
  } finally {
    loading.value = false;
    tableLoading.value = false;
  }
}

async function loadRecentDocs() {
  if (!spaceStore.currentSpace) return;

  try {
    recentDocs.value = await documentStore.fetchRecentDocuments(spaceStore.currentSpace.id, 6);
  } catch {
    // 错误已在拦截器处理
  }
}

async function loadFolderContent() {
  if (!spaceStore.currentSpace) return;

  try {
    const result = await documentStore.fetchDocuments(
      spaceStore.currentSpace.id,
      currentFolderId.value || undefined,
      pagination.value.current,
      pagination.value.pageSize
    );
    allDocs.value = documentStore.documents;
    pagination.value.total = result.total;

    // 获取文件夹列表（从tree接口）
    const treeResult = await import('@/api/document').then(m =>
      m.getDocumentTree({
        spaceId: spaceStore.currentSpace!.id,
        folderId: currentFolderId.value,
      })
    ) as unknown as { folders: Folder[]; docs: Doc[] };
    folders.value = treeResult.folders;
  } catch {
    // 错误已在拦截器处理
  }
}

async function handleTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.value.current = pag.current || 1;
  pagination.value.pageSize = pag.pageSize || 20;
  tableLoading.value = true;
  try {
    await loadFolderContent();
  } finally {
    tableLoading.value = false;
  }
}

function goToDoc(doc: Doc | RecentDoc) {
  router.push(`/space/${spaceId.value}/doc/${doc.documentId}`);
}

function goToFolder(folder: Folder) {
  const folderPath = route.params.folderPath;
  const currentPath = folderPath
    ? (Array.isArray(folderPath) ? folderPath.join('/') : folderPath)
    : '';
  const newPath = currentPath ? `${currentPath}/${folder.id}` : `${folder.id}`;
  router.push(`/space/${spaceId.value}/folder/${newPath}`);
}

function handleRowClick(record: TableDataItem) {
  if (record.type === 'folder') {
    goToFolder(record.data as Folder);
  } else {
    goToDoc(record.data as Doc);
  }
}

function createDoc() {
  openCreateDocModal({
    spaceId: spaceStore.currentSpace?.id || spaceId.value,
    folderId: currentFolderId.value || undefined,
    folderUrl: buildCurrentFolderUrl(),
  });
}

// 构建当前目录的 URL
function buildCurrentFolderUrl(): string {
  if (!currentFolderId.value || currentFolderId.value === '0') {
    return `/space/${spaceId.value}`;
  }
  const folderPath = route.params.folderPath;
  if (!folderPath) {
    return `/space/${spaceId.value}`;
  }
  const pathArray = Array.isArray(folderPath) ? folderPath : folderPath.split('/').filter(Boolean);
  if (pathArray.length === 0) {
    return `/space/${spaceId.value}`;
  }
  return `/space/${spaceId.value}/folder/${pathArray.join('/')}`;
}

function formatTime(time: string) {
  return dayjs(time).format('MM-DD HH:mm');
}

// 打开文件夹权限编辑弹窗
function openFolderPermission(folder: Folder) {
  editingFolder.value = folder;
  folderPermissionVisible.value = true;
}

// 文件夹权限更新成功后刷新
async function onFolderPermissionSuccess() {
  await loadFolderContent();
}
</script>

<template>
  <div class="space-home">
    <Spin :spinning="loading">
      <!-- 顶部欢迎区域（精简版） -->
      <div class="welcome-header">
        <div class="welcome-info">
          <h1>{{ spaceStore.currentSpace?.name }}</h1>
          <span class="welcome-desc">{{ spaceStore.currentSpace?.codeName }}</span>
        </div>
        <Button type="primary" @click="createDoc">
          <PlusOutlined />
          新建文档
        </Button>
      </div>

      <!-- 最近文档区域（仅根目录显示） -->
      <div v-if="isRootFolder && recentDocs.length > 0" class="recent-section">
        <h3>最近访问</h3>
        <div class="recent-list">
          <div
            v-for="doc in recentDocs"
            :key="doc.id"
            class="recent-card"
            @click="goToDoc(doc)"
          >
            <div class="card-icon">
              <FileTextOutlined />
            </div>
            <div class="card-content">
              <div class="card-title text-ellipsis">{{ doc.title || '无标题' }}</div>
              <div class="card-meta">{{ formatTime(doc.lastViewedAt) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 文档列表区域 -->
      <div class="doc-list-section">
        <h3>{{ isRootFolder ? '全部文档' : '当前目录' }}</h3>
        <Table
          :columns="columns"
          :data-source="tableData"
          :pagination="pagination"
          :loading="tableLoading"
          :custom-row="(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' },
          })"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'title'">
              <div class="doc-title-cell">
                <FolderOutlined v-if="record.type === 'folder'" class="item-icon folder-icon" />
                <FileTextOutlined v-else class="item-icon" />
                <span class="item-title">{{ record.title }}</span>
                <Tooltip v-if="record.type === 'doc' && !record.hasSpaceAuth" title="无权限">
                  <LockOutlined class="lock-icon" />
                </Tooltip>
              </div>
            </template>
            <template v-else-if="column.key === 'action'">
              <Tooltip v-if="record.type === 'folder'" title="权限设置">
                <SettingOutlined
                  class="action-icon"
                  @click.stop="openFolderPermission(record.data)"
                />
              </Tooltip>
            </template>
          </template>
          <template #emptyText>
            <Empty description="暂无内容">
              <Button type="primary" @click="createDoc">创建第一个文档</Button>
            </Empty>
          </template>
        </Table>
      </div>
    </Spin>

    <!-- 文件夹权限编辑弹窗 -->
    <FolderPermissionModal
      v-model:visible="folderPermissionVisible"
      :folder="editingFolder"
      :space-id="spaceId"
      @success="onFolderPermissionSuccess"
    />

    <!-- 新建文档弹窗 -->
    <Modal
      v-model:open="createDocModalVisible"
      title="新建文档"
      :confirm-loading="creatingDoc"
      @ok="handleCreateDoc"
    >
      <Form layout="vertical">
        <FormItem label="文档标题" required>
          <Input v-model:value="createDocForm.title" placeholder="请输入文档标题" />
        </FormItem>
        <FormItem label="访问模式">
          <Select v-model:value="createDocForm.accessMode">
            <SelectOption value="OPEN_EDIT">所有人可编辑</SelectOption>
            <SelectOption value="OPEN_READONLY">所有人可查看</SelectOption>
            <SelectOption value="WHITELIST_ONLY">仅白名单可见</SelectOption>
          </Select>
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<style lang="less" scoped>
.space-home {
  padding: 24px 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
  border-radius: 8px;
  margin-bottom: 24px;

  .welcome-info {
    h1 {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 4px 0;
    }

    .welcome-desc {
      color: rgba(0, 0, 0, 0.45);
      font-size: 14px;
    }
  }
}

.recent-section {
  margin-bottom: 24px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    color: rgba(0, 0, 0, 0.85);
  }

  .recent-list {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 8px;

    &::-webkit-scrollbar {
      height: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #d9d9d9;
      border-radius: 2px;
    }
  }

  .recent-card {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 200px;
    max-width: 240px;
    padding: 12px 16px;
    background: #fff;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: #1890ff;
      box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
    }

    .card-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f0f5ff;
      border-radius: 6px;
      font-size: 18px;
      color: #1890ff;
      flex-shrink: 0;
    }

    .card-content {
      flex: 1;
      min-width: 0;

      .card-title {
        font-weight: 500;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.85);
      }

      .card-meta {
        font-size: 12px;
        color: rgba(0, 0, 0, 0.45);
        margin-top: 2px;
      }
    }

    .lock-icon {
      color: rgba(0, 0, 0, 0.25);
      font-size: 14px;
      flex-shrink: 0;
    }
  }
}

.doc-list-section {
  h3 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    color: rgba(0, 0, 0, 0.85);
  }

  .doc-title-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .item-icon {
      font-size: 16px;
      color: #1890ff;

      &.folder-icon {
        color: #faad14;
      }
    }

    .item-title {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .lock-icon {
      color: rgba(0, 0, 0, 0.25);
      font-size: 14px;
      flex-shrink: 0;
    }
  }

  .action-icon {
    color: rgba(0, 0, 0, 0.45);
    font-size: 14px;
    cursor: pointer;

    &:hover {
      color: #1890ff;
    }
  }
}
</style>

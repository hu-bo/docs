<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Card,
  Table,
  Button,
  Tag,
  Modal,
  Form,
  FormItem,
  Select,
  SelectOption,
  TreeSelect,
  Popconfirm,
  message,
  Space,
} from 'ant-design-vue';

import * as docApi from '@/api/document';
import * as spaceApi from '@/api/space';
import { useDocumentStore } from '@/stores/document';
import type { DocSpaceBinding, Space as SpaceType, Folder } from '@/types';
import { RawValueType } from 'ant-design-vue/es/vc-tree-select/TreeSelect';

const route = useRoute();
const router = useRouter();
const documentStore = useDocumentStore();

const spaceId = computed(() => route.params.spaceId as string);
const documentId = computed(() => route.params.documentId as string);

const loading = ref(false);
const bindings = ref<DocSpaceBinding[]>([]);
const allSpaces = ref<SpaceType[]>([]);

// 绑定弹窗
const bindModalVisible = ref(false);
const bindForm = ref({
  spaceId: '',
  folderId: '',
  perm: 'READ' as 'READ' | 'EDIT',
});
const binding = ref(false);

// 编辑弹窗
const editModalVisible = ref(false);
const editForm = ref({
  spaceId: '',
  spaceName: '',
  folderId: '',
  perm: 'READ' as 'READ' | 'EDIT',
});
const editing = ref(false);

// 编辑时的目录树
const editFolderTreeData = ref<FolderTreeNode[]>([]);
const editFolderTreeLoading = ref(false);

// 目录树相关
interface FolderTreeNode {
  key: string;
  value?: RawValueType;
  title?: string;
  children?: FolderTreeNode[];
  isLeaf?: boolean;
}
const folderTreeData = ref<FolderTreeNode[]>([]);
const folderTreeLoading = ref(false);

// 监听选择的空间变化，加载该空间的目录树
watch(() => bindForm.value.spaceId, async (newSpaceId) => {
  if (newSpaceId) {
    await loadFolderTree(newSpaceId);
  } else {
    folderTreeData.value = [];
  }
  // 重置目录选择
  bindForm.value.folderId = '';
});

// 加载空间的目录树
async function loadFolderTree(targetSpaceId: string) {
  folderTreeLoading.value = true;
  try {
    const result = await docApi.getDocumentTree({ spaceId: targetSpaceId, folderId: '0' }) as unknown as { folders: Folder[]; docs: never[] };
    folderTreeData.value = buildFolderTreeNodes(result.folders);
  } catch {
    folderTreeData.value = [];
  } finally {
    folderTreeLoading.value = false;
  }
}

// 构建目录树节点（只显示文件夹）
function buildFolderTreeNodes(folders: Folder[]): FolderTreeNode[] {
  return folders.map(folder => ({
    key: `folder-${folder.id}`,
    value: folder.id,
    title: folder.name,
    isLeaf: false, // 允许懒加载子目录
  }));
}

// 懒加载子目录
async function onLoadFolderData(treeNode: { value: RawValueType | undefined; children?: FolderTreeNode[] }) {
  if (treeNode.children && treeNode.children.length > 0) {
    return;
  }

  if (!bindForm.value.spaceId) return;

  try {
    const result = await docApi.getDocumentTree({
      spaceId: bindForm.value.spaceId,
      folderId: treeNode.value as string
    }) as unknown as { folders: Folder[]; docs: never[] };

    const children = buildFolderTreeNodes(result.folders);
    const isLeaf = children.length === 0;

    // 通过更新 folderTreeData 来触发响应式更新
    const updateNode = (nodes: FolderTreeNode[]): boolean => {
      for (const node of nodes) {
        if (node.value === treeNode.value) {
          node.children = children;
          node.isLeaf = isLeaf;
          return true;
        }
        if (node.children && updateNode(node.children)) {
          return true;
        }
      }
      return false;
    };
    updateNode(folderTreeData.value);
    // 触发响应式更新
    folderTreeData.value = [...folderTreeData.value];
  } catch {
    // 加载失败时不处理
  }
}

const columns = [
  {
    title: '空间',
    key: 'space',
  },
  {
    title: '目录',
    key: 'folder',
  },
  {
    title: '类型',
    key: 'type',
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
  },
];

onMounted(async () => {
  await loadDocument();
  await loadBindings();
  await loadAllSpaces();
});

async function loadDocument() {
  if (!documentStore.currentDocument || documentStore.currentDocument.documentId !== documentId.value) {
    await documentStore.fetchDocumentById(documentId.value);
  }
}

async function loadBindings() {
  loading.value = true;
  try {
    bindings.value = await docApi.getDocSpaces(documentId.value) as unknown as DocSpaceBinding[];
  } catch {
    bindings.value = [];
  } finally {
    loading.value = false;
  }
}

// 获取空间显示名称（优先使用 API 返回的名称）
function getSpaceDisplayName(binding: DocSpaceBinding | Record<string, unknown>): string {
  const b = binding as DocSpaceBinding;
  if (b.spaceName) {
    return b.spaceName;
  }
  const space = allSpaces.value.find(s => s.id === b.spaceId);
  return space?.name || `空间 ${b.spaceId}`;
}

// 获取目录显示文本
function getFolderDisplay(binding: DocSpaceBinding | Record<string, unknown>): string {
  const b = binding as DocSpaceBinding;
  if (!b.folderId || b.folderId === '0') {
    return '根目录';
  }
  // 优先使用 API 返回的名称
  if (b.folderName) {
    return b.folderName;
  }
  return `目录 ${b.folderId}`;
}

async function loadAllSpaces() {
  try {
    const result = await spaceApi.getSpaces({ page: 1, pageSize: 100 });
    allSpaces.value = result.list;
  } catch {
    allSpaces.value = [];
  }
}

function openBindModal() {
  bindForm.value = { spaceId: '', folderId: '', perm: 'READ' };
  bindModalVisible.value = true;
}

async function handleBind() {
  if (!bindForm.value.spaceId) {
    message.warning('请选择空间');
    return;
  }

  binding.value = true;
  try {
    await docApi.bindDocToSpace(documentId.value, bindForm.value);
    message.success('绑定成功');
    bindModalVisible.value = false;
    await loadBindings();
  } catch {
    // 错误已在拦截器处理
  } finally {
    binding.value = false;
  }
}

async function handleUnbind(targetSpaceId: string) {
  try {
    await docApi.unbindDocFromSpace(documentId.value, targetSpaceId);
    message.success('解绑成功');
    await loadBindings();
  } catch {
    // 错误已在拦截器处理
  }
}

function goBack() {
  router.push(`/space/${spaceId.value}/doc/${documentId.value}`);
}

// 过滤已绑定的空间
const availableSpaces = computed(() => {
  const boundSpaceIds = bindings.value.map(b => b.spaceId);
  return allSpaces.value.filter(s => !boundSpaceIds.includes(s.id));
});

function filterSpaceOption(input: string, option: { label?: string }) {
  return option.label?.toLowerCase().includes(input.toLowerCase()) ?? false;
}

// 打开编辑弹窗
async function openEditModal(record: DocSpaceBinding | Record<string, unknown>) {
  const r = record as DocSpaceBinding;
  editForm.value = {
    spaceId: r.spaceId,
    spaceName: r.spaceName || getSpaceDisplayName(r),
    folderId: r.folderId || '',
    perm: r.perm || 'READ',
  };
  editModalVisible.value = true;
  // 加载该空间的目录树
  await loadEditFolderTree(r.spaceId);
}

// 加载编辑时的目录树
async function loadEditFolderTree(targetSpaceId: string) {
  editFolderTreeLoading.value = true;
  try {
    const result = await docApi.getDocumentTree({ spaceId: targetSpaceId, folderId: '0' }) as unknown as { folders: Folder[]; docs: never[] };
    editFolderTreeData.value = buildFolderTreeNodes(result.folders);
  } catch {
    editFolderTreeData.value = [];
  } finally {
    editFolderTreeLoading.value = false;
  }
}

// 编辑时懒加载子目录
async function onLoadEditFolderData(treeNode: { value: any; children?: FolderTreeNode[] }) {
  if (treeNode.children && treeNode.children.length > 0) {
    return;
  }

  if (!editForm.value.spaceId) return;

  try {
    const result = await docApi.getDocumentTree({
      spaceId: editForm.value.spaceId,
      folderId: treeNode.value
    }) as unknown as { folders: Folder[]; docs: never[] };

    const children = buildFolderTreeNodes(result.folders);
    const isLeaf = children.length === 0;

    // 通过更新 editFolderTreeData 来触发响应式更新
    const updateNode = (nodes: FolderTreeNode[]): boolean => {
      for (const node of nodes) {
        if (node.value === treeNode.value) {
          node.children = children;
          node.isLeaf = isLeaf;
          return true;
        }
        if (node.children && updateNode(node.children)) {
          return true;
        }
      }
      return false;
    };
    updateNode(editFolderTreeData.value);
    // 触发响应式更新
    editFolderTreeData.value = [...editFolderTreeData.value];
  } catch {
    // 加载失败时不处理
  }
}

// 保存编辑
async function handleEdit() {
  editing.value = true;
  try {
    await docApi.bindDocToSpace(documentId.value, {
      spaceId: editForm.value.spaceId,
      folderId: editForm.value.folderId,
      perm: editForm.value.perm,
    });
    message.success('修改成功');
    editModalVisible.value = false;
    await loadBindings();
  } catch {
    // 错误已在拦截器处理
  } finally {
    editing.value = false;
  }
}
</script>

<template>
  <div class="document-spaces">
    <Card>
      <template #title>
        <Space>
          <Button type="text" @click="goBack">
            <ArrowLeftOutlined />
          </Button>
          <span>空间绑定管理</span>
        </Space>
      </template>
      <template #extra>
        <Button type="primary" @click="openBindModal">
          <PlusOutlined />
          绑定到空间
        </Button>
      </template>

      <div class="doc-info mb-md">
        <strong>文档：</strong>{{ documentStore.currentDocument?.title || '无标题' }}
      </div>

      <Table
        :columns="columns"
        :data-source="bindings"
        :loading="loading"
        :pagination="false"
        row-key="spaceId"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'space'">
            {{ getSpaceDisplayName(record) }}
          </template>
          <template v-else-if="column.key === 'folder'">
            <span>
              <FolderOutlined />
              {{ getFolderDisplay(record) }}
            </span>
          </template>
          <template v-else-if="column.key === 'type'">
            <Tag v-if="record.isPrimary" color="blue">主空间</Tag>
            <Tag v-else>绑定</Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space v-if="!record.isPrimary">
              <Button type="link" size="small" @click="openEditModal(record)">
                <EditOutlined />
              </Button>
              <Popconfirm
                title="确定要解除绑定吗？"
                @confirm="handleUnbind(record.spaceId)"
              >
                <Button type="link" size="small" danger>
                  <DeleteOutlined />
                </Button>
              </Popconfirm>
            </Space>
            <span v-else class="text-secondary">-</span>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 绑定弹窗 -->
    <Modal
      v-model:open="bindModalVisible"
      title="绑定到空间"
      :confirm-loading="binding"
      @ok="handleBind"
    >
      <Form layout="vertical">
        <FormItem label="选择空间" required>
          <Select
            v-model:value="bindForm.spaceId"
            placeholder="请选择空间"
            show-search
            :filter-option="filterSpaceOption"
          >
            <SelectOption
              v-for="space in availableSpaces"
              :key="space.id"
              :value="space.id"
              :label="space.name"
            >
              {{ space.name }}
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="选择目录">
          <TreeSelect
            v-model:value="bindForm.folderId"
            placeholder="选择目录（默认根目录）"
            :tree-data="folderTreeData"
            :loading="folderTreeLoading"
            :load-data="onLoadFolderData"
            :disabled="!bindForm.spaceId"
            allow-clear
            :field-names="{ children: 'children', label: 'title', value: 'value' }"
          >
            <template #title="{ title }">
              <span><FolderOutlined /> {{ title }}</span>
            </template>
          </TreeSelect>
          <div class="folder-hint">不选择则放在空间根目录</div>
        </FormItem>
        <FormItem label="权限">
          <Select v-model:value="bindForm.perm">
            <SelectOption value="READ">只读</SelectOption>
            <SelectOption value="EDIT">可编辑</SelectOption>
          </Select>
        </FormItem>
      </Form>
    </Modal>

    <!-- 编辑弹窗 -->
    <Modal
      v-model:open="editModalVisible"
      title="修改绑定"
      :confirm-loading="editing"
      @ok="handleEdit"
    >
      <Form layout="vertical">
        <FormItem label="空间">
          <span class="space-name">{{ editForm.spaceName }}</span>
        </FormItem>
        <FormItem label="选择目录">
          <TreeSelect
            v-model:value="editForm.folderId"
            placeholder="选择目录（默认根目录）"
            :tree-data="editFolderTreeData"
            :loading="editFolderTreeLoading"
            :load-data="onLoadEditFolderData"
            allow-clear
            :field-names="{ children: 'children', label: 'title', value: 'value' }"
          >
            <template #title="{ title }">
              <span><FolderOutlined /> {{ title }}</span>
            </template>
          </TreeSelect>
          <div class="folder-hint">不选择则放在空间根目录</div>
        </FormItem>
        <FormItem label="权限">
          <Select v-model:value="editForm.perm">
            <SelectOption value="READ">只读</SelectOption>
            <SelectOption value="EDIT">可编辑</SelectOption>
          </Select>
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<style lang="less" scoped>
.document-spaces {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.doc-info {
  color: rgba(0, 0, 0, 0.65);
}

.folder-hint {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 4px;
}

.folder-path {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  margin-left: 8px;
}

.space-name {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
}
</style>

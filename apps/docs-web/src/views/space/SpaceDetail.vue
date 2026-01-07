<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Layout,
  LayoutSider,
  LayoutContent,
  Tree,
  Button,
  Dropdown,
  Menu,
  MenuItem,
  Modal,
  Form,
  FormItem,
  Input,
  Select,
  SelectOption,
  message,
  Spin,
  Breadcrumb,
  BreadcrumbItem,
  Tooltip,
} from 'ant-design-vue';
import {
  FolderOutlined,
  FileTextOutlined,
  PlusOutlined,
  SettingOutlined,
  TeamOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  LockOutlined,
} from '@ant-design/icons-vue';
import MainLayout from '@/layouts/MainLayout.vue';
import FolderPermissionModal from '@/components/FolderPermissionModal.vue';
import { useSpaceStore } from '@/stores/space';
import { useDocumentStore } from '@/stores/document';
import { useCreateDocument } from '@/composables/useCreateDocument';
import type { TreeNode, Folder } from '@/types';

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
// 从 URL 解析 folderPath，支持 /folder/id1/id2/id3 格式
const folderPath = computed(() => {
  const path = route.params.folderPath;
  if (!path) return [];
  // folderPath 可能是 string 或 string[]
  if (Array.isArray(path)) {
    return path.map(p => p);
  }
  return path.split('/').filter(Boolean);
});

const loading = ref(false);
const collapsed = ref(false);
const expandedKeys = ref<string[]>([]);
const selectedKeys = ref<string[]>([]);

// 面包屑路径
interface BreadcrumbPath {
  key: string;
  title: string;
  type: 'space' | 'folder' | 'doc';
  folderId?: string;
  documentId?: string;
}
const breadcrumbPath = ref<BreadcrumbPath[]>([]);

// 当前文件夹ID（用于创建时指定父级）
const currentFolderId = ref('0');

// 创建文件夹弹窗
const createFolderModalVisible = ref(false);
const createFolderForm = ref({
  name: '',
  parentId: '0',
  visibilityScope: 'ALL' as 'ALL' | 'DEPT_ONLY',
});
const creatingFolder = ref(false);

// 文件夹权限编辑弹窗
const folderPermissionVisible = ref(false);
const editingFolder = ref<Folder | null>(null);

onMounted(async () => {
  await loadSpaceData();
});

watch(spaceId, async () => {
  if (spaceId.value) {
    await loadSpaceData();
  }
});

// 监听 folderPath 变化，同步更新面包屑和展开状态
watch(folderPath, async () => {
  if (spaceStore.currentSpace && documentStore.documentTree.length > 0) {
    await syncStateFromUrl();
  }
}, { deep: true });

async function loadSpaceData() {
  if (!spaceId.value) return;

  loading.value = true;
  try {
    await spaceStore.fetchSpaceById(spaceId.value);
    if (spaceStore.currentSpace) {
      await documentStore.fetchDocumentTree(spaceStore.currentSpace.id, '0');
      // 根据 URL 初始化状态
      await syncStateFromUrl();
    }
  } finally {
    loading.value = false;
  }
}

// 根据 URL 中的 folderPath 同步面包屑、展开状态和当前文件夹
async function syncStateFromUrl() {
  if (!spaceStore.currentSpace) return;

  // 初始化面包屑为空间根目录
  const path: BreadcrumbPath[] = [{
    key: 'space-root',
    title: spaceStore.currentSpace.name,
    type: 'space',
    folderId: '0',
  }];

  const keysToExpand: string[] = [];
  let lastFolderId = '0';
  let lastFolderKey = '';

  // 遍历 URL 中的每个 folderId，加载并展开
  for (const folderId of folderPath.value) {
    if (!folderId) continue;

    // 确保父节点的 children 已加载
    const parentNode = findNodeByFolderId(documentStore.documentTree, lastFolderId);
    if (parentNode && (!parentNode.children || parentNode.children.length === 0)) {
      const children = await documentStore.loadTreeNodeChildren(spaceStore.currentSpace!.id, lastFolderId);
      parentNode.children = children;
    }

    // 查找当前文件夹节点
    const folderNode = findNodeByFolderId(documentStore.documentTree, folderId);
    if (folderNode && folderNode.type === 'folder') {
      const folder = folderNode.data as Folder;
      path.push({
        key: folderNode.key,
        title: folderNode.title,
        type: 'folder',
        folderId: folder.id,
        documentId: folder.documentId,
      });
      keysToExpand.push(folderNode.key);
      lastFolderId = folder.id;
      lastFolderKey = folderNode.key;
    }
  }

  breadcrumbPath.value = path;
  currentFolderId.value = lastFolderId;
  expandedKeys.value = [...new Set([...expandedKeys.value, ...keysToExpand])];
  selectedKeys.value = lastFolderKey ? [lastFolderKey] : [];
}

// 根据 folderId 在树中查找节点
function findNodeByFolderId(nodes: TreeNode[], folderId: string): TreeNode | null {
  for (const node of nodes) {
    if (node.type === 'folder' && (node.data as Folder)?.id === folderId) {
      return node;
    }
    if (node.children) {
      const found = findNodeByFolderId(node.children, folderId);
      if (found) return found;
    }
  }
  return null;
}

// 根据面包屑构建 URL 路径
function buildFolderUrl(targetFolderId?: string): string {
  if (!targetFolderId || targetFolderId === '0') {
    return `/space/${spaceId.value}`;
  }

  // 找到从根到目标文件夹的路径
  const folderIds: string[] = [];
  const buildPath = (pathItems: BreadcrumbPath[]) => {
    for (const item of pathItems) {
      if (item.type === 'folder' && item.folderId) {
        folderIds.push(item.folderId);
        if (item.folderId === targetFolderId) break;
      }
    }
  };
  buildPath(breadcrumbPath.value);

  if (folderIds.length === 0) {
    return `/space/${spaceId.value}`;
  }

  return `/space/${spaceId.value}/folder/${folderIds.join('/')}`;
}

async function onLoadData(treeNode: Record<string, unknown>) {
  const node = treeNode as unknown as { key: string; children?: TreeNode[]; data?: Folder };
  if (node.children && node.children.length > 0) {
    return;
  }

  if (!spaceStore.currentSpace || !node.data) return;

  const folderId = node.data.id;
  const children = await documentStore.loadTreeNodeChildren(spaceStore.currentSpace.id, folderId);

  // 更新树节点
  const updateNode = (nodes: TreeNode[]): boolean => {
    for (const n of nodes) {
      if (n.key === node.key) {
        n.children = children;
        return true;
      }
      if (n.children && updateNode(n.children)) {
        return true;
      }
    }
    return false;
  };

  updateNode(documentStore.documentTree);
}

function onTreeSelect(keys: (string | number)[], info: { node: Record<string, unknown> }) {
  selectedKeys.value = keys.map(k => String(k));
  const node = info.node as unknown as TreeNode;

  if (node.type === 'doc') {
    const docId = String(node.key).replace('doc-', '');
    // 更新面包屑 - 添加文档
    updateBreadcrumbForNode(node);
    // 构建带目录层级的文档 URL
    const folderUrl = buildCurrentFolderUrl();
    if (folderUrl.includes('/folder/')) {
      router.push(`${folderUrl}/doc/${docId}`);
    } else {
      router.push(`/space/${spaceId.value}/doc/${docId}`);
    }
  } else if (node.type === 'folder') {
    // 更新面包屑和当前文件夹
    updateBreadcrumbForNode(node);
    const folder = node.data as Folder;
    currentFolderId.value = folder?.id || '0';
    // 导航到新的目录 URL
    const newUrl = buildFolderUrlFromNode(node);
    router.push(newUrl);
  }
}

// 构建当前目录的 URL（不包含新选中的文件夹）
function buildCurrentFolderUrl(): string {
  if (currentFolderId.value === '0') {
    return `/space/${spaceId.value}`;
  }
  const folderIds: string[] = [];
  for (const item of breadcrumbPath.value) {
    if (item.type === 'folder' && item.folderId) {
      folderIds.push(item.folderId);
    }
  }
  if (folderIds.length === 0) {
    return `/space/${spaceId.value}`;
  }
  return `/space/${spaceId.value}/folder/${folderIds.join('/')}`;
}

// 根据节点构建包含该节点的目录 URL
function buildFolderUrlFromNode(node: TreeNode): string {
  // 先更新面包屑，然后根据面包屑构建 URL
  const folder = node.data as Folder;
  if (!folder?.id) {
    return `/space/${spaceId.value}`;
  }

  // 从已更新的面包屑中提取所有 folderId
  const folderIds: string[] = [];
  for (const item of breadcrumbPath.value) {
    if (item.type === 'folder' && item.folderId) {
      folderIds.push(item.folderId);
    }
  }

  if (folderIds.length === 0) {
    return `/space/${spaceId.value}`;
  }

  return `/space/${spaceId.value}/folder/${folderIds.join('/')}`;
}

// 根据选中节点更新面包屑路径
function updateBreadcrumbForNode(node: TreeNode) {
  // 找到从根到当前节点的路径
  const path: BreadcrumbPath[] = [{
    key: 'space-root',
    title: spaceStore.currentSpace?.name || '',
    type: 'space',
    folderId: '0',
  }];

  // 递归查找节点路径
  function findPath(nodes: TreeNode[], targetKey: string, currentPath: TreeNode[]): TreeNode[] | null {
    for (const n of nodes) {
      const newPath = [...currentPath, n];
      if (n.key === targetKey) {
        return newPath;
      }
      if (n.children) {
        const found = findPath(n.children, targetKey, newPath);
        if (found) return found;
      }
    }
    return null;
  }

  const nodePath = findPath(documentStore.documentTree, node.key, []);
  if (nodePath) {
    for (const n of nodePath) {
      const folder = n.data as Folder;
      path.push({
        key: n.key,
        title: n.title,
        type: n.type,
        folderId: folder?.id,
        documentId: folder?.documentId,
      });
    }
  }

  breadcrumbPath.value = path;
}

function openCreateModal(type: 'folder' | 'doc') {
  if (type === 'doc') {
    openCreateDocModal({
      spaceId: spaceStore.currentSpace?.id || spaceId.value,
      folderId: currentFolderId.value || undefined,
      folderUrl: buildCurrentFolderUrl(),
    });
  } else {
    createFolderForm.value = {
      name: '',
      parentId: currentFolderId.value,
      visibilityScope: 'ALL',
    };
    createFolderModalVisible.value = true;
  }
}

async function handleCreateFolder() {
  if (!createFolderForm.value.name) {
    message.warning('请输入文件夹名称');
    return;
  }

  if (!spaceStore.currentSpace) return;

  creatingFolder.value = true;
  try {
    await spaceStore.createFolder(spaceId.value, {
      name: createFolderForm.value.name,
      parentId: createFolderForm.value.parentId,
      visibilityScope: createFolderForm.value.visibilityScope,
    });
    message.success('创建文件夹成功');
    createFolderModalVisible.value = false;

    // 刷新树节点：如果是在子目录创建，只刷新该节点的 children
    await refreshTreeNode(createFolderForm.value.parentId);
  } catch {
    // 错误已在拦截器处理
  } finally {
    creatingFolder.value = false;
  }
}

// 刷新指定节点的子节点，保持展开状态
async function refreshTreeNode(parentFolderId: string) {
  if (!spaceStore.currentSpace) return;

  if (parentFolderId === '0') {
    // 根目录刷新
    await documentStore.fetchDocumentTree(spaceStore.currentSpace.id, '0');
  } else {
    // 子目录刷新：加载该节点的新 children
    const children = await documentStore.loadTreeNodeChildren(spaceStore.currentSpace.id, parentFolderId);

    // 找到并更新对应节点
    const parentKey = `folder-${findFolderDocumentId(parentFolderId)}`;

    const updateNodeChildren = (nodes: TreeNode[]): boolean => {
      for (const node of nodes) {
        if (node.type === 'folder' && (node.data as Folder)?.id === parentFolderId) {
          node.children = children;
          return true;
        }
        if (node.children && updateNodeChildren(node.children)) {
          return true;
        }
      }
      return false;
    };

    updateNodeChildren(documentStore.documentTree);

    // 确保父节点在展开状态
    if (!expandedKeys.value.includes(parentKey)) {
      expandedKeys.value = [...expandedKeys.value, parentKey];
    }
  }
}

// 根据 folder id 在树中查找 documentId
function findFolderDocumentId(folderId: string): string {
  const findInNodes = (nodes: TreeNode[]): string | null => {
    for (const node of nodes) {
      if (node.type === 'folder' && (node.data as Folder)?.id === folderId) {
        return (node.data as Folder).documentId;
      }
      if (node.children) {
        const found = findInNodes(node.children);
        if (found) return found;
      }
    }
    return null;
  };
  return findInNodes(documentStore.documentTree) || '';
}

function goToMembers() {
  router.push(`/space/${spaceId.value}/members`);
}

// 打开文件夹权限编辑弹窗
function openFolderPermission(folder: Folder) {
  editingFolder.value = folder;
  folderPermissionVisible.value = true;
}

// 文件夹权限更新成功后刷新
async function onFolderPermissionSuccess() {
  if (editingFolder.value) {
    await refreshTreeNode(editingFolder.value.parentId);
  }
}

// 点击面包屑导航
function onBreadcrumbClick(item: BreadcrumbPath) {
  if (item.type === 'space') {
    // 点击空间根目录，导航到根 URL
    router.push(`/space/${spaceId.value}`);
  } else if (item.type === 'folder') {
    // 点击文件夹，导航到该文件夹的 URL
    const url = buildFolderUrl(item.folderId);
    router.push(url);
  }
}
</script>

<template>
  <MainLayout>
    <Layout class="space-detail-page">
      <LayoutSider
        v-model:collapsed="collapsed"
        :width="256"
        :collapsed-width="0"
        theme="light"
        class="sider"
        :trigger="null"
        collapsible
      >
        <div class="sider-header">
          <span class="space-name text-ellipsis">{{ spaceStore.currentSpace?.name }}</span>
          <Dropdown>
            <Button type="text" size="small">
              <SettingOutlined />
            </Button>
            <template #overlay>
              <Menu>
                <MenuItem key="members" @click="goToMembers">
                  <TeamOutlined />
                  成员管理
                </MenuItem>
              </Menu>
            </template>
          </Dropdown>
        </div>

        <div class="sider-actions">
          <Dropdown>
            <Button type="primary" size="small" block>
              <PlusOutlined />
              新建
            </Button>
            <template #overlay>
              <Menu>
                <MenuItem key="doc" @click="openCreateModal('doc')">
                  <FileTextOutlined />
                  新建文档
                </MenuItem>
                <MenuItem key="folder" @click="openCreateModal('folder')">
                  <FolderOutlined />
                  新建文件夹
                </MenuItem>
              </Menu>
            </template>
          </Dropdown>
        </div>

        <Spin :spinning="loading">
          <Tree
            v-if="documentStore.documentTree.length > 0"
            v-model:expandedKeys="expandedKeys"
            v-model:selectedKeys="selectedKeys"
            :tree-data="documentStore.documentTree"
            :load-data="onLoadData"
            class="doc-tree"
            @select="onTreeSelect"
          >
            <template #title="{ data, title, type }">
              <span class="tree-node-title">
                <FolderOutlined v-if="type === 'folder'" class="tree-node-icon folder-icon" />
                <FileTextOutlined v-else class="tree-node-icon" />
                <span class="tree-node-text">{{ title }}</span>
                <Tooltip v-if="type === 'doc' && !data.hasSpaceAuth" title="无权限">
                  <LockOutlined class="lock-icon" />
                </Tooltip>
                <Tooltip v-if="type === 'folder' && (spaceStore.isSuperAdmin || spaceStore.canCreateFolder)" title="权限设置">
                  <SettingOutlined class="setting-icon" @click.stop="openFolderPermission(data)" />
                </Tooltip>
              </span>
            </template>
          </Tree>
          <div v-else class="empty-tree">
            <p>暂无内容</p>
            <Button type="link" @click="openCreateModal('doc')">创建第一个文档</Button>
          </div>
        </Spin>
      </LayoutSider>

      <LayoutContent class="content">
        <div class="content-header">
          <Button
            type="text"
            class="collapse-btn"
            @click="collapsed = !collapsed"
          >
            <MenuUnfoldOutlined v-if="collapsed" />
            <MenuFoldOutlined v-else />
          </Button>
          <Breadcrumb class="breadcrumb">
            <BreadcrumbItem v-for="item in breadcrumbPath" :key="item.key">
              <a v-if="item.type !== 'doc'" @click.prevent="onBreadcrumbClick(item)">
                <HomeOutlined v-if="item.type === 'space'" />
                <FolderOutlined v-else-if="item.type === 'folder'" />
                <span class="breadcrumb-text">{{ item.title }}</span>
              </a>
              <span v-else>
                <FileTextOutlined />
                <span class="breadcrumb-text">{{ item.title }}</span>
              </span>
            </BreadcrumbItem>
          </Breadcrumb>
        </div>
        <router-view />
      </LayoutContent>
    </Layout>

    <!-- 新建文件夹弹窗 -->
    <Modal
      v-model:open="createFolderModalVisible"
      title="新建文件夹"
      :confirm-loading="creatingFolder"
      @ok="handleCreateFolder"
    >
      <Form layout="vertical">
        <FormItem label="文件夹名称" required>
          <Input v-model:value="createFolderForm.name" placeholder="请输入文件夹名称" />
        </FormItem>
        <FormItem label="可见范围">
          <Select v-model:value="createFolderForm.visibilityScope">
            <SelectOption value="ALL">全员可见</SelectOption>
            <SelectOption value="DEPT_ONLY">仅空间内可见</SelectOption>
          </Select>
        </FormItem>
      </Form>
    </Modal>

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

    <!-- 文件夹权限编辑弹窗 -->
    <FolderPermissionModal
      v-model:visible="folderPermissionVisible"
      :folder="editingFolder"
      :space-id="spaceId"
      @success="onFolderPermissionSuccess"
    />
  </MainLayout>
</template>

<style lang="less" scoped>
.space-detail-page {
  min-height: calc(100vh - 64px);
  background: #fff;
}

.sider {
  border-right: 1px solid #f0f0f0;
  overflow: hidden;

  .sider-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;

    .space-name {
      font-size: 16px;
      font-weight: 600;
      flex: 1;
    }
  }

  .sider-actions {
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
  }

  .doc-tree {
    padding: 8px;

    .tree-node-title {
      display: inline-flex;
      align-items: center;
      gap: 6px;

      .tree-node-icon {
        font-size: 14px;
        color: #1890ff;

        &.folder-icon {
          color: #faad14;
        }
      }

      .tree-node-text {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .lock-icon {
        color: rgba(0, 0, 0, 0.25);
        font-size: 12px;
        margin-left: 4px;
      }

      .setting-icon {
        color: rgba(0, 0, 0, 0.25);
        font-size: 12px;
        margin-left: 4px;
        opacity: 0;
        transition: opacity 0.2s;
        cursor: pointer;

        &:hover {
          color: #1890ff;
        }
      }
    }

    :deep(.ant-tree-treenode:hover) .setting-icon {
      opacity: 1;
    }
  }

  .empty-tree {
    padding: 40px 16px;
    text-align: center;
    color: rgba(0, 0, 0, 0.45);
  }
}

.content {
  position: relative;
  background: #fafafa;
  min-height: 100%;

  .content-header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: #fff;
    border-bottom: 1px solid #f0f0f0;

    .collapse-btn {
      margin-right: 8px;
    }

    .breadcrumb {
      flex: 1;

      .breadcrumb-text {
        margin-left: 4px;
      }

      a {
        color: rgba(0, 0, 0, 0.65);
        cursor: pointer;

        &:hover {
          color: #1890ff;
        }
      }
    }
  }
}
</style>

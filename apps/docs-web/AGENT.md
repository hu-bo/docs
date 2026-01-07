# LLM Agent Guide - docs-web

本文档为 LLM 代码生成提供 Vue 3 + TypeScript 的详细模式参考和代码示例。

## 技术栈

- Vue 3.5.x (Composition API + script setup)
- Vue Router 4.x
- Pinia 3.x (状态管理)
- Ant Design Vue 4.x (UI 组件库)
- Tiptap 3.x (富文本编辑器)
- Yjs + y-websocket (实时协作)
- TypeScript 5.x
- Vite 7.x
- Less (CSS 预处理器)

## 代码生成规范

### 1. API 请求层模式

```typescript
// src/api/example.ts
import request from './request';
import type { Example, ExampleAcl, PaginatedData, CreateExampleForm } from '@/types';

// ============ 基础 CRUD ============

// 列表查询（带分页）
export function getExamples(params: {
  page?: number;
  pageSize?: number;
  status?: string;
}) {
  return request.get<PaginatedData<Example>>('/examples', { params });
}

// 单个查询
export function getExampleById(exampleId: string) {
  return request.get<Example>(`/examples/${exampleId}`);
}

// 创建
export function createExample(data: CreateExampleForm) {
  return request.post<Example>('/examples', data);
}

// 更新
export function updateExample(exampleId: string, data: Partial<CreateExampleForm>) {
  return request.put<Example>(`/examples/${exampleId}`, data);
}

// 删除
export function deleteExample(exampleId: string) {
  return request.delete(`/examples/${exampleId}`);
}

// ============ 子资源操作 ============

// 获取成员列表
export function getExampleMembers(exampleId: string, params?: { page?: number; pageSize?: number }) {
  return request.get<PaginatedData<ExampleAcl>>(`/examples/${exampleId}/members`, { params });
}

// 添加成员
export function addExampleMembers(exampleId: string, members: { username: string; perm: string }[]) {
  return request.post(`/examples/${exampleId}/members`, { members });
}

// 更新成员
export function updateExampleMember(exampleId: string, username: string, perm: string) {
  return request.put(`/examples/${exampleId}/members`, { username, perm });
}

// 删除成员
export function removeExampleMembers(exampleId: string, usernames: string[]) {
  return request.delete(`/examples/${exampleId}/members`, { data: { usernames } });
}

// ============ 特殊操作 ============

// 移动
export function moveExample(exampleId: string, targetFolderId: string) {
  return request.put(`/examples/${exampleId}/move`, { targetFolderId });
}

// 复制
export function copyExample(exampleId: string, targetFolderId: string) {
  return request.post(`/examples/${exampleId}/copy`, { targetFolderId });
}
```

### 2. Pinia Store 模式

```typescript
// src/stores/example.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as exampleApi from '@/api/example';
import type { Example, ExampleAcl, TreeNode } from '@/types';

export const useExampleStore = defineStore('example', () => {
  // ============ State ============
  const examples = ref<Example[]>([]);
  const currentExample = ref<Example | null>(null);
  const exampleTree = ref<TreeNode[]>([]);
  const total = ref(0);
  const loading = ref(false);

  // ============ Computed ============
  const isOwner = computed(() => {
    const userStore = useUserStore();
    return currentExample.value?.creator === userStore.username;
  });

  const canEdit = computed(() => {
    if (isOwner.value) return true;
    if (currentExample.value?.accessMode === 'OPEN_EDIT') return true;
    // 其他权限检查...
    return false;
  });

  // ============ 内部辅助函数 ============
  function buildTreeNodes(items: Example[]): TreeNode[] {
    return items.map(item => ({
      key: `example-${item.documentId}`,
      title: item.name,
      type: 'example',
      data: item,
      isLeaf: true,
    }));
  }

  // ============ Actions ============

  // 获取列表
  async function fetchExamples(page = 1, pageSize = 20) {
    loading.value = true;
    try {
      const result = await exampleApi.getExamples({ page, pageSize }) as unknown as {
        list: Example[];
        total: number;
      };
      examples.value = result.list;
      total.value = result.total;
      return result;
    } finally {
      loading.value = false;
    }
  }

  // 获取单个
  async function fetchExampleById(exampleId: string) {
    loading.value = true;
    try {
      currentExample.value = await exampleApi.getExampleById(exampleId) as unknown as Example;
      return currentExample.value;
    } catch (error) {
      currentExample.value = null;
      throw error;
    } finally {
      loading.value = false;
    }
  }

  // 创建
  async function createExample(data: CreateExampleForm) {
    const result = await exampleApi.createExample(data) as unknown as Example;
    examples.value.unshift(result); // 乐观更新
    return result;
  }

  // 更新
  async function updateExample(exampleId: string, data: Partial<CreateExampleForm>) {
    const result = await exampleApi.updateExample(exampleId, data) as unknown as Example;

    // 更新当前
    if (currentExample.value?.documentId === exampleId) {
      currentExample.value = result;
    }

    // 更新列表
    const index = examples.value.findIndex(e => e.documentId === exampleId);
    if (index !== -1) {
      examples.value[index] = result;
    }

    return result;
  }

  // 删除
  async function deleteExample(exampleId: string) {
    await exampleApi.deleteExample(exampleId);
    examples.value = examples.value.filter(e => e.documentId !== exampleId);
    if (currentExample.value?.documentId === exampleId) {
      currentExample.value = null;
    }
  }

  // 清空当前
  function clearCurrent() {
    currentExample.value = null;
  }

  // ============ 返回公开 API ============
  return {
    // State
    examples,
    currentExample,
    exampleTree,
    total,
    loading,
    // Computed
    isOwner,
    canEdit,
    // Actions
    fetchExamples,
    fetchExampleById,
    createExample,
    updateExample,
    deleteExample,
    clearCurrent,
  };
});
```

### 3. Composable 模式

```typescript
// src/composables/useExample.ts
import { ref, computed, watch, onUnmounted } from 'vue';
import type { Example } from '@/types';

export interface UseExampleOptions {
  exampleId: string;
  autoFetch?: boolean;
}

export function useExample(options: UseExampleOptions) {
  const { exampleId, autoFetch = true } = options;

  // ============ State ============
  const example = ref<Example | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // ============ Computed ============
  const isReady = computed(() => example.value !== null && !loading.value);

  // ============ Methods ============
  async function fetch() {
    loading.value = true;
    error.value = null;

    try {
      const result = await getExampleById(exampleId);
      example.value = result as unknown as Example;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch';
      example.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function update(data: Partial<Example>) {
    if (!example.value) return;

    loading.value = true;
    try {
      const result = await updateExample(exampleId, data);
      example.value = result as unknown as Example;
      return result;
    } finally {
      loading.value = false;
    }
  }

  function reset() {
    example.value = null;
    error.value = null;
    loading.value = false;
  }

  // ============ Lifecycle ============
  if (autoFetch) {
    fetch();
  }

  // 监听 ID 变化
  watch(
    () => options.exampleId,
    (newId, oldId) => {
      if (newId !== oldId) {
        reset();
        if (autoFetch) {
          fetch();
        }
      }
    }
  );

  onUnmounted(() => {
    reset();
  });

  // ============ Return ============
  return {
    example,
    loading,
    error,
    isReady,
    fetch,
    update,
    reset,
  };
}
```

#### Modal + Form Composable

```typescript
// src/composables/useCreateExample.ts
import { ref, reactive } from 'vue';
import { message } from 'ant-design-vue';
import { useExampleStore } from '@/stores/example';
import type { CreateExampleForm } from '@/types';

export function useCreateExample() {
  const exampleStore = useExampleStore();

  // ============ State ============
  const modalVisible = ref(false);
  const creating = ref(false);
  const form = reactive<CreateExampleForm>({
    name: '',
    description: '',
    type: 'TYPE_A',
    folderId: undefined,
  });

  // ============ 内部状态 ============
  let onSuccessCallback: ((example: Example) => void) | null = null;

  // ============ Methods ============
  function openModal(options?: { folderId?: string; onSuccess?: (example: Example) => void }) {
    // 重置表单
    form.name = '';
    form.description = '';
    form.type = 'TYPE_A';
    form.folderId = options?.folderId;

    onSuccessCallback = options?.onSuccess || null;
    modalVisible.value = true;
  }

  function closeModal() {
    modalVisible.value = false;
    onSuccessCallback = null;
  }

  async function handleCreate() {
    if (!form.name.trim()) {
      message.warning('请输入名称');
      return;
    }

    creating.value = true;
    try {
      const result = await exampleStore.createExample(form);
      message.success('创建成功');
      closeModal();
      onSuccessCallback?.(result);
      return result;
    } catch (error) {
      // 错误已被拦截器处理
    } finally {
      creating.value = false;
    }
  }

  // ============ Return ============
  return {
    modalVisible,
    creating,
    form,
    openModal,
    closeModal,
    handleCreate,
  };
}
```

### 4. Vue 组件模式

#### 页面组件 (View)

```vue
<!-- src/views/example/ExampleList.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Button, Table, Empty, Spin, Modal, Input, Form, FormItem } from 'ant-design-vue';
import type { TableColumnsType } from 'ant-design-vue';
import { useExampleStore } from '@/stores/example';
import { useCreateExample } from '@/composables/useCreateExample';
import type { Example } from '@/types';
import dayjs from 'dayjs';

// ============ 依赖注入 ============
const router = useRouter();
const exampleStore = useExampleStore();
const {
  modalVisible,
  creating,
  form,
  openModal,
  closeModal,
  handleCreate,
} = useCreateExample();

// ============ 本地状态 ============
const loading = ref(false);
const pagination = ref({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: false,
  showTotal: (total: number) => `共 ${total} 条`,
});

// ============ 计算属性 ============
const columns = computed<TableColumnsType>(() => [
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name',
    ellipsis: true,
  },
  {
    title: '创建者',
    dataIndex: 'creator',
    key: 'creator',
    width: 120,
  },
  {
    title: '更新时间',
    dataIndex: 'mtime',
    key: 'mtime',
    width: 180,
    customRender: ({ text }) => dayjs(text).format('YYYY-MM-DD HH:mm'),
  },
  {
    title: '操作',
    key: 'action',
    width: 120,
  },
]);

// ============ 生命周期 ============
onMounted(async () => {
  await loadData();
});

// ============ 方法 ============
async function loadData() {
  loading.value = true;
  try {
    const result = await exampleStore.fetchExamples(
      pagination.value.current,
      pagination.value.pageSize
    );
    pagination.value.total = result.total;
  } finally {
    loading.value = false;
  }
}

async function handleTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.value.current = pag.current || 1;
  pagination.value.pageSize = pag.pageSize || 20;
  await loadData();
}

function goToDetail(example: Example) {
  router.push(`/examples/${example.documentId}`);
}

function handleCreateSuccess(example: Example) {
  router.push(`/examples/${example.documentId}`);
}
</script>

<template>
  <div class="example-list">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>示例列表</h1>
      <Button type="primary" @click="openModal({ onSuccess: handleCreateSuccess })">
        新建
      </Button>
    </div>

    <!-- 数据表格 -->
    <Spin :spinning="loading">
      <Table
        :columns="columns"
        :data-source="exampleStore.examples"
        :pagination="pagination"
        :row-key="(record) => record.documentId"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <a @click="goToDetail(record)">{{ record.name }}</a>
          </template>
          <template v-else-if="column.key === 'action'">
            <Button type="link" size="small" @click="goToDetail(record)">
              查看
            </Button>
          </template>
        </template>

        <template #emptyText>
          <Empty description="暂无数据">
            <Button type="primary" @click="openModal()">创建第一个</Button>
          </Empty>
        </template>
      </Table>
    </Spin>

    <!-- 创建弹窗 -->
    <Modal
      v-model:open="modalVisible"
      title="新建"
      :confirm-loading="creating"
      @ok="handleCreate"
      @cancel="closeModal"
    >
      <Form layout="vertical">
        <FormItem label="名称" required>
          <Input v-model:value="form.name" placeholder="请输入名称" />
        </FormItem>
        <FormItem label="描述">
          <Input.TextArea v-model:value="form.description" placeholder="请输入描述" :rows="3" />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<style lang="less" scoped>
.example-list {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h1 {
    margin: 0;
    font-size: 20px;
  }
}
</style>
```

#### 可复用组件

```vue
<!-- src/components/ExampleCard.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { Card, Tag, Avatar } from 'ant-design-vue';
import type { Example } from '@/types';
import dayjs from 'dayjs';

// ============ Props & Emits ============
interface Props {
  example: Example;
  selected?: boolean;
  showActions?: boolean;
}

interface Emits {
  (e: 'click', example: Example): void;
  (e: 'edit', example: Example): void;
  (e: 'delete', example: Example): void;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  showActions: true,
});

const emit = defineEmits<Emits>();

// ============ Computed ============
const statusColor = computed(() => {
  const colors: Record<string, string> = {
    DRAFT: 'default',
    PUBLISHED: 'success',
    ARCHIVED: 'warning',
  };
  return colors[props.example.status] || 'default';
});

const formattedTime = computed(() => {
  return dayjs(props.example.mtime).format('MM-DD HH:mm');
});

// ============ Methods ============
function handleClick() {
  emit('click', props.example);
}

function handleEdit(e: Event) {
  e.stopPropagation();
  emit('edit', props.example);
}

function handleDelete(e: Event) {
  e.stopPropagation();
  emit('delete', props.example);
}
</script>

<template>
  <Card
    class="example-card"
    :class="{ 'is-selected': selected }"
    hoverable
    @click="handleClick"
  >
    <template #title>
      <div class="card-title">
        <span class="name">{{ example.name }}</span>
        <Tag :color="statusColor">{{ example.status }}</Tag>
      </div>
    </template>

    <template v-if="showActions" #extra>
      <a @click="handleEdit">编辑</a>
      <a class="delete-link" @click="handleDelete">删除</a>
    </template>

    <div class="card-content">
      <p class="description">{{ example.description || '暂无描述' }}</p>
      <div class="meta">
        <Avatar size="small">{{ example.creator[0] }}</Avatar>
        <span class="creator">{{ example.creator }}</span>
        <span class="time">{{ formattedTime }}</span>
      </div>
    </div>
  </Card>
</template>

<style lang="less" scoped>
.example-card {
  cursor: pointer;
  transition: all 0.2s;

  &.is-selected {
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }

  .card-title {
    display: flex;
    align-items: center;
    gap: 8px;

    .name {
      font-weight: 500;
    }
  }

  .card-content {
    .description {
      color: rgba(0, 0, 0, 0.45);
      margin-bottom: 12px;
    }

    .meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
    }
  }

  .delete-link {
    color: #ff4d4f;
    margin-left: 12px;
  }
}
</style>
```

### 5. 类型定义模式

```typescript
// src/types/index.ts

// ============ 枚举类型 ============
export type ExampleType = 'TYPE_A' | 'TYPE_B' | 'TYPE_C';
export type ExampleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type ExamplePerm = 'READ' | 'EDIT' | 'ADMIN';

// ============ 实体接口 ============
export interface Example {
  id: string;
  documentId: string;
  name: string;
  description: string;
  type: ExampleType;
  status: ExampleStatus;
  creator: string;
  folderId: string;
  isDeleted: boolean;
  ctime: string;
  mtime: string;
}

// ============ ACL 接口 ============
export interface ExampleAcl {
  id: string;
  documentId: string;
  exampleId: string;
  username: string;
  perm: ExamplePerm;
  isDeleted: boolean;
  ctime: string;
  mtime: string;
}

// ============ 树节点接口 ============
export interface TreeNode {
  key: string;
  title: string;
  type: 'folder' | 'example';
  data: Folder | Example;
  children?: TreeNode[];
  isLeaf?: boolean;
}

// ============ 表单 DTO ============
export interface CreateExampleForm {
  name: string;
  description?: string;
  type?: ExampleType;
  folderId?: string;
}

export interface UpdateExampleForm {
  name?: string;
  description?: string;
  type?: ExampleType;
  status?: ExampleStatus;
}

// ============ API 响应 ============
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedData<T = unknown> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

### 6. 路由模式

```typescript
// src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/examples',
    name: 'ExampleList',
    component: () => import('@/views/example/ExampleList.vue'),
    meta: { title: '示例列表' },
  },
  {
    path: '/examples/:exampleId',
    component: () => import('@/views/example/ExampleDetail.vue'),
    meta: { title: '示例详情', requiresAuth: true },
    children: [
      {
        path: '',
        name: 'ExampleView',
        component: () => import('@/views/example/ExampleView.vue'),
      },
      {
        path: 'edit',
        name: 'ExampleEdit',
        component: () => import('@/views/example/ExampleEdit.vue'),
        meta: { requiresEdit: true },
      },
      {
        path: 'members',
        name: 'ExampleMembers',
        component: () => import('@/views/example/ExampleMembers.vue'),
        meta: { requiresAdmin: true },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title || 'App'} - My App`;

  // 权限检查
  if (to.meta.requiresAuth) {
    const userStore = useUserStore();
    if (!userStore.isLoggedIn) {
      return next('/login');
    }
  }

  next();
});

export default router;
```

## 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `ExampleList.vue`, `ExampleCard.vue` |
| Composable | camelCase, use 前缀 | `useExample.ts`, `useCreateExample.ts` |
| Store | camelCase, use 前缀 | `useExampleStore` |
| API 函数 | camelCase, 动词开头 | `getExamples`, `createExample` |
| 类型接口 | PascalCase | `Example`, `CreateExampleForm` |
| CSS 类名 | kebab-case | `.example-card`, `.page-header` |

## 组件结构规范

```vue
<script setup lang="ts">
// 1. Imports (按类型分组)
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Button, Table } from 'ant-design-vue';
import { useExampleStore } from '@/stores/example';
import type { Example } from '@/types';

// 2. Props & Emits 定义
interface Props { ... }
interface Emits { ... }
const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 3. 依赖注入 (router, store, composable)
const router = useRouter();
const exampleStore = useExampleStore();

// 4. 响应式状态 (ref)
const loading = ref(false);
const data = ref<Example[]>([]);

// 5. 计算属性 (computed)
const isEmpty = computed(() => data.value.length === 0);

// 6. 方法
async function loadData() { ... }
function handleClick() { ... }

// 7. 生命周期钩子
onMounted(() => { ... });

// 8. Watch
watch(() => props.id, () => { ... });
</script>
```

## 注意事项

1. **类型断言**: API 返回使用 `as unknown as Type` 进行类型断言
2. **Loading 状态**: 异步操作使用 `try/finally` 确保 loading 重置
3. **乐观更新**: 创建/删除后立即更新本地状态
4. **错误处理**: 错误由全局拦截器处理，组件内无需重复处理
5. **国际化**: 使用 zh-CN，dayjs 已配置中文
6. **样式作用域**: 使用 `scoped` 限制样式作用域

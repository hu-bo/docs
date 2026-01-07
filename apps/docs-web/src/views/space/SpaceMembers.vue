<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  Card,
  Table,
  Button,
  Tag,
  Modal,
  Form,
  FormItem,
  Input,
  Switch,
  Popconfirm,
  message,
  Space,
  Tabs,
  TabPane,
  Badge,
} from 'ant-design-vue';

import { useSpaceStore } from '@/stores/space';
import { getPendingRequests, approveAccess } from '@/api/access';
import type { UserSpaceAuth, SpaceMemberForm, AccessRequest } from '@/types';

const route = useRoute();
const spaceStore = useSpaceStore();

const spaceId = computed(() => route.params.spaceId as string);
const loading = ref(false);
const activeTab = ref('members');

// 待审批申请
const pendingRequests = ref<AccessRequest[]>([]);
const pendingLoading = ref(false);
const approving = ref<string | null>(null);

const pendingColumns = [
  {
    title: '申请人',
    dataIndex: 'username',
    key: 'username',
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    customRender: ({ text }: { text: string }) => {
      return text === 'SPACE' ? '空间权限' : '文档权限';
    },
  },
  {
    title: '申请权限',
    dataIndex: 'requestedPerm',
    key: 'requestedPerm',
  },
  {
    title: '申请原因',
    dataIndex: 'reason',
    key: 'reason',
  },
  {
    title: '申请时间',
    dataIndex: 'ctime',
    key: 'ctime',
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
  },
];

// 添加成员弹窗
const addModalVisible = ref(false);
const addForm = ref<SpaceMemberForm>({
  username: '',
  canRead: true,
  canCreateFolder: false,
  canCreateDoc: false,
  superAdmin: false,
});
const adding = ref(false);

// 编辑成员弹窗
const editModalVisible = ref(false);
const editForm = ref<SpaceMemberForm>({
  username: '',
  canRead: true,
  canCreateFolder: false,
  canCreateDoc: false,
  superAdmin: false,
});
const editing = ref(false);

const columns = [
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username',
  },
  {
    title: '权限',
    key: 'permissions',
    customRender: ({ record }: { record: UserSpaceAuth }) => {
      const tags = [];
      if (record.superAdmin) tags.push({ label: '管理员', color: 'red' });
      if (record.canCreateDoc) tags.push({ label: '创建文档', color: 'blue' });
      if (record.canCreateFolder) tags.push({ label: '创建文件夹', color: 'green' });
      if (record.canRead) tags.push({ label: '读取', color: 'default' });
      return tags;
    },
  },
  {
    title: '来源',
    dataIndex: 'source',
    key: 'source',
    customRender: ({ text }: { text: string }) => {
      return text === 'AUTO_INIT' ? '自动' : '手动';
    },
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
  },
];

onMounted(async () => {
  await Promise.all([loadMembers(), loadPendingRequests()]);
});

async function loadMembers() {
  if (!spaceId.value) return;

  loading.value = true;
  try {
    await spaceStore.fetchSpaceMembers(spaceId.value);
  } finally {
    loading.value = false;
  }
}

async function loadPendingRequests() {
  pendingLoading.value = true;
  try {
    const res = await getPendingRequests();
    pendingRequests.value = res.list || [];
  } catch {
    // 错误已在拦截器处理
  } finally {
    pendingLoading.value = false;
  }
}

async function handleApprove(request: Record<string, any>, approved: boolean) {
  approving.value = request.documentId;
  try {
    await approveAccess({
      requestId: request.documentId,
      approved,
    });
    message.success(approved ? '已通过' : '已拒绝');
    await loadPendingRequests();
    if (approved) {
      await loadMembers();
    }
  } catch {
    // 错误已在拦截器处理
  } finally {
    approving.value = null;
  }
}

function openAddModal() {
  addForm.value = {
    username: '',
    canRead: true,
    canCreateFolder: false,
    canCreateDoc: false,
    superAdmin: false,
  };
  addModalVisible.value = true;
}

async function handleAddMember() {
  if (!addForm.value.username) {
    message.warning('请输入用户名');
    return;
  }

  adding.value = true;
  try {
    await spaceStore.addMembers(spaceId.value, [addForm.value]);
    message.success('添加成功');
    addModalVisible.value = false;
  } catch {
    // 错误已在拦截器处理
  } finally {
    adding.value = false;
  }
}

function openEditModal(member: Record<string, unknown>) {
  editForm.value = {
    username: String(member.username),
    canRead: Boolean(member.canRead),
    canCreateFolder: Boolean(member.canCreateFolder),
    canCreateDoc: Boolean(member.canCreateDoc),
    superAdmin: Boolean(member.superAdmin),
  };
  editModalVisible.value = true;
}

async function handleEditMember() {
  editing.value = true;
  try {
    await spaceStore.updateMember(spaceId.value, editForm.value);
    message.success('更新成功');
    editModalVisible.value = false;
  } catch {
    // 错误已在拦截器处理
  } finally {
    editing.value = false;
  }
}

async function handleRemoveMember(username: string) {
  try {
    await spaceStore.removeMembers(spaceId.value, [username]);
    message.success('移除成功');
  } catch {
    // 错误已在拦截器处理
  }
}
</script>

<template>
  <div class="space-members">
    <Card title="成员管理">
      <Tabs v-model:activeKey="activeTab">
        <TabPane key="members">
          <template #tab>
            成员列表
          </template>
          <div class="tab-header">
            <Button type="primary" @click="openAddModal">
              <PlusOutlined />
              添加成员
            </Button>
          </div>
          <Table
            :columns="columns"
            :data-source="spaceStore.currentSpaceMembers"
            :loading="loading"
            :pagination="false"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'permissions'">
                <Space>
                  <Tag v-if="record.superAdmin" color="red">管理员</Tag>
                  <Tag v-if="record.canCreateDoc" color="blue">创建文档</Tag>
                  <Tag v-if="record.canCreateFolder" color="green">创建文件夹</Tag>
                  <Tag v-if="record.canRead && !record.superAdmin" color="default">读取</Tag>
                </Space>
              </template>
              <template v-else-if="column.key === 'action'">
                <Space>
                  <Button type="link" size="small" @click="openEditModal(record)">
                    <EditOutlined />
                  </Button>
                  <Popconfirm
                    title="确定要移除该成员吗？"
                    @confirm="handleRemoveMember(record.username)"
                  >
                    <Button type="link" size="small" danger>
                      <DeleteOutlined />
                    </Button>
                  </Popconfirm>
                </Space>
              </template>
            </template>
          </Table>
        </TabPane>

        <TabPane key="pending">
          <template #tab>
            <Badge :count="pendingRequests.length" :offset="[10, 0]">
              待审批
            </Badge>
          </template>
          <Table
            :columns="pendingColumns"
            :data-source="pendingRequests"
            :loading="pendingLoading"
            :pagination="false"
            row-key="documentId"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'type'">
                <Tag :color="record.type === 'SPACE' ? 'blue' : 'green'">
                  {{ record.type === 'SPACE' ? '空间权限' : '文档权限' }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <Space>
                  <Button
                    type="primary"
                    size="small"
                    :loading="approving === record.documentId"
                    @click="handleApprove(record, true)"
                  >
                    <CheckOutlined />
                    通过
                  </Button>
                  <Button
                    size="small"
                    danger
                    :loading="approving === record.documentId"
                    @click="handleApprove(record, false)"
                  >
                    <CloseOutlined />
                    拒绝
                  </Button>
                </Space>
              </template>
            </template>
          </Table>
        </TabPane>
      </Tabs>
    </Card>

    <!-- 添加成员弹窗 -->
    <Modal
      v-model:open="addModalVisible"
      title="添加成员"
      :confirm-loading="adding"
      @ok="handleAddMember"
    >
      <Form layout="vertical">
        <FormItem label="用户名" required>
          <Input v-model:value="addForm.username" placeholder="请输入用户名" />
        </FormItem>
        <FormItem label="读取权限">
          <Switch v-model:checked="addForm.canRead" />
        </FormItem>
        <FormItem label="创建文档权限">
          <Switch v-model:checked="addForm.canCreateDoc" />
        </FormItem>
        <FormItem label="创建文件夹权限">
          <Switch v-model:checked="addForm.canCreateFolder" />
        </FormItem>
        <FormItem label="管理员权限">
          <Switch v-model:checked="addForm.superAdmin" />
        </FormItem>
      </Form>
    </Modal>

    <!-- 编辑成员弹窗 -->
    <Modal
      v-model:open="editModalVisible"
      title="编辑成员权限"
      :confirm-loading="editing"
      @ok="handleEditMember"
    >
      <Form layout="vertical">
        <FormItem label="用户名">
          <Input :value="editForm.username" disabled />
        </FormItem>
        <FormItem label="读取权限">
          <Switch v-model:checked="editForm.canRead" />
        </FormItem>
        <FormItem label="创建文档权限">
          <Switch v-model:checked="editForm.canCreateDoc" />
        </FormItem>
        <FormItem label="创建文件夹权限">
          <Switch v-model:checked="editForm.canCreateFolder" />
        </FormItem>
        <FormItem label="管理员权限">
          <Switch v-model:checked="editForm.superAdmin" />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<style lang="less" scoped>
.space-members {
  padding: 24px;
  max-width: 1000px;
  margin: 0 auto;

  .tab-header {
    margin-bottom: 16px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>

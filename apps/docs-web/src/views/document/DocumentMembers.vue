<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Card,
  Table,
  Button,
  Tag,
  Modal,
  Form,
  FormItem,
  Input,
  Select,
  SelectOption,
  Popconfirm,
  message,
  Space,
} from 'ant-design-vue';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons-vue';
import * as docApi from '@/api/document';
import { useDocumentStore } from '@/stores/document';
import type { DocUserAcl, DocMemberForm, DocPerm } from '@/types';

const route = useRoute();
const router = useRouter();
const documentStore = useDocumentStore();

const spaceId = computed(() => route.params.spaceId as string);
const documentId = computed(() => route.params.documentId as string);

const loading = ref(false);
const members = ref<DocUserAcl[]>([]);

// 添加成员弹窗
const addModalVisible = ref(false);
const addForm = ref<DocMemberForm>({
  username: '',
  perm: 'READ',
});
const adding = ref(false);

// 编辑成员弹窗
const editModalVisible = ref(false);
const editForm = ref<DocMemberForm>({
  username: '',
  perm: 'READ',
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
    dataIndex: 'perm',
    key: 'perm',
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
  },
];

onMounted(async () => {
  await loadDocument();
  await loadMembers();
});

async function loadDocument() {
  if (!documentStore.currentDocument || documentStore.currentDocument.documentId !== documentId.value) {
    await documentStore.fetchDocumentById(documentId.value);
  }
}

async function loadMembers() {
  loading.value = true;
  try {
    const result = await docApi.getDocMembers(documentId.value) as unknown as { list: DocUserAcl[] };
    members.value = result.list || [];
  } catch {
    members.value = [];
  } finally {
    loading.value = false;
  }
}

function openAddModal() {
  addForm.value = { username: '', perm: 'READ' };
  addModalVisible.value = true;
}

async function handleAddMember() {
  if (!addForm.value.username) {
    message.warning('请输入用户名');
    return;
  }

  adding.value = true;
  try {
    await docApi.addDocMembers(documentId.value, [addForm.value]);
    message.success('添加成功');
    addModalVisible.value = false;
    await loadMembers();
  } catch {
    // 错误已在拦截器处理
  } finally {
    adding.value = false;
  }
}

function openEditModal(member: Record<string, unknown>) {
  editForm.value = {
    username: String(member.username),
    perm: member.perm as DocPerm,
  };
  editModalVisible.value = true;
}

async function handleEditMember() {
  editing.value = true;
  try {
    await docApi.updateDocMember(documentId.value, editForm.value);
    message.success('更新成功');
    editModalVisible.value = false;
    await loadMembers();
  } catch {
    // 错误已在拦截器处理
  } finally {
    editing.value = false;
  }
}

async function handleRemoveMember(username: string) {
  try {
    await docApi.removeDocMembers(documentId.value, [username]);
    message.success('移除成功');
    await loadMembers();
  } catch {
    // 错误已在拦截器处理
  }
}

function goBack() {
  router.push(`/space/${spaceId.value}/doc/${documentId.value}`);
}

function getPermColor(perm: DocPerm) {
  return perm === 'EDIT' ? 'blue' : 'default';
}

function getPermText(perm: DocPerm) {
  return perm === 'EDIT' ? '可编辑' : '只读';
}
</script>

<template>
  <div class="document-members">
    <Card>
      <template #title>
        <Space>
          <Button type="text" @click="goBack">
            <ArrowLeftOutlined />
          </Button>
          <span>文档成员管理</span>
        </Space>
      </template>
      <template #extra>
        <Button type="primary" @click="openAddModal">
          <PlusOutlined />
          添加成员
        </Button>
      </template>

      <div class="doc-info mb-md">
        <strong>文档：</strong>{{ documentStore.currentDocument?.title || '无标题' }}
      </div>

      <Table
        :columns="columns"
        :data-source="members"
        :loading="loading"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'perm'">
            <Tag :color="getPermColor(record.perm)">
              {{ getPermText(record.perm) }}
            </Tag>
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
        <FormItem label="权限">
          <Select v-model:value="addForm.perm">
            <SelectOption value="READ">只读</SelectOption>
            <SelectOption value="EDIT">可编辑</SelectOption>
          </Select>
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
.document-members {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.doc-info {
  color: rgba(0, 0, 0, 0.65);
}
</style>

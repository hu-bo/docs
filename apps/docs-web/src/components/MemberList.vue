<script setup lang="ts">
import { computed } from 'vue';
import {
  Table,
  Button,
  Tag,
  Popconfirm,
  Space,
} from 'ant-design-vue';
import {
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue';

interface Member {
  id: number;
  username: string;
  permissions?: string[];
  perm?: string;
  source?: string;
}

interface Props {
  members: Member[];
  loading?: boolean;
  type?: 'space' | 'doc';
}

interface Emits {
  (e: 'edit', member: Member): void;
  (e: 'remove', username: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  type: 'space',
});

const emit = defineEmits<Emits>();

const columns = computed(() => {
  const baseColumns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '权限',
      key: 'permissions',
    },
  ];

  if (props.type === 'space') {
    baseColumns.push({
      title: '来源',
      dataIndex: 'source',
      key: 'source',
    });
  }

  baseColumns.push({
    title: '操作',
    key: 'action',
  });

  return baseColumns;
});

function handleEdit(member: Record<string, unknown>) {
  emit('edit', member as unknown as Member);
}

function handleRemove(username: string) {
  emit('remove', username);
}

function getPermColor(perm: string) {
  const colorMap: Record<string, string> = {
    superAdmin: 'red',
    canCreateDoc: 'blue',
    canCreateFolder: 'green',
    canRead: 'default',
    EDIT: 'blue',
    READ: 'default',
  };
  return colorMap[perm] || 'default';
}

function getPermText(perm: string) {
  const textMap: Record<string, string> = {
    superAdmin: '管理员',
    canCreateDoc: '创建文档',
    canCreateFolder: '创建文件夹',
    canRead: '读取',
    EDIT: '可编辑',
    READ: '只读',
  };
  return textMap[perm] || perm;
}

function getSourceText(source: string) {
  return source === 'AUTO_INIT' ? '自动' : '手动';
}
</script>

<template>
  <Table
    :columns="columns"
    :data-source="members"
    :loading="loading"
    :pagination="false"
    row-key="id"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'permissions'">
        <Space v-if="type === 'space' && record.permissions">
          <Tag
            v-for="perm in record.permissions"
            :key="perm"
            :color="getPermColor(perm)"
          >
            {{ getPermText(perm) }}
          </Tag>
        </Space>
        <Tag v-else-if="type === 'doc'" :color="getPermColor(record.perm)">
          {{ getPermText(record.perm) }}
        </Tag>
      </template>
      <template v-else-if="column.key === 'source'">
        {{ getSourceText(record.source) }}
      </template>
      <template v-else-if="column.key === 'action'">
        <Space>
          <Button type="link" size="small" @click="handleEdit(record)">
            <EditOutlined />
          </Button>
          <Popconfirm
            title="确定要移除该成员吗？"
            @confirm="handleRemove(record.username)"
          >
            <Button type="link" size="small" danger>
              <DeleteOutlined />
            </Button>
          </Popconfirm>
        </Space>
      </template>
    </template>
  </Table>
</template>

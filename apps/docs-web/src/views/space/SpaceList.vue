<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  FormItem,
  Input,
  Pagination,
  Empty,
  Spin,
  message,
} from 'ant-design-vue';
import { PlusOutlined, FileTextOutlined } from '@ant-design/icons-vue';
import MainLayout from '@/layouts/MainLayout.vue';
import { useSpaceStore } from '@/stores/space';
import type { Space } from '@/types';

const router = useRouter();
const spaceStore = useSpaceStore();

const loading = ref(false);
const page = ref(1);
const pageSize = ref(20);

// 创建空间弹窗
const createModalVisible = ref(false);
const createForm = ref({
  name: '',
  codeName: '',
});
const creating = ref(false);

onMounted(async () => {
  await loadSpaces();
});

async function loadSpaces() {
  loading.value = true;
  try {
    await spaceStore.fetchSpaces(page.value, pageSize.value);
  } finally {
    loading.value = false;
  }
}

function handlePageChange(newPage: number) {
  page.value = newPage;
  loadSpaces();
}

function openCreateModal() {
  createForm.value = { name: '', codeName: '' };
  createModalVisible.value = true;
}

async function handleCreateSpace() {
  if (!createForm.value.name || !createForm.value.codeName) {
    message.warning('请填写完整信息');
    return;
  }

  creating.value = true;
  try {
    const space = await spaceStore.createSpace(createForm.value);
    message.success('创建成功');
    createModalVisible.value = false;
    router.push(`/space/${space.documentId}`);
  } catch {
    // 错误已在拦截器处理
  } finally {
    creating.value = false;
  }
}

function goToSpace(space: Space) {
  router.push(`/space/${space.documentId}`);
}
</script>

<template>
  <MainLayout>
    <div class="space-list-page">
      <div class="page-header flex-between">
        <div>
          <h1>空间列表</h1>
          <p class="description">管理和浏览所有文档空间</p>
        </div>
        <Button type="primary" @click="openCreateModal">
          <PlusOutlined />
          创建空间
        </Button>
      </div>

      <Spin :spinning="loading">
        <Row v-if="spaceStore.spaces.length > 0" :gutter="[16, 16]">
          <Col
            v-for="space in spaceStore.spaces"
            :key="space.id"
            :xs="24"
            :sm="12"
            :md="8"
            :lg="6"
          >
            <Card hoverable class="space-card" @click="goToSpace(space)">
              <template #cover>
                <div class="card-cover">
                  <FileTextOutlined />
                </div>
              </template>
              <Card.Meta :title="space.name">
                <template #description>
                  <div class="card-desc">
                    <span>{{ space.codeName }}</span>
                    <span class="creator">创建者: {{ space.creator }}</span>
                  </div>
                </template>
              </Card.Meta>
            </Card>
          </Col>
        </Row>
        <Empty v-else description="暂无空间" />
      </Spin>

      <div v-if="spaceStore.spacesTotal > pageSize" class="pagination-wrapper">
        <Pagination
          :current="page"
          :total="spaceStore.spacesTotal"
          :page-size="pageSize"
          show-size-changer
          @change="handlePageChange"
        />
      </div>
    </div>

    <!-- 创建空间弹窗 -->
    <Modal
      v-model:open="createModalVisible"
      title="创建空间"
      :confirm-loading="creating"
      @ok="handleCreateSpace"
    >
      <Form layout="vertical">
        <FormItem label="空间名称" required>
          <Input v-model:value="createForm.name" placeholder="请输入空间名称" />
        </FormItem>
        <FormItem label="空间代号" required>
          <Input v-model:value="createForm.codeName" placeholder="请输入空间代号（英文）" />
        </FormItem>
        <FormItem label="可访问">
          <Input readonly placeholder="全员（本空间）" />
        </FormItem>
        <FormItem label="可编辑">
          <Input readonly placeholder="创建者、可编辑成员、空间管理员" />
        </FormItem>
      </Form>
    </Modal>
  </MainLayout>
</template>

<style lang="less" scoped>
.space-list-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;

  h1 {
    font-size: 24px;
    font-weight: 600;
    margin: 0;
  }

  .description {
    color: rgba(0, 0, 0, 0.45);
    margin-top: 4px;
  }
}

.space-card {
  .card-cover {
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f0 100%);
    font-size: 40px;
    color: #1890ff;
  }

  .card-desc {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .creator {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
    }
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}
</style>

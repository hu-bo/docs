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
  Empty,
  Spin,
  message,
} from 'ant-design-vue';
import {
  PlusOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  UserOutlined,
} from '@ant-design/icons-vue';
import MainLayout from '@/layouts/MainLayout.vue';
import { useSpaceStore } from '@/stores/space';
import { useDocumentStore } from '@/stores/document';
import type { Space, RecentDoc } from '@/types';
import { SPACE_TYPE } from '@/types';
import dayjs from 'dayjs';

const router = useRouter();
const spaceStore = useSpaceStore();
const documentStore = useDocumentStore();

const recentSpaces = ref<Space[]>([]);
const recentDocs = ref<RecentDoc[]>([]);
const loading = ref(false);
const docsLoading = ref(false);
const personalSpaceLoading = ref(false);

// 创建空间弹窗
const createModalVisible = ref(false);
const createForm = ref({
  name: '',
  codeName: '',
});
const creating = ref(false);

onMounted(async () => {
  await Promise.all([loadPersonalSpace(), loadRecentSpaces(), loadRecentDocs()]);
});

async function loadPersonalSpace() {
  personalSpaceLoading.value = true;
  try {
    await spaceStore.fetchPersonalSpace();
  } finally {
    personalSpaceLoading.value = false;
  }
}

async function loadRecentSpaces() {
  loading.value = true;
  try {
    await spaceStore.fetchSpaces(1, 8);
    // 只显示公共空间
    recentSpaces.value = spaceStore.spaces.filter(s => s.space_type === SPACE_TYPE.PUBLIC);
  } finally {
    loading.value = false;
  }
}

async function loadRecentDocs() {
  docsLoading.value = true;
  try {
    recentDocs.value = await documentStore.fetchRecentDocuments(undefined, 8);
  } finally {
    docsLoading.value = false;
  }
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

function goToDoc(doc: RecentDoc) {
  router.push(`/space/${doc.spaceId}/doc/${doc.documentId}`);
}

function formatTime(time: string) {
  return dayjs(time).format('MM-DD HH:mm');
}
</script>

<template>
  <MainLayout>
    <div class="home-page">
      <!-- Hero 区域 -->
      <div class="hero-section">
        <h1>向日葵文档</h1>
        <p class="hero-desc">高效协作，知识共享</p>
        <div class="hero-actions">
          <Button type="primary" size="large" @click="openCreateModal">
            <PlusOutlined />
            创建空间
          </Button>
          <Button size="large" @click="router.push('/spaces')">
            <AppstoreOutlined />
            浏览空间
          </Button>
        </div>
      </div>

      <!-- 个人空间入口 -->
      <div class="personal-section">
        <Spin :spinning="personalSpaceLoading">
          <Card
            v-if="spaceStore.personalSpace"
            hoverable
            class="personal-space-card"
            @click="goToSpace(spaceStore.personalSpace!)"
          >
            <div class="personal-space-content">
              <div class="personal-space-icon">
                <UserOutlined />
              </div>
              <div class="personal-space-info">
                <h3>我的个人空间</h3>
                <p>私人文档，仅自己可见</p>
              </div>
            </div>
          </Card>
        </Spin>
      </div>

      <!-- 最近文档 -->
      <div class="recent-section">
        <div class="section-header">
          <h2>最近文档</h2>
        </div>

        <Spin :spinning="docsLoading">
          <Row v-if="recentDocs.length > 0" :gutter="[16, 16]">
            <Col v-for="doc in recentDocs" :key="doc.id" :xs="24" :sm="12" :md="8" :lg="6">
              <Card hoverable class="doc-card" @click="goToDoc(doc)">
                <template #cover>
                  <div class="card-cover doc-cover">
                    <FileTextOutlined />
                  </div>
                </template>
                <Card.Meta
                  :title="doc.title || '无标题'"
                  :description="doc.spaceName"
                />
                <div class="doc-time">{{ formatTime(doc.lastViewedAt) }}</div>
              </Card>
            </Col>
          </Row>
          <Empty v-else description="暂无最近访问的文档" />
        </Spin>
      </div>

      <!-- 公共空间 -->
      <div class="recent-section">
        <div class="section-header">
          <h2>公共空间</h2>
          <Button type="link" @click="router.push('/spaces')">查看全部</Button>
        </div>

        <Spin :spinning="loading">
          <Row v-if="recentSpaces.length > 0" :gutter="[16, 16]">
            <Col v-for="space in recentSpaces" :key="space.id" :xs="24" :sm="12" :md="8" :lg="6">
              <Card hoverable class="space-card" @click="goToSpace(space)">
                <template #cover>
                  <div class="card-cover">
                    <FileTextOutlined />
                  </div>
                </template>
                <Card.Meta :title="space.name" :description="space.codeName" />
              </Card>
            </Col>
          </Row>
          <Empty v-else description="暂无空间" />
        </Spin>
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
          <Input readonly disabled placeholder="全员（本空间）" />
        </FormItem>
        <FormItem label="可编辑">
          <Input readonly disabled placeholder="创建者、可编辑成员、空间管理员" />
        </FormItem>
      </Form>
    </Modal>
  </MainLayout>
</template>

<style lang="less" scoped>
.home-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.personal-section {
  margin-bottom: 32px;
}

.personal-space-card {
  background: linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%);
  border: none;

  .personal-space-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .personal-space-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #1890ff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: #fff;
  }

  .personal-space-info {
    h3 {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.85);
    }

    p {
      margin: 0;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.45);
    }
  }
}

.hero-section {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
  border-radius: 8px;
  margin-bottom: 40px;
  color: #fff;

  h1 {
    font-size: 42px;
    font-weight: 700;
    margin-bottom: 16px;
  }

  .hero-desc {
    font-size: 18px;
    opacity: 0.9;
    margin-bottom: 32px;
  }

  .hero-actions {
    display: flex;
    gap: 16px;
    justify-content: center;
  }
}

.recent-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      font-size: 20px;
      font-weight: 600;
      margin: 0;
    }
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
}

.doc-card {
  .card-cover {
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f0f5ff 0%, #d6e4ff 100%);
    font-size: 36px;
    color: #1890ff;
  }

  .doc-time {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.45);
    margin-top: 8px;
  }
}
</style>

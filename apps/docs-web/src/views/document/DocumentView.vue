<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Card,
  Button,
  Tag,
  Divider,
  Spin,
  Empty,
  List,
  ListItem,
  ListItemMeta,
  Input,
  message,
  Space,
  Dropdown,
  Menu,
  MenuItem,
} from 'ant-design-vue';
import {
  EditOutlined,
  TeamOutlined,
  ShareAltOutlined,
  MoreOutlined,
  SendOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue';
import { useDocumentStore } from '@/stores/document';
import * as commentApi from '@/api/comment';
import type { Comment } from '@/types';
import dayjs from 'dayjs';
import { detectContentFormat, tiptapJSONToHTML } from '@/utils/content-converter';

const route = useRoute();
const router = useRouter();
const documentStore = useDocumentStore();

const spaceId = computed(() => route.params.spaceId as string);
const documentId = computed(() => route.params.documentId as string);

const loading = ref(false);
const comments = ref<Comment[]>([]);
const commentsLoading = ref(false);
const newComment = ref('');
const submittingComment = ref(false);

const accessModeMap = {
  OPEN_EDIT: { text: '所有人可编辑', color: 'green' },
  OPEN_READONLY: { text: '所有人可查看', color: 'blue' },
  WHITELIST_ONLY: { text: '仅白名单可见', color: 'orange' },
};

// 渲染内容（自动处理 HTML 和 JSON 格式）
const renderedContent = computed(() => {
  const content = documentStore.currentDocument?.content;
  if (!content) return '';

  const format = detectContentFormat(content);

  if (format === 'json') {
    try {
      const json = JSON.parse(content);
      return tiptapJSONToHTML(json);
    } catch {
      return content;
    }
  }

  // HTML 格式直接返回
  return content;
});

onMounted(async () => {
  await loadDocument();
  await loadComments();
});

watch(documentId, async () => {
  if (documentId.value) {
    await loadDocument();
    await loadComments();
  }
});

async function loadDocument() {
  if (!documentId.value) return;

  loading.value = true;
  try {
    await documentStore.fetchDocumentById(documentId.value);
  } finally {
    loading.value = false;
  }
}

async function loadComments() {
  if (!documentId.value) return;

  commentsLoading.value = true;
  try {
    const result = await commentApi.getComments(documentId.value) as unknown as { list: Comment[] };
    comments.value = result.list || [];
  } catch {
    comments.value = [];
  } finally {
    commentsLoading.value = false;
  }
}

async function submitComment() {
  if (!newComment.value.trim()) {
    message.warning('请输入评论内容');
    return;
  }

  if (!documentStore.currentDocument) return;

  submittingComment.value = true;
  try {
    await commentApi.createComment({
      docId: documentStore.currentDocument.id,
      content: newComment.value,
    });
    message.success('评论成功');
    newComment.value = '';
    await loadComments();
  } catch {
    // 错误已在拦截器处理
  } finally {
    submittingComment.value = false;
  }
}

async function deleteComment(commentId: string) {
  try {
    await commentApi.deleteComment(commentId);
    message.success('删除成功');
    await loadComments();
  } catch {
    // 错误已在拦截器处理
  }
}

function goToEdit() {
  router.push(`/space/${spaceId.value}/doc/${documentId.value}/edit`);
}

function goToMembers() {
  router.push(`/space/${spaceId.value}/doc/${documentId.value}/members`);
}

function goToSpaces() {
  router.push(`/space/${spaceId.value}/doc/${documentId.value}/spaces`);
}

function formatTime(time: string) {
  return dayjs(time).format('YYYY-MM-DD HH:mm');
}
</script>

<template>
  <div class="document-view">
    <Spin :spinning="loading">
      <template v-if="documentStore.currentDocument">
        <Card class="doc-card">
          <template #title>
            <div class="doc-header">
              <h1 class="doc-title">{{ documentStore.currentDocument.title || '无标题' }}</h1>
              <Space>
                <Tag :color="accessModeMap[documentStore.currentDocument.accessMode]?.color">
                  {{ accessModeMap[documentStore.currentDocument.accessMode]?.text }}
                </Tag>
              </Space>
            </div>
          </template>
          <template #extra>
            <Space>
              <Button type="primary" @click="goToEdit">
                <EditOutlined />
                编辑
              </Button>
              <Dropdown>
                <Button>
                  <MoreOutlined />
                </Button>
                <template #overlay>
                  <Menu>
                    <MenuItem key="members" @click="goToMembers">
                      <TeamOutlined />
                      成员管理
                    </MenuItem>
                    <MenuItem key="spaces" @click="goToSpaces">
                      <ShareAltOutlined />
                      空间绑定
                    </MenuItem>
                  </Menu>
                </template>
              </Dropdown>
            </Space>
          </template>

          <div class="doc-meta">
            <span>作者: {{ documentStore.currentDocument.owner }}</span>
            <Divider type="vertical" />
            <span>创建: {{ formatTime(documentStore.currentDocument.ctime) }}</span>
            <Divider type="vertical" />
            <span>更新: {{ formatTime(documentStore.currentDocument.mtime) }}</span>
          </div>

          <Divider />

          <div
            v-if="renderedContent"
            class="doc-content"
            v-html="renderedContent"
          />
          <Empty v-else description="暂无内容" />
        </Card>

        <!-- 评论区 -->
        <Card title="评论" class="comments-card">
          <div class="comment-input">
            <Input.TextArea
              v-model:value="newComment"
              :rows="3"
              placeholder="写下你的评论..."
            />
            <Button
              type="primary"
              class="mt-sm"
              :loading="submittingComment"
              @click="submitComment"
            >
              <SendOutlined />
              发送
            </Button>
          </div>

          <Divider />

          <Spin :spinning="commentsLoading">
            <List
              v-if="comments.length > 0"
              :data-source="comments"
              item-layout="horizontal"
            >
              <template #renderItem="{ item }">
                <ListItem>
                  <template #actions>
                    <Button
                      type="text"
                      size="small"
                      danger
                      @click="deleteComment(item.id)"
                    >
                      <DeleteOutlined />
                    </Button>
                  </template>
                  <ListItemMeta :description="item.content">
                    <template #title>
                      <span>{{ item.username }}</span>
                      <span class="comment-time">{{ formatTime(item.ctime) }}</span>
                    </template>
                  </ListItemMeta>
                </ListItem>
              </template>
            </List>
            <Empty v-else description="暂无评论" />
          </Spin>
        </Card>
      </template>
      <Empty v-else description="文档不存在" />
    </Spin>
  </div>
</template>

<style lang="less" scoped>
.document-view {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}

.doc-card {
  .doc-header {
    display: flex;
    align-items: center;
    gap: 16px;

    .doc-title {
      font-size: 24px;
      font-weight: 600;
      margin: 0;
    }
  }

  .doc-meta {
    color: rgba(0, 0, 0, 0.45);
    font-size: 13px;
  }

  .doc-content {
    min-height: 200px;
    line-height: 1.8;
  }
}

.comments-card {
  margin-top: 24px;

  .comment-input {
    margin-bottom: 16px;
  }

  .comment-time {
    margin-left: 12px;
    color: rgba(0, 0, 0, 0.45);
    font-size: 12px;
    font-weight: normal;
  }
}
</style>

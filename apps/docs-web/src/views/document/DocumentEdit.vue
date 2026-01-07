<script setup lang="ts">
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Button,
  Input,
  Space,
  Popconfirm,
  message,
  Spin,
} from 'ant-design-vue';
import {
  SaveOutlined,
  CloseOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue';
import type { JSONContent } from '@tiptap/vue-3';
import type { Editor } from '@tiptap/core';
import TiptapEditor from '@/components/editor/TiptapEditor.vue';
import CollaborationUsers from '@/components/editor/CollaborationUsers.vue';
import { useDocumentStore } from '@/stores/document';
import { useSpaceStore } from '@/stores/space';
import { useUserStore } from '@/stores/user';
import { useCollaboration } from '@/composables/useCollaboration';
import { parseContent, serializeContent, createEmptyDoc } from '@/utils/content-converter';

const route = useRoute();
const router = useRouter();
const documentStore = useDocumentStore();
const spaceStore = useSpaceStore();
const userStore = useUserStore();

const spaceId = computed(() => route.params.spaceId as string);
const documentId = computed(() => route.params.documentId as string);
const isNew = computed(() => documentId.value === 'new');

const loading = ref(false);
const saving = ref(false);
const title = ref('');
const content = ref<JSONContent>(createEmptyDoc());

// 编辑器引用
const editorRef = ref<InstanceType<typeof TiptapEditor> | null>(null);

// 协作功能（仅对已有文档启用）
const collaboration = computed(() => {
  if (isNew.value) return null;

  return useCollaboration({
    documentId: documentId.value,
    username: userStore.username || 'anonymous',
    displayName: userStore.displayName || userStore.username || '匿名用户',
    enabled: !isNew.value,
  });
});

// 协作扩展
const collaborationExtensions = computed(() => {
  return collaboration.value?.collaborationExtensions.value || [];
});

// 在线用户
const onlineUsers = computed(() => collaboration.value?.onlineUsers.value || []);
const connectionStatus = computed(() => collaboration.value?.connectionStatus.value || 'disconnected');

onMounted(async () => {
  if (!isNew.value) {
    await loadDocument();
    // 连接协作
    collaboration.value?.connect();
  }
});

watch(documentId, async (newId, oldId) => {
  if (newId !== oldId) {
    // 断开旧连接
    collaboration.value?.disconnect();

    if (!isNew.value) {
      await loadDocument();
      // 重新连接
      collaboration.value?.connect();
    } else {
      title.value = '';
      content.value = createEmptyDoc();
    }
  }
});

onBeforeUnmount(() => {
  collaboration.value?.disconnect();
});

async function loadDocument() {
  loading.value = true;
  try {
    await documentStore.fetchDocumentById(documentId.value);
    if (documentStore.currentDocument) {
      title.value = documentStore.currentDocument.title;
      // 解析内容（自动检测 HTML 或 JSON 格式）
      content.value = parseContent(documentStore.currentDocument.content || '');
    }
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  if (!title.value.trim()) {
    message.warning('请输入标题');
    return;
  }

  // 获取编辑器内容
  const editor = editorRef.value?.editor;
  const jsonContent = editor?.getJSON() || content.value;

  saving.value = true;
  try {
    if (isNew.value) {
      if (!spaceStore.currentSpace) {
        message.error('空间信息加载失败');
        return;
      }
      const doc = await documentStore.createDocument({
        spaceId: spaceStore.currentSpace.id,
        title: title.value,
        content: serializeContent(jsonContent),
      });
      message.success('创建成功');
      router.replace(`/space/${spaceId.value}/doc/${doc.documentId}`);
    } else {
      await documentStore.updateDocument(documentId.value, {
        title: title.value,
        content: serializeContent(jsonContent),
      });
      message.success('保存成功');
    }
  } catch {
    // 错误已在拦截器处理
  } finally {
    saving.value = false;
  }
}

function handleCancel() {
  if (isNew.value) {
    router.push(`/space/${spaceId.value}`);
  } else {
    router.push(`/space/${spaceId.value}/doc/${documentId.value}`);
  }
}

async function handleDelete() {
  if (isNew.value) return;

  try {
    await documentStore.deleteDocument(documentId.value);
    message.success('删除成功');
    router.push(`/space/${spaceId.value}`);
  } catch {
    // 错误已在拦截器处理
  }
}

function onEditorReady(_editor: Editor) {
  // 编辑器就绪回调
}
</script>

<template>
  <div class="document-edit">
    <Spin :spinning="loading">
      <div class="edit-header">
        <Input
          v-model:value="title"
          class="title-input"
          placeholder="请输入标题"
          :bordered="false"
        />
        <Space>
          <!-- 协作用户状态（仅非新建文档显示） -->
          <CollaborationUsers
            v-if="!isNew"
            :users="onlineUsers"
            :connection-status="connectionStatus"
          />

          <Button type="primary" :loading="saving" @click="handleSave">
            <SaveOutlined />
            保存
          </Button>
          <Button @click="handleCancel">
            <CloseOutlined />
            取消
          </Button>
          <Popconfirm
            v-if="!isNew"
            title="确定要删除此文档吗？"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handleDelete"
          >
            <Button danger>
              <DeleteOutlined />
              删除
            </Button>
          </Popconfirm>
        </Space>
      </div>

      <div class="edit-content">
        <TiptapEditor
          ref="editorRef"
          :model-value="content"
          :extensions="collaborationExtensions"
          @update:model-value="content = $event"
          @ready="onEditorReady"
        />
      </div>
    </Spin>
  </div>
</template>

<style lang="less" scoped>
.document-edit {
  height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  background: #fff;
}

.edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;

  .title-input {
    flex: 1;
    font-size: 24px;
    font-weight: 600;
    margin-right: 24px;

    :deep(input) {
      font-size: 24px;
      font-weight: 600;
    }
  }
}

.edit-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>

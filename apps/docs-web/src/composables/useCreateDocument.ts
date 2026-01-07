import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { useDocumentStore } from '@/stores/document';
import type { AccessMode } from '@/types';

export interface CreateDocumentOptions {
  spaceId: string;
  folderId?: string;
  /** 用于构建带目录层级的 URL */
  folderUrl?: string;
}

export interface CreateDocumentForm {
  title: string;
  accessMode: AccessMode;
}

export function useCreateDocument() {
  const router = useRouter();
  const documentStore = useDocumentStore();

  const modalVisible = ref(false);
  const creating = ref(false);
  const form = ref<CreateDocumentForm>({
    title: '',
    accessMode: 'OPEN_READONLY',
  });

  // 保存当前创建上下文
  let currentOptions: CreateDocumentOptions | null = null;

  function openCreateModal(options: CreateDocumentOptions) {
    currentOptions = options;
    form.value = {
      title: '',
      accessMode: 'OPEN_READONLY',
    };
    modalVisible.value = true;
  }

  function closeModal() {
    modalVisible.value = false;
    currentOptions = null;
  }

  async function handleCreate(): Promise<boolean> {
    if (!form.value.title) {
      message.warning('请输入文档标题');
      return false;
    }

    if (!currentOptions) {
      message.error('创建参数丢失');
      return false;
    }

    creating.value = true;
    try {
      const doc = await documentStore.createDocument({
        spaceId: currentOptions.spaceId,
        folderId: currentOptions.folderId,
        title: form.value.title,
        accessMode: form.value.accessMode,
      });

      message.success('创建文档成功');
      modalVisible.value = false;

      // 构建带目录层级的文档编辑 URL
      const { spaceId, folderUrl } = currentOptions;
      if (folderUrl && folderUrl.includes('/folder/')) {
        router.push(`${folderUrl}/doc/${doc.documentId}/edit`);
      } else {
        router.push(`/space/${spaceId}/doc/${doc.documentId}/edit`);
      }

      return true;
    } catch {
      // 错误已在拦截器处理
      return false;
    } finally {
      creating.value = false;
    }
  }

  return {
    modalVisible,
    creating,
    form,
    openCreateModal,
    closeModal,
    handleCreate,
  };
}

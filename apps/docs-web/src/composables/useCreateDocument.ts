import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useDocumentStore } from '@/stores/document';
import type { AccessMode } from '@/types';

export interface CreateDocumentForm {
  title: string;
  accessMode: AccessMode;
}

export function useCreateDocument(spaceId: string, folderId?: string) {
  const router = useRouter();
  const documentStore = useDocumentStore();

  const modalVisible = ref(false);
  const creating = ref(false);

  const form = reactive<CreateDocumentForm>({
    title: '',
    accessMode: 'OPEN_EDIT',
  });

  function openCreateModal() {
    form.title = '';
    form.accessMode = 'OPEN_EDIT';
    modalVisible.value = true;
  }

  function closeModal() {
    modalVisible.value = false;
    form.title = '';
    form.accessMode = 'OPEN_EDIT';
  }

  async function handleCreate() {
    if (!form.title.trim()) {
      return;
    }

    creating.value = true;
    try {
      const newDoc = await documentStore.createDocument({
        title: form.title.trim(),
        accessMode: form.accessMode,
        spaceId,
        folderId,
        content: '',
      });

      closeModal();

      // Navigate to the new document edit page
      if (folderId) {
        router.push({
          name: 'FolderDocumentEdit',
          params: {
            spaceId,
            folderPath: folderId,
            documentId: newDoc.documentId,
          },
        });
      } else {
        router.push({
          name: 'DocumentEdit',
          params: {
            spaceId,
            documentId: newDoc.documentId,
          },
        });
      }

      return newDoc;
    } catch (error) {
      console.error('Failed to create document:', error);
      throw error;
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

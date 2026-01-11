import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Doc, RecentDoc, TreeNode, DocUserAcl, DocSpaceBinding, FolderContentItem } from '@/types';
import * as documentApi from '@/api/document';

export const useDocumentStore = defineStore('document', () => {
  // State
  const documentTree = ref<TreeNode[]>([]);
  const folderContents = ref<FolderContentItem[]>([]);
  const currentDocument = ref<Doc | null>(null);
  const documents = ref<Doc[]>([]);
  const documentsTotal = ref(0);
  const recentDocuments = ref<RecentDoc[]>([]);
  const documentMembers = ref<DocUserAcl[]>([]);
  const documentSpaces = ref<DocSpaceBinding[]>([]);
  const loading = ref(false);
  const folderContentsLoading = ref(false);

  // Actions
  async function fetchDocumentTree(spaceId: string, folderId?: string) {
    try {
      const data = await documentApi.getDocumentTree({ spaceId, folderId });
      documentTree.value = data;
      return data;
    } catch (error) {
      console.error('Failed to fetch document tree:', error);
      throw error;
    }
  }

  async function loadTreeNodeChildren(spaceId: string, folderId: string) {
    try {
      const data = await documentApi.getDocumentTree({ spaceId, folderId });
      return data;
    } catch (error) {
      console.error('Failed to load tree node children:', error);
      throw error;
    }
  }

  async function fetchFolderContents(spaceId: string, folderId?: string) {
    folderContentsLoading.value = true;
    try {
      const data = await documentApi.getFolderContents({ spaceId, folderId });
      folderContents.value = data;
      return data;
    } catch (error) {
      console.error('Failed to fetch folder contents:', error);
      throw error;
    } finally {
      folderContentsLoading.value = false;
    }
  }

  async function fetchDocuments(params: {
    spaceId: string;
    folderId?: string;
    page?: number;
    pageSize?: number
  }) {
    loading.value = true;
    try {
      const data = await documentApi.getDocuments(params);
      documents.value = data.list;
      documentsTotal.value = data.total;
      return data;
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchDocumentById(documentId: string) {
    loading.value = true;
    try {
      const data = await documentApi.getDocumentById(documentId);
      currentDocument.value = data;
      return data;
    } catch (error) {
      console.error('Failed to fetch document:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchRecentDocuments(params?: { limit?: number }) {
    try {
      const data = await documentApi.getRecentDocuments(params);
      recentDocuments.value = data;
      return data;
    } catch (error) {
      console.error('Failed to fetch recent documents:', error);
      throw error;
    }
  }

  async function createDocument(data: Partial<Doc>) {
    try {
      const newDoc = await documentApi.createDocument(data);
      return newDoc;
    } catch (error) {
      console.error('Failed to create document:', error);
      throw error;
    }
  }

  async function updateDocument(documentId: string, data: Partial<Doc>) {
    try {
      const updated = await documentApi.updateDocument(documentId, data);
      if (currentDocument.value?.documentId === documentId) {
        currentDocument.value = updated;
      }
      return updated;
    } catch (error) {
      console.error('Failed to update document:', error);
      throw error;
    }
  }

  async function moveDocument(documentId: string, folderId: string) {
    try {
      await documentApi.moveDocument(documentId, folderId);
    } catch (error) {
      console.error('Failed to move document:', error);
      throw error;
    }
  }

  async function deleteDocument(documentId: string) {
    try {
      await documentApi.deleteDocument(documentId);
      documents.value = documents.value.filter(d => d.documentId !== documentId);
      if (currentDocument.value?.documentId === documentId) {
        currentDocument.value = null;
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw error;
    }
  }

  // Document Members
  async function fetchDocMembers(documentId: string) {
    try {
      const data = await documentApi.getDocMembers(documentId);
      documentMembers.value = data;
      return data;
    } catch (error) {
      console.error('Failed to fetch document members:', error);
      throw error;
    }
  }

  async function addDocMembers(documentId: string, members: any[]) {
    try {
      await documentApi.addDocMembers(documentId, {members});
      await fetchDocMembers(documentId);
    } catch (error) {
      console.error('Failed to add document members:', error);
      throw error;
    }
  }

  async function updateDocMember(documentId: string, username: string, data: any) {
    try {
      await documentApi.updateDocMember(documentId, username, data);
      await fetchDocMembers(documentId);
    } catch (error) {
      console.error('Failed to update document member:', error);
      throw error;
    }
  }

  async function removeDocMember(documentId: string, username: string) {
    try {
      await documentApi.removeDocMembers(documentId, username);
      documentMembers.value = documentMembers.value.filter(m => m.username !== username);
    } catch (error) {
      console.error('Failed to remove document member:', error);
      throw error;
    }
  }

  // Document Spaces
  async function fetchDocSpaces(documentId: string) {
    try {
      const data = await documentApi.getDocSpaces(documentId);
      documentSpaces.value = data;
      return data;
    } catch (error) {
      console.error('Failed to fetch document spaces:', error);
      throw error;
    }
  }

  async function bindDocToSpace(documentId: string, data: any) {
    try {
      await documentApi.bindDocToSpace(documentId, data);
      await fetchDocSpaces(documentId);
    } catch (error) {
      console.error('Failed to bind document to space:', error);
      throw error;
    }
  }

  async function unbindDocFromSpace(documentId: string, spaceId: string) {
    try {
      await documentApi.unbindDocFromSpace(documentId, spaceId);
      documentSpaces.value = documentSpaces.value.filter(s => s.spaceId !== spaceId);
    } catch (error) {
      console.error('Failed to unbind document from space:', error);
      throw error;
    }
  }

  function resetCurrentDocument() {
    currentDocument.value = null;
    documentMembers.value = [];
    documentSpaces.value = [];
  }

  return {
    // State
    documentTree,
    folderContents,
    currentDocument,
    documents,
    documentsTotal,
    recentDocuments,
    documentMembers,
    documentSpaces,
    loading,
    folderContentsLoading,
    // Actions
    fetchDocumentTree,
    loadTreeNodeChildren,
    fetchFolderContents,
    fetchDocuments,
    fetchDocumentById,
    fetchRecentDocuments,
    createDocument,
    updateDocument,
    moveDocument,
    deleteDocument,
    fetchDocMembers,
    addDocMembers,
    updateDocMember,
    removeDocMember,
    fetchDocSpaces,
    bindDocToSpace,
    unbindDocFromSpace,
    resetCurrentDocument,
  };
});

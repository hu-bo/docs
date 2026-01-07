import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as docApi from '@/api/document';
import type { Doc, Folder, TreeNode, PaginatedData, CreateDocForm, RecentDoc } from '@/types';

export const useDocumentStore = defineStore('document', () => {
  // 状态
  const documentTree = ref<TreeNode[]>([]);
  const currentDocument = ref<Doc | null>(null);
  const documents = ref<Doc[]>([]);
  const documentsTotal = ref(0);
  const recentDocuments = ref<RecentDoc[]>([]);
  const loading = ref(false);

  // 构建树节点
  function buildTreeNodes(folders: Folder[], docs: Doc[]): TreeNode[] {
    const nodes: TreeNode[] = [];

    // 添加文件夹节点
    folders.forEach(folder => {
      nodes.push({
        key: `folder-${folder.documentId}`,
        title: folder.name,
        type: 'folder',
        data: folder,
        children: [],
        isLeaf: false,
      });
    });

    // 添加文档节点
    docs.forEach(doc => {
      nodes.push({
        key: `doc-${doc.documentId}`,
        title: doc.title,
        type: 'doc',
        data: doc,
        isLeaf: true,
      });
    });

    return nodes;
  }

  // 操作
  async function fetchDocumentTree(spaceId: string, folderId = '0') {
    loading.value = true;
    try {
      const result = await docApi.getDocumentTree({ spaceId, folderId }) as unknown as { folders: Folder[]; docs: Doc[] };
      const nodes = buildTreeNodes(result.folders, result.docs);

      if (folderId === '0') {
        // 根目录
        documentTree.value = nodes;
      }

      return nodes;
    } finally {
      loading.value = false;
    }
  }

  async function loadTreeNodeChildren(spaceId: string, folderId: string): Promise<TreeNode[]> {
    const result = await docApi.getDocumentTree({ spaceId, folderId }) as unknown as { folders: Folder[]; docs: Doc[] };
    return buildTreeNodes(result.folders, result.docs);
  }

  async function fetchDocuments(spaceId: string, folderId?: string, page = 1, pageSize = 20) {
    loading.value = true;
    try {
      const result = await docApi.getDocuments({ spaceId, folderId, page, pageSize }) as unknown as PaginatedData<Doc>;
      documents.value = result.list;
      documentsTotal.value = result.total;
      return result;
    } finally {
      loading.value = false;
    }
  }

  async function fetchDocumentById(documentId: string) {
    loading.value = true;
    try {
      currentDocument.value = await docApi.getDocumentById(documentId) as unknown as Doc;
      return currentDocument.value;
    } catch (error) {
      // 请求失败时（包括权限不足403），清空旧的文档数据，防止显示缓存内容
      currentDocument.value = null;
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function createDocument(data: CreateDocForm) {
    const result = await docApi.createDocument(data) as unknown as Doc;
    documents.value.unshift(result);
    return result;
  }

  async function updateDocument(documentId: string, data: Partial<CreateDocForm>) {
    const result = await docApi.updateDocument(documentId, data) as unknown as Doc;
    if (currentDocument.value?.documentId === documentId) {
      currentDocument.value = result;
    }
    const index = documents.value.findIndex(d => d.documentId === documentId);
    if (index !== -1) {
      documents.value[index] = result;
    }
    return result;
  }

  async function moveDocument(documentId: string, folderId: string) {
    const result = await docApi.moveDocument(documentId, folderId) as unknown as Doc;
    if (currentDocument.value?.documentId === documentId) {
      currentDocument.value = result;
    }
    return result;
  }

  async function deleteDocument(documentId: string) {
    await docApi.deleteDocument(documentId);
    documents.value = documents.value.filter(d => d.documentId !== documentId);
    if (currentDocument.value?.documentId === documentId) {
      currentDocument.value = null;
    }
  }

  function clearCurrentDocument() {
    currentDocument.value = null;
  }

  function clearDocumentTree() {
    documentTree.value = [];
  }

  async function fetchRecentDocuments(spaceId?: string, limit = 6) {
    const result = await docApi.getRecentDocuments({ spaceId, limit });
    recentDocuments.value = result as unknown as RecentDoc[];
    return recentDocuments.value;
  }

  return {
    // 状态
    documentTree,
    currentDocument,
    documents,
    documentsTotal,
    recentDocuments,
    loading,
    // 操作
    fetchDocumentTree,
    loadTreeNodeChildren,
    fetchDocuments,
    fetchDocumentById,
    fetchRecentDocuments,
    createDocument,
    updateDocument,
    moveDocument,
    deleteDocument,
    clearCurrentDocument,
    clearDocumentTree,
  };
});

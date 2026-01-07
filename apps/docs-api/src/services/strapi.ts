import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { config } from '../app-config/index.js';
import { logger } from '../utils/logger.js';
import type {
  Space,
  Folder,
  Doc,
  Comment,
  UserSpaceAuth,
  DocUserAcl,
  DocSpaceAcl,
  DocUserActivity,
  AccessRequest,
  StrapiSingleResponse,
  StrapiListResponse,
} from '../types/index.js';

const strapiClient: AxiosInstance = axios.create({
  baseURL: config.strapi.baseUrl,
  headers: {
    Authorization: `Bearer ${config.strapi.apiToken}`,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

strapiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    logger.error('[Strapi] Request failed:', error.message);
    throw error;
  }
);

// ============ 通用过滤器构建 ============
function buildNotDeletedFilter(): Record<string, unknown> {
  return { 'filters[isDeleted][$eq]': false };
}

// ============ Space API ============
export async function getSpaces(params?: Record<string, unknown>): Promise<StrapiListResponse<Space>> {
  const { data } = await strapiClient.get('/api/spaces', {
    params: { ...buildNotDeletedFilter(), ...params },
  });
  return data;
}

export async function getSpaceById(documentId: string): Promise<StrapiSingleResponse<Space>> {
  const { data } = await strapiClient.get(`/api/spaces/${documentId}`, {
    params: buildNotDeletedFilter(),
  });
  return data;
}

export async function getSpaceByNumericId(id: string): Promise<StrapiSingleResponse<Space>> {
  const { data } = await strapiClient.get('/api/spaces', {
    params: { ...buildNotDeletedFilter(), 'filters[id][$eq]': id },
  });
  return { data: data.data?.[0] || null, meta: data.meta };
}

export async function createSpace(payload: Partial<Space>): Promise<StrapiSingleResponse<Space>> {
  const { data } = await strapiClient.post('/api/spaces', { data: payload });
  return data;
}

export async function updateSpace(documentId: string, payload: Partial<Space>): Promise<StrapiSingleResponse<Space>> {
  const { data } = await strapiClient.put(`/api/spaces/${documentId}`, { data: payload });
  return data;
}

export async function deleteSpace(documentId: string): Promise<StrapiSingleResponse<Space>> {
  const { data } = await strapiClient.put(`/api/spaces/${documentId}`, { data: { isDeleted: true } });
  return data;
}

// ============ Folder API ============
export async function getFolders(params?: Record<string, unknown>): Promise<StrapiListResponse<Folder>> {
  const { data } = await strapiClient.get('/api/folders', {
    params: { ...buildNotDeletedFilter(), ...params },
  });
  return data;
}

export async function getFolderById(documentId: string): Promise<StrapiSingleResponse<Folder>> {
  const { data } = await strapiClient.get(`/api/folders/${documentId}`, {
    params: buildNotDeletedFilter(),
  });
  return data;
}

export async function getFolderByNumericId(id: string): Promise<Folder | null> {
  const { data } = await strapiClient.get('/api/folders', {
    params: { ...buildNotDeletedFilter(), 'filters[id][$eq]': id },
  });
  return data.data?.[0] || null;
}

export async function createFolder(payload: Partial<Folder>): Promise<StrapiSingleResponse<Folder>> {
  const { data } = await strapiClient.post('/api/folders', { data: payload });
  return data;
}

export async function updateFolder(documentId: string, payload: Partial<Folder>): Promise<StrapiSingleResponse<Folder>> {
  const { data } = await strapiClient.put(`/api/folders/${documentId}`, { data: payload });
  return data;
}

export async function deleteFolder(documentId: string): Promise<StrapiSingleResponse<Folder>> {
  const { data } = await strapiClient.put(`/api/folders/${documentId}`, { data: { isDeleted: true } });
  return data;
}

// ============ Doc API ============
export async function getDocs(params?: Record<string, unknown>): Promise<StrapiListResponse<Doc>> {
  const { data } = await strapiClient.get('/api/docs', {
    params: { ...buildNotDeletedFilter(), ...params },
  });
  return data;
}

export async function getDocById(documentId: string): Promise<StrapiSingleResponse<Doc>> {
  const { data } = await strapiClient.get(`/api/docs/${documentId}`, {
    params: buildNotDeletedFilter(),
  });
  return data;
}

export async function getDocByNumericId(id: string): Promise<StrapiSingleResponse<Doc>> {
  const { data } = await strapiClient.get('/api/docs', {
    params: { ...buildNotDeletedFilter(), 'filters[id][$eq]': id },
  });
  // 将列表响应转换为单条响应格式
  return { data: data.data?.[0] || null, meta: data.meta };
}

export async function createDoc(payload: Partial<Doc>): Promise<StrapiSingleResponse<Doc>> {
  const { data } = await strapiClient.post('/api/docs', { data: payload });
  return data;
}

export async function updateDoc(documentId: string, payload: Partial<Doc>): Promise<StrapiSingleResponse<Doc>> {
  const { data } = await strapiClient.put(`/api/docs/${documentId}`, { data: payload });
  return data;
}

export async function deleteDoc(documentId: string): Promise<StrapiSingleResponse<Doc>> {
  const { data } = await strapiClient.put(`/api/docs/${documentId}`, { data: { isDeleted: true } });
  return data;
}

// ============ Comment API ============
export async function getComments(params?: Record<string, unknown>): Promise<StrapiListResponse<Comment>> {
  const { data } = await strapiClient.get('/api/comments', {
    params: { ...buildNotDeletedFilter(), ...params },
  });
  return data;
}

export async function getCommentById(documentId: string): Promise<StrapiSingleResponse<Comment>> {
  const { data } = await strapiClient.get(`/api/comments/${documentId}`, {
    params: buildNotDeletedFilter(),
  });
  return data;
}

export async function createComment(payload: Partial<Comment>): Promise<StrapiSingleResponse<Comment>> {
  const { data } = await strapiClient.post('/api/comments', { data: payload });
  return data;
}

export async function updateComment(documentId: string, payload: Partial<Comment>): Promise<StrapiSingleResponse<Comment>> {
  const { data } = await strapiClient.put(`/api/comments/${documentId}`, { data: payload });
  return data;
}

export async function deleteComment(documentId: string): Promise<StrapiSingleResponse<Comment>> {
  const { data } = await strapiClient.put(`/api/comments/${documentId}`, { data: { isDeleted: true } });
  return data;
}

// ============ UserSpaceAuth API ============
export async function getUserSpaceAuths(params?: Record<string, unknown>): Promise<StrapiListResponse<UserSpaceAuth>> {
  const { data } = await strapiClient.get('/api/user-space-auths', {
    params: { ...buildNotDeletedFilter(), ...params },
  });
  return data;
}

export async function getUserSpaceAuthById(documentId: string): Promise<StrapiSingleResponse<UserSpaceAuth>> {
  const { data } = await strapiClient.get(`/api/user-space-auths/${documentId}`, {
    params: buildNotDeletedFilter(),
  });
  return data;
}

export async function createUserSpaceAuth(payload: Partial<UserSpaceAuth>): Promise<StrapiSingleResponse<UserSpaceAuth>> {
  const { data } = await strapiClient.post('/api/user-space-auths', { data: payload });
  return data;
}

export async function updateUserSpaceAuth(documentId: string, payload: Partial<UserSpaceAuth>): Promise<StrapiSingleResponse<UserSpaceAuth>> {
  const { data } = await strapiClient.put(`/api/user-space-auths/${documentId}`, { data: payload });
  return data;
}

export async function deleteUserSpaceAuth(documentId: string): Promise<StrapiSingleResponse<UserSpaceAuth>> {
  const { data } = await strapiClient.put(`/api/user-space-auths/${documentId}`, { data: { isDeleted: true } });
  return data;
}

// ============ DocUserAcl API ============
export async function getDocUserAcls(params?: Record<string, unknown>): Promise<StrapiListResponse<DocUserAcl>> {
  const { data } = await strapiClient.get('/api/doc-user-acls', {
    params: { ...buildNotDeletedFilter(), ...params },
  });
  return data;
}

export async function getDocUserAclById(documentId: string): Promise<StrapiSingleResponse<DocUserAcl>> {
  const { data } = await strapiClient.get(`/api/doc-user-acls/${documentId}`, {
    params: buildNotDeletedFilter(),
  });
  return data;
}

export async function createDocUserAcl(payload: Partial<DocUserAcl>): Promise<StrapiSingleResponse<DocUserAcl>> {
  const { data } = await strapiClient.post('/api/doc-user-acls', { data: payload });
  return data;
}

export async function updateDocUserAcl(documentId: string, payload: Partial<DocUserAcl>): Promise<StrapiSingleResponse<DocUserAcl>> {
  const { data } = await strapiClient.put(`/api/doc-user-acls/${documentId}`, { data: payload });
  return data;
}

export async function deleteDocUserAcl(documentId: string): Promise<StrapiSingleResponse<DocUserAcl>> {
  const { data } = await strapiClient.put(`/api/doc-user-acls/${documentId}`, { data: { isDeleted: true } });
  return data;
}

// ============ DocSpaceAcl API ============
export async function getDocSpaceAcls(params?: Record<string, unknown>): Promise<StrapiListResponse<DocSpaceAcl>> {
  const { data } = await strapiClient.get('/api/doc-space-acls', {
    params: { ...buildNotDeletedFilter(), ...params },
  });
  return data;
}

export async function getDocSpaceAclById(documentId: string): Promise<StrapiSingleResponse<DocSpaceAcl>> {
  const { data } = await strapiClient.get(`/api/doc-space-acls/${documentId}`, {
    params: buildNotDeletedFilter(),
  });
  return data;
}

export async function createDocSpaceAcl(payload: Partial<DocSpaceAcl>): Promise<StrapiSingleResponse<DocSpaceAcl>> {
  const { data } = await strapiClient.post('/api/doc-space-acls', { data: payload });
  return data;
}

export async function updateDocSpaceAcl(documentId: string, payload: Partial<DocSpaceAcl>): Promise<StrapiSingleResponse<DocSpaceAcl>> {
  const { data } = await strapiClient.put(`/api/doc-space-acls/${documentId}`, { data: payload });
  return data;
}

export async function deleteDocSpaceAcl(documentId: string): Promise<StrapiSingleResponse<DocSpaceAcl>> {
  const { data } = await strapiClient.put(`/api/doc-space-acls/${documentId}`, { data: { isDeleted: true } });
  return data;
}

// ============ DocUserActivity API ============
export async function getDocUserActivities(params?: Record<string, unknown>): Promise<StrapiListResponse<DocUserActivity>> {
  const { data } = await strapiClient.get('/api/doc-user-activities', {
    params: { ...buildNotDeletedFilter(), ...params },
  });
  return data;
}

export async function getDocUserActivityById(documentId: string): Promise<StrapiSingleResponse<DocUserActivity>> {
  const { data } = await strapiClient.get(`/api/doc-user-activities/${documentId}`, {
    params: buildNotDeletedFilter(),
  });
  return data;
}

export async function createDocUserActivity(payload: Partial<DocUserActivity>): Promise<StrapiSingleResponse<DocUserActivity>> {
  const { data } = await strapiClient.post('/api/doc-user-activities', { data: payload });
  return data;
}

export async function updateDocUserActivity(documentId: string, payload: Partial<DocUserActivity>): Promise<StrapiSingleResponse<DocUserActivity>> {
  const { data } = await strapiClient.put(`/api/doc-user-activities/${documentId}`, { data: payload });
  return data;
}

export async function upsertDocUserActivity(
  docId: string,
  username: string,
  updates: Partial<DocUserActivity>,
  options?: { incrementVisitCount?: boolean }
): Promise<StrapiSingleResponse<DocUserActivity>> {
  // 先查找是否存在
  const existing = await getDocUserActivities({
    'filters[docId][$eq]': docId,
    'filters[username][$eq]': username,
  });

  if (existing.data.length > 0) {
    const existingRecord = existing.data[0];
    const updatePayload = { ...updates };

    // 如果需要增量更新 visitCount
    if (options?.incrementVisitCount) {
      updatePayload.visitCount = (existingRecord.visitCount || 0) + 1;
    }

    return updateDocUserActivity(existingRecord.documentId, updatePayload);
  } else {
    return createDocUserActivity({
      docId,
      username,
      visitCount: options?.incrementVisitCount ? 1 : (updates.visitCount ?? 0),
      ...updates,
    });
  }
}

// ============ AccessRequest API ============
export async function getAccessRequests(params?: Record<string, unknown>): Promise<StrapiListResponse<AccessRequest>> {
  const { data } = await strapiClient.get('/api/access-requests', {
    params: { ...buildNotDeletedFilter(), ...params },
  });
  return data;
}

export async function getAccessRequestById(documentId: string): Promise<StrapiSingleResponse<AccessRequest>> {
  const { data } = await strapiClient.get(`/api/access-requests/${documentId}`, {
    params: buildNotDeletedFilter(),
  });
  return data;
}

export async function createAccessRequest(payload: Partial<AccessRequest>): Promise<StrapiSingleResponse<AccessRequest>> {
  const { data } = await strapiClient.post('/api/access-requests', { data: payload });
  return data;
}

export async function updateAccessRequest(documentId: string, payload: Partial<AccessRequest>): Promise<StrapiSingleResponse<AccessRequest>> {
  const { data } = await strapiClient.put(`/api/access-requests/${documentId}`, { data: payload });
  return data;
}

export async function deleteAccessRequest(documentId: string): Promise<StrapiSingleResponse<AccessRequest>> {
  const { data } = await strapiClient.put(`/api/access-requests/${documentId}`, { data: { isDeleted: true } });
  return data;
}

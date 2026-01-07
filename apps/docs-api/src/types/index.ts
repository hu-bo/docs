import type { Request } from 'express';

// ============ 用户相关 ============
export interface UserInfo {
  username: string;
  department?: string;
  deptId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: UserInfo;
}

// ============ 空间相关 ============
// 空间类型: 1=公共空间, 2=个人空间
export type SpaceType = 1 | 2;
export const SPACE_TYPE = {
  PUBLIC: 1 as SpaceType,
  PERSONAL: 2 as SpaceType,
};

export interface Space {
  id: string;
  documentId: string;
  name: string;
  codeName: string;
  creator: string;
  icon: string;
  datasetId: string;
  space_type: SpaceType;
  isDeleted: boolean;
  ctime: string;
  mtime: string;
}

export interface Folder {
  id: string;
  documentId: string;
  spaceId: string;
  parentId: string;
  name: string;
  visibilityScope: 'ALL' | 'DEPT_ONLY';
  order: number;
  isDeleted: boolean;
  ctime: string;
  mtime: string;
}

// ============ 文档相关 ============
export type AccessMode = 'OPEN_EDIT' | 'OPEN_READONLY' | 'WHITELIST_ONLY';

export interface Doc {
  id: string;
  documentId: string;
  spaceId: string;
  folderId: string;
  title: string;
  content: string;
  accessMode: AccessMode;
  owner: string;
  tags: string;
  isDeleted: boolean;
  ctime: string;
  mtime: string;
}

// 带权限信息的文档（列表接口返回）
export interface DocWithPermission extends Doc {
  hasSpaceAuth: boolean; // 用户是否在 user-space-auth 表中
}

// ============ 评论相关 ============
export interface Comment {
  id: string;
  documentId: string;
  docId: string;
  parentId: string;
  username: string;
  content: string;
  isDeleted: boolean;
  ctime: string;
  mtime: string;
}

// ============ 权限相关 ============
export type PermSource = 'AUTO_INIT' | 'MANUAL';
export type DocPerm = 'READ' | 'EDIT';

export interface UserSpaceAuth {
  id: string;
  documentId: string;
  spaceId: string;
  username: string;
  canRead: boolean;
  canCreateFolder: boolean;
  canCreateDoc: boolean;
  superAdmin: boolean;
  source: PermSource;
  isDeleted: boolean;
  ctime: string;
  mtime: string;
}

export interface DocUserAcl {
  id: string;
  documentId: string;
  docId: string;
  username: string;
  perm: DocPerm;
  isDeleted: boolean;
  ctime: string;
  mtime: string;
}

export interface DocSpaceAcl {
  id: string;
  documentId: string;
  docId: string;
  spaceId: string;
  folderId: string;
  perm: DocPerm;
  isDeleted: boolean;
  ctime: string;
  mtime: string;
}

// ============ 用户行为 ============
export interface DocUserActivity {
  id: string;
  documentId: string;
  docId: string;
  username: string;
  lastViewedAt: string | null;
  visitCount: number;
  lastEditedAt: string | null;
  isDeleted: boolean;
  ctime: string;
  mtime: string;
}

// ============ Strapi 响应格式 ============
export interface StrapiSingleResponse<T> {
  data: T | null;
  meta: Record<string, unknown>;
}

export interface StrapiListResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiErrorResponse {
  data: null;
  error: {
    status: number;
    name: string;
    message: string;
    details: Record<string, unknown>;
  };
}

// ============ API 响应格式 ============
export interface ApiSuccessResponse<T = unknown> {
  code: 0;
  message: string;
  data: T;
}

export interface ApiPaginatedResponse<T = unknown> {
  code: 0;
  message: string;
  data: {
    list: T[];
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface ApiErrorResponse {
  code: number;
  message: string;
}

// ============ 权限申请相关 ============
export type AccessRequestType = 'SPACE' | 'DOC';
export type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AccessRequest {
  id: string;
  documentId: string;
  type: AccessRequestType;
  targetId: string; // spaceId or docId
  username: string;
  requestedPerm: string;
  reason: string;
  status: AccessRequestStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  isDeleted: boolean;
  ctime: string;
  mtime: string;
}

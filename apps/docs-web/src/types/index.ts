// ============ 用户相关 ============
export interface UserInfo {
  username: string;
  department?: string;
  deptId?: string;
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
  // 权限字段（API返回）
  hasSpaceAuth?: boolean; // 用户是否在 user-space-auth 表中
}

// 最近访问的文档
export interface RecentDoc {
  id: string;
  documentId: string;
  title: string;
  spaceId: string;
  folderId: string;
  mtime: string;
  lastViewedAt: string;
  spaceName?: string; // 跨空间时有值
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
  replies?: Comment[];
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

export interface DocSpaceBinding {
  spaceId: string;
  spaceName?: string;
  folderId: string;
  folderName?: string;
  perm?: DocPerm;
  isPrimary: boolean;
}

// ============ 树形结构 ============
export interface TreeNode {
  key: string;
  title: string;
  type: 'folder' | 'doc';
  data: Folder | Doc;
  children?: TreeNode[];
  isLeaf?: boolean;
}

// ============ API 响应格式 ============
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedData<T = unknown> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T = unknown> {
  code: number;
  message: string;
  data: PaginatedData<T>;
}

// ============ 表单相关 ============
export interface CreateSpaceForm {
  name: string;
  codeName: string;
  icon?: string;
}

export interface CreateDocForm {
  spaceId: string;
  folderId?: string;
  title: string;
  content?: string;
  accessMode?: AccessMode;
}

export interface CreateFolderForm {
  name: string;
  parentId?: string;
  visibilityScope?: 'ALL' | 'DEPT_ONLY';
}

export interface SpaceMemberForm {
  username: string;
  canRead?: boolean;
  canCreateFolder?: boolean;
  canCreateDoc?: boolean;
  superAdmin?: boolean;
}

export interface DocMemberForm {
  username: string;
  perm: DocPerm;
}

// ============ 权限申请相关 ============
export type AccessRequestType = 'SPACE' | 'DOC';
export type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AccessRequest {
  id: string;
  documentId: string;
  type: AccessRequestType;
  targetId: string;
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

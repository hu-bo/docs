// API Response Types
export interface APIResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

// User Types
export interface UserInfo {
  name: string;
  nick_name?: string;
  avatar: string;
  dept_id: number;
  workcode: string
}

// Space Types
export type SpaceType = 1 | 2; // 1=公共空间, 2=个人空间

export interface Space {
  id: number;
  documentId: string;
  name: string;
  codeName: string;
  creator: string;
  icon: string;
  datasetId: string;
  spaceType: SpaceType;
  isDeleted: boolean;
  ctime: string;
  mtime: string;
}

export type FolderVisibility = 'ALL' | 'DEPT_ONLY';

export interface Folder {
  id: string;
  documentId: string;
  spaceId: string;
  parentId: string;
  name: string;
  visibilityScope: FolderVisibility;
  order: number;
  isDeleted: boolean;
  ctime: string;
  mtime: string;
}

// Document Types
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
  hasSpaceAuth?: boolean;
}

export interface RecentDoc {
  id: string;
  documentId: string;
  title: string;
  spaceId: string;
  folderId: string;
  mtime: string;
  lastViewedAt: string;
  spaceName?: string;
}

// Permission Types
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
  ctime: string;
  mtime: string;
}

export interface DocUserAcl {
  id: string;
  documentId: string;
  docId: string;
  username: string;
  perm: DocPerm;
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

// Access Request Types
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
  ctime: string;
  mtime: string;
}

// Comment Types
export interface Comment {
  id: string;
  documentId: string;
  docId: string;
  parentId: string | null;
  username: string;
  content: string;
  isDeleted: boolean;
  ctime: string;
  mtime: string;
  replies?: Comment[];
  userInfo?: UserInfo;
}

// Tree Node Types
export interface TreeNode {
  key: string;
  title: string;
  type: 'folder' | 'doc';
  data: Folder | Doc;
  children?: TreeNode[];
  isLeaf?: boolean;
}

// Collaboration Types
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface CollaborationUser {
  username: string;
  displayName?: string;
  avatar?: string;
  color: string;
}

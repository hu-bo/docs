import { logger } from '../utils/logger.js';
import * as strapiService from './strapi.js';
import type { Doc, UserSpaceAuth, DocUserAcl } from '../types/index.js';

// ============ 空间权限检查 ============

/**
 * 获取用户在某空间的权限
 */
export async function getUserSpaceAuth(
  spaceId: string,
  username: string
): Promise<UserSpaceAuth | null> {
  const result = await strapiService.getUserSpaceAuths({
    'filters[spaceId][$eq]': spaceId,
    'filters[username][$eq]': username,
  });
  return result.data.length > 0 ? result.data[0] : null;
}

/**
 * 检查用户是否是空间的超级管理员
 */
export async function isSpaceSuperAdmin(spaceId: string, username: string): Promise<boolean> {
  const auth = await getUserSpaceAuth(spaceId, username);
  return auth?.superAdmin === true;
}

/**
 * 检查用户是否有空间读取权限
 */
export async function canReadSpace(spaceId: string, username: string): Promise<boolean> {
  const auth = await getUserSpaceAuth(spaceId, username);
  // 默认所有用户可读
  return auth?.canRead !== false;
}

/**
 * 检查用户是否可以创建文件夹
 */
export async function canCreateFolder(spaceId: string, username: string): Promise<boolean> {
  const auth = await getUserSpaceAuth(spaceId, username);
  if (!auth) return false;
  return auth.superAdmin || auth.canCreateFolder;
}

/**
 * 检查用户是否可以创建文档
 */
export async function canCreateDoc(spaceId: string, username: string): Promise<boolean> {
  const auth = await getUserSpaceAuth(spaceId, username);
  if (!auth) return false;
  return auth.superAdmin || auth.canCreateDoc;
}

// ============ 文档权限检查 ============

/**
 * 获取用户对某文档的权限
 */
export async function getDocUserAcl(
  docId: string,
  username: string
): Promise<DocUserAcl | null> {
  const result = await strapiService.getDocUserAcls({
    'filters[docId][$eq]': docId,
    'filters[username][$eq]': username,
  });
  return result.data.length > 0 ? result.data[0] : null;
}

/**
 * 检查用户是否可以查看文档
 * - 非白名单文档：所有人可读
 * - 白名单文档：需要 doc_user_acl 记录或 owner/super_admin 身份
 */
export async function canViewDoc(doc: Doc, username: string): Promise<boolean> {
  // 检查是否是文档所有者
  if (doc.owner === username) {
    return true;
  }
  // 检查是否是空间超级管理员
  const isSuperAdmin = await isSpaceSuperAdmin(doc.spaceId, username);
  if (isSuperAdmin) {
    return true;
  }
  console.log(doc.accessMode);
  // 非白名单文档，所有人可读
  if (doc.accessMode !== 'WHITELIST_ONLY') {
    return true;
  }

  // 白名单文档，检查 doc_user_acl
  const acl = await getDocUserAcl(doc.id, username);
  return acl !== null;
}

/**
 * 检查用户是否可以编辑文档
 * - OPEN_EDIT：所有人可编辑
 * - OPEN_READONLY：doc_user_acl.perm=EDIT 或 owner 或 super_admin
 * - WHITELIST_ONLY：doc_user_acl.perm=EDIT 或 owner 或 super_admin
 */
export async function canEditDoc(doc: Doc, username: string): Promise<boolean> {
  // 检查是否是文档所有者
  if (doc.owner === username) {
    return true;
  }

  // 检查是否是空间超级管理员
  if (await isSpaceSuperAdmin(doc.spaceId, username)) {
    return true;
  }

  // OPEN_EDIT 模式，所有人可编辑
  if (doc.accessMode === 'OPEN_EDIT') {
    return true;
  }

  // OPEN_READONLY 或 WHITELIST_ONLY，检查 doc_user_acl
  const acl = await getDocUserAcl(doc.id, username);
  return acl?.perm === 'EDIT';
}

/**
 * 检查用户是否是文档所有者
 */
export function isDocOwner(doc: Doc, username: string): boolean {
  return doc.owner === username;
}

// ============ 评论权限检查 ============

/**
 * 检查用户是否可以删除/修改评论（只有作者可以）
 */
export function isCommentAuthor(commentUsername: string, username: string): boolean {
  return commentUsername === username;
}

// ============ 部门权限初始化（预留） ============

/**
 * 初始化部门用户权限（预留空方法）
 * 用于同部门用户自动初始化权限
 */
export async function initDeptUserPermission(
  _spaceId: string,
  _username: string,
  _deptId?: string
): Promise<void> {
  // TODO: 实现部门权限初始化逻辑
  logger.debug('[Permission] initDeptUserPermission - not implemented');
}

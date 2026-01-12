import { getDataSource } from "../config/dataSource";
import { Space } from "../entities/Space";
import { UserSpaceAuth } from "../entities/UserSpaceAuth";
import { Doc, AccessMode } from "../entities/Doc";
import { DocUserAcl, DocPerm } from "../entities/DocUserAcl";
import { DocSpaceAcl, DocSpacePerm } from "../entities/DocSpaceAcl";
import { SpaceFolder, VisibilityScope } from "../entities/SpaceFolder";
import { SpaceType } from "../types/index";

export interface SpacePermission {
    canRead: boolean;
    canCreateFolder: boolean;
    canCreateDoc: boolean;
    isSuperAdmin: boolean;
}

export interface DocPermission {
    canRead: boolean;
    canEdit: boolean;
    isOwner: boolean;
    isSuperAdmin: boolean;
}

/**
 * Permission Service - 权限检查逻辑
 */
export class PermissionService {
    /**
     * 获取用户在空间的权限（同时返回空间信息）
     */
    async getSpacePermission(params: {
        username: string;
        spaceId?: string;
        space?: Space | null;
    }): Promise<SpacePermission> {
        const ds = getDataSource();

        // 获取空间信息
        if (!params.space) {
            params.space = await ds.getRepository(Space).findOne({
                where: { documentId: params.spaceId, isDeleted: 0 },
            });
        }
        if (!params.space) {
            return {
                canRead: false,
                canCreateFolder: false,
                canCreateDoc: false,
                isSuperAdmin: false,
            };
        }

        // 个人空间只有创建者能访问
        if (params.space.spaceType === SpaceType.PERSONAL) {
            const isCreator = params.space.creator === params.username;
            return {
                canRead: isCreator,
                canCreateFolder: isCreator,
                canCreateDoc: isCreator,
                isSuperAdmin: isCreator,
            };
        }

        // 社区空间 - 所有人都能读
        const auth = await ds.getRepository(UserSpaceAuth).findOne({
            where: { spaceId: params.space.documentId, username: params.username },
        });

        if (auth) {
            return {
                canRead: auth.canRead === 1,
                canCreateFolder: auth.canCreateFolder === 1,
                canCreateDoc: auth.canCreateDoc === 1,
                isSuperAdmin: auth.superAdmin === 1,
            };
        }

        // 社区空间默认可读
        return {
            canRead: true,
            canCreateFolder: false,
            canCreateDoc: false,
            isSuperAdmin: false,
        };
    }

    /**
     * 检查用户是否是空间超级管理员
     */
    async isSpaceSuperAdmin(username: string, spaceId: string): Promise<boolean> {
        const perm = await this.getSpacePermission({ username, spaceId });
        return perm.isSuperAdmin;
    }

    /**
     * 获取用户对文档的权限
     * @param params.username - 用户名
     * @param params.docId - 文档ID（如果未传入 doc 对象则必须）
     * @param params.doc - 已查询的文档对象（可选，避免重复查询）
     */
    async getDocPermission(params: {
        username: string;
        docId?: string;
        doc?: Doc | null;
    }): Promise<DocPermission> {
        const ds = getDataSource();

        // 获取文档信息
        if (!params.doc && params.docId) {
            params.doc = await ds.getRepository(Doc).findOne({
                where: { documentId: params.docId, isDeleted: 0 },
            });
        }

        if (!params.doc) {
            return {
                canRead: false,
                canEdit: false,
                isOwner: false,
                isSuperAdmin: false,
            };
        }

        const doc = params.doc;
        const docId = doc.documentId;
        const username = params.username;
        const isOwner = doc.owner === username;

        // 检查是否是文档所在空间的super_admin
        // 使用 relations 一次性加载关联的 space
        const docSpaceAcls = await ds.getRepository(DocSpaceAcl).find({
            where: { docId },
            relations: ['space'],
        });

        const spaceIds = docSpaceAcls.map(acl => acl.spaceId);
        let isSuperAdmin = false;

        if (spaceIds.length > 0) {
            // 一次性查询用户在所有相关空间的权限
            const userSpaceAuths = await ds.getRepository(UserSpaceAuth).find({
                where: spaceIds.map(spaceId => ({ spaceId, username, superAdmin: 1 })),
            });
            isSuperAdmin = userSpaceAuths.length > 0;
        }

        // Owner 和 superAdmin 都有完全权限
        if (isOwner || isSuperAdmin) {
            return { canRead: true, canEdit: true, isOwner, isSuperAdmin };
        }

        // 根据 access_mode 判断
        switch (doc.accessMode) {
            case AccessMode.OPEN_EDIT:
                // 所有人可编辑
                return {
                    canRead: true,
                    canEdit: true,
                    isOwner: false,
                    isSuperAdmin: false,
                };

            case AccessMode.OPEN_READONLY:
                // 默认只读，检查 doc_user_acl 和 doc_space_acl 是否有 EDIT 权限
                const hasUserEditPerm = await this.checkDocUserPerm(
                    username,
                    docId,
                    DocPerm.EDIT,
                );
                const hasSpaceEditPerm = await this.checkDocSpacePerm(
                    username,
                    docId,
                    DocSpacePerm.EDIT,
                );
                return {
                    canRead: true,
                    canEdit: hasUserEditPerm || hasSpaceEditPerm,
                    isOwner: false,
                    isSuperAdmin: false,
                };

            case AccessMode.WHITELIST_ONLY:
                // 私密文档，需要白名单权限
                const userAcl = await ds.getRepository(DocUserAcl).findOne({
                    where: { docId, username },
                });
                const hasSpaceReadPerm = await this.checkDocSpacePerm(
                    username,
                    docId,
                    DocSpacePerm.READ,
                );

                if (userAcl) {
                    return {
                        canRead: true,
                        canEdit: userAcl.perm === DocPerm.EDIT,
                        isOwner: false,
                        isSuperAdmin: false,
                    };
                }

                if (hasSpaceReadPerm) {
                    const hasSpaceEdit = await this.checkDocSpacePerm(
                        username,
                        docId,
                        DocSpacePerm.EDIT,
                    );
                    return {
                        canRead: true,
                        canEdit: hasSpaceEdit,
                        isOwner: false,
                        isSuperAdmin: false,
                    };
                }

                return {
                    canRead: false,
                    canEdit: false,
                    isOwner: false,
                    isSuperAdmin: false,
                };

            default:
                return {
                    canRead: false,
                    canEdit: false,
                    isOwner: false,
                    isSuperAdmin: false,
                };
        }
    }

    /**
     * 检查用户在 doc_user_acl 中的权限
     */
    private async checkDocUserPerm(
        username: string,
        docId: string,
        minPerm: DocPerm,
    ): Promise<boolean> {
        const ds = getDataSource();
        const acl = await ds.getRepository(DocUserAcl).findOne({
            where: { docId, username },
        });

        if (!acl) return false;

        if (minPerm === DocPerm.READ) {
            return true; // READ or EDIT both satisfy READ requirement
        }

        return acl.perm === DocPerm.EDIT;
    }

    /**
     * 检查用户通过 doc_space_acl 获得的权限
     * 需要同时在 user_space_auth 中有记录
     */
    private async checkDocSpacePerm(
        username: string,
        docId: string,
        minPerm: DocSpacePerm,
    ): Promise<boolean> {
        const ds = getDataSource();

        const docSpaceAcls = await ds.getRepository(DocSpaceAcl).find({
            where: { docId },
        });

        if (docSpaceAcls.length === 0) {
            return false;
        }

        const spaceIds = docSpaceAcls.map(acl => acl.spaceId);

        // 一次性查询用户在所有相关空间的权限
        const userSpaceAuths = await ds.getRepository(UserSpaceAuth).find({
            where: spaceIds.map(spaceId => ({ spaceId, username })),
        });

        // 构建 spaceId -> auth 映射
        const authMap = new Map(userSpaceAuths.map(auth => [auth.spaceId, auth]));

        for (const acl of docSpaceAcls) {
            const userAuth = authMap.get(acl.spaceId);
            if (!userAuth) continue;

            if (minPerm === DocSpacePerm.READ) {
                return true; // Any perm satisfies READ
            }

            if (acl.perm === DocSpacePerm.EDIT) {
                return true;
            }
        }

        return false;
    }

    /**
     * 检查目录可见性
     */
    async canViewFolder(username: string, folderId: string): Promise<boolean> {
        if (folderId === "0") return true; // 根目录始终可见

        const ds = getDataSource();
        const folder = await ds.getRepository(SpaceFolder).findOne({
            where: { documentId: folderId },
        });

        if (!folder) return false;

        // ALL 可见性：对空间内所有可读用户可见
        if (folder.visibilityScope === VisibilityScope.ALL) {
            const spacePerm = await this.getSpacePermission({
                username,
                spaceId: folder.spaceId,
            });
            return spacePerm.canRead;
        }

        // DEPT_ONLY：仅当用户在该空间存在 user_space_auth 记录时可见
        const auth = await ds.getRepository(UserSpaceAuth).findOne({
            where: { spaceId: folder.spaceId, username },
        });

        return !!auth;
    }

    /**
     * 获取用户可见的目录ID列表
     */
    async getVisibleFolderIds(
        username: string,
        spaceId: string,
    ): Promise<string[]> {
        const ds = getDataSource();

        // 检查用户是否在空间有权限记录
        const userSpaceAuth = await ds.getRepository(UserSpaceAuth).findOne({
            where: { spaceId, username },
        });

        const folders = await ds.getRepository(SpaceFolder).find({
            where: { spaceId },
        });

        const visibleIds: string[] = [""]; // 根目录始终可见

        for (const folder of folders) {
            if (folder.visibilityScope === VisibilityScope.ALL) {
                visibleIds.push(folder.documentId);
            } else if (
                folder.visibilityScope === VisibilityScope.DEPT_ONLY &&
                userSpaceAuth
            ) {
                visibleIds.push(folder.documentId);
            }
        }

        return visibleIds;
    }

    /**
     * 检查是否是文档所有者或空间超管
     */
    async isDocOwnerOrSuperAdmin(
        username: string,
        docId: string,
    ): Promise<boolean> {
        const perm = await this.getDocPermission({ username, docId });
        return perm.isOwner || perm.isSuperAdmin;
    }
}

export const permissionService = new PermissionService();

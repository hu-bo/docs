import { getDataSource } from '../config/dataSource'
import { strapiClient } from '../tools/strapi/strapiClient'
import { AccessRequest, AccessRequestType, AccessRequestStatus } from '../entities/AccessRequest'
import { Doc } from '../entities/Doc'
import { DocUserAcl, DocPerm } from '../entities/DocUserAcl'

export interface ApplyAccessInput {
    type: string
    targetId: string
    requestedPerm?: string
    reason?: string
    username: string
}

export interface AccessRequestWithDoc extends AccessRequest {
    doc?: { id: string; title: string; owner: string } | null
}

export interface HasPendingRequestInput {
    type: AccessRequestType
    targetId: string
    username: string
}

export interface HasDocAclInput {
    docId: string
    username: string
}

export interface GetPendingRequestsInput {
    docIds: string[]
    page: number
    pageSize: number
}

export interface ApproveRequestInput {
    request: AccessRequest
    approved: boolean
    perm: string | undefined
    reviewedBy: string
}

class AccessRequestService {
    /**
     * 获取文档
     */
    async getDocById(docId: string): Promise<Doc | null> {
        const ds = getDataSource()
        return ds.getRepository(Doc).findOne({
            where: { documentId: docId, isDeleted: 0 }
        })
    }

    /**
     * 检查是否有待审批的申请
     */
    async hasPendingRequest(input: HasPendingRequestInput): Promise<boolean> {
        const { type, targetId, username } = input
        const ds = getDataSource()
        const existing = await ds.getRepository(AccessRequest).findOne({
            where: {
                type,
                targetId,
                username,
                status: AccessRequestStatus.PENDING
            }
        })
        return !!existing
    }

    /**
     * 检查用户是否已有文档权限
     */
    async hasDocAcl(input: HasDocAclInput): Promise<boolean> {
        const { docId, username } = input
        const ds = getDataSource()
        const existing = await ds.getRepository(DocUserAcl).findOne({
            where: { docId, username }
        })
        return !!existing
    }

    /**
     * 创建权限申请
     */
    async createAccessRequest(input: ApplyAccessInput): Promise<AccessRequest> {
        const { username } = input
        const ds = getDataSource()

        // 通过 Strapi 创建权限申请
        const result = await strapiClient.create<AccessRequest>('access-requests', {
            type: AccessRequestType.DOC,
            targetId: input.targetId,
            username,
            requestedPerm: input.requestedPerm || 'READ',
            reason: input.reason || null,
            status: AccessRequestStatus.PENDING
        })

        // 重新查询获取完整数据
        const request = await ds.getRepository(AccessRequest).findOne({
            where: { documentId: result.data.documentId }
        })

        return request!
    }

    /**
     * 获取用户创建的文档ID列表
     */
    async getUserDocIds(username: string): Promise<string[]> {
        const ds = getDataSource()
        const myDocs = await ds.getRepository(Doc).find({
            where: { owner: username, isDeleted: 0 },
            select: ['documentId']
        })
        return myDocs.map(d => d.documentId)
    }

    /**
     * 获取待审批申请列表
     */
    async getPendingRequests(input: GetPendingRequestsInput): Promise<{ requests: AccessRequestWithDoc[]; total: number }> {
        const { docIds, page, pageSize } = input
        const ds = getDataSource()

        // 使用 relations 一次性加载关联的 targetDoc
        const qb = ds.getRepository(AccessRequest).createQueryBuilder('ar')
            .leftJoinAndSelect('ar.targetDoc', 'targetDoc')
            .where('ar.type = :type', { type: AccessRequestType.DOC })
            .andWhere('ar.target_id IN (:...docIds)', { docIds })
            .andWhere('ar.status = :status', { status: AccessRequestStatus.PENDING })
            .orderBy('ar.ctime', 'DESC')
            .skip((page - 1) * pageSize)
            .take(pageSize)

        const [requests, total] = await qb.getManyAndCount()

        const requestsWithDoc: AccessRequestWithDoc[] = requests.map(req => ({
            ...req,
            doc: req.targetDoc ? {
                id: req.targetDoc.documentId,
                title: req.targetDoc.title,
                owner: req.targetDoc.owner
            } : null
        }))

        return { requests: requestsWithDoc, total }
    }

    /**
     * 获取权限申请
     */
    async getAccessRequestById(requestId: string): Promise<AccessRequest | null> {
        const ds = getDataSource()
        return ds.getRepository(AccessRequest).findOne({
            where: { documentId: requestId }
        })
    }

    /**
     * 审批权限申请
     */
    async approveRequest(input: ApproveRequestInput): Promise<AccessRequest> {
        const { request, approved, perm, reviewedBy } = input
        const ds = getDataSource()

        if (approved && request.type === AccessRequestType.DOC) {
            const finalPerm = (perm || request.requestedPerm || 'READ') as DocPerm
            // 通过 Strapi 创建文档用户ACL
            await strapiClient.create<DocUserAcl>('doc-user-acls', {
                docId: request.targetId,
                username: request.username,
                perm: finalPerm
            })
        }

        const newStatus = approved ? AccessRequestStatus.APPROVED : AccessRequestStatus.REJECTED
        const reviewedAt = new Date().toISOString()

        // 通过 Strapi 更新申请状态
        await strapiClient.update<AccessRequest>('access-requests', request.documentId, {
            status: newStatus,
            reviewedBy,
            reviewedAt
        })

        // 重新查询获取完整数据
        const updatedRequest = await ds.getRepository(AccessRequest).findOne({
            where: { id: request.id }
        })

        return updatedRequest!
    }
}

export const accessRequestService = new AccessRequestService()

import { getDataSource } from '../config/dataSource'
import { strapiClient } from '../tools/strapi/strapiClient'
import { Comment } from '../entities/Comment'

export interface CommentWithReplies extends Comment {
    replies?: Comment[]
}

export interface CreateCommentInput {
    docId: string
    parentId: string
    content: string
    username: string
}

export interface GetDocCommentsInput {
    documentId: string
    page: number
    pageSize: number
}

export interface GetParentCommentInput {
    parentId: string
    docId: string
}

class CommentService {
    /**
     * 获取文档顶级评论（带分页和回复）
     */
    async getDocComments(input: GetDocCommentsInput): Promise<{ comments: CommentWithReplies[]; total: number }> {
        const { documentId, page, pageSize } = input
        const ds = getDataSource()

        const [topLevelComments, total] = await ds.getRepository(Comment).findAndCount({
            where: { docId: documentId, parentId: '' },
            order: { ctime: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize
        })

        const commentsWithReplies: CommentWithReplies[] = await Promise.all(
            topLevelComments.map(async (comment) => {
                const replies = await ds.getRepository(Comment).find({
                    where: { parentId: comment.documentId },
                    order: { ctime: 'ASC' }
                })
                return {
                    ...comment,
                    replies
                }
            })
        )

        return { comments: commentsWithReplies, total }
    }

    /**
     * 获取父评论
     */
    async getParentComment(input: GetParentCommentInput): Promise<Comment | null> {
        const { parentId, docId } = input
        const ds = getDataSource()
        return ds.getRepository(Comment).findOne({
            where: { documentId: parentId, docId }
        })
    }

    /**
     * 创建评论
     */
    async createComment(input: CreateCommentInput): Promise<Comment> {
        const { username } = input
        const ds = getDataSource()

        // 通过 Strapi 创建评论
        const result = await strapiClient.create<Comment>('comments', {
            docId: input.docId,
            parentId: input.parentId || '',
            username,
            content: input.content
        })

        // 重新查询获取完整数据
        const comment = await ds.getRepository(Comment).findOne({
            where: { documentId: result.data.documentId }
        })

        return comment!
    }

    /**
     * 获取评论
     */
    async getCommentById(commentId: string): Promise<Comment | null> {
        const ds = getDataSource()
        return ds.getRepository(Comment).findOne({
            where: { documentId: commentId }
        })
    }

    /**
     * 更新评论
     */
    async updateComment(commentId: string, content: string): Promise<Comment | null> {
        const ds = getDataSource()
        const comment = await ds.getRepository(Comment).findOne({
            where: { documentId: commentId }
        })

        if (!comment) {
            return null
        }

        // 通过 Strapi 更新
        await strapiClient.update<Comment>('comments', comment.documentId, { content })

        // 重新查询获取完整数据
        const updatedComment = await ds.getRepository(Comment).findOne({
            where: { documentId: commentId }
        })
        return updatedComment
    }

    /**
     * 删除评论及其回复（软删除）
     */
    async deleteComment(commentId: string): Promise<void> {
        const ds = getDataSource()

        // 先查找要删除的评论
        const comment = await ds.getRepository(Comment).findOne({
            where: { documentId: commentId }
        })

        if (comment) {
            // 查找所有回复
            const replies = await ds.getRepository(Comment).find({
                where: { parentId: commentId }
            })

            // 通过 Strapi 软删除所有回复
            for (const reply of replies) {
                await strapiClient.delete('comments', reply.documentId)
            }

            // 通过 Strapi 软删除主评论
            await strapiClient.delete('comments', comment.documentId)
        }
    }
}

export const commentService = new CommentService()

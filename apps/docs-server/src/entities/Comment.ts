import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'

@Entity('comment')
export class Comment {
    @PrimaryGeneratedColumn('increment', { type: 'bigint', unsigned: true })
    id: number

    @CreateDateColumn({
        type: 'datetime',
        comment: '创建时间'
    })
    ctime: Date

    @Index('IDX_mtime')
    @UpdateDateColumn({
        type: 'datetime',
        comment: '修改时间'
    })
    mtime: Date

    @Column({ name: 'document_id', type: 'varchar', length: 128 })
    documentId: string

    @Index('IDX_doc_id')
    @Column({ name: 'doc_id', type: 'bigint' })
    docId: string

    @Index('IDX_parent_id')
    @Column({ name: 'parent_id', type: 'bigint', default: 0, comment: '父评论ID，0表示顶级评论' })
    parentId: string

    @Column({ type: 'varchar', length: 128 })
    username: string

    @Column({ type: 'text' })
    content: string

    @Column({ name: 'is_deleted', type: 'tinyint', default: 0 })
    isDeleted: number
}

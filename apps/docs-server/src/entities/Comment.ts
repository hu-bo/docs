import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, OneToMany, JoinColumn } from 'typeorm'
import { Doc } from './Doc'

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

    @ManyToOne(() => Doc)
    @JoinColumn({ name: 'doc_id', referencedColumnName: 'documentId' })
    doc: Doc

    @Index('IDX_parent_id')
    @Column({ name: 'parent_id', type: 'bigint', default: 0, comment: '父评论ID，0表示顶级评论' })
    parentId: string

    @ManyToOne(() => Comment, comment => comment.replies)
    @JoinColumn({ name: 'parent_id', referencedColumnName: 'documentId' })
    parent: Comment

    @OneToMany(() => Comment, comment => comment.parent)
    replies: Comment[]

    @Column({ type: 'varchar', length: 128 })
    username: string

    @Column({ type: 'text' })
    content: string

}

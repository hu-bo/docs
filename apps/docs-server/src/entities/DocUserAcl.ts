import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, Unique, ManyToOne, JoinColumn } from 'typeorm'
import { Doc } from './Doc'

export enum DocPerm {
    READ = 'READ',
    EDIT = 'EDIT'
}

@Entity('doc_user_acl')
@Unique('UK_doc_user', ['docId', 'username'])
export class DocUserAcl {
    @PrimaryGeneratedColumn('increment', { type: 'bigint', unsigned: true })
    id: number

    @CreateDateColumn({
        type: 'datetime',
        comment: '创建时间',
        select: false
    })
    ctime: Date

    @Index('IDX_mtime')
    @UpdateDateColumn({
        type: 'datetime',
        comment: '修改时间',
        select: false
    })
    mtime: Date

    @Index('IDX_space_id')
@Column({ name: 'document_id', type: 'varchar', length: 128, comment: 'strapi 生成' })
    documentId: string

    @Column({ name: 'doc_id', type: 'bigint', default: '' })
    docId: string

    @ManyToOne(() => Doc)
    @JoinColumn({ name: 'doc_id', referencedColumnName: 'documentId' })
    doc: Doc

    @Column({ type: 'varchar', length: 128 })
    username: string

    @Column({ type: 'enum', enum: DocPerm })
    perm: DocPerm
}

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm'
import moment from 'moment'

export enum DocSpacePerm {
    READ = 'READ',
    EDIT = 'EDIT'
}

@Entity('doc_space_acl')
@Unique('UK_doc_space', ['docId', 'spaceId'])
export class DocSpaceAcl {
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

    @Column({ name: 'document_id', type: 'varchar', length: 128 })
    documentId: string

    @Column({ name: 'doc_id', type: 'bigint', default: '' })
    docId: string

    @Column({ name: 'space_id', type: 'bigint', default: '' })
    spaceId: string

    @Column({ type: 'enum', enum: DocSpacePerm })
    perm: DocSpacePerm
}

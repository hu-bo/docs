import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'

@Entity('doc_folder')
export class DocFolder {
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
    @Column({ name: 'doc_id', type: 'varchar', length: 128 })
    docId: string

    @Index('IDX_folder_id')
    @Column({ name: 'folder_id', type: 'varchar', length: 128 })
    folderId: string
}

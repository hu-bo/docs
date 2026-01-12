import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm'
import { Doc } from './Doc'
import { SpaceFolder } from './SpaceFolder'

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

    @ManyToOne(() => Doc)
    @JoinColumn({ name: 'doc_id', referencedColumnName: 'documentId' })
    doc: Doc

    @Index('IDX_folder_id')
    @Column({ name: 'folder_id', type: 'varchar', length: 128 })
    folderId: string

    @ManyToOne(() => SpaceFolder)
    @JoinColumn({ name: 'folder_id', referencedColumnName: 'documentId' })
    folder: SpaceFolder
}

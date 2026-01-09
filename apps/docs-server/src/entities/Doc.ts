import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'


export enum AccessMode {
    OPEN_EDIT = 'OPEN_EDIT',
    OPEN_READONLY = 'OPEN_READONLY',
    WHITELIST_ONLY = 'WHITELIST_ONLY'
}

@Entity('doc')
export class Doc {
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

    @Column({ name: 'is_deleted', type: 'tinyint', default: 0 })
    isDeleted: number

    @Column({ name: 'document_id', type: 'varchar', length: 128 })
    documentId: string

    @Column({ type: 'varchar', length: 128, default: '' })
    title: string

    @Column({ type: 'longtext' })
    content: string

    @Column({ name: 'access_mode', type: 'enum', enum: AccessMode, default: AccessMode.OPEN_READONLY })
    accessMode: AccessMode

    @Column({ type: 'varchar', length: 64 })
    owner: string

    @Column({ type: 'varchar', length: 512, default: '' })
    tags: string
}

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, In } from 'typeorm'

export enum VisibilityScope {
    ALL = 'ALL',
    DEPT_ONLY = 'DEPT_ONLY'
}

@Entity('space_folder')
export class SpaceFolder {
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

    @Column({ name: 'document_id', type: 'varchar', length: 128, comment: 'strapi 生成' })
    documentId: string

    @Index('IDX_space_id')
    @Column({ name: 'space_id', type: 'varchar' })
    spaceId: string

    @Index('IDX_parent_id')
    @Column({ name: 'parent_id', type: 'varchar', default: '0' })
    parentId: string

    @Column({ type: 'varchar', length: 128 })
    name: string

    @Column({ name: 'visibility_scope', type: 'enum', enum: VisibilityScope, default: VisibilityScope.ALL })
    visibilityScope: VisibilityScope

    @Column({ type: 'int', default: 0 })
    order: number

    @Column({ name: 'is_deleted', type: 'tinyint', default: 0 })
    isDeleted: number
}

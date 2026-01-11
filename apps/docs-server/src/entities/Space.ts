import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'
import moment from 'moment'

@Entity('space')
export class Space {
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

    @Index('IDX_space_id')
@Column({ name: 'document_id', type: 'varchar', length: 128, comment: 'strapi 生成' })
    documentId: string

    @Column({ type: 'varchar', length: 128 })
    name: string

    @Column({ name: 'code_name', type: 'varchar', length: 128 })
    codeName: string

    @Column({ type: 'varchar', length: 128 })
    creator: string

    @Column({ type: 'varchar', length: 255, default: '' })
    icon: string

    @Column({ name: 'dataset_id', type: 'varchar', length: 255, default: '' })
    datasetId: string

    @Column({ name: 'space_type', type: 'int', default: 0 })
    spaceType: number


    // @Column({ name: 'created_by_id', type: 'bigint', unsigned: true, default: 0, comment: 'strapi字段', select: false })
    // createdById: number

    // @Column({ name: 'updated_by_id', type: 'bigint', unsigned: true, default: 0, comment: 'strapi字段', select: false })
    // updatedById: number

    // @Column({ name: 'created_at',  comment: 'strapi字段', select: false })
    // createdAt: Date

    // @Column({ name: 'updated_at',  comment: 'strapi字段', select: false })
    // updatedAt: Date

    // @Column({ name: 'locale', default: '', comment: 'strapi字段', select: false })
    // locale: string
}

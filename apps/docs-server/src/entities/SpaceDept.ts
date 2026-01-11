import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm'

@Entity('space_dept')
@Unique('UK_space_dept', ['spaceId', 'deptId'])
export class SpaceDept {
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

    @Index('IDX_space_id')
@Column({ name: 'document_id', type: 'varchar', length: 128, comment: 'strapi 生成' })
    documentId: string

    @Column({ name: 'space_id', type: 'varchar', length: 128, default: '' })
    spaceId: string

    @Column({ name: 'dept_id', type: 'varchar', length: 32, default: '' })
    deptId: string
}

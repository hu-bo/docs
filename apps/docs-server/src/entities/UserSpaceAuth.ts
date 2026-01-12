import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, Unique, ManyToOne, JoinColumn } from 'typeorm'
import { Space } from './Space'

export enum AuthSource {
    AUTO_INIT = 'AUTO_INIT',
    MANUAL = 'MANUAL'
}

@Entity('user_space_auth')
@Unique('UK_space_user', ['spaceId', 'username'])
export class UserSpaceAuth {
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

    @Column({ name: 'space_id', type: 'bigint', default: '' })
    spaceId: string

    @ManyToOne(() => Space)
    @JoinColumn({ name: 'space_id', referencedColumnName: 'documentId' })
    space: Space

    @Column({ type: 'varchar', length: 128 })
    username: string

    @Column({ name: 'can_read', type: 'tinyint', default: 1 })
    canRead: number

    @Column({ name: 'can_create_folder', type: 'tinyint', default: 0 })
    canCreateFolder: number

    @Column({ name: 'can_create_doc', type: 'tinyint', default: 0 })
    canCreateDoc: number

    @Column({ name: 'super_admin', type: 'tinyint', default: 0 })
    superAdmin: number

    @Column({ type: 'enum', enum: AuthSource, default: AuthSource.MANUAL })
    source: AuthSource
}

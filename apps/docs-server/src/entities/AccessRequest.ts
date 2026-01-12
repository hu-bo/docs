import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm'
import moment from 'moment'
import { Doc } from './Doc'

export enum AccessRequestType {
    SPACE = 'SPACE',
    DOC = 'DOC'
}

export enum AccessRequestStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

@Entity('access_request')
export class AccessRequest {
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

    @Index('IDX_target')
    @Column({ type: 'enum', enum: AccessRequestType })
    type: AccessRequestType

    @Column({ name: 'target_id', type: 'varchar', length: 128, default: '' })
    targetId: string

    @ManyToOne(() => Doc)
    @JoinColumn({ name: 'target_id', referencedColumnName: 'documentId' })
    targetDoc: Doc

    @Index('IDX_username')
    @Column({ type: 'varchar', length: 128 })
    username: string

    @Column({ name: 'requested_perm', type: 'varchar', length: 64, nullable: true })
    requestedPerm: string | null

    @Column({ type: 'text', nullable: true })
    reason: string | null

    @Column({ type: 'enum', enum: AccessRequestStatus, default: AccessRequestStatus.PENDING })
    status: AccessRequestStatus

    @Column({ name: 'reviewed_by', type: 'varchar', length: 128, nullable: true })
    reviewedBy: string | null

    @Column({
        name: 'reviewed_at',
        type: 'datetime',
        precision: 6,
        nullable: true,
        transformer: {
            to: (value: string) => value,
            from: (value: Date) => value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null
        }
    })
    reviewedAt: Date | null
}

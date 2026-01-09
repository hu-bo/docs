import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm'
import moment from 'moment'

@Entity('doc_user_activity')
@Unique('UK_doc_user', ['docId', 'username'])
export class DocUserActivity {
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

    @Column({ name: 'doc_id', type: 'bigint', default: '0' })
    docId: string

    @Column({ type: 'varchar', length: 64, default: '' })
    username: string

    @Column({
        name: 'last_viewed_at',
        type: 'datetime',
        nullable: true,
        transformer: {
            to: (value: string) => value,
            from: (value: Date) => value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null
        }
    })
    lastViewedAt: Date | null

    @Column({ name: 'visit_count', type: 'int', unsigned: true, default: 0 })
    visitCount: number

    @Column({
        name: 'last_edited_at',
        type: 'datetime',
        nullable: true,
        transformer: {
            to: (value: string) => value,
            from: (value: Date) => value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null
        }
    })
    lastEditedAt: Date | null
}

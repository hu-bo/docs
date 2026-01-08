import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn, Index, UpdateDateColumn } from 'typeorm'
import moment from 'moment'

@Entity('ai_research_message')
export class ResearchMessage {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Index()
    @Column({ name: 'request_id' })
    requestId: string

    @Column()
    topic?: string

    @Column({ default: '' })
    status: string

    @Column({ type: 'text' })
    content?: string

    @Column({ name: 'agent_reasoning', type: 'text' })
    agentReasoning?: string

    @Column({ name: 'plan', type: 'text' })
    plan?: string

    @Column({ name: 'used_tools', type: 'text' })
    usedTools?: string

    @Column({ name: 'mcp_sources', type: 'text' })
    mcpSources?: string

    @Column({ type: 'text' })
    artifacts?: string

    @Column()
    username?: string

    @CreateDateColumn({
        type: 'datetime',
        update: false,
        transformer: {
            to: (value: string) => value,
            from: (value: Date) => moment(value).format('YYYY-MM-DD HH:mm:ss')
        }
    })
    ctime: Date

    @UpdateDateColumn({
        type: 'datetime',
        update: false,
        transformer: {
            to: (value: string) => value,
            from: (value: Date) => moment(value).format('YYYY-MM-DD HH:mm:ss')
        }
    })
    mtime: Date
}

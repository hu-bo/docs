import dotenv from 'dotenv'
import type { MCPBinding } from '../types'
import path from 'node:path'

dotenv.config({path: path.resolve(__dirname, '../../.env')})

const toNumber = (value: string | undefined, fallback: number) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
}

export const env = {
    port: toNumber(process.env.DEEPAGENTS_PORT, 3000),
    model: process.env.DEEPAGENTS_MODEL || 'claude-4.5-sonnet-messages',
    tavilyApiKey: process.env.TAVILY_API_KEY || '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',
    confCenter: {
        appName: 'live.ant.ai-copilot-api',
        deployEnv: (process.env.DEPLOY_ENV || 'uat') as 'uat' | 'pre' | 'prod',
        token: process.env.PALADIN_TOKEN || 'e9f39defbc1e8620aefd704610821192',
        zone: process.env.ZONE || 'sh001',
        group: process.env.PALADIN_GROUP || 'default',
        auth: {
            account: 'mlive_root',
            uatToken: '7257acbc729ac31fda2c2bdcc3a8d170',
            prodToken: '3c806e3f7b390bf4b7ef116322940baf'
        }
    },
    wx: {
        corpId: process.env.WX_CORP_ID || '',
        agentId: process.env.WX_AGENT_ID || '1000608',
        secret: process.env.WX_AGENT_SECRET || ''
    },
    baike: {
        // 默认百科数据集ID，可通过环境变量覆盖
        defaultDatasetId: 'da732654140566231431',
        topK: toNumber(process.env.BAIKE_TOP_K, 30),
        scoreThreshold: Number(process.env.BAIKE_SCORE_THRESHOLD || '0.5'),
        retrievalMode: (process.env.BAIKE_RETRIEVAL_MODE || 'mixed') as 'mixed' | 'vector' | 'fulltext'
    },
    defaultMcpBindings: [
        {
            id: 'bilibili-web-search',
            name: 'bilibili_web_search',
            description: '通过B站MCP提供的联网搜索服务检索公开信息',
            serverConfig: { url: 'https://mcp.bilibili.co/web_search/mcp' }
        }
    ] as MCPBinding[]
}

import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { beatsVectorQuery, getBaiKes } from './api'

interface BaiKeSearchConfig {
    datasetId: string
    topK?: number
    scoreThreshold?: number
    retrievalMode?: 'mixed' | 'vector' | 'fulltext'
}

/**
 * BaiKeSearch 工具：用于搜索百科知识库内容
 * 支持向量搜索、全文搜索和混合搜索模式
 */
export function createBaiKeSearchTool(config: BaiKeSearchConfig) {
    const { datasetId, topK = 30, scoreThreshold = 0.5, retrievalMode = 'mixed' } = config

    const schema = z.object({
        query: z.string().describe('搜索关键词或问题')
    })

    // 确定检索配置
    const vectorSearchEnable = retrievalMode === 'mixed' || retrievalMode === 'vector'
    const fullTextSearchEnable = retrievalMode === 'mixed' || retrievalMode === 'fulltext'

    return (tool as any)(
        async ({ query }: z.infer<typeof schema>) => {
            if (!query) {
                return '请提供搜索关键词'
            }

            try {
                // 1. 向量检索
                const results = await beatsVectorQuery({
                    dataset_id: datasetId,
                    query,
                    retrieval_config: {
                        top_k: topK,
                        vector_search: {
                            enable: vectorSearchEnable,
                            ...(vectorSearchEnable ? { score_threshold: scoreThreshold } : {})
                        },
                        full_text_search: {
                            enable: fullTextSearchEnable
                        }
                    }
                })

                if (!results || results.length === 0) {
                    return '未找到任何与之相关的内容'
                }

                // 2. 获取知识库ID列表（去重）
                const knowledgeIds: string[] = Array.from(new Set(results.map((item) => item.knowledgeId)))

                // 3. 获取百科摘要信息
                const baiKeResp = await getBaiKes({
                    knIds: knowledgeIds.join(','),
                    fields: 'tapd_id,copilot_knowledge_id,ctime,creator'
                })

                if (baiKeResp.code !== 0) {
                    return '获取百科摘要信息失败，请稍后重试'
                }

                // 4. 合并结果
                const baiKeKnowledges = results.map((item) => {
                    const knowledge = baiKeResp.data.find((kn) => kn.copilot_knowledge_id === item.knowledgeId)
                    return {
                        tapd_id: knowledge?.tapd_id || '',
                        content: item.content,
                        ctime: knowledge?.ctime || '',
                        creator: knowledge?.creator_nick || '',
                        score: item.score
                    }
                })

                // 5. 格式化输出
                let txt = ''
                for (const kn of baiKeKnowledges) {
                    txt += `id: ${kn.tapd_id} \n`
                    txt += `${kn.content} \n`
                    txt += `创建时间： ${kn.ctime} \n`
                    txt += `负责人：${kn.creator} \n`
                    txt += `相似度：${(kn.score * 100).toFixed(1)}% \n`
                    txt += `\n----DOCUMENT_PREFIX----\n`
                }

                return txt || '未找到任何与之相关的内容'
            } catch (error) {
                console.error('[BaiKeSearchTool] Error:', error)
                return '搜索百科时发生错误，请稍后重试'
            }
        },
        {
            name: 'baike_search',
            description: `搜索百科知识库内容，返回tapd文档摘要和id。数据集ID: ${datasetId}，检索模式: ${retrievalMode}（mixed=混合，vector=语义，fulltext=关键词）`,
            schema
        }
    )
}

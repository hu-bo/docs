import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { getBaiKes } from './api.js'

/**
 * BaiKeDetail 工具：用于获取百科知识库文档的详情内容
 * 调用时填入百科知识库的文档 id
 */
export function createBaiKeDetailTool() {
    const schema = z.object({
        ids: z.string().describe('填入文档id，多个id用逗号分隔')
    })

    return (tool as any)(
        async ({ ids }: z.infer<typeof schema>) => {
            if (!ids) {
                return '请提供文档ID'
            }

            try {
                const res = await getBaiKes({ ids, fields: 'tapd_name,content,creator,ctime' })

                if (res.code !== 0) {
                    return '获取百科详情失败，请稍后重试'
                }

                let txt = ''
                for (const result of res.data) {
                    txt += `标题: ${result.tapd_name} \n`
                    txt += `创建时间: ${result.ctime} \n`
                    txt += `创建人：${result.creator_nick || ''} \n`
                    // content是一个markdown格式的文本，删除markdown里的图片链接和http开头的jpg/png图片链接
                    const content = result.content.replace(/!\[.*?\]\(.*?\)/g, '').replace(/https?:\/\/\S+\.(jpg|png)/gi, '')
                    txt += `详细内容: ${content} \n`
                    txt += `\n`
                }

                return txt || '未找到相关文档'
            } catch (error) {
                console.error('[BaiKeDetailTool] Error:', error)
                return '获取百科详情时发生错误，请稍后重试'
            }
        },
        {
            name: 'baike_detail',
            description: '用于获取百科知识库文档的详情内容，调用时填入百科知识库的文档id（可以从 baike_search 工具的返回结果中获取）',
            schema
        }
    )
}

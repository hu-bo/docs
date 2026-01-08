export interface BaiKeSummaryResponse {
    code: number
    data: BaiKeSummaryContent[]
}

export interface BaiKeSummaryContent {
    tapd_id: string
    tapd_name: string
    content: string
    content_summary: string
    ctime: string
    related_pages: string
    prod_owner_nick: string
    tech_owner_nick: string
    creator_nick: string
    updater_nick: string
    copilot_knowledge_id: string
}

export interface BeatsVectorQueryParams {
    dataset_id: string
    query: string
    retrieval_config: {
        top_k: number
        vector_search: {
            enable: boolean
            score_threshold?: number
        }
        full_text_search: {
            enable: boolean
        }
    }
}

interface BeatsVectorQueryItem {
    content: string
    filename: string
    knowledgeId: string
    location: string
    score: number
    segmentId: string
    sliceId: string
}

interface BeatsVectorQueryResponse {
    data: BeatsVectorQueryItem[]
    code: number
    message: string
}

/**
 * 根据文档 ID 获取百科详情
 */
export async function getBaiKes({ ids, knIds, fields }: { ids?: string; knIds?: string; fields: string }): Promise<BaiKeSummaryResponse> {
    if (!ids && !knIds) {
        throw new Error('请至少提供 ids 或 knIds 之一')
    }

    const apiUrl = `http://api.mlive.bilibili.co/baike/encyclopedia/searchByIds?${ids ? `ids=${ids}` : ''}${
        knIds ? `&knIds=${knIds}` : ''
    }&fields=${fields}`

    try {
        const res = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })

        const data: BaiKeSummaryResponse = (await res.json()) as BaiKeSummaryResponse
        if (!data?.data) throw new Error('Error searching BaiKe, please try again later')

        return data
    } catch (e) {
        throw new Error('Error searching BaiKe, please try again later')
    }
}

/**
 * 向量检索百科内容
 */
export async function beatsVectorQuery(body: BeatsVectorQueryParams): Promise<BeatsVectorQueryItem[]> {
    let url = 'http://copilot.bilibili.co/api/knowledge/beats/query'

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })

    if (res.status !== 200) {
        throw new Error(`Beats Vector Query Error: ${res.status} ${res.statusText}`)
    }

    const data: BeatsVectorQueryResponse = (await res.json()) as BeatsVectorQueryResponse
    if (data.code !== 0) {
        throw new Error(`${data.code} ${data.message}`)
    }

    return data.data
}

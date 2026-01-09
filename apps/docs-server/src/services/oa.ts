/**
 * OA Service - 对接 B站 OA 用户信息接口
 */
import type { Request } from 'express'
import { OAUserInfo } from "../types/index"


const OA_BASE_URL = 'https://api-mlive.bilibili.co'

interface OAUserResponse {
    code: number
    data: OAUserInfo
    message: string
}

class OAService {
    /**
     * 获取 OA 用户信息
     * @param cookie 用户 cookie，用于鉴权
     */
    async getUserInfo(req: Request): Promise<OAUserInfo | null> {
        try {
            const cookie = req.headers.cookie || ''
            const response = await fetch(`${OA_BASE_URL}/base/oa/user`, {
                method: 'GET',
                headers: {
                    'Cookie': cookie,
                    'Content-Type': 'application/json'
                }
            })

            const result = await response.json() as OAUserResponse

            if (result.code !== 0) {
                console.error('OA getUserInfo failed:', result.message)
                return null
            }

            // 转换为驼峰命名
            return result.data
        } catch (error) {
            console.error('OA getUserInfo error:', error)
            return null
        }
    }
}

export const oaService = new OAService()

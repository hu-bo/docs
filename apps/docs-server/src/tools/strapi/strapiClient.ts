import axios, { AxiosInstance, AxiosError } from 'axios'
import { strapi } from '../../config/strapi'

export interface StrapiResponse<T = unknown> {
    data: T
    meta?: {
        pagination?: {
            page: number
            pageSize: number
            pageCount: number
            total: number
        }
    }
}

export interface StrapiValidationErrorDetail {
    path: string[]
    message: string
    name: string
}

export interface StrapiErrorResponse {
    data: null
    error: {
        status: number
        name: string
        message: string
        details?: {
            errors?: StrapiValidationErrorDetail[]
        } | unknown
    }
}

export interface StrapiRecord {
    id: number
    documentId: string
    createdAt?: string
    updatedAt?: string
    [key: string]: any
}

/**
 * 从 details 中提取详细错误信息
 */
function extractDetailedMessage(message: string, details?: unknown): string {
    if (!details || typeof details !== 'object') {
        return message
    }

    const detailsObj = details as { errors?: StrapiValidationErrorDetail[] }
    if (!Array.isArray(detailsObj.errors) || detailsObj.errors.length === 0) {
        return message
    }

    const errorMessages = detailsObj.errors.map((err) => {
        const path = err.path?.join('.') || ''
        return path ? `${path}: ${err.message}` : err.message
    })

    return `${message}: ${errorMessages.join('; ')}`
}

/**
 * Strapi 自定义错误类
 */
export class StrapiError extends Error {
    public readonly status: number
    public readonly errorName: string
    public readonly details?: unknown

    constructor(status: number, name: string, message: string, details?: unknown) {
        // 展开 ValidationError 的详细信息
        const detailedMessage = extractDetailedMessage(message, details)
        super(detailedMessage)
        this.name = 'StrapiError'
        this.status = status
        this.errorName = name
        this.details = details
        Object.setPrototypeOf(this, StrapiError.prototype)
    }

    toJSON() {
        return {
            status: this.status,
            name: this.errorName,
            message: this.message,
            details: this.details
        }
    }
}

class StrapiClient {
    private client: AxiosInstance

    constructor() {
        this.client = axios.create({
            baseURL: strapi.baseUrl,
            headers: {
                Authorization: `Bearer ${strapi.apiToken}`,
                'Content-Type': 'application/json',
            },
        })
    }

    /**
     * 处理 Axios 错误，提取 Strapi 错误信息并抛出 StrapiError
     */
    private handleError(error: unknown): never {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<StrapiErrorResponse>
            const strapiError = axiosError.response?.data?.error
            console.error(axiosError.request.path, axiosError.response?.data)
            if (strapiError) {
                throw new StrapiError(
                    strapiError.status,
                    strapiError.name,
                    strapiError.message,
                    strapiError.details
                )
            }

            // 没有 Strapi 错误格式，使用 HTTP 状态码
            throw new StrapiError(
                axiosError.response?.status || 500,
                'NetworkError',
                axiosError.message || 'Unknown network error'
            )
        }

        // 非 Axios 错误
        if (error instanceof Error) {
            throw new StrapiError(500, 'UnknownError', error.message)
        }

        throw new StrapiError(500, 'UnknownError', 'An unknown error occurred')
    }

    /**
     * 创建记录
     */
    async create<T extends StrapiRecord>(
        endpoint: string,
        data: Record<string, unknown>
    ): Promise<StrapiResponse<T>> {
        try {
            const response = await this.client.post<StrapiResponse<T>>(
                `/api/${endpoint}`,
                { data }
            )
            return response.data
        } catch (error) {
            this.handleError(error)
        }
    }

    /**
     * 更新记录（通过 documentId）
     */
    async update<T extends StrapiRecord>(
        endpoint: string,
        documentId: string,
        data: Record<string, unknown>
    ): Promise<StrapiResponse<T>> {
        try {
            const response = await this.client.put<StrapiResponse<T>>(
                `/api/${endpoint}/${documentId}`,
                { data }
            )
            return response.data
        } catch (error) {
            this.handleError(error)
        }
    }

    /**
     * 删除记录（通过 documentId）
     */
    async delete(endpoint: string, documentId: string): Promise<void> {
        try {
            await this.client.delete(`/api/${endpoint}/${documentId}`)
        } catch (error) {
            this.handleError(error)
        }
    }

    /**
     * 获取单条记录（通过 documentId）
     */
    async findOne<T extends StrapiRecord>(
        endpoint: string,
        documentId: string
    ): Promise<StrapiResponse<T>> {
        try {
            const response = await this.client.get<StrapiResponse<T>>(
                `/api/${endpoint}/${documentId}`
            )
            return response.data
        } catch (error) {
            this.handleError(error)
        }
    }

    /**
     * 获取列表
     */
    async findMany<T extends StrapiRecord>(
        endpoint: string,
        params?: {
            filters?: Record<string, unknown>
            sort?: string | string[]
            pagination?: { page?: number; pageSize?: number }
            fields?: string[]
        }
    ): Promise<StrapiResponse<T[]>> {
        try {
            const response = await this.client.get<StrapiResponse<T[]>>(
                `/api/${endpoint}`,
                { params: this.buildQueryParams(params) }
            )
            return response.data
        } catch (error) {
            this.handleError(error)
        }
    }

    /**
     * 通过过滤条件查找单条记录
     */
    async findOneByFilters<T extends StrapiRecord>(
        endpoint: string,
        filters: Record<string, unknown>
    ): Promise<T | null> {
        const response = await this.findMany<T>(endpoint, {
            filters,
            pagination: { pageSize: 1 }
        })
        return response.data.length > 0 ? response.data[0] : null
    }

    /**
     * 构建 Strapi 查询参数
     */
    private buildQueryParams(params?: {
        filters?: Record<string, unknown>
        sort?: string | string[]
        pagination?: { page?: number; pageSize?: number }
        fields?: string[]
    }): Record<string, unknown> {
        if (!params) return {}

        const queryParams: Record<string, unknown> = {}

        if (params.filters) {
            queryParams.filters = params.filters
        }

        if (params.sort) {
            queryParams.sort = params.sort
        }

        if (params.pagination) {
            queryParams.pagination = params.pagination
        }

        if (params.fields) {
            queryParams.fields = params.fields
        }

        return queryParams
    }
}

export const strapiClient = new StrapiClient()

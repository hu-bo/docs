import type { Response } from 'express'
import { ZodError } from 'zod'
import { ResponseCode, type ApiResponse, type PaginatedData } from '../types/index'

/**
 * Send success response
 */
export function successResponse<T>(res: Response, data?: T, message = 'success'): void {
    const response: ApiResponse<T> = {
        code: ResponseCode.SUCCESS,
        message,
        data
    }
    res.json(response)
}

/**
 * controllers 统一错误处理函数
 * 优先处理 ZodError（参数验证错误），然后处理其他错误
 */
export function errorResponse(res: Response, err: unknown): void {
    // Zod 验证错误
    if (err instanceof ZodError) {
        const issues = err.issues || []
        if (issues.length > 0) {
            const messages = issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
            return badRequest(res, `参数验证失败: ${messages}`)
        }
        return badRequest(res, `参数验证失败: ${err.message}`)
    }

    // 其他错误
    const message = err instanceof Error ? err.message : '服务器内部错误'
    return internalError(res, process.env.NODE_ENV === 'production' ? '服务器内部错误' : message)
}

/**
 * Send error response
 */
export function errorRes(res: Response, code: ResponseCode, message: string): void {
    res.status(200).json({
        code,
        message
    })
}

/**
 * Send paginated response
 */
export function paginated<T>(
    res: Response,
    list: T[],
    total: number,
    page: number,
    pageSize: number,
    message = 'success'
): void {
    const data: PaginatedData<T> = {
        list,
        total,
        page,
        pageSize
    }
    const response: ApiResponse<PaginatedData<T>> = {
        code: ResponseCode.SUCCESS,
        message,
        data
    }
    res.json(response)
}

/**
 * Send bad request response (400)
 */
export function badRequest(res: Response, message = '请求参数错误'): void {
    errorRes(res, ResponseCode.BAD_REQUEST, message)
}

/**
 * Send unauthorized response (401)
 */
export function unauthorized(res: Response, message = '未认证'): void {
    errorRes(res, ResponseCode.UNAUTHORIZED, message)
}

/**
 * Send forbidden response (403)
 */
export function forbidden(res: Response, message = '无权限'): void {
    errorRes(res, ResponseCode.FORBIDDEN, message)
}

/**
 * Send not found response (404)
 */
export function notFound(res: Response, message = '资源不存在'): void {
    errorRes(res, ResponseCode.NOT_FOUND, message)
}

/**
 * Send internal error response (500)
 */
export function internalError(res: Response, message = '服务器内部错误'): void {
    errorRes(res, ResponseCode.INTERNAL_ERROR, message)
}


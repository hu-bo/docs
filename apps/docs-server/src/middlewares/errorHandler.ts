import type { Request, Response, NextFunction } from 'express'
import { internalError } from '../utils/response'
import moment from 'moment'
import { opsLogger } from '../utils/biliLogger'

/**
 * Global error handler middleware
 */
export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    console.error(`[${moment().format('HH:mm:ss')}][server]: Unhandled error: `, err)
    opsLogger.error('UnhandledError', {
        msg: err.message,
        path: req.path,
        method: req.method,
        params: req.params,
        query: req.query,
        username: req.cookies['username'],
        stack: err.stack
    })

    // Default internal error
    return internalError(res, err.message || '服务器内部错误')
}

/**
 * Not found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({
        code: 404,
        message: `Cannot ${req.method} ${req.path}`
    })
}

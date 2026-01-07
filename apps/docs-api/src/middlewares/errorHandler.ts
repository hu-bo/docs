import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { config } from '../app-config/index.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: number;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const code = err.code || statusCode;

  logger.error(`[Error] ${err.message}`, err.stack);

  // 生产环境不暴露详细错误信息
  const message = config.env === 'production' && statusCode === 500
    ? '服务器内部错误'
    : err.message || '服务器内部错误';

  res.status(statusCode).json({
    code,
    message,
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
  });
}

export function createError(message: string, statusCode = 500, code?: number): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code || statusCode;
  return error;
}

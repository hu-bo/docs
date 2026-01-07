import type { Response } from 'express';

export function success<T>(res: Response, data: T, message = 'success'): void {
  res.json({
    code: 0,
    message,
    data,
  });
}

export function paginated<T>(
  res: Response,
  list: T[],
  total: number,
  page: number,
  pageSize: number,
  message = 'success'
): void {
  res.json({
    code: 0,
    message,
    data: {
      list,
      total,
      page,
      pageSize,
    },
  });
}

export function badRequest(res: Response, message = '请求参数错误'): void {
  res.status(400).json({
    code: 400,
    message,
  });
}

export function unauthorized(res: Response, message = '未认证'): void {
  res.status(401).json({
    code: 401,
    message,
  });
}

export function forbidden(res: Response, message = '无权限'): void {
  res.status(403).json({
    code: 403,
    message,
  });
}

export function notFound(res: Response, message = '资源不存在'): void {
  res.status(404).json({
    code: 404,
    message,
  });
}

export function serverError(res: Response, message = '服务器内部错误'): void {
  res.status(500).json({
    code: 500,
    message,
  });
}

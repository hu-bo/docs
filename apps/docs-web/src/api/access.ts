import request from './request';
import type { AccessRequest, PaginatedData } from '@/types';

// 申请权限
export function applyAccess(data: { type: 'space' | 'doc'; targetId: string; requestedPerm: string; reason?: string }) {
  return request.post('/access/apply', data);
}

// 获取待审批申请
export function getPendingRequests(params?: { page?: number; pageSize?: number }) {
  return request.get<PaginatedData<AccessRequest>>('/access/pending-requests', { params });
}

// 审批申请
export function approveAccess(data: { requestId: string; approved: boolean }) {
  return request.put('/access/approve', data);
}


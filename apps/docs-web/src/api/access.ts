import request from './request';
import type { AccessRequest, PageResult } from '@/types';

export function applyAccess(data: {
  type: 'SPACE' | 'DOC';
  targetId: string;
  requestedPerm: string;
  reason: string;
}) {
  return request<void>({ method: 'POST', url: '/access/apply', data });
}

export function getPendingRequests(params?: any) {
  return request<PageResult<AccessRequest>>({ method: 'GET', url: '/access/pending-requests', params });
}

export function approveAccess(data: { requestId: string; status: 'APPROVED' | 'REJECTED' }) {
  return request<void>({ method: 'PUT', url: '/access/approve', data });
}

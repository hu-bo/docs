import request from './request';
import type { AccessRequest, PageResult } from '@/types';

export function applyAccess(data: {
  type: 'SPACE' | 'DOC';
  targetId: string;
  requestedPerm: string;
  reason: string;
}) {
  return request.post('/access/apply', data);
}

export function getPendingRequests(params?: any) {
  return request.get<any, PageResult<AccessRequest>>('/access/pending-requests', { params });
}

export function approveAccess(data: { requestId: string; status: 'APPROVED' | 'REJECTED' }) {
  return request.put('/access/approve', data);
}

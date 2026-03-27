import {
  approveImpersonation,
  cancelImpersonationRequest,
  createImpersonationRequest,
  enterTenant,
  exitTenant,
  getImpersonationRequest,
  getImpersonationApprovers,
  listImpersonationHistory,
  listMyImpersonationRequests,
  listPendingImpersonation,
  rejectImpersonation,
  terminateSession,
} from './impersonation';
import { request } from '@umijs/max';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

describe('platform impersonation service', () => {
  beforeEach(() => {
    (request as jest.Mock).mockReset();
  });

  it('normalizes impersonation create, list, enter, pending and approver responses', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({ data: { id: 'req-1', tenant_id: 'tenant-1' } })
      .mockResolvedValueOnce({ data: [{ id: 'req-1', status: 'pending' }], total: 5 })
      .mockResolvedValueOnce({ data: { id: 'req-1', status: 'active' } })
      .mockResolvedValueOnce({ data: [{ id: 'req-2', status: 'pending' }] })
      .mockResolvedValueOnce({ data: [{ id: 'req-3', status: 'approved' }], total: 2 })
      .mockResolvedValueOnce({ data: [{ id: 'approver-1', user_id: 'user-1' }] });

    await expect(createImpersonationRequest({
      tenant_id: 'tenant-1',
      duration_minutes: 30,
    })).resolves.toEqual({ id: 'req-1', tenant_id: 'tenant-1' });
    await expect(listMyImpersonationRequests({ page: 1, page_size: 10 })).resolves.toEqual({
      data: [{ id: 'req-1', status: 'pending' }],
      total: 5,
      page: 1,
      page_size: 1,
    });
    await expect(enterTenant('req-1')).resolves.toEqual({ id: 'req-1', status: 'active' });
    await expect(listPendingImpersonation()).resolves.toEqual([{ id: 'req-2', status: 'pending' }]);
    await expect(listImpersonationHistory({ page: 1, page_size: 10 })).resolves.toEqual({
      data: [{ id: 'req-3', status: 'approved' }],
      total: 2,
      page: 1,
      page_size: 1,
    });
    await expect(getImpersonationApprovers()).resolves.toEqual([{ id: 'approver-1', user_id: 'user-1' }]);
  });

  it('passes filters and decision payloads to impersonation endpoints', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({ data: [], total: 0 })
      .mockResolvedValueOnce({ data: [], total: 0 })
      .mockResolvedValueOnce({ message: 'approved' })
      .mockResolvedValueOnce({ message: 'rejected' });

    await listMyImpersonationRequests({
      page: 1,
      page_size: 10,
      requester_name: 'alice',
      status: 'pending',
      sort_by: 'created_at',
      sort_order: 'asc',
    });
    await listImpersonationHistory({
      page: 2,
      page_size: 20,
      reason: 'debug',
      status: 'approved',
    });
    await approveImpersonation('req-1', { comment: 'ok' });
    await rejectImpersonation('req-2', { comment: 'deny' });

    expect(request).toHaveBeenNthCalledWith(1, '/api/v1/platform/impersonation/requests', {
      method: 'GET',
      params: {
        page: 1,
        page_size: 10,
        requester_name: 'alice',
        status: 'pending',
        sort_by: 'created_at',
        sort_order: 'asc',
      },
    });
    expect(request).toHaveBeenNthCalledWith(2, '/api/v1/tenant/impersonation/history', {
      method: 'GET',
      params: {
        page: 2,
        page_size: 20,
        reason: 'debug',
        status: 'approved',
      },
    });
    expect(request).toHaveBeenNthCalledWith(3, '/api/v1/tenant/impersonation/req-1/approve', {
      method: 'POST',
      data: { comment: 'ok' },
    });
    expect(request).toHaveBeenNthCalledWith(4, '/api/v1/tenant/impersonation/req-2/reject', {
      method: 'POST',
      data: { comment: 'deny' },
    });
  });

  it('requests impersonation detail and session lifecycle endpoints with the expected contracts', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({ data: { id: 'req-9', status: 'approved' } })
      .mockResolvedValueOnce({ message: 'exited' })
      .mockResolvedValueOnce({ message: 'terminated' })
      .mockResolvedValueOnce({ message: 'cancelled' });

    await expect(getImpersonationRequest('req-9')).resolves.toEqual({ id: 'req-9', status: 'approved' });
    await exitTenant('req-9');
    await terminateSession('req-9');
    await cancelImpersonationRequest('req-9');

    expect(request).toHaveBeenNthCalledWith(1, '/api/v1/platform/impersonation/requests/req-9', {
      method: 'GET',
    });
    expect(request).toHaveBeenNthCalledWith(2, '/api/v1/platform/impersonation/requests/req-9/exit', {
      method: 'POST',
    });
    expect(request).toHaveBeenNthCalledWith(3, '/api/v1/platform/impersonation/requests/req-9/terminate', {
      method: 'POST',
    });
    expect(request).toHaveBeenNthCalledWith(4, '/api/v1/platform/impersonation/requests/req-9/cancel', {
      method: 'POST',
    });
  });
});

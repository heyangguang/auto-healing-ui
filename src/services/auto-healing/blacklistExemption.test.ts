import {
  approveBlacklistExemption,
  createBlacklistExemption,
  getBlacklistExemption,
  getBlacklistExemptions,
  getPendingExemptions,
  rejectBlacklistExemption,
} from './blacklistExemption';
import { request } from '@umijs/max';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

describe('auto-healing blacklistExemption service', () => {
  it('normalizes list, detail, create and pending exemption responses', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({ data: [{ id: 'ex-1', task_name: 'task' }], total: 4 })
      .mockResolvedValueOnce({ data: { id: 'ex-1', task_name: 'task' } })
      .mockResolvedValueOnce({ data: { id: 'ex-2', task_name: 'task-2' } })
      .mockResolvedValueOnce({ data: [{ id: 'ex-3', status: 'pending' }], total: 1 });

    await expect(getBlacklistExemptions({ page: 1, page_size: 20 })).resolves.toEqual({
      data: [{ id: 'ex-1', task_name: 'task' }],
      total: 4,
      page: 1,
      page_size: 1,
    });
    await expect(getBlacklistExemption('ex-1')).resolves.toEqual({ id: 'ex-1', task_name: 'task' });
    await expect(createBlacklistExemption({
      task_id: 'task-2',
      task_name: 'task-2',
      rule_id: 'rule-2',
      rule_name: 'rule-2',
      rule_severity: 'high',
      rule_pattern: 'rm -rf',
      reason: 'ops',
      validity_days: 3,
    })).resolves.toEqual({ id: 'ex-2', task_name: 'task-2' });
    await expect(getPendingExemptions()).resolves.toEqual({
      data: [{ id: 'ex-3', status: 'pending' }],
      total: 1,
      page: 1,
      page_size: 1,
    });
  });

  it('forwards exemption approval mutations', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({ message: 'approved' })
      .mockResolvedValueOnce({ message: 'rejected' });

    await expect(approveBlacklistExemption('ex-9')).resolves.toEqual({ message: 'approved' });
    await expect(rejectBlacklistExemption('ex-9', 'risk')).resolves.toEqual({ message: 'rejected' });

    expect(request).toHaveBeenNthCalledWith(1, '/api/v1/tenant/blacklist-exemptions/ex-9/approve', {
      method: 'POST',
    });
    expect(request).toHaveBeenNthCalledWith(2, '/api/v1/tenant/blacklist-exemptions/ex-9/reject', {
      method: 'POST',
      data: { reject_reason: 'risk' },
    });
  });
});

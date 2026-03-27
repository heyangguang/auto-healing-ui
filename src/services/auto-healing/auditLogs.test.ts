import {
  getAuditLogDetail,
  getAuditLogs,
  getAuditResourceStats,
  getAuditStats,
  getAuditTrend,
  getAuditUserRanking,
} from './auditLogs';
import { request } from '@umijs/max';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

describe('auto-healing auditLogs service', () => {
  it('normalizes audit list, detail and aggregate envelopes', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({ data: { items: [{ id: 'log-1' }], total: 11 } })
      .mockResolvedValueOnce({ data: { id: 'log-1', action: 'create' } })
      .mockResolvedValueOnce({ data: { total_count: 11, success_count: 10 } })
      .mockResolvedValueOnce({ data: { items: [{ date: '2026-03-25', count: 3 }] } })
      .mockResolvedValueOnce({ data: { items: [{ username: 'ops', count: 8 }] } })
      .mockResolvedValueOnce({ data: { items: [{ resource_type: 'flow', count: 4 }] } });

    await expect(getAuditLogs({ page: 1, page_size: 20 })).resolves.toEqual({
      data: [{ id: 'log-1' }],
      total: 11,
      page: 1,
      page_size: 1,
    });
    await expect(getAuditLogDetail('log-1')).resolves.toEqual({ id: 'log-1', action: 'create' });
    await expect(getAuditStats()).resolves.toEqual({ total_count: 11, success_count: 10 });
    await expect(getAuditTrend(7)).resolves.toEqual([{ date: '2026-03-25', count: 3 }]);
    await expect(getAuditUserRanking()).resolves.toEqual([{ username: 'ops', count: 8 }]);
    await expect(getAuditResourceStats()).resolves.toEqual([{ resource_type: 'flow', count: 4 }]);
  });
});

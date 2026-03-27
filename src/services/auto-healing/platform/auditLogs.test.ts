import {
  getPlatformAuditLogDetail,
  getPlatformAuditLogs,
  getPlatformAuditStats,
  getPlatformAuditTrend,
} from './auditLogs';
import { request } from '@umijs/max';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

describe('platform auditLogs service', () => {
  it('normalizes platform audit envelopes', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({ data: [{ id: 'log-1' }], total: 3 })
      .mockResolvedValueOnce({ data: { id: 'log-1', username: 'ops' } })
      .mockResolvedValueOnce({ data: { total_count: 3, success_count: 2 } })
      .mockResolvedValueOnce({ data: { items: [{ date: '2026-03-25', count: 2 }] } });

    await expect(getPlatformAuditLogs({ page: 1, page_size: 20 })).resolves.toEqual({
      data: [{ id: 'log-1' }],
      total: 3,
      page: 1,
      page_size: 1,
    });
    await expect(getPlatformAuditLogDetail('log-1')).resolves.toEqual({ id: 'log-1', username: 'ops' });
    await expect(getPlatformAuditStats()).resolves.toEqual({ total_count: 3, success_count: 2 });
    await expect(getPlatformAuditTrend(7)).resolves.toEqual([{ date: '2026-03-25', count: 2 }]);
  });
});

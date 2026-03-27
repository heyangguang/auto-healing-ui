import {
  batchResetIncidentScan,
  getIncident,
  getIncidentStats,
  getIncidents,
} from './incidents';
import { request } from '@umijs/max';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

describe('auto-healing incidents service', () => {
  it('normalizes handwritten incident responses through adapters', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({
        data: { items: [{ id: 'incident-1' }], total: 5, page: 2, page_size: 20 },
      })
      .mockResolvedValueOnce({ data: { id: 'incident-1', title: 'Disk Full' } })
      .mockResolvedValueOnce({ data: { affected_count: 3, message: 'ok' } })
      .mockResolvedValueOnce({ data: { total: 8, scanned: 5, unscanned: 3, healed: 2 } });

    await expect(getIncidents({ page: 2, page_size: 20 })).resolves.toEqual({
      data: [{ id: 'incident-1' }],
      total: 5,
      page: 2,
      page_size: 20,
    });
    await expect(getIncident('incident-1')).resolves.toEqual({ id: 'incident-1', title: 'Disk Full' });
    await expect(batchResetIncidentScan({ ids: ['incident-1'] })).resolves.toEqual({
      affected_count: 3,
      message: 'ok',
    });
    await expect(getIncidentStats()).resolves.toEqual({
      total: 8,
      scanned: 5,
      unscanned: 3,
      healed: 2,
    });
  });

  it('passes through exact-match and sorting incident query params', async () => {
    (request as jest.Mock).mockResolvedValueOnce({
      data: { items: [], total: 0, page: 1, page_size: 20 },
    });

    await getIncidents({
      page: 1,
      page_size: 20,
      title__exact: 'Disk Full',
      external_id__exact: 'INC-001',
      source_plugin_name__exact: 'itsm',
      scanned: false,
      sort_by: 'created_at',
      sort_order: 'desc',
    });

    expect(request).toHaveBeenLastCalledWith('/api/v1/tenant/incidents', {
      method: 'GET',
      params: {
        page: 1,
        page_size: 20,
        title__exact: 'Disk Full',
        external_id__exact: 'INC-001',
        source_plugin_name__exact: 'itsm',
        scanned: false,
        sort_by: 'created_at',
        sort_order: 'desc',
      },
    });
  });
});

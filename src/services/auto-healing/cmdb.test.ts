import {
  batchEnterMaintenance,
  batchResumeFromMaintenance,
  enterMaintenance,
  getCMDBItemIds,
  getCMDBItems,
  getCMDBMaintenanceLogs,
  resumeFromMaintenance,
} from './cmdb';
import { request } from '@umijs/max';
import {
  getTenantCmdb,
  postTenantCmdbByIdMaintenance,
  postTenantCmdbByIdResume,
} from '@/services/generated/auto-healing/cmdb';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

jest.mock('@/services/generated/auto-healing/cmdb', () => ({
  getTenantCmdb: jest.fn(),
  postTenantCmdbByIdMaintenance: jest.fn(),
  postTenantCmdbByIdResume: jest.fn(),
}));

describe('auto-healing cmdb service', () => {
  it('delegates stable CMDB wrappers to the generated CMDB client', async () => {
    (getTenantCmdb as jest.Mock).mockResolvedValue({
      data: { items: [{ id: 'cmdb-1' }], total: 1, page: 1, page_size: 20 },
    });
    (request as jest.Mock)
      .mockResolvedValueOnce({ data: { items: [{ id: 'light-1' }], total: 1 } })
      .mockResolvedValueOnce({ data: { total: 2, success: 2, failed: 0 } })
      .mockResolvedValueOnce({ data: { total: 2, success: 1, failed: 1 } })
      .mockResolvedValueOnce({ data: { data: [{ id: 'log-1' }], total: 1, page: 1, page_size: 20 } });

    await getCMDBItems({ page: 1, page_size: 20, status: 'active', ip_address: '10.0.0.1' });
    await expect(getCMDBItemIds()).resolves.toEqual([{ id: 'light-1' }]);
    await enterMaintenance('cmdb-1', 'ops window', '2026-03-26T00:00:00Z');
    await resumeFromMaintenance('cmdb-1');
    await expect(batchEnterMaintenance(['cmdb-1', 'cmdb-2'], 'batch')).resolves.toEqual({
      total: 2,
      success: 2,
      failed: 0,
    });
    await expect(batchResumeFromMaintenance(['cmdb-1', 'cmdb-2'])).resolves.toEqual({
      total: 2,
      success: 1,
      failed: 1,
    });
    await expect(getCMDBMaintenanceLogs('cmdb-1')).resolves.toEqual({
      data: [{ id: 'log-1' }],
      total: 1,
      page: 1,
      page_size: 20,
    });

    expect(getTenantCmdb).toHaveBeenCalledWith({
      page: 1,
      page_size: 20,
      status: 'active',
      ip_address: '10.0.0.1',
    });
    expect(postTenantCmdbByIdMaintenance).toHaveBeenCalledWith(
      { id: 'cmdb-1' },
      { reason: 'ops window', end_at: '2026-03-26T00:00:00Z' },
    );
    expect(postTenantCmdbByIdResume).toHaveBeenCalledWith({ id: 'cmdb-1' });
    expect(request).toHaveBeenNthCalledWith(1, '/api/v1/tenant/cmdb/ids', {
      method: 'GET',
      params: undefined,
    });
  });

  it('passes enum and exact-match CMDB query params through service boundaries', async () => {
    (getTenantCmdb as jest.Mock).mockResolvedValue({
      data: { items: [], total: 0, page: 1, page_size: 20 },
    });
    (request as jest.Mock).mockResolvedValueOnce({ data: { items: [], total: 0 } });

    await getCMDBItems({
      page: 1,
      page_size: 20,
      type: 'server',
      status: 'maintenance',
      environment: 'production',
      source_plugin_name__exact: 'cmdb-sync',
    });
    await getCMDBItemIds({
      status: 'maintenance',
      environment: 'production',
    });

    expect(getTenantCmdb).toHaveBeenLastCalledWith({
      page: 1,
      page_size: 20,
      type: 'server',
      status: 'maintenance',
      environment: 'production',
      source_plugin_name__exact: 'cmdb-sync',
    });
    expect(request).toHaveBeenLastCalledWith('/api/v1/tenant/cmdb/ids', {
      method: 'GET',
      params: {
        status: 'maintenance',
        environment: 'production',
      },
    });
  });
});

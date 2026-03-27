import {
  createPlaybook,
  getPlaybook,
  getPlaybookFiles,
  getPlaybookScanLogs,
  getPlaybookStats,
  getPlaybooks,
  scanPlaybook,
  updatePlaybookVariables,
  updatePlaybook,
} from './playbooks';
import { request } from '@umijs/max';
import {
  getTenantPlaybooks,
  postTenantPlaybooksIdScan,
} from '@/services/generated/auto-healing/gitPlaybooks';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

jest.mock('@/services/generated/auto-healing/gitPlaybooks', () => ({
  getTenantPlaybooks: jest.fn(),
  postTenantPlaybooksIdScan: jest.fn(),
}));

describe('auto-healing playbooks service', () => {
  it('normalizes generated playbook list wrappers', async () => {
    (getTenantPlaybooks as jest.Mock).mockResolvedValue({
      data: [{ id: 'playbook-1', name: 'site', status: 'ready' }],
      total: 1,
      page: 2,
      page_size: 50,
    });

    await expect(
      getPlaybooks({ page: 2, page_size: 50, status: 'ready' }),
    ).resolves.toEqual({
      data: [{ id: 'playbook-1', name: 'site', status: 'ready' }],
      total: 1,
      page: 2,
      page_size: 50,
    });

    expect(getTenantPlaybooks).toHaveBeenCalledWith({
      params: { page: 2, page_size: 50, status: 'ready' },
    });
  });

  it('wraps generated playbook scan responses into a stable data envelope', async () => {
    (postTenantPlaybooksIdScan as jest.Mock).mockResolvedValue({
      data: { id: 'scan-1', status: 'success' },
    });

    await expect(
      scanPlaybook('playbook-1', {} as AutoHealing.ScanPlaybookRequest),
    ).resolves.toEqual({
      data: { id: 'scan-1', status: 'success' },
    });

    expect(postTenantPlaybooksIdScan).toHaveBeenCalledWith(
      { id: 'playbook-1' },
      { data: {} },
    );
  });

  it('stabilizes request-based playbook helpers', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({ data: { id: 'playbook-1', name: 'site' } })
      .mockResolvedValueOnce({ data: { id: 'playbook-2', name: 'bootstrap' } })
      .mockResolvedValueOnce({ data: { id: 'playbook-1', name: 'site-v2' } })
      .mockResolvedValueOnce({ data: { id: 'playbook-1', name: 'site-v2', variables: [] } })
      .mockResolvedValueOnce({
        data: {
          items: [{ id: 'scan-1', status: 'success', created_at: '2026-03-26T00:00:00Z' }],
          total: 1,
          page: 1,
          page_size: 10,
        },
      })
      .mockResolvedValueOnce({
        data: { files: [{ path: 'playbooks/site.yml', name: 'site.yml' }] },
      })
      .mockResolvedValueOnce({
        data: {
          total: 3,
          by_status: [{ status: 'ready', count: 2 }],
          by_config_mode: [{ config_mode: 'simple', count: 3 }],
        },
      });

    await expect(getPlaybook('playbook-1')).resolves.toEqual({
      data: { id: 'playbook-1', name: 'site' },
    });
    await expect(createPlaybook({} as AutoHealing.CreatePlaybookRequest)).resolves.toEqual({
      data: { id: 'playbook-2', name: 'bootstrap' },
    });
    await expect(
      updatePlaybook('playbook-1', {} as AutoHealing.UpdatePlaybookRequest),
    ).resolves.toEqual({
      data: { id: 'playbook-1', name: 'site-v2' },
    });
    await expect(
      updatePlaybookVariables('playbook-1', {} as AutoHealing.UpdatePlaybookVariablesRequest),
    ).resolves.toEqual({
      data: { id: 'playbook-1', name: 'site-v2', variables: [] },
    });
    await expect(
      getPlaybookScanLogs('playbook-1', { page: 1, page_size: 10 }),
    ).resolves.toEqual({
      data: [{ id: 'scan-1', status: 'success', created_at: '2026-03-26T00:00:00Z' }],
      total: 1,
      page: 1,
      page_size: 10,
    });
    await expect(getPlaybookFiles('playbook-1')).resolves.toEqual({
      data: { files: [{ path: 'playbooks/site.yml', name: 'site.yml' }] },
    });
    await expect(getPlaybookStats()).resolves.toEqual({
      total: 3,
      by_status: [{ status: 'ready', count: 2 }],
      by_config_mode: [{ config_mode: 'simple', count: 3 }],
    });
  });
});

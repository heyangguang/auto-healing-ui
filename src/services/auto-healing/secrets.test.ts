import {
  createSecretsSource,
    getSecretsSource,
    getSecretsSources,
    getSecretsSourcesStats,
    testSecretsQuery,
  } from './secrets';
import { request } from '@umijs/max';
import {
  getTenantSecretsSources,
  postTenantSecretsSources,
} from '@/services/generated/auto-healing/secrets';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

jest.mock('@/services/generated/auto-healing/secrets', () => ({
  getTenantSecretsSources: jest.fn(),
  postTenantSecretsSources: jest.fn(),
}));

describe('auto-healing secrets service', () => {
  it('normalizes generated secrets list wrappers', async () => {
    (getTenantSecretsSources as jest.Mock).mockResolvedValue({
      data: [{ id: 'secret-1', name: 'prod-vault', status: 'active' }],
      total: 1,
      page: 1,
      page_size: 20,
    });

    await expect(
      getSecretsSources({ page: 1, page_size: 20, status: 'active', is_default: true }),
    ).resolves.toEqual({
      data: [{ id: 'secret-1', name: 'prod-vault', status: 'active' }],
      total: 1,
      page: 1,
      page_size: 20,
    });

    expect(getTenantSecretsSources).toHaveBeenCalledWith({
      page: 1,
      page_size: 20,
      status: 'active',
      is_default: true,
    });
  });

  it('unwraps generated and request-based secrets helpers to stable shapes', async () => {
    (postTenantSecretsSources as jest.Mock).mockResolvedValue({
      data: { id: 'secret-2', name: 'fallback-file' },
    });
    (request as jest.Mock)
      .mockResolvedValueOnce({ data: { id: 'secret-1', name: 'prod-vault', status: 'active' } })
      .mockResolvedValueOnce({
        data: {
          total: 4,
          by_status: [{ status: 'active', count: 3 }],
          by_type: [{ type: 'vault', count: 2 }],
        },
      });

    await expect(getSecretsSource('secret-1')).resolves.toEqual({
      id: 'secret-1',
      name: 'prod-vault',
      status: 'active',
    });
    await expect(
      createSecretsSource({} as AutoHealing.CreateSecretsSourceRequest),
    ).resolves.toEqual({
      id: 'secret-2',
      name: 'fallback-file',
    });
    await expect(getSecretsSourcesStats()).resolves.toEqual({
      total: 4,
      by_status: [{ status: 'active', count: 3 }],
      by_type: [{ type: 'vault', count: 2 }],
    });

    expect(postTenantSecretsSources).toHaveBeenCalledWith({});
  });

  it('unwraps test-query responses to batch results directly', async () => {
    (request as jest.Mock).mockResolvedValue({
      data: {
        success_count: 1,
        fail_count: 0,
        results: [{ hostname: 'host-a', ip_address: '10.0.0.1', success: true, message: 'ok' }],
      },
    });

    await expect(
      testSecretsQuery('secret-3', {
        hosts: [{ hostname: 'host-a', ip_address: '10.0.0.1' }],
      }),
    ).resolves.toEqual({
      success_count: 1,
      fail_count: 0,
      results: [{ hostname: 'host-a', ip_address: '10.0.0.1', success: true, message: 'ok' }],
    });
  });

  it('normalizes single-host test-query responses into batch shape', async () => {
    (request as jest.Mock).mockResolvedValue({
      data: {
        hostname: 'host-b',
        ip_address: '10.0.0.2',
        success: false,
        message: 'auth failed',
      },
    });

    await expect(
      testSecretsQuery('secret-4', {
        hostname: 'host-b',
        ip_address: '10.0.0.2',
      }),
    ).resolves.toEqual({
      success_count: 0,
      fail_count: 1,
      results: [{
        hostname: 'host-b',
        ip_address: '10.0.0.2',
        success: false,
        message: 'auth failed',
      }],
    });
  });
});

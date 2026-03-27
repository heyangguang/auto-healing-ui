import { createSecretsSourceRequestHandler } from './createSecretsSourceRequestHandler';
import { getSecretsSources } from '@/services/auto-healing/secrets';

jest.mock('@/services/auto-healing/secrets', () => ({
  getSecretsSources: jest.fn(),
}));

describe('createSecretsSourceRequestHandler', () => {
  it('maps table search, advanced search and sorter to backend query params', async () => {
    (getSecretsSources as jest.Mock).mockResolvedValue({
      data: [{ id: 'secret-1', name: 'vault-source' }],
      total: 1,
    });

    const handler = createSecretsSourceRequestHandler();
    await expect(
      handler({
        page: 2,
        pageSize: 20,
        searchField: 'name',
        searchValue: 'vault',
        advancedSearch: {
          status: 'active',
          type: 'vault',
          auth_type: 'password',
        },
        sorter: { field: 'created_at', order: 'descend' },
      }),
    ).resolves.toEqual({
      data: [{ id: 'secret-1', name: 'vault-source' }],
      total: 1,
    });

    expect(getSecretsSources).toHaveBeenCalledWith({
      page: 2,
      page_size: 20,
      name: 'vault',
      status: 'active',
      type: 'vault',
      auth_type: 'password',
      sort_by: 'created_at',
      sort_order: 'desc',
    });
  });

  it('falls back to generic search when search field is not name', async () => {
    (getSecretsSources as jest.Mock).mockResolvedValue({
      data: [],
      total: 0,
    });

    const handler = createSecretsSourceRequestHandler();
    await handler({
      page: 1,
      pageSize: 10,
      searchField: 'status',
      searchValue: 'active',
    });

    expect(getSecretsSources).toHaveBeenCalledWith({
      page: 1,
      page_size: 10,
      search: 'active',
    });
  });
});

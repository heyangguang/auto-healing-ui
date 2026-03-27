import {
  createTenant,
  getTenants,
} from './tenants';
import {
  createPlatformUser,
  getPlatformUsers,
} from './users';
import { request } from '@umijs/max';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

describe('platform admin service wrappers', () => {
  it('delegates tenant and platform-user list/create endpoints through request façades', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({ data: [], total: 0 })
      .mockResolvedValueOnce({ data: { id: 'tenant-1', name: 'Tenant A', code: 'tenant-a' } })
      .mockResolvedValueOnce({ data: [], total: 0 })
      .mockResolvedValueOnce({ data: { id: 'user-1', username: 'ops', email: 'ops@example.com' } });

    await getTenants({ page: 1, page_size: 20, status: 'active' });
    await createTenant({ name: 'Tenant A', code: 'tenant-a' });
    await getPlatformUsers({ page: 2, page_size: 50, username: 'ops' });
    await createPlatformUser({ username: 'ops', email: 'ops@example.com', password: 'secret' });

    expect(request).toHaveBeenNthCalledWith(1, '/api/v1/platform/tenants', {
      method: 'GET',
      params: { page: 1, page_size: 20, status: 'active' },
    });
    expect(request).toHaveBeenNthCalledWith(2, '/api/v1/platform/tenants', {
      method: 'POST',
      data: { name: 'Tenant A', code: 'tenant-a' },
    });
    expect(request).toHaveBeenNthCalledWith(3, '/api/v1/platform/users', {
      method: 'GET',
      params: { page: 2, page_size: 50, username: 'ops' },
    });
    expect(request).toHaveBeenNthCalledWith(4, '/api/v1/platform/users', {
      method: 'POST',
      data: { username: 'ops', email: 'ops@example.com', password: 'secret' },
    });
  });
});

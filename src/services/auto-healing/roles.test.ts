import {
  getPlatformRoleUsers,
  getPlatformRoles,
  getRoles,
  getSystemTenantRoles,
} from './roles';
import { request } from '@umijs/max';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

describe('auto-healing roles service', () => {
  it('normalizes tenant and platform role envelopes', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({ data: [{ id: 'role-1', name: 'ops' }] })
      .mockResolvedValueOnce({ data: [{ id: 'role-2', name: 'platform_admin' }] })
      .mockResolvedValueOnce({ data: [{ id: 'role-3', name: 'tenant_admin' }] })
      .mockResolvedValueOnce({ data: [{ id: 'user-1', username: 'ops' }], total: 1 });

    await expect(getRoles()).resolves.toEqual([{ id: 'role-1', name: 'ops' }]);
    await expect(getPlatformRoles()).resolves.toEqual([{ id: 'role-2', name: 'platform_admin' }]);
    await expect(getSystemTenantRoles()).resolves.toEqual([{ id: 'role-3', name: 'tenant_admin' }]);
    await expect(getPlatformRoleUsers('role-2')).resolves.toEqual({
      data: [{ id: 'user-1', username: 'ops' }],
      total: 1,
      page: 1,
      page_size: 1,
    });
  });
});

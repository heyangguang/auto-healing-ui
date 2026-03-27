import {
  getPermissionTree,
  getPermissions,
} from './permissions';
import { request } from '@umijs/max';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

describe('auto-healing permissions service', () => {
  it('normalizes permission list and tree responses', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({
        data: [{ id: 'perm-1', code: 'user:list' }],
      })
      .mockResolvedValueOnce({
        data: {
          user: [{ id: 'perm-1', code: 'user:list' }],
        },
      });

    await expect(getPermissions()).resolves.toEqual([
      { id: 'perm-1', code: 'user:list' },
    ]);
    await expect(getPermissionTree()).resolves.toEqual({
      user: [{ id: 'perm-1', code: 'user:list' }],
    });
  });
});

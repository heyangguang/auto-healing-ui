import {
  getPlatformUser,
  getPlatformUsersSimple,
  updatePlatformUser,
} from './users';
import { request } from '@umijs/max';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

describe('platform users service', () => {
  it('normalizes simple-user, detail and update envelopes', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({
        data: [
          { id: 'user-1', username: 'ops', display_name: 'Ops', status: 'active', is_platform_admin: true },
        ],
      })
      .mockResolvedValueOnce({
        data: { id: 'user-1', username: 'ops', display_name: 'Ops', status: 'active' },
      })
      .mockResolvedValueOnce({
        data: { id: 'user-1', username: 'ops', display_name: 'Ops Updated', status: 'inactive' },
      });

    await expect(getPlatformUsersSimple()).resolves.toEqual([
      { id: 'user-1', username: 'ops', display_name: 'Ops', status: 'active', is_platform_admin: true },
    ]);
    await expect(getPlatformUser('user-1')).resolves.toEqual({
      id: 'user-1',
      username: 'ops',
      display_name: 'Ops',
      status: 'active',
    });
    await expect(updatePlatformUser('user-1', { status: 'inactive' })).resolves.toEqual({
      id: 'user-1',
      username: 'ops',
      display_name: 'Ops Updated',
      status: 'inactive',
    });
  });
});

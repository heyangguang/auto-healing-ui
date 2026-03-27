import {
  createUser,
  getSimpleUsers,
  getUser,
  getUsers,
  updateUser,
} from './users';
import { request } from '@umijs/max';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

describe('auto-healing users service', () => {
  it('normalizes paginated user lists and user detail payloads', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({ data: [{ id: 'user-1', username: 'ops' }], total: 3 })
      .mockResolvedValueOnce({ data: { id: 'user-1', username: 'ops' } })
      .mockResolvedValueOnce({ data: { id: 'user-2', username: 'dev' } })
      .mockResolvedValueOnce({ data: { id: 'user-1', username: 'ops', display_name: 'Ops' } })
      .mockResolvedValueOnce({ data: [{ id: 'user-1', username: 'ops', display_name: 'Ops' }] });

    await expect(getUsers({ page: 1, page_size: 20 })).resolves.toEqual({
      data: [{ id: 'user-1', username: 'ops' }],
      total: 3,
      page: 1,
      page_size: 1,
    });
    await expect(getUser('user-1')).resolves.toEqual({ id: 'user-1', username: 'ops' });
    await expect(createUser({ username: 'dev' } as AutoHealing.CreateUserRequest)).resolves.toEqual({
      id: 'user-2',
      username: 'dev',
    });
    await expect(updateUser('user-1', { display_name: 'Ops' })).resolves.toEqual({
      id: 'user-1',
      username: 'ops',
      display_name: 'Ops',
    });
    await expect(getSimpleUsers()).resolves.toEqual([
      { id: 'user-1', username: 'ops', display_name: 'Ops' },
    ]);
  });
});

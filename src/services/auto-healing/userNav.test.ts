import {
  addFavorite,
  getFavorites,
  getRecents,
  recordRecent,
} from './userNav';
import { request } from '@umijs/max';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

describe('auto-healing userNav service', () => {
  it('normalizes favorite and recent envelopes', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({ data: [{ id: 'fav-1', menu_key: 'cmdb' }] })
      .mockResolvedValueOnce({ data: { id: 'fav-2', menu_key: 'rules' } })
      .mockResolvedValueOnce({ data: [{ id: 'recent-1', menu_key: 'flows' }] })
      .mockResolvedValueOnce({ code: 0, message: 'ok' });

    await expect(getFavorites()).resolves.toEqual([{ id: 'fav-1', menu_key: 'cmdb' }]);
    await expect(addFavorite({ menu_key: 'rules', name: 'Rules', path: '/healing/rules' })).resolves.toEqual({
      id: 'fav-2',
      menu_key: 'rules',
    });
    await expect(getRecents()).resolves.toEqual([{ id: 'recent-1', menu_key: 'flows' }]);
    await expect(recordRecent({ menu_key: 'flows', name: 'Flows', path: '/healing/flows' })).resolves.toEqual({
      code: 0,
      message: 'ok',
    });
  });
});

import {
  getPreferences,
  patchPreferences,
} from './preferences';
import { request } from '@umijs/max';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

describe('auto-healing preferences service', () => {
  it('normalizes preference envelopes', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({ data: { id: 'pref-1', user_id: 'user-1', preferences: { table: true } } })
      .mockResolvedValueOnce({ data: { id: 'pref-1', user_id: 'user-1', preferences: { table: false } } });

    await expect(getPreferences()).resolves.toEqual({
      id: 'pref-1',
      user_id: 'user-1',
      preferences: { table: true },
    });
    await expect(patchPreferences({ table: false })).resolves.toEqual({
      id: 'pref-1',
      user_id: 'user-1',
      preferences: { table: false },
    });
  });
});

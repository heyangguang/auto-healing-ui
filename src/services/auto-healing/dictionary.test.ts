import {
  getDictionaries,
  getDictionaryTypes,
} from './dictionary';
import { request } from '@umijs/max';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

describe('auto-healing dictionary service', () => {
  it('normalizes dictionary payloads into plain maps and arrays', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({
        data: {
          git_repo_status: [{ id: '1', dict_key: 'ready', label: '已就绪' }],
        },
      })
      .mockResolvedValueOnce({
        data: [{ dict_type: 'git_repo_status', count: 3 }],
      });

    await expect(getDictionaries(['git_repo_status'])).resolves.toEqual({
      git_repo_status: [{ id: '1', dict_key: 'ready', label: '已就绪' }],
    });
    await expect(getDictionaryTypes()).resolves.toEqual([
      { dict_type: 'git_repo_status', count: 3 },
    ]);
  });
});

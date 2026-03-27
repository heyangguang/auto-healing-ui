import {
  getPlatformSettings,
} from './settings';
import { request } from '@umijs/max';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

describe('platform settings service', () => {
  it('normalizes platform settings modules into a plain array', async () => {
    (request as jest.Mock).mockResolvedValueOnce({
      data: [
        {
          module: 'site',
          settings: [{ key: 'title', value: 'Auto Healing', type: 'string' }],
        },
      ],
    });

    await expect(getPlatformSettings()).resolves.toEqual([
      {
        module: 'site',
        settings: [{ key: 'title', value: 'Auto Healing', type: 'string' }],
      },
    ]);
  });
});

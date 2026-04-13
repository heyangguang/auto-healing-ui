import {
  createSiteMessage,
  getSiteMessageCategories,
} from './messages';
import { request } from '@umijs/max';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

describe('platform messages service', () => {
  beforeEach(() => {
    (request as jest.Mock).mockReset();
  });

  it('normalizes platform site-message categories and create response', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({
        data: [{ value: 'security', label: '安全公告' }],
      })
      .mockResolvedValueOnce({
        data: { id: 'message-1', title: '公告' },
      });

    await expect(getSiteMessageCategories()).resolves.toEqual([
      { value: 'security', label: '安全公告' },
    ]);
    await expect(createSiteMessage({
      category: 'security',
      title: '公告',
      content: '<p>内容</p>',
    })).resolves.toEqual({
      id: 'message-1',
      title: '公告',
    });
    expect(request).toHaveBeenNthCalledWith(1, '/api/v1/common/site-messages/categories', {
      method: 'GET',
    });
    expect(request).toHaveBeenNthCalledWith(2, '/api/v1/platform/site-messages', {
      method: 'POST',
      data: {
        category: 'security',
        title: '公告',
        content: '<p>内容</p>',
      },
    });
  });

  it('accepts tenant-scoped create responses that only return created_count', async () => {
    (request as jest.Mock).mockResolvedValueOnce({
      data: { created_count: 2 },
    });

    await expect(createSiteMessage({
      category: 'security',
      title: '定向公告',
      content: '<p>内容</p>',
      target_tenant_ids: ['tenant-1', 'tenant-2'],
    })).resolves.toEqual({
      created_count: 2,
    });
  });
});

import {
  getSiteMessageCategories,
  getSiteMessages,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from './siteMessage';
import { request } from '@umijs/max';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

describe('auto-healing siteMessage service', () => {
  beforeEach(() => {
    (request as jest.Mock).mockReset();
  });

  it('normalizes site-message list, unread count and categories', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({
        data: [{ id: 'msg-1', title: '站内信', is_read: false }],
        total: 9,
        page: 1,
        page_size: 10,
      })
      .mockResolvedValueOnce({
        data: { unread_count: 5 },
      })
      .mockResolvedValueOnce({
        data: [{ value: 'system_update', label: '系统更新' }],
      });

    await expect(getSiteMessages({ page: 1, page_size: 10 })).resolves.toEqual({
      data: [{ id: 'msg-1', title: '站内信', is_read: false }],
      total: 9,
      page: 1,
      page_size: 10,
    });
    await expect(getUnreadCount()).resolves.toEqual({ unread_count: 5 });
    await expect(getSiteMessageCategories()).resolves.toEqual([
      { value: 'system_update', label: '系统更新' },
    ]);
  });

  it('sends read actions to the expected endpoints', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({ message: 'ok' })
      .mockResolvedValueOnce({ message: 'ok' });

    await markAsRead(['msg-1', 'msg-2']);
    await markAllAsRead();

    expect(request).toHaveBeenNthCalledWith(1, '/api/v1/tenant/site-messages/read', {
      method: 'PUT',
      data: { ids: ['msg-1', 'msg-2'] },
    });
    expect(request).toHaveBeenNthCalledWith(2, '/api/v1/tenant/site-messages/read-all', {
      method: 'PUT',
    });
  });

  it('passes request options through list and unread-count requests', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({
        data: [],
        total: 0,
        page: 1,
        page_size: 20,
      })
      .mockResolvedValueOnce({
        data: { unread_count: 0 },
      });

    await getSiteMessages(
      { page: 1, page_size: 20, category: 'system' },
      { skipTokenRefresh: true },
    );
    await getUnreadCount({ skipTokenRefresh: true });

    expect(request).toHaveBeenNthCalledWith(1, '/api/v1/tenant/site-messages', {
      method: 'GET',
      params: { page: 1, page_size: 20, category: 'system' },
      skipTokenRefresh: true,
    });
    expect(request).toHaveBeenNthCalledWith(2, '/api/v1/tenant/site-messages/unread-count', {
      method: 'GET',
      skipTokenRefresh: true,
    });
  });
});

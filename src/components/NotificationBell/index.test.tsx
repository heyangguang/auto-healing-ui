import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import NotificationBell from './index';
import { history } from '@umijs/max';
import {
  getSiteMessageCategories,
  getSiteMessages,
  getUnreadCount,
} from '@/services/auto-healing/siteMessage';
import { createAuthenticatedEventStream } from '@/services/auto-healing/sse';
import { TokenManager } from '@/requestErrorConfig';

jest.mock('@umijs/max', () => ({
  history: {
    push: jest.fn(),
  },
}));

jest.mock('@/services/auto-healing/siteMessage', () => ({
  getSiteMessages: jest.fn(),
  getUnreadCount: jest.fn(),
  getSiteMessageCategories: jest.fn(),
}));

jest.mock('@/services/auto-healing/sse', () => ({
  createAuthenticatedEventStream: jest.fn(),
}));

jest.mock('@/requestErrorConfig', () => ({
  TokenManager: {
    getToken: jest.fn(),
  },
}));

describe('NotificationBell', () => {
  beforeEach(() => {
    (getSiteMessageCategories as jest.Mock).mockResolvedValue([
      { value: 'security', label: '安全' },
    ]);
    (getUnreadCount as jest.Mock).mockResolvedValue({ unread_count: 3 });
    (getSiteMessages as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'msg-1',
          title: '高危告警',
          created_at: '2026-03-25T09:00:00Z',
          category: 'security',
          content: 'body',
          is_read: false,
        },
      ],
      total: 1,
    });
    (createAuthenticatedEventStream as jest.Mock).mockReturnValue({
      close: jest.fn(),
    });
    (TokenManager.getToken as jest.Mock).mockReturnValue('token');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('uses a button trigger and renders actionable message entries', async () => {
    render(React.createElement(NotificationBell));

    const trigger = await screen.findByRole('button', { name: '未读消息 3 条' });
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: '未读消息' })).toBeTruthy();
    });

    expect(screen.getByRole('button', { name: '查看消息 高危告警' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '查看全部站内消息' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '查看全部站内消息' }));
    expect(history.push).toHaveBeenCalledWith('/system/messages');
  });

  it('shows an explicit error state when unread/message loading fails', async () => {
    (getUnreadCount as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    (getSiteMessages as jest.Mock).mockRejectedValueOnce(new Error('boom'));

    render(React.createElement(NotificationBell));

    fireEvent.click(await screen.findByRole('button', { name: '未读消息' }));

    expect(await screen.findByText('站内信加载失败，请稍后重试')).toBeTruthy();
  });
});

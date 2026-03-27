import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SystemMessages from './index';
import {
  getSiteMessageCategories,
  getSiteMessages,
  markAllAsRead,
  markAsRead,
} from '@/services/auto-healing/siteMessage';

type RowKey = string | number;
type MockStandardTableProps = {
  request?: (params: { page: number; pageSize: number }) => Promise<{ data: Array<Record<string, unknown>> }>;
  refreshTrigger?: number;
  rowSelection?: {
    selectedRowKeys?: RowKey[];
    onChange?: (keys: RowKey[], rows: Array<Record<string, unknown>>) => void;
  };
  onRowClick?: (record: Record<string, unknown>) => void;
  extraToolbarActions?: unknown;
};

jest.mock('@/services/auto-healing/siteMessage', () => ({
  getSiteMessageCategories: jest.fn(),
  getSiteMessages: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
}));

jest.mock('@/components/StandardTable', () => {
  const ReactLocal = require('react');

  return function MockStandardTable(props: MockStandardTableProps) {
    const [rows, setRows] = ReactLocal.useState([] as Array<Record<string, unknown>>);

    ReactLocal.useEffect(() => {
      let active = true;
      Promise.resolve(props.request?.({ page: 1, pageSize: 20 }))
        .then((result) => {
          if (active) {
            setRows(result?.data || []);
          }
        });
      return () => {
        active = false;
      };
    }, [props.request, props.refreshTrigger]);

    const firstRow = rows[0];

    return ReactLocal.createElement(
      'div',
      null,
      ReactLocal.createElement(
        'div',
        { 'data-testid': 'selected-count' },
        props.rowSelection?.selectedRowKeys?.length || 0,
      ),
      props.extraToolbarActions,
      firstRow
        ? ReactLocal.createElement(
          ReactLocal.Fragment,
          null,
          ReactLocal.createElement(
            'button',
            {
              type: 'button',
              onClick: () => props.rowSelection?.onChange?.([firstRow.id], [firstRow]),
            },
            'select-first-row',
          ),
          ReactLocal.createElement(
            'button',
            {
              type: 'button',
              onClick: () => props.onRowClick?.(firstRow),
            },
            'open-first-row',
          ),
        )
        : null,
    );
  };
});

jest.mock('antd', () => {
  const actual = jest.requireActual('antd');
  const ReactLocal = require('react');
  return {
    ...actual,
    Tooltip: ({ title, children }: { title?: string; children?: unknown }) => (
      title && ReactLocal.isValidElement(children)
        ? ReactLocal.cloneElement(children, { 'aria-label': title })
        : children
    ),
    Drawer: ({ open, children }: { open: boolean; children?: unknown }) => (
      open ? ReactLocal.createElement('div', null, children) : null
    ),
    message: {
      success: jest.fn(),
      warning: jest.fn(),
    },
  };
});

describe('SystemMessages', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (getSiteMessageCategories as jest.Mock).mockResolvedValue([
      { value: 'system', label: '系统' },
    ]);
    (getSiteMessages as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'msg-1',
          category: 'system',
          title: '系统消息',
          content: '<p>body</p>',
          created_at: '2026-03-26T10:00:00Z',
          is_read: false,
        },
      ],
      total: 1,
    });
    (markAsRead as jest.Mock).mockResolvedValue({ message: 'ok' });
    (markAllAsRead as jest.Mock).mockResolvedValue({ message: 'ok' });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('keeps current selection when opening an unread message detail', async () => {
    render(React.createElement(SystemMessages));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'select-first-row' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'select-first-row' }));
    expect(screen.getByTestId('selected-count').textContent).toBe('1');

    fireEvent.click(screen.getByRole('button', { name: 'open-first-row' }));

    await waitFor(() => {
      expect(markAsRead).toHaveBeenCalledWith(['msg-1']);
    });
    expect(screen.getByTestId('selected-count').textContent).toBe('1');
  });

  it('marks selected messages as read and clears the current selection', async () => {
    render(React.createElement(SystemMessages));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'select-first-row' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'select-first-row' }));
    expect(screen.getByTestId('selected-count').textContent).toBe('1');

    fireEvent.click(screen.getByRole('button', { name: '标记已读' }));

    await waitFor(() => {
      expect(markAsRead).toHaveBeenCalledWith(['msg-1']);
      expect(screen.getByTestId('selected-count').textContent).toBe('0');
    });
  });

  it('marks all messages as read and clears the current selection', async () => {
    render(React.createElement(SystemMessages));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'select-first-row' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'select-first-row' }));
    expect(screen.getByTestId('selected-count').textContent).toBe('1');

    fireEvent.click(screen.getByRole('button', { name: '全部已读' }));

    await waitFor(() => {
      expect(markAllAsRead).toHaveBeenCalled();
      expect(screen.getByTestId('selected-count').textContent).toBe('0');
    });
  });

  it('logs the failure when auto-mark-as-read rejects from opening detail', async () => {
    (markAsRead as jest.Mock).mockRejectedValueOnce(new Error('读状态更新失败'));
    render(React.createElement(SystemMessages));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'open-first-row' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'open-first-row' }));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[system-messages] 自动标记已读失败',
        expect.any(Error),
      );
    });
  });
});

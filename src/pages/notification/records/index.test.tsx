import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import {
  getNotifications,
  getNotificationStats,
} from '@/services/auto-healing/notification';
import {
  getCachedNotificationChannelInventory,
  getCachedNotificationTemplateInventory,
} from '@/utils/selectorInventoryCache';
import NotificationRecords from './index';

jest.mock('@/services/auto-healing/notification', () => ({
  getNotifications: jest.fn(),
  getNotificationStats: jest.fn(),
}));

jest.mock('@/services/auto-healing/execution', () => ({
  getExecutionRun: jest.fn(),
}));

jest.mock('@/utils/selectorInventoryCache', () => ({
  getCachedNotificationChannelInventory: jest.fn(),
  getCachedNotificationTemplateInventory: jest.fn(),
}));

jest.mock('./notificationRecordColumns', () => ({
  buildNotificationRecordColumns: jest.fn(() => []),
}));

jest.mock('./NotificationRecordDetailDrawer', () =>
  function MockNotificationRecordDetailDrawer({
    record,
  }: {
    record: { id: string } | null;
  }) {
    return record ? <div>record-drawer:{record.id}</div> : null;
  });

jest.mock('./ExecutionRunDetailDrawer', () =>
  function MockExecutionRunDetailDrawer({
    execution,
  }: {
    execution: { id: string } | null;
  }) {
    return execution ? <div>execution-drawer:{execution.id}</div> : null;
  });

jest.mock('@/components/StandardTable', () => {
  const React = require('react');

  return function MockStandardTable(props: {
    onRowClick?: (record: { id: string; subject: string }) => void;
    request: (params: unknown) => Promise<{ data: Array<{ id: string; subject: string }> }>;
    title: string;
  }) {
    const [rows, setRows] = React.useState([] as Array<{ id: string; subject: string }>);
    const [mode, setMode] = React.useState('default' as 'default' | 'filtered');

    React.useEffect(() => {
      const params = mode === 'default'
        ? { page: 1, pageSize: 16 }
        : {
          page: 2,
          pageSize: 16,
          searchField: 'task_name',
          searchValue: 'backup',
          sorter: { field: 'created_at', order: 'descend' as const },
          advancedSearch: {
            status: 'failed',
            template_id: 'tpl-1',
            channel_id: 'channel-1',
            triggered_by: 'manual',
          },
        };

      void props.request(params).then((result) => setRows(result.data));
    }, [mode, props.request]);

    return (
      <div>
        <div>{props.title}</div>
        <button type="button" onClick={() => setMode('filtered')}>切换记录筛选</button>
        {rows.map((row: { id: string; subject: string }) => (
          <button type="button" key={row.id} onClick={() => props.onRowClick?.(row)}>
            {row.subject}
          </button>
        ))}
      </div>
    );
  };
});

describe('NotificationRecords', () => {
  const messageErrorSpy = jest.spyOn(message, 'error').mockImplementation(jest.fn());

  beforeEach(() => {
    jest.clearAllMocks();
    (getNotificationStats as jest.Mock).mockResolvedValue({
      logs_total: 3,
      logs_by_status: [{ status: 'sent', count: 2 }],
    });
    (getNotifications as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'log-1',
          subject: '备份失败告警',
          status: 'failed',
        },
      ],
      total: 1,
    });
    (getCachedNotificationChannelInventory as jest.Mock).mockResolvedValue([
      { id: 'channel-1', name: '邮件通知', type: 'email' },
    ]);
    (getCachedNotificationTemplateInventory as jest.Mock).mockResolvedValue([
      { id: 'tpl-1', name: '执行结果通知' },
    ]);
  });

  afterAll(() => {
    messageErrorSpy.mockRestore();
  });

  it('surfaces inventory loading errors', async () => {
    (getCachedNotificationChannelInventory as jest.Mock).mockRejectedValueOnce(new Error('boom'));

    render(React.createElement(NotificationRecords));

    await waitFor(() => {
      expect(messageErrorSpy).toHaveBeenCalledWith('加载通知筛选选项失败，请稍后重试');
    });
  });

  it('maps table params into notification queries and opens the detail drawer', async () => {
    render(React.createElement(NotificationRecords));

    fireEvent.click(await screen.findByRole('button', { name: '切换记录筛选' }));

    await waitFor(() => {
      expect(getNotifications).toHaveBeenCalledWith({
        page: 2,
        page_size: 16,
        task_name: 'backup',
        status: 'failed',
        template_id: 'tpl-1',
        channel_id: 'channel-1',
        triggered_by: 'manual',
        sort_by: 'created_at',
        sort_order: 'desc',
      });
    });

    fireEvent.click(screen.getByRole('button', { name: '备份失败告警' }));

    expect(screen.getByText('record-drawer:log-1')).toBeTruthy();
  });
});

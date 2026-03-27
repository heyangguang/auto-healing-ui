import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { getCommandBlacklist } from '@/services/auto-healing/commandBlacklist';
import CommandBlacklistPage from './index';

jest.mock('@umijs/max', () => ({
  history: {
    push: jest.fn(),
  },
  useAccess: () => ({
    canManageBlacklist: true,
    canDeleteBlacklist: true,
  }),
}));

jest.mock('@/services/auto-healing/commandBlacklist', () => ({
  getCommandBlacklist: jest.fn(),
  deleteCommandBlacklistRule: jest.fn(),
  toggleCommandBlacklistRule: jest.fn(),
  batchToggleCommandBlacklistRules: jest.fn(),
}));

jest.mock('./CommandBlacklistDetailDrawer', () =>
  function MockCommandBlacklistDetailDrawer({
    rule,
  }: {
    rule: { name: string } | null;
  }) {
    return rule ? <div>drawer:{rule.name}</div> : null;
  });

jest.mock('@/components/StandardTable', () => {
  const React = require('react');

  return function MockStandardTable(props: {
    onRowClick?: (record: { id: string; name: string }) => void;
    refreshTrigger?: number;
    request: (params: unknown) => Promise<{ data: Array<{ id: string; name: string }> }>;
    rowSelection?: { onChange: (keys: string[]) => void };
    title: string;
  }) {
    const [rows, setRows] = React.useState([] as Array<{ id: string; name: string }>);
    const [mode, setMode] = React.useState('default' as 'default' | 'filtered');

    React.useEffect(() => {
      const params = mode === 'default'
        ? { page: 1, pageSize: 20 }
        : {
          page: 2,
          pageSize: 20,
          searchValue: '危险命令',
          advancedSearch: { severity: 'critical', is_active: 'true' },
          sorter: { field: 'updated_at', order: 'descend' as const },
        };

      void props.request(params).then((result) => setRows(result.data));
    }, [mode, props.refreshTrigger, props.request]);

    return (
      <div>
        <div>{props.title}</div>
        <button onClick={() => props.rowSelection?.onChange(['rule-1'])}>选择规则</button>
        <button onClick={() => setMode('filtered')}>切换筛选</button>
        {rows.map((row: { id: string; name: string }) => (
          <button key={row.id} onClick={() => props.onRowClick?.(row)}>
            {row.name}
          </button>
        ))}
      </div>
    );
  };
});

describe('CommandBlacklistPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCommandBlacklist as jest.Mock).mockImplementation(async (params?: {
      page_size?: number;
      is_active?: boolean;
      severity?: string;
    }) => {
      if (params?.page_size === 1) {
        return {
          data: [],
          total: params.severity === 'critical' ? 1 : params.is_active ? 2 : 3,
        };
      }

      return {
        data: [
          {
            id: 'rule-1',
            name: '危险命令',
            pattern: 'rm -rf',
            match_type: 'contains',
            severity: 'critical',
            category: 'filesystem',
            is_active: true,
            is_system: false,
            description: '禁止删除系统目录',
            updated_at: '2026-03-27T08:00:00Z',
          },
        ],
        total: 1,
      };
    });
  });

  it('clears batch selection when the request query changes', async () => {
    render(React.createElement(CommandBlacklistPage));

    await screen.findByText('高危指令黑名单');

    fireEvent.click(screen.getByRole('button', { name: '选择规则' }));
    expect(screen.getByText(/已选 1 条/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '切换筛选' }));

    await waitFor(() => {
      expect(getCommandBlacklist).toHaveBeenCalledWith(expect.objectContaining({
        page: 2,
        page_size: 20,
        name: '危险命令',
        severity: 'critical',
        is_active: 'true',
        sort_by: 'updated_at',
        sort_order: 'desc',
      }));
    });

    await waitFor(() => {
      expect(screen.queryByText(/已选 1 条/)).toBeNull();
    });
  });

  it('opens the detail drawer from a selected row', async () => {
    render(React.createElement(CommandBlacklistPage));

    fireEvent.click(await screen.findByRole('button', { name: '危险命令' }));

    expect(screen.getByText('drawer:危险命令')).toBeTruthy();
  });
});

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AuditLogsPage from './index';
import { getAuditLogDetail, getAuditLogs, getAuditStats, getAuditTrend } from '@/services/auto-healing/auditLogs';

let capturedStandardTableProps: Record<string, unknown> | null = null;
let capturedExportModalProps: Record<string, unknown> | null = null;

jest.mock('@umijs/max', () => ({
  useAccess: () => ({
    canExportAuditLogs: true,
  }),
}));

jest.mock('@/services/auto-healing/auditLogs', () => ({
  getAuditLogs: jest.fn(),
  getAuditLogDetail: jest.fn(),
  getAuditStats: jest.fn(),
  getAuditTrend: jest.fn(),
}));

jest.mock('@/components/StandardTable', () => {
  const ReactLocal = require('react');

  return function MockStandardTable(props: Record<string, unknown>) {
    capturedStandardTableProps = props;
    const tabs = Array.isArray(props.tabs) ? props.tabs : [];
    return ReactLocal.createElement(
      'div',
      null,
      ReactLocal.createElement('div', null, props.title),
      ReactLocal.createElement('div', null, props.description),
      ...tabs.map((tab: { key: string; label: string }) => ReactLocal.createElement('span', { key: tab.key }, tab.label)),
    );
  };
});

jest.mock('./AuditStatsBar', () => () => null);
jest.mock('./AuditDetailDrawer', () => () => null);
jest.mock('./AuditExportModal', () => {
  return function MockAuditExportModal(props: Record<string, unknown>) {
    capturedExportModalProps = props;
    return null;
  };
});

jest.mock('antd', () => {
  const ReactLocal = require('react');
  return {
    Button: function MockButton(props: { children?: unknown; onClick?: () => void }) {
      return ReactLocal.createElement('button', { type: 'button', onClick: props.onClick }, props.children);
    },
    Tag: function MockTag(props: { children?: unknown }) {
      return ReactLocal.createElement('span', null, props.children);
    },
    Tooltip: function MockTooltip(props: { children?: unknown }) {
      return ReactLocal.createElement('div', null, props.children);
    },
    Typography: {
      Text: function MockText(props: { children?: unknown }) {
        return ReactLocal.createElement('span', null, props.children);
      },
    },
    message: {
      error: jest.fn(),
    },
  };
});

describe('AuditLogsPage', () => {
  beforeEach(() => {
    capturedStandardTableProps = null;
    capturedExportModalProps = null;
    (getAuditLogs as jest.Mock).mockResolvedValue({ data: [], total: 0 });
    (getAuditLogDetail as jest.Mock).mockResolvedValue({});
    (getAuditStats as jest.Mock).mockResolvedValue({});
    (getAuditTrend as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('separates tenant operation logs and auth logs', async () => {
    render(React.createElement(AuditLogsPage));

    expect(screen.getByText('审计日志')).toBeTruthy();
    expect(screen.getByText('认证日志')).toBeTruthy();

    await waitFor(() => {
      expect(capturedStandardTableProps).toBeTruthy();
    });

    expect(capturedStandardTableProps?.tabs).toEqual([
      { key: 'operation', label: '操作日志' },
      { key: 'auth', label: '认证日志' },
    ]);
    expect(capturedExportModalProps?.category).toBe('operation');

    const request = capturedStandardTableProps?.request as ((params: Record<string, unknown>) => Promise<unknown>);
    await request({
      page: 1,
      pageSize: 20,
      searchField: 'username',
      searchValue: 'ops',
    });

    expect(getAuditLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'operation',
        username: 'ops',
      }),
    );
  });
});

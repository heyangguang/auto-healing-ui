import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ExemptionApprovalsPage from './index';
import {
  getBlacklistExemptions,
  getPendingExemptions,
  rejectBlacklistExemption,
} from '@/services/auto-healing/blacklistExemption';
import { message } from 'antd';

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(global, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
});

jest.mock('@umijs/max', () => ({
  useAccess: () => ({
    canApproveExemption: true,
  }),
}));

jest.mock('@/services/auto-healing/blacklistExemption', () => ({
  getBlacklistExemptions: jest.fn(),
  getPendingExemptions: jest.fn(),
  approveBlacklistExemption: jest.fn(),
  rejectBlacklistExemption: jest.fn(),
}));

jest.mock('@/components/StandardTable', () => {
  const ReactLocal = require('react');
  const pendingDetail = {
    id: 'exemption-1',
    requester_name: 'alice',
    rule_name: 'rule-1',
    status: 'pending',
  };

  return function MockStandardTable(props: {
    headerExtra?: unknown;
    activeTab?: 'pending' | 'history';
    onRowClick?: (record: typeof pendingDetail) => void;
    onTabChange?: (key: string) => void;
    request?: (params: {
      page: number;
      pageSize: number;
      searchField?: string;
      searchValue?: string;
      advancedSearch?: Record<string, string>;
      sorter?: { field: string; order: 'ascend' | 'descend' };
    }) => Promise<unknown>;
  }) {
    ReactLocal.useEffect(() => {
      void props.request?.({
        page: 1,
        pageSize: 20,
        searchField: '__enum__status',
        searchValue: 'pending',
        advancedSearch: { task_name: '任务 A' },
        sorter: { field: 'created_at', order: 'descend' },
      });
    }, [props.request]);

    return ReactLocal.createElement(
      'div',
      null,
      props.headerExtra,
      ReactLocal.createElement(
        'button',
        { type: 'button', onClick: () => props.onRowClick?.(pendingDetail) },
        'open-detail',
      ),
      ReactLocal.createElement(
        'button',
        {
          type: 'button',
          onClick: () => props.onTabChange?.(props.activeTab === 'pending' ? 'history' : 'pending'),
        },
        props.activeTab === 'pending' ? 'switch-to-history' : 'switch-to-pending',
      ),
    );
  };
});

jest.mock('../ExemptionDetailPanel', () => ({
  __esModule: true,
  default: ({ detail }: { detail: { id: string } }) => {
    const ReactLocal = require('react');
    return ReactLocal.createElement('div', null, `exemption-detail:${detail.id}`);
  },
}));

jest.mock('antd', () => {
  const actual = jest.requireActual('antd');
  const ReactLocal = require('react');
  return {
    ...actual,
    Drawer: ({ open, extra, children }: { open: boolean; extra?: unknown; children?: unknown }) => (
      open ? ReactLocal.createElement('div', null, extra, children) : null
    ),
    Modal: ({ open, children, onOk, onCancel }: { open: boolean; children?: unknown; onOk?: () => void; onCancel?: () => void }) => (
      open ? ReactLocal.createElement(
        'div',
        null,
        children,
        ReactLocal.createElement('button', { type: 'button', onClick: onOk }, 'modal-ok'),
        ReactLocal.createElement('button', { type: 'button', onClick: onCancel }, 'modal-cancel'),
      ) : null
    ),
    message: {
      success: jest.fn(),
      error: jest.fn(),
    },
  };
});

describe('ExemptionApprovalsPage', () => {
  beforeEach(() => {
    (getPendingExemptions as jest.Mock).mockImplementation((params?: { page_size?: number }) => (
      Promise.resolve({ data: [], total: params?.page_size === 1 ? 3 : 1 })
    ));
    (getBlacklistExemptions as jest.Mock).mockResolvedValue({ data: [], total: 8 });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('passes pending-tab search filters to getPendingExemptions', async () => {
    render(React.createElement(ExemptionApprovalsPage));

    await waitFor(() => {
      expect(getBlacklistExemptions).toHaveBeenCalledWith({ page: 1, page_size: 1 });
      expect(getPendingExemptions).toHaveBeenCalledWith({ page: 1, page_size: 1 });
      expect(getPendingExemptions).toHaveBeenCalledWith({
        page: 1,
        page_size: 20,
        task_name: '任务 A',
        status: 'pending',
        sort_by: 'created_at',
        sort_order: 'desc',
      });
      expect(screen.getByText('8')).toBeTruthy();
      expect(screen.getByText('3')).toBeTruthy();
    });
  });

  it('closes the pending detail drawer when switching to history', async () => {
    render(React.createElement(ExemptionApprovalsPage));

    fireEvent.click(screen.getByRole('button', { name: 'open-detail' }));
    expect(screen.getByText('exemption-detail:exemption-1')).toBeTruthy();
    expect(screen.getByRole('button', { name: /批准/ })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'switch-to-history' }));

    await waitFor(() => {
      expect(screen.queryByText('exemption-detail:exemption-1')).toBeNull();
      expect(screen.queryByRole('button', { name: /批准/ })).toBeNull();
      expect(screen.queryByRole('button', { name: /拒绝/ })).toBeNull();
    });
  });

  it('requires a reject reason and sends it to the reject API', async () => {
    render(React.createElement(ExemptionApprovalsPage));

    fireEvent.click(screen.getByRole('button', { name: 'open-detail' }));
    fireEvent.click(screen.getByRole('button', { name: /拒\s*绝/ }));
    fireEvent.click(screen.getByRole('button', { name: 'modal-ok' }));

    expect(message.error).toHaveBeenCalledWith('请输入拒绝原因');
    expect(rejectBlacklistExemption).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText('拒绝原因（必填）'), {
      target: { value: '风险过高' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'modal-ok' }));

    await waitFor(() => {
      expect(rejectBlacklistExemption).toHaveBeenCalledWith('exemption-1', '风险过高');
    });
  });
});

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ImpersonationApprovalsPage from './index';
import {
  listImpersonationHistory,
  listPendingImpersonation,
  rejectImpersonation,
} from '@/services/auto-healing/platform/impersonation';

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

const pendingDetail = {
  id: 'impersonation-1',
  requester_name: 'alice',
  tenant_name: '租户 A',
  status: 'pending',
};

jest.mock('@umijs/max', () => ({
  useAccess: () => ({
    canApproveImpersonation: true,
  }),
}));

jest.mock('@/services/auto-healing/platform/impersonation', () => ({
  approveImpersonation: jest.fn(),
  listImpersonationHistory: jest.fn(),
  listPendingImpersonation: jest.fn(),
  rejectImpersonation: jest.fn(),
}));

jest.mock('@/components/StandardTable', () => {
  const ReactLocal = require('react');

  return function MockStandardTable(props: {
    activeTab?: 'pending' | 'history';
    headerExtra?: unknown;
    onRowClick?: (record: typeof pendingDetail) => void;
    onTabChange?: (key: string) => void;
    request?: (params: { page: number; pageSize: number }) => Promise<unknown>;
  }) {
    ReactLocal.useEffect(() => {
      void props.request?.({ page: 1, pageSize: 20 });
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

jest.mock('../ImpersonationApprovalDetailPanel', () => ({
  __esModule: true,
  default: ({ detail }: { detail: { id: string } }) => {
    const ReactLocal = require('react');
    return ReactLocal.createElement('div', null, `impersonation-detail:${detail.id}`);
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
    },
  };
});

describe('ImpersonationApprovalsPage', () => {
  beforeEach(() => {
    (listPendingImpersonation as jest.Mock).mockResolvedValue([pendingDetail]);
    (listImpersonationHistory as jest.Mock).mockResolvedValue({ data: [], total: 8 });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('closes the pending detail drawer when switching to history', async () => {
    render(React.createElement(ImpersonationApprovalsPage));

    await waitFor(() => {
      expect(screen.getByText('9')).toBeTruthy();
      expect(screen.getByText('1')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'open-detail' }));
    expect(screen.getByText('impersonation-detail:impersonation-1')).toBeTruthy();
    expect(screen.getByRole('button', { name: /批准/ })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'switch-to-history' }));

    await waitFor(() => {
      expect(screen.queryByText('impersonation-detail:impersonation-1')).toBeNull();
      expect(screen.queryByRole('button', { name: /批准/ })).toBeNull();
      expect(screen.queryByRole('button', { name: /拒绝/ })).toBeNull();
    });
  });

  it('passes the reject comment to rejectImpersonation', async () => {
    render(React.createElement(ImpersonationApprovalsPage));

    fireEvent.click(screen.getByRole('button', { name: 'open-detail' }));
    fireEvent.click(screen.getByRole('button', { name: /拒\s*绝/ }));
    fireEvent.change(screen.getByPlaceholderText('拒绝原因（可选）'), {
      target: { value: '审批不通过' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'modal-ok' }));

    await waitFor(() => {
      expect(rejectImpersonation).toHaveBeenCalledWith('impersonation-1', {
        comment: '审批不通过',
      });
    });
  });
});

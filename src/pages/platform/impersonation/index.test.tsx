import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ImpersonationPage from './index';
import {
  createImpersonationRequest,
  listMyImpersonationRequests,
} from '@/services/auto-healing/platform/impersonation';
import { fetchAllPages } from '@/utils/fetchAllPages';

const mockImpersonationModal = jest.fn((_props?: unknown) => null);

jest.mock('@/services/auto-healing/platform/impersonation', () => ({
  createImpersonationRequest: jest.fn(),
  listMyImpersonationRequests: jest.fn(),
  enterTenant: jest.fn(),
  exitTenant: jest.fn(),
  terminateSession: jest.fn(),
  cancelImpersonationRequest: jest.fn(),
}));

jest.mock('@/utils/fetchAllPages', () => ({
  fetchAllPages: jest.fn(),
}));

jest.mock('@/store/impersonation', () => ({
  saveImpersonationState: jest.fn(),
  clearImpersonationState: jest.fn(),
}));

jest.mock('./ImpersonationRequestModal', () => ({
  __esModule: true,
  default: (props: unknown) => mockImpersonationModal(props),
}));

jest.mock('@/components/StandardTable', () => {
  const ReactLocal = require('react');

  return function MockStandardTable(props: {
    request?: (params: {
      page: number;
      pageSize: number;
      searchField?: string;
      searchValue?: string;
      advancedSearch?: Record<string, string>;
      sorter?: { field: string; order: 'ascend' | 'descend' };
    }) => Promise<unknown>;
    headerExtra?: unknown;
    onPrimaryAction?: () => void;
    primaryActionLabel?: string;
  }) {
    ReactLocal.useEffect(() => {
      void props.request?.({
        page: 1,
        pageSize: 20,
        searchField: 'requester_name',
        searchValue: 'alice',
        advancedSearch: { status: 'pending', tenant_name: '租户 A' },
        sorter: { field: 'created_at', order: 'descend' },
      });
    }, [props.request]);

    return ReactLocal.createElement(
      'div',
      null,
      props.headerExtra,
      ReactLocal.createElement(
        'button',
        {
          type: 'button',
          onClick: () => props.onPrimaryAction?.(),
        },
        props.primaryActionLabel,
      ),
    );
  };
});

describe('ImpersonationPage', () => {
  beforeEach(() => {
    (listMyImpersonationRequests as jest.Mock).mockImplementation((params?: { status?: string; requester_name?: string }) => {
      if (params?.status === 'pending') {
        return Promise.resolve({ data: [], total: 1 });
      }
      if (params?.status === 'active') {
        return Promise.resolve({ data: [], total: 2 });
      }
      if (params?.requester_name === 'alice') {
        return Promise.resolve({ data: [], total: 0 });
      }
      return Promise.resolve({ data: [], total: 3 });
    });
    (fetchAllPages as jest.Mock).mockResolvedValue([
      { id: 'tenant-1', name: '租户 A' },
    ]);
    (createImpersonationRequest as jest.Mock).mockResolvedValue({ id: 'req-1' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('loads stats, maps search params, and loads tenants from the primary action', async () => {
    render(React.createElement(ImpersonationPage));

    await waitFor(() => {
      expect(listMyImpersonationRequests).toHaveBeenCalledWith({ page: 1, page_size: 1 });
      expect(listMyImpersonationRequests).toHaveBeenCalledWith({ page: 1, page_size: 1, status: 'pending' });
      expect(listMyImpersonationRequests).toHaveBeenCalledWith({ page: 1, page_size: 1, status: 'active' });
      expect(listMyImpersonationRequests).toHaveBeenCalledWith({
        page: 1,
        page_size: 20,
        requester_name: 'alice',
        tenant_name: '租户 A',
        status: 'pending',
        sort_by: 'created_at',
        sort_order: 'desc',
      });
    });

    fireEvent.click(screen.getByRole('button', { name: '申请访问' }));

    await waitFor(() => {
      expect(fetchAllPages).toHaveBeenCalled();
      expect(mockImpersonationModal).toHaveBeenLastCalledWith(expect.objectContaining({
        tenants: [{ id: 'tenant-1', name: '租户 A' }],
      }));
    });
  });
});

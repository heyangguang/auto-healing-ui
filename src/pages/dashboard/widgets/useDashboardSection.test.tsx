import { act, renderHook } from '@testing-library/react';
import { __TEST_ONLY__, useDashboardSection } from './useDashboardSection';

const mockUseRequest = jest.fn();
const mockGetTenantContextScopeKey = jest.fn();
const subscriptions: Array<() => void> = [];

jest.mock('@umijs/max', () => ({
  useRequest: (...args: unknown[]) => mockUseRequest(...args),
}));

jest.mock('@/utils/tenantContext', () => ({
  getTenantContextScopeKey: () => mockGetTenantContextScopeKey(),
}));

jest.mock('@/utils/tenantContextEvents', () => ({
  subscribeTenantContextChanged: (listener: () => void) => {
    subscriptions.push(listener);
    return () => {};
  },
}));

jest.mock('@/services/auto-healing/dashboard', () => ({
  getDashboardOverview: jest.fn(),
}));

describe('useDashboardSection', () => {
  beforeEach(() => {
    mockUseRequest.mockReset();
    mockGetTenantContextScopeKey.mockReset();
    mockGetTenantContextScopeKey.mockReturnValue('user-1:tenant:tenant-a');
    subscriptions.length = 0;
    localStorage.clear();
    __TEST_ONLY__.clearResolvedSectionCache();
    __TEST_ONLY__.clearAutoRefreshAttemptedKeys();
  });

  it('only exposes loading during the first unresolved request', () => {
    mockUseRequest.mockReturnValue({
      data: {
        data: {
          incidents: { total: 3 },
        },
      },
      loading: true,
      refresh: jest.fn(),
    });

    const { result } = renderHook(() => useDashboardSection('incidents'));

    expect(result.current.data).toEqual({ total: 3 });
    expect(result.current.loading).toBe(false);
  });

  it('reuses the last resolved section data while a later request is still loading', async () => {
    let requestState: {
      data: { data: { incidents: { total: number } } } | undefined;
      loading: boolean;
      refresh: jest.Mock;
    } = {
      data: {
        data: {
          incidents: { total: 3 },
        },
      },
      loading: false,
      refresh: jest.fn(),
    };
    mockUseRequest.mockImplementation(() => requestState);

    const { result, rerender } = renderHook(() => useDashboardSection('incidents'));

    expect(result.current.loading).toBe(false);

    requestState = {
      data: undefined,
      loading: true,
      refresh: jest.fn(),
    };

    await act(async () => {
      rerender();
    });

    expect(result.current.data).toEqual({ total: 3 });
    expect(result.current.loading).toBe(false);
  });

  it('reuses the resolved section data across widget mounts in the same section', () => {
    const firstState = {
      data: {
        data: {
          healing: { instances_total: 0 },
        },
      },
      loading: false,
      refresh: jest.fn(),
    };
    const secondState = {
      data: undefined,
      loading: true,
      refresh: jest.fn(),
    };

    mockUseRequest
      .mockImplementationOnce(() => firstState)
      .mockImplementation(() => secondState);

    const first = renderHook(() => useDashboardSection('healing'));
    expect(first.result.current.loading).toBe(false);

    const second = renderHook(() => useDashboardSection('healing'));
    expect(second.result.current.data).toEqual({ instances_total: 0 });
    expect(second.result.current.loading).toBe(false);
  });

  it('updates the request scope when tenant context changes in the same tab', async () => {
    mockUseRequest.mockImplementation(() => ({
      data: undefined,
      loading: true,
      refresh: jest.fn(),
    }));

    renderHook(() => useDashboardSection('incidents'));

    expect(mockUseRequest.mock.calls.at(-1)?.[1]?.cacheKey).toBe('dashboard-section-user-1:tenant:tenant-a-incidents');

    mockGetTenantContextScopeKey.mockReturnValue('user-1:tenant:tenant-b');

    await act(async () => {
      subscriptions[0]?.();
    });

    expect(mockUseRequest.mock.calls.at(-1)?.[1]?.cacheKey).toBe('dashboard-section-user-1:tenant:tenant-b-incidents');
  });

  it('auto-refreshes once when a section mounts with no data and no active loading state', async () => {
    const refresh = jest.fn().mockImplementation(() => new Promise(() => {}));
    mockUseRequest.mockReturnValue({
      data: undefined,
      loading: false,
      refresh,
    });

    const { result } = renderHook(() => useDashboardSection('incidents'));

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(true);
  });
});

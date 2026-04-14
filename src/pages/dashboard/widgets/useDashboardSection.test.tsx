import { act, renderHook, waitFor } from '@testing-library/react';
import { __TEST_ONLY__, useDashboardSection } from './useDashboardSection';
import { __TEST_ONLY__ as STORE_TEST_ONLY } from './dashboardSectionStore';

const mockGetTenantContextScopeKey = jest.fn();
const subscriptions: Array<() => void> = [];

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

const { getDashboardOverview } = jest.requireMock('@/services/auto-healing/dashboard') as {
  getDashboardOverview: jest.Mock;
};

function createDeferredResponse<T>() {
  let resolve: ((value: T) => void) | undefined;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });

  return {
    promise,
    resolve: (value: T) => resolve?.(value),
  };
}

describe('useDashboardSection', () => {
  beforeEach(() => {
    mockGetTenantContextScopeKey.mockReset();
    mockGetTenantContextScopeKey.mockReturnValue('user-1:tenant:tenant-a');
    subscriptions.length = 0;
    getDashboardOverview.mockReset();
    localStorage.clear();
    STORE_TEST_ONLY.clearDashboardSectionStore();
  });

  it('only exposes loading during the first unresolved request', () => {
    const deferred = createDeferredResponse<{ data: { incidents: { total: number } } }>();
    getDashboardOverview.mockReturnValue(deferred.promise);

    const { result } = renderHook(() => useDashboardSection('incidents'));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('reuses the last resolved section data while a later refresh is in flight', async () => {
    const deferred = createDeferredResponse<{ data: { incidents: { total: number } } }>();
    getDashboardOverview.mockImplementationOnce(() => deferred.promise);

    const { result } = renderHook(() => useDashboardSection('incidents'));

    await act(async () => {
      deferred.resolve({ data: { incidents: { total: 3 } } });
    });

    expect(result.current.data).toEqual({ total: 3 });
    expect(result.current.loading).toBe(false);
  });

  it('shares the in-flight section request with widgets that mount later', async () => {
    const deferred = createDeferredResponse<{ data: { healing: { instances_total: number; recent_instances: Array<{ id: string }> } } }>();
    getDashboardOverview.mockReturnValue(deferred.promise);
    const first = renderHook(() => useDashboardSection('healing'));
    const second = renderHook(() => useDashboardSection('healing'));

    expect(first.result.current.loading).toBe(true);
    expect(second.result.current.loading).toBe(true);
    expect(getDashboardOverview).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferred.resolve({
        data: {
          healing: {
            instances_total: 2,
            recent_instances: [{ id: 'inst-1' }],
          },
        },
      });
    });

    await waitFor(() => {
      expect(first.result.current.data).toEqual({
        instances_total: 2,
        recent_instances: [{ id: 'inst-1' }],
      });
      expect(second.result.current.data).toEqual({
        instances_total: 2,
        recent_instances: [{ id: 'inst-1' }],
      });
    });
  });

  it('updates the request scope when tenant context changes in the same tab', async () => {
    getDashboardOverview.mockResolvedValue({ data: { incidents: { total: 1 } } });

    renderHook(() => useDashboardSection('incidents'));
    expect(getDashboardOverview).toHaveBeenCalledTimes(1);

    mockGetTenantContextScopeKey.mockReturnValue('user-1:tenant:tenant-b');

    await act(async () => {
      subscriptions[0]?.();
    });

    expect(getDashboardOverview).toHaveBeenCalledTimes(2);
  });

  it('extracts section payloads from wrapped responses', () => {
    expect(__TEST_ONLY__.extractDashboardSectionData({
      data: {
        incidents: { total: 3 },
      },
    }, 'incidents')).toEqual({ total: 3 });
  });
});

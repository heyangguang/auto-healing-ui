import { act, renderHook } from '@testing-library/react';
import { __TEST_ONLY__, useDashboardSection } from './useDashboardSection';

const mockUseRequest = jest.fn();

jest.mock('@umijs/max', () => ({
  useRequest: (...args: unknown[]) => mockUseRequest(...args),
}));

jest.mock('@/services/auto-healing/dashboard', () => ({
  getDashboardOverview: jest.fn(),
}));

describe('useDashboardSection', () => {
  beforeEach(() => {
    mockUseRequest.mockReset();
    localStorage.clear();
    __TEST_ONLY__.clearResolvedSectionCache();
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
});

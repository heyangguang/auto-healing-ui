import { act, renderHook, waitFor } from '@testing-library/react';
import { useStandardTableRequestState } from './useStandardTableRequestState';

describe('useStandardTableRequestState', () => {
  it('loads request data and applies sorter changes', async () => {
    const request = jest
      .fn()
      .mockResolvedValueOnce({ data: [{ id: 'row-1' }], total: 1 })
      .mockResolvedValueOnce({ data: [{ id: 'row-2' }], total: 1 });

    const { result } = renderHook(() =>
      useStandardTableRequestState({
        request,
        defaultPageSize: 10,
        prefsLoaded: true,
        searchFilters: [],
        showAdvanced: false,
        advancedValues: {},
        advancedMatchModes: {},
      }),
    );

    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: 'row-1' }]);
    });

    expect(request).toHaveBeenCalledTimes(1);
    expect(result.current.total).toBe(1);

    act(() => {
      result.current.handleTableChange(undefined, undefined, {
        columnKey: 'created_at',
        order: 'descend',
      });
    });

    await waitFor(() => {
      expect(request).toHaveBeenCalledTimes(2);
    });

    expect(request).toHaveBeenNthCalledWith(2, {
      page: 1,
      pageSize: 10,
      searchField: undefined,
      searchValue: undefined,
      advancedSearch: undefined,
      sorter: { field: 'created_at', order: 'descend' },
    });
  });

  it('forwards search params through onSearch when request is absent', async () => {
    const onSearch = jest.fn();

    const { result } = renderHook(() =>
      useStandardTableRequestState({
        onSearch,
        defaultPageSize: 10,
        prefsLoaded: true,
        searchFilters: [{ field: 'name', label: '名称', value: 'ops' }],
        showAdvanced: true,
        advancedValues: { status: 'active' },
        advancedMatchModes: { status: 'exact' },
      }),
    );

    await act(async () => {
      await result.current.fetchData(1, 10);
    });

    expect(onSearch).toHaveBeenLastCalledWith({
      searchField: 'name',
      searchValue: 'ops',
      advancedSearch: { name: 'ops', status__exact: 'active' },
      filters: [{ field: 'name', value: 'ops' }],
    });
  });

  it('keeps only the latest request result when earlier requests resolve late', async () => {
    let resolveFirstRequest: ((value: { data: Array<{ id: string }>; total: number }) => void) | undefined;
    let resolveSecondRequest: ((value: { data: Array<{ id: string }>; total: number }) => void) | undefined;
    const request = jest
      .fn()
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolveFirstRequest = resolve;
      }))
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolveSecondRequest = resolve;
      }));

    const { result } = renderHook(() =>
      useStandardTableRequestState({
        request,
        defaultPageSize: 10,
        prefsLoaded: false,
        searchFilters: [],
        showAdvanced: false,
        advancedValues: {},
        advancedMatchModes: {},
      }),
    );

    await act(async () => {
      void result.current.fetchData(1, 10);
      void result.current.fetchData(2, 10);
    });

    await act(async () => {
      resolveSecondRequest?.({ data: [{ id: 'latest' }], total: 1 });
    });

    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: 'latest' }]);
    });

    await act(async () => {
      resolveFirstRequest?.({ data: [{ id: 'stale' }], total: 1 });
    });

    expect(result.current.data).toEqual([{ id: 'latest' }]);
  });
});

import { act, renderHook } from '@testing-library/react';
import { useStandardTableSearchState } from './useStandardTableSearchState';

describe('useStandardTableSearchState', () => {
  it('creates a text filter and requests page 1 on search', () => {
    const fetchData = jest.fn();
    const setPage = jest.fn();

    const { result } = renderHook(() =>
      useStandardTableSearchState({
        searchFields: [{ key: 'name', label: '名称' }],
        filterableCols: [],
      }),
    );

    act(() => {
      result.current.setSearchValue('pangolin');
    });

    act(() => {
      result.current.handleSearch({
        pageSize: 20,
        sorter: { field: 'created_at', order: 'descend' },
        fetchData,
        setPage,
      });
    });

    expect(result.current.searchFilters).toEqual([
      { field: 'name', label: '名称', value: 'pangolin' },
    ]);
    expect(result.current.searchValue).toBe('');
    expect(setPage).toHaveBeenCalledWith(1);
    expect(fetchData).toHaveBeenCalledWith(
      1,
      20,
      { field: 'created_at', order: 'descend' },
      [{ field: 'name', label: '名称', value: 'pangolin' }],
    );
  });

  it('resets search state when the search field list changes by content', () => {
    const _fetchData = jest.fn();
    const _setPage = jest.fn();

    const { result, rerender } = renderHook(
      ({ searchFields }) =>
        useStandardTableSearchState({
          searchFields,
          filterableCols: [],
        }),
      {
        initialProps: {
          searchFields: [{ key: 'name', label: '名称' }],
        },
      },
    );

    act(() => {
      result.current.setSearchValue('ops');
      result.current.setShowAdvanced(true);
      result.current.updateAdvancedField('name', 'ops');
    });

    rerender({
      searchFields: [{ key: 'status', label: '状态' }],
    });

    expect(result.current.searchField).toBe('status');
    expect(result.current.searchValue).toBe('');
    expect(result.current.showAdvanced).toBe(false);
    expect(result.current.advancedValues).toEqual({});
    expect(result.current.searchFilters).toEqual([]);
  });
});

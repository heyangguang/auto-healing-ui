import { useCallback, useEffect, useRef, useState } from 'react';

interface SearchFilterItem {
  field: string;
  label: string;
  value: string;
}

interface RequestStateParams<T extends Record<string, any>> {
  request?: (params: {
    page: number;
    pageSize: number;
    searchField?: string;
    searchValue?: string;
    advancedSearch?: Record<string, any>;
    sorter?: { field: string; order: 'ascend' | 'descend' };
  }) => Promise<{ data: T[]; total: number }>;
  onSearch?: (params: {
    searchField?: string;
    searchValue?: string;
    advancedSearch?: Record<string, any>;
    filters?: { field: string; value: string }[];
  }) => void;
  defaultPageSize: number;
  prefsLoaded: boolean;
  refreshTrigger?: number;
  searchFilters: SearchFilterItem[];
  showAdvanced: boolean;
  advancedValues: Record<string, any>;
  advancedMatchModes: Record<string, 'fuzzy' | 'exact'>;
}

const buildSearchPayload = ({
  activeFilters,
  showAdvanced,
  advancedValues,
  advancedMatchModes,
}: {
  activeFilters: SearchFilterItem[];
  showAdvanced: boolean;
  advancedValues: Record<string, any>;
  advancedMatchModes: Record<string, 'fuzzy' | 'exact'>;
}) => {
  const primaryFilter = activeFilters[0];
  const filtersAsSearch: Record<string, any> = {};

  activeFilters.forEach((filter) => {
    filtersAsSearch[filter.field] = filter.value;
  });

  let processedAdvanced: Record<string, any> | undefined;
  if (showAdvanced) {
    processedAdvanced = { ...filtersAsSearch };
    Object.entries(advancedValues).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      const mode = advancedMatchModes[key] || 'fuzzy';
      const finalKey = mode === 'exact' ? `${key}__exact` : key;
      processedAdvanced![finalKey] = value;
    });
  }

  return {
    primaryFilter,
    mergedAdvanced: showAdvanced
      ? processedAdvanced
      : activeFilters.length > 0
        ? filtersAsSearch
        : undefined,
  };
};

export function useStandardTableRequestState<T extends Record<string, any>>({
  request,
  onSearch,
  defaultPageSize,
  prefsLoaded,
  refreshTrigger,
  searchFilters,
  showAdvanced,
  advancedValues,
  advancedMatchModes,
}: RequestStateParams<T>) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sorter, setSorter] = useState<{ field: string; order: 'ascend' | 'descend' } | undefined>();

  const fetchData = useCallback(async (
    nextPage: number = page,
    nextPageSize: number = pageSize,
    nextSorter?: typeof sorter,
    filters?: SearchFilterItem[],
  ) => {
    const activeFilters = filters ?? searchFilters;
    const { primaryFilter, mergedAdvanced } = buildSearchPayload({
      activeFilters,
      showAdvanced,
      advancedValues,
      advancedMatchModes,
    });

    if (!request) {
      if (onSearch) {
        onSearch({
          searchField: primaryFilter?.field,
          searchValue: primaryFilter?.value,
          advancedSearch: mergedAdvanced,
          filters: activeFilters.map((filter) => ({ field: filter.field, value: filter.value })),
        });
      }
      return;
    }

    setLoading(true);
    try {
      const result = await request({
        page: nextPage,
        pageSize: nextPageSize,
        searchField: primaryFilter?.field,
        searchValue: primaryFilter?.value,
        advancedSearch: mergedAdvanced,
        sorter: nextSorter,
      });
      setData(result.data);
      setTotal(result.total);
    } catch {
      // Error handling is delegated to the request layer.
    } finally {
      setLoading(false);
    }
  }, [
    page,
    pageSize,
    sorter,
    request,
    onSearch,
    searchFilters,
    showAdvanced,
    advancedValues,
    advancedMatchModes,
  ]);

  useEffect(() => {
    if (!prefsLoaded) {
      return;
    }
    fetchData(page, pageSize, sorter, searchFilters);
  }, [page, pageSize, prefsLoaded]);

  const refreshTriggerRef = useRef(refreshTrigger);
  useEffect(() => {
    if (refreshTriggerRef.current !== undefined && refreshTrigger !== refreshTriggerRef.current) {
      fetchData(page, pageSize, sorter);
    }
    refreshTriggerRef.current = refreshTrigger;
  }, [refreshTrigger, fetchData, page, pageSize, sorter]);

  const handleRefresh = useCallback(() => {
    fetchData(page, pageSize, sorter);
  }, [fetchData, page, pageSize, sorter]);

  const handleTableChange = useCallback((_pagination: unknown, _filters: unknown, tableSorter: any) => {
    const sortField = tableSorter?.columnKey || tableSorter?.field || tableSorter?.column?.key;
    if (sortField && tableSorter?.order) {
      const nextSorter = { field: sortField as string, order: tableSorter.order as 'ascend' | 'descend' };
      setSorter(nextSorter);
      fetchData(page, pageSize, nextSorter, searchFilters);
      return;
    }
    setSorter(undefined);
    fetchData(page, pageSize, undefined, searchFilters);
  }, [fetchData, page, pageSize, searchFilters]);

  const handlePageChange = useCallback((nextPage: number, nextPageSize: number) => {
    setPage(nextPage);
    setPageSize(nextPageSize);
  }, []);

  return {
    loading,
    data,
    total,
    page,
    pageSize,
    sorter,
    setPage,
    fetchData,
    handleRefresh,
    handleTableChange,
    handlePageChange,
  };
}

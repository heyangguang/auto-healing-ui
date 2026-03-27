import { useCallback, useEffect, useRef, useState } from 'react';
import type { SorterResult } from 'antd/es/table/interface';
import { createRequestSequence } from '@/utils/requestSequence';
import type {
  StandardTableAdvancedSearchPayload,
  StandardTableSearchValues,
  StandardTableSort,
} from './types';

interface SearchFilterItem {
  field: string;
  label: string;
  value: string;
}

interface RequestStateParams<T extends object> {
    request?: (params: {
      page: number;
      pageSize: number;
      searchField?: string;
      searchValue?: string;
      advancedSearch?: StandardTableAdvancedSearchPayload;
      sorter?: StandardTableSort;
    }) => Promise<{ data: T[]; total: number }>;
    onSearch?: (params: {
      searchField?: string;
      searchValue?: string;
      advancedSearch?: StandardTableAdvancedSearchPayload;
      filters?: { field: string; value: string }[];
    }) => void;
  defaultPageSize: number;
  prefsLoaded: boolean;
  refreshTrigger?: number;
  searchFilters: SearchFilterItem[];
  showAdvanced: boolean;
  advancedValues: StandardTableSearchValues;
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
  advancedValues: StandardTableSearchValues;
  advancedMatchModes: Record<string, 'fuzzy' | 'exact'>;
}) => {
  const primaryFilter = activeFilters[0];
  const filtersAsSearch: StandardTableSearchValues = {};

  activeFilters.forEach((filter) => {
    filtersAsSearch[filter.field] = filter.value;
  });

  let processedAdvanced: StandardTableSearchValues | undefined;
  if (showAdvanced) {
    const nextAdvanced: StandardTableSearchValues = { ...filtersAsSearch };
    Object.entries(advancedValues).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      const mode = advancedMatchModes[key] || 'fuzzy';
      const finalKey = mode === 'exact' ? `${key}__exact` : key;
      nextAdvanced[finalKey] = value;
    });
    processedAdvanced = nextAdvanced;
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

export function useStandardTableRequestState<T extends object>({
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
  const [sorter, setSorter] = useState<StandardTableSort | undefined>();
  const requestSequenceRef = useRef(createRequestSequence());

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

    const requestToken = requestSequenceRef.current.next();
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
      if (!requestSequenceRef.current.isCurrent(requestToken)) {
        return;
      }
      setData(result.data);
      setTotal(result.total);
    } catch {
      // Error handling is delegated to the request layer.
    } finally {
      if (requestSequenceRef.current.isCurrent(requestToken)) {
        setLoading(false);
      }
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

  useEffect(() => () => {
    requestSequenceRef.current.invalidate();
  }, []);

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

  const handleTableChange = useCallback(
    (_pagination: unknown, _filters: unknown, tableSorter: SorterResult<T> | SorterResult<T>[]) => {
      const activeSorter = Array.isArray(tableSorter) ? tableSorter[0] : tableSorter;
      const sortField = activeSorter?.columnKey || activeSorter?.field || activeSorter?.column?.key;

      if (typeof sortField === 'string' && activeSorter?.order) {
        const nextSorter = {
          field: sortField,
          order: activeSorter.order,
        } satisfies StandardTableSort;

        setSorter(nextSorter);
        fetchData(page, pageSize, nextSorter, searchFilters);
        return;
      }

      setSorter(undefined);
      fetchData(page, pageSize, undefined, searchFilters);
    },
    [fetchData, page, pageSize, searchFilters],
  );

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

import { useCallback, useEffect, useRef, useState } from 'react';
import { createRequestSequence } from '@/utils/requestSequence';

interface UseAsyncModalSelectorOptions<T, F extends Record<string, any>> {
  open: boolean;
  value?: string;
  initialFilters: F;
  loadList: (page: number, search: string, filters: F) => Promise<{ items: T[]; total: number }>;
  loadDetail?: (id: string) => Promise<T | null>;
  getId: (item: T) => string;
  searchDebounceMs?: number;
}

export function useAsyncModalSelector<T, F extends Record<string, any>>({
  open,
  value,
  initialFilters,
  loadList,
  loadDetail,
  getId,
  searchDebounceMs = 300,
}: UseAsyncModalSelectorOptions<T, F>) {
  const initialFiltersRef = useRef(initialFilters);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const loadSequenceRef = useRef(createRequestSequence());
  const detailSequenceRef = useRef(createRequestSequence());

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<F>(initialFilters);
  const [selectedId, setSelectedId] = useState<string | undefined>(value);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const performLoad = useCallback(async (pageNum: number, query: string, nextFilters: F) => {
    const token = loadSequenceRef.current.next();
    setLoading(true);
    try {
      const result = await loadList(pageNum, query, nextFilters);
      if (!loadSequenceRef.current.isCurrent(token)) {
        return;
      }
      setItems(result.items);
      setTotal(result.total);
    } catch {
      if (!loadSequenceRef.current.isCurrent(token)) {
        return;
      }
      setItems([]);
      setTotal(0);
    } finally {
      if (loadSequenceRef.current.isCurrent(token)) {
        setLoading(false);
      }
    }
  }, [loadList]);

  useEffect(() => {
    initialFiltersRef.current = initialFilters;
  }, [initialFilters]);

  useEffect(() => {
    setSelectedId(value);
  }, [value]);

  useEffect(() => {
    if (!open) {
      loadSequenceRef.current.invalidate();
      detailSequenceRef.current.invalidate();
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
      setSearch('');
      setDebouncedSearch('');
      setFilters(initialFiltersRef.current);
      setPage(1);
      setLoading(false);
      return;
    }
    performLoad(page, debouncedSearch, filters);
  }, [open, page, debouncedSearch, filters, performLoad]);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
    }, searchDebounceMs);
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [open, search, searchDebounceMs]);

  useEffect(() => {
    if (!value || items.length === 0) {
      return;
    }
    const found = items.find((item) => getId(item) === value);
    if (found) {
      setSelectedItem(found);
      setSelectedId(value);
    }
  }, [items, value, getId]);

  useEffect(() => {
    if (!open || !value || !loadDetail) {
      return;
    }
    if (selectedItem && getId(selectedItem) === value) {
      return;
    }
    const token = detailSequenceRef.current.next();
    loadDetail(value)
      .then((item) => {
        if (!detailSequenceRef.current.isCurrent(token) || !item) {
          return;
        }
        setSelectedItem(item);
        setSelectedId(getId(item));
      })
      .catch(() => {
        // ignore stale / invalid selection
      });
  }, [open, value, loadDetail, selectedItem, getId]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleFilterChange = useCallback(<K extends keyof F>(key: K, value: F[K]) => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    setDebouncedSearch(search);
    setFilters((previous) => ({ ...previous, [key]: value }));
    setPage(1);
  }, [search]);

  const handlePageChange = useCallback((pageNum: number) => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    setDebouncedSearch(search);
    setPage(pageNum);
  }, [search]);

  const handleSelect = useCallback((item: T) => {
    setSelectedItem(item);
    setSelectedId(getId(item));
  }, [getId]);

  return {
    items,
    loading,
    total,
    page,
    search,
    filters,
    selectedId,
    selectedItem,
    handleSearchChange,
    handleFilterChange,
    handlePageChange,
    handleSelect,
  };
}

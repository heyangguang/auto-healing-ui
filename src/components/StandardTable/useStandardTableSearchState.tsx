import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

interface SearchFieldOption {
  key: string;
  label: string;
  description?: string;
  options?: { label: string; value: string }[];
}

interface FilterableColumn {
  columnKey: string;
  columnTitle: string;
  headerFilters?: { label: string; value: string }[];
}

interface SearchFilterItem {
  field: string;
  label: string;
  value: string;
  displayValue?: string;
}

interface UseStandardTableSearchStateParams {
  searchFields?: SearchFieldOption[];
  filterableCols: FilterableColumn[];
}

interface SearchActionContext {
  pageSize: number;
  sorter?: { field: string; order: 'ascend' | 'descend' };
  fetchData: (
    page?: number,
    pageSize?: number,
    sorter?: { field: string; order: 'ascend' | 'descend' },
    filters?: SearchFilterItem[],
  ) => Promise<void> | void;
  setPage: (page: number) => void;
}

export function useStandardTableSearchState({
  searchFields,
  filterableCols,
}: UseStandardTableSearchStateParams) {
  const [searchField, setSearchField] = useState<string>((searchFields || [])[0]?.key || '');
  const [searchValue, setSearchValue] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedValues, setAdvancedValues] = useState<Record<string, any>>({});
  const [advancedMatchModes, setAdvancedMatchModes] = useState<Record<string, 'fuzzy' | 'exact'>>({});
  const [searchFilters, setSearchFilters] = useState<SearchFilterItem[]>([]);

  const prevSearchKeysRef = useRef((searchFields || []).map((field) => field.key).join(','));
  useEffect(() => {
    const currentKeys = (searchFields || []).map((field) => field.key).join(',');
    const previousKeys = prevSearchKeysRef.current;
    prevSearchKeysRef.current = currentKeys;
    if (previousKeys === currentKeys) {
      return;
    }
    const firstKey = (searchFields || [])[0]?.key || '';
    setSearchField(firstKey);
    setSearchValue('');
    setSearchFilters([]);
    setShowAdvanced(false);
    setAdvancedValues({});
    setAdvancedMatchModes({});
  }, [searchFields]);

  const searchFieldOptions = useMemo((): any[] => {
    const fields = searchFields || [];
    const textGroup = fields
      .filter((field) => !field.key.startsWith('__enum__'))
      .map((field) => ({ label: field.label, value: field.key, desc: field.description }));

    const enumFromSearchFields = fields
      .filter((field) => field.key.startsWith('__enum__'))
      .map((field) => ({ label: field.label, value: field.key, desc: field.description }));

    const existingEnumKeys = new Set(enumFromSearchFields.map((field) => field.value));
    const enumFromCols = filterableCols
      .filter((column) => !existingEnumKeys.has(`__enum__${column.columnKey}`))
      .map((column) => ({ label: column.columnTitle, value: `__enum__${column.columnKey}` }));

    const enumGroup = [...enumFromSearchFields, ...enumFromCols];
    if (enumGroup.length === 0) {
      return textGroup;
    }
    return [
      { label: '文本字段', options: textGroup },
      { label: '枚举字段', options: enumGroup },
    ];
  }, [searchFields, filterableCols]);

  const searchFieldOptionRender = useCallback((option: any) => {
    const description = option.data?.desc;
    if (!description) {
      return option.label;
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <span>{option.label}</span>
        <Tooltip title={description} placement="right">
          <QuestionCircleOutlined style={{ color: '#bfbfbf', fontSize: 12 }} />
        </Tooltip>
      </div>
    );
  }, []);

  const isEnumField = searchField.startsWith('__enum__');
  const currentEnumSearchField = isEnumField
    ? (searchFields || []).find((field) => field.key === searchField)
    : undefined;
  const currentEnumCol = isEnumField
    ? (currentEnumSearchField
      ? undefined
      : filterableCols.find((column) => `__enum__${column.columnKey}` === searchField))
    : undefined;

  const handleSearch = useCallback((context: SearchActionContext) => {
    const { pageSize, sorter, fetchData, setPage } = context;
    if (showAdvanced) {
      setPage(1);
      fetchData(1, pageSize, sorter, searchFilters);
      return;
    }
    if (!searchValue.trim() && !isEnumField) {
      return;
    }
    if (isEnumField && (currentEnumCol || currentEnumSearchField)) {
      if (!searchValue) {
        return;
      }
      const realKey = currentEnumSearchField ? currentEnumSearchField.key : currentEnumCol!.columnKey;
      const displayLabel = currentEnumSearchField?.label || currentEnumCol?.columnTitle || realKey;
      const displayValue = currentEnumSearchField
        ? (currentEnumSearchField.options?.find((option) => option.value === searchValue)?.label || searchValue)
        : (currentEnumCol?.headerFilters?.find((option) => option.value === searchValue)?.label || searchValue);
      const nextFilters = [
        ...searchFilters.filter((filter) => filter.field !== realKey),
        { field: realKey, label: displayLabel, value: searchValue, displayValue },
      ];
      setSearchFilters(nextFilters);
      setSearchValue('');
      setPage(1);
      fetchData(1, pageSize, sorter, nextFilters);
      return;
    }
    const fieldKey = searchField;
    const fieldLabel = (searchFields || []).find((field) => field.key === searchField)?.label || searchField;
    const nextFilters = [
      ...searchFilters.filter((filter) => filter.field !== fieldKey),
      { field: fieldKey, label: fieldLabel, value: searchValue.trim() },
    ];
    setSearchFilters(nextFilters);
    setSearchValue('');
    setPage(1);
    fetchData(1, pageSize, sorter, nextFilters);
  }, [
    currentEnumCol,
    currentEnumSearchField,
    isEnumField,
    searchField,
    searchFields,
    searchFilters,
    searchValue,
    showAdvanced,
  ]);

  const handleRemoveFilter = useCallback((field: string, context: SearchActionContext) => {
    const { pageSize, sorter, fetchData, setPage } = context;
    const nextFilters = searchFilters.filter((filter) => filter.field !== field);
    setSearchFilters(nextFilters);
    setPage(1);
    fetchData(1, pageSize, sorter, nextFilters);
  }, [searchFilters]);

  const handleClearFilters = useCallback((context: SearchActionContext) => {
    const { pageSize, sorter, fetchData, setPage } = context;
    setSearchFilters([]);
    setPage(1);
    fetchData(1, pageSize, sorter, []);
  }, []);

  const handleReset = useCallback((context: SearchActionContext) => {
    const { pageSize, sorter, fetchData, setPage } = context;
    setAdvancedValues({});
    setAdvancedMatchModes({});
    setSearchValue('');
    setSearchField((searchFields || [])[0]?.key || '');
    setSearchFilters([]);
    setPage(1);
    fetchData(1, pageSize, sorter, []);
  }, [searchFields]);

  const updateAdvancedField = useCallback((key: string, value: any) => {
    setAdvancedValues((previous) => ({ ...previous, [key]: value }));
  }, []);

  const toggleAdvancedMatchMode = useCallback((key: string, defaultMatchMode: 'fuzzy' | 'exact' = 'fuzzy') => {
    setAdvancedMatchModes((previous) => {
      const current = previous[key] || defaultMatchMode;
      return { ...previous, [key]: current === 'fuzzy' ? 'exact' : 'fuzzy' };
    });
  }, []);

  return {
    searchField,
    searchValue,
    showAdvanced,
    advancedValues,
    advancedMatchModes,
    searchFilters,
    searchFieldOptions,
    searchFieldOptionRender,
    isEnumField: isEnumField && !!(currentEnumCol || currentEnumSearchField),
    currentEnumLabel: currentEnumSearchField?.label || currentEnumCol?.columnTitle,
    currentEnumOptions: currentEnumSearchField?.options || currentEnumCol?.headerFilters,
    setSearchField,
    setSearchValue,
    setShowAdvanced,
    handleSearch,
    handleRemoveFilter,
    handleClearFilters,
    handleReset,
    updateAdvancedField,
    toggleAdvancedMatchMode,
  };
}

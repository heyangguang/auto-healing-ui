import React, { type ReactNode } from 'react';
import { Button, Input, Select, Space, Tooltip } from 'antd';
import type { FlattenOptionData } from 'rc-select/lib/interface';
import {
  ColumnWidthOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type {
  AdvancedSearchField,
  StandardTableSearchValues,
} from './types';
import AdvancedSearchPanel from './AdvancedSearchPanel';
import FilterTags from './FilterTags';

interface EnumOption {
  label: string;
  value: string;
}

interface SearchFilter {
  field: string;
  label: string;
  value: string;
  displayValue?: string;
}

interface SearchFieldOptionItem {
  label: string;
  value: string;
  desc?: string;
}

interface SearchFieldOption {
  label: string;
  value?: string;
  desc?: string;
  options?: SearchFieldOptionItem[];
}

interface StandardTableSearchShellProps {
  searchField: string;
  searchValue: string;
  onSearchFieldChange: (value: string) => void;
  onSearchValueChange: (value: string) => void;
  onSearch: () => void;
  searchFieldOptions: SearchFieldOption[];
  searchFieldOptionRender: (option: FlattenOptionData<SearchFieldOption>) => ReactNode;
  isEnumField: boolean;
  currentEnumLabel?: string;
  currentEnumOptions?: EnumOption[];
  searchExtra?: ReactNode;
  showAdvancedToggle: boolean;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  extraToolbarActions?: ReactNode;
  showColumnWidthReset?: boolean;
  onResetColumnWidths?: () => void;
  showColumnSettingsButton?: boolean;
  onOpenColumnSettings?: () => void;
  onRefresh: () => void;
  onPrimaryAction?: () => void;
  primaryActionDisabled?: boolean;
  primaryActionIcon?: ReactNode;
  primaryActionLabel?: string;
  filters: SearchFilter[];
  onRemoveFilter: (field: string) => void;
  onClearFilters: () => void;
  advancedFields?: AdvancedSearchField[];
  advancedValues: StandardTableSearchValues;
  advancedMatchModes: Record<string, 'fuzzy' | 'exact'>;
  onAdvancedFieldChange: (key: string, value: unknown) => void;
  onAdvancedToggleMatchMode: (key: string, defaultMatchMode?: 'fuzzy' | 'exact') => void;
  onResetAdvanced: () => void;
  onCollapseAdvanced: () => void;
}

function StandardTableSearchShell({
  searchField,
  searchValue,
  onSearchFieldChange,
  onSearchValueChange,
  onSearch,
  searchFieldOptions,
  searchFieldOptionRender,
  isEnumField,
  currentEnumLabel,
  currentEnumOptions,
  searchExtra,
  showAdvancedToggle,
  showAdvanced,
  onToggleAdvanced,
  extraToolbarActions,
  showColumnWidthReset = false,
  onResetColumnWidths,
  showColumnSettingsButton = false,
  onOpenColumnSettings,
  onRefresh,
  onPrimaryAction,
  primaryActionDisabled,
  primaryActionIcon,
  primaryActionLabel,
  filters,
  onRemoveFilter,
  onClearFilters,
  advancedFields,
  advancedValues,
  advancedMatchModes,
  onAdvancedFieldChange,
  onAdvancedToggleMatchMode,
  onResetAdvanced,
  onCollapseAdvanced,
}: StandardTableSearchShellProps) {
  return (
    <>
      <div className="standard-table-toolbar">
        <div className="standard-table-search-left">
          <Space.Compact>
            <span className="standard-table-search-icon" aria-hidden="true">
              <SearchOutlined />
            </span>
            <Select
              value={searchField}
              onChange={(value) => onSearchFieldChange(value)}
              options={searchFieldOptions}
              optionRender={searchFieldOptionRender}
              style={{ width: 140 }}
              popupMatchSelectWidth={false}
            />
            {isEnumField ? (
              <Select
                value={searchValue || undefined}
                onChange={(value) => onSearchValueChange(value || '')}
                placeholder={`选择${currentEnumLabel}`}
                style={{ width: 200 }}
                allowClear
                options={currentEnumOptions}
              />
            ) : (
              <Input
                value={searchValue}
                onChange={(event) => onSearchValueChange(event.target.value)}
                onPressEnter={onSearch}
                placeholder="输入关键字进行搜索"
                style={{ width: 200 }}
                allowClear
              />
            )}
            <Button type="primary" onClick={onSearch}>
              搜索
            </Button>
          </Space.Compact>
          {searchExtra}
        </div>
        <div className="standard-table-search-right">
          {showAdvancedToggle && (
            <button
              type="button"
              className="standard-table-advanced-toggle"
              onClick={onToggleAdvanced}
            >
              {showAdvanced ? '收起高级搜索' : '高级搜索'}
            </button>
          )}
          <div className="standard-table-toolbar-divider" />
          <div className="standard-table-toolbar-group">
            {extraToolbarActions}
            {showColumnWidthReset && onResetColumnWidths && (
              <Tooltip title="重置列宽">
                <Button
                  aria-label="重置列宽"
                  icon={<ColumnWidthOutlined />}
                  onClick={onResetColumnWidths}
                />
              </Tooltip>
            )}
            {showColumnSettingsButton && onOpenColumnSettings && (
              <Tooltip title="显示字段及排序">
                <Button
                  aria-label="显示字段及排序"
                  icon={<SettingOutlined />}
                  onClick={onOpenColumnSettings}
                />
              </Tooltip>
            )}
            <Tooltip title="刷新">
              <Button aria-label="刷新" icon={<ReloadOutlined />} onClick={onRefresh} />
            </Tooltip>
          </div>
          {onPrimaryAction && (
            <>
              <div className="standard-table-toolbar-divider" />
              <Button
                type="primary"
                icon={primaryActionIcon || <PlusOutlined />}
                disabled={primaryActionDisabled}
                onClick={onPrimaryAction}
              >
                {primaryActionLabel || '创建'}
              </Button>
            </>
          )}
        </div>
      </div>

      <FilterTags filters={filters} onRemove={onRemoveFilter} onClear={onClearFilters} />

      {showAdvanced && advancedFields && advancedFields.length > 0 && (
        <AdvancedSearchPanel
          fields={advancedFields}
          values={advancedValues}
          matchModes={advancedMatchModes}
          onFieldChange={onAdvancedFieldChange}
          onToggleMatchMode={onAdvancedToggleMatchMode}
          onSearch={onSearch}
          onReset={onResetAdvanced}
          onCollapse={onCollapseAdvanced}
        />
      )}
    </>
  );
}

export default StandardTableSearchShell;

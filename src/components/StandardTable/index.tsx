import React, { useState, useMemo, useRef } from 'react';
import { Pagination, Table } from 'antd';
import ColumnSettingsModal, { type ColumnSettingItem } from './ColumnSettingsModal';
import ResizableTitle from './ResizableTitle';
import StandardTableSearchShell from './StandardTableSearchShell';
import StandardTableHeader from './StandardTableHeader';
import StandardTableSchemaErrorAlert from './StandardTableSchemaErrorAlert';
import { useStandardTableColumns } from './useStandardTableColumns';
import { useStandardTablePreferences } from './useStandardTablePreferences';
import { useStandardTableRequestState } from './useStandardTableRequestState';
import { useStandardTableSearchSchema } from './useStandardTableSearchSchema';
import { useStandardTableSearchState } from './useStandardTableSearchState';
import type { StandardTableProps } from './types';
export type {
    AdvancedSearchField,
    SearchField,
    StandardColumnDef,
    StandardTableFilter,
    StandardTableProps,
    StandardTableSearchValues,
    StandardTableSort,
} from './types';
import './index.css';

/* ========== 组件 ========== */

function StandardTable<T extends object>({
    tabs,
    title,
    description,
    activeTab,
    onTabChange,
    headerIcon,
    headerExtra,
    afterHeader,
    children,
    searchFields,
    advancedSearchFields,
    primaryActionLabel,
    primaryActionIcon,
    primaryActionDisabled,
    onPrimaryAction,
    extraToolbarActions,
    onSearch,
    searchExtra,
    columns: columnDefs,
    rowKey,
    onRowClick,
    rowSelection,
    request,
    defaultPageSize = 10,
    preferenceKey,
    refreshTrigger,
    searchSchemaRequest,
}: StandardTableProps<T>) {
    const {
        effectiveAdvancedSearchFields,
        schemaLoadError,
    } = useStandardTableSearchSchema(
        advancedSearchFields,
        searchSchemaRequest,
    );
    /* ---- 表格状态 ---- */
    const [columnSettingsOpen, setColumnSettingsOpen] = useState(false);
    const {
        prefsLoaded,
        columnWidths,
        columnSettings,
        updateColumnWidths,
        applyColumnSettings,
    } = useStandardTablePreferences(columnDefs, preferenceKey);
    /* ---- 提取有 headerFilters 的列定义 ---- */
    const filterableCols = useMemo(() =>
        (columnDefs || []).filter(c => c.headerFilters && c.headerFilters.length > 0),
        [columnDefs]);
    const {
        searchField,
        searchValue,
        showAdvanced,
        advancedValues,
        advancedMatchModes,
        searchFilters,
        searchFieldOptions,
        searchFieldOptionRender,
        isEnumField,
        currentEnumLabel,
        currentEnumOptions,
        setSearchField,
        setSearchValue,
        setShowAdvanced,
        handleSearch,
        handleRemoveFilter,
        handleClearFilters,
        handleReset,
        updateAdvancedField,
        toggleAdvancedMatchMode,
    } = useStandardTableSearchState({
        searchFields,
        filterableCols,
    });
    const {
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
    } = useStandardTableRequestState<T>({
        request,
        onSearch,
        defaultPageSize,
        prefsLoaded,
        refreshTrigger,
        searchFilters,
        showAdvanced,
        advancedValues,
        advancedMatchModes,
    });

    /* ---- 表格 body 容器 ref（用于读取列实际像素宽度） ---- */
    const tableBodyRef = useRef<HTMLDivElement>(null);

    const { visibleColumns } = useStandardTableColumns<T>({
        columnDefs,
        columnSettings,
        columnWidths,
        updateColumnWidths,
        tableBodyRef,
    });

    return (
        <div className="standard-table-container">
            <StandardTableHeader
                activeTab={activeTab}
                description={description}
                headerExtra={headerExtra}
                headerIcon={headerIcon}
                onTabChange={onTabChange}
                tabs={tabs}
                title={title}
            />

            {/* ===== header 和表格之间的自定义内容 ===== */}
            {afterHeader}

            {/* ===== 自定义内容 or 默认表格 ===== */}
            {children ? (
                <div className="standard-table-main">
                    {schemaLoadError && <StandardTableSchemaErrorAlert error={schemaLoadError} />}
                    {/* children 模式下如果有 searchFields，渲染内置工具栏 */}
                    {searchFields && searchFields.length > 0 && (
                        <StandardTableSearchShell
                            searchField={searchField}
                            searchValue={searchValue}
                            onSearchFieldChange={(value) => {
                                setSearchField(value);
                                setSearchValue('');
                            }}
                            onSearchValueChange={setSearchValue}
                            onSearch={() => handleSearch({ pageSize, sorter, fetchData, setPage })}
                            searchFieldOptions={searchFieldOptions}
                            searchFieldOptionRender={searchFieldOptionRender}
                            isEnumField={isEnumField}
                            currentEnumLabel={currentEnumLabel}
                            currentEnumOptions={currentEnumOptions}
                            searchExtra={searchExtra}
                            showAdvancedToggle={!!(effectiveAdvancedSearchFields && effectiveAdvancedSearchFields.length > 0)}
                            showAdvanced={showAdvanced}
                            onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
                            extraToolbarActions={extraToolbarActions}
                            onRefresh={handleRefresh}
                            onPrimaryAction={onPrimaryAction}
                            primaryActionDisabled={primaryActionDisabled}
                            primaryActionIcon={primaryActionIcon}
                            primaryActionLabel={primaryActionLabel}
                            filters={searchFilters}
                            onRemoveFilter={(field) => handleRemoveFilter(field, { pageSize, sorter, fetchData, setPage })}
                            onClearFilters={() => handleClearFilters({ pageSize, sorter, fetchData, setPage })}
                            advancedFields={effectiveAdvancedSearchFields}
                            advancedValues={advancedValues}
                            advancedMatchModes={advancedMatchModes}
                            onAdvancedFieldChange={updateAdvancedField}
                            onAdvancedToggleMatchMode={toggleAdvancedMatchMode}
                            onResetAdvanced={() => handleReset({ pageSize, sorter, fetchData, setPage })}
                            onCollapseAdvanced={() => setShowAdvanced(false)}
                        />
                    )}
                    {children}
                </div>
            ) : (
                <div className="standard-table-main">
                    {schemaLoadError && <StandardTableSchemaErrorAlert error={schemaLoadError} />}
                    {/* ===== 搜索工具栏 ===== */}
                    <StandardTableSearchShell
                        searchField={searchField}
                        searchValue={searchValue}
                        onSearchFieldChange={(value) => {
                            setSearchField(value);
                            setSearchValue('');
                        }}
                        onSearchValueChange={setSearchValue}
                        onSearch={() => handleSearch({ pageSize, sorter, fetchData, setPage })}
                        searchFieldOptions={searchFieldOptions}
                        searchFieldOptionRender={searchFieldOptionRender}
                        isEnumField={isEnumField}
                        currentEnumLabel={currentEnumLabel}
                        currentEnumOptions={currentEnumOptions}
                        searchExtra={searchExtra}
                        showAdvancedToggle={!!(effectiveAdvancedSearchFields && effectiveAdvancedSearchFields.length > 0)}
                        showAdvanced={showAdvanced}
                        onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
                        extraToolbarActions={extraToolbarActions}
                        showColumnWidthReset={Object.keys(columnWidths).length > 0}
                        onResetColumnWidths={() => updateColumnWidths({})}
                        showColumnSettingsButton
                        onOpenColumnSettings={() => setColumnSettingsOpen(true)}
                        onRefresh={handleRefresh}
                        onPrimaryAction={onPrimaryAction}
                        primaryActionDisabled={primaryActionDisabled}
                        primaryActionIcon={primaryActionIcon}
                        primaryActionLabel={primaryActionLabel}
                        filters={searchFilters}
                        onRemoveFilter={(field) => handleRemoveFilter(field, { pageSize, sorter, fetchData, setPage })}
                        onClearFilters={() => handleClearFilters({ pageSize, sorter, fetchData, setPage })}
                        advancedFields={effectiveAdvancedSearchFields}
                        advancedValues={advancedValues}
                        advancedMatchModes={advancedMatchModes}
                        onAdvancedFieldChange={updateAdvancedField}
                        onAdvancedToggleMatchMode={toggleAdvancedMatchMode}
                        onResetAdvanced={() => handleReset({ pageSize, sorter, fetchData, setPage })}
                        onCollapseAdvanced={() => setShowAdvanced(false)}
                    />

                    {/* ===== 数据表格 ===== */}
                    <div ref={tableBodyRef} className={`standard-table-body${data.length > 0 ? ' standard-table-has-data' : ''}${Object.keys(columnWidths).length > 0 ? ' standard-table-fixed-layout' : ''}`}>
                        <Table<T>
                            columns={visibleColumns}
                            dataSource={data}
                            rowKey={rowKey}
                            tableLayout={Object.keys(columnWidths).length > 0 ? 'fixed' : undefined}
                            loading={loading}
                            pagination={false}
                            onChange={handleTableChange}
                            components={{ header: { cell: ResizableTitle } }}
                            rowSelection={rowSelection}
                            scroll={{ x: Math.max(visibleColumns.reduce((sum, col) => sum + (Number(col.width) || 120), 0), 800) }}
                            onRow={onRowClick ? (record) => ({
                                onClick: (e) => {
                                    // 排除操作区域内的交互元素和勾选框
                                    const target = e.target as HTMLElement;
                                    if (target.closest('button, a, input, label, .ant-switch, .ant-btn, .ant-popover, .ant-popconfirm, .ant-checkbox-wrapper, .ant-checkbox, .ant-table-selection-column, svg')) return;
                                    onRowClick(record);
                                },
                                style: { cursor: 'pointer' },
                            }) : undefined}
                        />
                    </div>

                    {/* ===== 分页 ===== */}
                    <div className="standard-table-footer">
                        <Pagination
                            current={page}
                            pageSize={pageSize}
                            total={total}
                            showTotal={(t) => `共 ${t} 条`}
                            showSizeChanger={{ showSearch: false }}
                            pageSizeOptions={[10, 20, 50, 100]}
                            showQuickJumper
                            onChange={handlePageChange}
                            onShowSizeChange={(_current, size) => handlePageChange(1, size)}
                        />
                    </div>

                    {/* ===== 列设置弹窗 ===== */}
                    <ColumnSettingsModal
                        open={columnSettingsOpen}
                        onClose={() => setColumnSettingsOpen(false)}
                        columns={columnSettings}
                        onConfirm={(newSettings: ColumnSettingItem[]) => applyColumnSettings(newSettings)}
                    />
                </div>
            )}
        </div>
    );
}

export default StandardTable;
export type { ColumnSettingItem };

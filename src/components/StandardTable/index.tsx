import React, { useState, useMemo, useRef, ReactNode } from 'react';
import { Table, Pagination, Tabs } from 'antd';
import type { TabsProps } from 'antd';
import type { ColumnType } from 'antd/es/table';
import type { TableRowSelection } from 'antd/es/table/interface';
import ColumnSettingsModal, { ColumnSettingItem } from './ColumnSettingsModal';
import ResizableTitle from './ResizableTitle';
import StandardTableSearchShell from './StandardTableSearchShell';
import { useStandardTableColumns } from './useStandardTableColumns';
import { useStandardTablePreferences } from './useStandardTablePreferences';
import { useStandardTableRequestState } from './useStandardTableRequestState';
import { useStandardTableSearchSchema } from './useStandardTableSearchSchema';
import { useStandardTableSearchState } from './useStandardTableSearchState';
import './index.css';

/* ========== 类型定义 ========== */

/** 搜索字段定义 */
export interface SearchField {
    key: string;
    label: string;
    placeholder?: string;
    /** 字段说明（下拉选项旁显示 ? 图标，hover 展示此说明） */
    description?: string;
    /** 枚举选项（设置后该字段使用 Select 而非 Input，key 需以 __enum__ 开头） */
    options?: { label: string; value: string }[];
}

/** 高级搜索字段定义 */
export interface AdvancedSearchField {
    key: string;
    label: string;
    type: 'input' | 'select' | 'multiSelect' | 'dateRange';
    placeholder?: string;
    /** 字段说明（label 旁显示 ? 图标，hover 展示此说明） */
    description?: string;
    options?: { label: string; value: string }[];
    /** 默认匹配模式，仅对 input 类型有效。默认 'fuzzy'（模糊） */
    defaultMatchMode?: 'fuzzy' | 'exact';
}

/** 列定义（扩展 antd 原生） */
export interface StandardColumnDef<T> extends ColumnType<T> {
    /** 唯一标识符 */
    columnKey: string;
    /** 显示标题 */
    columnTitle: string;
    /** 列配置：是否固定不可移除 */
    fixedColumn?: boolean;
    /** 列配置：默认是否可见 */
    defaultVisible?: boolean;
    /** 表头筛选下拉选项（枚举型列，如状态） */
    headerFilters?: { label: string; value: string }[];
}

/** StandardTable 配置 */
export interface StandardTableProps<T extends Record<string, any>> {
    /* ---- 头部 Tabs ---- */
    tabs?: TabsProps['items'];
    activeTab?: string;
    onTabChange?: (key: string) => void;
    title: string;
    description: string;
    headerIcon?: ReactNode;
    /** 头部卡片底部的额外内容（如统计栏），渲染在 header 卡片内部、title 下方 */
    headerExtra?: ReactNode;
    /** header 卡片与搜索/表格之间的内容（如可视化卡片），渲染在 header 外部 */
    afterHeader?: ReactNode;
    /** children 模式下的搜索回调（无 request 时由外部处理数据过滤） */
    onSearch?: (params: { searchField?: string; searchValue?: string; advancedSearch?: Record<string, any>; filters?: { field: string; value: string }[] }) => void;
    /** 搜索按钮旁的额外内容（如范围切换按钮），渲染在 Space.Compact 之后 */
    searchExtra?: ReactNode;

    /* ---- 自定义内容（传了 children 时跳过搜索/表格/分页，只渲染 header + children） ---- */
    children?: ReactNode;

    /* ---- 搜索 ---- */
    searchFields?: SearchField[];
    advancedSearchFields?: AdvancedSearchField[];

    /* ---- 工具栏按钮 ---- */
    primaryActionLabel?: string;
    primaryActionIcon?: ReactNode;
    primaryActionDisabled?: boolean;
    onPrimaryAction?: () => void;
    extraToolbarActions?: ReactNode;

    /* ---- 表格 ---- */
    columns?: StandardColumnDef<T>[];
    rowKey?: string;
    /** 行点击回调（操作列内的按钮/开关等交互元素不会触发） */
    onRowClick?: (record: T) => void;
    /** 行选择配置（透传给 AntD Table.rowSelection） */
    rowSelection?: TableRowSelection<T>;

    /* ---- 数据请求 ---- */
    request?: (params: {
        page: number;
        pageSize: number;
        searchField?: string;
        searchValue?: string;
        advancedSearch?: Record<string, any>;
        sorter?: { field: string; order: 'ascend' | 'descend' };
    }) => Promise<{ data: T[]; total: number }>;

    /* ---- 默认分页 ---- */
    defaultPageSize?: number;
    /** 偏好持久化 key 前缀 (如 "user_list")，设置后自动保存/恢复列宽和列配置 */
    preferenceKey?: string;
    /** 外部刷新触发器，值变化时自动重新请求数据（避免用 key 强制重装组件） */
    refreshTrigger?: number;
    /** 后端搜索 schema URL（如 '/api/v1/plugins/search-schema'），
     *  提供时自动获取声明式搜索字段，替代静态 advancedSearchFields */
    searchSchemaUrl?: string;
}

/* ========== 组件 ========== */

function StandardTable<T extends Record<string, any>>({
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
    searchSchemaUrl,
}: StandardTableProps<T>) {
    const { effectiveAdvancedSearchFields } = useStandardTableSearchSchema(
        advancedSearchFields,
        searchSchemaUrl,
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
            {/* ===== 头部区域 ===== */}
            <div className="standard-table-header">
                {tabs && tabs.length > 0 && (
                    <Tabs
                        activeKey={activeTab}
                        onChange={onTabChange}
                        items={tabs}
                        className="standard-table-tabs"
                    />
                )}
                <div className="standard-table-header-content">
                    <div className="standard-table-header-left">
                        <h2 className="standard-table-title">{title}</h2>
                        <p className="standard-table-description">{description}</p>
                    </div>
                    {headerIcon && (
                        <div className="standard-table-header-icon">
                            {headerIcon}
                        </div>
                    )}
                </div>
                {headerExtra}
            </div>

            {/* ===== header 和表格之间的自定义内容 ===== */}
            {afterHeader}

            {/* ===== 自定义内容 or 默认表格 ===== */}
            {children ? (
                <div className="standard-table-main">
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
                            onShowSizeChange={(current, size) => handlePageChange(1, size)}
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

import type { ReactNode } from 'react';
import type { ColumnType } from 'antd/es/table';
import type { TableRowSelection } from 'antd/es/table/interface';
import type { SearchSchemaRequest } from '@/services/auto-healing/searchSchema';

export interface SearchField {
    key: string;
    label: string;
    placeholder?: string;
    description?: string;
    options?: { label: string; value: string }[];
}

export interface AdvancedSearchField {
    key: string;
    label: string;
    type: 'input' | 'select' | 'multiSelect' | 'dateRange';
    placeholder?: string;
    description?: string;
    options?: { label: string; value: string }[];
    defaultMatchMode?: 'fuzzy' | 'exact';
}

export interface StandardColumnDef<T> extends ColumnType<T> {
    columnKey: string;
    columnTitle: string;
    fixedColumn?: boolean;
    defaultVisible?: boolean;
    headerFilters?: { label: string; value: string }[];
}

export type StandardTableSort = {
    field: string;
    order: 'ascend' | 'descend';
};

export type StandardTableSearchValues = Record<string, unknown>;
export type StandardTableFilter = { field: string; value: string };
export type StandardTableAdvancedSearchPayload = StandardTableSearchValues;

export interface StandardTableProps<T extends object> {
    tabs?: import('antd').TabsProps['items'];
    activeTab?: string;
    onTabChange?: (key: string) => void;
    title: string;
    description: string;
    headerIcon?: ReactNode;
    headerExtra?: ReactNode;
    afterHeader?: ReactNode;
    onSearch?: (params: {
        searchField?: string;
        searchValue?: string;
        advancedSearch?: StandardTableAdvancedSearchPayload;
        filters?: StandardTableFilter[];
    }) => void;
    searchExtra?: ReactNode;
    children?: ReactNode;
    searchFields?: SearchField[];
    advancedSearchFields?: AdvancedSearchField[];
    primaryActionLabel?: string;
    primaryActionIcon?: ReactNode;
    primaryActionDisabled?: boolean;
    onPrimaryAction?: () => void;
    extraToolbarActions?: ReactNode;
    columns?: StandardColumnDef<T>[];
    rowKey?: string;
    onRowClick?: (record: T) => void;
    rowSelection?: TableRowSelection<T>;
    request?: (params: {
        page: number;
        pageSize: number;
        searchField?: string;
        searchValue?: string;
        advancedSearch?: StandardTableAdvancedSearchPayload;
        sorter?: StandardTableSort;
    }) => Promise<{ data: T[]; total: number }>;
    defaultPageSize?: number;
    preferenceKey?: string;
    refreshTrigger?: number;
    searchSchemaRequest?: SearchSchemaRequest;
}

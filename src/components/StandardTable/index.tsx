import React, { useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import {
    Input, Select, Button, Table, Pagination, Space, DatePicker,
    Tooltip, Flex, Tag, Tabs,
} from 'antd';
import type { TabsProps } from 'antd';
import type { ColumnsType, ColumnType } from 'antd/es/table';
import type { TablePaginationConfig, TableRowSelection } from 'antd/es/table/interface';
import {
    SearchOutlined, ReloadOutlined, SettingOutlined,
    PlusOutlined, CloseOutlined, ColumnWidthOutlined, QuestionCircleOutlined,
} from '@ant-design/icons';
import { getPreferences, patchPreferences } from '@/services/auto-healing/preferences';
import ColumnSettingsModal, { ColumnSettingItem } from './ColumnSettingsModal';
import './index.css';

const { RangePicker } = DatePicker;

/* ========== 偏好请求去重缓存 ========== */
// 多个 StandardTable 实例同时挂载时，共享同一个偏好请求
let prefsCachePromise: Promise<any> | null = null;
let prefsCacheResult: any = null;
let prefsCacheTime = 0;
const PREFS_CACHE_TTL = 10_000; // 10 秒有效

const getCachedPreferences = async () => {
    const now = Date.now();
    if (prefsCacheResult && now - prefsCacheTime < PREFS_CACHE_TTL) {
        return prefsCacheResult;
    }
    if (prefsCachePromise) return prefsCachePromise;
    prefsCachePromise = getPreferences()
        .then(res => {
            prefsCacheResult = res;
            prefsCacheTime = Date.now();
            return res;
        })
        .finally(() => { prefsCachePromise = null; });
    return prefsCachePromise;
};

/* ========== 可拖拽表头 ========== */
const ResizableTitle = (props: any) => {
    const { onResizeEnd, width, ...restProps } = props;
    const thRef = useRef<HTMLTableCellElement>(null);

    if (!onResizeEnd) return <th {...restProps} />;

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const th = thRef.current;
        if (!th) return;

        const startX = e.clientX;
        const startWidth = th.offsetWidth;

        const table = th.closest('table');
        const tr = th.parentElement!;
        const allThs = Array.from(tr.children) as HTMLElement[];
        const myIndex = allThs.indexOf(th);
        const allCols = Array.from(
            table?.querySelectorAll('colgroup > col') ?? []
        ) as HTMLElement[];

        let activated = false;
        let origLayout = '';
        let origColWidths: string[] = [];
        let origMinWidth = '';
        let origTableStyleWidth = '';
        let snapshotTableW = 0;
        let snapshotThWidths: number[] = []; // activate 时所有 th 的像素宽度

        // ★ 阻止松手后浏览器自动生成的 click 事件冒泡到 AntD 触发排序
        const blockClick = (ev: MouseEvent) => {
            ev.stopPropagation();
            ev.preventDefault();
        };
        th.addEventListener('click', blockClick, { capture: true, once: true });

        const activate = () => {
            origColWidths = allCols.map(col => col.style.width);
            snapshotThWidths = allThs.map(t => t.offsetWidth);
            allCols.forEach((col, i) => {
                if (snapshotThWidths[i]) col.style.width = `${snapshotThWidths[i]}px`;
            });
            origLayout = table?.style.tableLayout ?? '';
            if (table) {
                // ★ 关键：先锁定表格总宽度为当前像素值
                // 在 fixed 布局下如果不显式设置 width，浏览器用容器宽度，
                // 缩小某列时多余空间被按比例重新分配给所有列
                snapshotTableW = table.offsetWidth;
                origTableStyleWidth = table.style.width;
                table.style.width = `${snapshotTableW}px`;
                table.style.tableLayout = 'fixed';
                origMinWidth = table.style.minWidth;
                table.style.minWidth = '0';
            }
            activated = true;
        };

        const onMouseMove = (ev: MouseEvent) => {
            const delta = ev.clientX - startX;
            if (!activated && Math.abs(delta) < 3) return;
            if (!activated) activate();
            const w = Math.max(60, startWidth + delta);
            if (allCols[myIndex]) {
                allCols[myIndex].style.width = `${w}px`;
            }
            // ★ 同步调整表格总宽度 = 快照宽度 + 列宽变化量
            // 这样缩列时表格也跟着缩窄，不会有多余空间被浏览器重新分配
            if (table) {
                table.style.width = `${snapshotTableW + (w - startWidth)}px`;
            }
        };

        const onMouseUp = (ev: MouseEvent) => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            if (activated) {
                const newWidth = Math.max(60, startWidth + (ev.clientX - startX));

                // ★ 先通知 React 保存宽度（此时 DOM 还在 fixed 布局，snapshotThWidths 精确）
                // snapshotThWidths 在 activate() 时捕获，是切换到 fixed 前的精确像素值
                onResizeEnd(newWidth, snapshotThWidths);

                // ★ 然后恢复所有临时 DOM 修改，让 React/AntD 重新接管布局
                if (table) {
                    table.style.tableLayout = origLayout;
                    table.style.minWidth = origMinWidth;
                    table.style.width = origTableStyleWidth;
                }
                allCols.forEach((col, i) => {
                    if (i === myIndex) {
                        col.style.width = `${newWidth}px`;
                    } else {
                        col.style.width = origColWidths[i] ?? '';
                    }
                });
            }
            setTimeout(() => th.removeEventListener('click', blockClick, { capture: true } as any), 50);
        };

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };


    return (
        <th {...restProps} ref={thRef}>
            {restProps.children}
            <span className="column-resize-handle" onMouseDown={handleMouseDown} />
        </th>
    );
};

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
    type: 'input' | 'select' | 'dateRange';
    placeholder?: string;
    /** 字段说明（label 旁显示 ? 图标，hover 展示此说明） */
    description?: string;
    options?: { label: string; value: string }[];
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
    /** children 模式下的搜索回调（无 request 时由外部处理数据过滤） */
    onSearch?: (params: { searchField?: string; searchValue?: string; advancedSearch?: Record<string, any>; filters?: { field: string; value: string }[] }) => void;

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
    children,
    searchFields,
    advancedSearchFields,
    primaryActionLabel,
    primaryActionIcon,
    primaryActionDisabled,
    onPrimaryAction,
    extraToolbarActions,
    onSearch,
    columns: columnDefs,
    rowKey,
    onRowClick,
    rowSelection,
    request,
    defaultPageSize = 10,
    preferenceKey,
    refreshTrigger,
}: StandardTableProps<T>) {
    /* ---- 搜索状态 ---- */
    const [searchField, setSearchField] = useState<string>((searchFields || [])[0]?.key || '');
    const [searchValue, setSearchValue] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [advancedValues, setAdvancedValues] = useState<Record<string, any>>({});
    const [searchFilters, setSearchFilters] = useState<{ field: string; label: string; value: string; displayValue?: string }[]>([]);

    /* ---- 表格状态 ---- */
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<T[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);
    const [sorter, setSorter] = useState<{ field: string; order: 'ascend' | 'descend' } | undefined>();
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
    const [headerFilterValues, setHeaderFilterValues] = useState<Record<string, string>>({});
    const [prefsLoaded, setPrefsLoaded] = useState(!preferenceKey); // 无 key 则视为已加载

    /* ---- 列设置 ---- */
    const [columnSettingsOpen, setColumnSettingsOpen] = useState(false);
    const [columnSettings, setColumnSettings] = useState<ColumnSettingItem[]>(() =>
        (columnDefs || []).map(c => ({
            key: c.columnKey,
            title: c.columnTitle,
            fixed: c.fixedColumn ?? false,
            visible: c.defaultVisible !== false,
        }))
    );

    /* ---- 偏好加载（挂载时从后端读取） ---- */
    useEffect(() => {
        if (!preferenceKey) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await getCachedPreferences();
                if (cancelled) return;
                const prefs = res?.data?.preferences ?? {};
                // 恢复列宽
                const savedWidths = prefs[`${preferenceKey}_column_widths`];
                if (savedWidths && typeof savedWidths === 'object') {
                    setColumnWidths(savedWidths);
                }
                // 恢复列顺序和可见性
                const savedColumns = prefs[`${preferenceKey}_columns`] as string[] | undefined;
                if (Array.isArray(savedColumns) && savedColumns.length > 0) {
                    setColumnSettings(prev => {
                        const map = new Map(prev.map(c => [c.key, c]));
                        const result: ColumnSettingItem[] = [];
                        // 先按保存顺序添加
                        for (const key of savedColumns) {
                            const item = map.get(key);
                            if (item) {
                                result.push({ ...item, visible: true });
                                map.delete(key);
                            }
                        }
                        // 剩余列放在后面，标记为不可见
                        for (const item of map.values()) {
                            if (item.fixed) {
                                result.push({ ...item, visible: true });
                            } else {
                                result.push({ ...item, visible: false });
                            }
                        }
                        return result;
                    });
                }
            } catch { /* 首次无偏好，忽略 */ }
            if (!cancelled) setPrefsLoaded(true);
        })();
        return () => { cancelled = true; };
    }, [preferenceKey]);

    /* ---- 偏好保存（debounce 500ms，按 key 隔离定时器） ---- */
    const saveTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const savePrefDebounced = useCallback((key: string, value: any) => {
        if (!preferenceKey) return;
        const timers = saveTimersRef.current;
        const existing = timers.get(key);
        if (existing) clearTimeout(existing);
        timers.set(key, setTimeout(() => {
            timers.delete(key);
            patchPreferences({ [key]: value })
                .then(() => { prefsCacheResult = null; }) // 保存成功后使缓存失效
                .catch(() => { });
        }, 500));
    }, [preferenceKey]);

    /* ---- 表格 body 容器 ref（用于读取列实际像素宽度） ---- */
    const tableBodyRef = useRef<HTMLDivElement>(null);

    /* ---- 拼合可见列（带拖拽宽度） ---- */
    const handleResizeEnd = useCallback((key: string) => (finalWidth: number, allThWidths?: number[]) => {
        setColumnWidths(prev => {
            const next = { ...prev, [key]: finalWidth };

            // ★ 防止 auto→fixed 弹动：首次拖拽时用 ResizableTitle 在 activate()
            // 时快照的所有 th 像素宽度，直接保存到 columnWidths 中。
            // 这些宽度是在切换 fixed 布局前捕获的，与 fixed 布局渲染值一致。
            const visibleKeys = columnSettings.filter(c => c.visible).map(c => c.key);
            const missingKeys = visibleKeys.filter(k => k !== key && !(k in next));
            if (missingKeys.length > 0 && allThWidths && allThWidths.length > 0) {
                let thIdx = 0;
                // 如果有 rowSelection（勾选框列），DOM 里会多一个 th
                if (tableBodyRef.current?.querySelector('.ant-table-selection-column')) {
                    thIdx = 1;
                }
                for (const vk of visibleKeys) {
                    if (vk !== key && !(vk in next) && thIdx < allThWidths.length) {
                        next[vk] = allThWidths[thIdx];
                    }
                    thIdx++;
                }
            }

            if (preferenceKey) savePrefDebounced(`${preferenceKey}_column_widths`, next);
            return next;
        });
    }, [preferenceKey, savePrefDebounced, columnSettings]);

    /* ---- 提取有 headerFilters 的列定义 ---- */
    const filterableCols = useMemo(() =>
        (columnDefs || []).filter(c => c.headerFilters && c.headerFilters.length > 0),
        [columnDefs]);

    /* ---- 筛选下拉选中回调（搜索栏旁使用） ---- */
    const handleFilterSelect = useCallback((columnKey: string, columnTitle: string, value: string | undefined, options: { label: string; value: string }[]) => {
        setHeaderFilterValues(prev => {
            if (!value) {
                const next = { ...prev };
                delete next[columnKey];
                return next;
            }
            return { ...prev, [columnKey]: value };
        });
        setSearchFilters(prev => {
            const cleared = prev.filter(f => f.field !== columnKey);
            if (!value) {
                setPage(1);
                fetchData(1, pageSize, sorter, cleared);
                return cleared;
            }
            const valueLabel = options.find(o => o.value === value)?.label || value;
            const next = [...cleared, { field: columnKey, label: columnTitle, value, displayValue: valueLabel }];
            setPage(1);
            fetchData(1, pageSize, sorter, next);
            return next;
        });
    }, [pageSize, sorter]);

    const visibleColumns = useMemo<ColumnsType<T>>(() => {
        const visibleKeys = columnSettings.filter(c => c.visible).map(c => c.key);
        const orderedColumns: ColumnsType<T> = [];

        for (const key of visibleKeys) {
            const def = (columnDefs || []).find(c => c.columnKey === key);
            if (def) {
                const { columnKey, columnTitle, fixedColumn, defaultVisible, headerFilters, ...antdCol } = def;
                const w = columnWidths[columnKey] ?? antdCol.width;
                orderedColumns.push({
                    ...antdCol,
                    title: columnTitle,
                    key: columnKey,
                    width: w,
                    onHeaderCell: () => ({
                        width: w,
                        onResizeEnd: handleResizeEnd(columnKey),
                    }),
                } as any);
            }
        }

        return orderedColumns;
    }, [columnSettings, columnDefs, columnWidths, handleResizeEnd]);

    /* ---- 数据加载 ---- */
    const fetchData = useCallback(async (
        p: number = page,
        ps: number = pageSize,
        s?: typeof sorter,
        filters?: { field: string; label: string; value: string }[],
    ) => {
        if (!request) {
            // children 模式：通过 onSearch 回调通知外部
            if (onSearch) {
                const activeFilters = filters ?? searchFilters;
                const filtersAsSearch: Record<string, any> = {};
                activeFilters.forEach(f => {
                    filtersAsSearch[f.field] = f.value;
                });
                const mergedAdvanced = showAdvanced
                    ? { ...filtersAsSearch, ...advancedValues }
                    : activeFilters.length > 0 ? filtersAsSearch : undefined;
                onSearch({
                    searchField: undefined,
                    searchValue: undefined,
                    advancedSearch: mergedAdvanced,
                    filters: activeFilters.map(f => ({ field: f.field, value: f.value })),
                });
            }
            return;
        }
        setLoading(true);
        try {
            const activeFilters = filters ?? searchFilters;
            // 将筛选标签转为 advancedSearch 格式
            const filtersAsSearch: Record<string, any> = {};
            activeFilters.forEach(f => {
                const key = f.field;
                filtersAsSearch[key] = f.value;
            });
            const mergedAdvanced = showAdvanced
                ? { ...filtersAsSearch, ...advancedValues }
                : activeFilters.length > 0 ? filtersAsSearch : undefined;

            const result = await request({
                page: p,
                pageSize: ps,
                searchField: undefined,
                searchValue: undefined,
                advancedSearch: mergedAdvanced,
                sorter: s,
            });
            setData(result.data);
            setTotal(result.total);
        } catch {
            // 错误由上层处理
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, searchFilters, showAdvanced, advancedValues, sorter, request, onSearch]);

    /* ---- 首次加载和参数变化 ---- */
    React.useEffect(() => {
        if (!prefsLoaded) return; // 等偏好加载完再请求数据，避免双重请求
        fetchData(page, pageSize, sorter);
    }, [page, pageSize, prefsLoaded]);

    /* ---- 搜索 ---- */
    const handleSearch = () => {
        // 高级搜索模式：直接用 advancedValues 触发请求
        if (showAdvanced) {
            setPage(1);
            fetchData(1, pageSize, sorter, searchFilters);
            return;
        }
        if (!searchValue.trim() && !isEnumField) return;
        if (isEnumField && (currentEnumCol || currentEnumSearchField)) {
            // 枚举字段 → 添加筛选条件
            if (!searchValue) return;
            const realKey = currentEnumSearchField ? currentEnumSearchField.key : currentEnumCol!.columnKey;
            const displayLabel = currentEnumSearchField?.label || currentEnumCol?.columnTitle || realKey;
            const displayValue = currentEnumSearchField
                ? (currentEnumSearchField.options?.find(o => o.value === searchValue)?.label || searchValue)
                : (currentEnumCol?.headerFilters!.find(h => h.value === searchValue)?.label || searchValue);
            const newFilters = [
                ...searchFilters.filter(f => f.field !== realKey),
                { field: realKey, label: displayLabel, value: searchValue, displayValue },
            ];
            setSearchFilters(newFilters);
            if (currentEnumCol) {
                setHeaderFilterValues(prev => ({ ...prev, [realKey]: searchValue }));
            }
            setSearchValue('');
            setPage(1);
            fetchData(1, pageSize, sorter, newFilters);
        } else {
            // 文本字段 → 原逻辑
            const fieldKey = searchField;
            const fieldLabel = (searchFields || []).find(f => f.key === searchField)?.label || searchField;
            const newFilters = [
                ...searchFilters.filter(f => f.field !== fieldKey),
                { field: fieldKey, label: fieldLabel, value: searchValue.trim() },
            ];
            setSearchFilters(newFilters);
            setSearchValue('');
            setPage(1);
            fetchData(1, pageSize, sorter, newFilters);
        }
    };

    const handleRemoveFilter = (field: string) => {
        const newFilters = searchFilters.filter(f => f.field !== field);
        setSearchFilters(newFilters);
        // 如果是筛选下拉的字段，同步清除
        setHeaderFilterValues(prev => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
        setPage(1);
        fetchData(1, pageSize, sorter, newFilters);
    };

    const handleClearFilters = () => {
        setSearchFilters([]);
        setHeaderFilterValues({});
        setPage(1);
        fetchData(1, pageSize, sorter, []);
    };

    const handleReset = () => {
        setAdvancedValues({});
        setSearchValue('');
        setSearchField((searchFields || [])[0]?.key || '');
        setSearchFilters([]);
        setHeaderFilterValues({});
        setPage(1);
        fetchData(1, pageSize, sorter, []);
    };

    const handleRefresh = () => {
        fetchData(page, pageSize, sorter);
    };

    /* ---- 外部刷新触发器 ---- */
    const refreshTriggerRef = useRef(refreshTrigger);
    useEffect(() => {
        if (refreshTriggerRef.current !== undefined && refreshTrigger !== refreshTriggerRef.current) {
            fetchData(page, pageSize, sorter);
        }
        refreshTriggerRef.current = refreshTrigger;
    }, [refreshTrigger]);

    /* ---- 表格排序 ---- */
    const handleTableChange = (_pagination: TablePaginationConfig, _filters: any, tableSorter: any) => {
        const sortField = tableSorter?.columnKey || tableSorter?.field || tableSorter?.column?.key;
        if (sortField && tableSorter?.order) {
            const newSorter = { field: sortField as string, order: tableSorter.order as 'ascend' | 'descend' };
            setSorter(newSorter);
            fetchData(page, pageSize, newSorter, searchFilters);
        } else {
            setSorter(undefined);
            fetchData(page, pageSize, undefined, searchFilters);
        }
    };

    /* ---- 分页 ---- */
    const handlePageChange = (p: number, ps: number) => {
        setPage(p);
        setPageSize(ps);
    };

    /* ---- 高级搜索字段变更 ---- */
    const updateAdvancedField = (key: string, value: any) => {
        setAdvancedValues(prev => ({ ...prev, [key]: value }));
    };

    /* ---- 搜索字段下拉选项（文本字段 + 枚举字段分组） ---- */
    const searchFieldOptions = useMemo((): any[] => {
        const fields = searchFields || [];
        // 文本字段 = 没有 __enum__ 前缀的 searchFields
        const textGroup = fields.filter(f => !f.key.startsWith('__enum__')).map(f => ({ label: f.label, value: f.key, desc: f.description }));
        // 枚举字段 = 有 __enum__ 前缀的 searchFields + 列定义的枚举字段
        const enumGroup = [
            ...fields.filter(f => f.key.startsWith('__enum__')).map(f => ({ label: f.label, value: f.key, desc: f.description })),
            ...filterableCols.map(c => ({ label: c.columnTitle, value: `__enum__${c.columnKey}` })),
        ];
        if (enumGroup.length === 0) return textGroup;
        return [
            { label: '文本字段', options: textGroup },
            { label: '枚举字段', options: enumGroup },
        ];
    }, [searchFields, filterableCols]);

    /* ---- 搜索字段下拉 optionRender（带 ? tooltip） ---- */
    const searchFieldOptionRender = useCallback((opt: any) => {
        const desc = opt.data?.desc;
        if (!desc) return opt.label;
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span>{opt.label}</span>
                <Tooltip title={desc} placement="right">
                    <QuestionCircleOutlined style={{ color: '#bfbfbf', fontSize: 12 }} />
                </Tooltip>
            </div>
        );
    }, []);

    /* 当前选中的是否为枚举字段（来自 filterableCols 或 SearchField.options） */
    const isEnumField = searchField.startsWith('__enum__');
    const currentEnumSearchField = isEnumField
        ? (searchFields || []).find(f => f.key === searchField)
        : undefined;
    const currentEnumCol = isEnumField
        ? (currentEnumSearchField ? undefined : filterableCols.find(c => `__enum__${c.columnKey}` === searchField))
        : undefined;

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

            {/* ===== 自定义内容 or 默认表格 ===== */}
            {children ? (
                <div className="standard-table-main">
                    {/* children 模式下如果有 searchFields，渲染内置工具栏 */}
                    {searchFields && searchFields.length > 0 && (
                        <>
                            <div className="standard-table-toolbar">
                                <div className="standard-table-search-left">
                                    <Space.Compact>
                                        <span className="standard-table-search-icon">
                                            <SearchOutlined />
                                        </span>
                                        <Select
                                            value={searchField}
                                            onChange={(val) => { setSearchField(val); setSearchValue(''); }}
                                            options={searchFieldOptions}
                                            optionRender={searchFieldOptionRender}
                                            style={{ width: 140 }}
                                            popupMatchSelectWidth={false}
                                        />
                                        {isEnumField && (currentEnumCol || currentEnumSearchField) ? (
                                            <Select
                                                value={searchValue || undefined}
                                                onChange={(val) => setSearchValue(val || '')}
                                                placeholder={`选择${currentEnumSearchField?.label || currentEnumCol?.columnTitle}`}
                                                style={{ width: 200 }}
                                                allowClear
                                                options={currentEnumSearchField?.options || currentEnumCol?.headerFilters!.map(h => ({ label: h.label, value: h.value }))}
                                            />
                                        ) : (
                                            <Input
                                                value={searchValue}
                                                onChange={e => setSearchValue(e.target.value)}
                                                onPressEnter={handleSearch}
                                                placeholder="输入关键字进行搜索"
                                                style={{ width: 200 }}
                                                allowClear
                                            />
                                        )}
                                        <Button type="primary" onClick={handleSearch}>
                                            搜索
                                        </Button>
                                    </Space.Compact>
                                </div>
                                <div className="standard-table-search-right">
                                    {advancedSearchFields && advancedSearchFields.length > 0 && (
                                        <span
                                            className="standard-table-advanced-toggle"
                                            onClick={() => setShowAdvanced(!showAdvanced)}
                                        >
                                            {showAdvanced ? '收起高级搜索' : '高级搜索'}
                                        </span>
                                    )}
                                    <div className="standard-table-toolbar-divider" />
                                    <div className="standard-table-toolbar-group">
                                        {extraToolbarActions}
                                        <Tooltip title="刷新">
                                            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
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

                            {/* 筛选标签栏 */}
                            {searchFilters.length > 0 && (
                                <div className="standard-table-filter-tags">
                                    {searchFilters.map(f => (
                                        <Tag
                                            key={f.field}
                                            closable
                                            onClose={() => handleRemoveFilter(f.field)}
                                            className="standard-table-filter-tag"
                                        >
                                            {f.label} {f.displayValue || f.value}
                                        </Tag>
                                    ))}
                                    <a
                                        className="standard-table-clear-filters"
                                        onClick={handleClearFilters}
                                    >
                                        清除筛选条件
                                    </a>
                                </div>
                            )}

                            {/* 高级搜索展开区 */}
                            {showAdvanced && advancedSearchFields && (
                                <div className="standard-table-advanced-search">
                                    <div className="standard-table-advanced-fields">
                                        {advancedSearchFields.map(field => (
                                            <div key={field.key} className="standard-table-advanced-field">
                                                <label>
                                                    {field.label}
                                                    {field.description && (
                                                        <Tooltip title={field.description}>
                                                            <QuestionCircleOutlined style={{ color: '#bfbfbf', fontSize: 12, marginLeft: 3, cursor: 'help' }} />
                                                        </Tooltip>
                                                    )}
                                                </label>
                                                {field.type === 'input' && (
                                                    <Input
                                                        value={advancedValues[field.key] || ''}
                                                        onChange={e => updateAdvancedField(field.key, e.target.value)}
                                                        placeholder={field.placeholder || `输入${field.label}`}
                                                        allowClear
                                                        onPressEnter={handleSearch}
                                                    />
                                                )}
                                                {field.type === 'select' && (
                                                    <Select
                                                        value={advancedValues[field.key]}
                                                        onChange={v => updateAdvancedField(field.key, v)}
                                                        placeholder={field.placeholder || `选择${field.label}`}
                                                        options={field.options}
                                                        allowClear
                                                        style={{ width: '100%' }}
                                                    />
                                                )}
                                                {field.type === 'dateRange' && (
                                                    <RangePicker
                                                        value={advancedValues[field.key]}
                                                        onChange={v => updateAdvancedField(field.key, v)}
                                                        placeholder={['开始时间', '结束时间']}
                                                        style={{ width: '100%' }}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="standard-table-advanced-actions">
                                        <Button type="primary" onClick={handleSearch}>搜索</Button>
                                        <Button onClick={handleReset}>重置</Button>
                                        <span
                                            className="standard-table-advanced-toggle"
                                            onClick={() => setShowAdvanced(false)}
                                        >
                                            收起高级搜索
                                        </span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    {children}
                </div>
            ) : (
                <div className="standard-table-main">
                    {/* ===== 搜索工具栏 ===== */}
                    <div className="standard-table-toolbar">
                        <div className="standard-table-search-left">
                            <Space.Compact>
                                <span className="standard-table-search-icon">
                                    <SearchOutlined />
                                </span>
                                <Select
                                    value={searchField}
                                    onChange={(val) => { setSearchField(val); setSearchValue(''); }}
                                    options={searchFieldOptions}
                                    optionRender={searchFieldOptionRender}
                                    style={{ width: 140 }}
                                    popupMatchSelectWidth={false}
                                />
                                {isEnumField && (currentEnumCol || currentEnumSearchField) ? (
                                    <Select
                                        value={searchValue || undefined}
                                        onChange={(val) => setSearchValue(val || '')}
                                        placeholder={`选择${currentEnumSearchField?.label || currentEnumCol?.columnTitle}`}
                                        style={{ width: 200 }}
                                        allowClear
                                        options={currentEnumSearchField?.options || currentEnumCol?.headerFilters!.map(h => ({ label: h.label, value: h.value }))}
                                    />
                                ) : (
                                    <Input
                                        value={searchValue}
                                        onChange={e => setSearchValue(e.target.value)}
                                        onPressEnter={handleSearch}
                                        placeholder="输入关键字进行搜索"
                                        style={{ width: 200 }}
                                        allowClear
                                    />
                                )}
                                <Button type="primary" onClick={handleSearch}>
                                    搜索
                                </Button>
                            </Space.Compact>
                        </div>
                        <div className="standard-table-search-right">
                            {advancedSearchFields && advancedSearchFields.length > 0 && (
                                <span
                                    className="standard-table-advanced-toggle"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                >
                                    {showAdvanced ? '收起高级搜索' : '高级搜索'}
                                </span>
                            )}
                            <div className="standard-table-toolbar-divider" />
                            <div className="standard-table-toolbar-group">
                                {extraToolbarActions}
                                {Object.keys(columnWidths).length > 0 && (
                                    <Tooltip title="重置列宽">
                                        <Button
                                            icon={<ColumnWidthOutlined />}
                                            onClick={() => {
                                                setColumnWidths({});
                                                if (preferenceKey) savePrefDebounced(`${preferenceKey}_column_widths`, {});
                                            }}
                                        />
                                    </Tooltip>
                                )}
                                <Tooltip title="显示字段及排序">
                                    <Button
                                        icon={<SettingOutlined />}
                                        onClick={() => setColumnSettingsOpen(true)}
                                    />
                                </Tooltip>
                                <Tooltip title="刷新">
                                    <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
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

                    {/* ===== 筛选标签栏 ===== */}
                    {searchFilters.length > 0 && (
                        <div className="standard-table-filter-tags">
                            {searchFilters.map(f => (
                                <Tag
                                    key={f.field}
                                    closable
                                    onClose={() => handleRemoveFilter(f.field)}
                                    className="standard-table-filter-tag"
                                >
                                    {f.label} {f.displayValue || f.value}
                                </Tag>
                            ))}
                            <a
                                className="standard-table-clear-filters"
                                onClick={handleClearFilters}
                            >
                                清除筛选条件
                            </a>
                        </div>
                    )}

                    {/* ===== 高级搜索展开区 ===== */}
                    {showAdvanced && advancedSearchFields && (
                        <div className="standard-table-advanced-search">
                            <div className="standard-table-advanced-fields">
                                {advancedSearchFields.map(field => (
                                    <div key={field.key} className="standard-table-advanced-field">
                                        <label>{field.label}</label>
                                        {field.type === 'input' && (
                                            <Input
                                                value={advancedValues[field.key] || ''}
                                                onChange={e => updateAdvancedField(field.key, e.target.value)}
                                                placeholder={field.placeholder || `输入${field.label}`}
                                                allowClear
                                                onPressEnter={handleSearch}
                                            />
                                        )}
                                        {field.type === 'select' && (
                                            <Select
                                                value={advancedValues[field.key]}
                                                onChange={v => updateAdvancedField(field.key, v)}
                                                placeholder={field.placeholder || `选择${field.label}`}
                                                options={field.options}
                                                allowClear
                                                style={{ width: '100%' }}
                                            />
                                        )}
                                        {field.type === 'dateRange' && (
                                            <RangePicker
                                                value={advancedValues[field.key]}
                                                onChange={v => updateAdvancedField(field.key, v)}
                                                placeholder={['开始时间', '结束时间']}
                                                style={{ width: '100%' }}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="standard-table-advanced-actions">
                                <Button type="primary" onClick={handleSearch}>搜索</Button>
                                <Button onClick={handleReset}>重置</Button>
                                <span
                                    className="standard-table-advanced-toggle"
                                    onClick={() => setShowAdvanced(false)}
                                >
                                    收起高级搜索
                                </span>
                            </div>
                        </div>
                    )}

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
                        onConfirm={(newSettings: ColumnSettingItem[]) => {
                            setColumnSettings(newSettings);
                            if (preferenceKey) {
                                const visibleKeys = newSettings.filter(c => c.visible).map(c => c.key);
                                savePrefDebounced(`${preferenceKey}_columns`, visibleKeys);
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
}

export default StandardTable;
export type { ColumnSettingItem };

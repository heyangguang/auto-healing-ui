import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { HistoryOutlined, AppstoreOutlined } from '@ant-design/icons';
import { Button, Tooltip, message } from 'antd';
import StandardTable from '@/components/StandardTable';
import TaskNavigator from './components/TaskNavigator';
import ExecutionStream from './components/ExecutionStream';
import ForensicDrawer from './components/ForensicDrawer';
import StatsPanel from './components/StatsPanel';
import { getExecutionRuns } from '@/services/auto-healing/execution';
import { createRequestSequence } from '@/utils/requestSequence';
import {
    parseLogSearchParams,
    RUN_ADVANCED_FIELDS,
    RUN_SEARCH_FIELDS,
    TEMPLATE_ADVANCED_FIELDS,
    TEMPLATE_SEARCH_FIELDS,
    type LogSearchParams,
    type RunFilters,
    type TaskFilters,
} from './logSearchHelpers';
import './index.css';

/* ====== 主组件 ====== */

const ExecutionLogs: React.FC = () => {
    // ── 执行记录 State ──
    const [runs, setRuns] = useState<AutoHealing.ExecutionRun[]>([]);
    const [loadingRuns, setLoadingRuns] = useState(false);
    const [totalRuns, setTotalRuns] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 15;

    // ── 筛选 State ──
    const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);
    const [runFilters, setRunFilters] = useState<RunFilters>({});
    const [taskFilters, setTaskFilters] = useState<TaskFilters>({});

    // ── 搜索范围切换 State ──
    const [searchScope, setSearchScope] = useState<'runs' | 'templates'>('runs');
    const activeSearchFields = searchScope === 'runs' ? RUN_SEARCH_FIELDS : TEMPLATE_SEARCH_FIELDS;

    const searchScopeToggle = useMemo(() => (
        <Tooltip title={searchScope === 'runs'
            ? '当前：搜索执行流（点击切换到模板分组）'
            : '当前：搜索模板分组（点击切换到执行流）'
        }>
            <Button
                type={searchScope === 'templates' ? 'primary' : 'default'}
                icon={<AppstoreOutlined />}
                style={{ marginLeft: 4 }}
                onClick={() => {
                    requestSequenceRef.current.invalidate();
                    setSearchScope(prev => prev === 'runs' ? 'templates' : 'runs');
                    setRunFilters({});
                    setTaskFilters({});
                    setSelectedTaskId(undefined);
                    setRuns([]);
                    setTotalRuns(0);
                    setHasMore(true);
                    setPage(1);
                    setSelectedRunId(undefined);
                    setDrawerOpen(false);
                }}
            />
        </Tooltip>
    ), [searchScope]);

    // ── Drawer State ──
    const [selectedRunId, setSelectedRunId] = useState<string | undefined>(undefined);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // 用于外部刷新 StandardTable 工具栏
    const [_refreshTrigger, setRefreshTrigger] = useState(0);

    // ── Ref for stable fetchRuns ──
    const loadingRef = useRef(false);
    const requestSequenceRef = useRef(createRequestSequence());
    const selectedTaskIdRef = useRef(selectedTaskId);
    const runFiltersRef = useRef(runFilters);
    selectedTaskIdRef.current = selectedTaskId;
    runFiltersRef.current = runFilters;

    // ── Fetch Runs ──
    const fetchRuns = useCallback(async (currentPage: number, isReset: boolean) => {
        if (!isReset && loadingRef.current) return;
        const token = requestSequenceRef.current.next();
        loadingRef.current = true;
        setLoadingRuns(true);
        try {
            const filters = runFiltersRef.current;
            const params: Record<string, unknown> = {
                page: currentPage,
                page_size: PAGE_SIZE,
                run_id: filters.run_id,
                task_name: filters.task_name,
                status: filters.status,
                triggered_by: filters.triggered_by,
                started_after: filters.started_after,
                started_before: filters.started_before,
            };
            if (selectedTaskIdRef.current) params.task_id = selectedTaskIdRef.current;

            const res = await getExecutionRuns(params);
            if (!requestSequenceRef.current.isCurrent(token)) return;
            const data = res.data || [];

            React.startTransition(() => {
                if (isReset) {
                    setRuns(data);
                } else {
                    setRuns(prev => [...prev, ...data]);
                }
                setHasMore(data.length === PAGE_SIZE);
                setPage(currentPage);
                setTotalRuns(res.total || data.length);
            });
        } catch (error) {
            if (requestSequenceRef.current.isCurrent(token)) {
                console.error(error);
                message.error('加载执行记录失败');
                if (isReset) {
                    setRuns([]);
                    setTotalRuns(0);
                    setHasMore(false);
                    setPage(currentPage);
                    setSelectedRunId(undefined);
                    setDrawerOpen(false);
                }
            }
        } finally {
            if (requestSequenceRef.current.isCurrent(token)) {
                loadingRef.current = false;
                setLoadingRuns(false);
            }
        }
    }, []);

    useEffect(() => {
        fetchRuns(1, true);
    }, [selectedTaskId, runFilters]);

    const _handleRefresh = useCallback(() => {
        fetchRuns(1, true);
        setRefreshTrigger(prev => prev + 1);
    }, [fetchRuns]);

    const handleLoadMore = useCallback(() => {
        if (!loadingRuns && hasMore) {
            fetchRuns(page + 1, false);
        }
    }, [loadingRuns, hasMore, page, fetchRuns]);

    // ── StandardTable onSearch 回调 ──
    const handleSearch = useCallback((params: LogSearchParams) => {
        const { runFilters: newRunFilters, taskFilters: newTaskFilters } = parseLogSearchParams(params);
        setRunFilters(newRunFilters);
        setTaskFilters(newTaskFilters);
    }, []);

    return (
        <StandardTable<Record<string, unknown>>
            key={searchScope}
            title="执行记录"
            description="全系统取证时间轴"
            headerIcon={<HistoryOutlined />}
            tabs={[{ key: 'timeline', label: '执行时间轴' }]}
            headerExtra={<StatsPanel />}
            searchFields={activeSearchFields}
            advancedSearchFields={searchScope === 'runs' ? RUN_ADVANCED_FIELDS : TEMPLATE_ADVANCED_FIELDS}
            onSearch={handleSearch}
            searchExtra={searchScopeToggle}
        >
            <div style={{ display: 'flex', height: 'calc(100vh - 310px)', overflow: 'hidden' }}>
                {/* Left Pane: Task Navigator */}
                <div style={{ width: '25%', minWidth: 300, maxWidth: 380, height: '100%' }}>
                    <TaskNavigator
                        selectedTaskId={selectedTaskId}
                        onSelectTask={setSelectedTaskId}
                        externalFilters={taskFilters}
                    />
                </div>

                {/* Right Pane: Execution Stream */}
                <div style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
                    <ExecutionStream
                        runs={runs}
                        total={totalRuns}
                        loading={loadingRuns}
                        onSelectRun={(run) => {
                            setSelectedRunId(run.id);
                            setDrawerOpen(true);
                        }}
                        hasMore={hasMore}
                        onLoadMore={handleLoadMore}
                    />
                </div>
            </div>

            <ForensicDrawer
                open={drawerOpen}
                runId={selectedRunId}
                onClose={() => setDrawerOpen(false)}
            />
        </StandardTable>
    );
};

export default ExecutionLogs;

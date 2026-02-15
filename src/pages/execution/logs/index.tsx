import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { HistoryOutlined } from '@ant-design/icons';
import StandardTable from '@/components/StandardTable';
import type { SearchField, AdvancedSearchField } from '@/components/StandardTable';
import TaskNavigator from './components/TaskNavigator';
import ExecutionStream from './components/ExecutionStream';
import ForensicDrawer from './components/ForensicDrawer';
import StatsPanel from './components/StatsPanel';
import { getExecutionRuns } from '@/services/auto-healing/execution';
import dayjs from 'dayjs';
import './index.css';

/* ====== 搜索字段定义 ====== */

const SEARCH_FIELDS: SearchField[] = [
    // ── 文本字段 ──
    { key: 'run_search', label: 'ID / 关键字', placeholder: '输入 Run ID / 短 ID / 用户名', description: '支持完整 UUID、前 8 位短 ID 或触发用户名进行搜索' },
    { key: 'task_search', label: '模板名称', placeholder: '搜索任务模板...', description: '按任务模板名称模糊搜索，筛选左侧导航器' },
    // ── 枚举字段 ──
    {
        key: '__enum__run_status', label: '执行状态',
        description: '筛选单次执行记录的运行结果状态',
        options: [
            { label: '成功', value: 'success' },
            { label: '部分成功', value: 'partial' },
            { label: '失败', value: 'failed' },
            { label: '执行中', value: 'running' },
            { label: '等待中', value: 'pending' },
            { label: '超时', value: 'timeout' },
            { label: '已取消', value: 'cancelled' },
        ],
    },
    {
        key: '__enum__run_trigger', label: '触发方式',
        description: '筛选执行记录的触发来源（手动/调度/自愈）',
        options: [
            { label: '手动触发', value: 'manual' },
            { label: 'Cron 调度', value: 'scheduler:cron' },
            { label: '一次性调度', value: 'scheduler:once' },
            { label: '自愈触发', value: 'healing' },
        ],
    },
    {
        key: '__enum__task_executor', label: '执行器类型',
        description: '筛选任务模板使用的执行引擎',
        options: [
            { label: 'Local Node (Shell/Ansible)', value: 'local' },
            { label: 'Docker Container', value: 'docker' },
        ],
    },
    {
        key: '__enum__task_last_status', label: '模板最近状态',
        description: '按任务模板上次执行的结果筛选左侧导航器',
        options: [
            { label: '成功', value: 'success' },
            { label: '失败', value: 'failed' },
            { label: '执行中', value: 'running' },
            { label: '等待中', value: 'pending' },
            { label: '超时', value: 'timeout' },
            { label: '已取消', value: 'cancelled' },
        ],
    },
];

const ADVANCED_SEARCH_FIELDS: AdvancedSearchField[] = [
    // ── 执行记录 ──
    {
        key: 'status', label: '执行状态', type: 'select',
        description: '筛选单次执行记录的运行结果',
        options: [
            { label: '成功', value: 'success' },
            { label: '部分成功', value: 'partial' },
            { label: '失败', value: 'failed' },
            { label: '执行中', value: 'running' },
            { label: '等待中', value: 'pending' },
            { label: '超时', value: 'timeout' },
            { label: '已取消', value: 'cancelled' },
        ],
    },
    {
        key: 'triggered_by', label: '触发方式', type: 'select',
        description: '筛选执行记录的触发来源',
        options: [
            { label: '手动触发', value: 'manual' },
            { label: 'Cron 调度', value: 'scheduler:cron' },
            { label: '一次性调度', value: 'scheduler:once' },
            { label: '自愈触发', value: 'healing' },
        ],
    },
    { key: 'run_date_range', label: '执行时间', type: 'dateRange', description: '按执行开始时间范围筛选' },
    // ── 任务模板 ──
    {
        key: 'executor_type', label: '执行器类型', type: 'select',
        description: '筛选任务模板使用的执行引擎',
        options: [
            { label: 'Local Node', value: 'local' },
            { label: 'Docker Container', value: 'docker' },
        ],
    },
    { key: 'playbook_name', label: 'Playbook 名称', type: 'input', description: '按关联的 Playbook 名称搜索' },
    { key: 'repository_name', label: '仓库名称', type: 'input', description: '按关联的 Git 仓库名称搜索' },
    { key: 'target_hosts', label: '目标主机', type: 'input', description: '按任务模板配置的目标主机搜索' },
    {
        key: 'task_status', label: '模板状态', type: 'select',
        description: '筛选任务模板的当前状态（草稿/就绪/需审核）',
        options: [
            { label: '就绪', value: 'ready' },
            { label: '草稿', value: 'draft' },
            { label: '需审核', value: 'review_needed' },
        ],
    },
    {
        key: 'has_runs', label: '有执行记录', type: 'select',
        description: '筛选是否有执行记录的任务模板',
        options: [
            { label: '是', value: 'true' },
            { label: '否', value: 'false' },
        ],
    },
    {
        key: 'has_logs', label: '有日志记录', type: 'select',
        description: '筛选是否有日志输出的任务模板',
        options: [
            { label: '是', value: 'true' },
            { label: '否', value: 'false' },
        ],
    },
    { key: 'min_run_count', label: '最小执行次数', type: 'input', placeholder: '如: 5', description: '筛选执行次数 >= 此值的任务模板' },
    {
        key: 'last_run_status', label: '模板最近状态', type: 'select',
        description: '按任务模板上次执行的结果筛选左侧导航器',
        options: [
            { label: '成功', value: 'success' },
            { label: '失败', value: 'failed' },
            { label: '执行中', value: 'running' },
            { label: '等待中', value: 'pending' },
            { label: '超时', value: 'timeout' },
            { label: '已取消', value: 'cancelled' },
        ],
    },
];

/* ====== 筛选参数分发辅助 ====== */

// 执行记录相关的快速搜索 key
const RUN_QUICK_KEYS = new Set(['run_search', '__enum__run_status', '__enum__run_trigger']);
// 执行记录相关的高级搜索 key
const RUN_ADVANCED_KEYS = new Set(['status', 'triggered_by', 'run_date_range']);

interface RunFilters {
    search?: string;
    status?: string;
    triggered_by?: string;
    started_after?: string;
    started_before?: string;
}

interface TaskFilters {
    search?: string;
    executor_type?: string;
    target_hosts?: string;
    playbook_name?: string;
    repository_name?: string;
    status?: string;
    has_runs?: boolean;
    has_logs?: boolean;
    min_run_count?: number;
    last_run_status?: string;
}

const parseSearchParams = (params: {
    searchField?: string;
    searchValue?: string;
    advancedSearch?: Record<string, any>;
    filters?: { field: string; value: string }[];
}): { runFilters: RunFilters; taskFilters: TaskFilters } => {
    const runFilters: RunFilters = {};
    const taskFilters: TaskFilters = {};

    // 处理快速搜索筛选标签
    if (params.filters) {
        params.filters.forEach(f => {
            switch (f.field) {
                case 'run_search': runFilters.search = f.value; break;
                case '__enum__run_status': runFilters.status = f.value; break;
                case '__enum__run_trigger': runFilters.triggered_by = f.value; break;
                case 'task_search': taskFilters.search = f.value; break;
                case '__enum__task_executor': taskFilters.executor_type = f.value; break;
                case '__enum__task_last_status': taskFilters.last_run_status = f.value; break;
            }
        });
    }

    // 处理高级搜索面板
    const adv = params.advancedSearch || {};
    if (adv.status) runFilters.status = adv.status;
    if (adv.triggered_by) runFilters.triggered_by = adv.triggered_by;
    if (adv.run_date_range && adv.run_date_range.length === 2) {
        runFilters.started_after = adv.run_date_range[0].toISOString();
        runFilters.started_before = adv.run_date_range[1].toISOString();
    }
    if (adv.executor_type) taskFilters.executor_type = adv.executor_type;
    if (adv.playbook_name) taskFilters.playbook_name = adv.playbook_name;
    if (adv.repository_name) taskFilters.repository_name = adv.repository_name;
    if (adv.target_hosts) taskFilters.target_hosts = adv.target_hosts;
    if (adv.task_status) taskFilters.status = adv.task_status;
    if (adv.has_runs) taskFilters.has_runs = adv.has_runs === 'true';
    if (adv.has_logs) taskFilters.has_logs = adv.has_logs === 'true';
    if (adv.min_run_count) taskFilters.min_run_count = Number(adv.min_run_count);
    if (adv.last_run_status) taskFilters.last_run_status = adv.last_run_status;

    return { runFilters, taskFilters };
};

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

    // ── Drawer State ──
    const [selectedRunId, setSelectedRunId] = useState<string | undefined>(undefined);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // 用于外部刷新 StandardTable 工具栏
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // ── Ref for stable fetchRuns ──
    const loadingRef = useRef(false);
    const selectedTaskIdRef = useRef(selectedTaskId);
    const runFiltersRef = useRef(runFilters);
    selectedTaskIdRef.current = selectedTaskId;
    runFiltersRef.current = runFilters;

    // ── Fetch Runs ──
    const fetchRuns = useCallback(async (currentPage: number, isReset: boolean) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoadingRuns(true);
        try {
            const filters = runFiltersRef.current;
            const params: any = {
                page: currentPage,
                page_size: PAGE_SIZE,
                search: filters.search,
                status: filters.status,
                triggered_by: filters.triggered_by,
                started_after: filters.started_after,
                started_before: filters.started_before,
            };
            if (selectedTaskIdRef.current) params.task_id = selectedTaskIdRef.current;

            const res = await getExecutionRuns(params);
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
            console.error(error);
            if (isReset) setRuns([]);
        } finally {
            loadingRef.current = false;
            setLoadingRuns(false);
        }
    }, []);

    useEffect(() => {
        fetchRuns(1, true);
    }, [selectedTaskId, runFilters]);

    const handleRefresh = useCallback(() => {
        fetchRuns(1, true);
        setRefreshTrigger(prev => prev + 1);
    }, [fetchRuns]);

    const handleLoadMore = useCallback(() => {
        if (!loadingRuns && hasMore) {
            fetchRuns(page + 1, false);
        }
    }, [loadingRuns, hasMore, page, fetchRuns]);

    // ── StandardTable onSearch 回调 ──
    const handleSearch = useCallback((params: {
        searchField?: string;
        searchValue?: string;
        advancedSearch?: Record<string, any>;
        filters?: { field: string; value: string }[];
    }) => {
        const { runFilters: newRunFilters, taskFilters: newTaskFilters } = parseSearchParams(params);
        setRunFilters(newRunFilters);
        setTaskFilters(newTaskFilters);
    }, []);

    return (
        <StandardTable<any>
            title="执行记录"
            description="全系统取证时间轴"
            headerIcon={<HistoryOutlined />}
            tabs={[{ key: 'timeline', label: '执行时间轴' }]}
            headerExtra={<StatsPanel />}
            searchFields={SEARCH_FIELDS}
            advancedSearchFields={ADVANCED_SEARCH_FIELDS}
            onSearch={handleSearch}
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

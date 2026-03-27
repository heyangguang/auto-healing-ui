import type { AdvancedSearchField, SearchField } from '@/components/StandardTable';
import { RUN_STATUS_LABELS } from '@/constants/executionDicts';
import { toDayRangeEndISO, toDayRangeStartISO } from '@/utils/dateRange';

const BOOLEAN_SEARCH_OPTIONS = [
    { label: '是', value: 'true' },
    { label: '否', value: 'false' },
];

export const RUN_SEARCH_FIELDS: SearchField[] = [
    { key: 'run_id', label: '执行记录 ID', placeholder: '输入完整 UUID 或前 8 位短 ID', description: '按执行记录 ID 前缀匹配' },
    { key: 'task_name', label: '任务名称', placeholder: '输入任务名称', description: '按执行记录关联的任务名称搜索' },
    {
        key: '__enum__run_status',
        label: '执行状态',
        description: '筛选单次执行记录的运行结果状态',
        options: [
            ...Object.entries(RUN_STATUS_LABELS).map(([value, label]) => ({ label, value })),
            { label: '超时', value: 'timeout' },
            { label: '等待中', value: 'pending' },
        ],
    },
    {
        key: '__enum__run_trigger',
        label: '触发方式',
        description: '筛选执行记录的触发来源（手动/调度/自愈）',
        options: [
            { label: '手动触发', value: 'manual' },
            { label: 'Cron 调度', value: 'scheduler:cron' },
            { label: '一次性调度', value: 'scheduler:once' },
            { label: '自愈触发', value: 'healing' },
        ],
    },
];

export const TEMPLATE_SEARCH_FIELDS: SearchField[] = [
    { key: 'task_search', label: '模板名称', placeholder: '搜索任务模板...', description: '按任务模板名称模糊搜索，筛选左侧导航器' },
    {
        key: '__enum__task_executor',
        label: '执行器类型',
        description: '筛选任务模板使用的执行引擎',
        options: [
            { label: 'Local Node (Shell/Ansible)', value: 'local' },
            { label: 'Docker Container', value: 'docker' },
        ],
    },
    {
        key: '__enum__task_last_status',
        label: '模板最近状态',
        description: '按任务模板上次执行的结果筛选左侧导航器',
        options: [
            ...Object.entries(RUN_STATUS_LABELS).map(([value, label]) => ({ label, value })),
            { label: '超时', value: 'timeout' },
            { label: '等待中', value: 'pending' },
        ],
    },
];

export const RUN_ADVANCED_FIELDS: AdvancedSearchField[] = [
    { key: 'run_date_range', label: '执行时间', type: 'dateRange', description: '按执行开始时间范围筛选' },
];

export const TEMPLATE_ADVANCED_FIELDS: AdvancedSearchField[] = [
    { key: 'name', label: '模板名称', type: 'input', description: '按任务模板名称模糊搜索' },
    { key: 'description', label: '模板描述', type: 'input', description: '按任务模板描述搜索' },
    {
        key: 'executor_type',
        label: '执行器类型',
        type: 'select',
        description: '按任务模板使用的执行引擎筛选',
        options: [
            { label: 'Local Node (Shell/Ansible)', value: 'local' },
            { label: 'Docker Container', value: 'docker' },
        ],
    },
    { key: 'playbook_name', label: 'Playbook 名称', type: 'input', description: '按关联的 Playbook 名称搜索' },
    { key: 'repository_name', label: '仓库名称', type: 'input', description: '按关联的 Git 仓库名称搜索' },
    { key: 'target_hosts', label: '目标主机', type: 'input', description: '按任务模板配置的目标主机搜索' },
    { key: 'needs_review', label: '待审核', type: 'select', description: '按模板是否待审核筛选', options: BOOLEAN_SEARCH_OPTIONS },
    { key: 'has_runs', label: '有执行记录', type: 'select', description: '按模板是否已有执行记录筛选', options: BOOLEAN_SEARCH_OPTIONS },
    { key: 'has_logs', label: '有日志', type: 'select', description: '按模板是否已有执行日志筛选', options: BOOLEAN_SEARCH_OPTIONS },
    {
        key: 'task_status',
        label: '模板状态',
        type: 'select',
        description: '按任务模板当前状态筛选左侧导航器',
        options: [
            { label: '就绪', value: 'ready' },
            { label: '待审核', value: 'pending_review' },
        ],
    },
    { key: 'min_run_count', label: '最小执行次数', type: 'input', placeholder: '如: 5', description: '筛选执行次数 >= 此值的任务模板' },
    {
        key: 'last_run_status',
        label: '模板最近状态',
        type: 'select',
        description: '按任务模板上次执行的结果筛选左侧导航器',
        options: [
            ...Object.entries(RUN_STATUS_LABELS).map(([value, label]) => ({ label, value })),
            { label: '超时', value: 'timeout' },
            { label: '等待中', value: 'pending' },
        ],
    },
];

export interface RunFilters {
    run_id?: string;
    task_name?: string;
    status?: string;
    triggered_by?: string;
    started_after?: string;
    started_before?: string;
}

export interface TaskFilters {
    search?: string;
    name?: string;
    name__exact?: string;
    description?: string;
    description__exact?: string;
    executor_type?: string;
    target_hosts?: string;
    target_hosts__exact?: string;
    playbook_name?: string;
    playbook_name__exact?: string;
    repository_name?: string;
    repository_name__exact?: string;
    status?: string;
    has_runs?: boolean;
    has_logs?: boolean;
    needs_review?: boolean;
    min_run_count?: number;
    last_run_status?: string;
}

export interface LogSearchParams {
    advancedSearch?: Record<string, any>;
    filters?: { field: string; value: string }[];
    searchField?: string;
    searchValue?: string;
}

function assignExactAwareFilter(
    filters: TaskFilters,
    advancedSearch: Record<string, any>,
    key: 'name' | 'description' | 'playbook_name' | 'repository_name' | 'target_hosts',
) {
    const exactKey = `${key}__exact` as const;
    if (advancedSearch[exactKey]) {
        filters[exactKey] = advancedSearch[exactKey];
        return;
    }
    if (advancedSearch[key]) {
        filters[key] = advancedSearch[key];
    }
}

export function parseLogSearchParams(params: LogSearchParams) {
    const runFilters: RunFilters = {};
    const taskFilters: TaskFilters = {};

    params.filters?.forEach((filter) => {
        switch (filter.field) {
            case 'run_id':
                runFilters.run_id = filter.value;
                break;
            case 'task_name':
                runFilters.task_name = filter.value;
                break;
            case '__enum__run_status':
                runFilters.status = filter.value;
                break;
            case '__enum__run_trigger':
                runFilters.triggered_by = filter.value;
                break;
            case 'task_search':
                taskFilters.name = filter.value;
                break;
            case '__enum__task_executor':
                taskFilters.executor_type = filter.value;
                break;
            case '__enum__task_last_status':
                taskFilters.last_run_status = filter.value;
                break;
            default:
                break;
        }
    });

    const advancedSearch = params.advancedSearch || {};
    if (advancedSearch.run_id) runFilters.run_id = advancedSearch.run_id;
    if (advancedSearch.task_name) runFilters.task_name = advancedSearch.task_name;
    if (advancedSearch.status) runFilters.status = advancedSearch.status;
    if (advancedSearch.triggered_by) runFilters.triggered_by = advancedSearch.triggered_by;
    if (advancedSearch.run_date_range?.length === 2) {
        runFilters.started_after = toDayRangeStartISO(advancedSearch.run_date_range[0]);
        runFilters.started_before = toDayRangeEndISO(advancedSearch.run_date_range[1]);
    }

    assignExactAwareFilter(taskFilters, advancedSearch, 'name');
    assignExactAwareFilter(taskFilters, advancedSearch, 'description');
    if (advancedSearch.executor_type) taskFilters.executor_type = advancedSearch.executor_type;
    assignExactAwareFilter(taskFilters, advancedSearch, 'playbook_name');
    assignExactAwareFilter(taskFilters, advancedSearch, 'repository_name');
    assignExactAwareFilter(taskFilters, advancedSearch, 'target_hosts');
    if (advancedSearch.task_status) taskFilters.status = advancedSearch.task_status;
    if (advancedSearch.needs_review) taskFilters.needs_review = advancedSearch.needs_review === 'true';
    if (advancedSearch.has_runs) taskFilters.has_runs = advancedSearch.has_runs === 'true';
    if (advancedSearch.has_logs) taskFilters.has_logs = advancedSearch.has_logs === 'true';
    if (advancedSearch.min_run_count) taskFilters.min_run_count = Number(advancedSearch.min_run_count);
    if (advancedSearch.last_run_status) taskFilters.last_run_status = advancedSearch.last_run_status;

    return { runFilters, taskFilters };
}

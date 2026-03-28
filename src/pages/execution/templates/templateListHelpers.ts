import type { AdvancedSearchField, SearchField } from '@/components/StandardTable';
import { getExecutorOptions, getRunStatusOptions } from '@/constants/executionDicts';
import { toDayRangeEndISO, toDayRangeStartISO } from '@/utils/dateRange';

export type ExecutionTaskRecord = AutoHealing.ExecutionTask & {
    schedule_count?: number;
};

export type TemplateStats = {
    total: number;
    docker: number;
    local: number;
    needsReview: number;
    changedPlaybooks: number;
};

export type TemplateAdvancedSearch = {
    name?: string;
    name__exact?: string;
    description?: string;
    description__exact?: string;
    executor?: AutoHealing.ExecutorType;
    executor_type?: AutoHealing.ExecutorType;
    needs_review?: boolean | 'true' | 'false';
    playbook_name?: string;
    target_hosts?: string;
    last_run_status?: string;
    has_runs?: boolean | 'true' | 'false';
    created_at?: [string | undefined, string | undefined];
};

export type TemplateRequestParams = {
    page: number;
    pageSize: number;
    searchField?: string;
    searchValue?: string;
    advancedSearch?: TemplateAdvancedSearch;
    sorter?: { field: string; order: 'ascend' | 'descend' };
};

export type TemplateQueryParams = {
    page: number;
    page_size: number;
    name?: string;
    name__exact?: string;
    description?: string;
    description__exact?: string;
    executor_type?: AutoHealing.ExecutorType;
    needs_review?: boolean;
    playbook_name?: string;
    target_hosts?: string;
    last_run_status?: string;
    has_runs?: boolean;
    created_from?: string;
    created_to?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
};

export type ReviewGroup = {
    playbook_id: string;
    playbook_name: string;
    count: number;
    tasks: ExecutionTaskRecord[];
};

export type TemplateStatItem = {
    icon: React.ReactNode;
    cls: string;
    val: number;
    lbl: string;
    tip?: string;
};

export const templateSearchFields: SearchField[] = [
    { key: 'name', label: '模板名称', placeholder: '搜索模板名称', description: '按模板名称模糊搜索' },
    {
        key: '__enum__executor',
        label: '执行器类型',
        description: '筛选执行器类型',
        options: getExecutorOptions(),
    },
    {
        key: '__enum__needs_review',
        label: '审核状态',
        description: '筛选模板审核状态',
        options: [
            { label: '需审核', value: 'true' },
            { label: '正常', value: 'false' },
        ],
    },
];

export const templateAdvancedSearchFields: AdvancedSearchField[] = [
    { key: 'playbook_name', label: 'Playbook 名称', type: 'input', placeholder: '输入 Playbook 名称' },
    { key: 'target_hosts', label: '目标主机', type: 'input', placeholder: '输入主机地址' },
    {
        key: 'executor_type',
        label: '执行器类型',
        type: 'select',
        options: getExecutorOptions(),
    },
    {
        key: 'needs_review',
        label: '审核状态',
        type: 'select',
        description: '筛选模板审核状态',
        options: [
            { label: '需审核', value: 'true' },
            { label: '正常', value: 'false' },
        ],
    },
    {
        key: 'last_run_status',
        label: '最后执行状态',
        type: 'select',
        description: '按最后一次执行记录的状态筛选',
        options: getRunStatusOptions(),
    },
    {
        key: 'has_runs',
        label: '执行记录',
        type: 'select',
        description: '筛选是否有执行记录',
        options: [
            { label: '有执行记录', value: 'true' },
            { label: '无执行记录', value: 'false' },
        ],
    },
    { key: 'created_at', label: '创建时间', type: 'dateRange' },
];

export const getTaskHosts = (task: ExecutionTaskRecord) =>
    task.target_hosts ? task.target_hosts.split(',').filter(Boolean) : [];

export const formatVariableDisplayValue = (value: unknown) => {
    if (typeof value === 'string') {
        return value;
    }
    if (value === null) {
        return 'null';
    }
    if (value === undefined) {
        return 'undefined';
    }
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch {
            return '[unserializable]';
        }
    }
    return String(value);
};

export const getChangedVariableName = (variable: string | { name: string }) =>
    typeof variable === 'string' ? variable : variable.name;

export const hasBooleanishValue = (value: unknown): value is boolean | 'true' | 'false' =>
    value === true || value === false || value === 'true' || value === 'false';

export function buildTemplateQueryParams(params: TemplateRequestParams): TemplateQueryParams {
    const { page, pageSize, advancedSearch, sorter } = params;
    const apiParams: TemplateQueryParams = {
        page,
        page_size: pageSize,
    };

    if (advancedSearch) {
        const cleanedSearch: TemplateAdvancedSearch = {};
        for (const [key, value] of Object.entries(advancedSearch)) {
            const normalizedKey = key.replace(/^__enum__/, '') as keyof TemplateAdvancedSearch;
            cleanedSearch[normalizedKey] = value as never;
        }
        const advanced = cleanedSearch;
        if (advanced.name) apiParams.name = advanced.name;
        if (advanced.name__exact) apiParams.name__exact = advanced.name__exact;
        if (advanced.description) apiParams.description = advanced.description;
        if (advanced.description__exact) apiParams.description__exact = advanced.description__exact;
        if (advanced.executor) apiParams.executor_type = advanced.executor;
        if (advanced.executor_type) apiParams.executor_type = advanced.executor_type;
        if (hasBooleanishValue(advanced.needs_review)) {
            apiParams.needs_review = advanced.needs_review === 'true' || advanced.needs_review === true;
        }
        if (advanced.playbook_name) apiParams.playbook_name = advanced.playbook_name;
        if (advanced.target_hosts) apiParams.target_hosts = advanced.target_hosts;
        if (advanced.last_run_status) apiParams.last_run_status = advanced.last_run_status;
        if (hasBooleanishValue(advanced.has_runs)) {
            apiParams.has_runs = advanced.has_runs === 'true' || advanced.has_runs === true;
        }
        if (advanced.created_at?.length === 2) {
            const [createdFrom, createdTo] = advanced.created_at;
            if (createdFrom) apiParams.created_from = toDayRangeStartISO(createdFrom);
            if (createdTo) apiParams.created_to = toDayRangeEndISO(createdTo);
        }
    }

    if (sorter) {
        apiParams.sort_by = sorter.field;
        apiParams.sort_order = sorter.order === 'ascend' ? 'asc' : 'desc';
    }

    return apiParams;
}

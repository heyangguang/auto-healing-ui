import { splitTargetHosts } from './components/HostList';
import { getPlaybookVariables, type VariableValueMap } from '../templates/templateVariableHelpers';

export interface TemplateQueryParams {
    page?: number;
    name?: string;
    executor_type?: string;
    status?: string;
    playbook_id?: string;
    playbook_name?: string;
    target_hosts?: string;
    needs_review?: boolean;
    last_run_status?: string;
    has_runs?: boolean;
    created_from?: string;
    created_to?: string;
    [key: string]: unknown;
}

export interface LaunchpadSearchParams {
    searchField?: string;
    searchValue?: string;
    advancedSearch?: Record<string, unknown>;
    filters?: { field: string; value: string }[];
}

export interface ExecutionStats {
    total: number;
    docker: number;
    local: number;
    needs_review: number;
    changed_playbooks: number;
    ready: number;
    never_executed: number;
    last_run_failed: number;
}

export interface ExecutionStatsAvailability {
    total: boolean;
    docker: boolean;
    local: boolean;
    needs_review: boolean;
    changed_playbooks: boolean;
    ready: boolean;
    never_executed: boolean;
    last_run_failed: boolean;
}

export const INITIAL_STATS: ExecutionStats = {
    total: 0,
    docker: 0,
    local: 0,
    needs_review: 0,
    changed_playbooks: 0,
    ready: 0,
    never_executed: 0,
    last_run_failed: 0,
};

export const INITIAL_STATS_AVAILABILITY: ExecutionStatsAvailability = {
    total: false,
    docker: false,
    local: false,
    needs_review: false,
    changed_playbooks: false,
    ready: false,
    never_executed: false,
    last_run_failed: false,
};

export const EXECUTION_RUN_ID_MISSING_ERROR = '执行任务响应缺少运行 ID';

export function getExecutionTemplateStatusFilter(
    filterStatus: string,
    onlyReady: boolean,
) {
    if (filterStatus === 'ready') {
        return 'ready';
    }
    if (filterStatus === 'review') {
        return 'pending_review';
    }
    return onlyReady ? 'ready' : '';
}

export function buildLaunchpadAdvancedParams(params: LaunchpadSearchParams) {
    const filters = params.filters || [];
    let newSearch = '';
    let newExecutor = '';
    let newStatus = '';
    const extra: Record<string, unknown> = {};

    filters.forEach((filter) => {
        if (filter.field === 'name') {
            newSearch = filter.value;
        } else if (filter.field === 'playbook_name') {
            extra.playbook_name = filter.value;
        } else if (filter.field === 'target_hosts') {
            extra.target_hosts = filter.value;
        } else if (filter.field === '__enum__executor_type') {
            newExecutor = filter.value;
        } else if (filter.field === '__enum__status') {
            newStatus = filter.value;
        } else if (filter.field === '__enum__last_run_status') {
            extra.last_run_status = filter.value;
        }
    });

    return {
        extra,
        newExecutor,
        newSearch,
        newStatus,
    };
}

export function getMissingRequiredVariableNames(
    playbook: AutoHealing.Playbook | undefined,
    variableValues: VariableValueMap,
) {
    return getPlaybookVariables(playbook)
        .filter((variable) => variable.required)
        .filter((variable) => {
            const value = variableValues[variable.name];
            return value === undefined || value === null || value === '';
        })
        .map((variable) => variable.name);
}

export function buildExecuteTaskPayload(options: {
    additionalHosts: string[];
    additionalSecretIds: string[];
    extraVars: VariableValueMap;
    selectedTemplate: Pick<AutoHealing.ExecutionTask, 'secrets_source_ids' | 'target_hosts'>;
    skipNotification: boolean;
}) {
    const {
        additionalHosts,
        additionalSecretIds,
        extraVars,
        selectedTemplate,
        skipNotification,
    } = options;
    const mergedSecrets = [
        ...(selectedTemplate.secrets_source_ids || []),
        ...additionalSecretIds,
    ];
    const mergedHosts = [
        ...splitTargetHosts(selectedTemplate.target_hosts),
        ...additionalHosts,
    ].join(',');

    return {
        triggered_by: 'manual',
        secrets_source_ids: mergedSecrets.length > 0 ? Array.from(new Set(mergedSecrets)) : undefined,
        extra_vars: Object.keys(extraVars).length > 0 ? extraVars : undefined,
        target_hosts: mergedHosts,
        skip_notification: skipNotification,
    };
}

export function getExecutionRunIdOrThrow(response: {
    data?: { id?: string | null } | null;
}) {
    const runId = response.data?.id;
    if (!runId) {
        throw new Error(EXECUTION_RUN_ID_MISSING_ERROR);
    }
    return runId;
}

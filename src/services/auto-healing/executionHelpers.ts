import { request } from '@umijs/max';
import { normalizePaginatedResponse, unwrapData } from './responseAdapters';
import type {
    ExecutionStatusQuery,
    PaginatedApiResponse,
    RawExecutionStatus,
    RequestDataResponse,
} from './executionContracts';

export function normalizeExecutionStatus(status?: RawExecutionStatus) {
    return status === 'partial_success' ? 'partial' : status;
}

function normalizeTargetHostsValue(targetHosts: unknown) {
    if (targetHosts === undefined || targetHosts === null || targetHosts === '') {
        return undefined;
    }
    if (typeof targetHosts === 'string') {
        return targetHosts;
    }
    if (!Array.isArray(targetHosts)) {
        throw new Error('Execution task target_hosts must be a string or string[]');
    }

    const hosts: string[] = [];
    for (const item of targetHosts) {
        if (typeof item !== 'string') {
            throw new Error('Execution task target_hosts entries must be strings');
        }
        for (const host of item.split(',')) {
            const trimmedHost = host.trim();
            if (trimmedHost) {
                hosts.push(trimmedHost);
            }
        }
    }

    return hosts.length > 0 ? hosts.join(',') : undefined;
}

export function normalizeExecutionTask<T extends { target_hosts?: unknown }>(task: T): T {
    const normalizedTargetHosts = normalizeTargetHostsValue(task.target_hosts);
    if (task.target_hosts === normalizedTargetHosts) {
        return task;
    }
    return {
        ...task,
        target_hosts: normalizedTargetHosts,
    } as T;
}

export function toExecutionStatusQuery(status?: ExecutionStatusQuery) {
    return status === 'partial' ? 'partial_success' : status;
}

export function normalizeExecutionRun<T extends {
    status?: RawExecutionStatus;
    task?: { target_hosts?: unknown };
}>(run: T): T {
    return {
        ...run,
        status: normalizeExecutionStatus(run.status),
        task: run.task ? normalizeExecutionTask(run.task) : run.task,
    };
}

export function normalizeExecutionRunPage(
    response: AutoHealing.PaginatedResponse<AutoHealing.ExecutionRun>,
) {
    return {
        ...response,
        data: (response.data || []).map(normalizeExecutionRun),
    };
}

export async function requestUnwrappedData<T>(url: string, options: Record<string, unknown>) {
    return unwrapData(
        await request<RequestDataResponse<T>>(url, options),
    ) as T;
}

export async function requestNormalizedPage<T>(promise: Promise<PaginatedApiResponse<T>>) {
    return normalizePaginatedResponse(await promise);
}

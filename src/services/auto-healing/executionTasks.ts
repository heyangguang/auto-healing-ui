import { request } from '@umijs/max';
import {
    postTenantExecutionTasks,
    postTenantExecutionTasksIdExecute,
} from '@/services/generated/auto-healing/execution';
import type {
    DataEnvelope,
    ExecutionStatusQuery,
    ExecutionTaskStatsSummary,
    GetExecutionTasksParams,
    PaginatedApiResponse,
} from './executionContracts';
import {
    normalizeExecutionRun,
    normalizeExecutionTask,
    requestNormalizedPage,
    requestUnwrappedData,
    toExecutionStatusQuery,
} from './executionHelpers';
import { unwrapData } from './responseAdapters';

export async function getExecutionTaskStats() {
    return requestUnwrappedData<ExecutionTaskStatsSummary>(
        '/api/v1/tenant/execution-tasks/stats',
        { method: 'GET' },
    );
}

export async function getExecutionTasks(params: GetExecutionTasksParams = {}) {
    const normalizedParams = {
        ...params,
        last_run_status: toExecutionStatusQuery(params.last_run_status as ExecutionStatusQuery),
    };
    const response = await requestNormalizedPage<AutoHealing.ExecutionTask>(
        request<PaginatedApiResponse<AutoHealing.ExecutionTask>>('/api/v1/tenant/execution-tasks', {
            method: 'GET',
            params: normalizedParams,
        }),
    );
    const tasks = response.data || [];
    return {
        ...response,
        data: tasks.map(normalizeExecutionTask),
    };
}

export async function getExecutionTask(id: string) {
    const response = await request<{ data: AutoHealing.ExecutionTask }>(`/api/v1/tenant/execution-tasks/${id}`, {
        method: 'GET',
    });
    return {
        ...response,
        data: normalizeExecutionTask(response.data),
    };
}

export async function createExecutionTask(data: AutoHealing.CreateExecutionTaskRequest) {
    const response = await postTenantExecutionTasks(data) as DataEnvelope<AutoHealing.ExecutionTask>;
    return {
        ...response,
        data: normalizeExecutionTask(response.data),
    };
}

export async function updateExecutionTask(id: string, data: AutoHealing.UpdateExecutionTaskRequest) {
    const response = await request<{ data: AutoHealing.ExecutionTask }>(`/api/v1/tenant/execution-tasks/${id}`, {
        method: 'PUT',
        data,
    });
    return {
        ...response,
        data: normalizeExecutionTask(response.data),
    };
}

export async function deleteExecutionTask(id: string) {
    return request<void>(`/api/v1/tenant/execution-tasks/${id}`, {
        method: 'DELETE',
    });
}

export async function executeTask(id: string, data?: AutoHealing.ExecuteTaskRequest) {
    const response = await postTenantExecutionTasksIdExecute(
        { id },
        data || {},
    ) as DataEnvelope<AutoHealing.ExecutionRun>;
    return {
        ...response,
        data: normalizeExecutionRun(response.data),
    };
}

export async function confirmExecutionTaskReview(id: string) {
    const response = await request<{ data: AutoHealing.ExecutionTask }>(`/api/v1/tenant/execution-tasks/${id}/confirm-review`, {
        method: 'POST',
    });
    return {
        ...response,
        data: normalizeExecutionTask(response.data),
    };
}

export async function batchConfirmReview(params: { task_ids?: string[]; playbook_id?: string }) {
    return unwrapData(await request<DataEnvelope<{ confirmed_count: number; message: string }>>('/api/v1/tenant/execution-tasks/batch-confirm-review', {
        method: 'POST',
        data: params,
    }));
}

export async function getTaskRuns(id: string, params?: {
    page?: number;
    page_size?: number;
}) {
    const response = await request<{ data: AutoHealing.ExecutionRun[]; total: number }>(`/api/v1/tenant/execution-tasks/${id}/runs`, {
        method: 'GET',
        params,
    });
    return {
        ...response,
        data: (response.data || []).map(normalizeExecutionRun),
    };
}

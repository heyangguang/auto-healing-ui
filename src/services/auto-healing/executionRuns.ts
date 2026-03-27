import { request } from '@umijs/max';
import { createAuthenticatedEventStream } from './sse';
import type {
    ExecutionStatusQuery,
    GetExecutionRunsParams,
    PaginatedApiResponse,
    RawExecutionStatus,
} from './executionContracts';
import {
    normalizeExecutionRun,
    normalizeExecutionRunPage,
    normalizeExecutionStatus,
    requestNormalizedPage,
    toExecutionStatusQuery,
} from './executionHelpers';

export async function getExecutionRuns(params: GetExecutionRunsParams = {}) {
    const normalizedParams = {
        ...params,
        status: toExecutionStatusQuery(params.status as ExecutionStatusQuery),
    };
    return normalizeExecutionRunPage(await requestNormalizedPage<AutoHealing.ExecutionRun>(
        request<PaginatedApiResponse<AutoHealing.ExecutionRun>>('/api/v1/tenant/execution-runs', {
            method: 'GET',
            params: normalizedParams,
        }),
    ));
}

export async function getExecutionRunStats() {
    return request<{
        data: {
            total_count: number;
            success_count: number;
            failed_count: number;
            partial_count: number;
            cancelled_count: number;
            success_rate: number;
            avg_duration_sec: number;
            today_count: number;
        };
    }>('/api/v1/tenant/execution-runs/stats', { method: 'GET' });
}

export async function getExecutionRunTrend(days = 7) {
    return request<{
        data: {
            days: number;
            items: { date: string; status: string; count: number }[];
        };
    }>('/api/v1/tenant/execution-runs/trend', { method: 'GET', params: { days } });
}

export async function getExecutionTriggerDistribution() {
    return request<{
        data: { triggered_by: string; count: number }[];
    }>('/api/v1/tenant/execution-runs/trigger-distribution', { method: 'GET' });
}

export async function getExecutionTopFailed(limit = 5) {
    return request<{
        data: { task_id: string; task_name: string; total: number; failed: number; fail_rate: number }[];
    }>('/api/v1/tenant/execution-runs/top-failed', { method: 'GET', params: { limit } });
}

export async function getExecutionTopActive(limit = 5) {
    return request<{
        data: { task_id: string; task_name: string; total: number }[];
    }>('/api/v1/tenant/execution-runs/top-active', { method: 'GET', params: { limit } });
}

export async function getExecutionRun(id: string) {
    const response = await request<{ data: AutoHealing.ExecutionRun }>(`/api/v1/tenant/execution-runs/${id}`, {
        method: 'GET',
    });
    return {
        ...response,
        data: normalizeExecutionRun(response.data),
    };
}

export async function getExecutionLogs(id: string, params?: {
    page?: number;
    page_size?: number;
    log_level?: string;
}) {
    return request<{ data: AutoHealing.ExecutionLog[] }>(`/api/v1/tenant/execution-runs/${id}/logs`, {
        method: 'GET',
        params,
    });
}

export async function cancelExecutionRun(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/execution-runs/${id}/cancel`, {
        method: 'POST',
    });
}

export function createLogStream(
    id: string,
    onLog: (log: AutoHealing.ExecutionLog) => void,
    onDone: (result: { status: string; exit_code: number; stats?: AutoHealing.ExecutionRun['stats'] }) => void,
    onError?: (error: unknown) => void,
): () => void {
    const sseBase = (process.env.SSE_API_BASE || '').replace(/\/+$/, '');
    const connection = createAuthenticatedEventStream(
        `${sseBase}/api/v1/tenant/execution-runs/${id}/stream`,
        {
            onOpen: () => {
                console.log('[SSE] Connection opened');
            },
            onEvent: (event, payload) => {
                if (event === 'log') {
                    onLog(payload);
                    return;
                }
                if (event === 'done') {
                    onDone({
                        ...payload,
                        status: normalizeExecutionStatus(payload.status as RawExecutionStatus) || 'failed',
                    });
                    connection.close();
                }
            },
            onError: (error) => {
                console.error('[SSE] Error:', error);
                onError?.(error);
            },
        },
    );

    return () => {
        console.log('[SSE] Closing connection');
        connection.close();
    };
}

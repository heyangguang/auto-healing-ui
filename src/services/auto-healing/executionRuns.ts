import { request } from '@umijs/max';
import { createAuthenticatedEventStream } from './sse';
import * as sseParser from './sseParser';
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

type StreamDonePayload = {
    status?: RawExecutionStatus | string;
    exit_code?: number;
    stats?: AutoHealing.ExecutionRun['stats'];
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseExecutionLogPayload(payload: unknown): AutoHealing.ExecutionLog | null {
    const data = sseParser.unwrapSSEPayload(payload);
    if (
        !isRecord(data)
        || typeof data.id !== 'string'
        || typeof data.run_id !== 'string'
        || typeof data.message !== 'string'
        || typeof data.sequence !== 'number'
    ) {
        return null;
    }
    return data as unknown as AutoHealing.ExecutionLog;
}

function parseStreamDonePayload(payload: unknown): StreamDonePayload | null {
    const data = sseParser.unwrapSSEPayload(payload);
    return isRecord(data) ? data as StreamDonePayload : null;
}

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
                    const log = parseExecutionLogPayload(payload);
                    if (log) {
                        onLog(log);
                    }
                    return;
                }
                if (event === 'done') {
                    const donePayload = parseStreamDonePayload(payload);
                    if (!donePayload) {
                        return;
                    }
                    onDone({
                        ...donePayload,
                        exit_code: donePayload.exit_code ?? 0,
                        status: normalizeExecutionStatus(donePayload.status as RawExecutionStatus) || 'failed',
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

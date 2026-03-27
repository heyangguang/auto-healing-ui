import { request } from '@umijs/max';
import type {
    ExecutionScheduleStatsSummary,
    GetExecutionSchedulesParams,
    ScheduleTimelineItem,
} from './executionContracts';
import { requestUnwrappedData } from './executionHelpers';
import { normalizePaginatedResponse } from './responseAdapters';

export async function getExecutionSchedules(params?: GetExecutionSchedulesParams) {
    return normalizePaginatedResponse(
        await request<AutoHealing.PaginatedResponse<AutoHealing.ExecutionSchedule>>('/api/v1/tenant/execution-schedules', {
            method: 'GET',
            params,
        }),
    );
}

export async function getExecutionSchedule(id: string) {
    return requestUnwrappedData<AutoHealing.ExecutionSchedule>(
        `/api/v1/tenant/execution-schedules/${id}`,
        { method: 'GET' },
    );
}

export async function createExecutionSchedule(data: AutoHealing.CreateExecutionScheduleRequest) {
    return request<{ data: AutoHealing.ExecutionSchedule }>('/api/v1/tenant/execution-schedules', {
        method: 'POST',
        data,
    });
}

export async function updateExecutionSchedule(id: string, data: AutoHealing.UpdateExecutionScheduleRequest) {
    return request<{ data: AutoHealing.ExecutionSchedule }>(`/api/v1/tenant/execution-schedules/${id}`, {
        method: 'PUT',
        data,
    });
}

export async function deleteExecutionSchedule(id: string) {
    return request<void>(`/api/v1/tenant/execution-schedules/${id}`, {
        method: 'DELETE',
    });
}

export async function enableExecutionSchedule(id: string) {
    return request<{ data: AutoHealing.ExecutionSchedule }>(`/api/v1/tenant/execution-schedules/${id}/enable`, {
        method: 'POST',
    });
}

export async function disableExecutionSchedule(id: string) {
    return request<{ data: AutoHealing.ExecutionSchedule }>(`/api/v1/tenant/execution-schedules/${id}/disable`, {
        method: 'POST',
    });
}

export async function getExecutionScheduleStats() {
    return requestUnwrappedData<ExecutionScheduleStatsSummary>(
        '/api/v1/tenant/execution-schedules/stats',
        { method: 'GET' },
    );
}

export async function getScheduleTimeline(params?: { date?: string }) {
    return requestUnwrappedData<ScheduleTimelineItem[]>(
        '/api/v1/tenant/execution-schedules/timeline',
        { method: 'GET', params },
    );
}

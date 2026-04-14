import { request } from '@umijs/max';
import { normalizePaginatedResponse, unwrapData } from './responseAdapters';

export type IncidentQueryParams = {
    page?: number;
    page_size?: number;
    search?: string;
    title?: string;
    title__exact?: string;
    external_id?: string;
    external_id__exact?: string;
    plugin_id?: string;
    source_plugin_name?: string;
    source_plugin_name__exact?: string;
    status?: AutoHealing.IncidentStatus;
    severity?: AutoHealing.IncidentSeverity;
    healing_status?: AutoHealing.HealingStatus;
    scanned?: boolean;
    has_plugin?: boolean;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
};

export type IncidentWritebackLog = {
    action: string;
    created_at: string;
    error_message?: string | null;
    execution_run_id?: string | null;
    external_id: string;
    finished_at?: string | null;
    flow_instance_id?: string | null;
    id: string;
    operator_name?: string | null;
    operator_user_id?: string | null;
    request_method?: string | null;
    request_payload?: Record<string, unknown>;
    request_url?: string | null;
    response_body?: string | null;
    response_status_code?: number | null;
    started_at?: string | null;
    status: string;
    trigger_source: string;
};

/**
 * 获取工单列表
 */
export async function getIncidents(params?: IncidentQueryParams) {
    return normalizePaginatedResponse(await request<AutoHealing.PaginatedResponse<AutoHealing.Incident>>('/api/v1/tenant/incidents', {
        method: 'GET',
        params,
    }));
}

/**
 * 获取工单详情
 */
export async function getIncident(id: string) {
    return unwrapData(await request<{ code: number; message: string; data: AutoHealing.Incident }>(
        `/api/v1/tenant/incidents/${id}`,
        { method: 'GET' }
    ));
}

export async function getIncidentWritebackLogs(id: string) {
    return unwrapData(await request<{ code: number; message: string; data: IncidentWritebackLog[] }>(
        `/api/v1/tenant/incidents/${id}/writeback-logs`,
        { method: 'GET' },
    ));
}

export async function closeIncident(id: string, data: AutoHealing.CloseIncidentRequest) {
    return unwrapData(await request<{ code: number; message: string; data: AutoHealing.CloseIncidentResponse & { writeback_log_id?: string | null } }>(
        `/api/v1/tenant/incidents/${id}/close`,
        {
            method: 'POST',
            data,
        },
    ));
}

/**
 * 重置单个工单扫描状态
 */
export async function resetIncidentScan(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/incidents/${id}/reset-scan`, {
        method: 'POST',
    });
}

/**
 * 批量重置工单扫描状态
 */
export async function batchResetIncidentScan(data: AutoHealing.BatchResetScanRequest) {
    return unwrapData(await request<AutoHealing.BatchResetScanResponse>('/api/v1/tenant/incidents/batch-reset-scan', {
        method: 'POST',
        data,
    }));
}

/**
 * 获取工单统计数据
 */
export async function getIncidentStats() {
    return unwrapData(await request<{ code: number; message: string; data: AutoHealing.IncidentStats }>(
        '/api/v1/tenant/incidents/stats',
        { method: 'GET' }
    ));
}

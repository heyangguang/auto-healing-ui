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

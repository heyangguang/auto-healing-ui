import { request } from '@umijs/max';

/**
 * 获取工单列表
 */
export async function getIncidents(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    plugin_id?: string;
    source_plugin_name?: string;
    status?: AutoHealing.IncidentStatus;
    severity?: AutoHealing.IncidentSeverity;
    healing_status?: AutoHealing.HealingStatus;
    has_plugin?: boolean;
}) {
    return request<AutoHealing.PaginatedResponse<AutoHealing.Incident>>('/api/v1/incidents', {
        method: 'GET',
        params,
    });
}

/**
 * 获取工单详情
 */
export async function getIncident(id: string) {
    const res = await request<{ code: number; message: string; data: AutoHealing.Incident }>(
        `/api/v1/incidents/${id}`,
        { method: 'GET' }
    );
    return res.data;
}

/**
 * 重置单个工单扫描状态
 */
export async function resetIncidentScan(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/incidents/${id}/reset-scan`, {
        method: 'POST',
    });
}

/**
 * 批量重置工单扫描状态
 */
export async function batchResetIncidentScan(data: AutoHealing.BatchResetScanRequest) {
    return request<AutoHealing.BatchResetScanResponse>('/api/v1/incidents/batch-reset-scan', {
        method: 'POST',
        data,
    });
}

/**
 * 获取工单统计数据
 */
export async function getIncidentStats() {
    const res = await request<{ code: number; message: string; data: AutoHealing.IncidentStats }>(
        '/api/v1/incidents/stats',
        { method: 'GET' }
    );
    return res.data;
}

import { request } from '@umijs/max';

/**
 * 获取审计日志列表
 */
export async function getAuditLogs(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    action?: string;
    resource_type?: string;
    username?: string;
    user_id?: string;
    status?: string;
    risk_level?: string;
    created_after?: string;
    created_before?: string;
    sort_by?: string;
    sort_order?: string;
    exclude_action?: string;
    exclude_resource_type?: string;
}) {
    return request<any>('/api/v1/audit-logs', { method: 'GET', params });
}

/**
 * 获取审计日志详情
 */
export async function getAuditLogDetail(id: string) {
    return request<any>(`/api/v1/audit-logs/${id}`, { method: 'GET' });
}

/**
 * 获取审计统计概览
 */
export async function getAuditStats() {
    return request<any>('/api/v1/audit-logs/stats', { method: 'GET' });
}

/**
 * 获取操作趋势
 */
export async function getAuditTrend(days: number = 7) {
    return request<any>('/api/v1/audit-logs/trend', { method: 'GET', params: { days } });
}

/**
 * 导出审计日志 CSV
 */
export async function exportAuditLogs(params?: Record<string, any>) {
    return request<Blob>('/api/v1/audit-logs/export', {
        method: 'GET',
        params,
        responseType: 'blob',
        getResponse: true,
    });
}

/**
 * 用户操作排行（按用户聚合）
 */
export async function getAuditUserRanking(days: number = 30, limit: number = 50) {
    return request<any>('/api/v1/audit-logs/user-ranking', {
        method: 'GET',
        params: { days, limit },
    });
}

/**
 * 资源类型统计（按资源聚合）
 */
export async function getAuditResourceStats(days: number = 30) {
    return request<any>('/api/v1/audit-logs/resource-stats', {
        method: 'GET',
        params: { days },
    });
}

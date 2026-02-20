import { request } from '@umijs/max';

/**
 * 平台审计日志 API
 * 对应 /api/v1/platform/audit-logs
 * 注意：响应中不包含 user 关联对象，仅有 username 字段
 */

export async function getPlatformAuditLogs(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    category?: string;
    action?: string;
    resource_type?: string;
    username?: string;
    user_id?: string;
    status?: string;
    created_after?: string;
    created_before?: string;
    sort_by?: string;
    sort_order?: string;
}) {
    return request<any>('/api/v1/platform/audit-logs', { method: 'GET', params });
}

export async function getPlatformAuditLogDetail(id: string) {
    return request<any>(`/api/v1/platform/audit-logs/${id}`, { method: 'GET' });
}

export async function getPlatformAuditStats() {
    return request<any>('/api/v1/platform/audit-logs/stats', { method: 'GET' });
}

export async function getPlatformAuditTrend(days: number = 7) {
    return request<any>('/api/v1/platform/audit-logs/trend', { method: 'GET', params: { days } });
}

export async function getPlatformAuditUserRanking(days: number = 30, limit: number = 10) {
    return request<any>('/api/v1/platform/audit-logs/user-ranking', {
        method: 'GET',
        params: { days, limit },
    });
}

export async function getPlatformAuditHighRisk(params?: { page?: number; page_size?: number }) {
    return request<any>('/api/v1/platform/audit-logs/high-risk', { method: 'GET', params });
}

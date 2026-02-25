import { request } from '@umijs/max';

/** 获取自愈实例列表 GET /api/v1/tenant/healing/instances */
export async function getHealingInstances(
    params: {
        page?: number;
        page_size?: number;
        status?: string;
        flow_id?: string;
        rule_id?: string;
        incident_id?: string;
    },
    options?: { [key: string]: any },
) {
    return request<AutoHealing.PaginatedResponse<AutoHealing.FlowInstance>>('/api/v1/tenant/healing/instances', {
        method: 'GET',
        params: {
            ...params,
        },
        ...(options || {}),
    });
}

/** 获取自愈实例详情 GET /api/v1/tenant/healing/instances/:id */
export async function getHealingInstanceDetail(id: string, options?: { [key: string]: any }) {
    return request<AutoHealing.FlowInstance>(`/api/v1/tenant/healing/instances/${id}`, {
        method: 'GET',
        ...(options || {}),
    });
}

/** 取消自愈实例 POST /api/v1/tenant/healing/instances/:id/cancel */
export async function cancelHealingInstance(id: string, options?: { [key: string]: any }) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/healing/instances/${id}/cancel`, {
        method: 'POST',
        ...(options || {}),
    });
}

/** 重试自愈实例 POST /api/v1/tenant/healing/instances/:id/retry */
export async function retryHealingInstance(
    id: string,
    data?: AutoHealing.RetryInstanceRequest,
    options?: { [key: string]: any },
) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/healing/instances/${id}/retry`, {
        method: 'POST',
        data,
        ...(options || {}),
    });
}

/**
 * 获取自愈实例统计
 * GET /api/v1/tenant/healing/instances/stats
 */
export async function getHealingInstanceStats() {
    return request<{
        code: number;
        data: {
            total: number;
            by_status: Array<{ status: string; count: number }>;
        };
    }>('/api/v1/tenant/healing/instances/stats', { method: 'GET' });
}

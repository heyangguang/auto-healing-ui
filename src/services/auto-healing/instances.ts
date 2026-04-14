import { request } from '@umijs/max';
import {
    getTenantHealingInstances,
    getTenantHealingInstancesId,
} from '@/services/generated/auto-healing/flowInstances';
import type { ServiceRequestOptions } from './requestOptions';

export type HealingInstanceQueryParams = {
    page?: number;
    page_size?: number;
    status?: AutoHealing.FlowInstanceStatus;
    flow_id?: string;
    rule_id?: string;
    incident_id?: string;
    has_error?: boolean;
    approval_status?: 'approved' | 'rejected';
    flow_name?: string;
    rule_name?: string;
    incident_title?: string;
    error_message?: string;
    created_from?: string;
    created_to?: string;
    started_from?: string;
    started_to?: string;
    completed_from?: string;
    completed_to?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
};

export type FlowRecoveryAttempt = {
    id: string;
    flow_instance_id: string;
    trigger_source: 'manual' | 'scheduler';
    current_node_id?: string;
    current_node_type?: string;
    detect_reason?: string;
    recovery_action?: string;
    status: 'started' | 'success' | 'failed' | 'skipped';
    details?: Record<string, unknown>;
    error_message?: string | null;
    started_at: string;
    finished_at?: string | null;
    created_at: string;
};

/** 获取自愈实例列表 GET /api/v1/tenant/healing/instances */
export async function getHealingInstances(
    params: HealingInstanceQueryParams,
    options?: ServiceRequestOptions,
) {
    return getTenantHealingInstances(
        params as GeneratedAutoHealing.getTenantHealingInstancesParams,
        options,
    ) as Promise<AutoHealing.PaginatedResponse<AutoHealing.FlowInstance>>;
}

/** 获取自愈实例详情 GET /api/v1/tenant/healing/instances/:id */
export async function getHealingInstanceDetail(id: string, options?: ServiceRequestOptions) {
    return getTenantHealingInstancesId({ id }, options) as Promise<{ data: AutoHealing.FlowInstance }>;
}

/** 取消自愈实例 POST /api/v1/tenant/healing/instances/:id/cancel */
export async function cancelHealingInstance(id: string, options?: ServiceRequestOptions) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/healing/instances/${id}/cancel`, {
        method: 'POST',
        ...(options || {}),
    });
}

/** 重试自愈实例 POST /api/v1/tenant/healing/instances/:id/retry */
export async function retryHealingInstance(
    id: string,
    data?: AutoHealing.RetryInstanceRequest,
    options?: ServiceRequestOptions,
) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/healing/instances/${id}/retry`, {
        method: 'POST',
        data,
        ...(options || {}),
    });
}

/** 手动恢复自愈实例 POST /api/v1/tenant/healing/instances/:id/recover */
export async function recoverHealingInstance(id: string, options?: ServiceRequestOptions) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/healing/instances/${id}/recover`, {
        method: 'POST',
        ...(options || {}),
    });
}

/** 获取实例恢复记录 GET /api/v1/tenant/healing/instances/:id/recovery-logs */
export async function getHealingInstanceRecoveryLogs(id: string, options?: ServiceRequestOptions) {
    return request<{ data: FlowRecoveryAttempt[] }>(`/api/v1/tenant/healing/instances/${id}/recovery-logs`, {
        method: 'GET',
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

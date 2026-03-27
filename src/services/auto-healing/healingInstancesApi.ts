import { request } from '@umijs/max';
import {
    getTenantHealingInstances,
    getTenantHealingInstancesId,
} from '@/services/generated/auto-healing/flowInstances';
import type { HealingInstanceQueryParams } from './instances';

export async function getInstances(params?: {
    page?: HealingInstanceQueryParams['page'];
    page_size?: HealingInstanceQueryParams['page_size'];
    status?: HealingInstanceQueryParams['status'];
    flow_id?: HealingInstanceQueryParams['flow_id'];
    rule_id?: HealingInstanceQueryParams['rule_id'];
    incident_id?: HealingInstanceQueryParams['incident_id'];
    has_error?: HealingInstanceQueryParams['has_error'];
    approval_status?: HealingInstanceQueryParams['approval_status'];
    flow_name?: HealingInstanceQueryParams['flow_name'];
    rule_name?: HealingInstanceQueryParams['rule_name'];
    incident_title?: HealingInstanceQueryParams['incident_title'];
    error_message?: HealingInstanceQueryParams['error_message'];
    created_from?: HealingInstanceQueryParams['created_from'];
    created_to?: HealingInstanceQueryParams['created_to'];
    started_from?: HealingInstanceQueryParams['started_from'];
    started_to?: HealingInstanceQueryParams['started_to'];
    completed_from?: HealingInstanceQueryParams['completed_from'];
    completed_to?: HealingInstanceQueryParams['completed_to'];
    sort_by?: HealingInstanceQueryParams['sort_by'];
    sort_order?: HealingInstanceQueryParams['sort_order'];
}) {
    return getTenantHealingInstances(
        (params || {}) as GeneratedAutoHealing.getTenantHealingInstancesParams,
    ) as Promise<AutoHealing.PaginatedResponse<AutoHealing.FlowInstance>>;
}

export async function getInstance(id: string) {
    return getTenantHealingInstancesId({ id }) as Promise<{ data: AutoHealing.FlowInstance }>;
}

export async function cancelInstance(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/healing/instances/${id}/cancel`, {
        method: 'POST',
    });
}

export async function retryInstance(id: string, data?: AutoHealing.RetryInstanceRequest) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/healing/instances/${id}/retry`, {
        method: 'POST',
        data,
    });
}

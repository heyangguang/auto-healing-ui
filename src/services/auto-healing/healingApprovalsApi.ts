import { request } from '@umijs/max';
import {
    getTenantHealingApprovals,
    postTenantHealingApprovalsIdApprove,
    postTenantHealingApprovalsIdReject,
} from '@/services/generated/auto-healing/approvals';

export async function getApprovals(params?: {
    page?: number;
    page_size?: number;
    status?: AutoHealing.ApprovalStatus;
}) {
    return getTenantHealingApprovals((params || {}) as GeneratedAutoHealing.getTenantHealingApprovalsParams) as Promise<AutoHealing.PaginatedResponse<AutoHealing.ApprovalTask>>;
}

export async function getPendingApprovals(params?: {
    page?: number;
    page_size?: number;
    node_name?: string;
    date_from?: string;
    date_to?: string;
}) {
    return request<AutoHealing.PaginatedResponse<AutoHealing.ApprovalTask>>('/api/v1/tenant/healing/approvals/pending', {
        method: 'GET',
        params,
    });
}

export async function getApproval(id: string) {
    return request<AutoHealing.ApprovalTask>(`/api/v1/tenant/healing/approvals/${id}`, {
        method: 'GET',
    });
}

export async function approveTask(id: string, data?: AutoHealing.ApprovalDecisionRequest) {
    return postTenantHealingApprovalsIdApprove(
        { id },
        data || {},
    ) as Promise<AutoHealing.SuccessResponse>;
}

export async function rejectTask(id: string, data?: AutoHealing.ApprovalDecisionRequest) {
    return postTenantHealingApprovalsIdReject(
        { id },
        data || {},
    ) as Promise<AutoHealing.SuccessResponse>;
}

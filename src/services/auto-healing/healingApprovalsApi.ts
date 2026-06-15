import { request } from '@umijs/max';
import {
    getTenantHealingApprovals,
    postTenantHealingApprovalsIdApprove,
    postTenantHealingApprovalsIdReject,
} from '@/services/generated/auto-healing/approvals';
import { normalizePaginatedResponse } from './responseAdapters';

type ApprovalHistoryStatus = Exclude<AutoHealing.ApprovalStatus, 'pending'>;
type ApprovalHistoryParams = {
    page?: number;
    page_size?: number;
    flow_instance_id?: string;
    status?: ApprovalHistoryStatus;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
};

const APPROVAL_HISTORY_STATUSES: ApprovalHistoryStatus[] = ['approved', 'rejected', 'expired'];

function getApprovalSortValue(
    item: AutoHealing.ApprovalTask,
    sortBy?: string,
) {
    if (sortBy === 'decided_at') {
        return Date.parse(item.decided_at || '') || 0;
    }
    return Date.parse(item.created_at || '') || 0;
}

function sortApprovalHistoryItems(
    items: AutoHealing.ApprovalTask[],
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc',
) {
    return [...items].sort((left, right) => {
        const delta = getApprovalSortValue(left, sortBy) - getApprovalSortValue(right, sortBy);
        return sortOrder === 'asc' ? delta : -delta;
    });
}

export async function getApprovals(params?: {
    page?: number;
    page_size?: number;
    flow_instance_id?: string;
    status?: AutoHealing.ApprovalStatus;
}) {
    return normalizePaginatedResponse<AutoHealing.ApprovalTask>(
        await getTenantHealingApprovals((params || {}) as GeneratedAutoHealing.getTenantHealingApprovalsParams),
    );
}

export async function getApprovalHistory(params?: ApprovalHistoryParams) {
    if (params?.status) {
        return normalizePaginatedResponse<AutoHealing.ApprovalTask>(await request<AutoHealing.PaginatedResponse<AutoHealing.ApprovalTask>>('/api/v1/tenant/healing/approvals', {
            method: 'GET',
            params,
        }));
    }

    const page = params?.page ?? 1;
    const pageSize = params?.page_size ?? 20;
    const mergedPageSize = page * pageSize;
    const responses = await Promise.all(APPROVAL_HISTORY_STATUSES.map((status) => (
        request<AutoHealing.PaginatedResponse<AutoHealing.ApprovalTask>>('/api/v1/tenant/healing/approvals', {
            method: 'GET',
            params: {
                ...params,
                page: 1,
                page_size: mergedPageSize,
                status,
            },
        })
    )));
    const normalizedResponses = responses.map((response) => normalizePaginatedResponse<AutoHealing.ApprovalTask>(response));
    const mergedItems = sortApprovalHistoryItems(
        normalizedResponses.flatMap((response) => response.data || []),
        params?.sort_by,
        params?.sort_order,
    );
    const startIndex = (page - 1) * pageSize;

    return {
        data: mergedItems.slice(startIndex, startIndex + pageSize),
        total: normalizedResponses.reduce((sum, response) => sum + Number(response.total ?? response.data?.length ?? 0), 0),
    } as AutoHealing.PaginatedResponse<AutoHealing.ApprovalTask>;
}

export async function getPendingApprovals(params?: {
    page?: number;
    page_size?: number;
    node_name?: string;
    date_from?: string;
    date_to?: string;
}) {
    return normalizePaginatedResponse<AutoHealing.ApprovalTask>(await request<AutoHealing.PaginatedResponse<AutoHealing.ApprovalTask>>('/api/v1/tenant/healing/approvals/pending', {
        method: 'GET',
        params,
    }));
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

import { request } from '@umijs/max';
import { normalizePaginatedResponse, unwrapData, unwrapItems } from '../responseAdapters';

/**
 * 平台级 Impersonation API
 * 所有 API 不携带 X-Tenant-ID（平台级接口）
 */

// ==================== 类型定义 ====================

export interface ImpersonationRequest {
    id: string;
    requester_id: string;
    requester_name: string;
    tenant_id: string;
    tenant_name: string;
    reason?: string;
    duration_minutes: number;
    status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'expired' | 'cancelled';
    approved_by?: string;
    approver_name?: string;
    approved_at?: string;
    session_started_at?: string;
    session_expires_at?: string;
    completed_at?: string;
    created_at: string;
    updated_at: string;
}

export type ImpersonationStatus = ImpersonationRequest['status'];

export interface ImpersonationListParams {
    page?: number;
    page_size?: number;
    requester_name?: string;
    requester_name__exact?: string;
    tenant_name?: string;
    tenant_name__exact?: string;
    reason?: string;
    reason__exact?: string;
    status?: ImpersonationStatus;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

export interface ImpersonationApprover {
    id: string;
    tenant_id: string;
    user_id: string;
    user?: { id: string; username: string; display_name?: string };
    created_at: string;
}

// ==================== 平台管理员 API ====================

/** 提交 Impersonation 申请 */
export async function createImpersonationRequest(data: {
    tenant_id: string;
    reason?: string;
    duration_minutes: number;
}) {
    return unwrapData(await request<{ data: ImpersonationRequest }>('/api/v1/platform/impersonation/requests', {
        method: 'POST',
        data,
    })) as ImpersonationRequest;
}

/** 获取我的申请列表 */
export async function listMyImpersonationRequests(params?: ImpersonationListParams) {
    return normalizePaginatedResponse(await request<AutoHealing.PaginatedResponse<ImpersonationRequest>>('/api/v1/platform/impersonation/requests', {
        method: 'GET',
        params,
    }));
}

/** 获取申请详情 */
export async function getImpersonationRequest(id: string) {
    return unwrapData(await request<{ data: ImpersonationRequest }>(`/api/v1/platform/impersonation/requests/${id}`, {
        method: 'GET',
    })) as ImpersonationRequest;
}

/** 进入租户（开始 Impersonation 会话） */
export async function enterTenant(requestId: string) {
    return unwrapData(await request<{ data: ImpersonationRequest }>(`/api/v1/platform/impersonation/requests/${requestId}/enter`, {
        method: 'POST',
    })) as ImpersonationRequest;
}

/** 退出租户（结束 Impersonation 会话） */
export async function exitTenant(requestId: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/platform/impersonation/requests/${requestId}/exit`, {
        method: 'POST',
    });
}

/** 终止会话（彻底结束，不可再进入） */
export async function terminateSession(requestId: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/platform/impersonation/requests/${requestId}/terminate`, {
        method: 'POST',
    });
}

/** 撤销申请 */
export async function cancelImpersonationRequest(requestId: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/platform/impersonation/requests/${requestId}/cancel`, {
        method: 'POST',
    });
}

// ==================== 租户审批 API ====================
// 这些接口需要携带 X-Tenant-ID（由拦截器自动注入）

/** 获取待审批列表 */
export async function listPendingImpersonation() {
    return unwrapItems(await request<{ data: ImpersonationRequest[] }>('/api/v1/tenant/impersonation/pending', {
        method: 'GET',
    })) as ImpersonationRequest[];
}

/** 获取审批记录（历史） */
export async function listImpersonationHistory(params?: ImpersonationListParams) {
    return normalizePaginatedResponse(await request<AutoHealing.PaginatedResponse<ImpersonationRequest>>('/api/v1/tenant/impersonation/history', {
        method: 'GET',
        params,
    }));
}

/** 审批通过 */
export async function approveImpersonation(requestId: string, data?: AutoHealing.ApprovalDecisionRequest) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/impersonation/${requestId}/approve`, {
        method: 'POST',
        data,
    });
}

/** 审批拒绝 */
export async function rejectImpersonation(requestId: string, data?: AutoHealing.ApprovalDecisionRequest) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/impersonation/${requestId}/reject`, {
        method: 'POST',
        data,
    });
}

// ==================== 审批组 API ====================

/** 获取审批人列表 */
export async function getImpersonationApprovers() {
    return unwrapItems(await request<{ data: ImpersonationApprover[] }>('/api/v1/tenant/settings/impersonation-approvers', {
        method: 'GET',
    })) as ImpersonationApprover[];
}

/** 设置审批人 */
export async function setImpersonationApprovers(userIds: string[]) {
    return request<AutoHealing.SuccessResponse>('/api/v1/tenant/settings/impersonation-approvers', {
        method: 'PUT',
        data: { user_ids: userIds },
    });
}

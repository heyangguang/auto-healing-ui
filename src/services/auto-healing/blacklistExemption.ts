import { request } from '@umijs/max';
import { normalizePaginatedResponse, unwrapData } from './responseAdapters';

// ===== 安全豁免 API =====

export interface ExemptionRecord {
    id: string;
    tenant_id?: string;
    task_id: string;
    task_name: string;
    rule_id: string;
    rule_name: string;
    rule_severity: string;
    rule_pattern: string;
    reason: string;
    requested_by: string;
    requester_name: string;
    status: 'pending' | 'approved' | 'rejected' | 'expired';
    approved_by?: string;
    approver_name?: string;
    approved_at?: string;
    reject_reason?: string;
    validity_days: number;
    expires_at?: string;
    created_at: string;
    updated_at: string;
}

type BlacklistExemptionQueryValue =
    | string
    | number
    | boolean
    | [string | undefined, string | undefined];

export interface BlacklistExemptionListParams {
    page?: number;
    page_size?: number;
    status?: ExemptionRecord['status'];
    [key: string]: BlacklistExemptionQueryValue | undefined;
}

export type CreateBlacklistExemptionRequest = {
    task_id: string;
    task_name: string;
    rule_id: string;
    rule_name: string;
    rule_severity: string;
    rule_pattern: string;
    reason: string;
    validity_days: number;
};

/** 查询豁免列表 */
export async function getBlacklistExemptions(params?: BlacklistExemptionListParams) {
    return normalizePaginatedResponse(await request<{ data: ExemptionRecord[]; total: number }>('/api/v1/tenant/blacklist-exemptions', {
        method: 'GET',
        params,
    }));
}

/** 获取单个豁免详情 */
export async function getBlacklistExemption(id: string) {
    return unwrapData(await request<{ data: ExemptionRecord }>(`/api/v1/tenant/blacklist-exemptions/${id}`, {
        method: 'GET',
    })) as ExemptionRecord;
}

/** 创建豁免申请 */
export async function createBlacklistExemption(data: CreateBlacklistExemptionRequest) {
    return unwrapData(await request<{ data: ExemptionRecord }>('/api/v1/tenant/blacklist-exemptions', {
        method: 'POST',
        data,
    })) as ExemptionRecord;
}

/** 审批通过 */
export async function approveBlacklistExemption(id: string) {
    return request<{ message: string }>(`/api/v1/tenant/blacklist-exemptions/${id}/approve`, {
        method: 'POST',
    });
}

/** 审批拒绝 */
export async function rejectBlacklistExemption(id: string, rejectReason?: string) {
    return request<{ message: string }>(`/api/v1/tenant/blacklist-exemptions/${id}/reject`, {
        method: 'POST',
        data: { reject_reason: rejectReason },
    });
}

/** 获取待审批列表 */
export async function getPendingExemptions(params?: BlacklistExemptionListParams) {
    return normalizePaginatedResponse(await request<{ data: ExemptionRecord[]; total: number }>('/api/v1/tenant/blacklist-exemptions/pending', {
        method: 'GET',
        params,
    }));
}

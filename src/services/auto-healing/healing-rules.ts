import { request } from '@umijs/max';
import {
    getTenantHealingRules,
    getTenantHealingRulesId,
    postTenantHealingRules,
    postTenantHealingRulesIdActivate,
} from '@/services/generated/auto-healing/healingRules';
import type { ServiceRequestOptions } from './requestOptions';

export type HealingRuleQueryParams = {
    page?: number;
    page_size?: number;
    search?: string;
    name?: string;
    name__exact?: string;
    description?: string;
    description__exact?: string;
    is_active?: boolean;
    flow_id?: string;
    trigger_mode?: AutoHealing.TriggerMode;
    priority?: number;
    match_mode?: AutoHealing.MatchMode;
    has_flow?: boolean;
    created_from?: string;
    created_to?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
};

/** 获取自愈规则列表 GET /api/v1/tenant/healing/rules */
export async function getHealingRules(
    params: HealingRuleQueryParams,
    options?: ServiceRequestOptions,
) {
    return getTenantHealingRules(params as GeneratedAutoHealing.getTenantHealingRulesParams, options) as Promise<AutoHealing.PaginatedResponse<AutoHealing.HealingRule>>;
}

/** 创建自愈规则 POST /api/v1/tenant/healing/rules */
export async function createHealingRule(
    body: AutoHealing.CreateHealingRuleRequest,
    options?: ServiceRequestOptions,
) {
    return postTenantHealingRules({
        data: body,
        headers: {
            'Content-Type': 'application/json',
        },
        ...(options || {}),
    }) as Promise<AutoHealing.SuccessResponse & { data: AutoHealing.HealingRule }>;
}

/** 获取自愈规则详情 GET /api/v1/tenant/healing/rules/{id} */
export async function getHealingRule(
    id: string,
    options?: ServiceRequestOptions,
) {
    return getTenantHealingRulesId({ id }, options) as Promise<AutoHealing.SuccessResponse & { data: AutoHealing.HealingRule }>;
}

/** 更新自愈规则 PUT /api/v1/tenant/healing/rules/{id} */
export async function updateHealingRule(
    id: string,
    body: AutoHealing.UpdateHealingRuleRequest,
    options?: ServiceRequestOptions,
) {
    return request<AutoHealing.SuccessResponse & { data: AutoHealing.HealingRule }>(`/api/v1/tenant/healing/rules/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        data: body,
        ...(options || {}),
    });
}

/** 删除自愈规则 DELETE /api/v1/tenant/healing/rules/{id} */
export async function deleteHealingRule(
    id: string,
    params?: {
        force?: boolean;
    },
    options?: ServiceRequestOptions,
) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/healing/rules/${id}`, {
        method: 'DELETE',
        params: {
            ...params,
        },
        ...(options || {}),
    });
}

/** 启用自愈规则 POST /api/v1/tenant/healing/rules/{id}/activate */
export async function activateHealingRule(
    id: string,
    options?: ServiceRequestOptions,
) {
    return postTenantHealingRulesIdActivate({ id }, options) as Promise<AutoHealing.SuccessResponse>;
}

/** 停用自愈规则 POST /api/v1/tenant/healing/rules/{id}/deactivate */
export async function deactivateHealingRule(
    id: string,
    options?: ServiceRequestOptions,
) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/healing/rules/${id}/deactivate`, {
        method: 'POST',
        ...(options || {}),
    });
}

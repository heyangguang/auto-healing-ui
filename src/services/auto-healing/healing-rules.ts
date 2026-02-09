
import { request } from '@umijs/max';

/** 获取自愈规则列表 GET /api/v1/healing/rules */
export async function getHealingRules(
    params: {
        // query
        page?: number;
        page_size?: number;
        is_active?: boolean;
        flow_id?: string;
    },
    options?: { [key: string]: any },
) {
    return request<AutoHealing.PaginatedResponse<AutoHealing.HealingRule>>('/api/v1/healing/rules', {
        method: 'GET',
        params: {
            ...params,
        },
        ...(options || {}),
    });
}

/** 创建自愈规则 POST /api/v1/healing/rules */
export async function createHealingRule(
    body: AutoHealing.CreateHealingRuleRequest,
    options?: { [key: string]: any },
) {
    return request<AutoHealing.SuccessResponse & { data: AutoHealing.HealingRule }>('/api/v1/healing/rules', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: body,
        ...(options || {}),
    });
}

/** 获取自愈规则详情 GET /api/v1/healing/rules/{id} */
export async function getHealingRule(
    id: string,
    options?: { [key: string]: any },
) {
    return request<AutoHealing.SuccessResponse & { data: AutoHealing.HealingRule }>(`/api/v1/healing/rules/${id}`, {
        method: 'GET',
        ...(options || {}),
    });
}

/** 更新自愈规则 PUT /api/v1/healing/rules/{id} */
export async function updateHealingRule(
    id: string,
    body: AutoHealing.UpdateHealingRuleRequest,
    options?: { [key: string]: any },
) {
    return request<AutoHealing.SuccessResponse & { data: AutoHealing.HealingRule }>(`/api/v1/healing/rules/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        data: body,
        ...(options || {}),
    });
}

/** 删除自愈规则 DELETE /api/v1/healing/rules/{id} */
export async function deleteHealingRule(
    id: string,
    params?: {
        force?: boolean;
    },
    options?: { [key: string]: any },
) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/healing/rules/${id}`, {
        method: 'DELETE',
        params: {
            ...params,
        },
        ...(options || {}),
    });
}

/** 启用自愈规则 POST /api/v1/healing/rules/{id}/activate */
export async function activateHealingRule(
    id: string,
    options?: { [key: string]: any },
) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/healing/rules/${id}/activate`, {
        method: 'POST',
        ...(options || {}),
    });
}

/** 停用自愈规则 POST /api/v1/healing/rules/{id}/deactivate */
export async function deactivateHealingRule(
    id: string,
    options?: { [key: string]: any },
) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/healing/rules/${id}/deactivate`, {
        method: 'POST',
        ...(options || {}),
    });
}

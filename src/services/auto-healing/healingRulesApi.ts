import { request } from '@umijs/max';
import {
    getTenantHealingRules,
    getTenantHealingRulesId,
    postTenantHealingRules,
    postTenantHealingRulesIdActivate,
} from '@/services/generated/auto-healing/healingRules';
import type { HealingRuleQueryParams } from './healing-rules';
import { getSearchSchema, type SearchSchemaEnvelope } from './searchSchema';

export async function getRules(params?: {
    page?: HealingRuleQueryParams['page'];
    page_size?: HealingRuleQueryParams['page_size'];
    search?: HealingRuleQueryParams['search'];
    name?: HealingRuleQueryParams['name'];
    name__exact?: HealingRuleQueryParams['name__exact'];
    description?: HealingRuleQueryParams['description'];
    description__exact?: HealingRuleQueryParams['description__exact'];
    is_active?: HealingRuleQueryParams['is_active'];
    flow_id?: HealingRuleQueryParams['flow_id'];
    trigger_mode?: HealingRuleQueryParams['trigger_mode'];
    priority?: HealingRuleQueryParams['priority'];
    match_mode?: HealingRuleQueryParams['match_mode'];
    has_flow?: HealingRuleQueryParams['has_flow'];
    created_from?: HealingRuleQueryParams['created_from'];
    created_to?: HealingRuleQueryParams['created_to'];
    sort_by?: HealingRuleQueryParams['sort_by'];
    sort_order?: HealingRuleQueryParams['sort_order'];
}) {
    return getTenantHealingRules(
        (params || {}) as GeneratedAutoHealing.getTenantHealingRulesParams,
    ) as Promise<AutoHealing.PaginatedResponse<AutoHealing.HealingRule>>;
}

export async function getRuleSearchSchema() {
    return getSearchSchema('/api/v1/tenant/healing/rules/search-schema') as Promise<SearchSchemaEnvelope>;
}

export async function getRule(id: string) {
    return getTenantHealingRulesId({ id }) as Promise<{ data: AutoHealing.HealingRule }>;
}

export async function createRule(data: AutoHealing.CreateRuleRequest) {
    return postTenantHealingRules(data) as Promise<{ data: AutoHealing.HealingRule }>;
}

export async function updateRule(id: string, data: AutoHealing.UpdateRuleRequest) {
    return request<AutoHealing.HealingRule>(`/api/v1/tenant/healing/rules/${id}`, {
        method: 'PUT',
        data,
    });
}

export async function deleteRule(id: string, force?: boolean) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/healing/rules/${id}`, {
        method: 'DELETE',
        params: force ? { force: true } : undefined,
    });
}

export async function activateRule(id: string) {
    return postTenantHealingRulesIdActivate({ id }) as Promise<AutoHealing.SuccessResponse>;
}

export async function deactivateRule(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/healing/rules/${id}/deactivate`, {
        method: 'POST',
    });
}

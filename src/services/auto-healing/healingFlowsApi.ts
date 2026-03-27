import { request } from '@umijs/max';
import {
    deleteTenantHealingFlowsId,
    getTenantHealingFlows,
    getTenantHealingFlowsId,
    postTenantHealingFlows,
    postTenantHealingFlowsIdDryRun,
    putTenantHealingFlowsId,
} from '@/services/generated/auto-healing/healingFlows';
import { getSearchSchema, type SearchSchemaEnvelope } from './searchSchema';
import { unwrapData } from './responseAdapters';

export async function getFlows(params?: {
    page?: number;
    page_size?: number;
    is_active?: boolean;
    search?: string;
    name?: string;
    name__exact?: string;
    description?: string;
    description__exact?: string;
    node_type?: string;
    min_nodes?: number;
    max_nodes?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    created_from?: string;
    created_to?: string;
    updated_from?: string;
    updated_to?: string;
}) {
    return getTenantHealingFlows(
        (params || {}) as GeneratedAutoHealing.getTenantHealingFlowsParams,
    ) as Promise<AutoHealing.PaginatedResponse<AutoHealing.HealingFlow>>;
}

export async function getFlow(id: string) {
    return getTenantHealingFlowsId({ id }) as Promise<{ data: AutoHealing.HealingFlow }>;
}

export async function createFlow(data: AutoHealing.CreateFlowRequest) {
    return postTenantHealingFlows(
        data as unknown as GeneratedAutoHealing.HealingFlowCreate,
    ) as Promise<{ data: AutoHealing.HealingFlow }>;
}

export async function updateFlow(id: string, data: AutoHealing.UpdateFlowRequest) {
    return putTenantHealingFlowsId(
        { id },
        data as unknown as GeneratedAutoHealing.HealingFlowUpdate,
    ) as Promise<{ data: AutoHealing.HealingFlow }>;
}

export async function deleteFlow(id: string) {
    return deleteTenantHealingFlowsId({ id }) as Promise<AutoHealing.SuccessResponse>;
}

export async function dryRunFlow(id: string, data: AutoHealing.DryRunRequest) {
    return {
        data: unwrapData(
            await (postTenantHealingFlowsIdDryRun(
                { id },
                data as unknown as Record<string, unknown>,
            ) as Promise<{ data?: AutoHealing.DryRunResponse } | AutoHealing.DryRunResponse>),
        ) as AutoHealing.DryRunResponse,
    };
}

export async function getNodeSchema() {
    return request<{ data: AutoHealing.NodeSchema }>('/api/v1/tenant/healing/flows/node-schema', {
        method: 'GET',
    });
}

export async function getFlowSearchSchema() {
    return getSearchSchema('/api/v1/tenant/healing/flows/search-schema') as Promise<SearchSchemaEnvelope>;
}

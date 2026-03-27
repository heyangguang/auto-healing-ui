import { request } from '@umijs/max';
import { normalizePaginatedResponse, unwrapData } from './responseAdapters';
import { getSearchSchema, type SearchSchemaEnvelope } from './searchSchema';

/** 黑名单规则类型 */
export interface CommandBlacklistRule {
    id: string;
    name: string;
    pattern: string;
    match_type: 'contains' | 'regex' | 'exact';
    severity: 'critical' | 'high' | 'medium';
    category: string;
    description: string;
    is_active: boolean;
    is_system: boolean;
    created_at: string;
    updated_at: string;
}

export type CommandBlacklistListParams = {
    page?: number;
    page_size?: number;
    name?: string;
    name__exact?: string;
    pattern?: string;
    pattern__exact?: string;
    category?: string;
    severity?: CommandBlacklistRule['severity'];
    is_active?: boolean | string;
};

export type CommandBlacklistMutationRequest = Partial<Pick<
    CommandBlacklistRule,
    'name' | 'pattern' | 'match_type' | 'severity' | 'category' | 'description' | 'is_active'
>>;

export type BlacklistSimulationRequest = {
    pattern: string;
    match_type: CommandBlacklistRule['match_type'];
    files?: Array<{ path: string; content: string }>;
    content?: string;
};

export type BlacklistSimulationResponse = {
    results: Array<{ line: number; content: string; matched: boolean; file?: string }>;
    total_lines: number;
    match_count: number;
    matched_files: Record<string, number>;
};

/** 列表查询 */
export async function getCommandBlacklist(params?: CommandBlacklistListParams) {
    return normalizePaginatedResponse(await request<{
        data: CommandBlacklistRule[];
        total: number;
        page: number;
        page_size: number;
    }>('/api/v1/tenant/command-blacklist', {
        method: 'GET',
        params,
    }));
}

/** 获取详情 */
export async function getCommandBlacklistRule(id: string) {
    return unwrapData(await request<{ data: CommandBlacklistRule }>(`/api/v1/tenant/command-blacklist/${id}`, {
        method: 'GET',
    })) as CommandBlacklistRule;
}

/** 创建规则 */
export async function createCommandBlacklistRule(data: CommandBlacklistMutationRequest) {
    return unwrapData(await request<{ data: CommandBlacklistRule }>('/api/v1/tenant/command-blacklist', {
        method: 'POST',
        data,
    })) as CommandBlacklistRule;
}

/** 更新规则 */
export async function updateCommandBlacklistRule(id: string, data: CommandBlacklistMutationRequest) {
    return unwrapData(await request<{ data: CommandBlacklistRule }>(`/api/v1/tenant/command-blacklist/${id}`, {
        method: 'PUT',
        data,
    })) as CommandBlacklistRule;
}

/** 删除规则 */
export async function deleteCommandBlacklistRule(id: string) {
    return request<{ message: string }>(`/api/v1/tenant/command-blacklist/${id}`, {
        method: 'DELETE',
    });
}

/** 切换启用/禁用 */
export async function toggleCommandBlacklistRule(id: string) {
    return unwrapData(await request<{ data: CommandBlacklistRule }>(`/api/v1/tenant/command-blacklist/${id}/toggle`, {
        method: 'POST',
    })) as CommandBlacklistRule;
}

/** 批量启用/禁用 */
export async function batchToggleCommandBlacklistRules(ids: string[], isActive: boolean) {
    return request<{ message: string; count: number }>('/api/v1/tenant/command-blacklist/batch-toggle', {
        method: 'POST',
        data: { ids, is_active: isActive },
    });
}

/** 搜索 Schema */
export async function getCommandBlacklistSearchSchema() {
    return getSearchSchema('/api/v1/tenant/command-blacklist/search-schema') as Promise<SearchSchemaEnvelope>;
}

/** 仿真测试 — 使用后端生产匹配引擎 */
export async function simulateBlacklist(data: BlacklistSimulationRequest) {
    return unwrapData(await request<{
        data: BlacklistSimulationResponse;
    }>('/api/v1/tenant/command-blacklist/simulate', {
        method: 'POST',
        data,
    })) as BlacklistSimulationResponse;
}

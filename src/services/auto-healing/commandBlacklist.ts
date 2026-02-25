import { request } from '@umijs/max';

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

/** 列表查询 */
export async function getCommandBlacklist(params?: Record<string, any>) {
    return request<{
        data: CommandBlacklistRule[];
        total: number;
        page: number;
        page_size: number;
    }>('/api/v1/tenant/command-blacklist', {
        method: 'GET',
        params,
    });
}

/** 获取详情 */
export async function getCommandBlacklistRule(id: string) {
    return request<{ data: CommandBlacklistRule }>(`/api/v1/tenant/command-blacklist/${id}`, {
        method: 'GET',
    });
}

/** 创建规则 */
export async function createCommandBlacklistRule(data: Partial<CommandBlacklistRule>) {
    return request<{ data: CommandBlacklistRule }>('/api/v1/tenant/command-blacklist', {
        method: 'POST',
        data,
    });
}

/** 更新规则 */
export async function updateCommandBlacklistRule(id: string, data: Partial<CommandBlacklistRule>) {
    return request<{ data: CommandBlacklistRule }>(`/api/v1/tenant/command-blacklist/${id}`, {
        method: 'PUT',
        data,
    });
}

/** 删除规则 */
export async function deleteCommandBlacklistRule(id: string) {
    return request<{ message: string }>(`/api/v1/tenant/command-blacklist/${id}`, {
        method: 'DELETE',
    });
}

/** 切换启用/禁用 */
export async function toggleCommandBlacklistRule(id: string) {
    return request<{ data: CommandBlacklistRule }>(`/api/v1/tenant/command-blacklist/${id}/toggle`, {
        method: 'POST',
    });
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
    return request<{ fields: any[] }>('/api/v1/tenant/command-blacklist/search-schema', {
        method: 'GET',
    });
}

/** 仿真测试 — 使用后端生产匹配引擎 */
export async function simulateBlacklist(data: {
    pattern: string;
    match_type: string;
    files?: { path: string; content: string }[];
    content?: string;
}) {
    return request<{
        data: {
            results: { line: number; content: string; matched: boolean; file?: string }[];
            total_lines: number;
            match_count: number;
            matched_files: Record<string, number>;
        };
    }>('/api/v1/tenant/command-blacklist/simulate', {
        method: 'POST',
        data,
    });
}

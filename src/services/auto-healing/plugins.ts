import { request } from '@umijs/max';
import {
    deleteTenantPluginsId,
    getTenantPlugins,
    getTenantPluginsId,
    postTenantPlugins,
    postTenantPluginsIdSync,
    putTenantPluginsId,
} from '@/services/generated/auto-healing/plugins';
import { unwrapData } from './responseAdapters';

export type PluginRecord = AutoHealing.Plugin & {
    max_failures?: number;
    updated_at?: string;
};

export type PluginListParams = {
    description?: string;
    description__exact?: string;
    name?: string;
    name__exact?: string;
    page?: number;
    page_size?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    status?: 'active' | 'inactive' | 'error';
    type?: 'itsm' | 'cmdb';
};

export interface PluginStats {
    active_count: number;
    by_status: { active: number; error: number; inactive: number };
    by_type: { cmdb: number; itsm: number };
    error_count: number;
    inactive_count: number;
    sync_disabled: number;
    sync_enabled: number;
    total: number;
}

type PluginStatsEnvelope = {
    data: PluginStats;
};

/**
 * 获取插件列表
 */
export async function getPlugins(params?: PluginListParams) {
    return getTenantPlugins(params as GeneratedAutoHealing.getTenantPluginsParams) as Promise<AutoHealing.PaginatedResponse<PluginRecord>>;
}

/**
 * 获取插件统计
 */
export async function getPluginsStats() {
    return request<PluginStatsEnvelope>('/api/v1/tenant/plugins/stats', {
        method: 'GET',
    });
}

/**
 * 获取插件详情
 */
export async function getPlugin(id: string) {
    return unwrapData(await (getTenantPluginsId({ id }) as Promise<{ data: PluginRecord } | PluginRecord>));
}

/**
 * 创建插件
 */
export async function createPlugin(data: AutoHealing.CreatePluginRequest) {
    return unwrapData(await (postTenantPlugins(data) as Promise<{ data: PluginRecord } | PluginRecord>));
}

/**
 * 更新插件
 */
export async function updatePlugin(id: string, data: AutoHealing.UpdatePluginRequest) {
    return unwrapData(await (putTenantPluginsId({ id }, data) as Promise<{ data: PluginRecord } | PluginRecord>));
}

/**
 * 删除插件
 */
export async function deletePlugin(id: string) {
    return deleteTenantPluginsId({ id }) as Promise<AutoHealing.SuccessResponse>;
}

/**
 * 测试插件连接
 */
export async function testPlugin(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/plugins/${id}/test`, {
        method: 'POST',
    });
}

/**
 * 触发手动同步
 */
export async function syncPlugin(id: string) {
    return unwrapData(
        await (postTenantPluginsIdSync({ id }) as Promise<{ data: AutoHealing.PluginSyncLog } | AutoHealing.PluginSyncLog>),
    );
}

/**
 * 获取插件同步日志
 */
export async function getPluginSyncLogs(id: string, params?: {
    page?: number;
    page_size?: number;
}) {
    return request<AutoHealing.PaginatedResponse<AutoHealing.PluginSyncLog>>(`/api/v1/tenant/plugins/${id}/logs`, {
        method: 'GET',
        params,
    });
}

/**
 * 激活插件（测试连接成功后激活）
 */
export async function activatePlugin(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/plugins/${id}/activate`, {
        method: 'POST',
    });
}

/**
 * 停用插件
 */
export async function deactivatePlugin(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/plugins/${id}/deactivate`, {
        method: 'POST',
    });
}

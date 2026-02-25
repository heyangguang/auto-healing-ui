import { request } from '@umijs/max';

/**
 * 获取插件列表
 */
export async function getPlugins(params?: {
    page?: number;
    page_size?: number;
    type?: 'itsm' | 'cmdb';
    status?: 'active' | 'inactive' | 'error';
}) {
    return request<AutoHealing.PaginatedResponse<AutoHealing.Plugin>>('/api/v1/tenant/plugins', {
        method: 'GET',
        params,
    });
}

/**
 * 获取插件统计
 */
export async function getPluginsStats() {
    return request<{
        data: {
            total: number;
            by_type: { itsm: number; cmdb: number };
            by_status: { active: number; inactive: number; error: number };
            sync_enabled: number;
            sync_disabled: number;
            active_count: number;
            inactive_count: number;
            error_count: number;
        }
    }>('/api/v1/tenant/plugins/stats', {
        method: 'GET',
    });
}

/**
 * 获取插件详情
 */
export async function getPlugin(id: string) {
    return request<AutoHealing.Plugin>(`/api/v1/tenant/plugins/${id}`, {
        method: 'GET',
    });
}

/**
 * 创建插件
 */
export async function createPlugin(data: AutoHealing.CreatePluginRequest) {
    return request<AutoHealing.Plugin>('/api/v1/tenant/plugins', {
        method: 'POST',
        data,
    });
}

/**
 * 更新插件
 */
export async function updatePlugin(id: string, data: AutoHealing.UpdatePluginRequest) {
    return request<AutoHealing.Plugin>(`/api/v1/tenant/plugins/${id}`, {
        method: 'PUT',
        data,
    });
}

/**
 * 删除插件
 */
export async function deletePlugin(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/plugins/${id}`, {
        method: 'DELETE',
    });
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
    return request<AutoHealing.PluginSyncLog>(`/api/v1/tenant/plugins/${id}/sync`, {
        method: 'POST',
    });
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


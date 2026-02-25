import { request } from '@umijs/max';

/**
 * 获取 CMDB 配置项列表
 */
export async function getCMDBItems(params?: {
    page?: number;
    page_size?: number;
    type?: AutoHealing.CMDBItemType;
    status?: AutoHealing.CMDBItemStatus;
    environment?: AutoHealing.CMDBEnvironment;
    source_plugin_name?: string;
    plugin_id?: string;
    has_plugin?: boolean | string;
    keyword?: string; // Support fuzzy search
}) {
    return request<AutoHealing.PaginatedResponse<AutoHealing.CMDBItem>>('/api/v1/tenant/cmdb', {
        method: 'GET',
        params,
    });
}

/**
 * 获取 CMDB 统计信息
 */
export async function getCMDBStats() {
    const res = await request<{ code: number; message: string; data: AutoHealing.CMDBStats }>(
        '/api/v1/tenant/cmdb/stats',
        { method: 'GET' }
    );
    return res.data;
}

/**
 * 获取 CMDB 配置项 ID 列表（轻量接口，用于全选）
 */
export async function getCMDBItemIds(params?: {
    status?: AutoHealing.CMDBItemStatus;
    keyword?: string;
}) {
    return request<{ code: number; message: string; data: { items: { id: string; name: string; hostname: string; ip_address: string; status: string }[] } }>(
        '/api/v1/tenant/cmdb/ids',
        { method: 'GET', params },
    );
}

/**
 * 获取 CMDB 配置项详情
 */
export async function getCMDBItem(id: string) {
    const res = await request<{ code: number; message: string; data: AutoHealing.CMDBItem }>(
        `/api/v1/tenant/cmdb/${id}`,
        { method: 'GET' }
    );
    return res.data;
}

/**
 * 测试单个配置项 SSH 连接
 */
export async function testCMDBConnection(id: string, secretsSourceId: string) {
    const res = await request<{ code: number; message: string; data: AutoHealing.CMDBConnectionTestResult }>(
        `/api/v1/tenant/cmdb/${id}/test-connection`,
        {
            method: 'POST',
            data: { secrets_source_id: secretsSourceId },
        }
    );
    return res.data;
}

/**
 * 批量测试 SSH 连接
 */
export async function batchTestCMDBConnection(cmdbIds: string[], secretsSourceId: string) {
    const res = await request<{ code: number; message: string; data: AutoHealing.CMDBBatchConnectionTestResult }>(
        '/api/v1/tenant/cmdb/batch-test-connection',
        {
            method: 'POST',
            data: { cmdb_ids: cmdbIds, secrets_source_id: secretsSourceId },
        }
    );
    return res.data;
}

/**
 * 进入维护模式
 */
export async function enterMaintenance(id: string, reason: string, endAt?: string) {
    return request<{ code: number; message: string }>(`/api/v1/tenant/cmdb/${id}/maintenance`, {
        method: 'POST',
        data: { reason, end_at: endAt || null },
    });
}

/**
 * 退出维护模式
 */
export async function resumeFromMaintenance(id: string) {
    return request<{ code: number; message: string }>(`/api/v1/tenant/cmdb/${id}/resume`, {
        method: 'POST',
    });
}

/**
 * 批量进入维护模式
 */
export async function batchEnterMaintenance(ids: string[], reason: string, endAt?: string) {
    const res = await request<{ code: number; message: string; data: { total: number; success: number; failed: number } }>(
        '/api/v1/tenant/cmdb/batch/maintenance',
        {
            method: 'POST',
            data: { ids, reason, end_at: endAt || null },
        }
    );
    return res.data;
}

/**
 * 批量退出维护模式
 */
export async function batchResumeFromMaintenance(ids: string[]) {
    const res = await request<{ code: number; message: string; data: { total: number; success: number; failed: number } }>(
        '/api/v1/tenant/cmdb/batch/resume',
        {
            method: 'POST',
            data: { ids },
        }
    );
    return res.data;
}

/**
 * 获取维护日志
 */
export async function getCMDBMaintenanceLogs(id: string, params?: { page?: number; page_size?: number }) {
    return request<AutoHealing.PaginatedResponse<AutoHealing.CMDBMaintenanceLog>>(
        `/api/v1/tenant/cmdb/${id}/maintenance-logs`,
        { method: 'GET', params }
    );
}

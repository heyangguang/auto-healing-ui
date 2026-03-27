import { request } from '@umijs/max';
import {
    getTenantCmdb,
    postTenantCmdbIdMaintenance,
    postTenantCmdbIdResume,
} from '@/services/generated/auto-healing/cmdb';
import { normalizePaginatedResponse, unwrapData, unwrapItems } from './responseAdapters';

/**
 * 获取 CMDB 配置项列表
 */
export async function getCMDBItems(params?: {
    page?: number;
    page_size?: number;
    name?: string;
    name__exact?: string;
    hostname?: string;
    hostname__exact?: string;
    ip_address?: string;
    ip_address__exact?: string;
    type?: AutoHealing.CMDBItemType;
    status?: AutoHealing.CMDBItemStatus;
    environment?: AutoHealing.CMDBEnvironment;
    source_plugin_name?: string;
    source_plugin_name__exact?: string;
    plugin_id?: string;
    has_plugin?: boolean | string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    keyword?: string;
}): Promise<AutoHealing.PaginatedResponse<AutoHealing.CMDBItem>> {
    const response = await (getTenantCmdb(
        (params || {}) as GeneratedAutoHealing.getTenantCmdbParams,
    ) as Promise<AutoHealing.PaginatedResponse<AutoHealing.CMDBItem>>);
    return normalizePaginatedResponse<AutoHealing.CMDBItem>(response);
}

/**
 * 获取 CMDB 统计信息
 */
export async function getCMDBStats() {
    return unwrapData(await request<{ code: number; message: string; data: AutoHealing.CMDBStats }>(
        '/api/v1/tenant/cmdb/stats',
        { method: 'GET' }
    ));
}

/**
 * 获取 CMDB 配置项 ID 列表（轻量接口，用于全选）
 */
export async function getCMDBItemIds(params?: {
    name?: string;
    name__exact?: string;
    hostname?: string;
    hostname__exact?: string;
    ip_address?: string;
    ip_address__exact?: string;
    type?: AutoHealing.CMDBItemType;
    status?: AutoHealing.CMDBItemStatus;
    environment?: AutoHealing.CMDBEnvironment;
    source_plugin_name?: string;
    source_plugin_name__exact?: string;
    plugin_id?: string;
    has_plugin?: boolean | string;
    keyword?: string;
}): Promise<Array<{ id: string; name: string; hostname: string; ip_address: string; status: string }>> {
    return unwrapItems<{ id: string; name: string; hostname: string; ip_address: string; status: string }>(await request<{ code: number; message: string; data: { items: { id: string; name: string; hostname: string; ip_address: string; status: string }[] } }>(
        '/api/v1/tenant/cmdb/ids',
        { method: 'GET', params },
    ));
}

/**
 * 获取 CMDB 配置项详情
 */
export async function getCMDBItem(id: string) {
    return unwrapData(await request<{ code: number; message: string; data: AutoHealing.CMDBItem }>(
        `/api/v1/tenant/cmdb/${id}`,
        { method: 'GET' }
    ));
}

/**
 * 测试单个配置项 SSH 连接
 */
export async function testCMDBConnection(id: string, secretsSourceId: string) {
    return unwrapData(await request<{ code: number; message: string; data: AutoHealing.CMDBConnectionTestResult }>(
        `/api/v1/tenant/cmdb/${id}/test-connection`,
        {
            method: 'POST',
            data: { secrets_source_id: secretsSourceId },
        }
    ));
}

/**
 * 批量测试 SSH 连接
 */
export async function batchTestCMDBConnection(cmdbIds: string[], secretsSourceId: string) {
    return unwrapData(await request<{ code: number; message: string; data: AutoHealing.CMDBBatchConnectionTestResult }>(
        '/api/v1/tenant/cmdb/batch-test-connection',
        {
            method: 'POST',
            data: { cmdb_ids: cmdbIds, secrets_source_id: secretsSourceId },
        }
    ));
}

/**
 * 进入维护模式
 */
export async function enterMaintenance(id: string, reason: string, endAt?: string) {
    return postTenantCmdbIdMaintenance(
        { id },
        { data: { reason, end_at: endAt || null } },
    ) as Promise<{ code: number; message: string }>;
}

/**
 * 退出维护模式
 */
export async function resumeFromMaintenance(id: string) {
    return postTenantCmdbIdResume({ id }) as Promise<{ code: number; message: string }>;
}

/**
 * 批量进入维护模式
 */
export async function batchEnterMaintenance(ids: string[], reason: string, endAt?: string) {
    return unwrapData(await request<{ code: number; message: string; data: { total: number; success: number; failed: number } }>(
        '/api/v1/tenant/cmdb/batch/maintenance',
        {
            method: 'POST',
            data: { ids, reason, end_at: endAt || null },
        }
    ));
}

/**
 * 批量退出维护模式
 */
export async function batchResumeFromMaintenance(ids: string[]) {
    return unwrapData(await request<{ code: number; message: string; data: { total: number; success: number; failed: number } }>(
        '/api/v1/tenant/cmdb/batch/resume',
        {
            method: 'POST',
            data: { ids },
        }
    ));
}

/**
 * 获取维护日志
 */
export async function getCMDBMaintenanceLogs(id: string, params?: { page?: number; page_size?: number }) {
    return normalizePaginatedResponse<AutoHealing.CMDBMaintenanceLog>(await request<AutoHealing.PaginatedResponse<AutoHealing.CMDBMaintenanceLog>>(
        `/api/v1/tenant/cmdb/${id}/maintenance-logs`,
        { method: 'GET', params }
    ));
}

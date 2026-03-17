import { request } from '@umijs/max';

/**
 * 获取权限列表（租户级）
 */
export async function getPermissions() {
    return request<{ data: AutoHealing.Permission[] }>('/api/v1/tenant/permissions', {
        method: 'GET',
    });
}

/**
 * 获取权限树（按模块分组，租户级）
 */
export async function getPermissionTree() {
    return request<{ data: AutoHealing.PermissionTree }>('/api/v1/tenant/permissions/tree', {
        method: 'GET',
    });
}

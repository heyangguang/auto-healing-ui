import { request } from '@umijs/max';

/**
 * 获取权限列表
 */
export async function getPermissions() {
    return request<{ data: AutoHealing.Permission[] }>('/api/v1/permissions', {
        method: 'GET',
    });
}

/**
 * 获取权限树（按模块分组）
 */
export async function getPermissionTree() {
    return request<{ data: AutoHealing.PermissionTree }>('/api/v1/permissions/tree', {
        method: 'GET',
    });
}

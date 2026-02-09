import { request } from '@umijs/max';

/**
 * 获取角色列表
 */
export async function getRoles() {
    return request<{ data: AutoHealing.RoleWithStats[] }>('/api/v1/roles', {
        method: 'GET',
    });
}

/**
 * 获取角色详情
 */
export async function getRole(id: string) {
    return request<AutoHealing.Role>(`/api/v1/roles/${id}`, {
        method: 'GET',
    });
}

/**
 * 创建角色
 */
export async function createRole(data: AutoHealing.CreateRoleRequest) {
    return request<AutoHealing.Role>('/api/v1/roles', {
        method: 'POST',
        data,
    });
}

/**
 * 更新角色
 */
export async function updateRole(id: string, data: AutoHealing.UpdateRoleRequest) {
    return request<AutoHealing.Role>(`/api/v1/roles/${id}`, {
        method: 'PUT',
        data,
    });
}

/**
 * 删除角色
 */
export async function deleteRole(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/roles/${id}`, {
        method: 'DELETE',
    });
}

/**
 * 分配角色权限
 */
export async function assignRolePermissions(id: string, data: AutoHealing.AssignPermissionsRequest) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/roles/${id}/permissions`, {
        method: 'PUT',
        data,
    });
}

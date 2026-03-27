import { request } from '@umijs/max';
import { normalizePaginatedResponse, unwrapData } from './responseAdapters';

const normalizeRoleUsersPage = <T>(
    response: AutoHealing.PaginatedResponse<T>,
    requestedPageSize?: number,
): AutoHealing.PaginatedResponse<T> => ({
    ...response,
    page_size: (response.page_size ?? 0) > 0 ? response.page_size : requestedPageSize ?? 1,
});

/**
 * 获取租户级角色列表（排除平台专属角色）
 */
export async function getRoles() {
    return unwrapData(await request<{ data: AutoHealing.RoleWithStats[] }>('/api/v1/tenant/roles', {
        method: 'GET',
    }));
}

/**
 * 获取平台级角色列表（包含所有角色）
 */
export async function getPlatformRoles() {
    return unwrapData(await request<{ data: AutoHealing.RoleWithStats[] }>('/api/v1/platform/roles', {
        method: 'GET',
    }));
}

/**
 * 获取系统级租户角色列表（平台页面用，如租户成员管理时选择角色）
 */
export async function getSystemTenantRoles() {
    return unwrapData(await request<{ data: AutoHealing.Role[] }>('/api/v1/platform/tenant-roles', {
        method: 'GET',
    }));
}

/**
 * 获取角色详情
 */
export async function getRole(id: string) {
    return unwrapData(await request<{ data: AutoHealing.RoleWithStats }>(`/api/v1/tenant/roles/${id}`, {
        method: 'GET',
    }));
}

/**
 * 创建角色
 */
export async function createRole(data: AutoHealing.CreateRoleRequest) {
    return unwrapData(await request<{ data: AutoHealing.Role }>('/api/v1/tenant/roles', {
        method: 'POST',
        data,
    }));
}

/**
 * 更新角色
 */
export async function updateRole(id: string, data: AutoHealing.UpdateRoleRequest) {
    return unwrapData(await request<{ data: AutoHealing.Role }>(`/api/v1/tenant/roles/${id}`, {
        method: 'PUT',
        data,
    }));
}

/**
 * 删除角色
 */
export async function deleteRole(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/roles/${id}`, {
        method: 'DELETE',
    });
}

/**
 * 分配角色权限
 */
export async function assignRolePermissions(id: string, data: AutoHealing.AssignPermissionsRequest) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/roles/${id}/permissions`, {
        method: 'PUT',
        data,
    });
}

// ==================== 平台级角色 CRUD ====================

/**
 * 获取平台级角色详情
 */
export async function getPlatformRole(id: string) {
    return unwrapData(await request<{ data: AutoHealing.RoleWithStats }>(`/api/v1/platform/roles/${id}`, {
        method: 'GET',
    }));
}

/**
 * 创建平台级角色
 */
export async function createPlatformRole(data: AutoHealing.CreateRoleRequest) {
    return unwrapData(await request<{ data: AutoHealing.Role } | AutoHealing.Role>('/api/v1/platform/roles', {
        method: 'POST',
        data,
    }));
}

/**
 * 更新平台级角色
 */
export async function updatePlatformRole(id: string, data: AutoHealing.UpdateRoleRequest) {
    return unwrapData(await request<{ data: AutoHealing.Role } | AutoHealing.Role>(`/api/v1/platform/roles/${id}`, {
        method: 'PUT',
        data,
    }));
}

/**
 * 删除平台级角色
 */
export async function deletePlatformRole(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/platform/roles/${id}`, {
        method: 'DELETE',
    });
}

/**
 * 分配平台级角色权限
 */
export async function assignPlatformRolePermissions(id: string, data: AutoHealing.AssignPermissionsRequest) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/platform/roles/${id}/permissions`, {
        method: 'PUT',
        data,
    });
}

/**
 * 获取平台级角色关联的用户列表（分页 + 搜索）
 */
export async function getPlatformRoleUsers(roleId: string, params?: {
    page?: number;
    page_size?: number;
    name?: string;
}) {
    return normalizeRoleUsersPage(
        normalizePaginatedResponse(await request<{
            data: { id: string; username: string; display_name: string; email: string; status: string }[];
            total: number;
        }>(`/api/v1/platform/roles/${roleId}/users`, {
            method: 'GET',
            params,
        })),
        params?.page_size,
    );
}

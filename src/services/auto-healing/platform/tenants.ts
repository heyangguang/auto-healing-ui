import { request } from '@umijs/max';

/**
 * 平台级租户管理 API
 * 所有 API 不携带 X-Tenant-ID
 */

/** 获取租户列表 */
export async function getTenants(params?: Record<string, any>) {
    return request<AutoHealing.PaginatedResponse<AutoHealing.Tenant>>(
        '/api/v1/platform/tenants',
        { method: 'GET', params }
    );
}

// 别名
export const getPlatformTenants = getTenants;

/** 创建租户（空租户，不自动分配管理员） */
export async function createTenant(data: AutoHealing.CreateTenantRequest) {
    return request<AutoHealing.Tenant>('/api/v1/platform/tenants', {
        method: 'POST',
        data,
    });
}

/** 更新租户信息 / 禁用租户 */
export async function updateTenant(id: string, data: AutoHealing.UpdateTenantRequest) {
    return request<AutoHealing.Tenant>(`/api/v1/platform/tenants/${id}`, {
        method: 'PUT',
        data,
    });
}

/** 删除租户 */
export async function deleteTenant(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/platform/tenants/${id}`, {
        method: 'DELETE',
    });
}

/** 获取租户详情 */
export async function getTenant(id: string) {
    return request<AutoHealing.Tenant>(`/api/v1/platform/tenants/${id}`, {
        method: 'GET',
    });
}

/** 查看租户成员及角色 */
export async function getTenantMembers(tenantId: string) {
    return request<any>(`/api/v1/platform/tenants/${tenantId}/members`, {
        method: 'GET',
    });
}

/**
 * 设置租户管理员（从 /platform/users/simple 选人）
 * POST /platform/tenants/:id/admin  { user_id: string }
 */
export async function setTenantAdmin(tenantId: string, data: { user_id: string }) {
    return request<any>(`/api/v1/platform/tenants/${tenantId}/admin`, {
        method: 'POST',
        data,
    });
}

/**
 * 变更租户内成员角色（升/降级）
 * PUT /platform/tenants/:id/members/:userId/role  { role_id: string }
 */
export async function updateTenantMemberRole(tenantId: string, userId: string, data: { role_id: string }) {
    return request<any>(`/api/v1/platform/tenants/${tenantId}/members/${userId}/role`, {
        method: 'PUT',
        data,
    });
}

// ===== 已废弃，保留为空以免 import 报错 =====
// POST /platform/tenants/:id/members → 已废弃
// DELETE /platform/tenants/:id/members/:userId → 已废弃

/**
 * 在租户下创建普通用户（非平台管理员）
 * POST /platform/tenants/:id/users
 */
export async function createTenantUser(
    tenantId: string,
    data: { username: string; password: string; display_name?: string; email: string },
) {
    return request<any>(`/api/v1/platform/tenants/${tenantId}/users`, {
        method: 'POST',
        data,
    });
}

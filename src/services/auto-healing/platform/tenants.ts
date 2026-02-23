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
 * 变更租户内成员角色（升/降级）
 * PUT /platform/tenants/:id/members/:userId/role  { role_id: string }
 */
export async function updateTenantMemberRole(tenantId: string, userId: string, data: { role_id: string }) {
    return request<any>(`/api/v1/platform/tenants/${tenantId}/members/${userId}/role`, {
        method: 'PUT',
        data,
    });
}

// ==================== 成员管理（新） ====================

/** 添加已有用户到租户 */
export async function addTenantMember(tenantId: string, data: { user_id: string; role_id: string }) {
    return request<any>(`/api/v1/platform/tenants/${tenantId}/members`, {
        method: 'POST',
        data,
    });
}

/** 从租户移除成员 */
export async function removeTenantMember(tenantId: string, userId: string) {
    return request<any>(`/api/v1/platform/tenants/${tenantId}/members/${userId}`, {
        method: 'DELETE',
    });
}

// ==================== 邀请管理 ====================

/** 邀请用户加入租户 */
export async function inviteToTenant(
    tenantId: string,
    data: { email: string; role_id: string; send_email?: boolean },
) {
    return request<any>(`/api/v1/platform/tenants/${tenantId}/invitations`, {
        method: 'POST',
        data,
    });
}

/** 查看租户邀请列表 */
export async function getTenantInvitations(tenantId: string, params?: Record<string, any>) {
    return request<any>(`/api/v1/platform/tenants/${tenantId}/invitations`, {
        method: 'GET',
        params,
    });
}

/** 取消邀请 */
export async function cancelTenantInvitation(tenantId: string, invitationId: string) {
    return request<any>(`/api/v1/platform/tenants/${tenantId}/invitations/${invitationId}`, {
        method: 'DELETE',
    });
}

// ==================== 统计 ====================

/** 获取租户运营总览统计 */
export async function getTenantStats() {
    return request<any>('/api/v1/platform/tenants/stats', {
        method: 'GET',
    });
}

/** 获取租户运营趋势数据 */
export async function getTenantTrends(params?: { days?: number }) {
    return request<any>('/api/v1/platform/tenants/trends', {
        method: 'GET',
        params,
    });
}

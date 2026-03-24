import { request } from '@umijs/max';

/**
 * 平台级用户管理 API
 * 平台管理员专用，不携带 X-Tenant-ID
 *
 * 注意：
 * - GET /platform/users        → 返回拥有任一平台角色的用户
 * - GET /platform/users/simple → 全量轻量用户池（选人用，不过滤）
 */

/** 获取平台用户列表（拥有平台角色的用户） */
export async function getPlatformUsers(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    username?: string;
    email?: string;
    display_name?: string;
    created_from?: string;
    created_to?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}) {
    return request<AutoHealing.PaginatedResponse<AutoHealing.User>>(
        '/api/v1/platform/users',
        { method: 'GET', params }
    );
}

/** 全量轻量用户池（设置租户管理员时用，不过滤角色） */
export async function getPlatformUsersSimple(params?: { name?: string; status?: string }) {
    return request<{ code: number; data: { id: string; username: string; display_name: string; status: string }[] }>(
        '/api/v1/platform/users/simple',
        { method: 'GET', params }
    );
}

/** 创建平台用户（可指定角色，不传默认 platform_admin） */
export async function createPlatformUser(data: {
    username: string;
    email: string;
    password: string;
    display_name?: string;
    role_id?: string;
}) {
    return request<AutoHealing.User>('/api/v1/platform/users', {
        method: 'POST',
        data,
    });
}

/** 更新平台用户信息 */
export async function updatePlatformUser(id: string, data: AutoHealing.UpdateUserRequest) {
    return request<AutoHealing.User>(`/api/v1/platform/users/${id}`, {
        method: 'PUT',
        data,
    });
}

/** 删除平台用户（最后一个 platform_admin 不可删，后端返回 400） */
export async function deletePlatformUser(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/platform/users/${id}`, {
        method: 'DELETE',
    });
}

/** 获取渴望详情 */
export async function getPlatformUser(id: string) {
    return request<AutoHealing.User>(`/api/v1/platform/users/${id}`, {
        method: 'GET',
    });
}

/** 重置平台用户密码 */
export async function resetPlatformUserPassword(id: string, data: { new_password: string }) {
    return request<AutoHealing.SuccessResponse>(
        `/api/v1/platform/users/${id}/reset-password`,
        { method: 'POST', data }
    );
}

// ===== 租户级用户管理 API（租户管理员专用，自动携带 X-Tenant-ID） =====

/** 获取当前租户用户列表 */
export async function getTenantUsers(params?: {
    page?: number;
    page_size?: number;
    role_id?: string;
    username?: string;
    email?: string;
    display_name?: string;
    created_from?: string;
    created_to?: string;
}) {
    return request<AutoHealing.PaginatedResponse<AutoHealing.User>>(
        '/api/v1/tenant/users',
        { method: 'GET', params }
    );
}

/** 创建租户用户 */
export async function createTenantUser(data: AutoHealing.CreateTenantUserRequest) {
    return request<AutoHealing.User>('/api/v1/tenant/users', {
        method: 'POST',
        data,
    });
}

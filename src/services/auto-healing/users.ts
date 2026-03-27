import { request } from '@umijs/max';
import { normalizePaginatedResponse, unwrapData, unwrapItems } from './responseAdapters';

const normalizeUsersPage = <T>(
    response: AutoHealing.PaginatedResponse<T>,
    requestedPageSize?: number,
): AutoHealing.PaginatedResponse<T> => ({
    ...response,
    page_size: (response.page_size ?? 0) > 0 ? response.page_size : requestedPageSize ?? 1,
});

/**
 * 获取用户列表
 */
export async function getUsers(params?: {
    page?: number;
    page_size?: number;
    status?: 'active' | 'inactive';
    username?: string;
    email?: string;
    display_name?: string;
    user_id?: string;
    role_id?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    created_from?: string;
    created_to?: string;
}) {
    return normalizeUsersPage(
        normalizePaginatedResponse(await request<AutoHealing.PaginatedResponse<AutoHealing.User>>('/api/v1/tenant/users', {
            method: 'GET',
            params,
        })),
        params?.page_size,
    );
}

/**
 * 获取用户详情
 */
export async function getUser(id: string) {
    return unwrapData(await request<{ data: AutoHealing.User }>(`/api/v1/tenant/users/${id}`, {
        method: 'GET',
    }));
}

/**
 * 创建用户
 */
export async function createUser(data: AutoHealing.CreateUserRequest) {
    return unwrapData(await request<{ data: AutoHealing.User }>('/api/v1/tenant/users', {
        method: 'POST',
        data,
    }));
}

/**
 * 调整当前租户下用户角色
 */
export async function updateUser(id: string, data: AutoHealing.UpdateUserRequest) {
    return unwrapData(await request<{ data: AutoHealing.User }>(`/api/v1/tenant/users/${id}`, {
        method: 'PUT',
        data,
    }));
}

/**
 * 删除用户
 */
export async function deleteUser(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/users/${id}`, {
        method: 'DELETE',
    });
}

/**
 * 分配用户角色
 */
export async function assignUserRoles(id: string, data: AutoHealing.AssignRolesRequest) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/users/${id}/roles`, {
        method: 'PUT',
        data,
    });
}

/**
 * 获取轻量用户列表（不分页，仅含基础字段）
 * GET /api/v1/users/simple
 */
export async function getSimpleUsers() {
    return unwrapItems(await request<{
        code: number;
        data: Array<{
            id: string;
            username: string;
            display_name: string;
            status: string;
        }>;
    }>('/api/v1/tenant/users/simple', { method: 'GET' }));
}

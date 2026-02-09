import { request } from '@umijs/max';

/**
 * 获取用户列表
 */
export async function getUsers(params?: {
    page?: number;
    page_size?: number;
    status?: 'active' | 'inactive';
    search?: string;
}) {
    return request<AutoHealing.PaginatedResponse<AutoHealing.User>>('/api/v1/users', {
        method: 'GET',
        params,
    });
}

/**
 * 获取用户详情
 */
export async function getUser(id: string) {
    return request<AutoHealing.User>(`/api/v1/users/${id}`, {
        method: 'GET',
    });
}

/**
 * 创建用户
 */
export async function createUser(data: AutoHealing.CreateUserRequest) {
    return request<AutoHealing.User>('/api/v1/users', {
        method: 'POST',
        data,
    });
}

/**
 * 更新用户
 */
export async function updateUser(id: string, data: AutoHealing.UpdateUserRequest) {
    return request<AutoHealing.User>(`/api/v1/users/${id}`, {
        method: 'PUT',
        data,
    });
}

/**
 * 删除用户
 */
export async function deleteUser(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/users/${id}`, {
        method: 'DELETE',
    });
}

/**
 * 重置用户密码
 */
export async function resetUserPassword(id: string, data: AutoHealing.ResetPasswordRequest) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/users/${id}/reset-password`, {
        method: 'POST',
        data,
    });
}

/**
 * 分配用户角色
 */
export async function assignUserRoles(id: string, data: AutoHealing.AssignRolesRequest) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/users/${id}/roles`, {
        method: 'PUT',
        data,
    });
}

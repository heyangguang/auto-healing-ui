import { request } from '@umijs/max';

/**
 * 用户登录
 */
export async function login(data: AutoHealing.LoginRequest) {
    return request<AutoHealing.LoginResponse>('/api/v1/auth/login', {
        method: 'POST',
        data,
        skipErrorHandler: true,
    });
}

/**
 * 用户登出
 */
export async function logout() {
    return request<AutoHealing.SuccessResponse>('/api/v1/auth/logout', {
        method: 'POST',
    });
}

/**
 * 刷新 Token
 */
export async function refreshToken(data: AutoHealing.RefreshTokenRequest) {
    return request<AutoHealing.RefreshTokenResponse>('/api/v1/auth/refresh', {
        method: 'POST',
        data,
    });
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(options?: { skipErrorHandler?: boolean }) {
    return request<AutoHealing.UserInfo>('/api/v1/auth/me', {
        method: 'GET',
        ...(options || {}),
    });
}

/**
 * 修改密码
 */
export async function changePassword(data: AutoHealing.ChangePasswordRequest) {
    return request<AutoHealing.SuccessResponse>('/api/v1/auth/password', {
        method: 'PUT',
        data,
    });
}

/**
 * 获取用户详细资料（个人中心）
 */
export async function getProfile() {
    return request<{ data: AutoHealing.UserProfile }>('/api/v1/auth/profile', {
        method: 'GET',
    });
}

/**
 * 更新个人资料
 */
export async function updateProfile(data: AutoHealing.UpdateProfileRequest) {
    return request<AutoHealing.SuccessResponse>('/api/v1/auth/profile', {
        method: 'PUT',
        data,
    });
}

/**
 * 获取当前用户登录历史（个人中心）
 */
export async function getProfileLoginHistory(limit: number = 10) {
    return request<any>('/api/v1/auth/profile/login-history', {
        method: 'GET',
        params: { limit },
    });
}

/**
 * 获取当前用户操作记录（个人中心）
 */
export async function getProfileActivities(limit: number = 15) {
    return request<any>('/api/v1/auth/profile/activities', {
        method: 'GET',
        params: { limit },
    });
}

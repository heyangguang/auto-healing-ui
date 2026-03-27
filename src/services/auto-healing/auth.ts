import { request } from '@umijs/max';
import {
    getAuthMe,
    getAuthProfile,
    postAuthLogin,
    postAuthRefresh,
    putAuthPassword,
    putAuthProfile,
} from '@/services/generated/auto-healing/authentication';
import { normalizePaginatedResponse, unwrapData } from './responseAdapters';

type PaginatedListEnvelope<T> = {
    data?: { items?: T[]; page?: number; page_size?: number; total?: number } | T[];
    items?: T[];
    page?: number;
    page_size?: number;
    total?: number;
};

export interface ProfileLoginHistoryItem {
    created_at: string;
    id: string;
    ip_address?: string;
    status?: string;
    user_agent?: string;
}

export interface ProfileActivityItem {
    action?: string;
    created_at: string;
    id: string;
    resource_name?: string;
    resource_type?: string;
}

export interface InvitationValidation {
    email: string;
    expires_at: string;
    id: string;
    role_name: string;
    tenant_code: string;
    tenant_name: string;
}

export interface RegisterByInvitationRequest {
    display_name?: string;
    password: string;
    token: string;
    username: string;
}

export interface RegisterByInvitationResult {
    message?: string;
    user?: AutoHealing.UserInfo;
}

/**
 * 用户登录
 */
export async function login(data: AutoHealing.LoginRequest) {
    return postAuthLogin(data, { skipErrorHandler: true }) as Promise<AutoHealing.LoginResponse>;
}

/**
 * 用户登出
 */
export async function logout(data?: { refresh_token?: string }) {
    return request<AutoHealing.SuccessResponse>('/api/v1/auth/logout', {
        method: 'POST',
        data,
        skipErrorHandler: true,
    });
}

/**
 * 刷新 Token
 */
export async function refreshToken(data: AutoHealing.RefreshTokenRequest) {
    return postAuthRefresh(data) as Promise<AutoHealing.RefreshTokenResponse>;
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(options?: { skipErrorHandler?: boolean }) {
    return unwrapData(
        await (getAuthMe(options) as Promise<{ data: AutoHealing.UserInfo } | AutoHealing.UserInfo>),
    );
}

/**
 * 修改密码
 */
export async function changePassword(data: AutoHealing.ChangePasswordRequest) {
    return putAuthPassword(data) as Promise<AutoHealing.SuccessResponse>;
}

/**
 * 获取用户详细资料（个人中心）
 */
export async function getProfile() {
    return unwrapData(await (getAuthProfile() as Promise<{ data: AutoHealing.UserProfile }>));
}

/**
 * 更新个人资料
 */
export async function updateProfile(data: AutoHealing.UpdateProfileRequest) {
    return putAuthProfile(data) as Promise<AutoHealing.SuccessResponse>;
}

/**
 * 校验邀请注册链接
 */
export async function validateInvitationToken(token: string) {
    return unwrapData(
        await request<{ data: InvitationValidation }>(`/api/v1/auth/invitation/${encodeURIComponent(token)}`, {
            method: 'GET',
            skipErrorHandler: true,
        }),
    );
}

/**
 * 邀请注册
 */
export async function registerByInvitation(data: RegisterByInvitationRequest) {
    return unwrapData(
        await request<{ data?: RegisterByInvitationResult } | RegisterByInvitationResult>(
            '/api/v1/auth/register',
            {
                method: 'POST',
                data,
                skipErrorHandler: true,
            },
        ),
    );
}

/**
 * 获取当前用户登录历史（个人中心）
 */
export async function getProfileLoginHistory(limit: number = 10) {
    return normalizePaginatedResponse<ProfileLoginHistoryItem>(
        await request<PaginatedListEnvelope<ProfileLoginHistoryItem>>('/api/v1/auth/profile/login-history', {
            method: 'GET',
            params: { limit },
        }),
    );
}

/**
 * 获取当前用户操作记录（个人中心）
 */
export async function getProfileActivities(limit: number = 15) {
    return normalizePaginatedResponse<ProfileActivityItem>(
        await request<PaginatedListEnvelope<ProfileActivityItem>>('/api/v1/auth/profile/activities', {
            method: 'GET',
            params: { limit },
        }),
    );
}

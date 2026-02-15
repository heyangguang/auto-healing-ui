import { request } from '@umijs/max';

/**
 * 获取当前用户偏好设置
 */
export async function getPreferences() {
    return request<{
        code: number;
        data: {
            id: string;
            user_id: string;
            preferences: Record<string, any>;
        };
    }>('/api/v1/user/preferences', {
        method: 'GET',
    });
}

/**
 * 部分更新偏好（合并更新，PATCH）
 */
export async function patchPreferences(preferences: Record<string, any>) {
    return request<{
        code: number;
        data: {
            id: string;
            user_id: string;
            preferences: Record<string, any>;
        };
    }>('/api/v1/user/preferences', {
        method: 'PATCH',
        data: { preferences },
    });
}

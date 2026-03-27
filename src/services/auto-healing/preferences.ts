import { request } from '@umijs/max';
import { unwrapData } from './responseAdapters';
import type { JSONObject } from '@/types/json';

export interface UserPreferencesEnvelope {
    id?: string;
    user_id: string;
    preferences: JSONObject;
}

/**
 * 获取当前用户偏好设置
 */
export async function getPreferences() {
    return unwrapData(await request<{
        code: number;
        data: UserPreferencesEnvelope;
    }>('/api/v1/common/user/preferences', {
        method: 'GET',
    }));
}

/**
 * 部分更新偏好（合并更新，PATCH）
 */
export async function patchPreferences(preferences: JSONObject) {
    return unwrapData(await request<{
        code: number;
        data: UserPreferencesEnvelope;
    }>('/api/v1/common/user/preferences', {
        method: 'PATCH',
        data: { preferences },
    }));
}

import { request } from '@umijs/max';
import type { ServiceItemsEnvelope } from './contracts';
import { unwrapItems } from '../responseAdapters';

/**
 * 平台设置 API
 * 对应 /api/v1/platform/settings
 * 响应结构：按 module 分组的数组，每个 module 包含 settings 数组
 */

export interface PlatformSettingItem {
    key: string;
    value: string;
    type: 'int' | 'string' | 'bool' | 'json';
    module: string;
    label: string;
    description: string;
    default_value: string;
    updated_at: string;
    updated_by?: string | null;
}

export interface PlatformSettingModule {
    module: string;
    settings: PlatformSettingItem[];
}

type UpdatePlatformSettingResponse = {
    success?: boolean;
    message?: string;
    data?: PlatformSettingItem;
};

export async function getPlatformSettings(): Promise<PlatformSettingModule[]> {
    return unwrapItems(await request<ServiceItemsEnvelope<PlatformSettingModule>>(
        '/api/v1/platform/settings',
        { method: 'GET' },
    ));
}

export async function updatePlatformSetting(key: string, value: string) {
    return request<UpdatePlatformSettingResponse>(`/api/v1/platform/settings/${key}`, {
        method: 'PUT',
        data: { value },
    });
}

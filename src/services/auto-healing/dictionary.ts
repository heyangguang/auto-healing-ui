import { request } from '@umijs/max';

/**
 * 字典项类型
 */
export interface DictItem {
    id: string;
    dict_type: string;
    dict_key: string;
    label: string;
    label_en?: string;
    color?: string;
    tag_color?: string;
    badge?: string;
    icon?: string;
    bg?: string;
    extra?: Record<string, any>;
    sort_order: number;
    is_system: boolean;
    is_active: boolean;
}

/**
 * 批量查询字典
 * @param types 可选，按类型筛选（逗号分隔）
 */
export async function getDictionaries(types?: string[]) {
    return request<{
        data: Record<string, DictItem[]>;
        meta: { types_count: number; items_count: number };
    }>('/api/v1/common/dictionaries', {
        method: 'GET',
        params: types?.length ? { types: types.join(',') } : undefined,
    });
}

/**
 * 查询可用字典类型列表
 */
export async function getDictionaryTypes() {
    return request<{
        data: Array<{ dict_type: string; count: number }>;
        total: number;
    }>('/api/v1/common/dictionaries/types', {
        method: 'GET',
    });
}

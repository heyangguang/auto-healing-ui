import { request } from '@umijs/max';
import { unwrapData } from './responseAdapters';
import type { JSONObject } from '@/types/json';

/** 全局搜索结果项 */
export interface SearchResultItem {
    id: string;
    title: string;
    description: string;
    path: string;
    extra?: JSONObject;
}

/** 搜索分类结果 */
export interface SearchCategoryResult {
    category: string;
    category_label: string;
    items: SearchResultItem[];
    total: number;
}

/** 搜索响应 */
export interface SearchResponse {
    results: SearchCategoryResult[];
    total_count: number;
}

/**
 * 全局搜索
 */
export async function globalSearch(params: { q: string; limit?: number }) {
    return unwrapData(await request<{ code: number; message: string; data: SearchResponse }>(
        '/api/v1/common/search',
        { method: 'GET', params, skipErrorHandler: true },
    ));
}

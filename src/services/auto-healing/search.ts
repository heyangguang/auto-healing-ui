import { request } from '@umijs/max';

/** 全局搜索结果项 */
export interface SearchResultItem {
    id: string;
    title: string;
    description: string;
    path: string;
    extra?: Record<string, any>;
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
    const res = await request<{ code: number; message: string; data: SearchResponse }>(
        '/api/v1/search',
        { method: 'GET', params },
    );
    return res.data;
}

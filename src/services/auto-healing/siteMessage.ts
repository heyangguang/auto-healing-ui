/**
 * 站内信 API 服务
 * 对应 /api/v1/tenant/site-messages (用户侧) + /api/v1/common/site-messages/categories
 */
import type { RequestOptions } from '@@/plugin-request/request';
import { request } from '@umijs/max';
import { normalizePaginatedResponse, unwrapData, unwrapItems } from './responseAdapters';

type SiteMessageRequestOptions = RequestOptions & { skipTokenRefresh?: boolean };

// ==================== 类型定义 ====================

export interface SiteMessage {
    id: string;
    category: string;
    title: string;
    content: string;
    created_at: string;
    expires_at?: string;
    is_read: boolean;
}

export interface SiteMessageCategory {
    value: string;
    label: string;
}

export interface UnreadCountPayload {
    unread_count: number;
}

export interface SiteMessageQueryParams {
    page?: number;
    page_size?: number;
    keyword?: string;
    category?: string;
    is_read?: boolean;
}

// ==================== API ====================

/** 获取消息列表 */
export async function getSiteMessages(params?: SiteMessageQueryParams, options?: SiteMessageRequestOptions) {
    return normalizePaginatedResponse(await request<AutoHealing.PaginatedResponse<SiteMessage>>(
        '/api/v1/tenant/site-messages',
        { method: 'GET', params, ...options },
    ));
}

/** 获取未读消息数 */
export async function getUnreadCount(options?: SiteMessageRequestOptions) {
    return unwrapData(await request<{ data: UnreadCountPayload }>(
        '/api/v1/tenant/site-messages/unread-count',
        { method: 'GET', ...options },
    )) as UnreadCountPayload;
}

/** 标记消息为已读 */
export async function markAsRead(ids: string[]) {
    return request<AutoHealing.SuccessResponse>('/api/v1/tenant/site-messages/read', {
        method: 'PUT',
        data: { ids },
    });
}

/** 标记所有消息为已读 */
export async function markAllAsRead() {
    return request<AutoHealing.SuccessResponse>('/api/v1/tenant/site-messages/read-all', { method: 'PUT' });
}

/** 获取消息分类列表 */
export async function getSiteMessageCategories() {
    return unwrapItems(await request<{ data: SiteMessageCategory[] }>(
        '/api/v1/common/site-messages/categories',
        { method: 'GET' },
    )) as SiteMessageCategory[];
}

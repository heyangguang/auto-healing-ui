/**
 * 站内信 API 服务
 * 对应 /api/v1/site-messages
 */
import { request } from '@umijs/max';

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

// ==================== API ====================

/** 获取消息列表 */
export async function getSiteMessages(params?: {
    page?: number;
    page_size?: number;
    keyword?: string;
    category?: string;
}) {
    return request<{
        code: number;
        message: string;
        data: SiteMessage[];
        total: number;
        page: number;
        page_size: number;
    }>('/api/v1/site-messages', { method: 'GET', params });
}

/** 获取未读消息数 */
export async function getUnreadCount() {
    return request<{
        code: number;
        message: string;
        data: { unread_count: number };
    }>('/api/v1/site-messages/unread-count', { method: 'GET' });
}

/** 标记消息为已读 */
export async function markAsRead(ids: string[]) {
    return request<any>('/api/v1/site-messages/read', {
        method: 'PUT',
        data: { ids },
    });
}

/** 标记所有消息为已读 */
export async function markAllAsRead() {
    return request<any>('/api/v1/site-messages/read-all', { method: 'PUT' });
}

/** 获取消息分类列表 */
export async function getSiteMessageCategories() {
    return request<{
        code: number;
        message: string;
        data: SiteMessageCategory[];
    }>('/api/v1/site-messages/categories', { method: 'GET' });
}

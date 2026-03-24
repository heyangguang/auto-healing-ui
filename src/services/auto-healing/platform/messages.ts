import { request } from '@umijs/max';

/**
 * 站内信 API
 * 平台侧：对应 /api/v1/platform/site-messages
 */

// ==================== 类型定义 ====================

export interface SiteMessageCategory {
    value: string;
    label: string;
}

export interface SiteMessage {
    id: string;
    category: string;
    title: string;
    content: string;
    created_at: string;
    expires_at?: string;
    is_read: boolean;
}

export interface CreateSiteMessageParams {
    category: string;
    title: string;
    content: string;
    target_tenant_ids?: string[];  // 为空=全局广播
}

// ==================== API ====================

/** 获取消息分类枚举 */
export async function getSiteMessageCategories() {
    return request<{ code: number; message: string; data: SiteMessageCategory[] }>(
        '/api/v1/common/site-messages/categories',
        { method: 'GET' },
    );
}

/** 创建站内信（平台管理员） */
export async function createSiteMessage(data: CreateSiteMessageParams) {
    return request<{ code: number; message: string; data: any }>(
        '/api/v1/platform/site-messages',
        { method: 'POST', data },
    );
}

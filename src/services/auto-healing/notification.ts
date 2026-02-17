import { request } from '@umijs/max';

// ==================== 通知渠道 ====================

/**
 * 获取渠道列表
 */
export async function getChannels(params?: {
    page?: number;
    page_size?: number;
    type?: AutoHealing.ChannelType;
}) {
    return request<AutoHealing.PaginatedResponse<AutoHealing.NotificationChannel>>('/api/v1/channels', {
        method: 'GET',
        params,
    });
}

/**
 * 获取渠道详情
 */
export async function getChannel(id: string) {
    return request<AutoHealing.NotificationChannel>(`/api/v1/channels/${id}`, {
        method: 'GET',
    });
}

/**
 * 创建渠道
 */
export async function createChannel(data: AutoHealing.CreateChannelRequest) {
    return request<AutoHealing.NotificationChannel>('/api/v1/channels', {
        method: 'POST',
        data,
    });
}

/**
 * 更新渠道
 */
export async function updateChannel(id: string, data: AutoHealing.UpdateChannelRequest) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/channels/${id}`, {
        method: 'PUT',
        data,
    });
}

/**
 * 删除渠道
 */
export async function deleteChannel(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/channels/${id}`, {
        method: 'DELETE',
    });
}

/**
 * 测试渠道连接
 */
export async function testChannel(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/channels/${id}/test`, {
        method: 'POST',
    });
}

// ==================== 通知模板 ====================

/**
 * 获取模板列表
 */
export async function getTemplates(params?: {
    page?: number;
    page_size?: number;
    event_type?: AutoHealing.EventType;
}) {
    return request<AutoHealing.PaginatedResponse<AutoHealing.NotificationTemplate>>('/api/v1/templates', {
        method: 'GET',
        params,
    });
}

/**
 * 获取模板详情
 */
export async function getTemplate(id: string) {
    return request<AutoHealing.NotificationTemplate>(`/api/v1/templates/${id}`, {
        method: 'GET',
    });
}

/**
 * 创建模板
 */
export async function createTemplate(data: AutoHealing.CreateTemplateRequest) {
    return request<AutoHealing.NotificationTemplate>('/api/v1/templates', {
        method: 'POST',
        data,
    });
}

/**
 * 更新模板
 */
export async function updateTemplate(id: string, data: AutoHealing.UpdateTemplateRequest) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/templates/${id}`, {
        method: 'PUT',
        data,
    });
}

/**
 * 删除模板
 */
export async function deleteTemplate(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/templates/${id}`, {
        method: 'DELETE',
    });
}

/**
 * 预览模板
 */
export async function previewTemplate(id: string, data?: AutoHealing.PreviewTemplateRequest) {
    return request<AutoHealing.PreviewTemplateResponse>(`/api/v1/templates/${id}/preview`, {
        method: 'POST',
        data,
    });
}

// ==================== 模板变量 ====================

/**
 * 获取所有可用模板变量
 */
export async function getTemplateVariables() {
    return request<AutoHealing.TemplateVariable[]>('/api/v1/template-variables', {
        method: 'GET',
    });
}

// ==================== 通知记录 ====================

/**
 * 发送通知
 */
export async function sendNotification(data: AutoHealing.SendNotificationRequest) {
    return request<AutoHealing.SendNotificationResponse>('/api/v1/notifications/send', {
        method: 'POST',
        data,
    });
}

/**
 * 获取通知发送记录
 */
export async function getNotifications(params?: {
    page?: number;
    page_size?: number;
    status?: AutoHealing.NotificationStatus;
    run_id?: string;
    search?: string;
}) {
    return request<AutoHealing.PaginatedResponse<AutoHealing.Notification>>('/api/v1/notifications', {
        method: 'GET',
        params,
    });
}

/**
 * 获取通知详情
 */
export async function getNotification(id: string) {
    return request<AutoHealing.Notification>(`/api/v1/notifications/${id}`, {
        method: 'GET',
    });
}

/**
 * 重试发送通知
 */
export async function retryNotification(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/notifications/${id}/retry`, {
        method: 'POST',
    });
}

/**
 * 获取通知统计数据
 * GET /api/v1/notifications/stats
 */
export async function getNotificationStats() {
    return request<{
        code: number;
        data: {
            channels_total: number;
            channels_by_type: Array<{ type: string; count: number }>;
            logs_total: number;
            logs_by_status: Array<{ status: string; count: number }>;
            templates_total: number;
            templates_active: number;
        };
    }>('/api/v1/notifications/stats', { method: 'GET' });
}

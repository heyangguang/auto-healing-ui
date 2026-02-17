import { request } from '@umijs/max';

/**
 * Playbook 模板管理 API
 * 基于 docs/playbook-management.md
 */

/**
 * 获取 Playbook 列表
 * GET /api/v1/playbooks
 */
export async function getPlaybooks(params?: {
    repository_id?: string;
    status?: AutoHealing.PlaybookStatus;
    search?: string;
    name?: string;
    file_path?: string;
    config_mode?: string;
    has_variables?: string;
    min_variables?: number;
    max_variables?: number;
    has_required_vars?: string;
    sort_by?: string;
    sort_order?: string;
    created_from?: string;
    created_to?: string;
    page?: number;
    page_size?: number;
}) {
    return request<AutoHealing.PaginatedResponse<AutoHealing.Playbook>>('/api/v1/playbooks', {
        method: 'GET',
        params,
    });
}

/**
 * 获取 Playbook 详情
 * GET /api/v1/playbooks/{id}
 */
export async function getPlaybook(id: string) {
    return request<{ data: AutoHealing.Playbook }>(`/api/v1/playbooks/${id}`, {
        method: 'GET',
    });
}

/**
 * 创建 Playbook
 * POST /api/v1/playbooks
 */
export async function createPlaybook(data: AutoHealing.CreatePlaybookRequest) {
    return request<{ data: AutoHealing.Playbook }>('/api/v1/playbooks', {
        method: 'POST',
        data,
    });
}

/**
 * 更新 Playbook
 * PUT /api/v1/playbooks/{id}
 */
export async function updatePlaybook(id: string, data: AutoHealing.UpdatePlaybookRequest) {
    return request<{ data: AutoHealing.Playbook }>(`/api/v1/playbooks/${id}`, {
        method: 'PUT',
        data,
    });
}

/**
 * 删除 Playbook
 * DELETE /api/v1/playbooks/{id}
 */
export async function deletePlaybook(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/playbooks/${id}`, {
        method: 'DELETE',
    });
}

/**
 * 扫描 Playbook 变量
 * POST /api/v1/playbooks/{id}/scan
 */
export async function scanPlaybook(id: string, data?: AutoHealing.ScanPlaybookRequest) {
    return request<{ data: AutoHealing.PlaybookScanLog }>(`/api/v1/playbooks/${id}/scan`, {
        method: 'POST',
        data,
    });
}

/**
 * 更新 Playbook 变量配置
 * PUT /api/v1/playbooks/{id}/variables
 */
export async function updatePlaybookVariables(id: string, data: AutoHealing.UpdatePlaybookVariablesRequest) {
    return request<{ data: AutoHealing.Playbook }>(`/api/v1/playbooks/${id}/variables`, {
        method: 'PUT',
        data,
    });
}

/**
 * 设置 Playbook 为 Ready 状态
 * POST /api/v1/playbooks/{id}/ready
 */
export async function setPlaybookReady(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/playbooks/${id}/ready`, {
        method: 'POST',
    });
}

/**
 * 获取 Playbook 扫描日志
 * GET /api/v1/playbooks/{id}/scan-logs
 */
export async function getPlaybookScanLogs(id: string, params?: {
    page?: number;
    page_size?: number;
}) {
    return request<AutoHealing.PaginatedResponse<AutoHealing.PlaybookScanLog>>(`/api/v1/playbooks/${id}/scan-logs`, {
        method: 'GET',
        params,
    });
}

/**
 * 设置 Playbook 为 Pending 状态（下线）
 * POST /api/v1/playbooks/{id}/offline
 */
export async function setPlaybookOffline(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/playbooks/${id}/offline`, {
        method: 'POST',
    });
}

/**
 * 获取 Playbook 文件列表
 * GET /api/v1/playbooks/{id}/files
 */
export async function getPlaybookFiles(id: string) {
    return request<{ data: { files: AutoHealing.PlaybookFile[] } }>(`/api/v1/playbooks/${id}/files`, {
        method: 'GET',
    });
}

/**
 * 获取 Playbook 统计数据
 * GET /api/v1/playbooks/stats
 */
export async function getPlaybookStats() {
    return request<{
        code: number;
        data: {
            total: number;
            by_status: Array<{ status: string; count: number }>;
            by_config_mode: Array<{ config_mode: string; count: number }>;
        };
    }>('/api/v1/playbooks/stats', { method: 'GET' });
}

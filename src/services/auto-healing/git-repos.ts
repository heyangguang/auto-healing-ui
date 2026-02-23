import { request } from '@umijs/max';

/**
 * Git 仓库管理 API
 * 基于 docs/git-repository-management.md
 */

// ==================== 验证与创建 ====================

/**
 * 验证仓库（创建前获取分支列表）
 * POST /api/v1/git-repos/validate
 */
export async function validateGitRepo(data: {
    url: string;
    auth_type?: string;
    auth_config?: Record<string, any>;
}) {
    return request<{ data: { branches: string[]; default_branch: string } }>('/api/v1/git-repos/validate', {
        method: 'POST',
        data,
    });
}

/**
 * 创建 Git 仓库（验证后调用）
 * POST /api/v1/git-repos
 */
export async function createGitRepo(data: AutoHealing.CreateGitRepoRequest) {
    return request<{ data: AutoHealing.GitRepository }>('/api/v1/git-repos', {
        method: 'POST',
        data,
    });
}

// ==================== CRUD ====================

/**
 * 获取 Git 仓库列表
 * GET /api/v1/git-repos
 */
export async function getGitRepos(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    name?: string;
    url?: string;
    status?: string;
    auth_type?: string;
    sync_enabled?: boolean;
    sort_field?: string;
    sort_order?: string;
    created_from?: string;
    created_to?: string;
}) {
    return request<{ data: AutoHealing.GitRepository[]; total: number; page: number; page_size: number }>('/api/v1/git-repos', {
        method: 'GET',
        params,
    });
}

/**
 * 获取仓库详情
 * GET /api/v1/git-repos/{id}
 */
export async function getGitRepo(id: string) {
    return request<{ data: AutoHealing.GitRepository }>(`/api/v1/git-repos/${id}`, {
        method: 'GET',
    });
}

/**
 * 更新仓库
 * PUT /api/v1/git-repos/{id}
 */
export async function updateGitRepo(id: string, data: AutoHealing.UpdateGitRepoRequest) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/git-repos/${id}`, {
        method: 'PUT',
        data,
    });
}

/**
 * 删除仓库
 * DELETE /api/v1/git-repos/{id}
 */
export async function deleteGitRepo(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/git-repos/${id}`, {
        method: 'DELETE',
    });
}

// ==================== 同步与分支 ====================

/**
 * 同步仓库（git pull）
 * POST /api/v1/git-repos/{id}/sync
 */
export async function syncGitRepo(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/git-repos/${id}/sync`, {
        method: 'POST',
    });
}

// ==================== 文件与历史 ====================

/**
 * 获取文件树/内容
 * GET /api/v1/git-repos/{id}/files
 */
export async function getFiles(id: string, path?: string) {
    return request<{ data: { files?: any[]; path?: string; content?: string } }>(`/api/v1/git-repos/${id}/files`, {
        method: 'GET',
        params: path ? { path } : undefined,
    });
}

/**
 * 获取 Commit 历史
 * GET /api/v1/git-repos/{id}/commits
 */
export async function getCommits(id: string, limit: number = 10) {
    return request<{
        data: Array<{
            commit_id: string;
            full_id: string;
            message: string;
            author: string;
            author_email: string;
            date: string;
        }>
    }>(`/api/v1/git-repos/${id}/commits`, {
        method: 'GET',
        params: { limit },
    });
}

/**
 * 获取同步日志
 * GET /api/v1/git-repos/{id}/logs
 */
export async function getSyncLogs(id: string, params?: { page?: number; page_size?: number }) {
    return request<AutoHealing.PaginatedResponse<any>>(`/api/v1/git-repos/${id}/logs`, {
        method: 'GET',
        params,
    });
}

/**
 * 获取 Git 仓库统计数据
 * GET /api/v1/git-repos/stats
 */
export async function getGitRepoStats() {
    return request<{
        code: number;
        data: {
            total: number;
            by_status: Array<{ status: string; count: number }>;
        };
    }>('/api/v1/git-repos/stats', { method: 'GET' });
}

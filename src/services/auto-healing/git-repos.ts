import { request } from '@umijs/max';
import {
    getTenantGitRepos,
    postTenantGitRepos,
    postTenantGitReposIdSync,
} from '@/services/generated/auto-healing/gitPlaybooks';
import { normalizePaginatedResponse, unwrapData } from './responseAdapters';

type RequestOptions = {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: unknown;
    params?: Record<string, unknown>;
};

export interface GitRepositoryRecord extends AutoHealing.GitRepository {
    playbook_count?: number;
}

export interface GitRepoValidationResult {
    branches: string[];
    default_branch: string;
}

export interface GitRepoFileNode {
    path: string;
    name: string;
    type: 'directory' | 'file';
    children?: GitRepoFileNode[];
}

export interface GitRepoFilesResponse {
    files?: GitRepoFileNode[];
    path?: string;
    content?: string;
}

export interface GitCommitRecord {
    commit_id: string;
    full_id: string;
    message: string;
    author: string;
    author_email: string;
    date: string;
}

export interface GitSyncLogRecord {
    id: string;
    status: string;
    trigger_type: string;
    action?: string;
    commit_id?: string;
    error_message?: string;
    created_at: string;
}

export interface GitRepoStatsSummary {
    total: number;
    by_status: Array<{ status: string; count: number }>;
}

const DEFAULT_COMMIT_LIMIT = 10;

async function requestUnwrapped<T>(url: string, options: RequestOptions) {
    return unwrapData(
        await request<{ data?: T } | T>(url, options),
    ) as T;
}

/**
 * Git 仓库管理 API
 * 基于 docs/git-repository-management.md
 */

// ==================== 验证与创建 ====================

/**
 * 验证仓库（创建前获取分支列表）
 * POST /api/v1/tenant/git-repos/validate
 */
export async function validateGitRepo(data: {
    url: string;
    auth_type?: string;
    auth_config?: Record<string, unknown>;
}) {
    return requestUnwrapped<GitRepoValidationResult>('/api/v1/tenant/git-repos/validate', {
            method: 'POST',
            data,
        });
}

/**
 * 创建 Git 仓库（验证后调用）
 * POST /api/v1/tenant/git-repos
 */
export async function createGitRepo(data: AutoHealing.CreateGitRepoRequest) {
    return unwrapData(
        await postTenantGitRepos(data) as { data?: GitRepositoryRecord } | GitRepositoryRecord,
    ) as GitRepositoryRecord;
}

// ==================== CRUD ====================

/**
 * 获取 Git 仓库列表
 * GET /api/v1/tenant/git-repos
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
    sort_by?: string;
    sort_order?: string;
    created_from?: string;
    created_to?: string;
}) {
    return normalizePaginatedResponse(
        await getTenantGitRepos((params || {}) as GeneratedAutoHealing.getTenantGitReposParams) as AutoHealing.PaginatedResponse<GitRepositoryRecord>,
    );
}

/**
 * 获取仓库详情
 * GET /api/v1/tenant/git-repos/{id}
 */
export async function getGitRepo(id: string) {
    return requestUnwrapped<GitRepositoryRecord>(`/api/v1/tenant/git-repos/${id}`, {
            method: 'GET',
        });
}

/**
 * 更新仓库
 * PUT /api/v1/tenant/git-repos/{id}
 */
export async function updateGitRepo(id: string, data: AutoHealing.UpdateGitRepoRequest) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/git-repos/${id}`, {
        method: 'PUT',
        data,
    });
}

/**
 * 删除仓库
 * DELETE /api/v1/tenant/git-repos/{id}
 */
export async function deleteGitRepo(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/git-repos/${id}`, {
        method: 'DELETE',
    });
}

// ==================== 同步与分支 ====================

/**
 * 同步仓库（git pull）
 * POST /api/v1/tenant/git-repos/{id}/sync
 */
export async function syncGitRepo(id: string) {
    return postTenantGitReposIdSync({ id }) as Promise<AutoHealing.SuccessResponse>;
}

// ==================== 文件与历史 ====================

/**
 * 获取文件树/内容
 * GET /api/v1/tenant/git-repos/{id}/files
 */
export async function getFiles(id: string, path?: string) {
    return requestUnwrapped<GitRepoFilesResponse>(`/api/v1/tenant/git-repos/${id}/files`, {
            method: 'GET',
            params: path ? { path } : undefined,
        });
}

/**
 * 获取 Commit 历史
 * GET /api/v1/tenant/git-repos/{id}/commits
 */
export async function getCommits(id: string, limit: number = DEFAULT_COMMIT_LIMIT) {
    return requestUnwrapped<GitCommitRecord[]>(`/api/v1/tenant/git-repos/${id}/commits`, {
            method: 'GET',
            params: { limit },
        });
}

/**
 * 获取同步日志
 * GET /api/v1/tenant/git-repos/{id}/logs
 */
export async function getSyncLogs(id: string, params?: { page?: number; page_size?: number }) {
    return normalizePaginatedResponse(
        await request<AutoHealing.PaginatedResponse<GitSyncLogRecord>>(`/api/v1/tenant/git-repos/${id}/logs`, {
            method: 'GET',
            params,
        }),
    );
}

/**
 * 获取 Git 仓库统计数据
 * GET /api/v1/tenant/git-repos/stats
 */
export async function getGitRepoStats() {
    return requestUnwrapped<GitRepoStatsSummary>('/api/v1/tenant/git-repos/stats', { method: 'GET' });
}

import { request } from '@umijs/max';

/**
 * Dashboard API 服务层
 * 通过 sections 参数按需查询各模块统计数据
 */

/** GET /api/v1/dashboard/overview?sections=... */
export async function getDashboardOverview(sections: string[]) {
    return request<any>('/api/v1/dashboard/overview', {
        method: 'GET',
        params: { sections: sections.join(',') },
        skipErrorHandler: true,
    });
}

/** GET /api/v1/dashboard/config */
export async function getDashboardConfig() {
    return request<any>('/api/v1/dashboard/config', {
        method: 'GET',
        skipErrorHandler: true,
    });
}

/** PUT /api/v1/dashboard/config */
export async function saveDashboardConfig(config: any) {
    return request<any>('/api/v1/dashboard/config', {
        method: 'PUT',
        data: config,
    });
}

// ==================== 系统工作区管理 ====================

/** POST /api/v1/dashboard/workspaces */
export async function createSystemWorkspace(data: { name: string; description?: string; config: any }) {
    return request<any>('/api/v1/dashboard/workspaces', {
        method: 'POST',
        data,
    });
}

/** GET /api/v1/dashboard/workspaces */
export async function listSystemWorkspaces() {
    return request<any>('/api/v1/dashboard/workspaces', {
        method: 'GET',
    });
}

/** PUT /api/v1/dashboard/workspaces/:id */
export async function updateSystemWorkspace(id: string, data: { name?: string; description?: string; config?: any }) {
    return request<any>(`/api/v1/dashboard/workspaces/${id}`, {
        method: 'PUT',
        data,
    });
}

/** DELETE /api/v1/dashboard/workspaces/:id */
export async function deleteSystemWorkspace(id: string) {
    return request<any>(`/api/v1/dashboard/workspaces/${id}`, {
        method: 'DELETE',
    });
}

// ==================== 角色-工作区关联 ====================

/** GET /api/v1/dashboard/roles/:roleId/workspaces */
export async function getRoleWorkspaces(roleId: string) {
    return request<any>(`/api/v1/dashboard/roles/${roleId}/workspaces`, {
        method: 'GET',
    });
}

/** PUT /api/v1/dashboard/roles/:roleId/workspaces */
export async function assignRoleWorkspaces(roleId: string, workspaceIds: string[]) {
    return request<any>(`/api/v1/dashboard/roles/${roleId}/workspaces`, {
        method: 'PUT',
        data: { workspace_ids: workspaceIds },
    });
}

import { request } from '@umijs/max';
import { getTenantDashboardOverview } from '@/services/generated/auto-healing/dashboard';
import { unwrapData, unwrapItems } from './responseAdapters';

type DashboardRequestOptions = Record<string, unknown>;
type DashboardOverviewResponse = Record<string, unknown> & {
    data?: Record<string, unknown>;
};
type DashboardConfigEnvelope = {
    data: DashboardConfigPayload;
};
type RoleWorkspaceBindingEnvelope = {
    data: RoleWorkspaceBinding;
};
type SystemWorkspaceResponse = Partial<SystemWorkspaceRecord> & {
    data?: SystemWorkspaceRecord;
};

export type DashboardSectionConfig = Record<string, unknown>;

export interface DashboardConfigPayload {
    [key: string]: unknown;
    system_workspaces?: SystemWorkspaceRecord[];
}

export interface SystemWorkspaceRecord {
    config: DashboardSectionConfig;
    description?: string;
    id: string;
    is_default?: boolean;
    is_readonly?: boolean;
    name: string;
}

export interface SystemWorkspacePayload {
    config: DashboardSectionConfig;
    description?: string;
    name: string;
}

export interface RoleWorkspaceBinding {
    workspace_ids: string[];
}

/**
 * Dashboard API 服务层
 * 通过 sections 参数按需查询各模块统计数据
 */

/** GET /api/v1/tenant/dashboard/overview?sections=... */
export async function getDashboardOverview(sections: string[], options: DashboardRequestOptions = {}) {
    return getTenantDashboardOverview(
        { sections: sections.join(',') },
        {
            skipErrorHandler: true,
            ...options,
        },
    ) as Promise<DashboardOverviewResponse>;
}

/** GET /api/v1/tenant/dashboard/config */
export async function getDashboardConfig() {
    return request<DashboardConfigEnvelope | DashboardConfigPayload>('/api/v1/tenant/dashboard/config', {
        method: 'GET',
        skipErrorHandler: true,
    });
}

/** PUT /api/v1/tenant/dashboard/config */
export async function saveDashboardConfig(config: DashboardConfigPayload) {
    return request<DashboardConfigEnvelope | DashboardConfigPayload>('/api/v1/tenant/dashboard/config', {
        method: 'PUT',
        data: config,
    });
}

// ==================== 系统工作区管理 ====================

/** POST /api/v1/tenant/dashboard/workspaces */
export async function createSystemWorkspace(data: SystemWorkspacePayload) {
    return request<SystemWorkspaceResponse>('/api/v1/tenant/dashboard/workspaces', {
        method: 'POST',
        data,
    });
}

/** GET /api/v1/tenant/dashboard/workspaces */
export async function listSystemWorkspaces() {
    return unwrapItems<SystemWorkspaceRecord>(await request<AutoHealing.PaginatedResponse<SystemWorkspaceRecord>>('/api/v1/tenant/dashboard/workspaces', {
        method: 'GET',
    }));
}

/** PUT /api/v1/tenant/dashboard/workspaces/:id */
export async function updateSystemWorkspace(id: string, data: Partial<SystemWorkspacePayload>) {
    return request<SystemWorkspaceResponse>(`/api/v1/tenant/dashboard/workspaces/${id}`, {
        method: 'PUT',
        data,
    });
}

/** DELETE /api/v1/tenant/dashboard/workspaces/:id */
export async function deleteSystemWorkspace(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/dashboard/workspaces/${id}`, {
        method: 'DELETE',
    });
}

// ==================== 角色-工作区关联 ====================

/** GET /api/v1/tenant/dashboard/roles/:roleId/workspaces */
export async function getRoleWorkspaces(roleId: string) {
    return unwrapData(await request<RoleWorkspaceBindingEnvelope | RoleWorkspaceBinding>(`/api/v1/tenant/dashboard/roles/${roleId}/workspaces`, {
        method: 'GET',
    }));
}

/** PUT /api/v1/tenant/dashboard/roles/:roleId/workspaces */
export async function assignRoleWorkspaces(roleId: string, workspaceIds: string[]) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/dashboard/roles/${roleId}/workspaces`, {
        method: 'PUT',
        data: { workspace_ids: workspaceIds },
    });
}

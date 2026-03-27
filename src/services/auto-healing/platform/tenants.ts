import { request } from '@umijs/max';
import type {
    CreateTenantRequest,
    PlatformTenant,
    PlatformTenantsListParams,
    ServiceDataEnvelope,
    ServiceItemsEnvelope,
    ServicePaginatedEnvelope,
    UpdateTenantRequest,
} from './contracts';
import { normalizePaginatedResponse, unwrapData, unwrapItems } from '../responseAdapters';

const normalizeTenantsPage = <T>(
    response: AutoHealing.PaginatedResponse<T>,
    requestedPageSize?: number,
): AutoHealing.PaginatedResponse<T> => ({
    ...response,
    page_size: (response.page_size ?? 0) > 0 ? response.page_size : requestedPageSize ?? 1,
});

export interface PlatformTenantUserSummary {
    id?: string;
    username?: string;
    display_name?: string;
    email?: string;
    is_platform_admin?: boolean;
}

export interface PlatformTenantRecord extends PlatformTenant {
    icon?: string;
    member_count?: number;
}

export interface PlatformTenantRoleSummary {
    id?: string;
    name?: string;
    display_name?: string;
}

export interface PlatformTenantMember {
    user_id: string;
    role_id: string;
    created_at?: string;
    user?: PlatformTenantUserSummary;
    role?: PlatformTenantRoleSummary;
}

export interface TenantInvitation {
    id: string;
    email: string;
    status: string;
    invitation_url?: string;
    email_message?: string;
    expires_at?: string;
    role?: PlatformTenantRoleSummary;
    inviter?: PlatformTenantUserSummary;
}

export interface PlatformTenantStatsSummary {
    total_tenants: number;
    active_tenants: number;
    disabled_tenants: number;
    total_users: number;
    total_rules: number;
    total_instances: number;
    total_templates: number;
}

export interface PlatformTenantStatsItem {
    id: string;
    name: string;
    code: string;
    status: 'active' | 'disabled';
    icon?: string;
    member_count?: number;
    rule_count?: number;
    instance_count?: number;
    template_count?: number;
    audit_log_count?: number;
    last_activity_at?: string | null;
    cmdb_count?: number;
    git_count?: number;
    playbook_count?: number;
    secret_count?: number;
    plugin_count?: number;
    incident_count?: number;
    flow_count?: number;
    schedule_count?: number;
    notification_channel_count?: number;
    notification_template_count?: number;
    healing_success_count?: number;
    healing_total_count?: number;
    incident_covered_count?: number;
}

export interface PlatformTenantStatsResponse {
    tenants: PlatformTenantStatsItem[];
    summary: PlatformTenantStatsSummary;
}

export interface PlatformTenantTrendResponse {
    dates: string[];
    operations: number[];
    audit_logs: number[];
    task_executions: number[];
}

/**
 * 平台级租户管理 API
 * 所有 API 不携带 X-Tenant-ID
 */

/** 获取租户列表 */
export async function getTenants(
    params?: PlatformTenantsListParams,
): Promise<AutoHealing.PaginatedResponse<PlatformTenantRecord>> {
    return normalizeTenantsPage(
        normalizePaginatedResponse(
            await request<ServicePaginatedEnvelope<PlatformTenantRecord>>('/api/v1/platform/tenants', {
                method: 'GET',
                params,
            }),
        ),
        params?.page_size,
    );
}

// 别名
export const getPlatformTenants = getTenants;

/** 创建租户（空租户，不自动分配管理员） */
export async function createTenant(data: CreateTenantRequest): Promise<PlatformTenant> {
    return unwrapData(
        await request<ServiceDataEnvelope<PlatformTenant> | PlatformTenant>('/api/v1/platform/tenants', {
            method: 'POST',
            data,
        }),
    );
}

/** 更新租户信息 / 禁用租户 */
export async function updateTenant(id: string, data: UpdateTenantRequest) {
    return unwrapData(await request<ServiceDataEnvelope<PlatformTenantRecord>>(`/api/v1/platform/tenants/${id}`, {
        method: 'PUT',
        data,
    }));
}

/** 删除租户 */
export async function deleteTenant(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/platform/tenants/${id}`, {
        method: 'DELETE',
    });
}

/** 获取租户详情 */
export async function getTenant(id: string) {
    return unwrapData(await request<ServiceDataEnvelope<PlatformTenantRecord>>(`/api/v1/platform/tenants/${id}`, {
        method: 'GET',
    }));
}

/** 查看租户成员及角色 */
export async function getTenantMembers(tenantId: string) {
    return unwrapItems(await request<ServiceItemsEnvelope<PlatformTenantMember>>(`/api/v1/platform/tenants/${tenantId}/members`, {
        method: 'GET',
    }));
}

/** 添加租户成员 */
export async function addTenantMember(tenantId: string, data: { user_id: string; role_id: string }) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/platform/tenants/${tenantId}/members`, {
        method: 'POST',
        data,
    });
}

/**
 * 变更租户内成员角色（升/降级）
 * PUT /platform/tenants/:id/members/:userId/role  { role_id: string }
 */
export async function updateTenantMemberRole(tenantId: string, userId: string, data: { role_id: string }) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/platform/tenants/${tenantId}/members/${userId}/role`, {
        method: 'PUT',
        data,
    });
}

/** 移除租户成员 */
export async function removeTenantMember(tenantId: string, userId: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/platform/tenants/${tenantId}/members/${userId}`, {
        method: 'DELETE',
    });
}

// ==================== 邀请管理 ====================

/** 邀请用户加入租户 */
export async function inviteToTenant(
    tenantId: string,
    data: { email: string; role_id: string; send_email?: boolean },
) {
    return unwrapData(await request<ServiceDataEnvelope<TenantInvitation>>(`/api/v1/platform/tenants/${tenantId}/invitations`, {
        method: 'POST',
        data,
    }));
}

/** 查看租户邀请列表 */
export async function getTenantInvitations(tenantId: string, params?: { page?: number; page_size?: number }) {
    return normalizeTenantsPage(
        normalizePaginatedResponse(await request<ServicePaginatedEnvelope<TenantInvitation>>(`/api/v1/platform/tenants/${tenantId}/invitations`, {
            method: 'GET',
            params,
        })),
        params?.page_size,
    );
}

/** 取消邀请 */
export async function cancelTenantInvitation(tenantId: string, invitationId: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/platform/tenants/${tenantId}/invitations/${invitationId}`, {
        method: 'DELETE',
    });
}

// ==================== 统计 ====================

/** 获取租户运营总览统计 */
export async function getTenantStats() {
    return unwrapData(await request<ServiceDataEnvelope<PlatformTenantStatsResponse>>('/api/v1/platform/tenants/stats', {
        method: 'GET',
    }));
}

/** 获取租户运营趋势数据 */
export async function getTenantTrends(params?: { days?: number }) {
    return unwrapData(await request<ServiceDataEnvelope<PlatformTenantTrendResponse>>('/api/v1/platform/tenants/trends', {
        method: 'GET',
        params,
    }));
}

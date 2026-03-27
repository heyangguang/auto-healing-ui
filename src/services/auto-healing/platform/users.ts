import { request } from '@umijs/max';
import type {
    AssignPlatformUserRolesRequest,
    CreatePlatformUserRequest,
    CreateTenantUserRequest,
    PlatformUserPageResponse,
    PlatformUserRecord,
    PlatformUsersListParams,
    PlatformUserSimpleRecord,
    PlatformUsersSimpleParams,
    ResetPlatformUserPasswordRequest,
    ServiceDataEnvelope,
    ServiceItemsEnvelope,
    ServicePaginatedEnvelope,
    TenantUsersListParams,
    UpdatePlatformUserRequest,
} from './contracts';
import { normalizePaginatedResponse, unwrapData, unwrapItems } from '../responseAdapters';

const normalizePlatformUsersPage = <T>(
    response: AutoHealing.PaginatedResponse<T>,
    requestedPageSize?: number,
): AutoHealing.PaginatedResponse<T> => ({
    ...response,
    page_size: (response.page_size ?? 0) > 0 ? response.page_size : requestedPageSize ?? 1,
});

/**
 * 平台级用户管理 API
 * 平台管理员专用，不携带 X-Tenant-ID
 *
 * 注意：
 * - GET /platform/users        → 返回拥有任一平台角色的用户
 * - GET /platform/users/simple → 全量轻量用户池（选人用，不过滤）
 */

/** 获取平台用户列表（拥有平台角色的用户） */
export async function getPlatformUsers(
    params?: PlatformUsersListParams,
): Promise<PlatformUserPageResponse> {
    return normalizePlatformUsersPage(
        normalizePaginatedResponse(
            await request<ServicePaginatedEnvelope<PlatformUserRecord>>('/api/v1/platform/users', {
                method: 'GET',
                params,
            }),
        ),
        params?.page_size,
    );
}

/** 全量轻量用户池（设置租户管理员时用，不过滤角色） */
export async function getPlatformUsersSimple(
    params?: PlatformUsersSimpleParams,
): Promise<PlatformUserSimpleRecord[]> {
    return unwrapItems(
        await request<ServiceItemsEnvelope<PlatformUserSimpleRecord>>('/api/v1/platform/users/simple', {
            method: 'GET',
            params,
        }),
    );
}

/** 创建平台用户（可指定角色，不传默认 platform_admin） */
export async function createPlatformUser(
    data: CreatePlatformUserRequest,
): Promise<PlatformUserRecord> {
    return unwrapData(
        await request<ServiceDataEnvelope<PlatformUserRecord> | PlatformUserRecord>('/api/v1/platform/users', {
            method: 'POST',
            data,
        }),
    );
}

/** 更新平台用户信息 */
export async function updatePlatformUser(
    id: string,
    data: UpdatePlatformUserRequest,
): Promise<PlatformUserRecord> {
    return unwrapData(await request<ServiceDataEnvelope<PlatformUserRecord>>(`/api/v1/platform/users/${id}`, {
        method: 'PUT',
        data,
    }));
}

/** 删除平台用户（最后一个 platform_admin 不可删，后端返回 400） */
export async function deletePlatformUser(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/platform/users/${id}`, {
        method: 'DELETE',
    });
}

/** 获取平台用户详情 */
export async function getPlatformUser(id: string): Promise<PlatformUserRecord> {
    return unwrapData(await request<ServiceDataEnvelope<PlatformUserRecord>>(`/api/v1/platform/users/${id}`, {
        method: 'GET',
    }));
}

/** 重置平台用户密码 */
export async function resetPlatformUserPassword(
    id: string,
    data: ResetPlatformUserPasswordRequest,
) {
    return request<AutoHealing.SuccessResponse>(
        `/api/v1/platform/users/${id}/reset-password`,
        { method: 'POST', data }
    );
}

/** 变更平台用户全局角色 */
export async function assignPlatformUserRoles(
    id: string,
    data: AssignPlatformUserRolesRequest,
) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/platform/users/${id}/roles`, {
        method: 'PUT',
        data,
    });
}

// ===== 租户级用户管理 API（租户管理员专用，自动携带 X-Tenant-ID） =====

/** 获取当前租户用户列表 */
export async function getTenantUsers(
    params?: TenantUsersListParams,
): Promise<AutoHealing.PaginatedResponse<AutoHealing.User>> {
    return normalizePlatformUsersPage(
        normalizePaginatedResponse(
            await request<ServicePaginatedEnvelope<AutoHealing.User>>('/api/v1/tenant/users', {
                method: 'GET',
                params,
            }),
        ),
        params?.page_size,
    );
}

/** 创建租户用户 */
export async function createTenantUser(data: CreateTenantUserRequest) {
    return unwrapData(
        await request<ServiceDataEnvelope<AutoHealing.User> | AutoHealing.User>('/api/v1/tenant/users', {
            method: 'POST',
            data,
        }),
    );
}

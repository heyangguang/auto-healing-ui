declare namespace AutoHealing {
    // ==================== 通用类型 ====================

    type UUID = string;

    type JsonPrimitive = string | number | boolean | null;

    type JsonValue = JsonPrimitive | JsonObject | JsonArray;

    type JsonArray = JsonValue[];

    type ConditionValue = string | number | readonly string[] | undefined;

    interface JsonObject {
        [key: string]: JsonValue | undefined;
    }

    interface PaginatedResponse<T> {
        data?: T[];
        items?: T[];
        pagination?: {
            page: number;
            page_size: number;
            total: number;
            total_pages: number;
        };
        total?: number;
        page?: number;
        page_size?: number;
    }

    interface SuccessResponse {
        message: string;
    }

    // 单主机测试响应

    interface TestQuerySingleResult {
        success: boolean;
        auth_type?: string;
        username?: string;
        has_credential: boolean;
        message: string;
    }

    // 批量测试响应

    interface TestQueryBatchResult {
        hostname: string;
        ip_address: string;
        success: boolean;
        auth_type?: string;
        username?: string;
        has_credential?: boolean;
        message: string;
    }

    interface TestQueryResponse {
        code: number;
        message: string;
        data: TestQuerySingleResult | {
            success_count: number;
            fail_count: number;
            results: TestQueryBatchResult[];
        };
    }

    interface ErrorResponse {
        error: {
            code: string;
            message: string;
            details?: string;
        };
    }

    // ==================== 认证 ====================

    interface LoginRequest {
        username: string;
        password: string;
    }

    interface LoginResponse {
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
        user: UserInfo;
        tenants: TenantBrief[];
        current_tenant_id: UUID | '';
    }

    interface RefreshTokenRequest {
        refresh_token: string;
    }

    interface RefreshTokenResponse {
        access_token: string;
        refresh_token: string;
        expires_in: number;
        tenants: TenantBrief[];
        current_tenant_id: UUID | '';
    }

    interface ChangePasswordRequest {
        old_password: string;
        new_password: string;
    }

    interface UserInfo {
        id: UUID;
        username: string;
        email: string;
        display_name: string;
        roles: string[];
        permissions: string[];
        is_platform_admin: boolean;
    }

    interface TenantBrief {
        id: UUID;
        name: string;
        code: string;
    }

    // ==================== 用户管理 ====================

    interface User {
        id: UUID;
        username: string;
        email: string;
        display_name: string;
        status: 'active' | 'inactive';
        created_at: string;
        updated_at: string;
        roles?: RoleDetail[];
        is_platform_admin?: boolean;
    }

    interface CreateUserRequest {
        username: string;
        email: string;
        password: string;
        display_name?: string;
        /** 单角色模型：推荐传 role_id；兼容旧接口仍接受 role_ids（长度应 <= 1） */
        role_id?: UUID;
        role_ids?: UUID[];
    }

    interface UpdateUserRequest {
        email?: string;
        display_name?: string;
        status?: 'active' | 'inactive';
        role_id?: UUID;
    }

    interface ResetPasswordRequest {
        new_password: string;
    }

    interface AssignRolesRequest {
        role_ids: UUID[];
    }

    // ==================== 角色管理 ====================

    interface Role {
        id: UUID;
        name: string;
        display_name: string;
        description: string;
        is_system: boolean;
        created_at: string;
    }

    interface CreateRoleRequest {
        name: string;
        display_name: string;
        description?: string;
    }

    interface UpdateRoleRequest {
        display_name?: string;
        description?: string;
    }

    interface AssignPermissionsRequest {
        permission_ids: UUID[];
    }

    // ==================== 权限管理 ====================

    interface Permission {
        id: UUID;
        code: string;
        name: string;
        module: string;
        resource: string;
        action: string;
    }

    type PermissionTree = Record<string, Permission[]>;

    // ==================== 用户资料（个人中心） ====================

    interface UserProfile {
        id: UUID;
        username: string;
        email: string;
        display_name: string;
        phone: string;
        avatar_url: string;
        status: 'active' | 'inactive';
        last_login_at: string | null;
        last_login_ip: string;
        password_changed_at: string;
        created_at: string;
        roles: RoleDetail[];
        permissions: string[];
        is_platform_admin: boolean;
    }

    interface RoleDetail {
        id: UUID;
        name: string;
        display_name: string;
        is_system: boolean;
    }

    interface UpdateProfileRequest {
        display_name?: string;
        email?: string;
        phone?: string;
    }

    // 角色列表（含统计）

    interface RoleWithStats extends Role {
        user_count: number;
        permission_count: number;
        permissions?: Permission[];
    }


    // ==================== 插件管理 ====================

    type PluginType = 'itsm' | 'cmdb';

    type PluginAdapter = 'servicenow' | 'jira' | 'zabbix' | 'custom';

    type PluginStatus = 'active' | 'inactive' | 'error';
}

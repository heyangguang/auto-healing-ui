export interface PlatformTenant {
  id: string;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  status?: 'active' | 'disabled';
  created_at: string;
  updated_at: string;
}

export interface CreateTenantRequest {
  name: string;
  code: string;
  description?: string;
  icon?: string;
}

export interface UpdateTenantRequest {
  name?: string;
  description?: string;
  icon?: string;
  status?: 'active' | 'disabled';
}

export interface CreateTenantUserRequest {
  username: string;
  password: string;
  email: string;
  display_name?: string;
  role_ids?: string[];
}

export type ServiceDataEnvelope<T> = {
  code?: number;
  data?: T;
  message?: string;
  success?: boolean;
};

export type ServiceItemsEnvelope<T> =
  | T[]
  | {
      code?: number;
      data?: T[] | { items?: T[]; rankings?: T[] };
      items?: T[];
      rankings?: T[];
      message?: string;
    };

export type ServicePaginatedEnvelope<T> =
  | AutoHealing.PaginatedResponse<T>
  | {
      code?: number;
      data?: T[] | { items?: T[]; total?: number; page?: number; page_size?: number };
      items?: T[];
      message?: string;
      page?: number;
      page_size?: number;
      pagination?: { total?: number; page?: number; page_size?: number };
      total?: number;
    };

export interface PlatformUserRole
  extends Pick<AutoHealing.RoleWithStats, 'id' | 'name' | 'display_name' | 'is_system'> {}

export type PlatformUserStatus = AutoHealing.User['status'] | 'locked';

export type PlatformUserRecord = Omit<AutoHealing.User, 'roles' | 'status'> & {
  roles?: PlatformUserRole[];
  status: PlatformUserStatus;
};

export type PlatformUserPageResponse = AutoHealing.PaginatedResponse<PlatformUserRecord>;

export interface PlatformUsersListParams {
  page?: number;
  page_size?: number;
  status?: PlatformUserStatus;
  username?: string;
  email?: string;
  display_name?: string;
  created_from?: string;
  created_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PlatformUserSimpleRecord {
  id: string;
  username: string;
  display_name: string;
  status: string;
  is_platform_admin?: boolean;
}

export interface PlatformUsersSimpleParams {
  name?: string;
  status?: string;
}

export interface CreatePlatformUserRequest {
  username: string;
  email: string;
  password: string;
  display_name?: string;
}

export interface ResetPlatformUserPasswordRequest {
  new_password: string;
}

export interface UpdatePlatformUserRequest {
  display_name?: string;
  status?: PlatformUserStatus;
}

export interface AssignPlatformUserRolesRequest {
  role_ids: string[];
}

export interface TenantUsersListParams {
  page?: number;
  page_size?: number;
  role_id?: string;
  username?: string;
  email?: string;
  display_name?: string;
  created_from?: string;
  created_to?: string;
}

export interface PlatformTenantsListParams {
  page?: number;
  page_size?: number;
  keyword?: string;
  name?: string;
  code?: string;
  status?: 'active' | 'disabled';
}

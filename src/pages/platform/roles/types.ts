import type { StandardTableFilter, StandardTableSearchValues } from '@/components/StandardTable';

export type PlatformRoleRecord = AutoHealing.RoleWithStats & {
    updated_at?: string;
};

export type PlatformRoleUser = {
    id: string;
    username: string;
    display_name: string;
    email: string;
    status: 'active' | 'inactive';
};

export type PlatformRoleSearchParams = {
    searchField?: string;
    searchValue?: string;
    advancedSearch?: StandardTableSearchValues;
    filters?: StandardTableFilter[];
};

export type PlatformRoleUserPage = AutoHealing.PaginatedResponse<PlatformRoleUser>;

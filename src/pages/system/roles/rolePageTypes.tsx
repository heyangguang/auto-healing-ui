import type { SearchField, StandardTableSearchValues, StandardTableSort } from '@/components/StandardTable';

export type WorkspaceSummary = {
    id: string;
    name: string;
    is_default?: boolean;
};

export type RoleDrawerDetail = AutoHealing.RoleWithStats & {
    _workspaceNames?: string[];
    updated_at?: string;
};

export type RoleAdvancedSearch = StandardTableSearchValues;

export type RoleRequestParams = {
    page: number;
    pageSize: number;
    searchField?: string;
    searchValue?: string;
    advancedSearch?: RoleAdvancedSearch;
    sorter?: StandardTableSort;
};

export const roleSearchFields: SearchField[] = [
    { key: 'display_name', label: '角色名称' },
    { key: 'name', label: '角色标识' },
];

export function getRoleKeywordFilter(params: RoleRequestParams) {
    const quickSearchField = params.searchField;
    const quickSearchValue = params.searchValue?.trim();
    if (quickSearchValue && quickSearchField !== 'is_system') {
        return quickSearchValue;
    }

    const nameFilter = params.advancedSearch?.name;
    if (typeof nameFilter === 'string' && nameFilter.trim()) {
        return nameFilter.trim();
    }

    const displayNameFilter = params.advancedSearch?.display_name;
    if (typeof displayNameFilter === 'string' && displayNameFilter.trim()) {
        return displayNameFilter.trim();
    }

    return undefined;
}

export function groupRolePermissions(permissions: AutoHealing.Permission[]) {
    const grouped: Record<string, AutoHealing.Permission[]> = {};
    permissions.forEach((permission) => {
        const moduleName = permission.module || 'other';
        if (!grouped[moduleName]) {
            grouped[moduleName] = [];
        }
        grouped[moduleName].push(permission);
    });
    return grouped;
}

export const rolesHeaderIcon = (
    <svg viewBox="0 0 48 48" fill="none">
        <title>角色图标</title>
        <path
            d="M24 6L6 14v8c0 11.1 7.7 21.5 18 24 10.3-2.5 18-12.9 18-24v-8L24 6z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
        />
        <path
            d="M18 24l4 4 8-8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

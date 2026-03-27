import type { SearchField } from '@/components/StandardTable';
import type { PlatformRoleRecord } from './types';

export const platformRoleSearchFields: SearchField[] = [
    { key: 'display_name', label: '角色名称' },
    { key: 'name', label: '角色标识' },
];

export const platformRolesHeaderIcon = (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <title>平台角色图标</title>
        <circle cx="24" cy="20" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M12 44c0-8 5.4-14 12-14s12 6 12 14" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M34 8l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <rect x="30" y="14" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
);

export function applyPlatformRoleSearch(
    roles: PlatformRoleRecord[],
    value?: string,
    field: 'display_name' | 'name' = 'display_name',
) {
    const keyword = value?.trim().toLowerCase();
    if (!keyword) {
        return roles;
    }

    return roles.filter((role) => {
        const target = field === 'name' ? role.name : role.display_name || '';
        return target.toLowerCase().includes(keyword);
    });
}

export function groupPermissions(perms: AutoHealing.Permission[]) {
    const groups: Record<string, AutoHealing.Permission[]> = {};
    for (const permission of perms) {
        const moduleName = permission.module || 'other';
        if (!groups[moduleName]) {
            groups[moduleName] = [];
        }
        groups[moduleName].push(permission);
    }
    return groups;
}

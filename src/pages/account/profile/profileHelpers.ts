import {
    ACTION_VERBS as ACTION_VERB,
    ALL_RESOURCE_LABELS as RESOURCE_MAP,
} from '@/constants/auditDicts';
import type { ProfileActivityItem, ProfileLoginHistoryItem } from '@/services/auto-healing/auth';

export type ProfileActivityRecord = ProfileActivityItem;
export type ProfileLoginRecord = ProfileLoginHistoryItem;

type LoadProfileSidebarDataOptions = {
    loadActivities: () => Promise<AutoHealing.PaginatedResponse<ProfileActivityRecord>>;
    loadLoginHistory: () => Promise<AutoHealing.PaginatedResponse<ProfileLoginRecord>>;
};

export function groupPermissions(permissions: string[]): Record<string, string[]> {
    return permissions.reduce<Record<string, string[]>>((groups, permission) => {
        const separatorIndex = permission.indexOf(':');
        const module = separatorIndex > 0 ? permission.slice(0, separatorIndex) : 'other';
        const action = separatorIndex > 0 ? permission.slice(separatorIndex + 1) : permission;
        const items = groups[module] || [];
        return { ...groups, [module]: [...items, action] };
    }, {});
}

export function describeActivity(log: ProfileActivityRecord) {
    const resourceType = RESOURCE_MAP[log.resource_type || ''] || log.resource_type || '';
    const actionMeta = ACTION_VERB[log.action || ''] || { verb: log.action || 'GET', color: '#8c8c8c' };
    return {
        action: resourceType ? `${actionMeta.verb} ${resourceType}` : actionMeta.verb,
        color: actionMeta.color,
        resource: log.resource_name || '',
    };
}

export function parseUA(userAgent: string): string {
    if (!userAgent) return '未知设备';
    if (userAgent.startsWith('curl')) return 'curl 命令行';

    const browser = /Edg\//.test(userAgent)
        ? 'Edge'
        : /Chrome\//.test(userAgent)
            ? 'Chrome'
            : /Firefox\//.test(userAgent)
                ? 'Firefox'
                : /Safari\//.test(userAgent)
                    ? 'Safari'
                    : '';
    const os = /Windows/.test(userAgent)
        ? 'Windows'
        : /iPhone|iPad/.test(userAgent)
            ? 'iOS'
            : /Android/.test(userAgent)
                ? 'Android'
                : /Mac OS/.test(userAgent)
                    ? 'macOS'
                    : /Linux/.test(userAgent)
                        ? 'Linux'
                        : '';

    if (browser && os) return `${browser} · ${os}`;
    if (browser) return browser;
    if (os) return os;
    return '未知设备';
}

export async function loadProfileSidebarData({
    loadActivities,
    loadLoginHistory,
}: LoadProfileSidebarDataOptions) {
    const [loginResult, activityResult] = await Promise.allSettled([
        loadLoginHistory(),
        loadActivities(),
    ]);

    return {
        activitiesFailed: activityResult.status === 'rejected',
        loginLogs: loginResult.status === 'fulfilled' ? (loginResult.value.data || []) : [],
        opLogs: activityResult.status === 'fulfilled' ? (activityResult.value.data || []) : [],
    };
}

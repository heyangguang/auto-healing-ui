import type { SearchField } from '@/components/StandardTable';
import type { PlatformTenantStatsItem } from '@/services/auto-healing/platform/tenants';

export type TenantStatsItem = PlatformTenantStatsItem;

export type TenantOpsSearchParams = {
    name?: string;
    code?: string;
    status?: TenantStatsItem['status'];
};

export const tenantOpsSearchFields: SearchField[] = [
    { key: 'name', label: '租户名称' },
    { key: 'code', label: '租户代码' },
    {
        key: '__enum__status',
        label: '租户状态',
        options: [
            { label: '正常', value: 'active' },
            { label: '停用', value: 'disabled' },
        ],
    },
];

export const tenantOpsHeaderIcon = (
    <svg viewBox="0 0 48 48" fill="none">
        <title>租户运营图标</title>
        <rect x="4" y="8" width="40" height="32" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
        <line x1="4" y1="18" x2="44" y2="18" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10" y="24" width="12" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <rect x="26" y="24" width="12" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <circle cx="16" cy="13" r="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <circle cx="24" cy="13" r="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
);

export const toSafeCount = (value?: number | null) => Number(value ?? 0);

export const getTenantTotalResources = (tenant: TenantStatsItem) =>
    toSafeCount(tenant.cmdb_count)
    + toSafeCount(tenant.template_count)
    + toSafeCount(tenant.playbook_count)
    + toSafeCount(tenant.secret_count)
    + toSafeCount(tenant.plugin_count)
    + toSafeCount(tenant.git_count);

export const getTenantAutomationTotal = (tenant: TenantStatsItem) =>
    toSafeCount(tenant.rule_count) + toSafeCount(tenant.flow_count);

export const getTenantHealingFailureCount = (tenant: TenantStatsItem) =>
    Math.max(0, toSafeCount(tenant.healing_total_count) - toSafeCount(tenant.healing_success_count));

export const getTenantUncoveredIncidentCount = (tenant: TenantStatsItem) =>
    Math.max(0, toSafeCount(tenant.incident_count) - toSafeCount(tenant.incident_covered_count));

export const getTenantConfiguredModuleCount = (tenant: TenantStatsItem) => [
    toSafeCount(tenant.rule_count) > 0,
    toSafeCount(tenant.template_count) > 0,
    toSafeCount(tenant.flow_count) > 0,
    toSafeCount(tenant.schedule_count) > 0,
    toSafeCount(tenant.cmdb_count) > 0,
    toSafeCount(tenant.secret_count) > 0,
    toSafeCount(tenant.git_count) > 0,
    toSafeCount(tenant.plugin_count) > 0,
    toSafeCount(tenant.notification_channel_count) > 0,
    toSafeCount(tenant.playbook_count) > 0,
].filter(Boolean).length;

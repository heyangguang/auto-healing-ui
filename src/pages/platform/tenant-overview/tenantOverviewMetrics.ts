import type { PlatformTenantStatsItem } from '@/services/auto-healing/platform/tenants';

export type TenantStatsItem = PlatformTenantStatsItem;

export const toSafeCount = (value?: number | null) => Number(value ?? 0);

export const getSafePercent = (value: number, total: number) =>
  (total > 0 ? Math.round((value / total) * 100) : 0);

export const getCoverageSubtext = (count: number, total: number, suffix: string) =>
  `${count}/${total} ${suffix}`;

export const getTenantResourceScore = (tenant: TenantStatsItem) =>
  toSafeCount(tenant.rule_count)
  + toSafeCount(tenant.instance_count)
  + toSafeCount(tenant.template_count);

export const getTenantInfraScore = (tenant: TenantStatsItem) =>
  toSafeCount(tenant.cmdb_count)
  + toSafeCount(tenant.secret_count)
  + toSafeCount(tenant.plugin_count);

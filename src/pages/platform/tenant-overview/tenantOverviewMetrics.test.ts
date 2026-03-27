import {
  getCoverageSubtext,
  getSafePercent,
  getTenantInfraScore,
  getTenantResourceScore,
  toSafeCount,
} from './tenantOverviewMetrics';

describe('tenant overview metrics helpers', () => {
  it('normalizes nullable counters to safe numeric values', () => {
    expect(toSafeCount(undefined)).toBe(0);
    expect(toSafeCount(null)).toBe(0);
    expect(toSafeCount(7)).toBe(7);
  });

  it('keeps percentages and coverage text stable when total is zero', () => {
    expect(getSafePercent(4, 0)).toBe(0);
    expect(getSafePercent(2, 5)).toBe(40);
    expect(getCoverageSubtext(0, 0, '个租户已配')).toBe('0/0 个租户已配');
  });

  it('computes tenant scores from optional counters without NaN', () => {
    expect(getTenantResourceScore({
      id: 'tenant-1',
      name: 'Tenant A',
      code: 'tenant-a',
      status: 'active',
      rule_count: 2,
      instance_count: undefined,
      template_count: 3,
    })).toBe(5);

    expect(getTenantInfraScore({
      id: 'tenant-1',
      name: 'Tenant A',
      code: 'tenant-a',
      status: 'active',
      cmdb_count: undefined,
      secret_count: 1,
      plugin_count: 2,
    })).toBe(3);
  });
});

import { __TEST_ONLY__ } from './dashboardStore';

describe('dashboardStore', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('builds storage keys with user and tenant scope', () => {
    sessionStorage.setItem('auto_healing_token', `header.${Buffer.from(JSON.stringify({
      sub: 'user-1',
    })).toString('base64url')}.sig`);
    localStorage.setItem('tenant-storage', JSON.stringify({ currentTenantId: 'tenant-a' }));

    expect(__TEST_ONLY__.getDashboardStorageKey()).toBe('auto_healing_dashboard_v5:user-1:tenant:tenant-a');
  });

  it('uses impersonation tenant scope when impersonation is active', () => {
    sessionStorage.setItem('auto_healing_token', `header.${Buffer.from(JSON.stringify({
      sub: 'user-1',
    })).toString('base64url')}.sig`);
    localStorage.setItem('impersonation-storage', JSON.stringify({
      isImpersonating: true,
      session: {
        requestId: 'req-1',
        tenantId: 'tenant-b',
        tenantName: 'Tenant B',
        expiresAt: '2099-01-01T00:00:00.000Z',
        startedAt: '2099-01-01T00:00:00.000Z',
      },
    }));

    expect(__TEST_ONLY__.getDashboardStorageKey()).toBe('auto_healing_dashboard_v5:user-1:impersonation:tenant-b');
  });
});

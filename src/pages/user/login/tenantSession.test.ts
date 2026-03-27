import { persistTenantSession } from './tenantSession';

describe('login tenant session helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('clears stale tenant storage for platform admins and tenantless users', () => {
    localStorage.setItem('tenant-storage', JSON.stringify({ currentTenantId: 'old-tenant' }));

    expect(persistTenantSession({
      isPlatformAdmin: true,
      tenants: [{ id: 'tenant-a' }],
    })).toBe('platform');
    expect(localStorage.getItem('tenant-storage')).toBeNull();

    localStorage.setItem('tenant-storage', JSON.stringify({ currentTenantId: 'old-tenant' }));
    expect(persistTenantSession({
      isPlatformAdmin: false,
      tenants: [],
    })).toBe('none');
    expect(localStorage.getItem('tenant-storage')).toBeNull();
  });

  it('persists the current tenant for regular tenant users', () => {
    expect(persistTenantSession({
      currentTenantId: 'tenant-a',
      isPlatformAdmin: false,
      tenants: [{ id: 'tenant-a', name: 'A' }],
    })).toBe('tenant');

    expect(localStorage.getItem('tenant-storage')).toBe(JSON.stringify({
      currentTenantId: 'tenant-a',
      tenants: [{ id: 'tenant-a', name: 'A' }],
    }));
  });
});

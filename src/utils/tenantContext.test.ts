import {
  getCurrentAuthScopeKey,
  getTenantContextHeaders,
  getTenantContextScopeKey,
  hasActiveImpersonationSession,
  usesTenantContext,
} from './tenantContext';

describe('tenantContext', () => {
  it('detects tenant-aware API routes', () => {
    expect(usesTenantContext('/api/v1/auth/me')).toBe(true);
    expect(usesTenantContext('/api/v1/common/workbench/overview')).toBe(true);
    expect(usesTenantContext('/api/v1/tenant/dashboard/overview')).toBe(true);
    expect(usesTenantContext('/api/v1/platform/users')).toBe(false);
  });

  it('injects tenant header for normal tenant users on auth context APIs', () => {
    localStorage.setItem('tenant-storage', JSON.stringify({
      currentTenantId: 'tenant-a',
      tenants: [{ id: 'tenant-a', name: 'Tenant A' }],
    }));

    expect(
      getTenantContextHeaders('/api/v1/auth/me', false),
    ).toEqual({
      'X-Tenant-ID': 'tenant-a',
    });
  });

  it('injects impersonation headers for platform admins in impersonation sessions', () => {
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

    expect(hasActiveImpersonationSession()).toBe(true);
    expect(
      getTenantContextHeaders('/api/v1/common/search?q=test', true),
    ).toEqual({
      'X-Tenant-ID': 'tenant-b',
      'X-Impersonation': 'true',
      'X-Impersonation-Request-ID': 'req-1',
    });
  });

  it('does not inject tenant context for platform routes', () => {
    localStorage.setItem('tenant-storage', JSON.stringify({ currentTenantId: 'tenant-a' }));

    expect(getTenantContextHeaders('/api/v1/platform/users', false)).toEqual({});
  });

  it('builds auth and tenant scope keys from the current token and session context', () => {
    sessionStorage.setItem('auto_healing_token', `header.${Buffer.from(JSON.stringify({
      sub: 'user-1',
      username: 'alice',
    })).toString('base64url')}.sig`);
    localStorage.setItem('tenant-storage', JSON.stringify({ currentTenantId: 'tenant-a' }));

    expect(getCurrentAuthScopeKey()).toBe('user-1');
    expect(getTenantContextScopeKey()).toBe('user-1:tenant:tenant-a');

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

    expect(getTenantContextScopeKey()).toBe('user-1:impersonation:tenant-b');
  });
});

import access from './access';

describe('access impersonation permissions', () => {
  it('trusts backend-returned permissions during active impersonation sessions', () => {
    localStorage.setItem('impersonation-storage', JSON.stringify({
      isImpersonating: true,
      session: {
        requestId: 'req-1',
        tenantId: 'tenant-a',
        tenantName: 'Tenant A',
        expiresAt: '2099-01-01T00:00:00.000Z',
        startedAt: '2099-01-01T00:00:00.000Z',
      },
    }));

    const result = access({
      currentUser: {
        is_platform_admin: true,
        permissions: ['plugin:list', 'site-message:list'],
      } as API.CurrentUser,
    });

    expect(result.isPlatformAdmin).toBe(false);
    expect(result.canViewPlugins).toBe(true);
    expect(result.canViewSystemCenter).toBe(true);
    expect(result.canManagePlatformTenants).toBe(false);
  });
});

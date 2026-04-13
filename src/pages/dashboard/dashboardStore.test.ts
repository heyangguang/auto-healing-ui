import {
  __TEST_ONLY__,
  clearLegacyCache,
  loadDashboardState,
  saveDashboardState,
} from './dashboardStore';

const setScopedAuthContext = () => {
  sessionStorage.setItem('auto_healing_token', `header.${Buffer.from(JSON.stringify({
    sub: 'user-1',
  })).toString('base64url')}.sig`);
  localStorage.setItem('tenant-storage', JSON.stringify({ currentTenantId: 'tenant-a' }));
};

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

  it('keeps the current v5 workspace cache when clearing legacy entries', () => {
    localStorage.setItem('auto_healing_dashboard_v4:user-1:tenant:tenant-a', '{"legacy":true}');
    localStorage.setItem('auto_healing_dashboard_v5:user-1:tenant:tenant-a', '{"current":true}');

    clearLegacyCache();

    expect(localStorage.getItem('auto_healing_dashboard_v4:user-1:tenant:tenant-a')).toBeNull();
    expect(localStorage.getItem('auto_healing_dashboard_v5:user-1:tenant:tenant-a')).toBe('{"current":true}');
  });

  it('persists and reloads only user workspaces', () => {
    setScopedAuthContext();

    saveDashboardState({
      activeWorkspaceId: 'ws-1',
      workspaces: [
        { id: 'default', name: '运维总览', widgets: [], layouts: [] },
        { id: 'sys-1', name: '系统工作区', widgets: [], layouts: [], isSystem: true },
        { id: 'ws-1', name: '我的工作区', widgets: [], layouts: [] },
      ],
    });

    expect(loadDashboardState()).toEqual({
      activeWorkspaceId: 'ws-1',
      workspaces: [
        { id: 'default', name: '运维总览', widgets: [], layouts: [] },
        { id: 'ws-1', name: '我的工作区', widgets: [], layouts: [] },
      ],
    });
  });

  it('persists an empty local workspace cache when only system workspaces remain', () => {
    setScopedAuthContext();

    saveDashboardState({
      activeWorkspaceId: 'sys-1',
      workspaces: [
        { id: 'sys-1', name: '系统工作区', widgets: [], layouts: [], isSystem: true },
      ],
    });

    expect(loadDashboardState()).toEqual({
      activeWorkspaceId: 'sys-1',
      workspaces: [],
    });
  });
});

import type { DashboardWorkspace } from '../dashboardStore';
import {
  canDuplicateDashboardWorkspace,
  canDeleteDashboardWorkspace,
  canEditDashboardWorkspace,
  getWorkspaceBadges,
  getWorkspaceEditDeniedMessage,
  isEffectivelyReadOnlyDashboardWorkspace,
  isLocalDefaultWorkspace,
} from './dashboardWorkspaceMeta';

const buildWorkspace = (overrides: Partial<DashboardWorkspace> = {}): DashboardWorkspace => ({
  id: 'ws-1',
  name: '工作区',
  widgets: [],
  layouts: [],
  ...overrides,
});

describe('dashboardWorkspaceMeta', () => {
  const fullPermissions = {
    canManageDashboardConfig: true,
    canManageSystemWorkspaces: true,
  };

  it('treats 运维总览 as a protected local default workspace', () => {
    const workspace = buildWorkspace({ id: 'default', name: '运维总览' });

    expect(isLocalDefaultWorkspace(workspace)).toBe(true);
    expect(canEditDashboardWorkspace(workspace, fullPermissions)).toBe(true);
    expect(canDeleteDashboardWorkspace(workspace, 2, fullPermissions)).toBe(false);
    expect(getWorkspaceBadges(workspace)).toEqual([{ color: 'gold', label: '本地默认' }]);
  });

  it('allows workspace managers to edit system workspaces even when backend marks them readonly', () => {
    const workspace = buildWorkspace({
      id: 'sys-1',
      isReadOnly: true,
      isSystem: true,
      name: '系统工作区',
    });

    expect(isEffectivelyReadOnlyDashboardWorkspace(workspace, fullPermissions)).toBe(false);
    expect(canEditDashboardWorkspace(workspace, fullPermissions)).toBe(true);
    expect(canDeleteDashboardWorkspace(workspace, 3, fullPermissions)).toBe(true);
    expect(canDuplicateDashboardWorkspace(workspace, fullPermissions)).toBe(false);
    expect(getWorkspaceBadges(workspace, fullPermissions)).toEqual([
      { color: 'purple', label: '系统' },
    ]);
  });

  it('treats readonly system workspaces as copy-only for non-managers', () => {
    const workspace = buildWorkspace({
      id: 'sys-1',
      isReadOnly: true,
      isSystem: true,
      name: '系统工作区',
    });
    const viewerPermissions = {
      canManageDashboardConfig: true,
      canManageSystemWorkspaces: false,
    };

    expect(isEffectivelyReadOnlyDashboardWorkspace(workspace, viewerPermissions)).toBe(true);
    expect(canEditDashboardWorkspace(workspace, viewerPermissions)).toBe(false);
    expect(canDeleteDashboardWorkspace(workspace, 3, viewerPermissions)).toBe(false);
    expect(canDuplicateDashboardWorkspace(workspace, viewerPermissions)).toBe(true);
    expect(getWorkspaceBadges(workspace, viewerPermissions)).toEqual([
      { color: 'purple', label: '系统' },
      { color: 'default', label: '只读' },
    ]);
    expect(getWorkspaceEditDeniedMessage(workspace, viewerPermissions)).toBe('只读系统工作区仅支持复制副本后编辑');
  });

  it('keeps default system workspaces undeletable but editable for workspace managers', () => {
    const workspace = buildWorkspace({
      id: 'sys-1',
      isDefault: true,
      isSystem: true,
      name: '默认系统工作区',
    });

    expect(canEditDashboardWorkspace(workspace, fullPermissions)).toBe(true);
    expect(canDeleteDashboardWorkspace(workspace, 3, fullPermissions)).toBe(false);
    expect(getWorkspaceBadges(workspace, fullPermissions)).toEqual([
      { color: 'blue', label: '默认' },
      { color: 'purple', label: '系统' },
    ]);
  });
});

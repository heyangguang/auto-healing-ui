import type { DashboardWorkspace } from '../dashboardStore';

type WorkspacePermissionOptions = {
  canManageDashboardConfig: boolean;
  canManageSystemWorkspaces: boolean;
};

type WorkspaceBadge = {
  color: string;
  label: string;
};

export function isEffectivelyReadOnlyDashboardWorkspace(
  workspace: DashboardWorkspace,
  permissions: WorkspacePermissionOptions,
): boolean {
  return Boolean(workspace.isSystem && workspace.isReadOnly && !permissions.canManageSystemWorkspaces);
}

export function isLocalDefaultWorkspace(workspace: DashboardWorkspace): boolean {
  return workspace.id === 'default' && !workspace.isSystem;
}

export function isProtectedDashboardWorkspace(workspace: DashboardWorkspace): boolean {
  return isLocalDefaultWorkspace(workspace) || Boolean(workspace.isDefault);
}

export function canEditDashboardWorkspace(
  workspace: DashboardWorkspace,
  permissions: WorkspacePermissionOptions,
): boolean {
  if (workspace.isSystem) {
    return permissions.canManageSystemWorkspaces;
  }

  return permissions.canManageDashboardConfig;
}

export function canDeleteDashboardWorkspace(
  workspace: DashboardWorkspace,
  workspaceCount: number,
  permissions: WorkspacePermissionOptions,
): boolean {
  if (
    workspaceCount <= 1
    || isProtectedDashboardWorkspace(workspace)
    || isEffectivelyReadOnlyDashboardWorkspace(workspace, permissions)
  ) {
    return false;
  }

  if (workspace.isSystem) {
    return permissions.canManageSystemWorkspaces;
  }

  return permissions.canManageDashboardConfig;
}

export function canDuplicateDashboardWorkspace(
  workspace: DashboardWorkspace,
  permissions: WorkspacePermissionOptions,
): boolean {
  return Boolean(workspace.id) && permissions.canManageDashboardConfig;
}

export function getWorkspaceBadges(
  workspace: DashboardWorkspace,
  permissions: WorkspacePermissionOptions,
): WorkspaceBadge[] {
  if (workspace.isSystem) {
    const badges: WorkspaceBadge[] = [{ color: 'purple', label: '系统' }];
    if (workspace.isDefault) {
      badges.unshift({ color: 'blue', label: '默认' });
    }
    if (isEffectivelyReadOnlyDashboardWorkspace(workspace, permissions)) {
      badges.push({ color: 'default', label: '只读' });
    }
    return badges;
  }

  if (isLocalDefaultWorkspace(workspace)) {
    return [{ color: 'gold', label: '默认' }];
  }

  return [{ color: 'default', label: '本地' }];
}

export function getWorkspaceEditDeniedMessage(
  workspace: DashboardWorkspace,
  permissions: WorkspacePermissionOptions,
): string {
  if (isEffectivelyReadOnlyDashboardWorkspace(workspace, permissions)) {
    return '只读系统工作区仅支持复制副本后编辑';
  }

  if (workspace.isSystem && !permissions.canManageSystemWorkspaces) {
    return '你没有权限编辑系统工作区';
  }

  return '你没有权限编辑本地工作区';
}

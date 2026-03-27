import type { DashboardState, DashboardWorkspace } from '../dashboardStore';
import type { SystemWorkspacePayload } from './dashboardWorkspaceTypes';

function toSystemWorkspace(workspace: SystemWorkspacePayload): DashboardWorkspace {
  return {
    id: `sys-${workspace.id}`,
    name: workspace.name,
    widgets: workspace.config?.widgets || [],
    layouts: workspace.config?.layouts || [],
    isDefault: workspace.is_default,
    isSystem: true,
    isReadOnly: Boolean(workspace.is_readonly),
  };
}

function resolveActiveWorkspaceId(
  workspaces: DashboardWorkspace[],
  previousActiveWorkspaceId: string,
  preferredActiveWorkspaceId?: string,
): string {
  if (preferredActiveWorkspaceId) {
    const preferredId = `sys-${preferredActiveWorkspaceId}`;
    if (workspaces.some((workspace) => workspace.id === preferredId)) {
      return preferredId;
    }
  }

  if (workspaces.some((workspace) => workspace.id === previousActiveWorkspaceId)) {
    return previousActiveWorkspaceId;
  }

  return workspaces[0]?.id || previousActiveWorkspaceId;
}

export function mergeSystemWorkspaces(
  previousState: DashboardState,
  systemWorkspaces: SystemWorkspacePayload[],
  preferredActiveWorkspaceId?: string,
): DashboardState {
  const nonSystemWorkspaces = previousState.workspaces.filter((workspace) => !workspace.isSystem);
  if (systemWorkspaces.length === 0) {
    return {
      ...previousState,
      workspaces: nonSystemWorkspaces,
      activeWorkspaceId: resolveActiveWorkspaceId(
        nonSystemWorkspaces,
        previousState.activeWorkspaceId,
      ),
    };
  }

  const userWorkspaces = nonSystemWorkspaces.filter((workspace) => workspace.id !== 'default');
  const mergedWorkspaces = [...systemWorkspaces.map(toSystemWorkspace), ...userWorkspaces];

  return {
    ...previousState,
    workspaces: mergedWorkspaces,
    activeWorkspaceId: resolveActiveWorkspaceId(
      mergedWorkspaces,
      previousState.activeWorkspaceId === 'default'
        ? mergedWorkspaces[0]?.id || previousState.activeWorkspaceId
        : previousState.activeWorkspaceId,
      preferredActiveWorkspaceId,
    ),
  };
}

export function buildStateAfterSavingSystemWorkspace(
  previousState: DashboardState,
  removedWorkspaceId: string,
  systemWorkspaces: SystemWorkspacePayload[],
  preferredActiveWorkspaceId?: string,
): { nextState: DashboardState; synced: boolean } {
  if (
    preferredActiveWorkspaceId
    && !systemWorkspaces.some((workspace) => workspace.id === preferredActiveWorkspaceId)
  ) {
    return {
      nextState: previousState,
      synced: false,
    };
  }

  return {
    nextState: mergeSystemWorkspaces(
      {
        ...previousState,
        workspaces: previousState.workspaces.filter((workspace) => workspace.id !== removedWorkspaceId),
      },
      systemWorkspaces,
      preferredActiveWorkspaceId,
    ),
    synced: true,
  };
}

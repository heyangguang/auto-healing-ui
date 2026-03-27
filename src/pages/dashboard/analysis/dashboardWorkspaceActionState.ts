import {
  generateInstanceId,
  generateWorkspaceId,
  type DashboardState,
  type DashboardWorkspace,
  type LayoutItem,
} from '../dashboardStore';
import type { WidgetDefinition } from '../widgets/widgetRegistry';

export function createDashboardWorkspace(index: number): DashboardWorkspace {
  return {
    id: generateWorkspaceId(),
    name: `工作区 ${index + 1}`,
    widgets: [],
    layouts: [],
  };
}

export function duplicateDashboardWorkspace(workspace: DashboardWorkspace): DashboardWorkspace {
  const id = generateWorkspaceId();
  const widgets = workspace.widgets.map((widget) => ({
    ...widget,
    instanceId: generateInstanceId(),
  }));
  const idMap = new Map<string, string>();

  workspace.widgets.forEach((widget, index) => {
    idMap.set(widget.instanceId, widgets[index].instanceId);
  });

  return {
    id,
    name: `${workspace.name} (副本)`,
    widgets,
    layouts: workspace.layouts.map((layout) => ({ ...layout, i: idMap.get(layout.i) || layout.i })),
  };
}

export function updateDashboardWorkspaceLayouts(
  state: DashboardState,
  workspaceId: string,
  layouts: readonly LayoutItem[],
) {
  return {
    ...state,
    workspaces: state.workspaces.map((workspace) => (
      workspace.id === workspaceId
        ? { ...workspace, layouts: [...layouts] }
        : workspace
    )),
  };
}

export function addWidgetToDashboardWorkspace(
  state: DashboardState,
  workspaceId: string,
  widgetId: string,
  definition: WidgetDefinition,
) {
  const instanceId = generateInstanceId();
  return {
    instanceId,
    nextState: {
      ...state,
      workspaces: state.workspaces.map((workspace) => (
        workspace.id === workspaceId
          ? {
            ...workspace,
            widgets: [...workspace.widgets, { instanceId, widgetId }],
            layouts: [...workspace.layouts, {
              i: instanceId,
              x: 0,
              y: Infinity,
              w: definition.defaultLayout.w,
              h: definition.defaultLayout.h,
              minW: definition.defaultLayout.minW,
              minH: definition.defaultLayout.minH,
            }],
          }
          : workspace
      )),
    },
  };
}

export function removeWidgetFromDashboardWorkspace(
  state: DashboardState,
  workspaceId: string,
  instanceId: string,
  widgetId?: string,
) {
  return {
    ...state,
    workspaces: state.workspaces.map((workspace) => (
      workspace.id === workspaceId
        ? {
          ...workspace,
          widgets: widgetId
            ? workspace.widgets.filter((widget) => widget.widgetId !== widgetId)
            : workspace.widgets.filter((widget) => widget.instanceId !== instanceId),
          layouts: workspace.layouts.filter((layout) => layout.i !== instanceId),
        }
        : workspace
    )),
  };
}

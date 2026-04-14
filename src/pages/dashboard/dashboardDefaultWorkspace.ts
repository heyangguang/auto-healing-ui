import type {
  DashboardState,
  DashboardWorkspace,
  LayoutItem,
  WidgetInstance,
} from './dashboardStore';

type WorkspaceSeed = Pick<DashboardWorkspace, 'widgets' | 'layouts'>;

const LEGACY_OVERVIEW_SEED: WorkspaceSeed = {
  widgets: [
    { instanceId: 'w-1', widgetId: 'stat-incident-total' },
    { instanceId: 'w-2', widgetId: 'stat-healing-rate' },
    { instanceId: 'w-3', widgetId: 'stat-pending-items' },
    { instanceId: 'w-4', widgetId: 'stat-exec-success' },
    { instanceId: 'w-5', widgetId: 'chart-incident-status' },
    { instanceId: 'w-6', widgetId: 'chart-instance-status' },
    { instanceId: 'w-7', widgetId: 'list-recent-instances' },
    { instanceId: 'w-8', widgetId: 'list-pending-approvals' },
  ],
  layouts: [
    { i: 'w-1', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'w-2', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'w-3', x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'w-4', x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'w-5', x: 0, y: 2, w: 6, h: 3, minW: 4, minH: 3 },
    { i: 'w-6', x: 6, y: 2, w: 6, h: 3, minW: 4, minH: 3 },
    { i: 'w-7', x: 0, y: 5, w: 6, h: 5, minW: 4, minH: 3 },
    { i: 'w-8', x: 6, y: 5, w: 6, h: 5, minW: 4, minH: 3 },
  ],
};

const DEFAULT_OVERVIEW_SEED: WorkspaceSeed = {
  widgets: [
    { instanceId: 'w-1', widgetId: 'stat-incident-total' },
    { instanceId: 'w-2', widgetId: 'stat-healing-rate' },
    { instanceId: 'w-3', widgetId: 'stat-pending-items' },
    { instanceId: 'w-4', widgetId: 'stat-exec-success' },
    { instanceId: 'w-5', widgetId: 'chart-incident-trend-7d' },
    { instanceId: 'w-6', widgetId: 'chart-instance-status' },
    { instanceId: 'w-7', widgetId: 'list-recent-instances' },
    { instanceId: 'w-8', widgetId: 'list-recent-runs' },
  ],
  layouts: [
    { i: 'w-1', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'w-2', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'w-3', x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'w-4', x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'w-5', x: 0, y: 2, w: 8, h: 5, minW: 5, minH: 4 },
    { i: 'w-6', x: 8, y: 2, w: 4, h: 5, minW: 4, minH: 4 },
    { i: 'w-7', x: 0, y: 7, w: 7, h: 5, minW: 4, minH: 4 },
    { i: 'w-8', x: 7, y: 7, w: 5, h: 5, minW: 4, minH: 4 },
  ],
};

function cloneWidgets(widgets: readonly WidgetInstance[]): WidgetInstance[] {
  return widgets.map((widget) => ({ ...widget }));
}

function cloneLayouts(layouts: readonly LayoutItem[]): LayoutItem[] {
  return layouts.map((layout) => ({ ...layout }));
}

function hasExpectedWidgetSet(workspace: DashboardWorkspace, expected: readonly WidgetInstance[]): boolean {
  if (workspace.widgets.length !== expected.length) {
    return false;
  }
  const actualWidgetIds = workspace.widgets.map((widget) => widget.widgetId).sort();
  const expectedWidgetIds = expected.map((widget) => widget.widgetId).sort();
  return actualWidgetIds.every((widgetId, index) => widgetId === expectedWidgetIds[index]);
}

function isProtectedDefaultOverview(workspace: DashboardWorkspace): boolean {
  return workspace.id === 'default' || Boolean(workspace.isDefault);
}

function shouldUpgradeOverviewWorkspace(workspace: DashboardWorkspace): boolean {
  if (!isProtectedDefaultOverview(workspace)) {
    return false;
  }
  if (hasExpectedWidgetSet(workspace, DEFAULT_OVERVIEW_SEED.widgets)) {
    return false;
  }
  return hasExpectedWidgetSet(workspace, LEGACY_OVERVIEW_SEED.widgets);
}

export function createDefaultOverviewWorkspace(
  overrides: Partial<DashboardWorkspace> = {},
): DashboardWorkspace {
  return {
    id: 'default',
    name: '运维总览',
    ...overrides,
    widgets: cloneWidgets(DEFAULT_OVERVIEW_SEED.widgets),
    layouts: cloneLayouts(DEFAULT_OVERVIEW_SEED.layouts),
  };
}

export function upgradeDashboardOverviewWorkspace(
  workspace: DashboardWorkspace,
): DashboardWorkspace {
  if (!shouldUpgradeOverviewWorkspace(workspace)) {
    return workspace;
  }
  return {
    ...workspace,
    widgets: cloneWidgets(DEFAULT_OVERVIEW_SEED.widgets),
    layouts: cloneLayouts(DEFAULT_OVERVIEW_SEED.layouts),
  };
}

export function upgradeDashboardOverviewState(state: DashboardState): DashboardState {
  let changed = false;
  const workspaces = state.workspaces.map((workspace) => {
    const nextWorkspace = upgradeDashboardOverviewWorkspace(workspace);
    if (nextWorkspace !== workspace) {
      changed = true;
    }
    return nextWorkspace;
  });
  if (!changed) {
    return state;
  }
  return { ...state, workspaces };
}

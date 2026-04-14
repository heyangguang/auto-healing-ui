import { verticalCompactor } from 'react-grid-layout';
import type { SystemWorkspacePayload as DashboardApiSystemWorkspacePayload } from '@/services/auto-healing/dashboard';
import type { DashboardWorkspace, LayoutItem } from '../dashboardStore';

const DASHBOARD_LAYOUT_COLUMNS = 12;

type SystemWorkspacePayloadOverrides = {
  description?: string;
  name?: string;
};

function toPersistedLayout(layout: LayoutItem): LayoutItem {
  return {
    i: layout.i,
    x: layout.x,
    y: layout.y,
    w: layout.w,
    h: layout.h,
    ...(layout.minW !== undefined ? { minW: layout.minW } : {}),
    ...(layout.minH !== undefined ? { minH: layout.minH } : {}),
    ...(layout.maxW !== undefined ? { maxW: layout.maxW } : {}),
    ...(layout.maxH !== undefined ? { maxH: layout.maxH } : {}),
    ...(layout.static ? { static: true } : {}),
  };
}

export function normalizeSystemWorkspaceLayouts(layouts: readonly LayoutItem[]): LayoutItem[] {
  if (layouts.length === 0) {
    return [];
  }

  const compactedLayouts = verticalCompactor.compact(
    layouts.map((layout) => ({ ...layout })),
    DASHBOARD_LAYOUT_COLUMNS,
  );

  return compactedLayouts.map(toPersistedLayout);
}

export function buildSystemWorkspacePayload(
  workspace: DashboardWorkspace,
  overrides: SystemWorkspacePayloadOverrides = {},
): DashboardApiSystemWorkspacePayload {
  const description = overrides.description ?? workspace.description;

  return {
    name: overrides.name ?? workspace.name,
    config: {
      widgets: workspace.widgets.map((widget) => ({ ...widget })),
      layouts: normalizeSystemWorkspaceLayouts(workspace.layouts),
    },
    ...(description !== undefined ? { description } : {}),
  };
}

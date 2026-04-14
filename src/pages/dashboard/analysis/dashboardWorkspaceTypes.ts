import type {
  DashboardState,
  DashboardWorkspace,
  LayoutItem,
  WidgetInstance,
} from '../dashboardStore';

export type DashboardRenameState = {
  id: string;
  name: string;
  open: boolean;
};

export type SystemWorkspacePayload = {
  config?: {
    layouts?: LayoutItem[];
    widgets?: WidgetInstance[];
  };
  description?: string;
  id: string;
  is_default?: boolean;
  is_readonly?: boolean;
  name: string;
};

export type DashboardConfigPayload = {
  data?: {
    system_workspaces?: SystemWorkspacePayload[];
  };
  system_workspaces?: SystemWorkspacePayload[];
};

export type SaveDashboardStateFn = (nextState: DashboardState, changedWorkspaceId?: string) => void;
export type SaveSystemWorkspaceFn = (workspace: DashboardWorkspace) => void;

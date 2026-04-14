import { act, renderHook, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { getDashboardConfig, updateSystemWorkspace } from '@/services/auto-healing/dashboard';
import {
  clearLegacyCache,
  loadDashboardState,
  saveDashboardState,
} from '../dashboardStore';
import { useDashboardWorkspaceManager } from './useDashboardWorkspaceManager';

jest.mock('antd', () => ({
  message: {
    error: jest.fn(),
    info: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
  },
}));

jest.mock('@/services/auto-healing/dashboard', () => ({
  getDashboardConfig: jest.fn(),
  updateSystemWorkspace: jest.fn(),
}));

jest.mock('../dashboardStore', () => {
  const actual = jest.requireActual('../dashboardStore');
  return {
    ...actual,
    clearLegacyCache: jest.fn(),
    loadDashboardState: jest.fn(),
    saveDashboardState: jest.fn(),
  };
});

jest.mock('./useDashboardWorkspaceActions', () => ({
  useDashboardWorkspaceActions: jest.fn((options) => ({
    handleAddWorkspace: jest.fn(),
    handleAutoLayout: jest.fn(),
    handleDeleteWorkspace: jest.fn(),
    handleDuplicateWorkspace: jest.fn(),
    handleLayoutChange: jest.fn(),
    handleRemoveWidget: jest.fn(),
    handleRename: jest.fn(),
    handleSaveAsSystem: jest.fn(),
    handleTabChange: jest.fn(),
    handleToggleEdit: jest.fn(),
    handleToggleWidget: () => {
      options.saveState({
        ...options.state,
        workspaces: options.state.workspaces.map((workspace: any) => (
          workspace.id === options.activeWorkspace.id
            ? {
              ...workspace,
              widgets: [...workspace.widgets, { instanceId: 'w-2', widgetId: 'stat-incident-today' }],
              layouts: [...workspace.layouts, { i: 'w-2', x: 0, y: Infinity, w: 3, h: 2, minW: 2, minH: 2 }],
            }
            : workspace
        )),
      }, options.activeWorkspace.id);
    },
  })),
}));

describe('useDashboardWorkspaceManager autosave', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (clearLegacyCache as jest.Mock).mockImplementation(() => {});
    (saveDashboardState as jest.Mock).mockImplementation(() => {});
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('sends finite layout coordinates after adding a widget to a system workspace', async () => {
    (loadDashboardState as jest.Mock).mockReturnValue({
      workspaces: [{
        id: 'sys-1',
        isSystem: true,
        layouts: [{ i: 'w-1', x: 0, y: 0, w: 3, h: 2 }],
        name: '系统工作区',
        widgets: [{ instanceId: 'w-1', widgetId: 'stat-incident-total' }],
      }],
      activeWorkspaceId: 'sys-1',
    });
    (getDashboardConfig as jest.Mock).mockResolvedValue({
      data: {
        system_workspaces: [{
          id: '1',
          is_default: false,
          is_readonly: false,
          name: '系统工作区',
          config: {
            widgets: [{ instanceId: 'w-1', widgetId: 'stat-incident-total' }],
            layouts: [{ i: 'w-1', x: 0, y: 0, w: 3, h: 2 }],
          },
        }],
      },
    });
    (updateSystemWorkspace as jest.Mock).mockResolvedValue({ data: { id: '1' } });

    const { result } = renderHook(() => useDashboardWorkspaceManager({
      autoArrangeLayouts: jest.fn(),
      canManageDashboardConfig: true,
      canManageSystemWorkspaces: true,
      generateResponsiveLayouts: (layouts) => ({ lg: [...layouts] }),
      layoutsAreEqual: () => false,
    }));

    await waitFor(() => {
      expect(result.current.activeWorkspace.id).toBe('sys-1');
    });

    act(() => {
      result.current.handleToggleWidget('stat-incident-today');
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(updateSystemWorkspace).toHaveBeenCalledWith('1', {
        name: '系统工作区',
        config: {
          widgets: [
            { instanceId: 'w-1', widgetId: 'stat-incident-total' },
            { instanceId: 'w-2', widgetId: 'stat-incident-today' },
          ],
          layouts: [
            { i: 'w-1', x: 0, y: 0, w: 3, h: 2 },
            { i: 'w-2', x: 0, y: 2, w: 3, h: 2, minW: 2, minH: 2 },
          ],
        },
      });
    });
    expect(message.error).not.toHaveBeenCalled();
  });
});

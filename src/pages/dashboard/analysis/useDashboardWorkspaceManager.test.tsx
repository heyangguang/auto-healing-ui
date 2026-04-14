import { act, renderHook, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { getDashboardConfig, updateSystemWorkspace } from '@/services/auto-healing/dashboard';
import {
  clearLegacyCache,
  getDefaultWorkspace,
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
    handleLayoutChange: (layout: any, allLayouts: { lg?: any[] }) => {
      const nextLayouts = allLayouts?.lg || layout;
      options.saveState({
        ...options.state,
        workspaces: options.state.workspaces.map((workspace: any) => (
          workspace.id === options.activeWorkspace.id
            ? { ...workspace, layouts: [...nextLayouts] }
            : workspace
        )),
      }, options.activeWorkspace.id);
    },
    handleRemoveWidget: jest.fn(),
    handleRename: jest.fn(),
    handleSaveAsSystem: jest.fn(),
    handleTabChange: jest.fn(),
    handleToggleEdit: jest.fn(),
    handleToggleWidget: jest.fn(),
  })),
}));

const ORIGINAL_LAYOUT = { i: 'w-1', x: 0, y: 0, w: 3, h: 2 };
const CHANGED_LAYOUT = { i: 'w-1', x: 1, y: 0, w: 3, h: 2 };
const ORIGINAL_WIDGET = { instanceId: 'w-1', widgetId: 'stat-incident-total' };

const buildRemoteConfig = (overrides: Partial<{ is_default: boolean; is_readonly: boolean }> = {}) => ({
  data: {
    system_workspaces: [{
      id: '1',
      is_default: true,
      is_readonly: true,
      name: '系统工作区',
      config: {
        widgets: [ORIGINAL_WIDGET],
        layouts: [ORIGINAL_LAYOUT],
      },
      ...overrides,
    }],
  },
});

describe('useDashboardWorkspaceManager', () => {
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

  it('restores the remote system workspace when autosave fails', async () => {
    (loadDashboardState as jest.Mock).mockReturnValue({
      workspaces: [{
        id: 'sys-1',
        isDefault: true,
        isSystem: true,
        layouts: [ORIGINAL_LAYOUT],
        name: '系统工作区',
        widgets: [ORIGINAL_WIDGET],
      }],
      activeWorkspaceId: 'sys-1',
    });
    (getDashboardConfig as jest.Mock)
      .mockResolvedValueOnce(buildRemoteConfig())
      .mockResolvedValueOnce(buildRemoteConfig());
    (updateSystemWorkspace as jest.Mock).mockRejectedValue(new Error('save failed'));

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
      result.current.handleLayoutChange([CHANGED_LAYOUT], { lg: [CHANGED_LAYOUT] });
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(updateSystemWorkspace).toHaveBeenCalledWith('1', {
        name: '系统工作区',
        config: {
          widgets: [ORIGINAL_WIDGET],
          layouts: [CHANGED_LAYOUT],
        },
      });
    });
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('save failed，已恢复到服务端版本');
      expect(result.current.activeWorkspace.layouts).toEqual([ORIGINAL_LAYOUT]);
    });
    expect(getDashboardConfig).toHaveBeenCalledTimes(2);
  });

  it('locks editing when the active system workspace is not manageable', async () => {
    (loadDashboardState as jest.Mock).mockReturnValue({
      workspaces: [{
        id: 'sys-1',
        isSystem: true,
        layouts: [ORIGINAL_LAYOUT],
        name: '系统工作区',
        widgets: [ORIGINAL_WIDGET],
      }],
      activeWorkspaceId: 'sys-1',
    });
    (getDashboardConfig as jest.Mock).mockResolvedValue(buildRemoteConfig({ is_readonly: false }));

    const { result } = renderHook(() => useDashboardWorkspaceManager({
      autoArrangeLayouts: jest.fn(),
      canManageDashboardConfig: false,
      canManageSystemWorkspaces: false,
      generateResponsiveLayouts: (layouts) => ({ lg: [...layouts] }),
      layoutsAreEqual: () => false,
    }));

    await waitFor(() => {
      expect(result.current.activeWorkspace.id).toBe('sys-1');
    });

    act(() => {
      result.current.setIsEditing(true);
    });

    await waitFor(() => {
      expect(result.current.isEditing).toBe(false);
      expect(message.warning).toHaveBeenCalledWith('你没有权限编辑系统工作区');
    });
  });

  it('does not lock editing for readonly system workspaces when workspace-manage permission exists', async () => {
    (loadDashboardState as jest.Mock).mockReturnValue({
      workspaces: [{
        id: 'sys-1',
        isReadOnly: true,
        isSystem: true,
        layouts: [ORIGINAL_LAYOUT],
        name: '系统工作区',
        widgets: [ORIGINAL_WIDGET],
      }],
      activeWorkspaceId: 'sys-1',
    });
    (getDashboardConfig as jest.Mock).mockResolvedValue(buildRemoteConfig());

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
      result.current.setIsEditing(true);
    });

    await waitFor(() => {
      expect(result.current.isEditing).toBe(true);
    });
    expect(message.warning).not.toHaveBeenCalledWith('只读系统工作区仅支持复制副本后编辑');
  });

  it('upgrades an in-memory legacy default workspace on mount', async () => {
    (loadDashboardState as jest.Mock).mockReturnValue({
      workspaces: [{
        id: 'default',
        layouts: [
          { i: 'w-1', x: 0, y: 0, w: 3, h: 2 },
          { i: 'w-2', x: 3, y: 0, w: 3, h: 2 },
          { i: 'w-3', x: 6, y: 0, w: 3, h: 2 },
          { i: 'w-4', x: 9, y: 0, w: 3, h: 2 },
          { i: 'w-5', x: 0, y: 2, w: 4, h: 5 },
          { i: 'w-6', x: 4, y: 2, w: 4, h: 5 },
          { i: 'w-7', x: 0, y: 7, w: 8, h: 5 },
          { i: 'w-8', x: 8, y: 2, w: 4, h: 10 },
        ],
        name: '运维总览',
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
      }],
      activeWorkspaceId: 'default',
    });
    (getDashboardConfig as jest.Mock).mockResolvedValue({ data: { system_workspaces: [] } });

    const { result } = renderHook(() => useDashboardWorkspaceManager({
      autoArrangeLayouts: jest.fn(),
      canManageDashboardConfig: true,
      canManageSystemWorkspaces: true,
      generateResponsiveLayouts: (layouts) => ({ lg: [...layouts] }),
      layoutsAreEqual: () => false,
    }));

    await waitFor(() => {
      expect(result.current.activeWorkspace.widgets).toEqual(getDefaultWorkspace().widgets);
      expect(result.current.activeWorkspace.layouts).toEqual(getDefaultWorkspace().layouts);
    });
    expect(saveDashboardState).toHaveBeenCalledWith({
      activeWorkspaceId: 'default',
      workspaces: [getDefaultWorkspace()],
    });
  });

  it('does not autosave to backend when editing a local default workspace while system workspaces exist', async () => {
    (loadDashboardState as jest.Mock).mockReturnValue({
      workspaces: [
        {
          id: 'sys-1',
          isSystem: true,
          layouts: [ORIGINAL_LAYOUT],
          name: '系统工作区',
          widgets: [ORIGINAL_WIDGET],
        },
        {
          ...getDefaultWorkspace(),
          id: 'default',
          name: '运维总览',
        },
      ],
      activeWorkspaceId: 'default',
    });
    (getDashboardConfig as jest.Mock).mockResolvedValue(buildRemoteConfig({ is_readonly: false }));

    const { result } = renderHook(() => useDashboardWorkspaceManager({
      autoArrangeLayouts: jest.fn(),
      canManageDashboardConfig: true,
      canManageSystemWorkspaces: true,
      generateResponsiveLayouts: (layouts) => ({ lg: [...layouts] }),
      layoutsAreEqual: () => false,
    }));

    await waitFor(() => {
      expect(result.current.activeWorkspace.id).toBe('default');
    });

    act(() => {
      result.current.handleLayoutChange([CHANGED_LAYOUT], { lg: [CHANGED_LAYOUT] });
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(updateSystemWorkspace).not.toHaveBeenCalled();
  });
});

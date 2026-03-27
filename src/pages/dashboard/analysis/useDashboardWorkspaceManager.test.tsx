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
    handleLayoutChange: (layout: any, allLayouts: { lg?: any[] }) => {
      const nextLayouts = allLayouts?.lg || layout;
      options.saveState({
        ...options.state,
        workspaces: options.state.workspaces.map((workspace: any) => (
          workspace.id === options.activeWorkspace.id
            ? { ...workspace, layouts: [...nextLayouts] }
            : workspace
        )),
      });
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

const buildRemoteConfig = () => ({
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
        config: {
          widgets: [ORIGINAL_WIDGET],
          layouts: [CHANGED_LAYOUT],
        },
      });
    });
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('系统工作区保存失败，已恢复到服务端版本');
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
    (getDashboardConfig as jest.Mock).mockResolvedValue(buildRemoteConfig());

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
});

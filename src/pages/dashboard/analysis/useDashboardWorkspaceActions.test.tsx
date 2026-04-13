import { act, renderHook } from '@testing-library/react';
import { message } from 'antd';
import { createSystemWorkspace, deleteSystemWorkspace } from '@/services/auto-healing/dashboard';
import { useDashboardWorkspaceActions } from './useDashboardWorkspaceActions';

jest.mock('../widgets/widgetRegistry', () => ({
  WIDGET_REGISTRY: {},
}));

jest.mock('antd', () => ({
  message: {
    error: jest.fn(),
    info: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
  },
}));

jest.mock('@/services/auto-healing/dashboard', () => ({
  createSystemWorkspace: jest.fn(),
  deleteSystemWorkspace: jest.fn(),
  getDashboardConfig: jest.fn(),
}));

describe('useDashboardWorkspaceActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks converting a local workspace to system scope without workspace-manage permission', async () => {
    const { result } = renderHook(() => useDashboardWorkspaceActions({
      activeWorkspace: {
        id: 'ws-1',
        name: '我的工作区',
        widgets: [{ instanceId: 'w-1', widgetId: 'stat-1' }],
        layouts: [{ i: 'w-1', x: 0, y: 0, w: 2, h: 2 }],
      },
      autoArrangeLayouts: jest.fn(),
      canManageDashboardConfig: true,
      canManageSystemWorkspaces: false,
      layoutsAreEqual: jest.fn(),
      notifyWorkspaceMutation: jest.fn(),
      renameModal: { id: '', name: '', open: false },
      saveState: jest.fn(),
      saveSystemWorkspaceToBackend: jest.fn(),
      setIsEditing: jest.fn(),
      setRenameModal: jest.fn(),
      setSaveSystemModalOpen: jest.fn(),
      setState: jest.fn(),
      setSystemWsDesc: jest.fn(),
      setSystemWsName: jest.fn(),
      state: {
        activeWorkspaceId: 'ws-1',
        workspaces: [{
          id: 'ws-1',
          name: '我的工作区',
          widgets: [{ instanceId: 'w-1', widgetId: 'stat-1' }],
          layouts: [{ i: 'w-1', x: 0, y: 0, w: 2, h: 2 }],
        }],
      },
      systemWsDesc: '',
      systemWsName: '系统版工作区',
    }));

    await act(async () => {
      await result.current.handleSaveAsSystem();
    });

    expect(message.warning).toHaveBeenCalledWith('你没有权限创建系统工作区');
    expect(createSystemWorkspace).not.toHaveBeenCalled();
  });

  it('surfaces backend errors when deleting a system workspace fails', async () => {
    (deleteSystemWorkspace as jest.Mock).mockRejectedValue({
      response: {
        data: {
          message: '默认系统工作区不能删除',
        },
      },
    });

    const { result } = renderHook(() => useDashboardWorkspaceActions({
      activeWorkspace: {
        id: 'sys-1',
        isSystem: true,
        name: '系统工作区',
        widgets: [{ instanceId: 'w-1', widgetId: 'stat-1' }],
        layouts: [{ i: 'w-1', x: 0, y: 0, w: 2, h: 2 }],
      },
      autoArrangeLayouts: jest.fn(),
      canManageDashboardConfig: true,
      canManageSystemWorkspaces: true,
      layoutsAreEqual: jest.fn(),
      notifyWorkspaceMutation: jest.fn(),
      renameModal: { id: '', name: '', open: false },
      saveState: jest.fn(),
      saveSystemWorkspaceToBackend: jest.fn(),
      setIsEditing: jest.fn(),
      setRenameModal: jest.fn(),
      setSaveSystemModalOpen: jest.fn(),
      setState: jest.fn(),
      setSystemWsDesc: jest.fn(),
      setSystemWsName: jest.fn(),
      state: {
        activeWorkspaceId: 'sys-1',
        workspaces: [
          { id: 'ws-1', name: '本地工作区', widgets: [], layouts: [] },
          {
            id: 'sys-1',
            isSystem: true,
            name: '系统工作区',
            widgets: [{ instanceId: 'w-1', widgetId: 'stat-1' }],
            layouts: [{ i: 'w-1', x: 0, y: 0, w: 2, h: 2 }],
          },
        ],
      },
      systemWsDesc: '',
      systemWsName: '',
    }));

    await act(async () => {
      await result.current.handleDeleteWorkspace('sys-1');
    });

    expect(message.error).toHaveBeenCalledWith('默认系统工作区不能删除');
  });
});

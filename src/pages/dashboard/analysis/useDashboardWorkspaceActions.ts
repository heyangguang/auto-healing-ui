import { message } from 'antd';
import { useCallback } from 'react';
import { extractErrorMsg } from '@/utils/errorMsg';
import {
  saveDashboardState,
  type DashboardState,
  type DashboardWorkspace,
  type LayoutItem,
  type WidgetInstance,
} from '../dashboardStore';
import { WIDGET_REGISTRY } from '../widgets/widgetRegistry';
import { createSystemWorkspace, deleteSystemWorkspace, getDashboardConfig } from '@/services/auto-healing/dashboard';
import type { DashboardConfigPayload, DashboardRenameState, SaveDashboardStateFn, SaveSystemWorkspaceFn } from './dashboardWorkspaceTypes';
import { buildStateAfterSavingSystemWorkspace } from './dashboardWorkspaceState';
import {
  addWidgetToDashboardWorkspace,
  createDashboardWorkspace,
  duplicateDashboardWorkspace,
  removeWidgetFromDashboardWorkspace,
  updateDashboardWorkspaceLayouts,
} from './dashboardWorkspaceActionState';
import {
  canDeleteDashboardWorkspace,
  canEditDashboardWorkspace,
  getWorkspaceEditDeniedMessage,
  isLocalDefaultWorkspace,
} from './dashboardWorkspaceMeta';
type UseDashboardWorkspaceActionsOptions = {
  activeWorkspace: DashboardWorkspace;
  autoArrangeLayouts: (widgets: WidgetInstance[], currentLayouts: LayoutItem[]) => LayoutItem[];
  canManageDashboardConfig: boolean;
  canManageSystemWorkspaces: boolean;
  layoutsAreEqual: (left: readonly LayoutItem[], right: readonly LayoutItem[]) => boolean;
  notifyWorkspaceMutation: (label: string, isSystem?: boolean) => void;
  renameModal: DashboardRenameState;
  saveState: SaveDashboardStateFn;
  saveSystemWorkspaceToBackend: SaveSystemWorkspaceFn;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  setRenameModal: React.Dispatch<React.SetStateAction<DashboardRenameState>>;
  setSaveSystemModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setState: React.Dispatch<React.SetStateAction<DashboardState>>;
  setSystemWsDesc: React.Dispatch<React.SetStateAction<string>>;
  setSystemWsName: React.Dispatch<React.SetStateAction<string>>;
  state: DashboardState;
  systemWsDesc: string;
  systemWsName: string;
};
export const useDashboardWorkspaceActions = ({
  activeWorkspace,
  autoArrangeLayouts,
  canManageDashboardConfig,
  canManageSystemWorkspaces,
  layoutsAreEqual,
  notifyWorkspaceMutation,
  renameModal,
  saveState,
  setIsEditing,
  setRenameModal,
  setSaveSystemModalOpen,
  setState,
  setSystemWsDesc,
  setSystemWsName,
  state,
  systemWsDesc,
  systemWsName,
}: UseDashboardWorkspaceActionsOptions) => {
  const handleTabChange = useCallback((id: string) => {
    setState((previousState) => {
      const nextState = { ...previousState, activeWorkspaceId: id };
      saveDashboardState(nextState);
      return nextState;
    });
  }, [setState]);

  const handleAddWorkspace = useCallback(() => {
    if (!canManageDashboardConfig) {
      message.warning('你没有权限创建工作区');
      return;
    }
    const nextWorkspace = createDashboardWorkspace(state.workspaces.length);
    saveState({
      ...state,
      workspaces: [...state.workspaces, nextWorkspace],
      activeWorkspaceId: nextWorkspace.id,
    });
    setIsEditing(true);
    notifyWorkspaceMutation('已创建新工作区');
  }, [canManageDashboardConfig, notifyWorkspaceMutation, saveState, setIsEditing, state]);

  const handleDuplicateWorkspace = useCallback((workspace: DashboardWorkspace) => {
    if (!canManageDashboardConfig) {
      message.warning('你没有权限创建工作区');
      return;
    }
    const duplicatedWorkspace = duplicateDashboardWorkspace(workspace);
    saveState({
      ...state,
      workspaces: [...state.workspaces, duplicatedWorkspace],
      activeWorkspaceId: duplicatedWorkspace.id,
    });
    notifyWorkspaceMutation('已复制工作区');
  }, [canManageDashboardConfig, notifyWorkspaceMutation, saveState, state]);

  const handleSaveAsSystem = useCallback(async () => {
    if (!canManageSystemWorkspaces) {
      message.warning('你没有权限创建系统工作区');
      return;
    }
    if (!activeWorkspace.id || activeWorkspace.isSystem) {
      return;
    }
    if (!systemWsName.trim()) {
      message.warning('请输入工作区名称');
      return;
    }
    try {
      const response = await createSystemWorkspace({
        name: systemWsName.trim(),
        description: systemWsDesc.trim(),
        config: {
          widgets: activeWorkspace.widgets,
          layouts: activeWorkspace.layouts,
        },
      });
      setSaveSystemModalOpen(false);
      setSystemWsName('');
      setSystemWsDesc('');

      const newWorkspaceId = response?.data?.id || response?.id;
      try {
        const configResponse = await getDashboardConfig() as DashboardConfigPayload;
        const configData = configResponse?.data || configResponse;
        const systemWorkspaces = configData?.system_workspaces || [];
        let synced = false;
        setState((previousState) => {
          const result = buildStateAfterSavingSystemWorkspace(
            previousState,
            activeWorkspace.id,
            systemWorkspaces,
            newWorkspaceId,
          );
          synced = result.synced;
          if (result.synced) {
            saveDashboardState(result.nextState);
          }
          return result.nextState;
        });
        if (synced) {
          message.success('已保存为系统工作区，已自动分配给你的角色');
        } else {
          message.error('系统工作区已创建，但最新列表尚未同步到本地，请稍后刷新页面。');
        }
      } catch (error) {
        message.error(`${extractErrorMsg(error as Parameters<typeof extractErrorMsg>[0], '系统工作区已创建，但本地状态同步失败')}，请刷新页面。`);
      }
      setIsEditing(false);
    } catch (error) {
      message.error(extractErrorMsg(error as Parameters<typeof extractErrorMsg>[0], '保存系统工作区失败'));
    }
  }, [activeWorkspace, canManageSystemWorkspaces, setIsEditing, setSaveSystemModalOpen, setState, setSystemWsDesc, setSystemWsName, systemWsDesc, systemWsName]);

  const handleDeleteWorkspace = useCallback(async (id: string) => {
    const workspace = state.workspaces.find((item) => item.id === id) as (DashboardWorkspace & { isDefault?: boolean }) | undefined;
    if (!workspace) {
      return;
    }
    if (!canDeleteDashboardWorkspace(workspace, state.workspaces.length, {
      canManageDashboardConfig,
      canManageSystemWorkspaces,
    })) {
      if (state.workspaces.length <= 1) {
        message.warning('至少保留一个工作区');
        return;
      }
      if (workspace.isReadOnly) {
        message.warning('只读系统工作区不可删除');
        return;
      }
      if (isLocalDefaultWorkspace(workspace) || workspace.isDefault) {
        message.warning('默认工作区不可删除');
        return;
      }
      return;
    }
    if (workspace?.isSystem) {
      try {
        await deleteSystemWorkspace(id.replace(/^sys-/, ''));
        message.success('系统工作区已删除');
      } catch (error) {
        message.error(extractErrorMsg(error as Parameters<typeof extractErrorMsg>[0], '删除系统工作区失败'));
        return;
      }
    }
    const filteredWorkspaces = state.workspaces.filter((item) => item.id !== id);
    saveState({
      ...state,
      workspaces: filteredWorkspaces,
      activeWorkspaceId: state.activeWorkspaceId === id ? filteredWorkspaces[0].id : state.activeWorkspaceId,
    });
    if (!workspace?.isSystem) {
      message.success('工作区已删除');
    }
  }, [canManageDashboardConfig, canManageSystemWorkspaces, saveState, state]);

  const handleRename = useCallback(() => {
    if (!renameModal.name.trim()) {
      return;
    }
    const targetWorkspace = state.workspaces.find((workspace) => workspace.id === renameModal.id);
    if (!targetWorkspace) {
      return;
    }
    if (!canEditDashboardWorkspace(targetWorkspace, {
      canManageDashboardConfig,
      canManageSystemWorkspaces,
    })) {
      message.warning(getWorkspaceEditDeniedMessage(targetWorkspace, {
        canManageDashboardConfig,
        canManageSystemWorkspaces,
      }));
      return;
    }
    saveState({
      ...state,
      workspaces: state.workspaces.map((workspace) => (
        workspace.id === renameModal.id
          ? { ...workspace, name: renameModal.name.trim() }
          : workspace
      )),
    });
    setRenameModal({ open: false, id: '', name: '' });
    notifyWorkspaceMutation('已重命名', targetWorkspace?.isSystem);
  }, [canManageDashboardConfig, canManageSystemWorkspaces, notifyWorkspaceMutation, renameModal, saveState, setRenameModal, state]);

  const handleLayoutChange = useCallback((layout: readonly LayoutItem[], allLayouts: { lg?: readonly LayoutItem[]; md?: readonly LayoutItem[]; sm?: readonly LayoutItem[]; xs?: readonly LayoutItem[] }) => {
    const currentLayout = allLayouts?.lg || layout;
    if (layoutsAreEqual(activeWorkspace.layouts, currentLayout)) {
      return;
    }
    saveState(updateDashboardWorkspaceLayouts(state, activeWorkspace.id, currentLayout));
  }, [activeWorkspace, layoutsAreEqual, saveState, state]);

  const handleToggleWidget = useCallback((widgetId: string) => {
    const definition = WIDGET_REGISTRY[widgetId];
    if (!definition) {
      return;
    }
    const existingWidget = activeWorkspace.widgets.find((widget) => widget.widgetId === widgetId);
    if (existingWidget) {
      saveState(removeWidgetFromDashboardWorkspace(
        state,
        activeWorkspace.id,
        existingWidget.instanceId,
        widgetId,
      ));
      message.info(`已移除「${definition.name}」`);
      return;
    }

    saveState(addWidgetToDashboardWorkspace(state, activeWorkspace.id, widgetId, definition).nextState);
    notifyWorkspaceMutation(`已添加「${definition.name}」`, activeWorkspace.isSystem);
  }, [activeWorkspace, notifyWorkspaceMutation, saveState, state]);

  const handleRemoveWidget = useCallback((instanceId: string) => {
    saveState(removeWidgetFromDashboardWorkspace(state, activeWorkspace.id, instanceId));
  }, [activeWorkspace, saveState, state]);

  const handleAutoLayout = useCallback(() => {
    const nextLayouts = autoArrangeLayouts(activeWorkspace.widgets, activeWorkspace.layouts);
    saveState(updateDashboardWorkspaceLayouts(state, activeWorkspace.id, nextLayouts));
    notifyWorkspaceMutation('已自动整理布局', activeWorkspace.isSystem);
  }, [activeWorkspace, autoArrangeLayouts, notifyWorkspaceMutation, saveState, state]);

  const handleToggleEdit = useCallback(() => {
    if (!canEditDashboardWorkspace(activeWorkspace, {
      canManageDashboardConfig,
      canManageSystemWorkspaces,
    })) {
      message.warning(getWorkspaceEditDeniedMessage(activeWorkspace, {
        canManageDashboardConfig,
        canManageSystemWorkspaces,
      }));
      return;
    }
    setIsEditing((previous) => !previous);
  }, [activeWorkspace, canManageDashboardConfig, canManageSystemWorkspaces, setIsEditing]);

  return {
    handleAddWorkspace,
    handleAutoLayout,
    handleDeleteWorkspace,
    handleDuplicateWorkspace,
    handleLayoutChange,
    handleRemoveWidget,
    handleRename,
    handleSaveAsSystem,
    handleTabChange,
    handleToggleEdit,
    handleToggleWidget,
  };
};

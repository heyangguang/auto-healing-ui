import { message } from 'antd';
import { useCallback } from 'react';
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
type UseDashboardWorkspaceActionsOptions = {
  activeWorkspace: DashboardWorkspace;
  autoArrangeLayouts: (widgets: WidgetInstance[], currentLayouts: LayoutItem[]) => LayoutItem[];
  canManageDashboardConfig: boolean;
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
    const duplicatedWorkspace = duplicateDashboardWorkspace(workspace);
    saveState({
      ...state,
      workspaces: [...state.workspaces, duplicatedWorkspace],
      activeWorkspaceId: duplicatedWorkspace.id,
    });
    notifyWorkspaceMutation('已复制工作区');
  }, [notifyWorkspaceMutation, saveState, state]);

  const handleSaveAsSystem = useCallback(async () => {
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
      } catch {
        message.error('系统工作区已创建，但本地状态同步失败，请刷新页面。');
      }
      setIsEditing(false);
    } catch {
      message.error('保存系统工作区失败');
    }
  }, [activeWorkspace, setIsEditing, setSaveSystemModalOpen, setState, setSystemWsDesc, setSystemWsName, systemWsDesc, systemWsName]);

  const handleDeleteWorkspace = useCallback(async (id: string) => {
    if (state.workspaces.length <= 1) {
      message.warning('至少保留一个工作区');
      return;
    }
    const workspace = state.workspaces.find((item) => item.id === id) as (DashboardWorkspace & { isDefault?: boolean }) | undefined;
    if (workspace?.isDefault) {
      message.warning('默认工作区不可删除');
      return;
    }
    if (workspace?.isSystem) {
      try {
        await deleteSystemWorkspace(id.replace(/^sys-/, ''));
        message.success('系统工作区已删除');
      } catch {
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
  }, [saveState, state]);

  const handleRename = useCallback(() => {
    if (!canManageDashboardConfig) {
      message.warning('你没有权限重命名工作区');
      return;
    }
    if (!renameModal.name.trim()) {
      return;
    }
    const targetWorkspace = state.workspaces.find((workspace) => workspace.id === renameModal.id);
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
  }, [canManageDashboardConfig, notifyWorkspaceMutation, renameModal, saveState, setRenameModal, state]);

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
    setIsEditing((previous) => !previous);
  }, [setIsEditing]);

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

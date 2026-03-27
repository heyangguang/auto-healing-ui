import { message } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  clearLegacyCache,
  loadDashboardState,
  saveDashboardState,
  type DashboardState,
  type DashboardWorkspace,
  type LayoutItem,
  type WidgetInstance,
} from '../dashboardStore';
import {
  getDashboardConfig,
  updateSystemWorkspace,
} from '@/services/auto-healing/dashboard';
import type {
  DashboardConfigPayload,
  DashboardRenameState,
} from './dashboardWorkspaceTypes';
import { mergeSystemWorkspaces } from './dashboardWorkspaceState';
import { useDashboardWorkspaceActions } from './useDashboardWorkspaceActions';

type UseDashboardWorkspaceManagerOptions = {
  autoArrangeLayouts: (widgets: WidgetInstance[], currentLayouts: LayoutItem[]) => LayoutItem[];
  canManageDashboardConfig: boolean;
  canManageSystemWorkspaces: boolean;
  generateResponsiveLayouts: (layouts: LayoutItem[]) => Record<string, LayoutItem[]>;
  layoutsAreEqual: (left: readonly LayoutItem[], right: readonly LayoutItem[]) => boolean;
};

export const useDashboardWorkspaceManager = ({
  autoArrangeLayouts,
  canManageDashboardConfig,
  canManageSystemWorkspaces,
  generateResponsiveLayouts,
  layoutsAreEqual,
}: UseDashboardWorkspaceManagerOptions) => {
  const [state, setState] = useState<DashboardState>(() => {
    clearLegacyCache();
    return loadDashboardState();
  });
  const [isEditing, setIsEditing] = useState(false);
  const [renameModal, setRenameModal] = useState<DashboardRenameState>({ open: false, id: '', name: '' });
  const [saveSystemModalOpen, setSaveSystemModalOpen] = useState(false);
  const [systemWsName, setSystemWsName] = useState('');
  const [systemWsDesc, setSystemWsDesc] = useState('');
  const saveTimeout = useRef<number | undefined>(undefined);
  const systemWorkspaceSaveTimeouts = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    clearLegacyCache();
  }, []);

  const readSystemWorkspaces = useCallback((response: DashboardConfigPayload) => {
    const data = response?.data || response;
    return data?.system_workspaces || [];
  }, []);

  const syncRemoteSystemWorkspaces = useCallback(async (preferredActiveWorkspaceId?: string) => {
    const response = await getDashboardConfig();
    const systemWorkspaces = readSystemWorkspaces(response);
    setState((previousState) => mergeSystemWorkspaces(
      previousState,
      systemWorkspaces,
      preferredActiveWorkspaceId,
    ));
  }, [readSystemWorkspaces]);

  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
      systemWorkspaceSaveTimeouts.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      systemWorkspaceSaveTimeouts.current.clear();
    };
  }, []);

  useEffect(() => {
    syncRemoteSystemWorkspaces().catch(() => {
      // keep local dashboard state visible
    });
  }, [syncRemoteSystemWorkspaces]);

  const saveSystemWorkspaceToBackend = useCallback((workspace: DashboardWorkspace) => {
    if (!workspace.isSystem || !canManageSystemWorkspaces) {
      return;
    }
    const realId = workspace.id.replace(/^sys-/, '');
    const existingTimeout = systemWorkspaceSaveTimeouts.current.get(realId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    const timeoutId = window.setTimeout(() => {
      systemWorkspaceSaveTimeouts.current.delete(realId);
      updateSystemWorkspace(realId, {
        config: {
          widgets: workspace.widgets,
          layouts: workspace.layouts,
        },
      }).catch(async () => {
        try {
          await syncRemoteSystemWorkspaces(realId);
          message.error('系统工作区保存失败，已恢复到服务端版本');
        } catch {
          message.error('系统工作区保存失败，且最新配置同步失败，请刷新页面。');
        }
      });
    }, 1000);
    systemWorkspaceSaveTimeouts.current.set(realId, timeoutId);
  }, [canManageSystemWorkspaces, syncRemoteSystemWorkspaces]);

  const saveState = useCallback((nextState: DashboardState) => {
    setState(nextState);
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    saveTimeout.current = window.setTimeout(() => {
      saveDashboardState(nextState);
    }, 500);
    const activeWorkspace = nextState.workspaces.find((workspace) => workspace.id === nextState.activeWorkspaceId);
    if (activeWorkspace?.isSystem && canManageSystemWorkspaces) {
      saveSystemWorkspaceToBackend(activeWorkspace);
    }
  }, [canManageSystemWorkspaces, saveSystemWorkspaceToBackend]);

  const activeWorkspace = useMemo(
    () => state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId) || state.workspaces[0],
    [state],
  );

  useEffect(() => {
    if (!isEditing || !activeWorkspace?.isSystem || canManageSystemWorkspaces) {
      return;
    }
    setIsEditing(false);
    message.warning('你没有权限编辑系统工作区');
  }, [activeWorkspace?.id, activeWorkspace?.isSystem, canManageSystemWorkspaces, isEditing]);

  const notifyWorkspaceMutation = useCallback((label: string, isSystem?: boolean) => {
    if (isSystem) {
      message.info(`${label}，系统工作区正在同步保存`);
      return;
    }
    message.success(label);
  }, []);

  const responsiveLayouts = useMemo(
    () => generateResponsiveLayouts(activeWorkspace.layouts as LayoutItem[]),
    [activeWorkspace.layouts, generateResponsiveLayouts],
  );
  const {
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
  } = useDashboardWorkspaceActions({
    activeWorkspace,
    autoArrangeLayouts,
    canManageDashboardConfig,
    layoutsAreEqual,
    notifyWorkspaceMutation,
    renameModal,
    saveState,
    saveSystemWorkspaceToBackend,
    setIsEditing,
    setRenameModal,
    setSaveSystemModalOpen,
    setState,
    setSystemWsDesc,
    setSystemWsName,
    state,
    systemWsDesc,
    systemWsName,
  });

  return {
    activeWorkspace,
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
    isEditing,
    renameModal,
    responsiveLayouts,
    saveSystemModalOpen,
    setIsEditing,
    setRenameModal,
    setSaveSystemModalOpen,
    setSystemWsDesc,
    setSystemWsName,
    state,
    systemWsDesc,
    systemWsName,
  };
};

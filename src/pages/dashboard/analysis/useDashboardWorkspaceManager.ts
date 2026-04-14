import { message } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { extractErrorMsg } from '@/utils/errorMsg';
import {
  clearLegacyCache,
  loadDashboardState,
  saveDashboardState,
  type DashboardState,
  type DashboardWorkspace,
  type LayoutItem,
  type WidgetInstance,
} from '../dashboardStore';
import { upgradeDashboardOverviewState } from '../dashboardDefaultWorkspace';
import {
  getDashboardConfig,
  updateSystemWorkspace,
} from '@/services/auto-healing/dashboard';
import type {
  DashboardConfigPayload,
  DashboardRenameState,
} from './dashboardWorkspaceTypes';
import {
  canEditDashboardWorkspace,
  getWorkspaceEditDeniedMessage,
} from './dashboardWorkspaceMeta';
import { buildSystemWorkspacePayload } from './dashboardWorkspacePersistence';
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
  const emptyWorkspace: DashboardWorkspace = {
    id: '',
    name: '',
    widgets: [],
    layouts: [],
  };
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

  useEffect(() => {
    setState((previousState) => {
      const nextState = upgradeDashboardOverviewState(previousState);
      if (nextState !== previousState) {
        saveDashboardState(nextState);
      }
      return nextState;
    });
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
      const payload = buildSystemWorkspacePayload(workspace);
      updateSystemWorkspace(realId, payload).catch(async (error) => {
        const errorMessage = extractErrorMsg(error as Parameters<typeof extractErrorMsg>[0], '系统工作区保存失败');
        try {
          await syncRemoteSystemWorkspaces(realId);
          message.error(`${errorMessage}，已恢复到服务端版本`);
        } catch {
          message.error(`${errorMessage}，且最新配置同步失败，请刷新页面。`);
        }
      });
    }, 1000);
    systemWorkspaceSaveTimeouts.current.set(realId, timeoutId);
  }, [canManageSystemWorkspaces, syncRemoteSystemWorkspaces]);

  const saveState = useCallback((nextState: DashboardState, changedWorkspaceId?: string) => {
    setState(nextState);
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    saveTimeout.current = window.setTimeout(() => {
      saveDashboardState(nextState);
    }, 500);
    if (!changedWorkspaceId) {
      return;
    }
    const changedWorkspace = nextState.workspaces.find((workspace) => workspace.id === changedWorkspaceId);
    if (changedWorkspace?.isSystem && canManageSystemWorkspaces) {
      saveSystemWorkspaceToBackend(changedWorkspace);
    }
  }, [canManageSystemWorkspaces, saveSystemWorkspaceToBackend]);

  const activeWorkspace = useMemo(
    () => state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId)
      || state.workspaces[0]
      || emptyWorkspace,
    [state],
  );
  const hasActiveWorkspace = Boolean(activeWorkspace.id);
  const canEditActiveWorkspace = useMemo(
    () => hasActiveWorkspace && canEditDashboardWorkspace(activeWorkspace, {
      canManageDashboardConfig,
      canManageSystemWorkspaces,
    }),
    [activeWorkspace, canManageDashboardConfig, canManageSystemWorkspaces, hasActiveWorkspace],
  );

  useEffect(() => {
    if (!isEditing || !hasActiveWorkspace || canEditActiveWorkspace) {
      return;
    }
    setIsEditing(false);
    message.warning(getWorkspaceEditDeniedMessage(activeWorkspace, {
      canManageDashboardConfig,
      canManageSystemWorkspaces,
    }));
  }, [activeWorkspace, canEditActiveWorkspace, canManageDashboardConfig, canManageSystemWorkspaces, hasActiveWorkspace, isEditing]);

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
    canManageSystemWorkspaces,
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
  });

  return {
    activeWorkspace,
    canEditActiveWorkspace,
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

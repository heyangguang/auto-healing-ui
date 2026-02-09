/**
 * Dashboard Builder - 可拖拽自定义仪表盘
 *
 * 核心功能：
 * 1. Workspace Tabs - 多工作区管理 (直角工业风)
 * 2. Widget 组件库 - 预置 Widget 按 Section 分组
 * 3. 拖拽编辑 - react-grid-layout 12 列网格
 * 4. 一键整理布局 - 自动紧凑排列
 * 5. 自动持久化 - localStorage
 */

import {
  AppstoreAddOutlined,
  BlockOutlined,
  CloseOutlined,
  DashboardOutlined,
  DeleteOutlined,
  EditOutlined,
  LockOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Button, Collapse, Drawer, Empty, Input, message, Modal, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react';
import { ResponsiveGridLayout, useContainerWidth, verticalCompactor } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import type { DashboardState, DashboardWorkspace, LayoutItem, WidgetInstance } from '../dashboardStore';
import {
  clearLegacyCache,
  generateInstanceId,
  generateWorkspaceId,
  getDefaultWorkspace,
  loadDashboardState,
  saveDashboardState,
} from '../dashboardStore';

import type { WidgetComponentProps } from '../widgets/widgetRegistry';
import { WIDGET_REGISTRY, WIDGET_SECTIONS, getWidgetsBySection } from '../widgets/widgetRegistry';
import { createSystemWorkspace, deleteSystemWorkspace, getDashboardConfig, updateSystemWorkspace } from '@/services/auto-healing/dashboard';

// ==================== Memoized Widget Renderer ====================

const MemoizedWidget = React.memo<{
  widget: WidgetInstance;
  isEditing: boolean;
  onRemove: (id: string) => void;
}>(({ widget, isEditing, onRemove }) => {
  const def = WIDGET_REGISTRY[widget.widgetId];
  if (!def) {
    return (
      <div style={{ background: '#fafafa', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description="未知组件" />
      </div>
    );
  }
  const Component = def.component as React.ComponentType<WidgetComponentProps>;
  return (
    <Component
      widgetId={widget.widgetId}
      instanceId={widget.instanceId}
      isEditing={isEditing}
      onRemove={() => onRemove(widget.instanceId)}
    />
  );
});

// ==================== 一键整理布局算法 ====================

function autoArrangeLayouts(widgets: WidgetInstance[], currentLayouts: LayoutItem[]): LayoutItem[] {
  const sorted = [...widgets].sort((a, b) => {
    const defA = WIDGET_REGISTRY[a.widgetId];
    const defB = WIDGET_REGISTRY[b.widgetId];
    const catOrder: Record<string, number> = { stat: 0, chart: 1, rank: 2, trend: 3, pie: 4, bar: 5, list: 6, status: 7 };
    return (catOrder[defA?.category ?? ''] ?? 99) - (catOrder[defB?.category ?? ''] ?? 99);
  });

  const COLS = 12;
  const grid: boolean[][] = [];

  function canPlace(x: number, y: number, w: number, h: number): boolean {
    for (let row = y; row < y + h; row++) {
      if (!grid[row]) grid[row] = new Array(COLS).fill(false);
      for (let col = x; col < x + w; col++) {
        if (col >= COLS || grid[row][col]) return false;
      }
    }
    return true;
  }

  function placeItem(x: number, y: number, w: number, h: number): void {
    for (let row = y; row < y + h; row++) {
      if (!grid[row]) grid[row] = new Array(COLS).fill(false);
      for (let col = x; col < x + w; col++) {
        grid[row][col] = true;
      }
    }
  }

  const newLayouts: LayoutItem[] = [];
  for (const widget of sorted) {
    const def = WIDGET_REGISTRY[widget.widgetId];
    const existing = currentLayouts.find((l) => l.i === widget.instanceId);
    const w = existing?.w ?? def?.defaultLayout?.w ?? 3;
    const h = existing?.h ?? def?.defaultLayout?.h ?? 2;
    const minW = existing?.minW ?? def?.defaultLayout?.minW;
    const minH = existing?.minH ?? def?.defaultLayout?.minH;

    let placed = false;
    for (let y = 0; !placed; y++) {
      for (let x = 0; x <= COLS - w; x++) {
        if (canPlace(x, y, w, h)) {
          placeItem(x, y, w, h);
          newLayouts.push({ i: widget.instanceId, x, y, w, h, minW, minH });
          placed = true;
          break;
        }
      }
      if (y > 100) break;
    }
  }
  return newLayouts;
}

// ==================== 响应式多断点布局生成 ====================

/**
 * 根据 lg 布局自动为 md/sm/xs 断点生成合理布局
 * 核心策略：按 lg 布局的 y->x 排序，然后在较少列数的网格中贪心重排
 * widget 宽度会按比例缩放到目标列数，确保不超出网格
 */
const BREAKPOINT_COLS: Record<string, number> = { lg: 12, md: 10, sm: 6, xs: 4 };

function generateLayoutForBreakpoint(lgLayout: LayoutItem[], targetCols: number): LayoutItem[] {
  if (targetCols >= 12) return lgLayout; // lg 直接返回

  // 按 y -> x 排序，保持视觉顺序
  const sorted = [...lgLayout].sort((a, b) => a.y - b.y || a.x - b.x);

  const grid: boolean[][] = [];
  const result: LayoutItem[] = [];

  function canPlace(x: number, y: number, w: number, h: number): boolean {
    for (let row = y; row < y + h; row++) {
      if (!grid[row]) grid[row] = new Array(targetCols).fill(false);
      for (let col = x; col < x + w; col++) {
        if (col >= targetCols || grid[row][col]) return false;
      }
    }
    return true;
  }

  function placeItem(x: number, y: number, w: number, h: number): void {
    for (let row = y; row < y + h; row++) {
      if (!grid[row]) grid[row] = new Array(targetCols).fill(false);
      for (let col = x; col < x + w; col++) {
        grid[row][col] = true;
      }
    }
  }

  for (const item of sorted) {
    // 按比例缩放宽度，最少为 minW 或 2
    const minW = item.minW ?? 2;
    let w = Math.max(minW, Math.round(item.w * targetCols / 12));
    // 如果缩放后宽度仍超出列数，设为满宽
    if (w > targetCols) w = targetCols;

    // 贪心放置：从上到下，从左到右找第一个能放的位置
    let placed = false;
    for (let y = 0; !placed && y < 200; y++) {
      for (let x = 0; x <= targetCols - w; x++) {
        if (canPlace(x, y, w, item.h)) {
          placeItem(x, y, w, item.h);
          result.push({ ...item, x, y, w });
          placed = true;
          break;
        }
      }
    }
    // fallback: 放不下就满宽堆叠
    if (!placed) {
      const fallbackY = grid.length;
      const fallbackW = Math.min(w, targetCols);
      placeItem(0, fallbackY, fallbackW, item.h);
      result.push({ ...item, x: 0, y: fallbackY, w: fallbackW });
    }
  }
  return result;
}

function generateAllBreakpointLayouts(lgLayout: LayoutItem[]): Record<string, LayoutItem[]> {
  return {
    lg: lgLayout,
    md: generateLayoutForBreakpoint(lgLayout, BREAKPOINT_COLS.md),
    sm: generateLayoutForBreakpoint(lgLayout, BREAKPOINT_COLS.sm),
    xs: generateLayoutForBreakpoint(lgLayout, BREAKPOINT_COLS.xs),
  };
}

// ==================== 布局比较工具 ====================
function layoutsAreEqual(a: LayoutItem[], b: LayoutItem[]): boolean {
  if (a.length !== b.length) return false;
  // 简单比较每个 item 的核心属性
  const sortedA = [...a].sort((x, y) => x.i.localeCompare(y.i));
  const sortedB = [...b].sort((x, y) => x.i.localeCompare(y.i));

  for (let i = 0; i < sortedA.length; i++) {
    const itemA = sortedA[i];
    const itemB = sortedB[i];
    if (
      itemA.i !== itemB.i ||
      itemA.x !== itemB.x ||
      itemA.y !== itemB.y ||
      itemA.w !== itemB.w ||
      itemA.h !== itemB.h
    ) {
      return false;
    }
  }
  return true;
}

// ==================== 主组件 ====================

const DashboardBuilder: React.FC = () => {
  const { containerRef, width } = useContainerWidth();

  const [state, setState] = useState<DashboardState>(() => {
    clearLegacyCache();
    return loadDashboardState();
  });
  const [isEditing, setIsEditing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [renameModal, setRenameModal] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });
  const [saveSystemModalOpen, setSaveSystemModalOpen] = useState(false);
  const [systemWsName, setSystemWsName] = useState('');
  const [systemWsDesc, setSystemWsDesc] = useState('');
  const saveTimeout = useRef<number | undefined>(undefined);
  const sysWsSaveTimeout = useRef<number | undefined>(undefined);
  const { initialState } = useModel('@@initialState');
  const userPermissions: string[] = (initialState?.currentUser as any)?.permissions || [];
  const hasWsManage = userPermissions.includes('*') || userPermissions.includes('dashboard:workspace:manage');

  // 渐进式加载：widget 分批渲染，避免首次加载卡顿
  const [visibleCount, setVisibleCount] = useState(0);
  const activeWsId = state.activeWorkspaceId;
  const totalWidgets = state.workspaces.find(w => w.id === activeWsId)?.widgets.length ?? 0;
  useEffect(() => {
    setVisibleCount(0);
    let count = 0;
    const timer = setInterval(() => {
      count += 4;
      if (count >= totalWidgets) {
        setVisibleCount(totalWidgets);
        clearInterval(timer);
      } else {
        setVisibleCount(count);
      }
    }, 80);
    return () => clearInterval(timer);
  }, [activeWsId, totalWidgets]);

  useEffect(() => { clearLegacyCache(); }, []);

  // Load system workspaces from backend and merge into state
  useEffect(() => {
    getDashboardConfig().then((res: any) => {
      const data = res?.data || res;
      const sysWorkspaces = data?.system_workspaces || [];
      if (sysWorkspaces.length === 0) return;

      setState(prev => {
        const userWorkspaces = prev.workspaces.filter(ws => !ws.isSystem);
        const newSystemWs: DashboardWorkspace[] = sysWorkspaces.map((sws: any) => ({
          id: `sys-${sws.id}`,
          name: sws.name,
          widgets: sws.config?.widgets || [],
          layouts: sws.config?.layouts || [],
          isSystem: true,
          isReadOnly: false,
          isDefault: sws.is_default || false,
        } as any));
        const merged = [...newSystemWs, ...userWorkspaces];
        return {
          ...prev,
          workspaces: merged,
          // 默认显示第一个系统工作区（默认工作区排最前）
          activeWorkspaceId: newSystemWs[0]?.id || prev.activeWorkspaceId,
        };
      });
    }).catch(() => { /* silently ignore */ });
  }, []);

  // 系统工作区编辑后自动保存到后端
  const saveSystemWsToBackend = useCallback((ws: DashboardWorkspace) => {
    if (!ws.isSystem) return;
    const realId = ws.id.replace(/^sys-/, '');
    if (sysWsSaveTimeout.current) clearTimeout(sysWsSaveTimeout.current);
    sysWsSaveTimeout.current = window.setTimeout(() => {
      updateSystemWorkspace(realId, {
        config: { widgets: ws.widgets, layouts: ws.layouts },
      }).catch(() => { /* silently ignore */ });
    }, 1000);
  }, []);

  const saveState = useCallback((newState: DashboardState) => {
    setState(newState);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = window.setTimeout(() => {
      saveDashboardState(newState);
    }, 500);
    // 如果当前活动工作区是系统工作区，同步保存到后端
    const activeWs = newState.workspaces.find(ws => ws.id === newState.activeWorkspaceId);
    if (activeWs?.isSystem) {
      saveSystemWsToBackend(activeWs);
    }
  }, [saveSystemWsToBackend]);

  const activeWorkspace = useMemo(
    () => state.workspaces.find((ws) => ws.id === state.activeWorkspaceId) || state.workspaces[0],
    [state],
  );

  // 缓存多断点响应式布局
  const responsiveLayouts = useMemo(
    () => generateAllBreakpointLayouts(activeWorkspace.layouts as LayoutItem[]),
    [activeWorkspace.layouts],
  );

  const handleTabChange = useCallback((id: string) => {
    // 切换 Tab 不需要 transition，立即响应避免卡顿感
    // 保存前一个 Tab 的状态已经在 handleLayoutChange 中完成
    setState(prev => ({ ...prev, activeWorkspaceId: id }));
    // 同时也保存一下，确保 activeWorkspaceId 被持久化
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = window.setTimeout(() => {
      saveDashboardState({ ...state, activeWorkspaceId: id });
    }, 500);
  }, [state, saveState]);

  const handleAddWorkspace = useCallback(() => {
    const id = generateWorkspaceId();
    const newWs: DashboardWorkspace = { id, name: `工作区 ${state.workspaces.length + 1}`, widgets: [], layouts: [] };
    saveState({
      ...state,
      workspaces: [...state.workspaces, newWs],
      activeWorkspaceId: id,
    });
    setIsEditing(true);
    message.success('已创建新工作区');
  }, [state, saveState]);

  const handleDuplicateWorkspace = useCallback((ws: DashboardWorkspace) => {
    const id = generateWorkspaceId();
    const dupWs: DashboardWorkspace = {
      id,
      name: `${ws.name} (副本)`,
      widgets: ws.widgets.map(w => ({ ...w, instanceId: generateInstanceId() })),
      layouts: [],
    };
    const idMap = new Map<string, string>();
    ws.widgets.forEach((w, i) => idMap.set(w.instanceId, dupWs.widgets[i].instanceId));
    dupWs.layouts = ws.layouts.map(l => ({ ...l, i: idMap.get(l.i) || l.i }));
    saveState({
      ...state,
      workspaces: [...state.workspaces, dupWs],
      activeWorkspaceId: id,
    });
    message.success('已复制工作区');
  }, [state, saveState]);

  const handleSaveAsSystem = useCallback(async () => {
    if (!systemWsName.trim()) {
      message.warning('请输入工作区名称');
      return;
    }
    try {
      const config = {
        widgets: activeWorkspace.widgets,
        layouts: activeWorkspace.layouts,
      };
      const res = await createSystemWorkspace({
        name: systemWsName.trim(),
        description: systemWsDesc.trim(),
        config,
      });
      message.success('已保存为系统工作区，已自动分配给你的角色');
      setSaveSystemModalOpen(false);
      setSystemWsName('');
      setSystemWsDesc('');

      // 删除个人副本并重载系统工作区
      const personalWsId = activeWorkspace.id;
      const newWsId = res?.data?.id || res?.id;

      // 从 localStorage 中移除个人工作区
      setState(prev => {
        const filtered = prev.workspaces.filter(ws => ws.id !== personalWsId);
        const newState = { ...prev, workspaces: filtered };
        saveDashboardState(newState);
        return newState;
      });

      // 重新加载系统工作区
      const configRes = await getDashboardConfig();
      const data = configRes?.data || configRes;
      const sysWorkspaces = data?.system_workspaces || [];
      setState(prev => {
        const userWorkspaces = prev.workspaces.filter(ws => !ws.isSystem);
        const newSystemWs: DashboardWorkspace[] = sysWorkspaces.map((sws: any) => ({
          id: `sys-${sws.id}`,
          name: sws.name,
          widgets: sws.config?.widgets || [],
          layouts: sws.config?.layouts || [],
          isSystem: true,
          isReadOnly: false,
          isDefault: sws.is_default || false,
        } as any));
        return {
          ...prev,
          workspaces: [...newSystemWs, ...userWorkspaces],
          activeWorkspaceId: newWsId ? `sys-${newWsId}` : newSystemWs[0]?.id || prev.activeWorkspaceId,
        };
      });
      setIsEditing(false);
    } catch (err) {
      message.error('保存失败');
    }
  }, [systemWsName, systemWsDesc, activeWorkspace]);

  const handleDeleteWorkspace = useCallback(async (id: string) => {
    if (state.workspaces.length <= 1) {
      message.warning('至少保留一个工作区');
      return;
    }
    const ws = state.workspaces.find(w => w.id === id);
    // 默认工作区不可删除
    if ((ws as any)?.isDefault) {
      message.warning('默认工作区不可删除');
      return;
    }
    // 系统工作区调后端 DELETE API
    if (ws?.isSystem) {
      try {
        const realId = id.replace(/^sys-/, '');
        await deleteSystemWorkspace(realId);
        message.success('系统工作区已删除');
      } catch {
        message.error('删除失败');
        return;
      }
    }
    const filtered = state.workspaces.filter((w) => w.id !== id);
    saveState({
      ...state,
      workspaces: filtered,
      activeWorkspaceId: state.activeWorkspaceId === id ? filtered[0].id : state.activeWorkspaceId,
    });
    if (!ws?.isSystem) {
      message.success('工作区已删除');
    }
  }, [state, saveState]);

  const handleRename = useCallback(() => {
    if (!renameModal.name.trim()) return;
    saveState({
      ...state,
      workspaces: state.workspaces.map((ws) =>
        ws.id === renameModal.id ? { ...ws, name: renameModal.name.trim() } : ws,
      ),
    });
    setRenameModal({ open: false, id: '', name: '' });
    message.success('已重命名');
  }, [state, renameModal, saveState]);

  const handleLayoutChange = useCallback((layout: LayoutItem[], allLayouts: { lg?: LayoutItem[]; md?: LayoutItem[]; sm?: LayoutItem[]; xs?: LayoutItem[] }) => {
    if (!isEditing) return;

    // RGL 有时会返回 undefined 或空，以 layout 为准
    const currentLayout = allLayouts?.lg || layout;

    // 关键修复：比较布局是否真的发生变化，防止无限循环渲染
    const activeWs = state.workspaces.find(w => w.id === state.activeWorkspaceId);
    if (activeWs && layoutsAreEqual(activeWs.layouts, currentLayout)) {
      return;
    }

    setState((prev) => {
      const newState = {
        ...prev,
        workspaces: prev.workspaces.map((ws) =>
          ws.id === prev.activeWorkspaceId ? { ...ws, layouts: currentLayout } : ws,
        ),
      };

      // 防抖保存
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = window.setTimeout(() => {
        saveDashboardState(newState);
      }, 500); // 增加防抖时间到 500ms

      // 系统工作区同步保存到后端
      const updatedWs = newState.workspaces.find(ws => ws.id === newState.activeWorkspaceId);
      if (updatedWs?.isSystem) {
        saveSystemWsToBackend(updatedWs);
      }

      return newState;
    });
  }, [isEditing, state.workspaces, state.activeWorkspaceId, saveSystemWsToBackend]);

  const handleToggleWidget = useCallback((widgetId: string) => {
    const def = WIDGET_REGISTRY[widgetId];
    if (!def) return;

    setState((prev) => {
      const ws = prev.workspaces.find((w) => w.id === prev.activeWorkspaceId);
      if (!ws) return prev;
      const existingWidget = ws.widgets.find((w) => w.widgetId === widgetId);

      let newState: DashboardState;
      if (existingWidget) {
        newState = {
          ...prev,
          workspaces: prev.workspaces.map((w) =>
            w.id === prev.activeWorkspaceId
              ? {
                ...w,
                widgets: w.widgets.filter((wi) => wi.widgetId !== widgetId),
                layouts: w.layouts.filter((l) => l.i !== existingWidget.instanceId),
              }
              : w,
          ),
        };
        message.info(`已移除「${def.name}」`);
      } else {
        const instanceId = generateInstanceId();
        const newWidget: WidgetInstance = { instanceId, widgetId };
        const newLayout: LayoutItem = {
          i: instanceId, x: 0, y: Infinity,
          w: def.defaultLayout.w, h: def.defaultLayout.h,
          minW: def.defaultLayout.minW, minH: def.defaultLayout.minH,
        };
        newState = {
          ...prev,
          workspaces: prev.workspaces.map((w) =>
            w.id === prev.activeWorkspaceId
              ? { ...w, widgets: [...w.widgets, newWidget], layouts: [...w.layouts, newLayout] }
              : w,
          ),
        };
        message.success(`已添加「${def.name}」`);
      }

      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = window.setTimeout(() => {
        saveDashboardState(newState);
      }, 300);

      // 系统工作区同步保存到后端
      const updatedWs = newState.workspaces.find(ws => ws.id === newState.activeWorkspaceId);
      if (updatedWs?.isSystem) {
        saveSystemWsToBackend(updatedWs);
      }

      return newState;
    });
  }, [saveSystemWsToBackend]);

  const handleRemoveWidget = useCallback((instanceId: string) => {
    setState((prev) => {
      const newState = {
        ...prev,
        workspaces: prev.workspaces.map((ws) =>
          ws.id === prev.activeWorkspaceId
            ? {
              ...ws,
              widgets: ws.widgets.filter((w) => w.instanceId !== instanceId),
              layouts: ws.layouts.filter((l) => l.i !== instanceId),
            }
            : ws,
        ),
      };
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = window.setTimeout(() => {
        saveDashboardState(newState);
      }, 300);

      // 系统工作区同步保存到后端
      const updatedWs = newState.workspaces.find(ws => ws.id === newState.activeWorkspaceId);
      if (updatedWs?.isSystem) {
        saveSystemWsToBackend(updatedWs);
      }

      return newState;
    });
  }, [saveSystemWsToBackend]);

  const handleAutoLayout = useCallback(() => {
    const newLayouts = autoArrangeLayouts(activeWorkspace.widgets, activeWorkspace.layouts);
    const newState = {
      ...state,
      workspaces: state.workspaces.map((ws) =>
        ws.id === activeWorkspace.id ? { ...ws, layouts: newLayouts } : ws,
      ),
    };
    saveState(newState);
    message.success('已自动整理布局');
  }, [state, activeWorkspace, saveState]);

  const handleToggleEdit = useCallback(() => {
    setIsEditing((prev) => !prev);
  }, []);

  const addedWidgetIds = useMemo(
    () => new Set(activeWorkspace.widgets.map((w) => w.widgetId)),
    [activeWorkspace.widgets],
  );

  const filteredSections = useMemo(() => {
    return WIDGET_SECTIONS.map((sec) => {
      const widgets = getWidgetsBySection(sec.key);
      if (!search) return { ...sec, widgets };
      const filtered = widgets.filter((w) =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.description.toLowerCase().includes(search.toLowerCase()),
      );
      return { ...sec, widgets: filtered };
    }).filter((s) => s.widgets.length > 0);
  }, [search]);

  return (
    <PageContainer
      header={{ title: <><DashboardOutlined /> 运维监控中心 / DASHBOARD</>, subTitle: `${state.workspaces.length} 个工作区 · ${activeWorkspace.widgets.length} 个组件` }}
    >
      {/* ========== 顶部控制栏 ========== */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginBottom: 0,
        padding: '0 0 12px 0',
        borderBottom: '1px solid #f0f0f0',
      }}>

        {/* 右侧：操作按钮 */}
        <Space size={6}>
          {isEditing && (
            <>
              <Button
                type="primary"
                icon={<AppstoreAddOutlined />}
                onClick={() => setDrawerOpen(true)}
                style={{ borderRadius: 0 }}
                size="small"
              >
                添加组件
              </Button>
              <Tooltip title="按类别自动排列所有组件">
                <Button
                  icon={<BlockOutlined />}
                  onClick={handleAutoLayout}
                  style={{ borderRadius: 0 }}
                  size="small"
                >
                  整理布局
                </Button>
              </Tooltip>
            </>
          )}
          <Button
            type={isEditing ? 'primary' : 'default'}
            icon={isEditing ? <LockOutlined /> : <EditOutlined />}
            onClick={handleToggleEdit}
            ghost={isEditing}
            size="small"
            style={{ borderRadius: 0, minWidth: 72 }}
          >
            {isEditing ? '锁定' : '编辑'}
          </Button>
          {hasWsManage && activeWorkspace.widgets.length > 0 && !activeWorkspace.isSystem && (
            <Button
              size="small"
              style={{ borderRadius: 0 }}
              onClick={() => { setSystemWsName(activeWorkspace.name); setSaveSystemModalOpen(true); }}
            >
              保存为系统工作区
            </Button>
          )}
        </Space>
      </div>

      {/* ========== 工作区 Tab Bar — 卡片分组风格 ========== */}
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        borderBottom: '2px solid #e8e8e8',
        marginBottom: 12,
        marginTop: 0,
        background: '#f5f5f5',
        gap: 1,
      }}>
        {state.workspaces.map((ws, idx) => {
          const isActive = ws.id === state.activeWorkspaceId;
          const isSys = ws.isSystem;
          const isDef = (ws as any).isDefault;
          // 系统/默认工作区和个人工作区之间添加分组分隔
          const prevWs = idx > 0 ? state.workspaces[idx - 1] : null;
          const showGroupDivider = prevWs && (prevWs.isSystem !== ws.isSystem);
          return (
            <React.Fragment key={ws.id}>
              {showGroupDivider && (
                <div style={{
                  width: 2,
                  background: 'linear-gradient(180deg, transparent 20%, #d9d9d9 50%, transparent 80%)',
                  margin: '4px 3px',
                }} />
              )}
              <div
                onClick={() => handleTabChange(ws.id)}
                onDoubleClick={() => setRenameModal({ open: true, id: ws.id, name: ws.name })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 16px 7px 14px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive
                    ? (isSys ? (isDef ? '#1677ff' : '#722ed1') : '#1677ff')
                    : '#595959',
                  background: isActive
                    ? '#fff'
                    : (isSys ? (isDef ? '#f0f5ff' : '#faf0ff') : 'transparent'),
                  borderBottom: isActive
                    ? `2px solid ${isSys ? (isDef ? '#1677ff' : '#722ed1') : '#1677ff'}`
                    : '2px solid transparent',
                  borderTop: isActive
                    ? `2px solid ${isSys ? (isDef ? '#1677ff' : '#722ed1') : '#1677ff'}`
                    : '2px solid transparent',
                  borderLeft: isSys && !isActive ? `2px solid ${isDef ? '#91caff' : '#d3adf7'}` : '2px solid transparent',
                  borderRight: '1px solid transparent',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  position: 'relative',
                  borderRadius: isActive ? '4px 4px 0 0' : 0,
                  marginBottom: isActive ? -2 : 0,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.color = isSys ? (isDef ? '#1677ff' : '#722ed1') : '#1677ff';
                    (e.currentTarget as HTMLDivElement).style.background = isSys ? (isDef ? '#e6f4ff' : '#f9f0ff') : '#f0f5ff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.color = '#595959';
                    (e.currentTarget as HTMLDivElement).style.background = isSys ? (isDef ? '#f0f5ff' : '#faf0ff') : 'transparent';
                  }
                }}
              >
                {isSys && (
                  <span style={{
                    display: 'inline-block',
                    width: 6, height: 6,
                    borderRadius: '50%',
                    background: isDef ? '#1677ff' : '#722ed1',
                    flexShrink: 0,
                  }} />
                )}
                <span>{ws.name}</span>
                {isSys && (
                  <Tag
                    color={isDef ? 'blue' : 'purple'}
                    style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0, borderRadius: 2 }}
                  >
                    {isDef ? '默认' : '系统'}
                  </Tag>
                )}
                {ws.widgets.length > 0 && (
                  <Tag
                    style={{
                      fontSize: 10,
                      lineHeight: '16px',
                      padding: '0 4px',
                      margin: 0,
                      borderRadius: 2,
                      background: isActive ? '#e6f4ff' : '#f0f0f0',
                      border: `1px solid ${isActive ? '#91caff' : '#e8e8e8'}`,
                      color: isActive ? '#1677ff' : '#8c8c8c',
                    }}
                  >
                    {ws.widgets.length}
                  </Tag>
                )}
                {state.workspaces.length > 1 && isEditing && !(ws as any).isDefault && (!ws.isSystem || hasWsManage) && (
                  <Popconfirm
                    title={ws.isSystem ? '确定删除此系统工作区？所有角色都将失去访问权限' : '确定删除此工作区？'}
                    onConfirm={(e) => { e?.stopPropagation(); handleDeleteWorkspace(ws.id); }}
                    okText="删除"
                    cancelText="取消"
                    okButtonProps={{ danger: true }}
                  >
                    <CloseOutlined
                      onClick={(e) => e.stopPropagation()}
                      style={{ fontSize: 10, color: '#bfbfbf', marginLeft: 2 }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#ff4d4f'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#bfbfbf'; }}
                    />
                  </Popconfirm>
                )}
                {ws.isReadOnly && (
                  <Tooltip title="复制为可编辑副本">
                    <span
                      onClick={(e) => { e.stopPropagation(); handleDuplicateWorkspace(ws); }}
                      style={{ fontSize: 10, color: '#bfbfbf', marginLeft: 2, cursor: 'pointer' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#1677ff'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#bfbfbf'; }}
                    >
                      复制
                    </span>
                  </Tooltip>
                )}
              </div>
            </React.Fragment>
          );
        })}

        {/* 新建工作区按钮 */}
        <Tooltip title="新建工作区">
          <div
            onClick={handleAddWorkspace}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 12px',
              cursor: 'pointer',
              color: '#bfbfbf',
              borderBottom: '2px solid transparent',
              transition: 'color 0.12s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.color = '#1677ff'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.color = '#bfbfbf'; }}
          >
            <PlusOutlined style={{ fontSize: 13 }} />
          </div>
        </Tooltip>
      </div>

      {/* ========== 网格画布 ========== */}
      {activeWorkspace.widgets.length === 0 ? (
        <div style={{
          minHeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fafafa',
          border: '2px dashed #e0e0e0',
        }}>
          <Empty
            description={
              <Typography.Text type="secondary" style={{ fontSize: 14 }}>
                工作区为空，点击添加组件开始构建仪表盘
              </Typography.Text>
            }
          >
            <Button
              type="primary"
              size="large"
              icon={<AppstoreAddOutlined />}
              onClick={() => { setIsEditing(true); setDrawerOpen(true); }}
              style={{ borderRadius: 0 }}
            >
              添加组件
            </Button>
          </Empty>
        </div>
      ) : (
        <div
          ref={containerRef}
          style={{
            border: isEditing ? '2px dashed rgba(22,119,255,0.25)' : 'none',
            padding: isEditing ? 4 : 0,
            background: isEditing ? 'rgba(22,119,255,0.015)' : 'transparent',
            transition: 'border 0.15s, background 0.15s',
            minHeight: 400,
          }}
        >
          <ResponsiveGridLayout
            className={`dashboard-grid${isEditing ? ' editing' : ''}`}
            width={width || 1200}
            layouts={responsiveLayouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
            cols={BREAKPOINT_COLS}
            rowHeight={60}
            dragConfig={{ enabled: isEditing, handle: '.ant-card-head' }}
            resizeConfig={{ enabled: isEditing }}
            compactor={verticalCompactor}
            onLayoutChange={handleLayoutChange}
            margin={[6, 6] as const}
          >
            {activeWorkspace.widgets.map((widget, index) => (
              <div key={widget.instanceId}>
                {index < visibleCount ? (
                  <MemoizedWidget
                    widget={widget}
                    isEditing={isEditing}
                    onRemove={handleRemoveWidget}
                  />
                ) : (
                  <div style={{
                    height: '100%',
                    background: '#fafafa',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#d9d9d9',
                    fontSize: 12,
                  }}>
                    加载中...
                  </div>
                )}
              </div>
            ))}
          </ResponsiveGridLayout>
        </div>
      )
      }

      {/* ========== 组件库抽屉 ========== */}
      <Drawer
        title={
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>组件库</div>
            <Input
              placeholder="搜索组件名称..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              style={{ borderRadius: 0 }}
            />
          </div>
        }
        placement="right"
        width={460}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSearch(''); }}
        styles={{ body: { padding: '0 0 16px 0' } }}
      >
        <Collapse
          defaultActiveKey={filteredSections.slice(0, 3).map((s) => s.key)}
          ghost
          size="small"
          items={filteredSections.map((sec) => ({
            key: sec.key,
            label: (
              <span style={{ fontWeight: 600, fontSize: 13 }}>
                {sec.label}
                <Tag style={{ marginLeft: 8, fontSize: 11, borderRadius: 0 }}>{sec.widgets.length}</Tag>
              </span>
            ),
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 4px' }}>
                {sec.widgets.map((def) => {
                  const alreadyAdded = addedWidgetIds.has(def.id);
                  return (
                    <div
                      key={def.id}
                      onClick={() => handleToggleWidget(def.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 12px',
                        borderRadius: 0,
                        background: alreadyAdded ? '#f6ffed' : '#fafafa',
                        border: `1px solid ${alreadyAdded ? '#b7eb8f' : '#f0f0f0'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (alreadyAdded) {
                          e.currentTarget.style.borderColor = '#ff4d4f';
                          e.currentTarget.style.background = '#fff2f0';
                        } else {
                          e.currentTarget.style.borderColor = '#1677ff';
                          e.currentTarget.style.background = '#e6f4ff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = alreadyAdded ? '#b7eb8f' : '#f0f0f0';
                        e.currentTarget.style.background = alreadyAdded ? '#f6ffed' : '#fafafa';
                      }}
                    >
                      <span style={{ fontSize: 18, color: alreadyAdded ? '#52c41a' : '#1677ff', flexShrink: 0, width: 24, textAlign: 'center' }}>{def.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>
                          {def.name}
                          {alreadyAdded && <Tag color="green" style={{ marginLeft: 6, fontSize: 10, lineHeight: '16px', borderRadius: 0 }}>已添加</Tag>}
                        </div>
                        <div style={{ fontSize: 11, color: '#999', lineHeight: 1.3, marginTop: 2 }}>{def.description}</div>
                      </div>
                      {alreadyAdded ? (
                        <MinusCircleOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
                      ) : (
                        <PlusOutlined style={{ color: '#1677ff', fontSize: 14 }} />
                      )}
                    </div>
                  );
                })}
              </div>
            ),
          }))}
        />
      </Drawer>

      {/* 重命名 Modal */}
      <Modal
        title="重命名工作区"
        open={renameModal.open}
        onOk={handleRename}
        onCancel={() => setRenameModal({ open: false, id: '', name: '' })}
        width={360}
      >
        <Input
          value={renameModal.name}
          onChange={(e) => setRenameModal({ ...renameModal, name: e.target.value })}
          placeholder="输入新名称"
          maxLength={20}
          onPressEnter={handleRename}
          autoFocus
          style={{ borderRadius: 0 }}
        />
      </Modal>

      {/* 保存为系统工作区 Modal */}
      <Modal
        title="保存为系统工作区"
        open={saveSystemModalOpen}
        onOk={handleSaveAsSystem}
        onCancel={() => { setSaveSystemModalOpen(false); setSystemWsName(''); setSystemWsDesc(''); }}
        width={420}
        okText="保存"
      >
        <div style={{ marginBottom: 12 }}>
          <Typography.Text strong>名称</Typography.Text>
          <Input
            value={systemWsName}
            onChange={(e) => setSystemWsName(e.target.value)}
            placeholder="输入系统工作区名称"
            maxLength={50}
            style={{ borderRadius: 0, marginTop: 4 }}
          />
        </div>
        <div>
          <Typography.Text strong>描述（可选）</Typography.Text>
          <Input.TextArea
            value={systemWsDesc}
            onChange={(e) => setSystemWsDesc(e.target.value)}
            placeholder="输入描述"
            maxLength={200}
            rows={2}
            style={{ borderRadius: 0, marginTop: 4 }}
          />
        </div>
        <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
          保存后可在角色管理中将此工作区分配给指定角色
        </Typography.Text>
      </Modal>

      {/* ========== Grid 样式 ========== */}
      <style>{`
        /* 性能: 禁用所有过渡动画，减少 GPU 开销 */
        .dashboard-grid .react-grid-item {
          transition: none !important;
        }
        .dashboard-grid .react-grid-item.cssTransforms {
          transition: none !important;
        }
        .dashboard-grid .react-grid-item.react-draggable-dragging {
          z-index: 100;
          opacity: 0.85;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          transition: none !important;
        }
        .dashboard-grid .react-grid-placeholder {
          background: #1677ff !important;
          opacity: 0.1 !important;
          border-radius: 0;
          border: 2px solid #1677ff !important;
        }
        /* 编辑模式: 拖拽手势 */
        .dashboard-grid.editing .ant-card-head {
          cursor: move !important;
        }
        /* Resize 手柄 */
        .dashboard-grid .react-resizable-handle {
          background: none;
        }
        .dashboard-grid .react-resizable-handle::after {
          content: '';
          position: absolute;
          right: 6px;
          bottom: 6px;
          width: 10px;
          height: 10px;
          border-right: 2px solid #bbb;
          border-bottom: 2px solid #bbb;
        }
      `}</style>
    </PageContainer >
  );
};

export default DashboardBuilder;

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
import { useAccess, useModel } from '@umijs/max';
import { Button, message } from 'antd';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import './index.css';
import { useContainerWidth } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { getDefaultWorkspace } from '../dashboardStore';
import { buildDashboardWidgetLibrarySections } from './dashboardWidgetLibrarySections';
import DashboardCanvasSurface from './DashboardCanvasSurface';
import DashboardRenameWorkspaceModal from './DashboardRenameWorkspaceModal';
import DashboardSaveSystemWorkspaceModal from './DashboardSaveSystemWorkspaceModal';
import DashboardWidgetLibraryDrawer from './DashboardWidgetLibraryDrawer';
import DashboardWorkspaceHeader from './DashboardWorkspaceHeader';
import { autoArrangeLayouts, generateAllBreakpointLayouts, layoutsAreEqual } from './dashboardLayoutHelpers';
import { useDashboardWorkspaceManager } from './useDashboardWorkspaceManager';

// ==================== 主组件 ====================

const DashboardBuilder: React.FC = () => {
  const { containerRef, width } = useContainerWidth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { initialState } = useModel('@@initialState');
  const access = useAccess();
  const hasWsManage = !!access.canManageWorkspace;
  const hasDashboardConfig = !!access.canManageDashboardConfig;
  const {
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
  } = useDashboardWorkspaceManager({
    autoArrangeLayouts,
    canManageDashboardConfig: hasDashboardConfig,
    canManageSystemWorkspaces: hasWsManage,
    generateResponsiveLayouts: generateAllBreakpointLayouts,
    layoutsAreEqual,
  });

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

  // 缓存多断点响应式布局
  const addedWidgetIds = useMemo(
    () => new Set(activeWorkspace.widgets.map((w) => w.widgetId)),
    [activeWorkspace.widgets],
  );

  const filteredSections = useMemo(
    () => buildDashboardWidgetLibrarySections(search, access as Record<string, unknown>),
    [access, search],
  );

  const headerExtra = (
    <DashboardWorkspaceHeader
      activeWorkspace={activeWorkspace}
      hasDashboardConfig={hasDashboardConfig}
      hasWsManage={hasWsManage}
      isEditing={isEditing}
      onAddWorkspace={handleAddWorkspace}
      onAutoLayout={handleAutoLayout}
      onTabChange={handleTabChange}
      onDeleteWorkspace={handleDeleteWorkspace}
      onDuplicateWorkspace={handleDuplicateWorkspace}
      onOpenWidgetLibrary={() => setDrawerOpen(true)}
      onOpenRenameModal={(workspace) => setRenameModal({ open: true, id: workspace.id, name: workspace.name })}
      onOpenSaveSystemWorkspace={(workspace) => { setSystemWsName(workspace.name); setSaveSystemModalOpen(true); }}
      onToggleEdit={handleToggleEdit}
      workspaces={state.workspaces}
    />
  );

  return (
    <div className="dashboard-page">
      <DashboardCanvasSurface
        activeWorkspace={activeWorkspace}
        containerRef={containerRef}
        headerExtra={headerExtra}
        isEditing={isEditing}
        onLayoutChange={handleLayoutChange}
        onOpenAddWidgetDrawer={() => { setIsEditing(true); setDrawerOpen(true); }}
        onRemoveWidget={handleRemoveWidget}
        responsiveLayouts={responsiveLayouts}
        visibleCount={visibleCount}
        width={width || 1200}
        workspaceCount={state.workspaces.length}
      />

      <DashboardWidgetLibraryDrawer
        addedWidgetIds={addedWidgetIds}
        filteredSections={filteredSections}
        onClose={() => { setDrawerOpen(false); setSearch(''); }}
        onSearchChange={setSearch}
        onToggleWidget={handleToggleWidget}
        open={drawerOpen}
        search={search}
      />

      <DashboardRenameWorkspaceModal
        onCancel={() => setRenameModal({ open: false, id: '', name: '' })}
        onConfirm={handleRename}
        onNameChange={(value) => setRenameModal({ ...renameModal, name: value })}
        open={renameModal.open}
        value={renameModal.name}
      />

      <DashboardSaveSystemWorkspaceModal
        description={systemWsDesc}
        name={systemWsName}
        onCancel={() => { setSaveSystemModalOpen(false); setSystemWsName(''); setSystemWsDesc(''); }}
        onConfirm={handleSaveAsSystem}
        onDescriptionChange={setSystemWsDesc}
        onNameChange={setSystemWsName}
        open={saveSystemModalOpen}
      />

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
      `}
      </style>
    </div>
  );
};

export default DashboardBuilder;

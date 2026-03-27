import React from 'react';
import {
  AppstoreAddOutlined,
  BlockOutlined,
  CloseOutlined,
  EditOutlined,
  LockOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Popconfirm, Space, Tag, Tooltip } from 'antd';
import type { DashboardWorkspace } from '../dashboardStore';

type DashboardWorkspaceHeaderProps = {
  activeWorkspace: DashboardWorkspace;
  hasDashboardConfig: boolean;
  hasWsManage: boolean;
  isEditing: boolean;
  onAddWorkspace: () => void;
  onAutoLayout: () => void;
  onDeleteWorkspace: (id: string) => void;
  onDuplicateWorkspace: (workspace: DashboardWorkspace) => void;
  onOpenRenameModal: (workspace: DashboardWorkspace) => void;
  onOpenSaveSystemWorkspace: (workspace: DashboardWorkspace) => void;
  onOpenWidgetLibrary: () => void;
  onTabChange: (id: string) => void;
  onToggleEdit: () => void;
  workspaces: DashboardWorkspace[];
};

const DashboardWorkspaceHeader: React.FC<DashboardWorkspaceHeaderProps> = ({
  activeWorkspace,
  hasDashboardConfig,
  hasWsManage,
  isEditing,
  onAddWorkspace,
  onAutoLayout,
  onDeleteWorkspace,
  onDuplicateWorkspace,
  onOpenRenameModal,
  onOpenSaveSystemWorkspace,
  onOpenWidgetLibrary,
  onTabChange,
  onToggleEdit,
  workspaces,
}) => (
  <div style={{ display: 'flex', alignItems: 'stretch', borderTop: '1px solid #f0f0f0', background: '#fafbfc', padding: '0 16px 0 0' }}>
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 1, flex: 1, minWidth: 0 }}>
      {workspaces.map((workspace, index) => {
        const isActive = workspace.id === activeWorkspace.id;
        const isSystem = workspace.isSystem;
        const isDefault = Boolean(workspace.isDefault);
        const canRenameWorkspace = workspace.isSystem ? hasWsManage && !workspace.isReadOnly : hasDashboardConfig;
        const previousWorkspace = index > 0 ? workspaces[index - 1] : null;
        const showGroupDivider = previousWorkspace && previousWorkspace.isSystem !== workspace.isSystem;

        return (
          <React.Fragment key={workspace.id}>
            {showGroupDivider && (
              <div style={{ width: 2, background: 'linear-gradient(180deg, transparent 20%, #d9d9d9 50%, transparent 80%)', margin: '4px 3px' }} />
            )}
            <div
              onClick={() => onTabChange(workspace.id)}
              onDoubleClick={() => canRenameWorkspace && onOpenRenameModal(workspace)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 16px 7px 14px',
                cursor: 'pointer',
                userSelect: 'none',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? (isSystem ? (isDefault ? '#1677ff' : '#722ed1') : '#1677ff') : '#595959',
                background: isActive ? '#fff' : (isSystem ? (isDefault ? '#f0f5ff' : '#faf0ff') : 'transparent'),
                borderBottom: isActive ? `2px solid ${isSystem ? (isDefault ? '#1677ff' : '#722ed1') : '#1677ff'}` : '2px solid transparent',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                position: 'relative',
                marginBottom: isActive ? -1 : 0,
              }}
              onMouseEnter={(event) => {
                if (!isActive) {
                  event.currentTarget.style.color = isSystem ? (isDefault ? '#1677ff' : '#722ed1') : '#1677ff';
                  event.currentTarget.style.background = isSystem ? (isDefault ? '#e6f4ff' : '#f9f0ff') : '#f0f5ff';
                }
              }}
              onMouseLeave={(event) => {
                if (!isActive) {
                  event.currentTarget.style.color = '#595959';
                  event.currentTarget.style.background = isSystem ? (isDefault ? '#f0f5ff' : '#faf0ff') : 'transparent';
                }
              }}
            >
              {isSystem && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: isDefault ? '#1677ff' : '#722ed1', flexShrink: 0 }} />}
              <span>{workspace.name}</span>
              {isSystem && <Tag color={isDefault ? 'blue' : 'purple'} style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0, borderRadius: 2 }}>{isDefault ? '默认' : '系统'}</Tag>}
              {workspace.widgets.length > 0 && (
                <Tag style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0, borderRadius: 2, background: isActive ? '#e6f4ff' : '#f0f0f0', border: `1px solid ${isActive ? '#91caff' : '#e8e8e8'}`, color: isActive ? '#1677ff' : '#8c8c8c' }}>
                  {workspace.widgets.length}
                </Tag>
              )}
              {workspaces.length > 1 && isEditing && !isDefault && (!workspace.isSystem || hasWsManage) && (
                <Popconfirm
                  title={workspace.isSystem ? '确定删除此系统工作区？所有角色都将失去访问权限' : '确定删除此工作区？'}
                  onConfirm={(event) => { event?.stopPropagation(); onDeleteWorkspace(workspace.id); }}
                  okText="删除"
                  cancelText="取消"
                  okButtonProps={{ danger: true }}
                >
                  <CloseOutlined
                    onClick={(event) => event.stopPropagation()}
                    style={{ fontSize: 10, color: '#bfbfbf', marginLeft: 2 }}
                    onMouseEnter={(event) => { event.currentTarget.style.color = '#ff4d4f'; }}
                    onMouseLeave={(event) => { event.currentTarget.style.color = '#bfbfbf'; }}
                  />
                </Popconfirm>
              )}
              {workspace.isReadOnly && (
                <Tooltip title="复制为可编辑副本">
                  <span
                    onClick={(event) => { event.stopPropagation(); onDuplicateWorkspace(workspace); }}
                    style={{ fontSize: 10, color: '#bfbfbf', marginLeft: 2, cursor: 'pointer' }}
                    onMouseEnter={(event) => { event.currentTarget.style.color = '#1677ff'; }}
                    onMouseLeave={(event) => { event.currentTarget.style.color = '#bfbfbf'; }}
                  >
                    复制
                  </span>
                </Tooltip>
              )}
            </div>
          </React.Fragment>
        );
      })}

      <Tooltip title="新建工作区">
        <div
          aria-label="新建工作区"
          onClick={() => hasDashboardConfig && onAddWorkspace()}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px', cursor: hasDashboardConfig ? 'pointer' : 'not-allowed', color: '#bfbfbf', borderBottom: '2px solid transparent', transition: 'color 0.12s', opacity: hasDashboardConfig ? 1 : 0.45 }}
          onMouseEnter={(event) => { if (hasDashboardConfig) event.currentTarget.style.color = '#1677ff'; }}
          onMouseLeave={(event) => { event.currentTarget.style.color = '#bfbfbf'; }}
        >
          <PlusOutlined style={{ fontSize: 13 }} />
        </div>
      </Tooltip>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, padding: '0 0 0 12px' }}>
      <Space size={6}>
        {isEditing && (
          <>
            <Button type="primary" icon={<AppstoreAddOutlined />} onClick={onOpenWidgetLibrary} style={{ borderRadius: 0 }} size="small">添加组件</Button>
            <Tooltip title="按类别自动排列所有组件">
              <Button icon={<BlockOutlined />} onClick={onAutoLayout} style={{ borderRadius: 0 }} size="small">整理布局</Button>
            </Tooltip>
          </>
        )}
        {(activeWorkspace.isSystem ? hasWsManage && !activeWorkspace.isReadOnly : hasDashboardConfig) && (
          <Button
            type={isEditing ? 'primary' : 'default'}
            icon={isEditing ? <LockOutlined /> : <EditOutlined />}
            onClick={onToggleEdit}
            ghost={isEditing}
            size="small"
            style={{ borderRadius: 0, minWidth: 72 }}
          >
            {isEditing ? '锁定' : '编辑'}
          </Button>
        )}
        {hasWsManage && activeWorkspace.widgets.length > 0 && !activeWorkspace.isSystem && (
          <Button size="small" style={{ borderRadius: 0 }} onClick={() => onOpenSaveSystemWorkspace(activeWorkspace)}>
            保存为系统工作区
          </Button>
        )}
      </Space>
    </div>
  </div>
);

export default DashboardWorkspaceHeader;

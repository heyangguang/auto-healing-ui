import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { DashboardWorkspace } from '../dashboardStore';
import DashboardWorkspaceHeader from './DashboardWorkspaceHeader';

const noop = () => {};

const buildWorkspace = (overrides: Partial<DashboardWorkspace> = {}): DashboardWorkspace => ({
  id: 'ws-1',
  name: '工作区',
  widgets: [],
  layouts: [],
  ...overrides,
});

describe('DashboardWorkspaceHeader', () => {
  it('hides the edit button for system workspaces without workspace-manage permission', () => {
    const systemWorkspace = buildWorkspace({ id: 'sys-1', isSystem: true, name: '系统工作区' });

    render(
      <DashboardWorkspaceHeader
        activeWorkspace={systemWorkspace}
        hasDashboardConfig
        hasWsManage={false}
        isEditing={false}
        onAddWorkspace={noop}
        onAutoLayout={noop}
        onDeleteWorkspace={noop}
        onDuplicateWorkspace={noop}
        onOpenRenameModal={noop}
        onOpenSaveSystemWorkspace={noop}
        onOpenWidgetLibrary={noop}
        onTabChange={noop}
        onToggleEdit={noop}
        workspaces={[systemWorkspace]}
      />,
    );

    expect(screen.queryByRole('button', { name: '编辑' })).toBeNull();
  });

  it('keeps the edit button for user workspaces with dashboard-config permission', () => {
    const workspace = buildWorkspace();

    render(
      <DashboardWorkspaceHeader
        activeWorkspace={workspace}
        hasDashboardConfig
        hasWsManage={false}
        isEditing={false}
        onAddWorkspace={noop}
        onAutoLayout={noop}
        onDeleteWorkspace={noop}
        onDuplicateWorkspace={noop}
        onOpenRenameModal={noop}
        onOpenSaveSystemWorkspace={noop}
        onOpenWidgetLibrary={noop}
        onTabChange={noop}
        onToggleEdit={noop}
        workspaces={[workspace]}
      />,
    );

    expect(screen.getByRole('button', { name: /编辑/ })).toBeTruthy();
  });

  it('disables workspace creation without dashboard-config permission', () => {
    const onAddWorkspace = jest.fn();
    render(
      <DashboardWorkspaceHeader
        activeWorkspace={buildWorkspace()}
        hasDashboardConfig={false}
        hasWsManage={false}
        isEditing={false}
        onAddWorkspace={onAddWorkspace}
        onAutoLayout={noop}
        onDeleteWorkspace={noop}
        onDuplicateWorkspace={noop}
        onOpenRenameModal={noop}
        onOpenSaveSystemWorkspace={noop}
        onOpenWidgetLibrary={noop}
        onTabChange={noop}
        onToggleEdit={noop}
        workspaces={[buildWorkspace()]}
      />,
    );

    fireEvent.click(screen.getByLabelText('新建工作区'));
    expect(onAddWorkspace).not.toHaveBeenCalled();
  });

  it('keeps readonly system workspaces editable for workspace managers', () => {
    const workspace = buildWorkspace({ id: 'sys-1', isSystem: true, isReadOnly: true, name: '系统工作区' });

    render(
      <DashboardWorkspaceHeader
        activeWorkspace={workspace}
        hasDashboardConfig
        hasWsManage
        isEditing={false}
        onAddWorkspace={noop}
        onAutoLayout={noop}
        onDeleteWorkspace={noop}
        onDuplicateWorkspace={noop}
        onOpenRenameModal={noop}
        onOpenSaveSystemWorkspace={noop}
        onOpenWidgetLibrary={noop}
        onTabChange={noop}
        onToggleEdit={noop}
        workspaces={[workspace]}
      />,
    );

    expect(screen.getByRole('button', { name: /编辑/ })).toBeTruthy();
    expect(screen.queryByText('只读')).toBeNull();
    expect(screen.queryByText('复制')).toBeNull();
  });

  it('marks readonly system workspaces as copy-only for non-managers', () => {
    const workspace = buildWorkspace({ id: 'sys-1', isSystem: true, isReadOnly: true, name: '系统工作区' });

    render(
      <DashboardWorkspaceHeader
        activeWorkspace={workspace}
        hasDashboardConfig
        hasWsManage={false}
        isEditing={false}
        onAddWorkspace={noop}
        onAutoLayout={noop}
        onDeleteWorkspace={noop}
        onDuplicateWorkspace={noop}
        onOpenRenameModal={noop}
        onOpenSaveSystemWorkspace={noop}
        onOpenWidgetLibrary={noop}
        onTabChange={noop}
        onToggleEdit={noop}
        workspaces={[workspace]}
      />,
    );

    expect(screen.queryByRole('button', { name: /编辑/ })).toBeNull();
    expect(screen.getByText('只读')).toBeTruthy();
    expect(screen.getByText('复制')).toBeTruthy();
  });

  it('does not show delete for the local default workspace even in edit mode', () => {
    const workspace = buildWorkspace({ id: 'default', name: '运维总览' });

    render(
      <DashboardWorkspaceHeader
        activeWorkspace={workspace}
        hasDashboardConfig
        hasWsManage={false}
        isEditing
        onAddWorkspace={noop}
        onAutoLayout={noop}
        onDeleteWorkspace={noop}
        onDuplicateWorkspace={noop}
        onOpenRenameModal={noop}
        onOpenSaveSystemWorkspace={noop}
        onOpenWidgetLibrary={noop}
        onTabChange={noop}
        onToggleEdit={noop}
        workspaces={[workspace, buildWorkspace({ id: 'ws-2', name: '我的工作区' })]}
      />,
    );

    expect(screen.queryByLabelText('删除运维总览')).toBeNull();
    expect(screen.getByText('本地默认')).toBeTruthy();
  });
});

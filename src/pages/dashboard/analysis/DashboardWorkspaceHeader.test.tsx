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

  it('marks readonly system workspaces as copy-only', () => {
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

    expect(screen.queryByRole('button', { name: /编辑/ })).toBeNull();
    expect(screen.getByText('复制')).toBeTruthy();
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import RoleFormWorkspaceSection from './RoleFormWorkspaceSection';

describe('RoleFormWorkspaceSection', () => {
  it('shows the backend alignment error instead of an empty state', () => {
    render(
      <RoleFormWorkspaceSection
        allWorkspaces={[]}
        errorMessage="你没有权限管理工作区分配"
        selectedWorkspaceIds={[]}
        onToggle={jest.fn()}
      />,
    );

    expect(screen.getByText('你没有权限管理工作区分配')).toBeTruthy();
    expect(screen.queryByText('暂无系统工作区')).toBeNull();
  });
});

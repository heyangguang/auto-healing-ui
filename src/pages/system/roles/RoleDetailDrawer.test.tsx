import * as React from 'react';
import { render, screen } from '@testing-library/react';
import RoleDetailDrawer from './RoleDetailDrawer';

jest.mock('@umijs/max', () => ({
  history: {
    push: jest.fn(),
  },
}));

const baseRole = {
  id: 'role-1',
  name: 'ops_admin',
  display_name: '运维管理员',
  is_system: false,
  permissions: [],
  user_count: 1,
  _workspaceStatus: 'forbidden' as const,
  _workspaceMessage: '你没有权限查看工作区分配',
};

describe('RoleDetailDrawer', () => {
  it('hides workspace assignment action without workspace-manage permission', () => {
    render(
      <RoleDetailDrawer
        open
        role={baseRole as any}
        loading={false}
        access={{ canDeleteRole: true, canManageWorkspace: false, canUpdateRole: true }}
        onClose={jest.fn()}
        onDeleted={jest.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: '分配工作区' })).toBeNull();
    expect(screen.getByText('你没有权限查看工作区分配')).toBeTruthy();
  });
});

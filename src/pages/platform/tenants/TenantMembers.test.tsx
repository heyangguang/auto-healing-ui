import React from 'react';
import { message } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useAccess, useParams } from '@umijs/max';
import TenantMembersPage from './TenantMembers';
import {
  addTenantMember,
  getTenant,
  getTenantInvitations,
  getTenantMembers,
  updateTenantMemberRole,
} from '@/services/auto-healing/platform/tenants';
import { getPlatformUsersSimple } from '@/services/auto-healing/platform/users';
import { getSystemTenantRoles } from '@/services/auto-healing/roles';
import { useTenantMembersPageState } from './useTenantMembersPageState';

jest.mock('@umijs/max', () => ({
  history: { push: jest.fn() },
  useAccess: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('@/components/SubPageHeader', () => {
  const ReactLib = require('react');
  return (props: { title?: string; actions?: unknown }) => ReactLib.createElement(
    'div',
    null,
    ReactLib.createElement('h1', null, props.title),
    ReactLib.createElement('div', null, props.actions),
  );
});

jest.mock('@/services/auto-healing/platform/tenants', () => ({
  addTenantMember: jest.fn(),
  cancelTenantInvitation: jest.fn(),
  getTenant: jest.fn(),
  getTenantInvitations: jest.fn(),
  getTenantMembers: jest.fn(),
  inviteToTenant: jest.fn(),
  removeTenantMember: jest.fn(),
  updateTenantMemberRole: jest.fn(),
}));

jest.mock('@/services/auto-healing/platform/users', () => ({
  getPlatformUsersSimple: jest.fn(),
}));

jest.mock('@/services/auto-healing/roles', () => ({
  getSystemTenantRoles: jest.fn(),
}));

function TenantMembersHookHarness() {
  const state = useTenantMembersPageState('tenant-1');

  return React.createElement(
    'div',
    null,
    React.createElement(
      'div',
      { 'data-testid': 'available-users' },
      state.availableUsersForAdmin.map((user) => user.id).join(','),
    ),
    React.createElement(
      'button',
      { type: 'button', onClick: () => void state.handleSetTenantAdmin({ user_id: 'user-1' }) },
      'set-admin-user-1',
    ),
    React.createElement(
      'button',
      { type: 'button', onClick: () => void state.handleSetTenantAdmin({ user_id: 'user-2' }) },
      'set-admin-user-2',
    ),
  );
}

describe('tenant members page', () => {
  const messageErrorSpy = jest.spyOn(message, 'error').mockImplementation(jest.fn());

  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ id: 'tenant-1' });
    (useAccess as jest.Mock).mockReturnValue({ canManagePlatformTenants: true });
    (getTenant as jest.Mock).mockResolvedValue({
      id: 'tenant-1',
      name: 'Tenant A',
      code: 'tenant-a',
      status: 'active',
    });
    (getTenantInvitations as jest.Mock).mockResolvedValue({ data: [], total: 0 });
    (getPlatformUsersSimple as jest.Mock).mockResolvedValue([]);
    (getTenantMembers as jest.Mock).mockResolvedValue([]);
    (getSystemTenantRoles as jest.Mock).mockResolvedValue([
      { id: 'role-admin', name: 'admin', display_name: '管理员' },
    ]);
  });

  afterAll(() => {
    messageErrorSpy.mockRestore();
  });

  it('shows member load failure instead of empty-member success state', async () => {
    (getTenantMembers as jest.Mock).mockRejectedValueOnce(new Error('members failed'));
    (getSystemTenantRoles as jest.Mock).mockResolvedValue([]);

    render(React.createElement(TenantMembersPage));

    expect(await screen.findByText('成员加载失败，请刷新页面重试')).toBeTruthy();
  });

  it('shows explicit role-load failure in add-member modal', async () => {
    (getTenantMembers as jest.Mock).mockResolvedValue([]);
    (getSystemTenantRoles as jest.Mock).mockRejectedValueOnce(new Error('roles failed'));

    render(React.createElement(TenantMembersPage));

    await waitFor(() => {
      expect(messageErrorSpy).toHaveBeenCalledWith('租户角色加载失败，请刷新页面后重试');
    });
  });

  it('promotes an existing member to admin instead of trying to add them again', async () => {
    (getTenantMembers as jest.Mock).mockResolvedValue([
      { user_id: 'user-1', role_id: 'role-ops', role: { name: 'ops' } },
    ]);
    (getPlatformUsersSimple as jest.Mock).mockResolvedValue([
      { id: 'user-1', username: 'jane', display_name: 'Jane', status: 'active' },
    ]);
    (updateTenantMemberRole as jest.Mock).mockResolvedValue({ success: true });

    render(React.createElement(TenantMembersHookHarness));

    await waitFor(() => {
      expect(screen.getByTestId('available-users').textContent).toContain('user-1');
    });

    fireEvent.click(screen.getByText('set-admin-user-1'));

    await waitFor(() => {
      expect(updateTenantMemberRole).toHaveBeenCalledWith('tenant-1', 'user-1', { role_id: 'role-admin' });
    });
    expect(addTenantMember).not.toHaveBeenCalled();
  });

  it('adds a non-member with the admin role when setting tenant admin', async () => {
    (getTenantMembers as jest.Mock).mockResolvedValue([]);
    (getPlatformUsersSimple as jest.Mock).mockResolvedValue([
      { id: 'user-2', username: 'jack', display_name: 'Jack', status: 'active' },
    ]);
    (addTenantMember as jest.Mock).mockResolvedValue({ success: true });

    render(React.createElement(TenantMembersHookHarness));

    await waitFor(() => {
      expect(screen.getByTestId('available-users').textContent).toContain('user-2');
    });

    fireEvent.click(screen.getByText('set-admin-user-2'));

    await waitFor(() => {
      expect(addTenantMember).toHaveBeenCalledWith('tenant-1', { user_id: 'user-2', role_id: 'role-admin' });
    });
  });
});

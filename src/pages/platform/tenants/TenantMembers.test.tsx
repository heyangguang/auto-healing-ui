import React from 'react';
import { message } from 'antd';
import { render, screen, waitFor } from '@testing-library/react';
import { useAccess, useParams } from '@umijs/max';
import TenantMembersPage from './TenantMembers';
import {
  getTenant,
  getTenantInvitations,
  getTenantMembers,
} from '@/services/auto-healing/platform/tenants';
import { getPlatformUsersSimple } from '@/services/auto-healing/platform/users';
import { getSystemTenantRoles } from '@/services/auto-healing/roles';

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

describe('tenant members page', () => {
  const messageErrorSpy = jest.spyOn(message, 'error').mockImplementation(jest.fn());

  beforeEach(() => {
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
});

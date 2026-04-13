import { renderHook, waitFor } from '@testing-library/react';
import { useRoleFormData } from './useRoleFormData';
import {
  getRoleWorkspaces,
  listSystemWorkspaces,
} from '@/services/auto-healing/dashboard';
import { getPermissionTree } from '@/services/auto-healing/permissions';
import { getSimpleUsers, getUsers } from '@/services/auto-healing/users';
import { getRole } from '@/services/auto-healing/roles';

jest.mock('@/services/auto-healing/dashboard', () => ({
  getRoleWorkspaces: jest.fn(),
  listSystemWorkspaces: jest.fn(),
}));

jest.mock('@/services/auto-healing/permissions', () => ({
  getPermissionTree: jest.fn(),
}));

jest.mock('@/services/auto-healing/users', () => ({
  getSimpleUsers: jest.fn(),
  getUsers: jest.fn(),
}));

jest.mock('@/services/auto-healing/roles', () => ({
  getRole: jest.fn(),
}));

const form = {
  setFieldsValue: jest.fn(),
} as any;

describe('useRoleFormData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getPermissionTree as jest.Mock).mockResolvedValue({});
    (getSimpleUsers as jest.Mock).mockResolvedValue([]);
    (getUsers as jest.Mock).mockResolvedValue({ data: [], total: 0 });
    (getRole as jest.Mock).mockResolvedValue({
      description: '',
      display_name: '运维管理员',
      is_system: false,
      name: 'ops_admin',
      permissions: [],
    });
  });

  it('skips workspace requests when the current user cannot manage workspaces', async () => {
    const { result } = renderHook(() => useRoleFormData({
      canManageWorkspace: false,
      form,
      isEdit: true,
      roleId: 'role-1',
    }));

    await waitFor(() => {
      expect(result.current.pageLoading).toBe(false);
    });

    expect(listSystemWorkspaces).not.toHaveBeenCalled();
    expect(getRoleWorkspaces).not.toHaveBeenCalled();
    expect(result.current.workspaceState).toEqual({
      errorMessage: '你没有权限管理工作区分配',
      status: 'forbidden',
    });
  });

  it('marks workspace state as forbidden when backend rejects workspace loading', async () => {
    (listSystemWorkspaces as jest.Mock).mockRejectedValue({
      response: { status: 403 },
    });

    const { result } = renderHook(() => useRoleFormData({
      canManageWorkspace: true,
      form,
      isEdit: false,
    }));

    await waitFor(() => {
      expect(result.current.pageLoading).toBe(false);
    });

    expect(result.current.workspaceState).toEqual({
      errorMessage: '你没有权限管理工作区分配',
      status: 'forbidden',
    });
  });
});

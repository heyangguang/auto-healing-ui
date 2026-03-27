import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import PermissionsPage from './index';
import { getPermissions } from '@/services/auto-healing/permissions';

jest.mock('@/services/auto-healing/permissions', () => ({
  getPermissions: jest.fn(),
}));

jest.mock('@/components/StandardTable', () => {
  const mockReact = require('react');
  return (props: any) => mockReact.createElement('div', null, props.children);
});

describe('system permissions page', () => {
  it('renders grouped permission cards after loading', async () => {
    (getPermissions as jest.Mock).mockResolvedValueOnce([
      {
        id: 'perm-1',
        name: '查看用户',
        code: 'user:list',
        module: 'user',
        resource: 'user',
        action: 'read',
      },
    ]);

    render(React.createElement(PermissionsPage));

    expect(await screen.findByText('查看用户')).toBeTruthy();
    expect(screen.getByText('user:list')).toBeTruthy();
  });

  it('shows explicit failure feedback instead of empty-data success state', async () => {
    const errorSpy = jest.spyOn(message, 'error').mockImplementation(jest.fn());
    (getPermissions as jest.Mock).mockRejectedValueOnce(new Error('network failed'));

    render(React.createElement(PermissionsPage));

    await waitFor(() => {
      expect(screen.getByText('权限数据加载失败，请刷新重试')).toBeTruthy();
    });
    expect(errorSpy).toHaveBeenCalledWith('权限数据加载失败，请刷新重试');
    errorSpy.mockRestore();
  });
});

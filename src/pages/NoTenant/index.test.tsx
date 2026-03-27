import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import NoTenantPage from './index';
import { logout } from '@/services/auto-healing/auth';
import { TokenManager } from '@/requestErrorConfig';

const mockNavigate = jest.fn();

jest.mock('@@/exports', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('@/services/auto-healing/auth', () => ({
  logout: jest.fn(),
}));

jest.mock('@/requestErrorConfig', () => ({
  TokenManager: {
    clearTokens: jest.fn(),
    getRefreshToken: jest.fn(),
  },
}));

describe('NoTenantPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('revokes the current session before clearing local auth state', async () => {
    (TokenManager.getRefreshToken as jest.Mock).mockReturnValue('refresh-token');
    (logout as jest.Mock).mockResolvedValue({ message: 'ok' });

    render(React.createElement(NoTenantPage));
    fireEvent.click(screen.getByRole('button', { name: '退出登录' }));

    await waitFor(() => {
      expect(logout).toHaveBeenCalledWith({ refresh_token: 'refresh-token' });
      expect(TokenManager.clearTokens).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/user/login');
    });
  });
});

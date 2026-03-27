import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import RegisterPage from './index';
import { validateInvitationToken } from '@/services/auto-healing/auth';

jest.mock('@umijs/max', () => ({
  Helmet: ({ children }: { children?: unknown }) => {
    const mockReact = require('react');
    return mockReact.createElement(mockReact.Fragment, null, children);
  },
  Link: ({ children, to }: { children?: unknown; to: string }) => {
    const mockReact = require('react');
    return mockReact.createElement('a', { href: to }, children);
  },
  history: { push: jest.fn() },
}));

jest.mock('@/services/auto-healing/auth', () => ({
  registerByInvitation: jest.fn(),
  validateInvitationToken: jest.fn(),
}));

describe('RegisterPage', () => {
  it('renders the invalid invitation state when token validation fails', async () => {
    window.history.pushState({}, '', '/user/register?token=expired-token');
    (validateInvitationToken as jest.Mock).mockRejectedValue({
      response: { data: { message: '邀请已过期' } },
    });

    render(React.createElement(RegisterPage));

    expect(await screen.findByText('无法注册')).toBeTruthy();
    expect(screen.getByText('邀请已过期')).toBeTruthy();
    await waitFor(() => {
      expect(validateInvitationToken).toHaveBeenCalledWith('expired-token');
    });
  });
});

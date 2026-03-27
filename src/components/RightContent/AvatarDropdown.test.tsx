import React from 'react';
import { render, screen } from '@testing-library/react';
import { AvatarDropdown } from './AvatarDropdown';

const mockHeaderDropdown = jest.fn((props) =>
  React.createElement('div', { 'data-testid': 'header-dropdown' }, props.children),
);

jest.mock('@umijs/max', () => ({
  history: {
    push: jest.fn(),
  },
  useModel: jest.fn(() => ({
    initialState: {
      currentUser: {
        username: 'ops',
        display_name: '运维用户',
      },
    },
    setInitialState: jest.fn(),
  })),
}));

jest.mock('../HeaderDropdown', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => mockHeaderDropdown(props),
}));

jest.mock('@/services/auto-healing/auth', () => ({
  logout: jest.fn(),
}));

jest.mock('@/requestErrorConfig', () => ({
  TokenManager: {
    getRefreshToken: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

describe('AvatarDropdown', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('configures the user menu with an accessible label and click trigger', () => {
    render(
      React.createElement(
        AvatarDropdown,
        { menu: true },
        React.createElement('button', { type: 'button', 'aria-label': '打开用户菜单' }, '账户'),
      ),
    );

    expect(screen.getByRole('button', { name: '打开用户菜单' })).toBeTruthy();

    const props = mockHeaderDropdown.mock.calls[0][0] as {
      menu: { 'aria-label': string };
      trigger: string[];
    };

    expect(props.trigger).toEqual(['click']);
    expect(props.menu['aria-label']).toBe('用户菜单');
  });
});

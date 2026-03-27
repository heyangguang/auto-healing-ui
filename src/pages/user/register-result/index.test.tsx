import React from 'react';
import { render, screen } from '@testing-library/react';
import RegisterResult from './index';

jest.mock('@umijs/max', () => ({
  Link: ({ children, to }: any) => {
    const mockReact = require('react');
    return mockReact.createElement('a', { href: to }, children);
  },
  useSearchParams: () => [new URLSearchParams(globalThis.location.search)],
}), { virtual: true });

describe('RegisterResult', () => {
  it('renders a warning state when account is missing', () => {
    window.history.pushState({}, '', '/user/register-result');

    render(React.createElement(RegisterResult));

    expect(screen.getByText('注册结果不可用')).toBeTruthy();
    expect(screen.getByText('当前页面缺少账号信息，无法确认注册结果。请返回登录页重新进入。')).toBeTruthy();
  });

  it('renders invitation success copy without activation-mail guidance', () => {
    window.history.pushState({}, '', '/user/register-result?account=ops%40example.com');

    render(React.createElement(RegisterResult));

    expect(screen.getByText('你的登录账号：ops@example.com 已创建')).toBeTruthy();
    expect(screen.getByText('邀请注册已完成，请使用刚刚设置的账号密码登录。')).toBeTruthy();
    expect(screen.getByRole('button', { name: '前往登录' })).toBeTruthy();
    expect(screen.queryByText(/激活邮件/)).toBeNull();
  });
});

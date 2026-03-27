import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TenantSwitcher from './index';
import { request } from '@umijs/max';

type TenantSearchResult = {
  id: string;
  name: string;
  code: string;
};

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

describe('TenantSwitcher', () => {
  beforeEach(() => {
    localStorage.setItem('tenant-storage', JSON.stringify({ currentTenantId: 'tenant-1' }));
    (request as jest.Mock).mockImplementation((_url: string, options?: { params?: { name?: string } }) => {
      if (options?.params?.name) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({
        data: Array.from({ length: 6 }, (_, index) => ({
          id: `tenant-${index + 1}`,
          name: `Tenant ${index + 1}`,
          code: `T${index + 1}`,
        })),
      });
    });
  });

  it('uses accessible trigger and listbox semantics', async () => {
    render(React.createElement(TenantSwitcher));

    const trigger = await screen.findByRole('button', { name: '当前租户 Tenant 1，点击切换' });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('listbox', { name: '租户列表' })).toBeTruthy();
    });

    expect(screen.getByLabelText('搜索租户')).toBeTruthy();
    expect(screen.getAllByRole('option')).toHaveLength(6);
    expect(trigger.getAttribute('aria-controls')).toBe('tenant-switcher-panel');
  });

  it('keeps the latest tenant search result when earlier requests resolve late', async () => {
    let resolveAlpha!: (value: { data: TenantSearchResult[] }) => void;
    let resolveBeta!: (value: { data: TenantSearchResult[] }) => void;

    (request as jest.Mock).mockImplementation((_url: string, options?: { params?: { name?: string } }) => {
      if (options?.params?.name === 'alpha') {
        return new Promise((resolve) => {
          resolveAlpha = resolve;
        });
      }
      if (options?.params?.name === 'beta') {
        return new Promise((resolve) => {
          resolveBeta = resolve;
        });
      }
      return Promise.resolve({
        data: Array.from({ length: 6 }, (_, index) => ({
          id: `tenant-${index + 1}`,
          name: `Tenant ${index + 1}`,
          code: `T${index + 1}`,
        })),
      });
    });

    render(React.createElement(TenantSwitcher));

    fireEvent.click(await screen.findByRole('button', { name: '当前租户 Tenant 1，点击切换' }));
    fireEvent.change(screen.getByLabelText('搜索租户'), { target: { value: 'alpha' } });
    fireEvent.change(screen.getByLabelText('搜索租户'), { target: { value: 'beta' } });

    resolveBeta({
      data: [{ id: 'tenant-beta', name: 'Tenant Beta', code: 'BETA' }],
    });

    expect(await screen.findByText('Tenant Beta')).toBeTruthy();

    resolveAlpha({
      data: [{ id: 'tenant-alpha', name: 'Tenant Alpha', code: 'ALPHA' }],
    });

    await waitFor(() => {
      expect(screen.queryByText('Tenant Alpha')).toBeNull();
    });
    expect(screen.getByText('Tenant Beta')).toBeTruthy();
  });
});

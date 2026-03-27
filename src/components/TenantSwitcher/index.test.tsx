import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TenantSwitcher from './index';
import { getCurrentUserTenants } from '@/services/auto-healing/commonTenants';

type TenantSearchResult = {
  id: string;
  name: string;
  code: string;
};

jest.mock('@/services/auto-healing/commonTenants', () => ({
  getCurrentUserTenants: jest.fn(),
}));

describe('TenantSwitcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('tenant-storage', JSON.stringify({ currentTenantId: 'tenant-1' }));
    (getCurrentUserTenants as jest.Mock).mockImplementation((options?: { name?: string }) => {
      if (options?.name) {
        return Promise.resolve([]);
      }
      return Promise.resolve(
        Array.from({ length: 6 }, (_, index) => ({
          id: `tenant-${index + 1}`,
          name: `Tenant ${index + 1}`,
          code: `T${index + 1}`,
        })),
      );
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
    let resolveAlpha!: (value: TenantSearchResult[]) => void;
    let resolveBeta!: (value: TenantSearchResult[]) => void;

    (getCurrentUserTenants as jest.Mock).mockImplementation((options?: { name?: string }) => {
      if (options?.name === 'alpha') {
        return new Promise((resolve) => {
          resolveAlpha = resolve;
        });
      }
      if (options?.name === 'beta') {
        return new Promise((resolve) => {
          resolveBeta = resolve;
        });
      }
      return Promise.resolve(
        Array.from({ length: 6 }, (_, index) => ({
          id: `tenant-${index + 1}`,
          name: `Tenant ${index + 1}`,
          code: `T${index + 1}`,
        })),
      );
    });

    render(React.createElement(TenantSwitcher));

    fireEvent.click(await screen.findByRole('button', { name: '当前租户 Tenant 1，点击切换' }));
    fireEvent.change(screen.getByLabelText('搜索租户'), { target: { value: 'alpha' } });
    fireEvent.change(screen.getByLabelText('搜索租户'), { target: { value: 'beta' } });

    resolveBeta([{ id: 'tenant-beta', name: 'Tenant Beta', code: 'BETA' }]);

    expect(await screen.findByText('Tenant Beta')).toBeTruthy();

    resolveAlpha([{ id: 'tenant-alpha', name: 'Tenant Alpha', code: 'ALPHA' }]);

    await waitFor(() => {
      expect(screen.queryByText('Tenant Alpha')).toBeNull();
    });
    expect(screen.getByText('Tenant Beta')).toBeTruthy();
  });

  it('shows an explicit error instead of falling back to stale cached tenants on initial load failure', async () => {
    localStorage.setItem('tenant-storage', JSON.stringify({
      currentTenantId: 'tenant-1',
      tenants: [{ id: 'tenant-stale', name: 'Tenant Stale', code: 'STALE' }],
    }));
    (getCurrentUserTenants as jest.Mock).mockRejectedValueOnce(new Error('boom'));

    render(React.createElement(TenantSwitcher));

    fireEvent.click(await screen.findByRole('button', { name: '选择租户' }));

    expect(await screen.findByText('租户列表加载失败，请刷新重试')).toBeTruthy();
    expect(screen.queryByText('Tenant Stale')).toBeNull();
  });

  it('clears stale search results and shows an explicit search error on failure', async () => {
    let rejectBeta!: (error: Error) => void;

    (getCurrentUserTenants as jest.Mock).mockImplementation((options?: { name?: string }) => {
      if (options?.name === 'alpha') {
        return Promise.resolve([
          { id: 'tenant-alpha', name: 'Tenant Alpha', code: 'ALPHA' },
        ]);
      }
      if (options?.name === 'beta') {
        return new Promise((_, reject) => {
          rejectBeta = reject;
        });
      }
      return Promise.resolve(
        Array.from({ length: 6 }, (_, index) => ({
          id: `tenant-${index + 1}`,
          name: `Tenant ${index + 1}`,
          code: `T${index + 1}`,
        })),
      );
    });

    render(React.createElement(TenantSwitcher));

    fireEvent.click(await screen.findByRole('button', { name: '当前租户 Tenant 1，点击切换' }));
    fireEvent.change(screen.getByLabelText('搜索租户'), { target: { value: 'alpha' } });
    expect(await screen.findByText('Tenant Alpha')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('搜索租户'), { target: { value: 'beta' } });
    rejectBeta(new Error('search failed'));

    expect(await screen.findByText('租户搜索失败，请重试')).toBeTruthy();
    expect(screen.queryByText('Tenant Alpha')).toBeNull();
  });
});

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import GlobalSearch from './index';
import { history, useAccess } from '@umijs/max';
import { globalSearch } from '@/services/auto-healing/search';

type SearchResultItemFixture = {
  id: string;
  title: string;
  description?: string;
  path?: string;
  extra?: Record<string, any>;
};

jest.mock('@umijs/max', () => ({
  history: { push: jest.fn() },
  useAccess: jest.fn(),
}));

jest.mock('@/services/auto-healing/search', () => ({
  globalSearch: jest.fn(),
}));

describe('GlobalSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (useAccess as jest.Mock).mockReturnValue({
      canUpdateFlow: true,
      canViewInstances: true,
      canViewTaskDetail: true,
      canViewPlaybooks: true,
    });
    (globalSearch as jest.Mock).mockResolvedValue({
      total_count: 2,
      results: [
        {
          category: 'playbooks',
          category_label: 'Playbooks',
          total: 2,
          items: [
            {
              id: 'playbook-1',
              title: 'Deploy Playbook',
              description: 'Deploy description',
              path: '/execution/playbooks/playbook-1',
              extra: { status: 'ready' },
            },
          ],
        },
      ],
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('exposes combobox and option semantics for search results', async () => {
    render(React.createElement(GlobalSearch));

    const input = screen.getByLabelText('全局搜索');
    fireEvent.change(input, { target: { value: 'deploy' } });
    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(globalSearch).toHaveBeenCalledWith({ q: 'deploy', limit: 5 });
    });

    await waitFor(() => {
      expect(screen.getByRole('listbox', { name: '全局搜索结果' })).toBeTruthy();
    });

    expect(input.getAttribute('aria-controls')).toBe('global-search-results');
    expect(screen.getByRole('option', { name: /Deploy Playbook/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: '前往Playbooks列表页' })).toBeTruthy();

    fireEvent.click(screen.getByRole('option', { name: /Deploy Playbook/i }));

    expect(history.push).toHaveBeenCalledWith('/execution/playbooks');
  });

  it('keeps the latest search results when earlier requests resolve late', async () => {
    let resolveOld!: (value: {
      total_count: number;
      results: Array<{
        category: string;
        category_label: string;
        total: number;
        items: SearchResultItemFixture[];
      }>;
    }) => void;
    let resolveNew!: (value: {
      total_count: number;
      results: Array<{
        category: string;
        category_label: string;
        total: number;
        items: SearchResultItemFixture[];
      }>;
    }) => void;

    (globalSearch as jest.Mock).mockImplementation(({ q }: { q: string }) => {
      if (q === 'old') {
        return new Promise((resolve) => {
          resolveOld = resolve;
        });
      }
      if (q === 'new') {
        return new Promise((resolve) => {
          resolveNew = resolve;
        });
      }
      return Promise.resolve({ total_count: 0, results: [] });
    });

    render(React.createElement(GlobalSearch));

    const input = screen.getByLabelText('全局搜索');

    fireEvent.change(input, { target: { value: 'old' } });
    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    fireEvent.change(input, { target: { value: 'new' } });
    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    resolveNew({
      total_count: 1,
      results: [
        {
          category: 'playbooks',
          category_label: 'Playbooks',
          total: 1,
          items: [
            {
              id: 'new-item',
              title: 'New Result',
              description: 'latest',
              path: '/execution/playbooks',
              extra: { status: 'ready' },
            },
          ],
        },
      ],
    });

    expect(await screen.findByRole('option', { name: /New Result/i })).toBeTruthy();

    resolveOld({
      total_count: 1,
      results: [
        {
          category: 'playbooks',
          category_label: 'Playbooks',
          total: 1,
          items: [
            {
              id: 'old-item',
              title: 'Old Result',
              description: 'stale',
              path: '/execution/playbooks',
              extra: { status: 'ready' },
            },
          ],
        },
      ],
    });

    await waitFor(() => {
      expect(screen.queryByRole('option', { name: /Old Result/i })).toBeNull();
    });
    expect(screen.getByRole('option', { name: /New Result/i })).toBeTruthy();
  });
});

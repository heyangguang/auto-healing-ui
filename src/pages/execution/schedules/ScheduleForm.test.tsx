import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import ScheduleForm from './ScheduleForm';
import { history, useAccess, useParams } from '@umijs/max';
import {
  createExecutionSchedule,
  getExecutionSchedule,
  getExecutionTasks,
  updateExecutionSchedule,
} from '@/services/auto-healing/execution';
import { getPlaybook } from '@/services/auto-healing/playbooks';
import { getSecretsSources } from '@/services/auto-healing/secrets';
import {
  getCachedNotificationChannelInventory,
  getCachedNotificationTemplateInventory,
} from '@/utils/selectorInventoryCache';

jest.mock('@umijs/max', () => ({
  history: { push: jest.fn() },
  useAccess: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('@/services/auto-healing/execution', () => ({
  getExecutionSchedule: jest.fn(),
  createExecutionSchedule: jest.fn(),
  updateExecutionSchedule: jest.fn(),
  getExecutionTasks: jest.fn(),
}));

jest.mock('@/services/auto-healing/playbooks', () => ({
  getPlaybook: jest.fn(),
}));

jest.mock('@/services/auto-healing/secrets', () => ({
  getSecretsSources: jest.fn(),
}));

jest.mock('@/utils/selectorInventoryCache', () => ({
  getCachedNotificationChannelInventory: jest.fn(),
  getCachedNotificationTemplateInventory: jest.fn(),
}));

jest.mock('@/components/SubPageHeader', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ title, actions }: any) => React.createElement(
      'div',
      null,
      React.createElement('div', null, title),
      actions,
    ),
  };
});

jest.mock('@/components/NotificationSelector/NotificationConfigDisplay', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'notification-display' }),
  };
});

jest.mock('./ScheduleInfoCard', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'schedule-info-card' }),
  };
});

jest.mock('./ScheduleOverridesCard', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'schedule-overrides-card' }),
  };
});

jest.mock('./ScheduleTemplateSelection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'schedule-template-selection' }),
  };
});

jest.mock('./ScheduleSelectedTemplateCard', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ selectedTemplate }: any) => React.createElement(
      'div',
      { 'data-testid': 'selected-template' },
      selectedTemplate?.name || 'none',
    ),
  };
});

jest.mock('./ScheduleVariableOverridesCard', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ loadingPlaybook, templatePlaybook, displayValues }: any) => React.createElement(
      'div',
      { 'data-testid': 'schedule-variable-card' },
      React.createElement('div', { 'data-testid': 'schedule-loading' }, String(loadingPlaybook)),
      React.createElement('div', { 'data-testid': 'schedule-playbook' }, templatePlaybook?.name || 'none'),
      React.createElement('div', { 'data-testid': 'schedule-values' }, JSON.stringify(displayValues)),
    ),
  };
});

jest.mock('@/utils/fetchAllPages', () => ({
  fetchAllPages: jest.fn(),
}));

import { fetchAllPages } from '@/utils/fetchAllPages';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

describe('ScheduleForm', () => {
  let currentParams: { id?: string };

  beforeEach(() => {
    currentParams = { id: 'schedule-a' };
    (useParams as jest.Mock).mockImplementation(() => currentParams);
    (useAccess as jest.Mock).mockReturnValue({
      canCreateTask: true,
      canUpdateTask: true,
    });
    (getSecretsSources as jest.Mock).mockResolvedValue({ data: [] });
    (getCachedNotificationChannelInventory as jest.Mock).mockResolvedValue([]);
    (getCachedNotificationTemplateInventory as jest.Mock).mockResolvedValue([]);
    (createExecutionSchedule as jest.Mock).mockResolvedValue({ id: 'schedule-a' });
    (updateExecutionSchedule as jest.Mock).mockResolvedValue({ id: 'schedule-a' });
  });

  it('does not leak stale template or playbook state across edit route changes', async () => {
    const templateA = {
      id: 'task-a',
      name: 'Template A',
      playbook_id: 'playbook-a',
      executor_type: 'local',
      notification_config: {},
      extra_vars: { region: 'cn' },
      target_hosts: '10.0.0.8',
      created_at: '2026-03-24T09:00:00Z',
      updated_at: '2026-03-24T09:00:00Z',
    } as unknown as AutoHealing.ExecutionTask;
    const templateB = {
      id: 'task-b',
      name: 'Template B',
      playbook_id: undefined,
      executor_type: 'local',
      notification_config: {},
      extra_vars: { safe_mode: true },
      target_hosts: '',
      created_at: '2026-03-24T10:00:00Z',
      updated_at: '2026-03-24T10:00:00Z',
    } as unknown as AutoHealing.ExecutionTask;
    const scheduleA = {
      id: 'schedule-a',
      task_id: 'task-a',
      name: 'Schedule A',
      schedule_type: 'cron',
      schedule_expr: '0 * * * *',
      scheduled_at: undefined,
      status: 'pending',
      next_run_at: '2026-03-28T00:00:00Z',
      last_run_at: undefined,
      enabled: true,
      created_at: '2026-03-24T09:00:00Z',
      updated_at: '2026-03-24T09:00:00Z',
      extra_vars_override: { region: 'us' },
      secrets_source_ids: [],
      skip_notification: false,
    } as unknown as AutoHealing.ExecutionSchedule;
    const scheduleB = {
      id: 'schedule-b',
      task_id: 'task-b',
      name: 'Schedule B',
      schedule_type: 'cron',
      schedule_expr: '0 * * * *',
      scheduled_at: undefined,
      status: 'pending',
      next_run_at: '2026-03-28T01:00:00Z',
      last_run_at: undefined,
      enabled: true,
      created_at: '2026-03-24T10:00:00Z',
      updated_at: '2026-03-24T10:00:00Z',
      extra_vars_override: { safe_mode: false },
      secrets_source_ids: [],
      skip_notification: false,
    } as unknown as AutoHealing.ExecutionSchedule;
    const playbookDeferred = createDeferred<{ data: AutoHealing.Playbook }>();

    (fetchAllPages as jest.Mock)
      .mockResolvedValueOnce([templateA])
      .mockResolvedValueOnce([templateB]);
    (getExecutionSchedule as jest.Mock).mockImplementation((id: string) => Promise.resolve(
      id === 'schedule-a' ? scheduleA : scheduleB,
    ));
    (getPlaybook as jest.Mock).mockImplementation(() => playbookDeferred.promise);
    (getExecutionTasks as jest.Mock).mockResolvedValue({ data: [], total: 0, page: 1, page_size: 1 });

    const { rerender } = render(React.createElement(ScheduleForm));

    await waitFor(() => {
      expect(getExecutionSchedule).toHaveBeenCalledWith('schedule-a');
    });
    await waitFor(() => {
      expect(getPlaybook).toHaveBeenCalledWith('playbook-a');
    });

    currentParams = { id: 'schedule-b' };
    rerender(React.createElement(ScheduleForm));

    await waitFor(() => {
      expect(getExecutionSchedule).toHaveBeenCalledWith('schedule-b');
    });
    await waitFor(() => {
      expect(screen.getByTestId('selected-template').textContent).toContain('Template B');
    });
    await waitFor(() => {
      expect(screen.getByTestId('schedule-playbook').textContent).toContain('none');
    });
    await waitFor(() => {
      expect(screen.getByTestId('schedule-loading').textContent).toContain('false');
    });
    await waitFor(() => {
      expect(screen.getByTestId('schedule-values').textContent).toContain('safe_mode');
    });

    await act(async () => {
      playbookDeferred.resolve({
        data: {
          id: 'playbook-a',
          name: 'Playbook A',
          variables: [{ name: 'region', type: 'string' }],
        } as unknown as AutoHealing.Playbook,
      });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByTestId('schedule-playbook').textContent).toContain('none');
    });
    expect(screen.getByTestId('schedule-values').textContent).not.toContain('region');
    expect(history.push).not.toHaveBeenCalled();
  });
});

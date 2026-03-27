import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import TemplateFormPage from './TemplateForm';
import { history, useAccess, useParams } from '@umijs/max';
import {
  confirmExecutionTaskReview,
  createExecutionTask,
  getExecutionTask,
  updateExecutionTask,
} from '@/services/auto-healing/execution';
import { getPlaybook } from '@/services/auto-healing/playbooks';
import { getSecretsSources } from '@/services/auto-healing/secrets';
import {
  getCachedNotificationChannelInventory,
  getCachedNotificationTemplateInventory,
  getCachedPlaybookInventory,
  invalidateSelectorInventory,
  selectorInventoryKeys,
} from '@/utils/selectorInventoryCache';

jest.mock('@umijs/max', () => ({
  history: { push: jest.fn() },
  useAccess: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('@/services/auto-healing/execution', () => ({
  getExecutionTask: jest.fn(),
  createExecutionTask: jest.fn(),
  updateExecutionTask: jest.fn(),
  confirmExecutionTaskReview: jest.fn(),
}));

jest.mock('@/services/auto-healing/playbooks', () => ({
  getPlaybook: jest.fn(),
}));

jest.mock('@/services/auto-healing/secrets', () => ({
  getSecretsSources: jest.fn(),
}));

jest.mock('@/utils/selectorInventoryCache', () => ({
  getCachedPlaybookInventory: jest.fn(),
  getCachedNotificationChannelInventory: jest.fn(),
  getCachedNotificationTemplateInventory: jest.fn(),
  invalidateSelectorInventory: jest.fn(),
  selectorInventoryKeys: { executionTasks: 'executionTasks' },
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

jest.mock('@/components/SecretsSourceSelector', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'secrets-selector' }),
  };
});

jest.mock('./TemplateReviewAlert', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ visible, changedVariables }: any) => React.createElement(
      'div',
      { 'data-testid': 'review-state' },
      `${visible}:${(changedVariables || []).length}`,
    ),
  };
});

jest.mock('./TemplateBasicInfoCard', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'basic-info-card' }),
  };
});

jest.mock('./TemplateEnvironmentCard', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'environment-card' }),
  };
});

jest.mock('./TemplateSecretsSourceField', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'secrets-field' }),
  };
});

jest.mock('./TemplateNotificationCard', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'notification-card' }),
  };
});

jest.mock('./TemplateVariablesCard', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ loadingPlaybook, selectedPlaybook, variableValues }: any) => React.createElement(
      'div',
      { 'data-testid': 'variables-card' },
      React.createElement('div', { 'data-testid': 'variables-loading' }, String(loadingPlaybook)),
      React.createElement('div', { 'data-testid': 'variables-playbook' }, selectedPlaybook?.name || 'none'),
      React.createElement('div', { 'data-testid': 'variables-values' }, JSON.stringify(variableValues)),
    ),
  };
});

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

describe('TemplateFormPage', () => {
  const taskA = {
    id: 'task-a',
    name: 'Task A',
    description: 'first task',
    playbook_id: 'playbook-a',
    target_hosts: '10.0.0.8',
    executor_type: 'local',
    secrets_source_ids: [],
    notification_config: {},
    extra_vars: { region: 'ap-southeast-1' },
    needs_review: true,
    changed_variables: ['region'],
    created_at: '2026-03-24T09:00:00Z',
    updated_at: '2026-03-25T09:00:00Z',
  } as unknown as AutoHealing.ExecutionTask;
  const taskB = {
    id: 'task-b',
    name: 'Task B',
    description: 'second task',
    playbook_id: undefined,
    target_hosts: '',
    executor_type: 'local',
    secrets_source_ids: [],
    notification_config: {},
    extra_vars: { safe_mode: true },
    needs_review: false,
    changed_variables: [],
    created_at: '2026-03-24T10:00:00Z',
    updated_at: '2026-03-25T10:00:00Z',
  } as unknown as AutoHealing.ExecutionTask;

  let currentParams: { id?: string };

  beforeEach(() => {
    currentParams = { id: 'task-a' };
    (useParams as jest.Mock).mockImplementation(() => currentParams);
    (useAccess as jest.Mock).mockReturnValue({
      canCreateTask: true,
      canUpdateTask: true,
    });
    (getCachedPlaybookInventory as jest.Mock).mockResolvedValue([]);
    (getSecretsSources as jest.Mock).mockResolvedValue({ data: [] });
    (getCachedNotificationChannelInventory as jest.Mock).mockResolvedValue([]);
    (getCachedNotificationTemplateInventory as jest.Mock).mockResolvedValue([]);
    (createExecutionTask as jest.Mock).mockResolvedValue({ data: { id: 'new-task' } });
    (updateExecutionTask as jest.Mock).mockResolvedValue({ data: { id: 'task-a' } });
    (confirmExecutionTaskReview as jest.Mock).mockResolvedValue({ data: { id: 'task-a' } });
    (invalidateSelectorInventory as jest.Mock).mockImplementation(() => undefined);
    expect(selectorInventoryKeys.executionTasks).toBe('executionTasks');
  });

  it('clears stale playbook, loading and review state when the edit route param changes', async () => {
    const playbookDeferred = createDeferred<{ data: AutoHealing.Playbook }>();

    (getExecutionTask as jest.Mock).mockImplementation((id: string) => Promise.resolve({
      data: id === 'task-a' ? taskA : taskB,
    }));
    (getPlaybook as jest.Mock).mockImplementation(() => playbookDeferred.promise);

    const { rerender } = render(React.createElement(TemplateFormPage));

    await waitFor(() => {
      expect(getExecutionTask).toHaveBeenCalledWith('task-a');
    });
    await waitFor(() => {
      expect(screen.getByTestId('review-state').textContent).toContain('true:1');
    });
    await waitFor(() => {
      expect(screen.getByTestId('variables-loading').textContent).toContain('true');
    });

    currentParams = { id: 'task-b' };
    rerender(React.createElement(TemplateFormPage));

    await waitFor(() => {
      expect(getExecutionTask).toHaveBeenCalledWith('task-b');
    });
    await waitFor(() => {
      expect(screen.getByTestId('review-state').textContent).toContain('false:0');
    });
    await waitFor(() => {
      expect(screen.getByTestId('variables-loading').textContent).toContain('false');
    });
    await waitFor(() => {
      expect(screen.getByTestId('variables-playbook').textContent).toContain('none');
    });
    await waitFor(() => {
      expect(screen.getByTestId('variables-values').textContent).toContain('safe_mode');
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
      expect(screen.getByTestId('variables-playbook').textContent).toContain('none');
    });
    expect(screen.getByTestId('variables-values').textContent).not.toContain('region');
    expect(history.push).not.toHaveBeenCalled();
  });
});

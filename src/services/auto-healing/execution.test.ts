import {
  batchConfirmReview,
  createExecutionTask,
  createLogStream,
  executeTask,
  getExecutionTask,
  getExecutionRun,
  getExecutionSchedule,
  getExecutionScheduleStats,
  getExecutionSchedules,
  getExecutionTaskStats,
  getExecutionRuns,
  getTaskRuns,
  getScheduleTimeline,
  getExecutionTasks,
} from './execution';
import { request } from '@umijs/max';
import {
  postTenantExecutionTasks,
  postTenantExecutionTasksIdExecute,
} from '@/services/generated/auto-healing/execution';
import { createAuthenticatedEventStream } from './sse';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

jest.mock('@/services/generated/auto-healing/execution', () => ({
  postTenantExecutionTasks: jest.fn(),
  postTenantExecutionTasksIdExecute: jest.fn(),
}));

jest.mock('./sse', () => ({
  createAuthenticatedEventStream: jest.fn(),
}));

describe('auto-healing execution service', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('keeps request-based list wrappers stable and generated create/execute clients normalized', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({
        data: {
          items: [{ id: 'run-1', status: 'partial_success' }],
          total: 4,
          page: 2,
          page_size: 50,
        },
      })
      .mockResolvedValueOnce({
        data: [{ id: 'task-1', target_hosts: ['10.0.0.8', '10.0.0.9'] }],
        total: 2,
        page: 1,
        page_size: 20,
      })
      .mockResolvedValueOnce({
        data: { id: 'task-1', target_hosts: ['10.0.0.8'] },
      });
    (postTenantExecutionTasks as jest.Mock).mockResolvedValueOnce({
      data: { id: 'task-1', target_hosts: ['10.0.0.8'] },
    });
    (postTenantExecutionTasksIdExecute as jest.Mock).mockResolvedValueOnce({
      data: { id: 'run-2', status: 'partial_success' },
    });

    await expect(
      getExecutionRuns({ page: 2, page_size: 50, status: 'partial' }),
    ).resolves.toEqual({
      data: [{ id: 'run-1', status: 'partial' }],
      total: 4,
      page: 2,
      page_size: 50,
    });
    await expect(
      getExecutionTasks({ page: 1, page_size: 20, playbook_id: 'playbook-1', search: 'deploy', last_run_status: 'partial' }),
    ).resolves.toEqual({
      data: [{ id: 'task-1', target_hosts: '10.0.0.8,10.0.0.9' }],
      total: 2,
      page: 1,
      page_size: 20,
    });
    await expect(getExecutionTask('task-1')).resolves.toEqual({
      data: { id: 'task-1', target_hosts: '10.0.0.8' },
    });
    await createExecutionTask({} as AutoHealing.CreateExecutionTaskRequest);
    await expect(
      executeTask('task-1', {} as AutoHealing.ExecuteTaskRequest),
    ).resolves.toEqual({
      data: { id: 'run-2', status: 'partial' },
    });

    expect(request).toHaveBeenNthCalledWith(1, '/api/v1/tenant/execution-runs', {
      method: 'GET',
      params: {
        page: 2,
        page_size: 50,
        status: 'partial',
      },
    });
    expect(request).toHaveBeenNthCalledWith(2, '/api/v1/tenant/execution-tasks', {
      method: 'GET',
      params: {
        page: 1,
        page_size: 20,
        playbook_id: 'playbook-1',
        search: 'deploy',
        last_run_status: 'partial',
      },
    });
    expect(request).toHaveBeenNthCalledWith(3, '/api/v1/tenant/execution-tasks/task-1', {
      method: 'GET',
    });
    expect(postTenantExecutionTasks).toHaveBeenCalledWith({ data: {} });
    expect(postTenantExecutionTasksIdExecute).toHaveBeenCalledWith(
      { id: 'task-1' },
      { data: {} },
    );
  });

  it('keeps request normalization stable for nested pages and task run history', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({
        data: {
          items: [{ id: 'task-2', target_hosts: ['10.0.0.10'] }],
          total: 3,
        },
        total: 3,
        page: 1,
        page_size: 10,
      })
      .mockResolvedValueOnce({
        data: [{ id: 'run-history-1', status: 'partial_success' }],
        total: 1,
      });

    await expect(
      getExecutionTasks({ page: 1, page_size: 10, name__exact: 'Deploy', repository_name: 'Ops Repo' } as any),
    ).resolves.toEqual({
      data: [{ id: 'task-2', target_hosts: '10.0.0.10' }],
      total: 3,
      page: 1,
      page_size: 10,
    });
    await expect(
      getTaskRuns('task-2', { page: 1, page_size: 20 }),
    ).resolves.toEqual({
      data: [{ id: 'run-history-1', status: 'partial' }],
      total: 1,
    });

    expect(request).toHaveBeenNthCalledWith(1, '/api/v1/tenant/execution-tasks', {
      method: 'GET',
      params: expect.objectContaining({
        page: 1,
        page_size: 10,
        name__exact: 'Deploy',
        repository_name: 'Ops Repo',
      }),
    });
    expect(request).toHaveBeenNthCalledWith(2, '/api/v1/tenant/execution-tasks/task-2/runs', {
      method: 'GET',
      params: { page: 1, page_size: 20 },
    });
  });

  it('unwraps batch confirm review responses into stable data', async () => {
    (request as jest.Mock).mockResolvedValueOnce({
      data: { confirmed_count: 3, message: 'ok' },
    });

    await expect(batchConfirmReview({ playbook_id: 'playbook-1' })).resolves.toEqual({
      confirmed_count: 3,
      message: 'ok',
    });

    expect(request).toHaveBeenCalledWith('/api/v1/tenant/execution-tasks/batch-confirm-review', {
      method: 'POST',
      data: { playbook_id: 'playbook-1' },
    });
  });

  it('keeps timeout and schedule query params aligned with request contracts', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({
        data: [{ id: 'run-timeout', status: 'timeout' }],
        total: 1,
        page: 1,
        page_size: 20,
      })
      .mockResolvedValueOnce({
        data: [{ id: 'schedule-2', name: 'Nightly', status: 'auto_paused' }],
        total: 1,
        page: 1,
        page_size: 20,
      });

    await expect(getExecutionRuns({ page: 1, page_size: 20, status: 'timeout' })).resolves.toEqual({
      data: [{ id: 'run-timeout', status: 'timeout' }],
      total: 1,
      page: 1,
      page_size: 20,
    });
    await expect(getExecutionSchedules({
      page: 1,
      page_size: 20,
      name: 'nightly',
      skip_notification: true,
      has_overrides: true,
      status: 'auto_paused',
      created_from: '2026-03-01T00:00:00Z',
      created_to: '2026-03-31T23:59:59Z',
      sort_by: 'next_run_at',
      sort_order: 'desc',
    })).resolves.toEqual({
      data: [{ id: 'schedule-2', name: 'Nightly', status: 'auto_paused' }],
      total: 1,
      page: 1,
      page_size: 20,
    });

    expect(request).toHaveBeenNthCalledWith(1, '/api/v1/tenant/execution-runs', {
      method: 'GET',
      params: {
        page: 1,
        page_size: 20,
        status: 'timeout',
      },
    });
    expect(request).toHaveBeenNthCalledWith(2, '/api/v1/tenant/execution-schedules', {
      method: 'GET',
      params: {
        page: 1,
        page_size: 20,
        name: 'nightly',
        skip_notification: true,
        has_overrides: true,
        status: 'auto_paused',
        created_from: '2026-03-01T00:00:00Z',
        created_to: '2026-03-31T23:59:59Z',
        sort_by: 'next_run_at',
        sort_order: 'desc',
      },
    });
  });

  it('unwraps request-based execution helpers to stable shapes', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({ data: { total: 4, docker: 1, local: 3, needs_review: 2, changed_playbooks: 1 } })
      .mockResolvedValueOnce({ data: { id: 'run-9', status: 'partial_success' } })
      .mockResolvedValueOnce({ data: { items: [{ id: 'schedule-1', name: 'Daily Backup' }], total: 1, page: 1, page_size: 20 } })
      .mockResolvedValueOnce({ data: { id: 'schedule-1', name: 'Daily Backup', schedule_type: 'cron' } })
      .mockResolvedValueOnce({ data: { total: 5, enabled_count: 3, disabled_count: 2, by_status: [{ status: 'auto_paused', count: 1 }], by_schedule_type: [{ schedule_type: 'cron', count: 4 }] } })
      .mockResolvedValueOnce({ data: [{ id: 'schedule-1', name: 'Daily Backup', schedule_type: 'cron', status: 'running', enabled: true, next_run_at: '2026-03-26T00:00:00Z', task_id: 'task-1', task_name: 'Backup' }] });

    await expect(getExecutionTaskStats()).resolves.toEqual({
      total: 4,
      docker: 1,
      local: 3,
      needs_review: 2,
      changed_playbooks: 1,
    });
    await expect(getExecutionRun('run-9')).resolves.toEqual({
      data: { id: 'run-9', status: 'partial' },
    });
    await expect(getExecutionSchedules({ page: 1, page_size: 20 })).resolves.toEqual({
      data: [{ id: 'schedule-1', name: 'Daily Backup' }],
      total: 1,
      page: 1,
      page_size: 20,
    });
    await expect(getExecutionSchedule('schedule-1')).resolves.toEqual({
      id: 'schedule-1',
      name: 'Daily Backup',
      schedule_type: 'cron',
    });
    await expect(getExecutionScheduleStats()).resolves.toEqual({
      total: 5,
      enabled_count: 3,
      disabled_count: 2,
      by_status: [{ status: 'auto_paused', count: 1 }],
      by_schedule_type: [{ schedule_type: 'cron', count: 4 }],
    });
    await expect(getScheduleTimeline({ date: '2026-03-26' })).resolves.toEqual([
      {
        id: 'schedule-1',
        name: 'Daily Backup',
        schedule_type: 'cron',
        status: 'running',
        enabled: true,
        next_run_at: '2026-03-26T00:00:00Z',
        task_id: 'task-1',
        task_name: 'Backup',
      },
    ]);
  });

  it('normalizes SSE done events before forwarding them to consumers', () => {
    const close = jest.fn();
    let handlers: Record<string, (...args: any[]) => void> = {};
    (createAuthenticatedEventStream as jest.Mock).mockImplementation((_url, nextHandlers) => {
      handlers = nextHandlers;
      return { close };
    });

    const onLog = jest.fn();
    const onDone = jest.fn();
    const stop = createLogStream('run-1', onLog, onDone);

    handlers.onEvent?.('done', { status: 'partial_success', exit_code: 0, stats: { ok: 1 } });

    expect(onDone).toHaveBeenCalledWith({
      status: 'partial',
      exit_code: 0,
      stats: { ok: 1 },
    });
    expect(close).toHaveBeenCalledTimes(1);

    stop();
    expect(close).toHaveBeenCalledTimes(2);
  });
});

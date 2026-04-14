import * as React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import ExecutionLogTab from './ExecutionLogTab';
import { createLogStream, getExecutionLogs, getExecutionRun } from '@/services/auto-healing/execution';

jest.mock('@/services/auto-healing/execution', () => ({
  createLogStream: jest.fn(),
  getExecutionLogs: jest.fn(),
  getExecutionRun: jest.fn(),
}));

jest.mock('@/components/execution/LogConsole', () => ({
  __esModule: true,
  default: ({ logs }: { logs: Array<{ id: string; message: string }> }) => (
    <div data-testid="log-console">
      {logs.map((log) => (
        <div key={log.id}>{log.message}</div>
      ))}
    </div>
  ),
  toLogEntries: (logs: Array<{ id: string; message: string; sequence: number; created_at?: string; log_level?: string }>) => logs,
  toLogEntry: (log: { id: string; message: string; sequence: number; created_at?: string; log_level?: string }) => log,
}));

describe('ExecutionLogTab', () => {
  const runningRun = {
    id: 'run-1',
    status: 'running',
    created_at: '2026-04-14T10:00:00Z',
    started_at: '2026-04-14T10:00:00Z',
  } as AutoHealing.ExecutionRun;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-14T10:00:10Z'));
    (createLogStream as jest.Mock).mockReturnValue(jest.fn());
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it('reloads execution logs while the run is active', async () => {
    (getExecutionRun as jest.Mock)
      .mockResolvedValueOnce({ data: runningRun })
      .mockResolvedValue({ data: runningRun });
    (getExecutionLogs as jest.Mock)
      .mockResolvedValueOnce({
        data: [{
          id: 'log-1',
          message: 'first run log',
          sequence: 1,
          created_at: '2026-03-27T00:00:00Z',
        }],
      })
      .mockResolvedValueOnce({
        data: [{
          id: 'log-2',
          message: 'second run log',
          sequence: 1,
          created_at: '2026-03-27T00:01:00Z',
        }],
      });

    render(<ExecutionLogTab runId="run-1" fallbackLogs={[]} hasStarted />);

    expect(await screen.findByText('first run log')).toBeTruthy();
    expect(getExecutionRun).toHaveBeenNthCalledWith(1, 'run-1');
    expect(getExecutionLogs).toHaveBeenNthCalledWith(1, 'run-1');

    await act(async () => {
      jest.advanceTimersByTime(2_000);
    });

    await waitFor(() => {
      expect(getExecutionLogs).toHaveBeenNthCalledWith(2, 'run-1');
    });
    expect(await screen.findByText('second run log')).toBeTruthy();
  });

  it('shows the waiting state once execution has started but run id is not ready yet', async () => {
    render(<ExecutionLogTab fallbackLogs={[]} hasStarted />);

    expect(await screen.findByText('已进入执行节点，等待执行记录与日志输出...')).toBeTruthy();
    expect(getExecutionRun).not.toHaveBeenCalled();
    expect(getExecutionLogs).not.toHaveBeenCalled();
  });
});

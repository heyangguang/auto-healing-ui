import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import ForensicDrawer from './ForensicDrawer';
import { createLogStream, getExecutionLogs, getExecutionRun } from '@/services/auto-healing/execution';

jest.mock('@/services/auto-healing/execution', () => ({
  createLogStream: jest.fn(),
  getExecutionLogs: jest.fn(),
  getExecutionRun: jest.fn(),
}));

jest.mock('@/components/execution/LogConsole', () => ({
  __esModule: true,
  default: ({ logs }: { logs: Array<{ message: string }> }) => {
    const ReactLib = require('react');
    return ReactLib.createElement(
      'div',
      null,
      logs.map((log) => ReactLib.createElement('div', { key: log.message }, log.message)),
    );
  },
  toLogEntries: (logs: Array<{ message: string; sequence: number }>) => logs,
  toLogEntry: (log: { message: string; sequence: number }) => log,
}));

const runningRun = {
  id: 'run-1',
  status: 'running',
  created_at: '2026-04-14T10:00:00Z',
  started_at: '2026-04-14T10:00:00Z',
} as AutoHealing.ExecutionRun;

describe('ForensicDrawer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-14T10:00:10Z'));
    (createLogStream as jest.Mock).mockReturnValue(jest.fn());
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it('polls logs while the run is active so new logs appear without manual refresh', async () => {
    (getExecutionRun as jest.Mock)
      .mockResolvedValueOnce({ data: runningRun })
      .mockResolvedValue({ data: runningRun });
    (getExecutionLogs as jest.Mock)
      .mockResolvedValueOnce({ data: [{ message: 'first log', sequence: 1 }] })
      .mockResolvedValueOnce({
        data: [
          { message: 'first log', sequence: 1 },
          { message: 'second log', sequence: 2 },
        ],
      });

    render(React.createElement(ForensicDrawer, {
      open: true,
      runId: 'run-1',
      onClose: jest.fn(),
    }));

    await waitFor(() => {
      expect(screen.getByText('first log')).toBeTruthy();
    });

    await act(async () => {
      jest.advanceTimersByTime(2_000);
    });

    await waitFor(() => {
      expect(screen.getByText('second log')).toBeTruthy();
    });
  });
});

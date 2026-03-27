import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ExecutionLogTab from './ExecutionLogTab';
import { getExecutionLogs } from '@/services/auto-healing/execution';

jest.mock('@/services/auto-healing/execution', () => ({
  getExecutionLogs: jest.fn(),
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
}));

describe('ExecutionLogTab', () => {
  it('reloads execution logs when runId changes', async () => {
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

    const { rerender } = render(<ExecutionLogTab runId="run-1" fallbackLogs={[]} />);

    expect(await screen.findByText('first run log')).toBeTruthy();
    expect(getExecutionLogs).toHaveBeenNthCalledWith(1, 'run-1');

    rerender(<ExecutionLogTab runId="run-2" fallbackLogs={[]} />);

    await waitFor(() => {
      expect(getExecutionLogs).toHaveBeenNthCalledWith(2, 'run-2');
    });
    expect(await screen.findByText('second run log')).toBeTruthy();
  });
});

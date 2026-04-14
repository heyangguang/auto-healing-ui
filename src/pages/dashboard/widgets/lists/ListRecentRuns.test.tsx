import React from 'react';
import { render, screen } from '@testing-library/react';
import ListRecentRuns from './ListRecentRuns';

jest.mock('@umijs/max', () => ({
  history: { push: jest.fn() },
  useAccess: () => ({ canViewTaskDetail: true }),
}));

jest.mock('../useDashboardSection', () => ({
  useDashboardSection: jest.fn(),
}));

const { useDashboardSection } = jest.requireMock('../useDashboardSection') as {
  useDashboardSection: jest.Mock;
};

describe('ListRecentRuns', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders readable trigger source and duration instead of dash placeholders', () => {
    useDashboardSection.mockReturnValue({
      data: {
        recent_runs: [{
          id: 'run-1',
          status: 'success',
          task_name: '磁盘恢复',
          started_at: '2026-04-14T09:00:00Z',
          completed_at: '2026-04-14T09:00:48Z',
        }],
      },
      loading: false,
      refresh: jest.fn(),
    });

    render(React.createElement(ListRecentRuns, { widgetId: 'list-recent-runs', instanceId: 'w-8' }));

    expect(screen.getByText('系统触发')).toBeTruthy();
    expect(screen.getByText('48s')).toBeTruthy();
  });
});

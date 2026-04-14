import React from 'react';
import { render, screen } from '@testing-library/react';
import ChartExecStatus from './ChartExecStatus';

const mockUseDashboardSection = jest.fn();
const mockUseContainerSize = jest.fn();

jest.mock('../useDashboardSection', () => ({
  useDashboardSection: (...args: unknown[]) => mockUseDashboardSection(...args),
}));

jest.mock('../../../../hooks/useContainerSize', () => ({
  useContainerSize: (...args: unknown[]) => mockUseContainerSize(...args),
}));

jest.mock('@ant-design/plots', () => ({
  Column: (props: { tooltip?: { title?: string }; yField: string }) => require('react').createElement(
    'div',
    { 'data-testid': 'exec-status-chart' },
    JSON.stringify({ tooltipTitle: props.tooltip?.title, yField: props.yField }),
  ),
}));

describe('ChartExecStatus', () => {
  beforeEach(() => {
    mockUseDashboardSection.mockReset();
    mockUseContainerSize.mockReset();
  });

  it('uses 执行次数 instead of the raw count field name', () => {
    mockUseDashboardSection.mockReturnValue({
      data: {
        runs_by_status: [{ status: 'completed', count: 5 }],
      },
      loading: false,
      refresh: jest.fn(),
    });
    mockUseContainerSize.mockReturnValue({
      ref: { current: null },
      width: 480,
      height: 240,
    });

    render(React.createElement(ChartExecStatus, {
      widgetId: 'chart-exec-status',
      instanceId: 'exec-1',
    }));

    expect(screen.getByTestId('exec-status-chart').textContent).toBe(JSON.stringify({
      tooltipTitle: 'label',
      yField: '执行次数',
    }));
  });
});

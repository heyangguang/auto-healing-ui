import React from 'react';
import { render, screen } from '@testing-library/react';
import ChartIncidentStatus from './ChartIncidentStatus';

const mockUseDashboardSection = jest.fn();
const mockUseContainerSize = jest.fn();

jest.mock('../useDashboardSection', () => ({
  useDashboardSection: (...args: unknown[]) => mockUseDashboardSection(...args),
}));

jest.mock('../../../../hooks/useContainerSize', () => ({
  useContainerSize: (...args: unknown[]) => mockUseContainerSize(...args),
}));

jest.mock('@ant-design/plots', () => ({
  Pie: (props: { angleField: string; tooltip?: { title?: string }; width: number; height: number }) => require('react').createElement(
    'div',
    { 'data-testid': 'incident-status-chart' },
    JSON.stringify({
      angleField: props.angleField,
      height: props.height,
      tooltipTitle: props.tooltip?.title,
      width: props.width,
    }),
  ),
}));

describe('ChartIncidentStatus', () => {
  beforeEach(() => {
    mockUseDashboardSection.mockReset();
    mockUseContainerSize.mockReset();
  });

  it('shows chart loading when data exists but the chart container is not measured yet', () => {
    mockUseDashboardSection.mockReturnValue({
      data: {
        total: 28,
        by_status: [{ status: 'new', count: 28 }],
      },
      loading: false,
      refresh: jest.fn(),
    });
    mockUseContainerSize.mockReturnValue({
      ref: { current: null },
      width: 0,
      height: 0,
    });

    render(React.createElement(ChartIncidentStatus, { widgetId: 'chart-incident-status', instanceId: 'incident-1' }));

    expect(screen.getByText('图表加载中')).not.toBeNull();
    expect(screen.queryByText('暂无数据')).toBeNull();
  });

  it('renders the chart once the container size is ready', () => {
    mockUseDashboardSection.mockReturnValue({
      data: {
        total: 28,
        by_status: [{ status: 'new', count: 28 }],
      },
      loading: false,
      refresh: jest.fn(),
    });
    mockUseContainerSize.mockReturnValue({
      ref: { current: null },
      width: 480,
      height: 300,
    });

    render(React.createElement(ChartIncidentStatus, { widgetId: 'chart-incident-status', instanceId: 'incident-1' }));

    expect(screen.getByTestId('incident-status-chart').textContent).toBe(JSON.stringify({
      angleField: '工单数',
      height: 300,
      tooltipTitle: 'type',
      width: 480,
    }));
  });
});

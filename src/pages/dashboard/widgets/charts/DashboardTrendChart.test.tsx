import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardTrendChart from './DashboardTrendChart';

const mockUseDashboardSection = jest.fn();
const mockUseContainerSize = jest.fn();

jest.mock('../useDashboardSection', () => ({
  useDashboardSection: (...args: unknown[]) => mockUseDashboardSection(...args),
}));

jest.mock('../../../../hooks/useContainerSize', () => ({
  useContainerSize: (...args: unknown[]) => mockUseContainerSize(...args),
}));

jest.mock('@ant-design/plots', () => ({
  Area: (props: { tooltip?: { title?: string }; yField: string }) => require('react').createElement(
    'div',
    { 'data-testid': 'dashboard-area-chart' },
    JSON.stringify({ tooltipTitle: props.tooltip?.title, yField: props.yField }),
  ),
  Line: (props: { tooltip?: { title?: string }; yField: string }) => require('react').createElement(
    'div',
    { 'data-testid': 'dashboard-line-chart' },
    JSON.stringify({ tooltipTitle: props.tooltip?.title, yField: props.yField }),
  ),
}));

describe('DashboardTrendChart', () => {
  beforeEach(() => {
    mockUseDashboardSection.mockReset();
    mockUseContainerSize.mockReset();
  });

  it('uses a context-aware metric label for trend chart tooltips', () => {
    mockUseDashboardSection.mockReturnValue({
      data: {
        trend_7d: [{ date: '2026-04-14', count: 3 }],
      },
      loading: false,
      refresh: jest.fn(),
    });
    mockUseContainerSize.mockReturnValue({
      ref: { current: null },
      width: 480,
      height: 240,
    });

    render(React.createElement(DashboardTrendChart, {
      section: 'incidents',
      field: 'trend_7d',
      title: '近7天工单趋势',
    }));

    expect(screen.getByTestId('dashboard-line-chart').textContent).toBe(JSON.stringify({
      tooltipTitle: 'date',
      yField: '工单数',
    }));
  });
});

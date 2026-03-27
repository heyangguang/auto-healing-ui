import React from 'react';
import { render, screen } from '@testing-library/react';
import WorkbenchSystemHealthCard from './WorkbenchSystemHealthCard';

describe('WorkbenchSystemHealthCard', () => {
  it('renders missing latency as dash instead of dash-ms', () => {
    render(
      <WorkbenchSystemHealthCard
        formatUptime={() => '1天'}
        loading={false}
        overview={{
          resource_overview: {
            flows: { total: 0 },
            rules: { total: 0 },
            hosts: { total: 0 },
            playbooks: { total: 0 },
            schedules: { total: 0 },
            notification_templates: { total: 0 },
            secrets: { total: 0 },
            users: { total: 0 },
          },
          system_health: {
            status: 'healthy',
            version: '1.0.0',
            uptime_seconds: 60,
            environment: 'prod',
            api_latency_ms: undefined as unknown as number,
            db_latency_ms: undefined as unknown as number,
          },
        }}
        styles={{
          card: 'card',
          cardHeader: 'cardHeader',
          cardTitle: 'cardTitle',
          cardTitleIcon: 'cardTitleIcon',
          loadingWrap: 'loadingWrap',
        }}
      />,
    );

    expect(screen.getAllByText('-')).toHaveLength(2);
    expect(screen.queryByText('-ms')).toBeNull();
  });

  it('does not render a healthy state when overview is missing', () => {
    render(
      <WorkbenchSystemHealthCard
        formatUptime={() => '1天'}
        loading={false}
        overview={null}
        styles={{
          card: 'card',
          cardHeader: 'cardHeader',
          cardTitle: 'cardTitle',
          cardTitleIcon: 'cardTitleIcon',
          loadingWrap: 'loadingWrap',
        }}
      />,
    );

    expect(screen.getByText('未获取')).toBeTruthy();
    expect(screen.getByText('状态未知')).toBeTruthy();
    expect(screen.queryByText('运行中')).toBeNull();
  });
});

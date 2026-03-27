import React from 'react';
import { message } from 'antd';
import { render, screen, waitFor } from '@testing-library/react';
import TenantOverviewPage from './index';
import { getTenantStats, getTenantTrends } from '@/services/auto-healing/platform/tenants';

jest.mock('@umijs/max', () => ({
  history: { push: jest.fn() },
}));

jest.mock('@/services/auto-healing/platform/tenants', () => ({
  getTenantStats: jest.fn(),
  getTenantTrends: jest.fn(),
}));

describe('tenant overview page', () => {
  beforeAll(() => {
    jest.spyOn(message, 'warning').mockImplementation(jest.fn());
  });

  beforeEach(() => {
    (getTenantStats as jest.Mock).mockResolvedValue({
      tenants: [{
        id: 'tenant-1',
        name: 'Tenant A',
        code: 'tenant-a',
        status: 'active',
        member_count: 3,
        rule_count: 2,
        instance_count: 4,
        template_count: 1,
        audit_log_count: 5,
        cmdb_count: 6,
        git_count: 2,
        playbook_count: 3,
        secret_count: 1,
        plugin_count: 2,
        incident_count: 1,
        flow_count: 2,
        schedule_count: 1,
        notification_channel_count: 1,
        notification_template_count: 1,
      }],
      summary: {
        total_tenants: 1,
        active_tenants: 1,
        disabled_tenants: 0,
        total_users: 3,
        total_rules: 2,
        total_instances: 4,
        total_templates: 1,
      },
    });
    (getTenantTrends as jest.Mock).mockResolvedValue({
      dates: ['03-25', '03-26'],
      operations: [1, 2],
      audit_logs: [3, 4],
      task_executions: [5, 6],
    });
  });

  it('renders overview sections from platform stats', async () => {
    render(React.createElement(TenantOverviewPage));

    expect(await screen.findByText('租户运营总览')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getAllByText('Tenant A').length).toBeGreaterThan(0);
      expect(screen.getByText('资源使用排行 TOP 5')).toBeTruthy();
      expect(screen.getByText('自动化配置率')).toBeTruthy();
    });
  });

  it('keeps stats visible when trends request fails', async () => {
    (getTenantTrends as jest.Mock).mockRejectedValueOnce(new Error('trends failed'));

    render(React.createElement(TenantOverviewPage));

    expect(await screen.findByText('租户运营总览')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getAllByText('Tenant A').length).toBeGreaterThan(0);
      expect(message.warning).toHaveBeenCalledWith('租户趋势数据加载失败，已保留主数据');
    });
  });
});

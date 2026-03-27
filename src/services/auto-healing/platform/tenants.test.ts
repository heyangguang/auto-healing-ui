import {
  addTenantMember,
  cancelTenantInvitation,
  getTenant,
  getTenantInvitations,
  getTenantMembers,
  getTenantStats,
  getTenantTrends,
  removeTenantMember,
  updateTenant,
} from './tenants';
import { request } from '@umijs/max';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

describe('platform tenants service', () => {
  it('normalizes detail member invitation stats and trend envelopes', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({ data: { id: 'tenant-1', name: 'Tenant A', code: 'tenant-a', status: 'active' } })
      .mockResolvedValueOnce({ data: { id: 'tenant-1', name: 'Tenant A+', code: 'tenant-a', status: 'disabled' } })
      .mockResolvedValueOnce({ data: [{ user_id: 'user-1', role_id: 'role-1' }] })
      .mockResolvedValueOnce({ data: [{ id: 'inv-1', email: 'ops@example.com', status: 'pending' }], total: 1 })
      .mockResolvedValueOnce({ data: { tenants: [{ id: 'tenant-1', name: 'Tenant A', code: 'tenant-a', status: 'active', member_count: 2, rule_count: 3, instance_count: 4, template_count: 5, audit_log_count: 6 }], summary: { total_tenants: 1, active_tenants: 1, disabled_tenants: 0, total_users: 2, total_rules: 3, total_instances: 4, total_templates: 5 } } })
      .mockResolvedValueOnce({ data: { dates: ['2026-03-25'], operations: [1], audit_logs: [2], task_executions: [3] } })
      .mockResolvedValueOnce({ success: true, message: 'added' })
      .mockResolvedValueOnce({ success: true, message: 'removed' })
      .mockResolvedValueOnce({ success: true, message: 'cancelled' });

    await expect(getTenant('tenant-1')).resolves.toEqual({ id: 'tenant-1', name: 'Tenant A', code: 'tenant-a', status: 'active' });
    await expect(updateTenant('tenant-1', { status: 'disabled' })).resolves.toEqual({ id: 'tenant-1', name: 'Tenant A+', code: 'tenant-a', status: 'disabled' });
    await expect(getTenantMembers('tenant-1')).resolves.toEqual([{ user_id: 'user-1', role_id: 'role-1' }]);
    await expect(getTenantInvitations('tenant-1', { page: 1, page_size: 20 })).resolves.toEqual({
      data: [{ id: 'inv-1', email: 'ops@example.com', status: 'pending' }],
      total: 1,
      page: 1,
      page_size: 1,
    });
    await expect(getTenantStats()).resolves.toEqual({
      tenants: [{ id: 'tenant-1', name: 'Tenant A', code: 'tenant-a', status: 'active', member_count: 2, rule_count: 3, instance_count: 4, template_count: 5, audit_log_count: 6 }],
      summary: { total_tenants: 1, active_tenants: 1, disabled_tenants: 0, total_users: 2, total_rules: 3, total_instances: 4, total_templates: 5 },
    });
    await expect(getTenantTrends({ days: 7 })).resolves.toEqual({
      dates: ['2026-03-25'],
      operations: [1],
      audit_logs: [2],
      task_executions: [3],
    });
    await expect(addTenantMember('tenant-1', { user_id: 'user-2', role_id: 'role-admin' })).resolves.toEqual({
      success: true,
      message: 'added',
    });
    await expect(removeTenantMember('tenant-1', 'user-1')).resolves.toEqual({
      success: true,
      message: 'removed',
    });
    await expect(cancelTenantInvitation('tenant-1', 'inv-1')).resolves.toEqual({
      success: true,
      message: 'cancelled',
    });

    expect(request).toHaveBeenNthCalledWith(7, '/api/v1/platform/tenants/tenant-1/members', {
      method: 'POST',
      data: { user_id: 'user-2', role_id: 'role-admin' },
    });
  });
});

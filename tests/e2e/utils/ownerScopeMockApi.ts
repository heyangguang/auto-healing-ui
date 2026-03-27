import type { Page, Route } from '@playwright/test';

function json(route: Route, payload: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
}

function paginated(route: Route, items: unknown[], extra?: Record<string, unknown>) {
  return json(route, {
    data: items,
    total: items.length,
    page: 1,
    page_size: Math.max(items.length, 1),
    ...extra,
  });
}

const systemMessageCategories = [
  { value: 'system', label: '系统' },
  { value: 'notice', label: '通知' },
];

const systemMessages = [
  {
    id: 'msg-1',
    category: 'system',
    title: '系统升级通知',
    content: '<p>今晚 23:00 升级</p>',
    created_at: '2026-03-27T08:00:00Z',
    is_read: false,
  },
];

const pendingTrigger = {
  id: 'trigger-1',
  title: '磁盘空间不足',
  external_id: 'INC-1001',
  severity: 'high',
  category: 'disk',
  priority: 1,
  status: 'open',
  healing_status: 'pending',
  affected_ci: 'db-01',
  affected_service: '订单服务',
  assignee: 'Alice',
  reporter: 'Bob',
  source_plugin_name: '磁盘巡检',
  created_at: '2026-03-27T08:30:00Z',
  updated_at: '2026-03-27T08:35:00Z',
  description: '磁盘使用率超过阈值',
  raw_data: { usage: '95%' },
};

const pendingExemption = {
  id: 'exemption-1',
  task_id: 'task-1',
  task_name: '高危清理任务',
  rule_id: 'rule-1',
  rule_name: '危险命令',
  rule_severity: 'critical',
  rule_pattern: 'sudo rm -rf /',
  reason: '临时排障需要',
  requested_by: 'user-1',
  requester_name: 'Alice',
  status: 'pending',
  validity_days: 3,
  created_at: '2026-03-27T09:00:00Z',
  updated_at: '2026-03-27T09:00:00Z',
};

const pendingImpersonation = {
  id: 'imp-1',
  requester_id: 'user-2',
  requester_name: 'Alice',
  tenant_id: 'tenant-1',
  tenant_name: 'Tenant A',
  reason: '排查租户问题',
  duration_minutes: 60,
  status: 'pending',
  created_at: '2026-03-27T10:00:00Z',
  updated_at: '2026-03-27T10:00:00Z',
};

const platformTenants = [
  { id: 'tenant-1', name: 'Tenant A', code: 'TA', status: 'active' },
];

const platformImpersonationList = [
  {
    id: 'platform-imp-1',
    requester_id: 'user-1',
    requester_name: 'Ops',
    tenant_id: 'tenant-1',
    tenant_name: 'Tenant A',
    reason: '协助排障',
    duration_minutes: 60,
    status: 'approved',
    approver_name: 'Tenant Admin',
    session_expires_at: '2026-03-27T12:00:00Z',
    created_at: '2026-03-27T10:00:00Z',
    updated_at: '2026-03-27T10:00:00Z',
  },
];

export async function mockTenantOwnerScopeApis(page: Page) {
  await page.route('**/api/v1/common/site-messages/categories', (route) => json(route, { data: systemMessageCategories }));
  await page.route('**/api/v1/tenant/site-messages/unread-count**', (route) => json(route, { data: { unread_count: 1 } }));
  await page.route('**/api/v1/tenant/site-messages/read-all**', (route) => json(route, { message: 'ok' }));
  await page.route('**/api/v1/tenant/site-messages/read**', (route) => json(route, { message: 'ok' }));
  await page.route('**/api/v1/tenant/site-messages**', (route) => paginated(route, systemMessages));
  await page.route('**/api/v1/tenant/users/simple', (route) => json(route, {
    data: [{ id: 'user-1', username: 'alice', display_name: 'Alice', status: 'active' }],
  }));
  await page.route('**/api/v1/tenant/healing/pending/trigger**', (route) => paginated(route, [pendingTrigger]));
  await page.route('**/api/v1/tenant/healing/pending/dismissed**', (route) => paginated(route, []));
  await page.route('**/api/v1/tenant/healing/approvals/pending**', (route) => paginated(route, []));
  await page.route('**/api/v1/tenant/blacklist-exemptions/pending**', (route) => paginated(route, [pendingExemption]));
  await page.route('**/api/v1/tenant/blacklist-exemptions**', (route) => paginated(route, [pendingExemption]));
  await page.route('**/api/v1/tenant/impersonation/pending**', (route) => json(route, { data: [pendingImpersonation] }));
  await page.route('**/api/v1/tenant/impersonation/history**', (route) => paginated(route, [pendingImpersonation]));
}

export async function mockPlatformOwnerScopeApis(page: Page) {
  await page.route('**/api/v1/common/site-messages/categories', (route) => json(route, { data: systemMessageCategories }));
  await page.route('**/api/v1/platform/site-messages', (route) => json(route, { data: { id: 'platform-msg-1' } }));
  await page.route('**/api/v1/platform/tenants**', (route) => paginated(route, platformTenants));
  await page.route('**/api/v1/platform/impersonation/requests**', (route) => {
    const url = new URL(route.request().url());
    const status = url.searchParams.get('status');
    if (status === 'pending') {
      return json(route, { data: [], total: 1, page: 1, page_size: 1 });
    }
    if (status === 'active') {
      return json(route, { data: [], total: 0, page: 1, page_size: 1 });
    }
    return paginated(route, platformImpersonationList, { total: 3 });
  });
}

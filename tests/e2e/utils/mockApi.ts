import type { Page, Route } from '@playwright/test';

const tenants = [
  { id: 'tenant-1', name: 'Tenant A', code: 'TA' },
  { id: 'tenant-2', name: 'Tenant B', code: 'TB' },
];

const defaultPermissions = [
  'dashboard:view',
  'plugin:list',
  'plugin:test',
  'plugin:update',
  'playbook:list',
  'template:list',
  'task:list',
  'task:create',
  'task:update',
  'task:delete',
  'playbook:execute',
  'healing:flows:view',
  'healing:flows:create',
  'healing:flows:update',
  'healing:flows:delete',
  'healing:rules:view',
  'healing:rules:create',
  'healing:rules:update',
  'healing:rules:delete',
  'healing:instances:view',
  'healing:trigger:execute',
] as const;

type MockCurrentUser = {
  id: string;
  username: string;
  display_name: string;
  access: string;
  roles: string[];
  permissions: string[];
  is_platform_admin: boolean;
};

const baseCurrentUser: MockCurrentUser = {
  id: 'user-1',
  username: 'ops',
  display_name: 'Ops',
  access: 'user',
  roles: ['user'],
  permissions: [...defaultPermissions],
  is_platform_admin: false,
};

const adminRbacPermissions = [
  'dashboard:view',
  'role:list',
  'platform:tenants:list',
  'platform:users:list',
  'platform:roles:list',
  'platform:permissions:list',
] as const;

const basePlatformAdminUser = {
  ...baseCurrentUser,
  id: 'admin-1',
  username: 'owner',
  display_name: 'Platform Owner',
  access: 'admin',
  roles: ['platform_admin'],
  permissions: [...adminRbacPermissions],
  is_platform_admin: true,
};

const defaultPlaybooks = [
  {
    id: 'playbook-1',
    name: '基线巡检',
    status: 'ready',
    variables_count: 1,
    variables: [{ name: 'level', required: false }],
  },
];

const defaultExecutionTasks = [
  {
    id: 'task-1',
    name: '主机健康检查',
    description: '检查主机磁盘与 CPU 使用率',
    playbook_id: 'playbook-1',
    executor_type: 'local',
    target_hosts: ['10.0.0.8'],
    extra_vars: { level: 'basic' },
    notification_config: null,
    secrets_source_ids: ['secret-1'],
    playbook_variables_snapshot: [{ name: 'level', required: false }],
    needs_review: false,
    changed_variables: [],
    created_at: '2026-03-24T09:00:00Z',
    updated_at: '2026-03-25T08:30:00Z',
    schedule_count: 0,
  },
];

const defaultFlows = [
  {
    id: 'flow-1',
    name: '磁盘空间自动修复',
    description: '磁盘使用率超阈值后自动执行清理并发送通知',
    is_active: true,
    created_at: '2026-03-20T10:00:00Z',
    updated_at: '2026-03-25T07:45:00Z',
    nodes: [
      { id: 'start-1', type: 'start', name: '开始', config: {} },
      {
        id: 'exec-1',
        type: 'execution',
        name: '执行清理模板',
        config: {
          task_template_id: 'task-1',
          task_template_name: '主机健康检查',
          executor_type: 'local',
        },
      },
      {
        id: 'notify-1',
        type: 'notification',
        name: '通知值班同学',
        config: {
          template_id: 'template-1',
          template_name: '执行结果通知',
          channel_ids: ['channel-1'],
          channel_names: { 'channel-1': '邮件通知' },
        },
      },
      { id: 'end-1', type: 'end', name: '结束', config: {} },
    ],
    edges: [
      { id: 'edge-1', source: 'start-1', target: 'exec-1' },
      { id: 'edge-2', source: 'exec-1', target: 'notify-1' },
      { id: 'edge-3', source: 'notify-1', target: 'end-1' },
    ],
  },
];

const defaultNotificationChannels = [
  { id: 'channel-1', name: '邮件通知', type: 'email' },
];

const defaultNotificationTemplates = [
  { id: 'template-1', name: '执行结果通知', event_type: 'execution_finished', is_active: true },
];

const defaultSecretsSources = [
  { id: 'secret-1', name: '默认 SSH 凭据', type: 'vault', status: 'active' },
];

const defaultTenantPermissions = [
  {
    id: 'perm-1',
    code: 'user:list',
    name: '查看用户',
    module: 'user',
    resource: 'user',
    action: 'read',
  },
  {
    id: 'perm-2',
    code: 'role:list',
    name: '查看角色',
    module: 'role',
    resource: 'role',
    action: 'read',
  },
];

const defaultPlatformTenantStats = {
  tenants: [
    {
      id: 'tenant-1',
      name: 'Tenant Atlas',
      code: 'TA',
      status: 'active',
      member_count: 12,
      rule_count: 5,
      instance_count: 3,
      template_count: 4,
      audit_log_count: 22,
      last_activity_at: '2026-03-26T10:00:00Z',
      cmdb_count: 18,
      git_count: 2,
      playbook_count: 7,
      secret_count: 4,
      plugin_count: 3,
      incident_count: 1,
      flow_count: 2,
      schedule_count: 1,
      notification_channel_count: 2,
      notification_template_count: 2,
      healing_success_count: 8,
      healing_total_count: 10,
      incident_covered_count: 6,
    },
    {
      id: 'tenant-2',
      name: 'Tenant Beacon',
      code: 'TB',
      status: 'disabled',
      member_count: 6,
      rule_count: 2,
      instance_count: 1,
      template_count: 2,
      audit_log_count: 8,
      last_activity_at: '2026-03-24T10:00:00Z',
      cmdb_count: 7,
      git_count: 1,
      playbook_count: 4,
      secret_count: 1,
      plugin_count: 1,
      incident_count: 0,
      flow_count: 1,
      schedule_count: 0,
      notification_channel_count: 1,
      notification_template_count: 1,
      healing_success_count: 3,
      healing_total_count: 4,
      incident_covered_count: 2,
    },
  ],
  summary: {
    total_tenants: 2,
    active_tenants: 1,
    disabled_tenants: 1,
    total_users: 18,
    total_rules: 7,
    total_instances: 4,
    total_templates: 6,
  },
};

const defaultPlatformTenantTrends = {
  dates: ['03-20', '03-21', '03-22', '03-23', '03-24', '03-25', '03-26'],
  operations: [12, 15, 11, 18, 16, 19, 21],
  audit_logs: [4, 5, 3, 6, 4, 5, 3],
  task_executions: [7, 6, 8, 9, 10, 8, 11],
};

const defaultCmdbItems = [
  {
    id: 'cmdb-1',
    name: 'db-prod-01',
    hostname: 'db-prod-01',
    ip_address: '10.0.0.10',
    status: 'maintenance',
    type: 'server',
    environment: 'production',
    owner: 'DBA',
    os: 'linux',
    os_version: 'Ubuntu 22.04',
    cpu: '8C',
    memory: '32GB',
    disk: '500GB',
    source_plugin_name: 'cmdb-sync',
    maintenance_reason: '巡检窗口',
    maintenance_end_at: '2026-03-28T02:00:00Z',
    created_at: '2026-03-20T08:00:00Z',
    updated_at: '2026-03-27T08:00:00Z',
  },
];

const defaultCmdbMaintenanceLogs: Record<string, Array<{
  id: string;
  action: string;
  reason: string;
  operator: string;
  created_at: string;
}>> = {
  'cmdb-1': [
    {
      id: 'cmdb-log-1',
      action: 'enter',
      reason: '巡检窗口',
      operator: 'ops',
      created_at: '2026-03-27T07:30:00Z',
    },
  ],
};

const defaultIncidents = [
  {
    id: 'incident-1',
    title: '磁盘空间不足告警',
    external_id: 'INC-1001',
    source_plugin_name: 'itsm',
    severity: 'critical',
    status: 'open',
    healing_status: 'pending',
    scanned: true,
    priority: 'P1',
    category: 'storage',
    affected_ci: 'db-prod-01',
    affected_service: 'orders-db',
    assignee: 'ops',
    reporter: 'monitor',
    description: '磁盘使用率超过阈值',
    raw_data: { cmdb_ci: 'db-prod-01', usage: 96 },
    created_at: '2026-03-27T08:00:00Z',
    updated_at: '2026-03-27T08:05:00Z',
    source_created_at: '2026-03-27T08:00:00Z',
    source_updated_at: '2026-03-27T08:05:00Z',
    matched_rule_id: 'rule-1',
    healing_flow_instance_id: 'instance-1',
  },
];

const defaultRules = [
  {
    id: 'rule-1',
    name: '磁盘空间告警自动修复',
    description: '命中高危磁盘告警时自动执行清理流程',
    is_active: true,
    trigger_mode: 'auto',
    priority: 90,
    match_mode: 'all',
    flow_id: 'flow-1',
    flow: {
      id: 'flow-1',
      name: '磁盘空间自动修复',
      description: '磁盘使用率超阈值后自动执行清理并发送通知',
      is_active: true,
    },
    conditions: [
      {
        type: 'condition',
        field: 'severity',
        operator: 'eq',
        value: 'critical',
      },
    ],
    last_run_at: '2026-03-27T08:10:00Z',
    created_at: '2026-03-20T09:00:00Z',
    updated_at: '2026-03-27T08:10:00Z',
  },
];

const defaultInstances = [
  {
    id: 'instance-1',
    flow_id: 'flow-1',
    flow_name: '磁盘空间自动修复',
    rule_id: 'rule-1',
    rule_name: '磁盘空间告警自动修复',
    incident_id: 'incident-1',
    incident_title: '磁盘空间不足告警',
    status: 'completed',
    started_at: '2026-03-27T08:02:00Z',
    completed_at: '2026-03-27T08:04:00Z',
    created_at: '2026-03-27T08:02:00Z',
    node_count: 3,
    failed_node_count: 0,
    rejected_node_count: 0,
  },
];

const defaultInstanceDetails: Record<string, any> = {
  'instance-1': {
    id: 'instance-1',
    flow_id: 'flow-1',
    flow_name: '磁盘空间自动修复',
    status: 'completed',
    created_at: '2026-03-27T08:02:00Z',
    started_at: '2026-03-27T08:02:00Z',
    completed_at: '2026-03-27T08:04:00Z',
    current_node_id: 'notify-1',
    context: {
      incident: {
        id: 'incident-1',
        title: '磁盘空间不足告警',
      },
    },
    rule: defaultRules[0],
    incident: defaultIncidents[0],
    flow_nodes: [
      { id: 'start-1', type: 'start', name: '开始', position: { x: 0, y: 0 }, config: {} },
      {
        id: 'exec-1',
        type: 'execution',
        name: '执行清理模板',
        position: { x: 220, y: 0 },
        config: { task_template_id: 'task-1', task_template_name: '主机健康检查' },
      },
      {
        id: 'notify-1',
        type: 'notification',
        name: '通知值班同学',
        position: { x: 440, y: 0 },
        config: { template_id: 'template-1', channel_ids: ['channel-1'] },
      },
    ],
    flow_edges: [
      { id: 'edge-1', source: 'start-1', target: 'exec-1' },
      { id: 'edge-2', source: 'exec-1', target: 'notify-1' },
    ],
    node_states: {
      'start-1': { status: 'completed' },
      'exec-1': {
        status: 'completed',
        run: { run_id: 'run-1', stats: { ok: 1, failed: 0, skipped: 0, unreachable: 0, changed: 1 } },
        stdout: 'ok: [10.0.0.10]',
      },
      'notify-1': { status: 'completed', sent_at: '2026-03-27T08:04:00Z' },
    },
  },
};

type MockTenantUserSessionOptions = {
  currentUser?: Partial<MockCurrentUser>;
  cmdbItems?: typeof defaultCmdbItems;
  cmdbMaintenanceLogs?: typeof defaultCmdbMaintenanceLogs;
  playbooks?: typeof defaultPlaybooks;
  executionTasks?: typeof defaultExecutionTasks;
  flows?: typeof defaultFlows;
  incidents?: typeof defaultIncidents;
  instanceDetails?: typeof defaultInstanceDetails;
  instances?: typeof defaultInstances;
  notificationChannels?: typeof defaultNotificationChannels;
  notificationTemplates?: typeof defaultNotificationTemplates;
  rules?: typeof defaultRules;
  secretsSources?: typeof defaultSecretsSources;
  tenantPermissions?: typeof defaultTenantPermissions;
  platformTenantStats?: typeof defaultPlatformTenantStats;
  platformTenantTrends?: typeof defaultPlatformTenantTrends;
};

function json(route: Route, payload: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
}

function paginated(route: Route, items: unknown[]) {
  return json(route, {
    data: items,
    total: items.length,
    page: 1,
    page_size: Math.max(items.length, 1),
  });
}

function buildExecutionTaskStats(tasks: typeof defaultExecutionTasks) {
  return {
    total: tasks.length,
    docker: tasks.filter((task) => task.executor_type === 'docker').length,
    local: tasks.filter((task) => task.executor_type !== 'docker').length,
    needs_review: tasks.filter((task) => task.needs_review).length,
    changed_playbooks: new Set(
      tasks.filter((task) => task.needs_review).map((task) => task.playbook_id),
    ).size,
  };
}

function buildFlowStats(flows: typeof defaultFlows) {
  return {
    total: flows.length,
    active_count: flows.filter((flow) => flow.is_active).length,
    inactive_count: flows.filter((flow) => !flow.is_active).length,
  };
}

function buildRuleStats(rules: typeof defaultRules) {
  return {
    total: rules.length,
    active_count: rules.filter((rule) => rule.is_active).length,
    inactive_count: rules.filter((rule) => !rule.is_active).length,
    by_trigger_mode: [
      {
        trigger_mode: 'auto',
        count: rules.filter((rule) => rule.trigger_mode === 'auto').length,
      },
      {
        trigger_mode: 'manual',
        count: rules.filter((rule) => rule.trigger_mode === 'manual').length,
      },
    ],
  };
}

function buildCmdbStats(items: typeof defaultCmdbItems) {
  const byStatus = ['active', 'offline', 'maintenance'].map((status) => ({
    status,
    count: items.filter((item) => item.status === status).length,
  }));

  return {
    total: items.length,
    by_status: byStatus,
  };
}

function buildIncidentStats(incidents: typeof defaultIncidents) {
  return {
    total: incidents.length,
    scanned: incidents.filter((incident) => incident.scanned).length,
    unscanned: incidents.filter((incident) => !incident.scanned).length,
    healed: incidents.filter((incident) => incident.healing_status === 'completed').length,
    failed: incidents.filter((incident) => incident.healing_status === 'failed').length,
  };
}

function buildInstanceStats(instances: typeof defaultInstances) {
  const statusMap = new Map<string, number>();
  instances.forEach((instance) => {
    statusMap.set(instance.status, (statusMap.get(instance.status) || 0) + 1);
  });

  return {
    total: instances.length,
    by_status: Array.from(statusMap.entries()).map(([status, count]) => ({ status, count })),
  };
}

function resolveSessionData(options?: MockTenantUserSessionOptions) {
  return {
    cmdbItems: options?.cmdbItems ?? defaultCmdbItems,
    cmdbMaintenanceLogs: options?.cmdbMaintenanceLogs ?? defaultCmdbMaintenanceLogs,
    currentUser: { ...baseCurrentUser, ...options?.currentUser },
    playbooks: options?.playbooks ?? defaultPlaybooks,
    executionTasks: options?.executionTasks ?? defaultExecutionTasks,
    flows: options?.flows ?? defaultFlows,
    incidents: options?.incidents ?? defaultIncidents,
    instanceDetails: options?.instanceDetails ?? defaultInstanceDetails,
    instances: options?.instances ?? defaultInstances,
    notificationChannels: options?.notificationChannels ?? defaultNotificationChannels,
    notificationTemplates: options?.notificationTemplates ?? defaultNotificationTemplates,
    rules: options?.rules ?? defaultRules,
    secretsSources: options?.secretsSources ?? defaultSecretsSources,
    tenantPermissions: options?.tenantPermissions ?? defaultTenantPermissions,
    platformTenantStats: options?.platformTenantStats ?? defaultPlatformTenantStats,
    platformTenantTrends: options?.platformTenantTrends ?? defaultPlatformTenantTrends,
  };
}

export async function mockTenantUserSession(
  page: Page,
  options?: MockTenantUserSessionOptions,
) {
  const session = resolveSessionData(options);

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname, searchParams } = url;

    if (request.method() === 'POST' && pathname === '/api/v1/auth/login') {
      return json(route, {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        user: session.currentUser,
        current_tenant_id: 'tenant-1',
        tenants,
      });
    }

    if (request.method() === 'GET' && pathname === '/api/v1/auth/me') {
      return json(route, {
        data: session.currentUser,
      });
    }

    if (request.method() === 'GET' && pathname === '/api/v1/common/user/tenants') {
      const name = searchParams.get('name');
      if (name) {
        const filtered = tenants.filter((tenant) =>
          tenant.name.toLowerCase().includes(name.toLowerCase()),
        );
        return json(route, { data: filtered });
      }
      return json(route, { data: tenants });
    }

    if (request.method() === 'GET' && pathname === '/api/v1/common/dictionaries') {
      return json(route, { data: {}, meta: { types_count: 0, items_count: 0 } });
    }

    if (request.method() === 'GET' && pathname === '/api/v1/common/workbench/overview') {
      return json(route, {
        data: {
          system_health: {
            status: 'healthy',
            version: 'test',
            uptime_seconds: 3600,
            environment: 'test',
            api_latency_ms: 5,
            db_latency_ms: 7,
          },
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
        },
      });
    }

    if (request.method() === 'GET' && pathname === '/api/v1/common/workbench/schedule-calendar') {
      return json(route, { data: { dates: {} } });
    }

    if (request.method() === 'GET' && pathname === '/api/v1/common/workbench/announcements') {
      return json(route, { data: { items: [] } });
    }

    if (request.method() === 'GET' && pathname === '/api/v1/common/workbench/favorites') {
      return json(route, { data: { items: [] } });
    }

    if (request.method() === 'GET' && pathname === '/api/v1/tenant/playbooks') {
      return paginated(route, session.playbooks);
    }

    if (request.method() === 'GET' && pathname === '/api/v1/tenant/permissions') {
      return json(route, { data: session.tenantPermissions });
    }

    if (request.method() === 'GET' && pathname === '/api/v1/tenant/channels') {
      return paginated(route, session.notificationChannels);
    }

    if (request.method() === 'GET' && pathname === '/api/v1/tenant/templates') {
      return paginated(route, session.notificationTemplates);
    }

    if (request.method() === 'GET' && pathname === '/api/v1/tenant/secrets-sources') {
      return json(route, { data: session.secretsSources });
    }

    if (request.method() === 'GET' && pathname === '/api/v1/tenant/execution-tasks/stats') {
      return json(route, { data: buildExecutionTaskStats(session.executionTasks) });
    }

    if (request.method() === 'GET' && pathname === '/api/v1/tenant/execution-tasks') {
      return paginated(route, session.executionTasks);
    }

    if (request.method() === 'GET' && pathname === '/api/v1/tenant/healing/flows/stats') {
      return json(route, { data: buildFlowStats(session.flows) });
    }

    if (request.method() === 'GET' && pathname === '/api/v1/tenant/healing/flows/search-schema') {
      return json(route, { fields: [] });
    }

    if (request.method() === 'GET' && pathname === '/api/v1/tenant/healing/flows') {
      return paginated(route, session.flows);
    }

    if (request.method() === 'GET' && pathname === '/api/v1/tenant/healing/rules/stats') {
      return json(route, { data: buildRuleStats(session.rules) });
    }

    if (request.method() === 'GET' && pathname === '/api/v1/tenant/healing/rules/search-schema') {
      return json(route, { fields: [] });
    }

    if (request.method() === 'GET' && pathname === '/api/v1/tenant/healing/rules') {
      return paginated(route, session.rules);
    }

    if (request.method() === 'GET' && pathname === '/api/v1/tenant/healing/instances/stats') {
      return json(route, { data: buildInstanceStats(session.instances) });
    }

    if (request.method() === 'GET' && pathname === '/api/v1/tenant/healing/instances') {
      return paginated(route, session.instances);
    }

    if (
      request.method() === 'GET'
      && pathname.startsWith('/api/v1/tenant/healing/instances/')
    ) {
      const instanceId = pathname.split('/').pop();
      return json(route, { data: session.instanceDetails[instanceId ?? ''] || null });
    }

    if (request.method() === 'GET' && pathname === '/api/v1/tenant/cmdb/stats') {
      return json(route, { data: buildCmdbStats(session.cmdbItems) });
    }

    if (request.method() === 'GET' && pathname === '/api/v1/tenant/cmdb') {
      return paginated(route, session.cmdbItems);
    }

    if (
      request.method() === 'GET'
      && pathname.startsWith('/api/v1/tenant/cmdb/')
      && pathname.endsWith('/maintenance-logs')
    ) {
      const parts = pathname.split('/');
      const itemId = parts[parts.length - 2];
      const items = session.cmdbMaintenanceLogs[itemId] || [];
      return json(route, {
        data: items,
        total: items.length,
        page: 1,
        page_size: Math.max(items.length, 1),
      });
    }

    if (
      request.method() === 'GET'
      && pathname.startsWith('/api/v1/tenant/cmdb/')
    ) {
      const itemId = pathname.split('/').pop();
      const item = session.cmdbItems.find((entry) => entry.id === itemId) || null;
      return json(route, { data: item });
    }

    if (request.method() === 'GET' && pathname === '/api/v1/tenant/incidents/stats') {
      return json(route, { data: buildIncidentStats(session.incidents) });
    }

    if (request.method() === 'GET' && pathname === '/api/v1/tenant/incidents') {
      return paginated(route, session.incidents);
    }

    if (
      request.method() === 'GET'
      && pathname.startsWith('/api/v1/tenant/incidents/')
    ) {
      const incidentId = pathname.split('/').pop();
      const incident = session.incidents.find((entry) => entry.id === incidentId) || null;
      return json(route, { data: incident });
    }

    if (request.method() === 'GET' && pathname === '/api/v1/tenant/audit-logs') {
      return json(route, { data: [], total: 0 });
    }

    if (request.method() === 'GET' && pathname === '/api/v1/tenant/healing/approvals/pending') {
      return json(route, { data: [], total: 0 });
    }

    if (request.method() === 'GET' && pathname === '/api/v1/tenant/healing/pending/trigger') {
      return json(route, { data: [], total: 0 });
    }

    if (request.method() === 'GET' && pathname === '/api/v1/platform/tenants/stats') {
      return json(route, { data: session.platformTenantStats });
    }

    if (request.method() === 'GET' && pathname === '/api/v1/platform/tenants/trends') {
      return json(route, { data: session.platformTenantTrends });
    }

    return json(route, {});
  });
}

export async function mockAdminRbacSession(
  page: Page,
  options?: Omit<MockTenantUserSessionOptions, 'currentUser'> & {
    currentUser?: Partial<MockCurrentUser>;
  },
) {
  return mockTenantUserSession(page, {
    ...options,
    currentUser: { ...basePlatformAdminUser, ...options?.currentUser },
  });
}

export async function loginThroughUi(page: Page) {
  await page.getByPlaceholder('请输入登录账号').fill('ops');
  await page.getByPlaceholder('请输入密码').fill('secret');
  await page.locator('button[type="submit"]').click();
}

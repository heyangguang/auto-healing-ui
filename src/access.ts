import { createPermissionHelpers, hasActiveImpersonationSession, resolvePlatformAdminFlag } from './accessHelpers';

export default function access(
  initialState: { currentUser?: API.CurrentUser } | undefined,
) {
  const { currentUser } = initialState ?? {};
  const permissions = currentUser?.permissions ?? [];
  const impersonating = hasActiveImpersonationSession();
  const { hasPermission, hasAnyPermission } = createPermissionHelpers(permissions);

  const canViewImpersonationApprovals = !currentUser?.is_platform_admin
    && !impersonating
    && hasPermission('tenant:impersonation:view');
  const canApproveImpersonation = !currentUser?.is_platform_admin
    && !impersonating
    && hasPermission('tenant:impersonation:approve');
  const canViewPendingCenter = hasAnyPermission(
    'healing:approvals:view',
    'healing:trigger:view',
    'security:exemption:approve',
  ) || canViewImpersonationApprovals;

  return {
    // ===============================
    // 通用
    // ===============================
    canAdmin: currentUser && currentUser.access === 'admin',
    hasPermission,
    hasAnyPermission,

    isPlatformAdmin: resolvePlatformAdminFlag(currentUser),

    // ===============================
    // 平台管理 (platform:*)
    // ===============================
    canViewPlatformTenants: hasAnyPermission('platform:tenants:manage', 'platform:tenants:list'),
    canManagePlatformTenants: hasPermission('platform:tenants:manage'),
    canViewPlatformUsers: hasPermission('platform:users:list'),
    canCreatePlatformUser: hasPermission('platform:users:create'),
    canUpdatePlatformUser: hasPermission('platform:users:update'),
    canDeletePlatformUser: hasPermission('platform:users:delete'),
    canResetPlatformPassword: hasPermission('platform:users:reset_password'),
    canViewPlatformRoles: hasPermission('platform:roles:list'),
    canManagePlatformRoles: hasPermission('platform:roles:manage'),
    canViewPlatformAudit: hasPermission('platform:audit:list'),
    canExportPlatformAudit: hasPermission('platform:audit:export'),
    canSendPlatformMessage: hasPermission('platform:messages:send'),
    canManagePlatformSettings: hasPermission('platform:settings:manage'),

    // ===============================
    // 路由级 (页面可见性)
    // ===============================
    canViewUsers: hasPermission('user:list'),
    canViewRoles: hasPermission('role:list'),
    canViewPlugins: hasPermission('plugin:list'),
    canViewTasks: hasPermission('task:list'),
    canViewChannels: hasPermission('channel:list'),
    canViewTemplates: hasPermission('template:list'),
    canViewNotifications: hasPermission('notification:list'),
    canViewExecutionCenter: hasAnyPermission(
      'task:list',
      'task:detail',
      'task:create',
      'task:update',
      'playbook:execute',
      'repository:list',
      'repository:create',
      'repository:update',
      'playbook:list',
      'playbook:create',
      'playbook:update',
      'playbook:delete',
    ),
    canViewFlows: hasPermission('healing:flows:view'),
    canViewRules: hasPermission('healing:rules:view'),
    canViewInstances: hasPermission('healing:instances:view'),
    canViewApprovals: hasPermission('healing:approvals:view'),
    canViewPendingTrigger: hasPermission('healing:trigger:view'),
    canViewPendingCenter,
    canViewHealingCenter: hasAnyPermission(
      'healing:flows:view',
      'healing:flows:create',
      'healing:flows:update',
      'healing:rules:view',
      'healing:rules:create',
      'healing:rules:update',
      'healing:instances:view',
    ),
    canViewPlaybooks: hasPermission('playbook:list'),
    canViewRepositories: hasPermission('repository:list'),
    canViewResources: hasAnyPermission('plugin:list', 'plugin:create', 'plugin:update'),
    canViewAuditLogs: hasPermission('audit:list'),
    canExportAuditLogs: hasPermission('audit:export'),
    canViewDashboard: hasPermission('dashboard:view'),
    canViewSystemCenter: hasAnyPermission(
      'user:list',
      'user:create',
      'user:update',
      'role:list',
      'role:create',
      'role:update',
      'audit:list',
      'site-message:list',
      'site-message:create',
      'site-message:settings:view',
      'site-message:settings:manage',
    ),

    // ===============================
    // 用户管理 (user:*)
    // ===============================
    canCreateUser: hasPermission('user:create'),
    canUpdateUser: hasPermission('user:update'),
    canDeleteUser: hasPermission('user:delete'),
    canResetPassword: hasPermission('user:reset_password'),

    // ===============================
    // 角色管理 (role:*)
    // ===============================
    canCreateRole: hasPermission('role:create'),
    canUpdateRole: hasPermission('role:update'),
    canDeleteRole: hasPermission('role:delete'),
    canAssignRoles: hasPermission('role:assign'),
    canAssignPermissions: hasPermission('role:assign'),

    // ===============================
    // 插件管理 (plugin:*)
    // ===============================
    canCreatePlugin: hasPermission('plugin:create'),
    canUpdatePlugin: hasPermission('plugin:update'),
    canDeletePlugin: hasPermission('plugin:delete'),
    canViewPluginDetail: hasPermission('plugin:detail'),
    canTestPlugin: hasPermission('plugin:test'),
    canSyncPlugin: hasPermission('plugin:sync'),
    canActivatePlugin: hasPermission('plugin:update'),

    // ===============================
    // 任务/执行模块 (task:*)
    // ===============================
    canCreateTask: hasPermission('task:create'),
    canUpdateTask: hasPermission('task:update'),
    canDeleteTask: hasPermission('task:delete'),
    canViewTaskDetail: hasPermission('task:detail'),
    canExecuteTask: hasPermission('playbook:execute'),
    canCancelRun: hasPermission('task:cancel'),

    // ===============================
    // Playbook (playbook:*)
    // ===============================
    canCreatePlaybook: hasPermission('playbook:create'),
    canUpdatePlaybook: hasPermission('playbook:update'),
    canDeletePlaybook: hasPermission('playbook:delete'),
    canManagePlaybook: hasAnyPermission('playbook:create', 'playbook:update', 'playbook:delete'),
    canImportPlaybook: hasPermission('playbook:create') && hasPermission('repository:list'),

    // ===============================
    // Git 仓库 (repository:*)
    // ===============================
    canCreateGitRepo: hasPermission('repository:create'),
    canUpdateGitRepo: hasPermission('repository:update'),
    canManageGitRepo: hasAnyPermission('repository:create', 'repository:update'),
    canSyncRepo: hasPermission('repository:sync'),
    canDeleteRepo: hasPermission('repository:delete'),

    // ===============================
    // 执行模块扩展
    // 注意：后端无独立 secrets/schedule 权限码，复用 task:create/task:update
    // ===============================
    canCreateSecretsSource: hasPermission('plugin:create'),
    canUpdateSecretsSource: hasPermission('plugin:update'),
    canManageSecrets: hasAnyPermission('plugin:create', 'plugin:update'),
    canManageSchedule: hasAnyPermission('task:create', 'task:update'),

    // ===============================
    // 通知模块 - 渠道 (channel:*)
    // ===============================
    canCreateChannel: hasPermission('channel:create'),
    canUpdateChannel: hasPermission('channel:update'),
    canDeleteChannel: hasPermission('channel:delete'),
    canTestChannel: hasPermission('channel:update'), // 后端无 channel:test, 复用 update 权限

    // ===============================
    // 通知模块 - 模板 (template:*)
    // ===============================
    canCreateTemplate: hasPermission('template:create'),
    canUpdateTemplate: hasPermission('template:update'),
    canDeleteTemplate: hasPermission('template:delete'),

    // ===============================
    // 通知模块 - 通知 (notification:*)
    // ===============================
    canSendNotification: hasPermission('notification:send'),

    // ===============================
    // 自愈引擎 - 流程 (healing:flows:*)
    // ===============================
    canCreateFlow: hasPermission('healing:flows:create'),
    canUpdateFlow: hasPermission('healing:flows:update'),
    canDeleteFlow: hasPermission('healing:flows:delete'),

    // ===============================
    // 自愈引擎 - 规则 (healing:rules:*)
    // ===============================
    canCreateRule: hasPermission('healing:rules:create'),
    canUpdateRule: hasPermission('healing:rules:update'),
    canDeleteRule: hasPermission('healing:rules:delete'),

    // ===============================
    // 自愈引擎 - 审批 (healing:approvals:*)
    // ===============================
    canApprove: hasPermission('healing:approvals:approve'),

    // ===============================
    // 自愈引擎 - 触发 (healing:trigger:*)
    // ===============================
    canTriggerHealing: hasPermission('healing:trigger:execute'),

    // ===============================
    // 站内消息 (site-message:*)
    // ===============================
    canCreateSiteMessage: hasPermission('site-message:create'),
    canViewSiteMessages: hasPermission('site-message:list'),
    canViewSiteMessageSettings: hasPermission('site-message:settings:view'),
    canManageSiteMessageSettings: hasPermission('site-message:settings:manage'),

    // ===============================
    // Dashboard
    // ===============================
    canManageWorkspace: hasPermission('dashboard:workspace:manage'),
    canManageDashboardConfig: hasPermission('dashboard:config:manage'),

    // ===============================
    // 平台权限
    // ===============================
    canViewPlatformPermissions: hasPermission('platform:permissions:list'),

    // ===============================
    // 系统设置
    // ===============================
    canManageSystemSettings: hasPermission('system:settings'),

    // ===============================
    // 安全防护 (security:*)
    // ===============================
    canViewBlacklist: hasPermission('security:blacklist:view'),
    canCreateBlacklist: hasPermission('security:blacklist:create'),
    canUpdateBlacklist: hasPermission('security:blacklist:update'),
    canDeleteBlacklist: hasPermission('security:blacklist:delete'),
    canManageBlacklist: hasAnyPermission('security:blacklist:create', 'security:blacklist:update'),
    // 安全豁免
    canViewExemptions: hasPermission('security:exemption:view'),
    canCreateExemption: hasPermission('security:exemption:create'),
    canApproveExemption: hasPermission('security:exemption:approve'),
    canViewSecurityCenter: hasAnyPermission(
      'security:blacklist:view',
      'security:blacklist:create',
      'security:blacklist:update',
      'security:exemption:view',
      'security:exemption:create',
      'security:exemption:approve',
    ),

    // ===============================
    // 工作流（预留）
    // ===============================
    canViewWorkflows: hasPermission('workflow:list'),
    canViewWorkflowDetail: hasPermission('workflow:detail'),
    canCreateWorkflow: hasPermission('workflow:create'),
    canUpdateWorkflow: hasPermission('workflow:update'),
    canDeleteWorkflow: hasPermission('workflow:delete'),
    canActivateWorkflow: hasPermission('workflow:activate'),
    canRunWorkflow: hasPermission('workflow:run'),

    // ===============================
    // Impersonation 审批
    // ===============================
    canViewImpersonationApprovals,
    canApproveImpersonation,
  };
}

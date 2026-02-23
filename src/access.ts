/**
 * @see https://umijs.org/docs/max/access#access
 * 基于后端 permissions 数组的细粒度权限控制
 *
 * 后端权限码格式：  resource:action 或 resource:sub:action
 *
 * 完整权限种子清单（来自 seed.go，共 84 个）：
 * ─────────────────────────────────────────────────────────
 * [user]        user:list | user:create | user:update | user:delete | user:reset_password
 * [role]        role:list | role:create | role:update | role:delete | role:assign
 * [plugin]      plugin:list | plugin:detail | plugin:create | plugin:update | plugin:delete | plugin:sync | plugin:test
 * [execution]   repository:list | repository:create | repository:update | repository:delete | repository:sync
 *               playbook:list | playbook:execute
 *               task:list | task:detail | task:create | task:update | task:delete | task:cancel
 * [notification] channel:list | channel:create | channel:update | channel:delete
 *               template:list | template:create | template:update | template:delete
 *               notification:list | notification:send
 * [healing]     healing:flows:view | healing:flows:create | healing:flows:update | healing:flows:delete
 *               healing:rules:view | healing:rules:create | healing:rules:update | healing:rules:delete
 *               healing:instances:view
 *               healing:approvals:view | healing:approvals:approve
 *               healing:trigger:view | healing:trigger:execute
 * [workflow]    workflow:list | workflow:detail | workflow:create | workflow:update | workflow:delete | workflow:activate | workflow:run
 * [system]      audit:list | audit:export | system:settings
 * [dashboard]   dashboard:view | dashboard:config:manage | dashboard:workspace:manage
 * [site-message] site-message:list | site-message:create | site-message:settings:view | site-message:settings:manage
 * [platform]    platform:settings:manage | platform:tenants:manage | platform:tenants:list
 *               platform:users:list | platform:users:create | platform:users:update | platform:users:delete | platform:users:reset_password
 *               platform:roles:list | platform:roles:manage | platform:permissions:list
 *               platform:audit:list | platform:audit:export | platform:messages:send
 * [tenant]      tenant:impersonation:view | tenant:impersonation:approve
 */
export default function access(
  initialState: { currentUser?: API.CurrentUser } | undefined,
) {
  const { currentUser } = initialState ?? {};
  const permissions = currentUser?.permissions ?? [];

  /**
   * 检查用户是否拥有指定权限
   * 支持：精确匹配、超级管理员通配符 "*"、模块级通配符 "plugin:*"
   */
  const hasPermission = (required: string): boolean => {
    if (!permissions || permissions.length === 0) return false;
    for (const p of permissions) {
      if (p === '*') return true;
      if (p === required) return true;
      // 模块级通配符 (e.g., "plugin:*" 匹配 "plugin:create")
      if (p.endsWith(':*')) {
        const module = p.slice(0, -2);
        if (required.startsWith(module + ':')) return true;
      }
    }
    return false;
  };

  /**
   * 检查用户是否拥有任一权限
   */
  const hasAnyPermission = (...requiredList: string[]): boolean => {
    return requiredList.some((r) => hasPermission(r));
  };

  return {
    // ===============================
    // 通用
    // ===============================
    canAdmin: currentUser && currentUser.access === 'admin',
    hasPermission,
    hasAnyPermission,

    // 🆕 平台管理员 (多租户专用)
    // 仅在 Impersonation 会话真正有效时（未过期）才视为租户用户
    isPlatformAdmin: (() => {
      if (currentUser?.is_platform_admin !== true) return false;
      try {
        const impRaw = localStorage.getItem('impersonation-storage');
        if (impRaw) {
          const imp = JSON.parse(impRaw);
          // 必须同时满足: isImpersonating=true + session 存在 + 未过期
          if (imp?.isImpersonating && imp?.session?.expiresAt) {
            const expiresAt = new Date(imp.session.expiresAt);
            if (expiresAt > new Date()) {
              return false; // 有效的 impersonation 会话 → 显示租户菜单
            }
            // 已过期 → 清理残留数据
            localStorage.removeItem('impersonation-storage');
          }
        }
      } catch { /* ignore */ }
      return true; // 非 impersonation → 显示平台菜单
    })(),

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
    canViewFlows: hasPermission('healing:flows:view'),
    canViewRules: hasPermission('healing:rules:view'),
    canViewInstances: hasPermission('healing:instances:view'),
    canViewApprovals: hasPermission('healing:approvals:view'),
    canViewPendingTrigger: hasPermission('healing:trigger:view'),
    canViewPlaybooks: hasPermission('playbook:list'),
    canViewRepositories: hasPermission('repository:list'),
    canViewAuditLogs: hasPermission('audit:list'),
    canExportAuditLogs: hasPermission('audit:export'),
    canViewDashboard: hasPermission('dashboard:view'),

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
    canManagePlaybook: hasPermission('playbook:execute'),

    // ===============================
    // Git 仓库 (repository:*)
    // ===============================
    canManageGitRepo: hasAnyPermission('repository:create', 'repository:update'),
    canSyncRepo: hasPermission('repository:sync'),
    canDeleteRepo: hasPermission('repository:delete'),

    // ===============================
    // 执行模块扩展
    // 注意：后端无独立 secrets/schedule 权限码，复用 task:create/task:update
    // ===============================
    canManageSecrets: hasAnyPermission('task:create', 'task:update'),
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
    canViewImpersonationApprovals: (() => {
      // 平台管理员不应该看到审批页面（这是租户级功能）
      if (currentUser?.is_platform_admin) return false;
      // 提权用户也不应该看到
      try {
        const impRaw = localStorage.getItem('impersonation-storage');
        if (impRaw) {
          const imp = JSON.parse(impRaw);
          if (imp?.isImpersonating && imp?.session?.expiresAt) {
            if (new Date(imp.session.expiresAt) > new Date()) return false;
          }
        }
      } catch { /* ignore */ }
      return hasPermission('tenant:impersonation:view');
    })(),
    canApproveImpersonation: (() => {
      // 平台管理员不应该看到审批页面（这是租户级功能）
      if (currentUser?.is_platform_admin) return false;
      // 提权用户也不应该看到（避免审批自己的请求）
      try {
        const impRaw = localStorage.getItem('impersonation-storage');
        if (impRaw) {
          const imp = JSON.parse(impRaw);
          if (imp?.isImpersonating && imp?.session?.expiresAt) {
            if (new Date(imp.session.expiresAt) > new Date()) return false;
          }
        }
      } catch { /* ignore */ }
      return hasPermission('tenant:impersonation:approve');
    })(),
  };
}

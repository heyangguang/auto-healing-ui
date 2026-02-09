/**
 * @see https://umijs.org/docs/max/access#access
 * 基于后端 permissions 数组的细粒度权限控制
 *
 * 后端权限码格式：  resource:action 或 resource:sub:action
 *
 * 完整权限种子清单（来自 /api/v1/permissions，共 64 个）：
 * ─────────────────────────────────────────────────────────
 * [system]     audit:export | audit:list | system:settings
 * [user]       user:create | user:delete | user:list | user:reset_password | user:update
 * [role]       role:assign | role:create | role:delete | role:list | role:update
 * [plugin]     plugin:create | plugin:delete | plugin:detail | plugin:list | plugin:sync | plugin:test | plugin:update
 * [notification] channel:create | channel:delete | channel:list | channel:update
 *               template:create | template:delete | template:list | template:update
 *               notification:list | notification:send
 * [execution]  task:cancel | task:create | task:delete | task:detail | task:list | task:update
 *              playbook:execute | playbook:list
 *              repository:create | repository:delete | repository:list | repository:sync | repository:update
 * [healing]    healing:flows:create | healing:flows:delete | healing:flows:update | healing:flows:view
 *              healing:rules:create | healing:rules:delete | healing:rules:update | healing:rules:view
 *              healing:instances:view
 *              healing:approvals:approve | healing:approvals:view
 *              healing:trigger:execute | healing:trigger:view
 * [workflow]   workflow:activate | workflow:create | workflow:delete | workflow:detail | workflow:list | workflow:run | workflow:update
 * [dashboard]  dashboard:workspace:manage
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
    canViewWorkflows: hasPermission('workflow:list'),
    canViewDashboard: true, // 所有登录用户可见

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
    canTestPlugin: hasPermission('plugin:test'),
    canSyncPlugin: hasPermission('plugin:sync'),
    canActivatePlugin: hasPermission('plugin:update'),

    // ===============================
    // 任务/执行模块 (task:*)
    // ===============================
    canCreateTask: hasPermission('task:create'),
    canUpdateTask: hasPermission('task:update'),
    canDeleteTask: hasPermission('task:delete'),
    canExecuteTask: hasPermission('playbook:execute'),
    canCancelRun: hasPermission('task:cancel'),

    // ===============================
    // Playbook (playbook:*)
    // ===============================
    canManagePlaybook: hasAnyPermission('task:create', 'task:update'),

    // ===============================
    // Git 仓库 (repository:*)
    // ===============================
    canManageGitRepo: hasAnyPermission('repository:create', 'repository:update'),
    canSyncRepo: hasPermission('repository:sync'),
    canDeleteRepo: hasPermission('repository:delete'),

    // ===============================
    // 执行模块扩展
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
    // 审计日志 (audit:*)
    // ===============================
    canExportAudit: hasPermission('audit:export'),

    // ===============================
    // 系统设置 (system:*)
    // ===============================
    canManageSettings: hasPermission('system:settings'),

    // ===============================
    // 工作流/ITSM (workflow:*)
    // ===============================
    canCreateWorkflow: hasPermission('workflow:create'),
    canUpdateWorkflow: hasPermission('workflow:update'),
    canDeleteWorkflow: hasPermission('workflow:delete'),
    canActivateWorkflow: hasPermission('workflow:activate'),
    canRunWorkflow: hasPermission('workflow:run'),

    // ===============================
    // Dashboard
    // ===============================
    canManageWorkspace: hasPermission('dashboard:workspace:manage'),
  };
}

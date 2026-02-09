/**
 * @see https://umijs.org/docs/max/access#access
 * 基于后端 permissions 数组的细粒度权限控制
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
    // ---- 通用 ----
    canAdmin: currentUser && currentUser.access === 'admin',
    hasPermission,
    hasAnyPermission,

    // ---- 路由级 (页面可见性) ----
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
    canViewDashboard: true,  // 所有登录用户可见

    // ---- 用户管理操作 ----
    canCreateUser: hasPermission('user:create'),
    canUpdateUser: hasPermission('user:update'),
    canDeleteUser: hasPermission('user:delete'),
    canResetPassword: hasPermission('user:reset_password'),
    canAssignRoles: hasPermission('role:assign'),

    // ---- 角色管理操作 ----
    canCreateRole: hasPermission('role:create'),
    canUpdateRole: hasPermission('role:update'),
    canDeleteRole: hasPermission('role:delete'),
    canAssignPermissions: hasPermission('role:assign'),

    // ---- 插件管理操作 ----
    canCreatePlugin: hasPermission('plugin:create'),
    canUpdatePlugin: hasPermission('plugin:update'),
    canDeletePlugin: hasPermission('plugin:delete'),
    canTestPlugin: hasPermission('plugin:test'),
    canSyncPlugin: hasPermission('plugin:sync'),

    // ---- 执行模块操作 ----
    canCreateTask: hasAnyPermission('task:create', 'playbook:execute'),
    canUpdateTask: hasPermission('task:update'),
    canDeleteTask: hasPermission('task:delete'),
    canExecuteTask: hasPermission('playbook:execute'),
    canCancelRun: hasPermission('task:cancel'),

    // ---- 通知模块操作 ----
    canCreateChannel: hasPermission('channel:create'),
    canUpdateChannel: hasPermission('channel:update'),
    canDeleteChannel: hasPermission('channel:delete'),
    canTestChannel: hasPermission('channel:test'),
    canCreateTemplate: hasPermission('template:create'),
    canUpdateTemplate: hasPermission('template:update'),
    canDeleteTemplate: hasPermission('template:delete'),
    canSendNotification: hasPermission('notification:send'),

    // ---- 执行模块扩展 ----
    canManageGitRepo: hasAnyPermission('task:create', 'task:update'),
    canManageSecrets: hasAnyPermission('task:create', 'task:update'),
    canManageSchedule: hasAnyPermission('task:create', 'task:update'),
    canManagePlaybook: hasAnyPermission('task:create', 'task:update'),

    // ---- 插件扩展 ----
    canActivatePlugin: hasPermission('plugin:update'),

    // ---- 自愈引擎操作 ----
    canCreateFlow: hasPermission('healing:flows:create'),
    canUpdateFlow: hasPermission('healing:flows:update'),
    canDeleteFlow: hasPermission('healing:flows:delete'),
    canCreateRule: hasPermission('healing:rules:create'),
    canUpdateRule: hasPermission('healing:rules:update'),
    canDeleteRule: hasPermission('healing:rules:delete'),
    canApprove: hasPermission('healing:approvals:approve'),
    canTriggerHealing: hasPermission('healing:trigger:execute'),

    // ---- Dashboard ----
    canManageWorkspace: hasPermission('dashboard:workspace:manage'),
  };
}

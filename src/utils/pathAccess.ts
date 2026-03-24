export function canAccessPath(path: string, access: any): boolean {
  if (!path) return false;

  const normalizedPath = path.split(/[?#]/)[0] || path;

  if (
    normalizedPath === '/'
    || normalizedPath === '/workbench'
    || normalizedPath.startsWith('/guide')
    || normalizedPath.startsWith('/account')
  ) {
    return true;
  }

  if (normalizedPath === '/dashboard') return !!access.canViewDashboard;

  if (normalizedPath === '/resources') return !!access.canViewResources;
  if (normalizedPath.startsWith('/resources/secrets/create')) return !!access.canCreateSecretsSource;
  if (normalizedPath.includes('/resources/secrets/') && normalizedPath.endsWith('/edit')) return !!access.canUpdateSecretsSource;
  if (normalizedPath.startsWith('/resources/secrets')) return !!access.canViewPlugins;
  if (normalizedPath.startsWith('/resources/plugins/create')) return !!access.canCreatePlugin;
  if (normalizedPath.includes('/resources/plugins/') && normalizedPath.endsWith('/edit')) return !!access.canUpdatePlugin;
  if (normalizedPath.startsWith('/resources/cmdb') || normalizedPath.startsWith('/resources/incidents') || normalizedPath.startsWith('/resources/plugins')) {
    return !!access.canViewPlugins;
  }

  if (normalizedPath === '/execution') return !!access.canViewExecutionCenter;
  if (normalizedPath.startsWith('/execution/git-repos/create')) return !!access.canCreateGitRepo;
  if (normalizedPath.includes('/execution/git-repos/') && normalizedPath.endsWith('/edit')) return !!access.canUpdateGitRepo;
  if (normalizedPath.startsWith('/execution/git-repos')) return !!access.canViewRepositories;
  if (normalizedPath.startsWith('/execution/playbooks/import')) return !!access.canImportPlaybook;
  if (normalizedPath.startsWith('/execution/playbooks')) return !!access.canViewPlaybooks;
  if (normalizedPath.startsWith('/execution/templates/create')) return !!access.canCreateTask;
  if (normalizedPath.includes('/execution/templates/') && normalizedPath.endsWith('/edit')) return !!access.canUpdateTask;
  if (normalizedPath.startsWith('/execution/templates/') && !normalizedPath.endsWith('/edit')) return !!access.canViewTaskDetail;
  if (normalizedPath.startsWith('/execution/templates')) return !!access.canViewTasks;
  if (normalizedPath.startsWith('/execution/execute')) return !!access.canExecuteTask;
  if (normalizedPath.startsWith('/execution/schedules/create')) return !!access.canCreateTask;
  if (normalizedPath.includes('/execution/schedules/') && normalizedPath.endsWith('/edit')) return !!access.canUpdateTask;
  if (normalizedPath.startsWith('/execution/schedules') || normalizedPath.startsWith('/execution/logs') || normalizedPath === '/execution/runs') {
    return !!access.canViewTasks;
  }
  if (normalizedPath.startsWith('/execution/runs/')) return !!access.canViewTaskDetail;

  if (normalizedPath === '/pending') return !!access.canViewPendingCenter;
  if (normalizedPath.startsWith('/pending/triggers')) return !!access.canViewPendingTrigger;
  if (normalizedPath.startsWith('/pending/approvals')) return !!access.canViewApprovals;
  if (normalizedPath.startsWith('/pending/impersonation')) return !!access.canViewImpersonationApprovals;
  if (normalizedPath.startsWith('/pending/exemptions')) return !!access.canApproveExemption;

  if (normalizedPath === '/notification') {
    return !!(access.canViewChannels || access.canViewTemplates || access.canViewNotifications);
  }
  if (normalizedPath.startsWith('/notification/channels/create')) return !!access.canCreateChannel;
  if (normalizedPath.includes('/notification/channels/') && normalizedPath.endsWith('/edit')) return !!access.canUpdateChannel;
  if (normalizedPath.startsWith('/notification/channels')) return !!access.canViewChannels;
  if (normalizedPath.startsWith('/notification/templates/') && normalizedPath !== '/notification/templates') return !!access.canUpdateTemplate;
  if (normalizedPath.startsWith('/notification/templates')) return !!access.canViewTemplates;
  if (normalizedPath.startsWith('/notification/records')) return !!access.canViewNotifications;

  if (normalizedPath === '/healing') return !!access.canViewHealingCenter;
  if (normalizedPath.startsWith('/healing/flows/editor/')) return !!access.canUpdateFlow;
  if (normalizedPath === '/healing/flows/editor') return !!access.canCreateFlow;
  if (normalizedPath.startsWith('/healing/flows')) return !!access.canViewFlows;
  if (normalizedPath.startsWith('/healing/rules/create')) return !!access.canCreateRule;
  if (normalizedPath.startsWith('/healing/rules/') && normalizedPath.endsWith('/edit')) return !!access.canUpdateRule;
  if (normalizedPath.startsWith('/healing/rules')) return !!access.canViewRules;
  if (normalizedPath.startsWith('/healing/instances')) return !!access.canViewInstances;

  if (normalizedPath === '/system') return !!access.canViewSystemCenter;
  if (normalizedPath.startsWith('/system/users/create')) return !!access.canCreateUser;
  if (normalizedPath.startsWith('/system/users/') && normalizedPath.endsWith('/edit')) return !!access.canUpdateUser;
  if (normalizedPath.startsWith('/system/users')) return !!access.canViewUsers;
  if (normalizedPath.startsWith('/system/roles/create')) return !!access.canCreateRole;
  if (normalizedPath.startsWith('/system/roles/') && normalizedPath.endsWith('/edit')) return !!access.canUpdateRole;
  if (normalizedPath.startsWith('/system/roles')) return !!access.canViewRoles;
  if (normalizedPath.startsWith('/system/permissions')) return !!access.canViewRoles;
  if (normalizedPath.startsWith('/system/messages')) return !!access.canViewSiteMessages;
  if (normalizedPath.startsWith('/system/audit-logs')) return !!access.canViewAuditLogs;

  if (normalizedPath === '/security') return !!access.canViewSecurityCenter;
  if (normalizedPath.startsWith('/security/command-blacklist/create') || normalizedPath.startsWith('/security/command-blacklist/') && normalizedPath.endsWith('/edit')) {
    return !!access.canManageBlacklist;
  }
  if (normalizedPath.startsWith('/security/command-blacklist')) return !!access.canViewBlacklist;
  if (normalizedPath.startsWith('/security/exemptions/create')) return !!access.canCreateExemption;
  if (normalizedPath.startsWith('/security/exemptions')) return !!access.canViewExemptions;

  if (normalizedPath === '/platform') return !!access.isPlatformAdmin;
  if (normalizedPath.startsWith('/platform/tenant-overview') || normalizedPath.startsWith('/platform/tenant-ops-detail')) {
    return !!access.isPlatformAdmin && !!access.canViewPlatformTenants;
  }
  if (normalizedPath.startsWith('/platform/impersonation')) return !!access.isPlatformAdmin && !!access.canManagePlatformTenants;
  if (normalizedPath.startsWith('/platform/tenants/create') || normalizedPath.startsWith('/platform/tenants/') && normalizedPath.endsWith('/edit')) {
    return !!access.isPlatformAdmin && !!access.canManagePlatformTenants;
  }
  if (normalizedPath.startsWith('/platform/tenants')) return !!access.isPlatformAdmin && !!access.canViewPlatformTenants;
  if (normalizedPath.startsWith('/platform/users/create')) return !!access.isPlatformAdmin && !!access.canCreatePlatformUser;
  if (normalizedPath.startsWith('/platform/users/') && normalizedPath.endsWith('/edit')) return !!access.isPlatformAdmin && !!access.canUpdatePlatformUser;
  if (normalizedPath.startsWith('/platform/users')) return !!access.isPlatformAdmin && !!access.canViewPlatformUsers;
  if (normalizedPath.startsWith('/platform/roles')) return !!access.isPlatformAdmin && !!access.canViewPlatformRoles;
  if (normalizedPath.startsWith('/platform/messages')) return !!access.isPlatformAdmin && !!access.canSendPlatformMessage;
  if (normalizedPath.startsWith('/platform/settings')) return !!access.isPlatformAdmin && !!access.canManagePlatformSettings;
  if (normalizedPath.startsWith('/platform/audit-logs')) return !!access.isPlatformAdmin && !!access.canViewPlatformAudit;

  return true;
}

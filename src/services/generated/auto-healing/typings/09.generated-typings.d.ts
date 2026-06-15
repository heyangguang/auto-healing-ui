declare namespace GeneratedAutoHealing {
  type postTenantIncidentsByIdResetScanParams =           {
                'id': string;
          };

  type postTenantIncidentsByIdTriggerParams =           {
                'id': string;
          };

  type postTenantPlaybooksByIdOfflineParams =           {
                'id': string;
          };

  type postTenantPlaybooksByIdReadyParams =           {
                'id': string;
          };

  type postTenantPlaybooksByIdScanParams =           {
                'id': string;
          };

  type postTenantPluginsByIdActivateParams =           {
                'id': string;
          };

  type postTenantPluginsByIdDeactivateParams =           {
                'id': string;
          };

  type postTenantPluginsByIdSyncParams =           {
                'id': string;
          };

  type postTenantPluginsByIdTestParams =           {
                'id': string;
          };

  type postTenantSecretsSourcesByIdDisableParams =           {
                'id': string;
          };

  type postTenantSecretsSourcesByIdEnableParams =           {
                'id': string;
          };

  type postTenantSecretsSourcesByIdTestParams =           {
                'id': string;
          };

  type postTenantSecretsSourcesByIdTestQueryParams =           {
                'id': string;
          };

  type postTenantTemplatesByIdPreviewParams =           {
                'id': string;
          };

  type postTenantUsersByIdResetPasswordParams =           {
                'id': string;
          };

  type putPlatformDictionariesByIdParams =           {
                'id': string;
          };

  type putPlatformRolesByIdParams =           {
                'id': string;
          };

  type putPlatformRolesByIdPermissionsParams =           {
                'id': string;
          };

  type putPlatformSettingsByKeyParams =           {
                'key': string;
          };

  type putPlatformTenantsByIdMembersByUserIdRoleParams =           {
                'id': string;
                'userId': string;
          };

  type putPlatformTenantsByIdParams =           {
                'id': string;
          };

  type putPlatformUsersByIdParams =           {
                'id': string;
          };

  type putPlatformUsersByIdRolesParams =           {
                'id': string;
          };

  type putTenantChannelsByIdParams =           {
                'id': string;
          };

  type putTenantCommandBlacklistByIdParams =           {
                'id': string;
          };

  type putTenantDashboardRolesByRoleIdWorkspacesParams =           {
                'roleId': string;
          };

  type putTenantDashboardWorkspacesByIdParams =           {
                'id': string;
          };

  type putTenantExecutionSchedulesByIdParams =           {
                'id': string;
          };

  type putTenantExecutionTasksByIdParams =           {
                'id': string;
          };

  type putTenantGitReposByIdParams =           {
                'id': string;
          };

  type putTenantHealingFlowsByIdParams =           {
                'id': string;
          };

  type putTenantHealingRulesByIdParams =           {
                'id': string;
          };

  type putTenantIncidentSolutionTemplatesByIdParams =           {
                'id': string;
          };

  type putTenantPlaybooksByIdParams =           {
                'id': string;
          };

  type putTenantPlaybooksByIdVariablesParams =           {
                'id': string;
          };

  type putTenantPluginsByIdParams =           {
                'id': string;
          };

  type putTenantRolesByIdParams =           {
                'id': string;
          };

  type putTenantRolesByIdPermissionsParams =           {
                'id': string;
          };

  type putTenantSecretsSourcesByIdParams =           {
                'id': string;
          };

  type putTenantTemplatesByIdParams =           {
                'id': string;
          };

  type putTenantUsersByIdParams =           {
                'id': string;
          };

  type putTenantUsersByIdRolesParams =           {
                'id': string;
          };

  type RankItem = {
    name?: string;
    count?: number;
  };

  type RecentItem = {
    id?: string;
    title?: string;
    status?: string;
    created_at?: string;
  };

  type ResourceCount = {
    total?: number;
    enabled?: number;
    offline?: number;
    needs_review?: number;
    channels?: number;
    types?: string;
    admins?: number;
  };

  type ResourceOverview = {
    flows?: ResourceCount;
    rules?: ResourceCount;
    hosts?: ResourceCount;
    playbooks?: ResourceCount;
    schedules?: ResourceCount;
    notification_templates?: ResourceCount;
    secrets?: ResourceCount;
    users?: ResourceCount;
  };

  type Role = {
    id?: string;
    name?: string;
    display_name?: string;
    description?: string;
    is_system?: boolean;
    scope?: string;
    created_at?: string;
  };

  type RoleDetail = {
    id?: string;
    name?: string;
    display_name?: string;
    is_system?: boolean;
    scope?: string;
  };

  type RuleCondition = {
    /** 工单字段 (title, description, severity, etc.) */
    field?: string;
    operator?:
      | "equals"
      | "contains"
      | "in"
      | "regex"
      | "gt"
      | "lt"
      | "gte"
      | "lte";
    /** 匹配值 */
    value?: unknown;
  };

  type RunItem = {
    id?: string;
    task_name?: string;
    status?: string;
    started_at?: string;
    completed_at?: string;
    created_at?: string;
  };

  type ScanItem = {
    id?: string;
    playbook_name?: string;
    status?: string;
    created_at?: string;
  };
}

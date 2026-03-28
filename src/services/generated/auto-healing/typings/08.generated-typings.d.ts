declare namespace GeneratedAutoHealing {
  type postTenantCommandBlacklistByIdToggleParams =           {
                'id': string;
          };

  type postTenantExecutionRunsByIdCancelParams =           {
                'id': string;
          };

  type postTenantExecutionSchedulesByIdDisableParams =           {
                'id': string;
          };

  type postTenantExecutionSchedulesByIdEnableParams =           {
                'id': string;
          };

  type postTenantExecutionTasksByIdConfirmReviewParams =           {
                'id': string;
          };

  type postTenantExecutionTasksByIdExecuteParams =           {
                'id': string;
          };

  type postTenantGitReposByIdResetStatusParams =           {
                'id': string;
                'status'?: string;
          };

  type postTenantGitReposByIdSyncParams =           {
                'id': string;
          };

  type postTenantHealingApprovalsByIdApproveParams =           {
                'id': string;
          };

  type postTenantHealingApprovalsByIdRejectParams =           {
                'id': string;
          };

  type postTenantHealingFlowsByIdDryRunParams =           {
                'id': string;
          };

  type postTenantHealingFlowsByIdDryRunStreamParams =           {
                'id': string;
          };

  type postTenantHealingInstancesByIdCancelParams =           {
                'id': string;
          };

  type postTenantHealingInstancesByIdRetryParams =           {
                'id': string;
          };

  type postTenantHealingRulesByIdActivateParams =           {
                'id': string;
          };

  type postTenantHealingRulesByIdDeactivateParams =           {
                'id': string;
          };

  type postTenantImpersonationByIdApproveParams =           {
                'id': string;
          };

  type postTenantImpersonationByIdRejectParams =           {
                'id': string;
          };

  type postTenantIncidentsByIdCloseParams =           {
                'id': string;
          };

  type postTenantIncidentsByIdDismissParams =           {
                'id': string;
          };

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
}

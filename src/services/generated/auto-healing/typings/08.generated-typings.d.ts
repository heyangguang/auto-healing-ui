declare namespace GeneratedAutoHealing {
  type postPlatformImpersonationRequestsByIdEnterParams =           {
                'id': string;
          };

  type postPlatformImpersonationRequestsByIdExitParams =           {
                'id': string;
          };

  type postPlatformImpersonationRequestsByIdTerminateParams =           {
                'id': string;
          };

  type postPlatformTenantsByIdInvitationsParams =           {
                'id': string;
          };

  type postPlatformTenantsByIdMembersParams =           {
                'id': string;
          };

  type postPlatformUsersByIdResetPasswordParams =           {
                'id': string;
          };

  type postTenantBlacklistExemptionsByIdApproveParams =           {
                'id': string;
          };

  type postTenantBlacklistExemptionsByIdRejectParams =           {
                'id': string;
          };

  type postTenantChannelsByIdTestParams =           {
                'id': string;
          };

  type postTenantCmdbByIdMaintenanceParams =           {
                'id': string;
          };

  type postTenantCmdbByIdResumeParams =           {
                'id': string;
          };

  type postTenantCmdbByIdTestConnectionParams =           {
                'id': string;
          };

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
                'status'?: "pending" | "error";
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
}

declare namespace GeneratedAutoHealing {
  type PluginStats = {
    /** 总数 */
    total?: number;
    /** 按类型分布 */
    by_type?: Record<string, unknown>;
    /** 按状态分布 */
    by_status?: Record<string, unknown>;
    /** 启用同步数 */
    sync_enabled?: number;
    /** 未启用同步数 */
    sync_disabled?: number;
    /** 激活数 */
    active_count?: number;
    /** 未激活数 */
    inactive_count?: number;
    /** 错误数 */
    error_count?: number;
  };

  type PluginSyncLog = {
    id?: string;
    plugin_id?: string;
    sync_type?: string;
    status?: string;
    records_fetched?: number;
    records_processed?: number;
    records_failed?: number;
    /** 同步详情 */
    details?: { new_count?: number; updated_count?: number };
    started_at?: string;
    completed_at?: string;
    error_message?: string;
  };

  type postPlatformImpersonationRequestsByIdCancelParams =           {
                'id': string;
          };

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

  type postTenantHealingInstancesByIdRecoverParams =           {
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
}

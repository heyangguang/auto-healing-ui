declare namespace GeneratedAutoHealing {
  type getTenantChannelsParams =           {
                'page'?: number;
                'page_size'?: number;
                'type'?: string;
          };

  type getTenantCmdbByIdMaintenanceLogsParams =           {
                'id': string;
                'page'?: number;
                'page_size'?: number;
          };

  type getTenantCmdbByIdParams =           {
                'id': string;
          };

  type getTenantCmdbIdsParams =           {
                'plugin_id'?: string;
                'type'?: string;
                'status'?: string;
                'environment'?: string;
                'source_plugin_name'?: string;
                'has_plugin'?: boolean;
          };

  type getTenantCmdbParams =           {
                'page'?: number;
                'page_size'?: number;
                'type'?: string;
                'status'?: string;
                'environment'?: string;
                'source_plugin_name'?: string;
          };

  type getTenantCommandBlacklistByIdParams =           {
                'id': string;
          };

  type getTenantCommandBlacklistParams =           {
                'page'?: number;
                'page_size'?: number;
                'search'?: string;
                'severity'?: string;
                'is_active'?: boolean;
                'match_type'?: string;
                'pattern'?: string;
                'operator'?: string;
                'scope'?: string;
                'sort_by'?: string;
                'sort_order'?: string;
          };

  type getTenantDashboardOverviewParams =           {
                'sections': string;
          };

  type getTenantDashboardRolesByRoleIdWorkspacesParams =           {
                'roleId': string;
          };

  type getTenantExecutionRunsByIdLogsParams =           {
                'id': string;
          };

  type getTenantExecutionRunsByIdParams =           {
                'id': string;
          };

  type getTenantExecutionRunsByIdStreamParams =           {
                'id': string;
          };

  type getTenantExecutionRunsParams =           {
                'page'?: number;
                'page_size'?: number;
                'run_id'?: string;
                'task_id'?: string;
                'task_name'?: string;
                'status'?: "pending" | "running" | "success" | "failed" | "cancelled" | "partial";
                'triggered_by'?: string;
                'started_after'?: string;
                'started_before'?: string;
          };

  type getTenantExecutionRunsTopActiveParams =           {
                'limit'?: number;
          };

  type getTenantExecutionRunsTopFailedParams =           {
                'limit'?: number;
          };

  type getTenantExecutionRunsTrendParams =           {
                'days'?: number;
          };

  type getTenantExecutionSchedulesByIdParams =           {
                'id': string;
          };

  type getTenantExecutionSchedulesParams =           {
                'page'?: number;
                'page_size'?: number;
                'search'?: string;
                'task_id'?: string;
                'enabled'?: boolean;
                'is_recurring'?: boolean;
          };

  type getTenantExecutionSchedulesTimelineParams =           {
                'date'?: string;
                'enabled'?: boolean;
                'schedule_type'?: string;
          };

  type getTenantExecutionTasksByIdParams =           {
                'id': string;
          };

  type getTenantExecutionTasksByIdRunsParams =           {
                'id': string;
                'page'?: number;
                'page_size'?: number;
          };

  type getTenantExecutionTasksParams =           {
                'page'?: number;
                'page_size'?: number;
                'search'?: string;
                'executor_type'?: string;
                'status'?: "pending_review" | "ready";
                'playbook_id'?: string;
                'target_hosts'?: string;
                'playbook_name'?: string;
                'repository_name'?: string;
                'has_runs'?: boolean;
                'min_run_count'?: number;
                'last_run_status'?: string;
          };

  type getTenantGitReposByIdCommitsParams =           {
                'id': string;
                'limit'?: number;
          };

  type getTenantGitReposByIdFilesParams =           {
                'id': string;
                'path'?: string;
          };

  type getTenantGitReposByIdLogsParams =           {
                'id': string;
                'page'?: number;
                'page_size'?: number;
          };

  type getTenantGitReposByIdParams =           {
                'id': string;
          };

  type getTenantGitReposParams =           {
                'status'?: string;
          };

  type getTenantHealingApprovalsByIdParams =           {
                'id': string;
          };

  type getTenantHealingApprovalsParams =           {
                'page'?: number;
                'page_size'?: number;
                'flow_instance_id'?: string;
                'status'?: "pending" | "approved" | "rejected" | "expired";
          };

  type getTenantHealingApprovalsPendingParams =           {
                'page'?: number;
                'page_size'?: number;
                'node_name'?: string;
                'date_from'?: string;
                'date_to'?: string;
          };

  type getTenantHealingFlowsByIdParams =           {
                'id': string;
          };

  type getTenantHealingFlowsParams =           {
                'page'?: number;
                'page_size'?: number;
                'is_active'?: boolean;
          };

  type getTenantHealingInstancesByIdEventsParams =           {
                'id': string;
          };

  type getTenantHealingInstancesByIdParams =           {
                'id': string;
          };

  type getTenantHealingInstancesByIdRecoveryLogsParams =           {
                'id': string;
          };

  type getTenantHealingInstancesParams =           {
                'page'?: number;
                'page_size'?: number;
                'status'?: string;
                'flow_id'?: string;
                'rule_id'?: string;
                'incident_id'?: string;
                'search'?: string;
                'flow_name'?: string;
                'rule_name'?: string;
                'incident_title'?: string;
                'current_node_id'?: string;
                'error_message'?: string;
                'has_error'?: boolean;
                'approval_status'?: string;
                'created_from'?: string;
                'created_to'?: string;
                'started_from'?: string;
                'started_to'?: string;
                'completed_from'?: string;
                'completed_to'?: string;
                'min_nodes'?: number;
                'max_nodes'?: number;
                'min_failed_nodes'?: number;
                'max_failed_nodes'?: number;
                'sort_by'?: "created_at" | "started_at" | "completed_at" | "status" | "flow_name" | "rule_name";
                'sort_order'?: "asc" | "desc";
          };

  type getTenantHealingPendingDismissedParams =           {
                'page'?: number;
                'page_size'?: number;
                'title'?: string;
                'severity'?: "critical" | "high" | "medium" | "low";
                'date_from'?: string;
                'date_to'?: string;
          };

  type getTenantHealingPendingTriggerParams =           {
                'page'?: number;
                'page_size'?: number;
                'title'?: string;
                'severity'?: "critical" | "high" | "medium" | "low";
                'date_from'?: string;
                'date_to'?: string;
          };

  type getTenantHealingRulesByIdParams =           {
                'id': string;
          };
}

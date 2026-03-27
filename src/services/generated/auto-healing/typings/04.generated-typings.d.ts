declare namespace GeneratedAutoHealing {
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
                'executor_type'?: "local" | "docker";
                'status'?: "pending_review" | "ready";
                'playbook_id'?: string;
                'target_hosts'?: string;
                'playbook_name'?: string;
                'repository_name'?: string;
                'has_runs'?: boolean;
                'min_run_count'?: number;
                'last_run_status'?: "pending" | "running" | "success" | "failed" | "cancelled" | "timeout";
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
                'status'?: "pending" | "ready" | "syncing" | "error";
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

  type getTenantHealingInstancesParams =           {
                'page'?: number;
                'page_size'?: number;
                'status'?: "pending" | "running" | "waiting_approval" | "completed" | "failed" | "cancelled";
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
                'approval_status'?: "approved" | "rejected";
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

  type getTenantHealingRulesParams =           {
                'page'?: number;
                'page_size'?: number;
                'is_active'?: boolean;
                'flow_id'?: string;
          };

  type getTenantImpersonationHistoryParams =           {
                'page'?: number;
                'page_size'?: number;
                'requester_name'?: string;
                'reason'?: string;
                'status'?: string;
          };

  type getTenantIncidentsByIdParams =           {
                'id': string;
          };

  type getTenantIncidentsParams =           {
                'page'?: number;
                'page_size'?: number;
                'plugin_id'?: string;
                'source_plugin_name'?: string;
                'search'?: string;
                'external_id'?: string;
                'status'?: "open" | "in_progress" | "resolved" | "closed";
                'healing_status'?: "pending" | "processing" | "healed" | "failed" | "skipped" | "dismissed";
                'severity'?: "critical" | "high" | "medium" | "low";
                'has_plugin'?: boolean;
                'sort_by'?: "created_at" | "severity";
                'sort_order'?: "asc" | "desc";
          };

  type getTenantNotificationsByIdParams =           {
                'id': string;
          };

  type getTenantNotificationsParams =           {
                'page'?: number;
                'page_size'?: number;
                'status'?: "pending" | "sent" | "delivered" | "failed" | "bounced";
                'task_name'?: string;
                'triggered_by'?: string;
                'subject'?: string;
                'channel_id'?: string;
                'template_id'?: string;
                'task_id'?: string;
                'execution_run_id'?: string;
                'created_after'?: string;
                'created_before'?: string;
                'sort_by'?: "created_at" | "status" | "subject" | "sent_at";
                'sort_order'?: "asc" | "desc";
          };
}

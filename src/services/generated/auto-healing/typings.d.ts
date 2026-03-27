declare namespace GeneratedAutoHealing {
  type CMDBItem = {
    id?: string;
    ip_address?: string;
    hostname?: string;
    os?: string;
    status?: "active" | "offline" | "maintenance";
    environment?: string;
    department?: string;
  };

  type deleteTenantHealingFlowsIdParams = {
    id: string;
  };

  type deleteTenantPluginsIdParams = {
    id: string;
  };

  type Error = {
    error?: string;
    code?: number;
  };

  type ExecutionRun = {
    id?: string;
    task_id?: string;
    status?:
      | "pending"
      | "running"
      | "success"
      | "partial_success"
      | "failed"
      | "cancelled";
    trigger_type?: string;
    started_at?: string;
    completed_at?: string;
  };

  type ExecutionTask = {
    id?: string;
    name?: string;
    description?: string;
    playbook_id?: string;
    target_hosts?: string;
    extra_vars?: Record<string, any>;
    executor_type?: "local" | "docker";
    secrets_source_ids?: string[];
    notification_config?: Record<string, any>;
    needs_review?: boolean;
    changed_variables?: Array<string | { name?: string; old?: string; new?: string }>;
    created_at?: string;
    updated_at?: string;
  };

  type FlowInstance = {
    id?: string;
    flow_id?: string;
    incident_id?: string;
    status?:
      | "pending"
      | "running"
      | "waiting_approval"
      | "completed"
      | "failed"
      | "cancelled";
    node_states?: Record<string, any>;
    started_at?: string;
    completed_at?: string;
  };

  type getPlatformUsersParams = {
  };

  type getTenantCmdbParams = {
    status?: "active" | "offline" | "maintenance";
    ip_address?: string;
  };

  type getTenantExecutionRunsIdStreamParams = {
    id: string;
  };

  type getTenantExecutionRunsParams = {
    status?:
      | "pending"
      | "running"
      | "success"
      | "partial_success"
      | "failed"
      | "cancelled";
  };

  type getTenantExecutionTasksParams = {
  };

  type getTenantHealingFlowsIdParams = {
    id: string;
  };

  type getTenantHealingFlowsParams = {
  };

  type getTenantHealingInstancesIdEventsParams = {
    id: string;
  };

  type getTenantHealingInstancesIdParams = {
    id: string;
  };

  type getTenantHealingInstancesParams = {
    status?:
      | "pending"
      | "running"
      | "waiting_approval"
      | "completed"
      | "failed"
      | "cancelled";
  };

  type getTenantHealingRulesIdParams = {
    id: string;
  };

  type getTenantHealingRulesParams = {
  };

  type getTenantNotificationsParams = {
  };

  type getTenantPluginsIdParams = {
    id: string;
  };

  type getTenantPluginsParams = {
  };

  type HealingFlow = {
    id?: string;
    name?: string;
    description?: string;
    /** DAG node definitions (JSONB) */
    nodes?: Record<string, any>;
    status?: string;
    created_at?: string;
  };

  type HealingRule = {
    id?: string;
    name?: string;
    description?: string;
    priority?: number;
    trigger_mode?: "auto" | "manual";
    status?: "active" | "inactive";
    flow_id?: string;
    conditions?: Record<string, any>;
  };

  type Incident = {
    id?: string;
    external_id?: string;
    title?: string;
    description?: string;
    severity?: string;
    status?: string;
    plugin_id?: string;
    created_at?: string;
  };

  type LoginRequest = {
    username: string;
    password: string;
  };

  type LoginResponse = {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    user?: UserBasic;
  };

  type PaginatedResponse = {
    data?: any[];
    total?: number;
    page?: number;
    page_size?: number;
  };

  type Plugin = {
    id?: string;
    name?: string;
    type?: "itsm" | "cmdb";
    status?: "active" | "inactive" | "error";
    sync_interval_seconds?: number;
    last_sync_at?: string;
    created_at?: string;
  };

  type postTenantCmdbIdMaintenanceParams = {
    id: string;
  };

  type postTenantCmdbIdResumeParams = {
    id: string;
  };

  type postTenantExecutionTasksIdExecuteParams = {
    id: string;
  };

  type postTenantGitReposIdSyncParams = {
    id: string;
  };

  type postTenantHealingApprovalsIdApproveParams = {
    id: string;
  };

  type postTenantHealingApprovalsIdRejectParams = {
    id: string;
  };

  type postTenantHealingFlowsIdDryRunParams = {
    id: string;
  };

  type postTenantHealingRulesIdActivateParams = {
    id: string;
  };

  type postTenantPlaybooksIdScanParams = {
    id: string;
  };

  type postTenantPluginsIdSyncParams = {
    id: string;
  };

  type putTenantHealingFlowsIdParams = {
    id: string;
  };

  type putTenantPluginsIdParams = {
    id: string;
  };

  type UserBasic = {
    id?: string;
    username?: string;
    display_name?: string;
    email?: string;
    status?: "active" | "inactive";
  };
}

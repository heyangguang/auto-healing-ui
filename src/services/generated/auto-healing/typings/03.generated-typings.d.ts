declare namespace GeneratedAutoHealing {
  type FlowEdge = {
    from?: string;
    to?: string;
    condition?: string;
  };

  type FlowExecutionLog = {
    id?: string;
    flow_instance_id?: string;
    /** 节点ID (如 execution_1, cmdb_validator_1) */
    node_id?: string;
    /** 节点类型 */
    node_type?:
      | "start"
      | "end"
      | "host_extractor"
      | "cmdb_validator"
      | "approval"
      | "execution"
      | "notification"
      | "condition"
      | "set_variable";
    /** 日志级别 */
    level?: "debug" | "info" | "warn" | "error";
    /** 日志消息 */
    message?: string;
    /** 日志详情（节点执行的输入输出等） */
    details?: Record<string, unknown>;
    created_at?: string;
  };

  type FlowInstance = {
    id?: string;
    flow_id?: string;
    rule_id?: string;
    incident_id?: string;
    status?:
      | "pending"
      | "running"
      | "waiting_approval"
      | "completed"
      | "failed"
      | "cancelled";
    current_node_id?: string;
    error_message?: string;
    started_at?: string;
    completed_at?: string;
    created_at?: string;
  };

  type FlowNode = {
    id?: string;
    type?:
      | "start"
      | "end"
      | "host_extractor"
      | "cmdb_validator"
      | "approval"
      | "execution"
      | "notification"
      | "condition"
      | "set_variable";
    name?: string;
    position?: { x?: number; y?: number };
    /** 节点配置对象，不同节点类型有不同的配置参数。
详细配置说明请参考 `/docs/workflow-node-reference.md`。

常用节点配置示例：
- **host_extractor**: `{source_field, extract_mode, split_by, output_key}`
- **cmdb_validator**: `{input_key, output_key, fail_on_unknown}`
- **approval**: `{title, description, approvers, approver_roles, timeout_hours}`
- **execution**: `{git_repo_id, executor_type, hosts_key, secrets_source_id, extra_vars, keep_credentials}`
- **notification**: `{channel_ids, template_id}`
- **condition**: `{conditions, default_target}`
- **set_variable**: `{variables}`
 */
    config?: Record<string, unknown>;
  };

  type getAuthInvitationByTokenParams =           {
                'token': string;
          };

  type getAuthProfileActivitiesParams =           {
                'limit'?: number;
          };

  type getAuthProfileLoginHistoryParams =           {
                'limit'?: number;
          };

  type getCommonSearchParams =           {
                'q': string;
          };

  type getPlatformAuditLogsByIdParams =           {
                'id': string;
          };

  type getPlatformAuditLogsHighRiskParams =           {
                'page'?: number;
                'page_size'?: number;
          };

  type getPlatformAuditLogsParams =           {
                'page'?: number;
                'page_size'?: number;
          };

  type getPlatformImpersonationRequestsByIdParams =           {
                'id': string;
          };

  type getPlatformRolesByIdParams =           {
                'id': string;
          };

  type getPlatformRolesByIdUsersParams =           {
                'id': string;
                'page'?: number;
                'page_size'?: number;
          };

  type getPlatformTenantsByIdInvitationsParams =           {
                'id': string;
          };

  type getPlatformTenantsByIdMembersParams =           {
                'id': string;
          };

  type getPlatformTenantsByIdParams =           {
                'id': string;
          };

  type getPlatformTenantsParams =           {
                'page'?: number;
                'page_size'?: number;
          };

  type getPlatformUsersByIdParams =           {
                'id': string;
          };

  type getPlatformUsersParams =           {
                'page'?: number;
                'page_size'?: number;
          };

  type getPlatformUsersSimpleParams =           {
                'name'?: string;
                'status'?: "active" | "inactive";
          };

  type getTenantAuditLogsActionGroupingParams =           {
                'action'?: string;
                'days'?: number;
          };

  type getTenantAuditLogsByIdParams =           {
                'id': string;
          };

  type getTenantAuditLogsHighRiskParams =           {
                'page'?: number;
                'page_size'?: number;
          };

  type getTenantAuditLogsResourceStatsParams =           {
                'days'?: number;
          };

  type getTenantAuditLogsTrendParams =           {
                'days'?: number;
          };

  type getTenantAuditLogsUserRankingParams =           {
                'limit'?: number;
                'days'?: number;
          };

  type getTenantBlacklistExemptionsByIdParams =           {
                'id': string;
          };

  type getTenantBlacklistExemptionsParams =           {
                'page'?: number;
                'page_size'?: number;
                'status'?: string;
                'task_id'?: string;
                'rule_id'?: string;
                'search'?: string;
                'sort_by'?: string;
                'sort_order'?: string;
          };

  type getTenantBlacklistExemptionsPendingParams =           {
                'page'?: number;
                'page_size'?: number;
          };

  type getTenantChannelsByIdParams =           {
                'id': string;
          };

  type getTenantChannelsParams =           {
                'page'?: number;
                'page_size'?: number;
                'type'?: "webhook" | "dingtalk" | "email";
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
                'type'?: "server" | "application" | "network" | "database";
                'status'?: "active" | "maintenance";
                'environment'?: "production" | "staging" | "development";
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
}

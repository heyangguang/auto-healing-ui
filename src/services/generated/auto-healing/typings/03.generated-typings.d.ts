declare namespace GeneratedAutoHealing {
  type FilterOption = {
    label?: string;
    value?: string;
  };

  type FlowClosePolicy = {
    /** 是否启用新版自动关单策略 */
    enabled?: boolean;
    /** 触发时机，当前仅支持 flow_success */
    trigger_on?: "flow_success";
    /** 解决方案模板 ID */
    solution_template_id?: string;
    /** 默认关闭状态 */
    default_close_status?: "resolved" | "closed";
    /** 默认关闭原因码 */
    default_close_code?: string;
  };

  type FlowEdge = {
    id?: string;
    source?: string;
    target?: string;
    sourceHandle?: string;
    targetHandle?: string;
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
      | "set_variable"
      | "compute";
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
    status?: string;
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
- **execution**: `{task_template_id, task_template_name, hosts_key, extra_vars, variable_mappings}`
- **notification**: `{channel_ids, template_id}`
- **condition**: `{conditions, default_target}`
- **set_variable**: `{variables}`
 */
    config?: Record<string, unknown>;
  };

  type FlowRecoveryAttempt = {
    id?: string;
    flow_instance_id?: string;
    trigger_source?: "manual" | "scheduler";
    current_node_id?: string;
    current_node_type?: string;
    detect_reason?: string;
    recovery_action?: string;
    status?: "started" | "success" | "failed" | "skipped";
    details?: Record<string, unknown>;
    error_message?: string;
    started_at?: string;
    finished_at?: string;
    created_at?: string;
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
                'category'?: "operation" | "auth" | "login";
                'action'?: string;
                'resource_type'?: string;
                'username'?: string;
                'status'?: "success" | "failed";
          };

  type getPlatformAuditLogsStatsParams =           {
                'category'?: "operation" | "auth" | "login";
          };

  type getPlatformAuditLogsTrendParams =           {
                'days'?: number;
                'category'?: "operation" | "auth" | "login";
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
                'status'?: string;
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

  type getTenantAuditLogsParams =           {
                'category'?: "operation" | "auth" | "login";
          };

  type getTenantAuditLogsResourceStatsParams =           {
                'days'?: number;
          };

  type getTenantAuditLogsStatsParams =           {
                'category'?: "operation" | "auth" | "login";
          };

  type getTenantAuditLogsTrendParams =           {
                'days'?: number;
                'category'?: "operation" | "auth" | "login";
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
}

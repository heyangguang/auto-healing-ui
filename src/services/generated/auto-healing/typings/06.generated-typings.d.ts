declare namespace GeneratedAutoHealing {
  type HealingFlowUpdate = {
    name?: string;
    description?: string;
    nodes?: FlowNode[];
    edges?: FlowEdge[];
    is_active?: boolean;
    close_policy?: FlowClosePolicy;
  };

  type HealingNodeConfigField = {
    type?: string;
    required?: boolean;
    default?: string;
    description?: string;
  };

  type HealingNodeDefinition = {
    name?: string;
    description?: string;
    config?: Record<string, unknown>;
    ports?: HealingNodePorts;
    inputs?: HealingNodeIO[];
    outputs?: HealingNodeIO[];
  };

  type HealingNodeIO = {
    key?: string;
    type?: string;
    description?: string;
  };

  type HealingNodePortOption = {
    id?: string;
    name?: string;
    condition?: string;
  };

  type HealingNodePorts = {
    in?: number;
    out?: number;
    out_ports?: HealingNodePortOption[];
  };

  type HealingNodeSchema = {
    initial_context?: Record<string, unknown>;
    nodes?: Record<string, unknown>;
  };

  type HealingRule = {
    id?: string;
    name?: string;
    description?: string;
    priority?: number;
    trigger_mode?: "auto" | "manual";
    conditions?: RuleCondition[];
    match_mode?: "all" | "any";
    flow_id?: string;
    is_active?: boolean;
    last_run_at?: string;
    created_at?: string;
  };

  type HealingRuleCreate = {
    name: string;
    description?: string;
    priority?: number;
    trigger_mode?: "auto" | "manual";
    conditions?: RuleCondition[];
    match_mode?: "all" | "any";
    flow_id?: string;
    is_active?: boolean;
  };

  type HealingRuleUpdate = {
    name?: string;
    description?: string;
    priority?: number;
    trigger_mode?: "auto" | "manual";
    conditions?: RuleCondition[];
    match_mode?: "all" | "any";
    flow_id?: string;
    is_active?: boolean;
  };

  type HealingSchemaObject = {
    type?: string;
    description?: string;
    properties?: Record<string, unknown>;
  };

  type HealingSchemaProperty = {
    type?: string;
    description?: string;
  };

  type HealingSection = {
    flows_total?: number;
    flows_active?: number;
    rules_total?: number;
    rules_active?: number;
    instances_total?: number;
    instances_running?: number;
    pending_approvals?: number;
    pending_triggers?: number;
    instances_by_status?: StatusCount[];
    instance_trend_7d?: TrendPoint[];
    approvals_by_status?: StatusCount[];
    rules_by_trigger_mode?: StatusCount[];
    flow_top10?: RankItem[];
    recent_instances?: InstanceItem[];
    pending_approval_list?: ApprovalItem[];
    pending_trigger_list?: TriggerItem[];
  };

  type HealingStats = {
    today_success?: number;
    today_failed?: number;
  };

  type HostStats = {
    online_count?: number;
    offline_count?: number;
  };

  type Incident = {
    id?: string;
    /** 插件ID（插件删除后为空） */
    plugin_id?: string;
    /** 来源插件名称（插件删除后保留，如 "Mock ITSM (已删除)"） */
    source_plugin_name?: string;
    external_id?: string;
    title?: string;
    description?: string;
    severity?: string;
    priority?: string;
    status?: string;
    category?: string;
    healing_status?: string;
    affected_ci?: string;
    affected_service?: string;
    assignee?: string;
    reporter?: string;
    scanned?: boolean;
    matched_rule_id?: string;
    healing_flow_instance_id?: string;
    raw_data?: Record<string, unknown>;
    source_created_at?: string;
    source_updated_at?: string;
    created_at?: string;
    updated_at?: string;
  };

  type IncidentSection = {
    total?: number;
    today?: number;
    this_week?: number;
    unscanned?: number;
    healing_rate?: number;
    by_healing_status?: StatusCount[];
    by_severity?: StatusCount[];
    by_category?: StatusCount[];
    by_status?: StatusCount[];
    by_source?: StatusCount[];
    trend_7d?: TrendPoint[];
    trend_30d?: TrendPoint[];
    recent_incidents?: RecentItem[];
    critical_incidents?: RecentItem[];
  };

  type IncidentSolutionTemplate = {
    id?: string;
    name?: string;
    description?: string;
    resolution_template?: string;
    work_notes_template?: string;
    default_close_code?: string;
    default_close_status?: string;
    created_at?: string;
    updated_at?: string;
  };

  type IncidentSolutionTemplateCreate = {
    name: string;
    description?: string;
    resolution_template: string;
    work_notes_template: string;
    default_close_code?: string;
    default_close_status?: string;
  };

  type IncidentSolutionTemplateUpdate = {
    name?: string;
    description?: string;
    resolution_template?: string;
    work_notes_template?: string;
    default_close_code?: string;
    default_close_status?: string;
  };

  type IncidentWritebackLog = {
    id?: string;
    incident_id?: string;
    plugin_id?: string;
    external_id?: string;
    action?: "close" | "update";
    trigger_source?: string;
    status?: "pending" | "success" | "failed" | "skipped";
    request_method?: string;
    request_url?: string;
    request_payload?: Record<string, unknown>;
    response_status_code?: number;
    response_body?: string;
    error_message?: string;
    operator_user_id?: string;
    operator_name?: string;
    flow_instance_id?: string;
    execution_run_id?: string;
    started_at?: string;
    finished_at?: string;
    created_at?: string;
  };

  type InstanceItem = {
    id?: string;
    flow_name?: string;
    status?: string;
    created_at?: string;
  };

  type LoginItem = {
    id?: string;
    username?: string;
    display_name?: string;
    last_login_at?: string;
    last_login_ip?: string;
  };

  type LoginPayload = {
    access_token?: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    user?: UserInfo;
    tenants?: { id?: string; name?: string; code?: string }[];
    current_tenant_id?: string;
  };

  type MaintenanceItem = {
    id?: string;
    cmdb_item_name?: string;
    action?: string;
    reason?: string;
    created_at?: string;
  };
}

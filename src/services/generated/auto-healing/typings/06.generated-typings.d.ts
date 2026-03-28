declare namespace GeneratedAutoHealing {
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

  type MessageResponse =
    // #/components/schemas/Success
    Success;

  type Notification = {
    id?: string;
    execution_run_id?: string;
    template_id?: string;
    channel_id?: string;
    status?: "pending" | "sent" | "delivered" | "failed" | "bounced";
    subject?: string;
    body?: string;
    recipients?: string[];
    retry_count?: number;
    error_message?: string;
    response_data?: Record<string, unknown>;
    next_retry_at?: string;
    sent_at?: string;
    created_at?: string;
  };

  type NotificationChannel = {
    id?: string;
    name?: string;
    type?: string;
    description?: string;
    retry_config?: { max_retries?: number; retry_intervals?: number[] };
    recipients?: string[];
    is_active?: boolean;
    is_default?: boolean;
    rate_limit_per_minute?: number;
    created_at?: string;
    updated_at?: string;
  };

  type NotificationChannelCreate = {
    name: string;
    type: string;
    description?: string;
    config: Record<string, unknown>;
    retry_config?: Record<string, unknown>;
    recipients?: string[];
    is_default?: boolean;
    rate_limit_per_minute?: number;
  };

  type NotificationChannelUpdate = {
    name?: string;
    description?: string;
    config?: Record<string, unknown>;
    retry_config?: Record<string, unknown>;
    recipients?: string[];
    is_active?: boolean;
    is_default?: boolean;
    rate_limit_per_minute?: number;
  };

  type NotificationSection = {
    channels_total?: number;
    templates_total?: number;
    logs_total?: number;
    delivery_rate?: number;
    by_channel_type?: StatusCount[];
    by_log_status?: StatusCount[];
    trend_7d?: TrendPoint[];
    recent_logs?: NotifLogItem[];
    failed_logs?: NotifLogItem[];
  };

  type NotificationStats = {
    channels_total?: number;
    channels_by_type?: NotificationTypeCount[];
    templates_total?: number;
    templates_active?: number;
    logs_total?: number;
    logs_by_status?: NotificationStatusCount[];
  };

  type NotificationStatusCount = {
    status?: "pending" | "sent" | "delivered" | "failed" | "bounced";
    count?: number;
  };

  type NotificationTemplate = {
    id?: string;
    name?: string;
    description?: string;
    event_type?: string;
    supported_channels?: string[];
    subject_template?: string;
    body_template?: string;
    format?: string;
    /** 模板使用的 40 个变量列表 */
    available_variables?: string[];
    created_at?: string;
    updated_at?: string;
    is_active?: boolean;
  };

  type NotificationTemplateCreate = {
    name: string;
    description?: string;
    event_type?: string;
    supported_channels?: string[];
    subject_template?: string;
    /** 支持 40 个变量:
- 时间: timestamp, date, time
- 执行: execution.run_id, status, exit_code, duration, stdout, stderr
- 任务: task.id, name, target_hosts, host_count, executor_type
- 仓库: repository.id, name, url, main_playbook, branch
- 统计: stats.ok, changed, failed, unreachable, skipped, total, success_rate
- 系统: system.name, version, env
- 错误: error.message, error.host
 */
    body_template: string;
    format?: string;
    is_active?: boolean;
  };

  type NotificationTemplateUpdate = {
    name?: string;
    description?: string;
    event_type?: string;
    supported_channels?: string[];
    subject_template?: string;
    body_template?: string;
    format?: string;
    is_active?: boolean;
  };

  type NotificationTriggerConfig = {
    enabled?: boolean;
    channel_ids?: string[];
    template_id?: string;
  };
}

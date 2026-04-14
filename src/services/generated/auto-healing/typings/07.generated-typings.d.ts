declare namespace GeneratedAutoHealing {
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

  type NotificationTypeCount = {
    type?: "webhook" | "dingtalk" | "email";
    count?: number;
  };

  type NotifLogItem = {
    id?: string;
    subject?: string;
    status?: string;
    created_at?: string;
  };

  type PaginatedPlaybooks =
    // #/components/schemas/PaginationResponse
    PaginationResponse & {
      data?: Playbook[];
    };

  type PaginatedPlaybookScanLogs =
    // #/components/schemas/PaginationResponse
    PaginationResponse & {
      data?: PlaybookScanLog[];
    };

  type PaginatedResponse = {
    code?: number;
    message?: string;
    data?: Record<string, unknown>[];
    total?: number;
    page?: number;
    page_size?: number;
  };

  type PaginationResponse =
    // #/components/schemas/PaginatedResponse
    PaginatedResponse;

  type Permission = {
    id?: string;
    code?: string;
    name?: string;
    module?: string;
    resource?: string;
    action?: string;
  };

  type Playbook = {
    id?: string;
    /** 关联的 Git 仓库 */
    repository_id?: string;
    /** 模板名称 */
    name?: string;
    /** 入口文件路径 */
    file_path?: string;
    description?: string;
    status?: string;
    variables?: PlaybookVariable[];
    last_scan_at?: string;
    created_at?: string;
    updated_at?: string;
  };

  type PlaybookScanLog = {
    id?: string;
    playbook_id?: string;
    trigger_type?: string;
    /** 扫描的文件数 */
    files_scanned?: number;
    /** 发现的变量数 */
    variables_found?: number;
    /** 新增的变量数 */
    variables_added?: number;
    /** 移除的变量数 */
    variables_removed?: number;
    created_at?: string;
  };

  type PlaybookSection = {
    total?: number;
    ready?: number;
    by_status?: StatusCount[];
    recent_scans?: ScanItem[];
  };

  type PlaybookVariable = {
    /** 变量名 */
    name?: string;
    /** 变量类型 */
    type?:
      | "string"
      | "number"
      | "boolean"
      | "list"
      | "object"
      | "enum"
      | "password";
    /** 描述 */
    description?: string;
    /** 是否必填 */
    required?: boolean;
    /** 默认值 */
    default?: unknown;
    /** 所有来源位置 */
    sources?: { file?: string; line?: number }[];
    /** 主来源（类型推断来源） */
    primary_source?: string;
    /** 是否在代码中存在 */
    in_code?: boolean;
    enum?: string[];
    min?: number;
    max?: number;
    pattern?: string;
  };
}

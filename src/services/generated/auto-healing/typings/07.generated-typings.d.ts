declare namespace GeneratedAutoHealing {
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
    type?: "webhook" | "email" | "dingtalk" | "wecom" | "slack" | "teams";
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

  type Plugin = {
    id?: string;
    name?: string;
    /** 插件类型 */
    type?: string;
    description?: string;
    version?: string;
    status?: string;
    /** 连接配置，包含：
- url: API地址 (必填)
- auth_type: 认证方式 basic/bearer/api_key (必填)
- username/password: Basic认证
- token: Bearer认证
- api_key/api_key_header: API Key认证
- since_param: 增量同步时间参数名
- response_data_path: 响应数据路径
- extra_params: 额外查询参数 (对象格式)
- close_incident_url: 关闭工单接口URL (ITSM专用)
 */
    config?: Record<string, unknown>;
    /** 字段映射规则，格式：
incident_mapping: { 标准字段: 外部字段 }
cmdb_mapping: { 标准字段: 外部字段 }
 */
    field_mapping?: Record<string, unknown>;
    /** 同步过滤器配置，支持 logic/rules 嵌套条件 */
    sync_filter?: Record<string, unknown>;
    sync_enabled?: boolean;
    sync_interval_minutes?: number;
    last_sync_at?: string;
    next_sync_at?: string;
    error_message?: string;
    created_at?: string;
  };

  type PluginItem = {
    id?: string;
    name?: string;
    type?: string;
    status?: string;
    last_sync_at?: string;
  };

  type PluginSection = {
    total?: number;
    active?: number;
    inactive?: number;
    error?: number;
    sync_success_rate?: number;
    by_status?: StatusCount[];
    by_type?: StatusCount[];
    sync_trend_7d?: TrendPoint[];
    recent_syncs?: SyncItem[];
    error_plugins?: PluginItem[];
    plugin_overview?: PluginItem[];
  };
}

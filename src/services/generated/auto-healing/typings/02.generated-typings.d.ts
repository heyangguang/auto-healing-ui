declare namespace GeneratedAutoHealing {
  type deletePlatformUsersByIdParams =           {
                'id': string;
          };

  type deleteTenantChannelsByIdParams =           {
                'id': string;
          };

  type deleteTenantCommandBlacklistByIdParams =           {
                'id': string;
          };

  type deleteTenantDashboardWorkspacesByIdParams =           {
                'id': string;
          };

  type deleteTenantExecutionSchedulesByIdParams =           {
                'id': string;
          };

  type deleteTenantExecutionTasksByIdParams =           {
                'id': string;
          };

  type deleteTenantGitReposByIdParams =           {
                'id': string;
          };

  type deleteTenantHealingFlowsByIdParams =           {
                'id': string;
          };

  type deleteTenantHealingRulesByIdParams =           {
                'id': string;
                'force'?: boolean;
          };

  type deleteTenantPlaybooksByIdParams =           {
                'id': string;
          };

  type deleteTenantPluginsByIdParams =           {
                'id': string;
          };

  type deleteTenantRolesByIdParams =           {
                'id': string;
          };

  type deleteTenantSecretsSourcesByIdParams =           {
                'id': string;
          };

  type deleteTenantTemplatesByIdParams =           {
                'id': string;
          };

  type deleteTenantUsersByIdParams =           {
                'id': string;
          };

  type Error = {
    code?: number;
    message?: string;
    error_code?: string;
    details?: Record<string, unknown>;
  };

  type ExecutionLog = {
    id?: string;
    /** 执行记录ID */
    run_id?: string;
    log_level?: "debug" | "info" | "warn" | "error";
    stage?: "prepare" | "execute" | "cleanup";
    message?: string;
    host?: string;
    task_name?: string;
    play_name?: string;
    details?: Record<string, unknown>;
    sequence?: number;
    created_at?: string;
  };

  type ExecutionRun = {
    id?: string;
    task_id?: string;
    status?:
      | "pending"
      | "running"
      | "success"
      | "failed"
      | "cancelled"
      | "timeout";
    exit_code?: number;
    stats?: {
      ok?: number;
      changed?: number;
      unreachable?: number;
      failed?: number;
      skipped?: number;
    };
    triggered_by?: string;
    started_at?: string;
    completed_at?: string;
    created_at?: string;
    task?: ExecutionTask;
  };

  type ExecutionRunStats = {
    total_count?: number;
    success_count?: number;
    failed_count?: number;
    partial_count?: number;
    cancelled_count?: number;
    success_rate?: number;
    avg_duration_sec?: number;
    today_count?: number;
  };

  type ExecutionRunTopActiveItem = {
    task_id?: string;
    task_name?: string;
    total?: number;
  };

  type ExecutionRunTopFailedItem = {
    task_id?: string;
    task_name?: string;
    total?: number;
    failed?: number;
    fail_rate?: number;
  };

  type ExecutionRunTrendItem = {
    date?: string;
    status?:
      | "pending"
      | "running"
      | "success"
      | "failed"
      | "cancelled"
      | "partial";
    count?: number;
  };

  type ExecutionRunTriggerDistributionItem = {
    triggered_by?: string;
    count?: number;
  };

  type ExecutionSchedule = {
    id?: string;
    /** 调度名称 */
    name?: string;
    /** 关联的任务模板 ID */
    task_id?: string;
    /** Cron 表达式 */
    schedule_expr?: string;
    /** 是否循环执行 */
    is_recurring?: boolean;
    /** 下次执行时间 */
    next_run_at?: string;
    /** 是否启用 */
    enabled?: boolean;
    /** 描述 */
    description?: string;
    /** 覆盖目标主机（逗号分隔） */
    target_hosts_override?: string;
    /** 覆盖变量 */
    extra_vars_override?: Record<string, unknown>;
    /** 覆盖密钥源 */
    secrets_source_ids?: string[];
    /** 跳过通知（全局） */
    skip_notification?: boolean;
    created_at?: string;
    updated_at?: string;
    task?: ExecutionTask;
  };

  type ExecutionSection = {
    tasks_total?: number;
    runs_total?: number;
    success_rate?: number;
    running?: number;
    avg_duration_sec?: number;
    schedules_total?: number;
    schedules_enabled?: number;
    runs_by_status?: StatusCount[];
    trend_7d?: TrendPoint[];
    trend_30d?: TrendPoint[];
    schedules_by_type?: StatusCount[];
    task_top10?: RankItem[];
    recent_runs?: RunItem[];
    failed_runs?: RunItem[];
  };

  type ExecutionTask = {
    id?: string;
    /** 任务名称 */
    name?: string;
    /** 关联的 Playbook ID */
    playbook_id?: string;
    /** 目标主机 */
    target_hosts?: string;
    /** 变量值 */
    extra_vars?: Record<string, unknown>;
    executor_type?: "local" | "docker";
    /** 任务描述 */
    description?: string;
    /** 关联的密钥源 ID 列表 */
    secrets_source_ids?: string[];
    notification_config?: TaskNotificationConfig;
    /** Playbook 变量快照（创建时复制） */
    playbook_variables_snapshot?: Record<string, unknown>[];
    /** 是否需要审核（Playbook 变量已变更） */
    needs_review?: boolean;
    /** 变更的变量名列表 */
    changed_variables?: string[];
    created_at?: string;
    updated_at?: string;
    playbook?: Playbook;
  };

  type ExecutionTaskStats = {
    total?: number;
    docker?: number;
    local?: number;
    needs_review?: number;
    changed_playbooks?: number;
    ready?: number;
    never_executed?: number;
    last_run_failed?: number;
  };

  type FieldMapping = {
    /** username 字段路径，默认 "username" */
    username?: string;
    /** password 字段路径，默认 "password" */
    password?: string;
    /** private_key 字段路径，默认 "private_key" */
    private_key?: string;
  };

  type FileConfig = {
    /** SSH 密钥文件路径 */
    key_path: string;
    /** SSH 用户名，默认 root */
    username?: string;
  };

  type FilterOption = {
    label?: string;
    value?: string;
  };
}

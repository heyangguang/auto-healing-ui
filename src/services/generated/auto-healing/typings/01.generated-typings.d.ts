declare namespace GeneratedAutoHealing {
  type ActivateRequest = {
    /** 主入口文件 */
    main_playbook: string;
    /** 配置模式 */
    config_mode: string;
    /** enhanced 模式下的变量定义 */
    variables?: PlaybookVariable[];
  };

  type ApprovalItem = {
    id?: string;
    flow_instance_id?: string;
    node_id?: string;
    status?: string;
    created_at?: string;
  };

  type ApprovalTask = {
    id?: string;
    flow_instance_id?: string;
    node_id?: string;
    status?: string;
    timeout_at?: string;
    decided_by?: string;
    decided_at?: string;
    decision_comment?: string;
    created_at?: string;
  };

  type AssetItem = {
    id?: string;
    name?: string;
    type?: string;
    ip_address?: string;
    environment?: string;
  };

  type CloseIncidentRequest = {
    /** 解决方案描述 */
    resolution?: string;
    /** 工作备注 */
    work_notes?: string;
    /** 关闭代码 */
    close_code?: string;
    close_status?: "resolved" | "closed";
  };

  type CloseIncidentResponse = {
    message?: string;
    local_status?: string;
    source_updated?: boolean;
  };

  type CMDBItem = {
    id?: string;
    plugin_id?: string;
    source_plugin_name?: string;
    external_id?: string;
    name?: string;
    type?: string;
    status?: string;
    ip_address?: string;
    hostname?: string;
    os?: string;
    os_version?: string;
    cpu?: string;
    memory?: string;
    disk?: string;
    location?: string;
    owner?: string;
    environment?: string;
    manufacturer?: string;
    model?: string;
    serial_number?: string;
    department?: string;
    created_at?: string;
    updated_at?: string;
    /** 维护原因 */
    maintenance_reason?: string;
    /** 维护开始时间 */
    maintenance_start_at?: string;
    /** 维护结束时间 */
    maintenance_end_at?: string;
  };

  type CMDBMaintenanceLog = {
    id?: string;
    cmdb_item_id?: string;
    cmdb_item_name?: string;
    /** 操作类型 */
    action?: "enter" | "exit";
    /** 原因 */
    reason?: string;
    /** 计划结束时间 */
    scheduled_end_at?: string;
    /** 实际结束时间 */
    actual_end_at?: string;
    /** 退出方式 */
    exit_type?: "manual" | "auto";
    /** 操作人 */
    operator?: string;
    created_at?: string;
  };

  type CMDBSection = {
    total?: number;
    active?: number;
    maintenance?: number;
    offline?: number;
    active_rate?: number;
    by_status?: StatusCount[];
    by_environment?: StatusCount[];
    by_type?: StatusCount[];
    by_os?: StatusCount[];
    by_department?: StatusCount[];
    by_manufacturer?: StatusCount[];
    recent_maintenance?: MaintenanceItem[];
    offline_assets?: AssetItem[];
  };

  type CMDBStats = {
    total?: number;
    by_type?: { type?: string; count?: number }[];
    by_status?: { status?: string; count?: number }[];
    by_environment?: { environment?: string; count?: number }[];
  };

  type CommandBlacklist = {
    id?: string;
    tenant_id?: string;
    name?: string;
    pattern?: string;
    match_type?: string;
    severity?: string;
    category?: string;
    description?: string;
    is_active?: boolean;
    is_system?: boolean;
    created_at?: string;
    updated_at?: string;
  };

  type CommitInfo = {
    /** 短 commit ID */
    commit_id?: string;
    /** 完整 commit ID */
    full_id?: string;
    /** commit 消息 */
    message?: string;
    /** 作者名 */
    author?: string;
    /** 作者邮箱 */
    author_email?: string;
    /** 提交时间（ISO 8601） */
    date?: string;
  };

  type ConnectionTestResult = {
    cmdb_id?: string;
    /** IP 地址 */
    host?: string;
    /** 连接是否成功 */
    success?: boolean;
    /** 结果消息 */
    message?: string;
    /** 认证类型 (ssh_key 或 password) */
    auth_type?: string;
    /** 连接延迟（毫秒） */
    latency_ms?: number;
  };

  type CreateGitRepoRequest = {
    /** 仓库名称（全局唯一） */
    name: string;
    /** Git 仓库 URL */
    url: string;
    /** 默认分支 */
    default_branch?: string;
    /** 认证类型 */
    auth_type?: string;
    /** 认证配置，格式取决于 auth_type：
- token: { "token": "xxx" }
- password: { "username": "user", "password": "pass" }
- ssh_key: { "private_key": "-----BEGIN...", "passphrase": "可选" }
 */
    auth_config?: Record<string, unknown>;
    /** 是否启用定时同步 */
    sync_enabled?: boolean;
    /** 同步间隔，如 10s, 5m, 1h */
    sync_interval?: string;
  };

  type CreateSecretsSourceRequest = {
    name: string;
    type: string;
    /** SSH 认证类型 */
    auth_type: string;
    config: FileConfig | VaultConfig | WebhookConfig;
    is_default?: boolean;
    priority?: number;
  };

  type DashboardConfigPayload = {
    config?: Record<string, unknown>;
    system_workspaces?: DashboardSystemWorkspace[];
  };

  type DashboardOverview = {
    incidents?: IncidentSection;
    cmdb?: CMDBSection;
    healing?: HealingSection;
    execution?: ExecutionSection;
    plugins?: PluginSection;
    notifications?: NotificationSection;
    git?: GitSection;
    playbooks?: PlaybookSection;
    secrets?: SecretsSection;
    users?: UsersSection;
  };

  type DashboardSystemWorkspace = {
    id?: string;
    name?: string;
    description?: string;
    config?: Record<string, unknown>;
    is_system?: boolean;
    is_readonly?: boolean;
    is_default?: boolean;
  };

  type deleteCommonUserFavoritesByMenuKeyParams =           {
                'menu_key': string;
          };

  type deletePlatformDictionariesByIdParams =           {
                'id': string;
          };

  type deletePlatformRolesByIdParams =           {
                'id': string;
          };

  type deletePlatformTenantsByIdInvitationsByInvIdParams =           {
                'id': string;
                'invId': string;
          };

  type deletePlatformTenantsByIdMembersByUserIdParams =           {
                'id': string;
                'userId': string;
          };

  type deletePlatformTenantsByIdParams =           {
                'id': string;
          };
}

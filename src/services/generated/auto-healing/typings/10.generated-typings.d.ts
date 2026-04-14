declare namespace GeneratedAutoHealing {
  type SecretQuery = {
    hostname: string;
    ip_address?: string;
    /** 密钥源ID（可选，不指定则使用默认密钥源） */
    source_id?: string;
  };

  type SecretsSection = {
    total?: number;
    active?: number;
    by_type?: StatusCount[];
    by_auth_type?: StatusCount[];
  };

  type SecretsSource = {
    id?: string;
    name?: string;
    type?: string;
    /** SSH 认证类型（file 类型只支持 ssh_key） */
    auth_type?: string;
    /** 配置详情（根据 type 不同结构不同） */
    config?: Record<string, unknown>;
    /** 是否默认密钥源 */
    is_default?: boolean;
    /** 优先级（数字越小越优先） */
    priority?: number;
    status?: string;
    created_at?: string;
  };

  type SiteMessage = {
    id?: string;
    tenant_id?: string;
    target_tenant_id?: string;
    category?: string;
    title?: string;
    content?: string;
    created_at?: string;
    expires_at?: string;
  };

  type SiteMessageWithReadStatus =
    // #/components/schemas/SiteMessage
    SiteMessage & {
      is_read?: boolean;
    };

  type StatusCount = {
    status?: string;
    count?: number;
  };

  type Success = {
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  };

  type SyncItem = {
    id?: string;
    plugin_name?: string;
    status?: string;
    sync_type?: string;
    started_at?: string;
  };

  type SystemHealth = {
    status?: string;
    version?: string;
    uptime_seconds?: number;
    environment?: string;
    api_latency_ms?: number;
    db_latency_ms?: number;
  };

  type TaskNotificationConfig = {
    enabled?: boolean;
    on_start?: NotificationTriggerConfig;
    on_success?: NotificationTriggerConfig;
    on_failure?: NotificationTriggerConfig;
  };

  type TemplateVariable = {
    name?: string;
    category?:
      | "timestamp"
      | "execution"
      | "task"
      | "repository"
      | "stats"
      | "system"
      | "error";
    description?: string;
  };

  type TrendPoint = {
    date?: string;
    count?: number;
  };

  type TriggerItem = {
    id?: string;
    title?: string;
    severity?: string;
    affected_ci?: string;
    created_at?: string;
  };

  type UpdateGitRepoRequest = {
    /** 默认分支 */
    default_branch?: string;
    /** 认证类型 */
    auth_type?: string;
    /** 认证配置 */
    auth_config?: Record<string, unknown>;
    /** 是否启用定时同步 */
    sync_enabled?: boolean;
    /** 同步间隔，如 10s, 5m, 1h */
    sync_interval?: string;
  };

  type User = {
    id?: string;
    username?: string;
    email?: string;
    display_name?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
  };

  type UserInfo = {
    id?: string;
    username?: string;
    email?: string;
    display_name?: string;
    roles?: string[];
    permissions?: string[];
  };

  type UserProfile = {
    id?: string;
    username?: string;
    email?: string;
    display_name?: string;
    phone?: string;
    avatar_url?: string;
    status?: string;
    last_login_at?: string;
    last_login_ip?: string;
    password_changed_at?: string;
    created_at?: string;
    roles?: RoleDetail[];
    permissions?: string[];
    is_platform_admin?: boolean;
  };

  type UserSimple = {
    id?: string;
    username?: string;
    email?: string;
    display_name?: string;
    status?: string;
  };

  type UsersSection = {
    total?: number;
    active?: number;
    roles_total?: number;
    recent_logins?: LoginItem[];
  };

  type VaultAuth = {
    type: "token" | "approle";
    /** Token（type=token 时必填） */
    token?: string;
    /** AppRole Role ID（type=approle 时必填） */
    role_id?: string;
    /** AppRole Secret ID（type=approle 时必填） */
    secret_id?: string;
  };

  type VaultConfig = {
    /** Vault 服务地址 */
    address: string;
    /** 密钥基础路径 */
    secret_path: string;
    /** 命名空间（企业版） */
    namespace?: string;
    /** 查询键，系统自动拼接 secret_path/{query_key} */
    query_key?: "ip" | "hostname";
    auth: VaultAuth;
    field_mapping?: FieldMapping;
  };

  type WebhookAuth = {
    /** 认证类型 */
    type?: "none" | "basic" | "bearer" | "api_key";
    /** Basic Auth 用户名 */
    username?: string;
    /** Basic Auth 密码 */
    password?: string;
    /** Bearer Token */
    token?: string;
    /** API Key Header 名称 */
    header_name?: string;
    /** API Key 值 */
    api_key?: string;
  };

  type WebhookConfig = {
    /** 基础 URL */
    url: string;
    /** HTTP 方法，默认 GET */
    method?: "GET" | "POST";
    /** 查询键，系统自动拼接 url/{query_key} */
    query_key?: "ip" | "hostname";
    auth?: WebhookAuth;
    /** 超时秒数，默认 30 */
    timeout?: number;
    /** 响应数据根路径 */
    response_data_path?: string;
    field_mapping?: FieldMapping;
  };

  type WorkbenchIncidentStats = {
    pending_count?: number;
    last_7_days_total?: number;
  };

  type WorkbenchOverview = {
    system_health?: SystemHealth;
    resource_overview?: ResourceOverview;
    healing_stats?: HealingStats;
    incident_stats?: WorkbenchIncidentStats;
    host_stats?: HostStats;
  };
}

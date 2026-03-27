declare namespace GeneratedAutoHealing {
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
    auth_type?: "none" | "token" | "password" | "ssh_key";
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
    status?: "active" | "inactive";
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

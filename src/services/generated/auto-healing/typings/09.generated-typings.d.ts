declare namespace GeneratedAutoHealing {
  type putTenantPlaybooksByIdParams =           {
                'id': string;
          };

  type putTenantPlaybooksByIdVariablesParams =           {
                'id': string;
          };

  type putTenantPluginsByIdParams =           {
                'id': string;
          };

  type putTenantRolesByIdParams =           {
                'id': string;
          };

  type putTenantRolesByIdPermissionsParams =           {
                'id': string;
          };

  type putTenantSecretsSourcesByIdParams =           {
                'id': string;
          };

  type putTenantTemplatesByIdParams =           {
                'id': string;
          };

  type putTenantUsersByIdParams =           {
                'id': string;
          };

  type putTenantUsersByIdRolesParams =           {
                'id': string;
          };

  type RankItem = {
    name?: string;
    count?: number;
  };

  type RecentItem = {
    id?: string;
    title?: string;
    status?: string;
    created_at?: string;
  };

  type ResourceCount = {
    total?: number;
    enabled?: number;
    offline?: number;
    needs_review?: number;
    channels?: number;
    types?: string;
    admins?: number;
  };

  type ResourceOverview = {
    flows?: ResourceCount;
    rules?: ResourceCount;
    hosts?: ResourceCount;
    playbooks?: ResourceCount;
    schedules?: ResourceCount;
    notification_templates?: ResourceCount;
    secrets?: ResourceCount;
    users?: ResourceCount;
  };

  type Role = {
    id?: string;
    name?: string;
    display_name?: string;
    description?: string;
    is_system?: boolean;
    created_at?: string;
  };

  type RoleDetail = {
    id?: string;
    name?: string;
    display_name?: string;
    is_system?: boolean;
  };

  type RuleCondition = {
    /** 工单字段 (title, description, severity, etc.) */
    field?: string;
    operator?:
      | "equals"
      | "contains"
      | "in"
      | "regex"
      | "gt"
      | "lt"
      | "gte"
      | "lte";
    /** 匹配值 */
    value?: unknown;
  };

  type RunItem = {
    id?: string;
    task_name?: string;
    status?: string;
    started_at?: string;
    completed_at?: string;
    created_at?: string;
  };

  type ScanItem = {
    id?: string;
    playbook_name?: string;
    status?: string;
    created_at?: string;
  };

  type SearchableField = {
    key?: string;
    label?: string;
    type?: "text" | "enum" | "boolean" | "dateRange";
    match_modes?: string[];
    default_match_mode?: string;
    placeholder?: string;
    description?: string;
    options?: FilterOption[];
  };

  type SearchSchemaData = {
    fields?: SearchableField[];
  };

  type SearchSchemaResponse =
    // #/components/schemas/Success
    Success & {
      data?: SearchSchemaData;
    };

  type Secret = {
    /** 认证类型 */
    auth_type?: "ssh_key" | "password";
    /** SSH 用户名 */
    username?: string;
    /** 私钥内容（ssh_key 方式） */
    private_key?: string;
    /** 密码（password 方式） */
    password?: string;
  };

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
    type?: "vault" | "file" | "webhook";
    /** SSH 认证类型（file 类型只支持 ssh_key） */
    auth_type?: "ssh_key" | "password";
    /** 配置详情（根据 type 不同结构不同） */
    config?: Record<string, unknown>;
    /** 是否默认密钥源 */
    is_default?: boolean;
    /** 优先级（数字越小越优先） */
    priority?: number;
    status?: "active" | "inactive";
    created_at?: string;
  };

  type SiteMessage = {
    id?: string;
    tenant_id?: string;
    target_tenant_id?: string;
    category?:
      | "system_update"
      | "fault_alert"
      | "service_notice"
      | "product_news"
      | "activity"
      | "security"
      | "announcement";
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
}

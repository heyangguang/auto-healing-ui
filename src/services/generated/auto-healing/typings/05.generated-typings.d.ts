declare namespace GeneratedAutoHealing {
  type getTenantIncidentsParams =           {
                'page'?: number;
                'page_size'?: number;
                'plugin_id'?: string;
                'source_plugin_name'?: string;
                'search'?: string;
                'external_id'?: string;
                'status'?: string;
                'healing_status'?: string;
                'severity'?: string;
                'has_plugin'?: boolean;
                'sort_by'?: "created_at" | "severity";
                'sort_order'?: "asc" | "desc";
          };

  type getTenantNotificationsByIdParams =           {
                'id': string;
          };

  type getTenantNotificationsParams =           {
                'page'?: number;
                'page_size'?: number;
                'status'?: string;
                'task_name'?: string;
                'triggered_by'?: string;
                'subject'?: string;
                'channel_id'?: string;
                'template_id'?: string;
                'task_id'?: string;
                'execution_run_id'?: string;
                'created_after'?: string;
                'created_before'?: string;
                'sort_by'?: "created_at" | "status" | "subject" | "sent_at";
                'sort_order'?: "asc" | "desc";
          };

  type getTenantPlaybooksByIdFilesParams =           {
                'id': string;
          };

  type getTenantPlaybooksByIdParams =           {
                'id': string;
          };

  type getTenantPlaybooksByIdScanLogsParams =           {
                'id': string;
                'page'?: number;
                'page_size'?: number;
          };

  type getTenantPlaybooksParams =           {
                'page'?: number;
                'page_size'?: number;
                'repository_id'?: string;
                'status'?: string;
          };

  type getTenantPluginsByIdLogsParams =           {
                'id': string;
                'page'?: number;
                'page_size'?: number;
          };

  type getTenantPluginsByIdParams =           {
                'id': string;
          };

  type getTenantPluginsParams =           {
                'page'?: number;
                'page_size'?: number;
                'type'?: string;
                'status'?: string;
          };

  type getTenantRolesByIdParams =           {
                'id': string;
          };

  type getTenantRolesByIdUsersParams =           {
                'id': string;
                'page'?: number;
                'page_size'?: number;
                'name'?: string;
          };

  type getTenantSecretsSourcesByIdParams =           {
                'id': string;
          };

  type getTenantSecretsSourcesParams =           {
                'type'?: string;
                'status'?: string;
                'is_default'?: boolean;
          };

  type getTenantSiteMessagesParams =           {
                'page'?: number;
                'page_size'?: number;
                'keyword'?: string;
                'category'?: string;
                'is_read'?: string;
                'date_from'?: string;
                'date_to'?: string;
                'sort'?: string;
                'order'?: string;
          };

  type getTenantTemplatesByIdParams =           {
                'id': string;
          };

  type getTenantTemplatesParams =           {
                'page'?: number;
                'page_size'?: number;
                'event_type'?: string;
                'name'?: string;
                'format'?: string;
                'supported_channel'?: string;
                'is_active'?: boolean;
                'sort_by'?: "name" | "created_at" | "updated_at";
                'sort_order'?: "asc" | "desc";
          };

  type getTenantUsersByIdParams =           {
                'id': string;
          };

  type getTenantUsersParams =           {
                'page'?: number;
                'page_size'?: number;
                'status'?: string;
          };

  type getTenantUsersSimpleParams =           {
                'name'?: string;
                'status'?: string;
          };

  type GitRepoItem = {
    id?: string;
    name?: string;
    url?: string;
    status?: string;
    branch?: string;
    last_sync_at?: string;
  };

  type GitRepository = {
    id?: string;
    name?: string;
    url?: string;
    default_branch?: string;
    auth_type?: string;
    local_path?: string;
    last_sync_at?: string;
    status?: string;
    /** 错误信息（status=error 时） */
    error_message?: string;
    /** 最后同步的 commit ID */
    last_commit_id?: string;
    /** 是否启用定时同步 */
    sync_enabled?: boolean;
    /** 同步间隔，如 10s, 5m, 1h */
    sync_interval?: string;
    /** 下次同步时间 */
    next_sync_at?: string;
    created_at?: string;
    updated_at?: string;
  };

  type GitSection = {
    repos_total?: number;
    sync_success_rate?: number;
    repos?: GitRepoItem[];
    recent_syncs?: GitSyncItem[];
  };

  type GitSyncItem = {
    id?: string;
    repo_name?: string;
    status?: string;
    created_at?: string;
  };

  type GitSyncLog = {
    id?: string;
    repository_id?: string;
    /** 触发类型 */
    trigger_type?: string;
    /** 操作类型 */
    action?: "clone" | "pull";
    status?: string;
    /** 成功时的 commit ID */
    commit_id?: string;
    branch?: string;
    /** 耗时（毫秒） */
    duration_ms?: number;
    /** 失败时的错误信息 */
    error_message?: string;
    created_at?: string;
  };

  type HealingFlow = {
    id?: string;
    name?: string;
    description?: string;
    /** DAG 节点定义 */
    nodes?: FlowNode[];
    /** DAG 边定义 */
    edges?: FlowEdge[];
    is_active?: boolean;
    /** 流程成功完成后自动关闭源工单 */
    auto_close_source_incident?: boolean;
    created_by?: string;
    created_at?: string;
  };

  type HealingFlowCreate = {
    name: string;
    description?: string;
    nodes?: FlowNode[];
    edges?: FlowEdge[];
    is_active?: boolean;
    auto_close_source_incident?: boolean;
  };

  type HealingFlowUpdate = {
    name?: string;
    description?: string;
    nodes?: FlowNode[];
    edges?: FlowEdge[];
    is_active?: boolean;
    auto_close_source_incident?: boolean;
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
}

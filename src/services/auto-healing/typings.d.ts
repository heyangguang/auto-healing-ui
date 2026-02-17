/**
 * 运维自愈系统 API 类型定义
 * 基于 openapi.yaml 生成
 */

declare namespace AutoHealing {
    // ==================== 通用类型 ====================
    type UUID = string;

    interface PaginatedResponse<T> {
        data?: T[];
        items?: T[];
        pagination?: {
            page: number;
            page_size: number;
            total: number;
            total_pages: number;
        };
        total?: number;
        page?: number;
        page_size?: number;
    }

    interface SuccessResponse {
        message: string;
    }

    // 单主机测试响应
    interface TestQuerySingleResult {
        success: boolean;
        auth_type?: string;
        username?: string;
        has_credential: boolean;
        message: string;
    }

    // 批量测试响应
    interface TestQueryBatchResult {
        hostname: string;
        ip_address: string;
        success: boolean;
        auth_type?: string;
        username?: string;
        has_credential?: boolean;
        message: string;
    }

    interface TestQueryResponse {
        code: number;
        message: string;
        data: TestQuerySingleResult | {
            success_count: number;
            fail_count: number;
            results: TestQueryBatchResult[];
        };
    }

    interface ErrorResponse {
        error: {
            code: string;
            message: string;
            details?: string;
        };
    }

    // ==================== 认证 ====================
    interface LoginRequest {
        username: string;
        password: string;
    }

    interface LoginResponse {
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
        user: UserInfo;
    }

    interface RefreshTokenRequest {
        refresh_token: string;
    }

    interface RefreshTokenResponse {
        access_token: string;
        expires_in: number;
    }

    interface ChangePasswordRequest {
        old_password: string;
        new_password: string;
    }

    interface UserInfo {
        id: UUID;
        username: string;
        email: string;
        display_name: string;
        roles: string[];
        permissions: string[];
    }

    // ==================== 用户管理 ====================
    interface User {
        id: UUID;
        username: string;
        email: string;
        display_name: string;
        status: 'active' | 'inactive';
        created_at: string;
        updated_at: string;
    }

    interface CreateUserRequest {
        username: string;
        email: string;
        password: string;
        display_name?: string;
        role_ids?: UUID[];
    }

    interface UpdateUserRequest {
        email?: string;
        display_name?: string;
        status?: 'active' | 'inactive';
    }

    interface ResetPasswordRequest {
        new_password: string;
    }

    interface AssignRolesRequest {
        role_ids: UUID[];
    }

    // ==================== 角色管理 ====================
    interface Role {
        id: UUID;
        name: string;
        display_name: string;
        description: string;
        is_system: boolean;
        created_at: string;
    }

    interface CreateRoleRequest {
        name: string;
        display_name: string;
        description?: string;
    }

    interface UpdateRoleRequest {
        display_name?: string;
        description?: string;
    }

    interface AssignPermissionsRequest {
        permission_ids: UUID[];
    }

    // ==================== 权限管理 ====================
    interface Permission {
        id: UUID;
        code: string;
        name: string;
        module: string;
        resource: string;
        action: string;
    }

    type PermissionTree = Record<string, Permission[]>;

    // ==================== 用户资料（个人中心） ====================
    interface UserProfile {
        id: UUID;
        username: string;
        email: string;
        display_name: string;
        phone: string;
        avatar_url: string;
        status: 'active' | 'inactive';
        last_login_at: string | null;
        last_login_ip: string;
        password_changed_at: string;
        created_at: string;
        roles: RoleDetail[];
        permissions: string[];
    }

    interface RoleDetail {
        id: UUID;
        name: string;
        display_name: string;
        is_system: boolean;
    }

    interface UpdateProfileRequest {
        display_name?: string;
        email?: string;
        phone?: string;
    }

    // 角色列表（含统计）
    interface RoleWithStats extends Role {
        user_count: number;
        permission_count: number;
        permissions?: Permission[];
    }


    // ==================== 插件管理 ====================
    type PluginType = 'itsm' | 'cmdb';
    type PluginAdapter = 'servicenow' | 'jira' | 'zabbix' | 'custom';
    type PluginStatus = 'active' | 'inactive' | 'error';

    interface PluginConfig {
        url: string;
        auth_type: 'basic' | 'bearer' | 'api_key';
        username?: string;
        password?: string;
        token?: string;
        api_key?: string;
        api_key_header?: string;
        since_param?: string;
        response_data_path?: string;
        extra_params?: Record<string, string>;
        close_incident_url?: string;
        close_incident_method?: 'POST' | 'PUT' | 'PATCH';
    }

    interface Plugin {
        id: UUID;
        name: string;
        type: PluginType;
        adapter: PluginAdapter;
        description: string;
        version: string;
        status: PluginStatus;
        config: PluginConfig;
        field_mapping: FieldMapping;
        sync_filter: SyncFilter;
        sync_enabled: boolean;
        sync_interval_minutes: number;
        last_sync_at: string;
        next_sync_at: string;
        error_message?: string;
        created_at: string;
    }

    interface FieldMapping {
        incident_mapping?: Record<string, string>;
        cmdb_mapping?: Record<string, string>;
    }

    interface SyncFilter {
        logic: 'and' | 'or';
        rules: SyncFilterRule[];
    }

    interface SyncFilterRule {
        field: string;
        operator: 'equals' | 'contains' | 'in' | 'regex' | 'gt' | 'lt' | 'gte' | 'lte';
        value: any;
    }

    interface CreatePluginRequest {
        name: string;
        type: PluginType;
        adapter?: PluginAdapter;
        description?: string;
        version?: string;
        config: PluginConfig;
        field_mapping?: FieldMapping;
        sync_filter?: SyncFilter;
        sync_enabled?: boolean;
        sync_interval_minutes?: number;
    }

    interface UpdatePluginRequest {
        description?: string;
        version?: string;
        config?: PluginConfig;
        field_mapping?: FieldMapping;
        sync_filter?: SyncFilter;
        sync_enabled?: boolean;
        sync_interval_minutes?: number;
    }

    interface PluginSyncLog {
        id: UUID;
        plugin_id: UUID;
        sync_type: 'manual' | 'scheduled';
        status: 'running' | 'success' | 'failed';
        records_fetched: number;
        records_filtered: number;
        records_processed: number;
        records_new: number;
        records_updated: number;
        records_failed: number;
        details: {
            new_count?: number;
            updated_count?: number;
            filtered_records?: Array<{
                external_id: string;
                title: string;
                reason: string;
            }>;
        };
        started_at: string;
        completed_at: string;
        error_message?: string;
    }

    // ==================== 工单管理 ====================
    // severity 支持多种格式：文本格式 (critical/high/medium/low) 或数字格式 ("1"/"2"/"3"/"4")
    // 不同 ITSM 系统可能返回不同格式
    type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low' | '1' | '2' | '3' | '4' | string;
    type IncidentStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | string;
    type HealingStatus = 'pending' | 'processing' | 'healed' | 'failed' | 'skipped';

    interface Incident {
        id: UUID;
        plugin_id: UUID | null;
        source_plugin_name: string;
        external_id: string;
        title: string;
        description: string;
        severity: IncidentSeverity;
        priority: string;
        status: IncidentStatus;
        category: string;
        affected_ci: string;
        affected_service: string;
        assignee: string;
        reporter: string;
        raw_data: Record<string, any>;
        healing_status: HealingStatus;
        scanned: boolean;
        matched_rule_id: UUID | null;
        healing_flow_instance_id: UUID | null;
        workflow_instance_id: UUID | null;
        source_created_at: string | null;
        source_updated_at: string | null;
        created_at: string;
        updated_at: string;
    }

    interface BatchResetScanRequest {
        ids?: UUID[];
        healing_status?: HealingStatus;
    }

    interface BatchResetScanResponse {
        affected_count: number;
        message: string;
    }

    interface IncidentStats {
        total: number;
        scanned: number;
        unscanned: number;
        matched: number;
        pending: number;
        processing: number;
        healed: number;
        failed: number;
        skipped: number;
    }

    interface CloseIncidentRequest {
        resolution?: string;
        work_notes?: string;
        close_code?: string;
        close_status?: 'resolved' | 'closed';
    }

    interface CloseIncidentResponse {
        message: string;
        local_status: string;
        source_updated: boolean;
    }

    // ==================== CMDB ====================
    type CMDBItemType = 'server' | 'application' | 'network' | 'database';
    type CMDBItemStatus = 'active' | 'offline' | 'maintenance';
    type CMDBEnvironment = 'production' | 'staging' | 'development';

    interface CMDBItem {
        id: UUID;
        plugin_id: UUID | null;
        source_plugin_name: string;
        external_id: string;
        name: string;
        type: CMDBItemType;
        status: CMDBItemStatus;
        maintenance_reason: string | null;
        maintenance_start_at: string | null;
        maintenance_end_at: string | null;
        ip_address: string;
        hostname: string;
        os: string;
        os_version: string;
        cpu: string;
        memory: string;
        disk: string;
        location: string;
        owner: string;
        environment: CMDBEnvironment;
        manufacturer: string;
        model: string;
        serial_number: string;
        department: string;
        raw_data: Record<string, any> | null;
        created_at: string;
        updated_at: string;
    }

    interface CMDBStats {
        total: number;
        by_type: Array<{ type: string; count: number }>;
        by_status: Array<{ status: string; count: number }>;
        by_environment: Array<{ environment: string; count: number }>;
    }

    interface CMDBConnectionTestResult {
        cmdb_id: UUID;
        host: string;
        success: boolean;
        message: string;
        auth_type?: string;
        latency_ms?: number;
    }

    interface CMDBBatchConnectionTestResult {
        total: number;
        success: number;
        failed: number;
        results: CMDBConnectionTestResult[];
    }

    interface CMDBMaintenanceLog {
        id: UUID;
        cmdb_item_id: UUID;
        cmdb_item_name: string;
        action: 'enter' | 'exit';
        reason: string | null;
        scheduled_end_at: string | null;
        actual_end_at: string | null;
        exit_type: 'manual' | 'auto' | null;
        operator: string;
        created_at: string;
    }

    // ==================== 密钥管理 ====================
    type SecretsSourceType = 'vault' | 'file' | 'webhook';
    type AuthType = 'ssh_key' | 'password';

    interface SecretsSource {
        id: UUID;
        name: string;
        type: SecretsSourceType;
        auth_type: AuthType;
        config: Record<string, any>;
        is_default: boolean;
        priority: number;
        status: string;
        created_at: string;
    }

    interface CreateSecretsSourceRequest {
        name: string;
        type: SecretsSourceType;
        auth_type: AuthType;
        config: Record<string, any>;
        is_default?: boolean;
        priority?: number;
    }

    interface UpdateSecretsSourceRequest {
        name?: string;
        type?: SecretsSourceType;
        auth_type?: AuthType;
        config?: Record<string, any>;
        is_default?: boolean;
        priority?: number;
        status?: 'active' | 'inactive';
    }

    interface SecretQuery {
        hostname: string;
        ip_address?: string;
        auth_type?: AuthType;
        source_id: string;
    }

    interface Secret {
        auth_type: AuthType;
        username: string;
        private_key?: string;
        password?: string;
    }

    // ==================== Git 仓库 ====================
    type GitAuthType = 'none' | 'token' | 'password' | 'ssh_key';
    type GitRepoStatus = 'pending' | 'ready' | 'syncing' | 'error';

    interface GitRepository {
        id: UUID;
        name: string;
        url: string;
        default_branch: string;
        auth_type: GitAuthType;
        local_path: string;
        branches: string[] | null;
        last_sync_at: string | null;
        last_commit_id: string;
        status: GitRepoStatus;
        error_message?: string;
        sync_enabled: boolean;
        sync_interval: string;
        next_sync_at: string | null;
        created_at: string;
        updated_at: string;
    }

    interface CreateGitRepoRequest {
        name: string;
        url: string;
        default_branch?: string;
        auth_type?: GitAuthType;
        auth_config?: Record<string, any>;
        sync_enabled?: boolean;
        sync_interval?: string;
    }

    interface UpdateGitRepoRequest {
        default_branch?: string;
        auth_type?: GitAuthType;
        auth_config?: Record<string, any>;
        sync_enabled?: boolean;
        sync_interval?: string;
    }

    // ==================== Playbook 模板 ====================
    type PlaybookStatus = 'pending' | 'scanned' | 'ready' | 'error' | 'invalid';
    type PlaybookVariableType = 'string' | 'number' | 'boolean' | 'list' | 'object' | 'enum' | 'password';

    interface PlaybookVariableSource {
        file: string;
        line: number;
    }

    interface PlaybookVariable {
        name: string;
        type: PlaybookVariableType;
        required: boolean;
        default?: any;
        description: string;
        sources?: PlaybookVariableSource[];
        primary_source?: string;
        in_code?: boolean;
        enum?: string[];
        min?: number;
        max?: number;
        pattern?: string;
    }

    interface Playbook {
        id: UUID;
        repository_id: UUID;
        name: string;
        file_path: string;
        description: string;
        status: PlaybookStatus;
        config_mode: 'auto' | 'enhanced';
        variables: PlaybookVariable[];
        variables_count?: number;
        last_scanned_at: string | null;
        created_at: string;
        updated_at: string;
        // 关联信息（列表查询时可能包含）
        repository?: GitRepository;
    }

    interface CreatePlaybookRequest {
        repository_id: UUID;
        name: string;
        file_path: string;
        config_mode: 'auto' | 'enhanced';
        description?: string;
    }

    interface UpdatePlaybookRequest {
        name?: string;
        description?: string;
    }

    interface UpdatePlaybookVariablesRequest {
        variables: PlaybookVariable[];
    }

    interface PlaybookScanLog {
        id: UUID;
        playbook_id: UUID;
        trigger_type: 'manual' | 'auto' | 'sync';
        files_scanned: number;
        variables_found: number;
        new_count: number;
        removed_count: number;
        created_at: string;
    }

    type PlaybookFileType = 'entry' | 'task' | 'vars' | 'defaults' | 'handlers' | 'template' | 'file' | 'role' | 'include';

    interface PlaybookFile {
        path: string;
        type: PlaybookFileType;
    }

    // ==================== 执行任务 ====================
    type ExecutorType = 'local' | 'docker';
    type ExecutionStatus = 'pending' | 'running' | 'success' | 'partial' | 'failed' | 'cancelled' | 'timeout';

    // 单个触发器的通知配置
    interface TriggerNotificationConfig {
        enabled?: boolean;
        channel_ids?: UUID[];
        template_id?: UUID;
    }

    // 通知配置 - 支持按触发器独立配置渠道和模板
    interface NotificationConfig {
        enabled?: boolean;
        on_start?: TriggerNotificationConfig;
        on_success?: TriggerNotificationConfig;
        on_failure?: TriggerNotificationConfig;
        on_timeout?: TriggerNotificationConfig;
    }

    interface ExecutionTask {
        id: UUID;
        name: string;
        description?: string;
        playbook_id: UUID;
        target_hosts: string;
        extra_vars: Record<string, any>;
        executor_type: ExecutorType;
        secrets_source_ids?: UUID[];
        notification_config?: NotificationConfig;
        created_at: string;
        updated_at: string;
        playbook?: Playbook;
        needs_review?: boolean;
        changed_variables?: string[];
        playbook_variables_snapshot?: PlaybookVariable[];
    }

    interface CreateExecutionTaskRequest {
        name: string;
        description?: string;
        playbook_id: UUID;
        target_hosts: string;
        extra_vars?: Record<string, any>;
        executor_type?: ExecutorType;
        secrets_source_ids?: UUID[];
        notification_config?: NotificationConfig;
    }

    interface UpdateExecutionTaskRequest {
        name?: string;
        description?: string;
        playbook_id?: UUID;
        target_hosts?: string;
        secrets_source_ids?: UUID[];
        extra_vars?: Record<string, any>;
        executor_type?: ExecutorType;
        notification_config?: NotificationConfig;
    }

    interface ExecuteTaskRequest {
        triggered_by?: string;
        secrets_source_id?: UUID;
        secrets_source_ids?: UUID[];
        extra_vars?: Record<string, any>;
        target_hosts?: string;
        skip_notification?: boolean;
        additional_recipients?: string[];
    }

    interface ExecutionRun {
        id: UUID;
        task_id: UUID;
        status: ExecutionStatus;
        exit_code: number | null;
        stats: {
            ok: number;
            changed: number;
            unreachable: number;
            failed: number;
            skipped: number;
        };
        triggered_by: string;
        started_at: string;
        completed_at: string;
        created_at: string;
        task?: ExecutionTask;
        // 运行时参数快照
        runtime_target_hosts?: string;
        runtime_secrets_source_ids?: UUID[];
        runtime_extra_vars?: Record<string, any>;
        runtime_skip_notification?: boolean;
    }

    interface ExecutionLog {
        id: UUID;
        run_id: UUID;
        log_level: 'debug' | 'info' | 'warn' | 'error' | 'ok' | 'changed' | 'skipping' | 'failed' | 'fatal' | 'unreachable';
        level?: string;  // 后端可能返回 level 而不是 log_level
        stage: 'prepare' | 'execute' | 'cleanup' | 'output';
        message: string;
        host: string;
        task_name: string;
        play_name: string;
        details: Record<string, any>;
        sequence: number;
        created_at: string;
    }

    // ==================== 定时调度 ====================
    type ScheduleType = 'cron' | 'once';
    type ScheduleStatus = 'running' | 'pending' | 'completed' | 'disabled';

    interface ExecutionSchedule {
        id: UUID;
        name: string;
        task_id: UUID;
        schedule_type: ScheduleType;
        schedule_expr: string | null;  // cron模式的表达式
        scheduled_at: string | null;   // once模式的执行时间
        status: ScheduleStatus;        // 由后端计算
        next_run_at: string | null;
        last_run_at: string | null;
        enabled: boolean;
        description?: string;
        // Execution parameter overrides
        target_hosts_override?: string;
        extra_vars_override?: Record<string, any>;
        secrets_source_ids?: UUID[];
        skip_notification?: boolean;
        created_at: string;
        updated_at: string;
        task?: ExecutionTask;
    }

    interface CreateExecutionScheduleRequest {
        name: string;
        task_id: UUID;
        schedule_type: ScheduleType;
        schedule_expr?: string;     // cron模式必填
        scheduled_at?: string;      // once模式必填
        description?: string;
        // Execution parameter overrides
        target_hosts_override?: string;
        extra_vars_override?: Record<string, any>;
        secrets_source_ids?: UUID[];
        skip_notification?: boolean;
    }

    interface UpdateExecutionScheduleRequest {
        name?: string;
        schedule_type?: ScheduleType;
        schedule_expr?: string;
        scheduled_at?: string;
        description?: string;
        // Execution parameter overrides
        target_hosts_override?: string;
        extra_vars_override?: Record<string, any>;
        secrets_source_ids?: UUID[];
        skip_notification?: boolean;
    }

    // ==================== 通知模块 ====================
    type ChannelType = 'webhook' | 'dingtalk' | 'email';
    type EventType = 'execution_result' | 'execution_started' | 'alert';
    type TemplateFormat = 'text' | 'markdown' | 'html';
    type NotificationStatus = 'pending' | 'sent' | 'failed';

    interface NotificationChannel {
        id: UUID;
        name: string;
        type: ChannelType;
        description?: string;
        // Note: 'config' is NOT returned by API (sensitive data), only used in create/update requests
        retry_config?: {
            max_retries: number;
            retry_intervals: number[];
        };
        recipients: string[];
        is_active: boolean;
        is_default: boolean;
        rate_limit_per_minute?: number;
        created_at: string;
        updated_at: string;
    }

    interface CreateChannelRequest {
        name: string;
        type: ChannelType;
        description?: string;
        config: Record<string, any>;
        retry_config?: {
            max_retries: number;
            retry_intervals: number[];
        };
        default_recipients?: string[];
        is_default?: boolean;
    }

    interface UpdateChannelRequest {
        name?: string;
        description?: string;
        config?: Record<string, any>;
        is_active?: boolean;
        is_default?: boolean;
        retry_config?: {
            max_retries: number;
            retry_intervals: number[];
        };
        default_recipients?: string[];
    }

    interface NotificationTemplate {
        id: UUID;
        name: string;
        description: string;
        event_type: EventType;
        supported_channels: ChannelType[];
        subject_template: string;
        body_template: string;
        format: TemplateFormat;
        available_variables: string[];
        is_active: boolean;
        created_at: string;
        updated_at: string;
    }

    interface CreateTemplateRequest {
        name: string;
        description?: string;
        event_type: EventType;
        supported_channels: ChannelType[];
        subject_template: string;
        body_template: string;
        format?: TemplateFormat;
        is_active?: boolean;
    }

    interface UpdateTemplateRequest {
        name?: string;
        description?: string;
        event_type?: EventType;
        supported_channels?: ChannelType[];
        subject_template?: string;
        body_template?: string;
        format?: TemplateFormat;
        is_active?: boolean;
    }

    interface PreviewTemplateRequest {
        sample_data?: Record<string, any>;
    }

    interface PreviewTemplateResponse {
        subject: string;
        body: string;
    }

    interface TemplateVariable {
        name: string;
        category: 'timestamp' | 'execution' | 'task' | 'repository' | 'stats' | 'system' | 'error';
        description: string;
    }

    interface Notification {
        id: UUID;
        execution_run_id?: UUID;
        workflow_instance_id?: UUID;
        incident_id?: UUID;
        template_id?: UUID;
        channel_id: UUID;
        status: NotificationStatus;
        subject: string;
        body: string;
        recipients: string[];
        retry_count: number;
        error_message: string | null;
        response_data?: Record<string, any>;
        next_retry_at?: string;
        sent_at: string | null;
        created_at: string;
        // Expanded objects
        template?: NotificationTemplate;
        channel?: NotificationChannel;
    }

    interface SendNotificationRequest {
        channel_ids: UUID[];
        template_id?: UUID;
        subject: string;
        body: string;
        variables?: Record<string, any>;
    }

    interface SendNotificationResponse {
        sent_count: number;
        failed_count: number;
        results: Array<{
            channel_id: string;
            status: 'sent' | 'failed';
            error?: string;
        }>;
    }

    // ==================== 自愈引擎 ====================
    type TriggerMode = 'auto' | 'manual';
    type MatchMode = 'all' | 'any';
    type FlowInstanceStatus = 'pending' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'cancelled';
    type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';
    type NodeType = 'start' | 'end' | 'host_extractor' | 'cmdb_validator' | 'approval' | 'execution' | 'notification' | 'condition' | 'set_variable' | 'compute';
    type ConditionOperator = 'equals' | 'contains' | 'in' | 'regex' | 'gt' | 'lt' | 'gte' | 'lte';

    interface FlowNodeConfig {
        // host_extractor
        source_field?: string;
        extract_mode?: 'split' | 'regex';
        split_by?: string;
        output_key?: string;
        // cmdb_validator
        input_key?: string;
        // approval
        title?: string;
        description?: string;
        approvers?: string[];
        approver_roles?: string[];
        timeout_hours?: number;
        // execution
        task_template_id?: UUID;
        hosts_key?: string;
        executor_type?: ExecutorType;
        extra_vars?: Record<string, any>;
        // notification
        template_id?: UUID;
        channel_ids?: UUID[];
        // condition
        condition?: string;
        true_target?: string;
        false_target?: string;
        // set_variable
        key?: string;
        value?: any;
        [key: string]: any;
    }

    // ==================== Node Schema (节点类型定义) ====================

    /** 节点端口定义 */
    interface NodePort {
        id: string;
        name: string;
        condition?: string;
    }

    /** 节点端口配置 */
    interface NodePorts {
        in: number;
        out: number;
        out_ports?: NodePort[];
    }

    /** 节点配置参数定义 */
    interface NodeConfigSchema {
        type: string;
        required?: string;
        default?: string;
        description?: string;
    }

    /** 单个节点类型定义 */
    interface NodeTypeDefinition {
        name: string;
        description: string;
        config: Record<string, NodeConfigSchema>;
        ports: NodePorts;
        inputs: string[];
        outputs: string[];
    }

    /** 完整节点 Schema 响应 */
    interface NodeSchema {
        initial_context: Record<string, any>;
        nodes: Record<NodeType, NodeTypeDefinition>;
    }

    interface HealingFlow {
        id: UUID;
        name: string;
        description: string;
        nodes: FlowNode[];
        edges: FlowEdge[];
        is_active: boolean;
        created_by: UUID;
        created_at: string;
        updated_at?: string;
    }

    interface FlowNode {
        id: string;
        type: NodeType;
        name: string;
        position: { x: number; y: number };
        config: FlowNodeConfig;
    }

    interface FlowEdge {
        source: string;
        target: string;
        from?: string; // Legacy support
        to?: string; // Legacy support
        /** 源节点输出口 ID (如 success/failed/approved/rejected/true/false) */
        sourceHandle?: string;
        condition?: string;
        label?: string;
        id?: string;
    }

    interface CreateFlowRequest {
        name: string;
        description?: string;
        nodes?: FlowNode[];
        edges?: FlowEdge[];
        is_active?: boolean;
    }

    interface UpdateFlowRequest {
        name?: string;
        description?: string;
        nodes?: FlowNode[];
        edges?: FlowEdge[];
        is_active?: boolean;
    }

    // ==================== Dry-Run ====================

    interface MockIncident {
        title?: string;
        severity?: string;
        priority?: string;
        category?: string;
        affected_ci?: string;
        raw_data?: Record<string, any>;
    }

    interface DryRunRequest {
        mock_incident: MockIncident;
        from_node_id?: string;
        context?: Record<string, any>;
        /** 模拟审批结果，格式: {"节点ID": "approved" | "rejected"} */
        mock_approvals?: Record<string, 'approved' | 'rejected'>;
    }

    /** Dry-Run 节点状态 - 与真实执行状态一致 */
    type DryRunNodeStatus = 'success' | 'failed' | 'error';

    interface DryRunNodeResult {
        node_id: string;
        node_type: string;
        node_name?: string;
        status: DryRunNodeStatus;
        message: string;
        /** 节点输入（上游数据 + 当前全局上下文快照） */
        input?: Record<string, any>;
        /** 执行过程日志（详细记录每一步操作） */
        process?: string[];
        /** 节点输出（传给下游的数据） */
        output?: Record<string, any>;
    }

    interface DryRunResponse {
        success: boolean;
        message: string;
        nodes: DryRunNodeResult[];
    }

    // ==================== Instance Retry ====================

    interface RetryInstanceRequest {
        from_node_id?: string;
        /** 初始上下文（用于重试，包含之前执行的变量输出） */
        context?: Record<string, any>;
    }

    interface HealingRule {
        id: UUID;
        name: string;
        description: string;
        priority: number;
        trigger_mode: TriggerMode;
        conditions: RuleCondition[];
        match_mode: MatchMode;
        flow_id: UUID;
        is_active: boolean;
        last_run_at: string | null;
        created_at: string;
    }

    interface RuleCondition {
        field: string;
        operator: ConditionOperator;
        value: any;
    }

    interface CreateRuleRequest {
        name: string;
        description?: string;
        priority?: number;
        trigger_mode?: TriggerMode;
        conditions?: RuleCondition[];
        match_mode?: MatchMode;
        flow_id?: UUID;
        is_active?: boolean;
    }

    interface UpdateRuleRequest {
        name?: string;
        description?: string;
        priority?: number;
        trigger_mode?: TriggerMode;
        conditions?: RuleCondition[];
        match_mode?: MatchMode;
        flow_id?: UUID;
        is_active?: boolean;
    }

    interface FlowInstance {
        id: UUID;
        flow_id: UUID;
        rule_id: UUID | null;
        incident_id: UUID | null;
        status: FlowInstanceStatus;
        current_node_id: string;
        error_message: string | null;
        started_at: string | null;
        completed_at: string | null;
        created_at: string;
        updated_at?: string;
        // Lightweight list fields (pre-computed by backend)
        flow_name?: string;
        rule_name?: string;
        incident_title?: string;
        node_count?: number;
        failed_node_count?: number;
        // Snapshot fields (detail API returns flat fields instead of nested flow object)
        flow_nodes?: FlowNode[];
        flow_edges?: FlowEdge[];
        // Expanded details (only in detail API)
        rule?: HealingRule;
        incident?: Incident;
        node_states?: Record<string, FlowNodeState | string>;
        context?: Record<string, any>;
    }

    interface FlowNodeState {
        status: FlowInstanceStatus;
        title?: string;
        description?: string;
        task_id?: UUID;
        created_at?: string;
        updated_at?: string;
        timeout_at?: string;
        run_id?: UUID;
        stats?: {
            ok: number;
            failed: number;
        };
        error_message?: string;
    }

    interface FlowExecutionLog {
        id: UUID;
        flow_instance_id: UUID;
        node_id: string;
        node_type: NodeType;
        level: 'debug' | 'info' | 'warn' | 'error';
        message: string;
        details: Record<string, any>;
        created_at: string;
    }

    // severity 支持多种格式：文本格式 (critical/high/medium/low) 或数字格式 ("1"/"2"/"3"/"4")
    // 不同 ITSM 系统可能返回不同格式
    type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low' | '1' | '2' | '3' | '4' | string;
    type IncidentStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | string;
    type HealingStatus = 'pending' | 'processing' | 'healed' | 'failed' | 'skipped';

    interface Incident {
        id: UUID;
        plugin_id: UUID | null;
        source_plugin_name: string;
        external_id: string;
        title: string;
        description: string;
        severity: IncidentSeverity;
        priority: string;
        status: IncidentStatus;
        category: string;
        affected_ci: string;
        affected_service: string;
        assignee: string;
        reporter: string;
        raw_data: Record<string, any>;
        healing_status: HealingStatus;
        scanned: boolean;
        matched_rule_id: UUID | null;
        healing_flow_instance_id: UUID | null;
        workflow_instance_id: UUID | null;
        source_created_at: string | null;
        source_updated_at: string | null;
        created_at: string;
        updated_at: string;
        // Expanded details
        plugin?: {
            id: UUID;
            name: string;
            type: string;
        };
    }

    // ... (intermediate code omitted) ...

    interface ApprovalTask {
        id: UUID;
        flow_instance_id: UUID;
        node_id: string;
        status: ApprovalStatus;
        timeout_at: string | null;
        decided_by: UUID | null;
        decided_at: string | null;
        decision_comment: string | null;
        created_at: string;
        // Expanded Fields from API/Context
        node_name?: string;
        approvers?: string[];
        flow_instance?: FlowInstance;
        // Context might be nested or flattened depending on API, adding flexible typing for now
        context?: Record<string, any>;
        // Some APIs return description or title for the approval step
        title?: string;
        description?: string;
    }

    interface ApprovalDecisionRequest {
        comment?: string;
    }

    // ==================== Playbook 模板 ====================
    interface Playbook {
        id: UUID;
        repository_id: UUID;
        repository_name?: string;
        name: string;
        file_path: string;
        description?: string;
        status: PlaybookStatus;
        variables: PlaybookVariable[];
        variables_count?: number;
        last_scan_at?: string;
        created_at: string;
        updated_at?: string;
    }

    interface PlaybookVariable {
        name: string;
        type: 'string' | 'number' | 'boolean' | 'list' | 'object' | 'enum' | 'password';
        required: boolean;
        default?: any;
        description?: string;
        enum?: string[];
        min?: number;
        max?: number;
        sources?: { file: string; line: number }[];
        primary_source?: string;
        in_code?: boolean;
    }

    interface PlaybookScanLog {
        id: UUID;
        playbook_id: UUID;
        trigger_type: 'manual' | 'auto' | 'sync';
        scan_mode?: 'auto' | 'enhanced';
        files_scanned: number;
        variables_found: number;
        new_count: number;
        removed_count: number;
        error_message?: string;
        created_at: string;
    }

    interface CreatePlaybookRequest {
        repository_id: UUID;
        name: string;
        file_path: string;
        description?: string;
    }

    interface UpdatePlaybookRequest {
        name?: string;
        description?: string;
    }

    interface UpdatePlaybookVariablesRequest {
        variables: Partial<PlaybookVariable>[];
    }

    interface ScanPlaybookRequest {
        mode?: 'auto' | 'enhanced';
    }

    // ==================== 自愈规则 ====================
    type TriggerMode = 'auto' | 'manual';
    type MatchMode = 'all' | 'any';
    type ConditionOperator = 'equals' | 'contains' | 'in' | 'regex' | 'gt' | 'lt' | 'gte' | 'lte';

    type HealingRuleCondition = {
        type?: 'condition' | 'group'; // Default 'condition'
        // For type='condition'
        field?: string;
        operator?: ConditionOperator;
        value?: any;
        // For type='group'
        logic?: 'AND' | 'OR';
        conditions?: HealingRuleCondition[];
    };

    interface HealingRule {
        id: UUID;
        name: string;
        description?: string;
        priority: number;
        trigger_mode: TriggerMode;
        conditions: HealingRuleCondition[];
        match_mode: MatchMode;
        flow_id: UUID;
        is_active: boolean;
        last_run_at: string | null;
        created_at: string;
        updated_at: string;
        created_by?: UUID;
        // Expanded objects
        flow?: {
            id: UUID;
            name: string;
            description?: string;
            is_active: boolean;
        };
    }

    interface CreateHealingRuleRequest {
        name: string;
        description?: string;
        priority?: number;
        trigger_mode?: TriggerMode;
        conditions?: HealingRuleCondition[];
        match_mode?: MatchMode;
        flow_id?: UUID;
        is_active?: boolean;
    }

    interface UpdateHealingRuleRequest {
        name?: string;
        description?: string;
        priority?: number;
        trigger_mode?: TriggerMode;
        conditions?: HealingRuleCondition[];
        match_mode?: MatchMode;
        flow_id?: UUID;
        is_active?: boolean;
    }


}


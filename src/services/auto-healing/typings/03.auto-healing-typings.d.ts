declare namespace AutoHealing {
    interface SecretsSourceConfig {
        address?: string;
        auth?: {
            type?: string;
            [key: string]: unknown;
        };
        key_path?: string;
        method?: string;
        path?: string;
        path_template?: string;
        secret_path?: string;
        url?: string;
        username?: string;
        [key: string]: unknown;
    }

    interface SecretsSource {
        id: UUID;
        name: string;
        type: SecretsSourceType;
        auth_type: AuthType;
        config: SecretsSourceConfig;
        is_default: boolean;
        priority: number;
        status: string;
        created_at: string;
    }

    interface CreateSecretsSourceRequest {
        name: string;
        type: SecretsSourceType;
        auth_type: AuthType;
        config: SecretsSourceConfig;
        is_default?: boolean;
        priority?: number;
    }

    interface UpdateSecretsSourceRequest {
        name?: string;
        type?: SecretsSourceType;
        auth_type?: AuthType;
        config?: SecretsSourceConfig;
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
        max_failures?: number;
        next_sync_at: string | null;
        created_at: string;
        updated_at: string;
    }

    interface CreateGitRepoRequest {
        name: string;
        url: string;
        default_branch?: string;
        auth_type?: GitAuthType;
        auth_config?: JsonObject;
        sync_enabled?: boolean;
        sync_interval?: string;
        max_failures?: number;
    }

    interface UpdateGitRepoRequest {
        default_branch?: string;
        auth_type?: GitAuthType;
        auth_config?: JsonObject;
        sync_enabled?: boolean;
        sync_interval?: string;
        max_failures?: number;
    }

    // ==================== Playbook 模板 ====================

    type PlaybookStatus = 'pending' | 'scanned' | 'ready' | 'error' | 'invalid';

    type PlaybookVariableType = 'string' | 'number' | 'boolean' | 'list' | 'object' | 'dict' | 'enum' | 'password' | 'choice';

    interface PlaybookVariableSource {
        file: string;
        line: number;
    }

    interface PlaybookVariable {
        name: string;
        type: PlaybookVariableType;
        required: boolean;
        default?: JsonValue;
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
        /** Legacy field - some playbooks may still use this */
        scanned_variables?: PlaybookVariable[];
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
        extra_vars: JsonObject;
        executor_type: ExecutorType;
        secrets_source_ids?: UUID[];
        notification_config?: NotificationConfig;
        created_at: string;
        updated_at: string;
        playbook?: Playbook;
        needs_review?: boolean;
        changed_variables?: Array<string | { name: string; new?: string; old?: string }>;
        playbook_variables_snapshot?: PlaybookVariable[];
    }

    interface CreateExecutionTaskRequest {
        name: string;
        description?: string;
        playbook_id: UUID;
        target_hosts: string;
        extra_vars?: JsonObject;
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
        extra_vars?: JsonObject;
        executor_type?: ExecutorType;
        notification_config?: NotificationConfig;
    }
}

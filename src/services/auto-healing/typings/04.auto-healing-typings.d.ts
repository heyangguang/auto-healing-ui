declare namespace AutoHealing {
    interface ExecuteTaskRequest {
        triggered_by?: string;
        secrets_source_id?: UUID;
        secrets_source_ids?: UUID[];
        extra_vars?: JsonObject;
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
        runtime_extra_vars?: JsonObject;
        runtime_skip_notification?: boolean;
        ended_at?: string;
        duration_ms?: number;
        error_message?: string;
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
        details: JsonObject;
        sequence: number;
        created_at: string;
    }

    // ==================== 定时调度 ====================

    type ScheduleType = 'cron' | 'once';

    type ScheduleStatus = 'running' | 'pending' | 'completed' | 'disabled' | 'auto_paused';

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
        max_failures?: number;
        // Execution parameter overrides
        target_hosts_override?: string;
        extra_vars_override?: JsonObject;
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
        extra_vars_override?: JsonObject;
        secrets_source_ids?: UUID[];
        skip_notification?: boolean;
    }

    interface UpdateExecutionScheduleRequest {
        name?: string;
        schedule_type?: ScheduleType;
        schedule_expr?: string;
        scheduled_at?: string;
        description?: string;
        max_failures?: number;
        // Execution parameter overrides
        target_hosts_override?: string;
        extra_vars_override?: JsonObject;
        secrets_source_ids?: UUID[];
        skip_notification?: boolean;
    }

    // ==================== 通知模块 ====================

    type ChannelType = 'webhook' | 'dingtalk' | 'email';

    type EventType = 'execution_result' | 'execution_started' | 'alert';

    type TemplateFormat = 'text' | 'markdown' | 'html';

    type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';

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
        /** Alias for is_active used in some contexts */
        enabled?: boolean;
        is_default: boolean;
        rate_limit_per_minute?: number;
        created_at: string;
        updated_at: string;
    }

    interface CreateChannelRequest {
        name: string;
        type: ChannelType;
        description?: string;
        config: JsonObject;
        retry_config?: {
            max_retries: number;
            retry_intervals: number[];
        };
        recipients?: string[];
        is_default?: boolean;
        rate_limit_per_minute?: number;
    }

    interface UpdateChannelRequest {
        name?: string;
        description?: string;
        config?: JsonObject;
        is_active?: boolean;
        is_default?: boolean;
        retry_config?: {
            max_retries: number;
            retry_intervals: number[];
        };
        recipients?: string[];
        rate_limit_per_minute?: number;
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
        variables?: JsonObject;
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
        response_data?: JsonObject;
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
        variables?: JsonObject;
    }
}

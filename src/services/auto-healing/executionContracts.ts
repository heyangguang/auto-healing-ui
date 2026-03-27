export type RequestDataResponse<T> = T | { data?: T; code?: number; message?: string };

export type PaginatedApiResponse<T> =
    | AutoHealing.PaginatedResponse<T>
    | {
        data?: T[] | { items?: T[]; total?: number; page?: number; page_size?: number };
        items?: T[];
        total?: number;
        page?: number;
        page_size?: number;
        pagination?: { total?: number; page?: number; page_size?: number };
    }
    | T[];

export type DataEnvelope<T> = { data: T };

export type RawExecutionStatus = AutoHealing.ExecutionStatus | 'partial_success';

export type ExecutionStatusQuery = AutoHealing.ExecutionStatus | 'partial_success';

export interface ExecutionTaskStatsSummary {
    total: number;
    docker: number;
    local: number;
    needs_review: number;
    changed_playbooks: number;
}

export interface ExecutionScheduleStatsSummary {
    total: number;
    enabled_count: number;
    disabled_count: number;
    by_status: Array<{ status: string; count: number }>;
    by_schedule_type: Array<{ schedule_type: string; count: number }>;
}

export interface ScheduleTimelineItem {
    id: string;
    name: string;
    schedule_type: string;
    schedule_expr?: string;
    scheduled_at?: string;
    status: string;
    enabled: boolean;
    next_run_at: string;
    last_run_at?: string;
    task_id: string;
    task_name: string;
}

export interface GetExecutionTasksParams {
    page?: number;
    page_size?: number;
    playbook_id?: string;
    search?: string;
    name?: string;
    name__exact?: string;
    description?: string;
    description__exact?: string;
    executor_type?: string;
    status?: string;
    needs_review?: boolean;
    target_hosts?: string;
    target_hosts__exact?: string;
    playbook_name?: string;
    playbook_name__exact?: string;
    repository_name?: string;
    repository_name__exact?: string;
    has_logs?: boolean;
    has_runs?: boolean;
    min_run_count?: number;
    last_run_status?: string;
    sort_by?: string;
    sort_order?: string;
    created_from?: string;
    created_to?: string;
    [key: string]: unknown;
}

export interface GetExecutionRunsParams {
    page?: number;
    page_size?: number;
    run_id?: string;
    task_name?: string;
    status?: AutoHealing.ExecutionStatus;
    task_id?: string;
    search?: string;
    triggered_by?: string;
    started_after?: string;
    started_before?: string;
}

export interface GetExecutionSchedulesParams {
    page?: number;
    page_size?: number;
    search?: string;
    name?: string;
    task_id?: string;
    enabled?: boolean;
    schedule_type?: string;
    skip_notification?: boolean;
    has_overrides?: boolean;
    status?: string;
    created_from?: string;
    created_to?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

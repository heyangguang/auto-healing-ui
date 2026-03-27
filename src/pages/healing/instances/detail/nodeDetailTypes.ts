import type { LogEntry } from '@/components/execution/LogConsole';

export type NodeStateLike = Record<string, unknown> & {
    activated_branch?: string;
    decision_comment?: string;
    description?: string;
    duration_ms?: number;
    error?: string;
    error_message?: string;
    extract_mode?: string;
    extracted_hosts?: string[] | string;
    finished_at?: string;
    hosts?: string[];
    invalid_hosts?: string[];
    matched_expression?: string;
    message?: string;
    response?: unknown;
    result?: unknown;
    run?: {
        exit_code?: number;
        run_id?: string;
        stats?: {
            changed?: number;
            failed?: number;
            ok?: number;
            skipped?: number;
            unreachable?: number;
        };
        task_id?: string;
    };
    sent_at?: string;
    source_field?: string;
    started_at?: string;
    stats?: {
        changed?: number;
        failed?: number;
        ok?: number;
        skipped?: number;
        unreachable?: number;
    };
    status?: string;
    stdout?: string;
    target_hosts?: string;
    task_id?: string;
    timeout_at?: string;
    title?: string;
    validated_hosts?: string[];
    validation_summary?: string;
    variables_set?: unknown;
    computed_results?: unknown;
};

export type SelectedNodeDataLike = {
    config?: Record<string, unknown>;
    id: string;
    logs?: LogEntry[];
    name?: string;
    state?: NodeStateLike;
    status?: string;
    type?: string;
};

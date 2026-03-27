declare namespace AutoHealing {
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
        rejected_node_count?: number;
        // Snapshot fields (detail API returns flat fields instead of nested flow object)
        flow_nodes?: FlowNode[];
        flow_edges?: FlowEdge[];
        // Expanded details (only in detail API)
        rule?: HealingRule;
        incident?: Incident;
        node_states?: Record<string, FlowNodeState | string>;
        context?: JsonObject;
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
        details: JsonObject;
        created_at: string;
    }

    // severity 支持多种格式：文本格式 (critical/high/medium/low) 或数字格式 ("1"/"2"/"3"/"4")
    // 不同 ITSM 系统可能返回不同格式

    type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low' | '1' | '2' | '3' | '4' | string;

    type IncidentStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | string;

    type HealingStatus = 'pending' | 'processing' | 'healed' | 'failed' | 'skipped' | 'dismissed';

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
        raw_data: JsonObject;
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
        context?: JsonObject;
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
        default?: JsonValue;
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
        value?: ConditionValue;
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
        flow_id?: UUID | null;
        is_active?: boolean;
    }

    interface UpdateHealingRuleRequest {
        name?: string;
        description?: string;
        priority?: number;
        trigger_mode?: TriggerMode;
        conditions?: HealingRuleCondition[];
        match_mode?: MatchMode;
        flow_id?: UUID | null;
        is_active?: boolean;
    }
}

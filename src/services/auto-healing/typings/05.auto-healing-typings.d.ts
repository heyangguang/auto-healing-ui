declare namespace AutoHealing {
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
        extra_vars?: JsonObject;
        // notification
        template_id?: UUID;
        channel_ids?: UUID[];
        // condition
        condition?: string;
        true_target?: string;
        false_target?: string;
        // set_variable
        key?: string;
        value?: unknown;
        [key: string]: unknown;
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
        initial_context: JsonObject;
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
        /** 目标节点输入口 ID */
        targetHandle?: string;
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
        raw_data?: JsonObject;
    }

    interface DryRunRequest {
        mock_incident: MockIncident;
        from_node_id?: string;
        context?: JsonObject;
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
        input?: JsonObject;
        /** 执行过程日志（详细记录每一步操作） */
        process?: string[];
        /** 节点输出（传给下游的数据） */
        output?: JsonObject;
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
        context?: JsonObject;
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
        value: ConditionValue;
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

    /** Alias for FlowInstance, used in healing trigger response */

    type HealingFlowInstance = FlowInstance;
}

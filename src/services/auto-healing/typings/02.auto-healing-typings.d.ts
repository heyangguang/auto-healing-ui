declare namespace AutoHealing {
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
        [key: string]: unknown;
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
        [key: string]: unknown;
    }

    interface SyncFilter {
        logic: 'and' | 'or';
        rules: SyncFilterRule[];
        [key: string]: unknown;
    }

    interface SyncFilterRule {
        field: string;
        operator: 'equals' | 'contains' | 'in' | 'regex' | 'gt' | 'lt' | 'gte' | 'lte';
        value: JsonValue;
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
        dismissed: number;
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

    type CMDBEnvironment = 'production' | 'staging' | 'test' | 'dev';

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
        raw_data: JsonObject | null;
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
}

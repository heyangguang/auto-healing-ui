/**
 * 自愈系统类型定义
 * 与后端 OpenAPI 文档保持一致
 */
declare namespace AutoHealing {
    // ==================== 通用类型 ====================

    /** 分页响应 */
    interface PaginatedResponse<T> {
        data: T[];
        pagination?: {
            page: number;
            page_size: number;
            total: number;
            total_pages?: number;
        };
        total?: number;
        page?: number;
        page_size?: number;
    }

    /** 成功响应 */
    interface SuccessResponse {
        message: string;
    }

    // ==================== 插件相关 ====================

    /** 认证类型 */
    type AuthType = 'basic' | 'bearer' | 'api_key';

    /** 插件类型 */
    type PluginType = 'itsm' | 'cmdb';

    /** 插件状态 */
    type PluginStatus = 'active' | 'inactive' | 'error';

    /** 插件连接配置 */
    interface PluginConfig {
        /** API地址 (必填) */
        url: string;
        /** 认证方式 (必填) */
        auth_type: AuthType;
        /** Basic认证 - 用户名 */
        username?: string;
        /** Basic认证 - 密码 */
        password?: string;
        /** Bearer认证 - Token */
        token?: string;
        /** API Key认证 - Key值 */
        api_key?: string;
        /** API Key认证 - Header名称，默认 X-API-Key */
        api_key_header?: string;
        /** 增量同步时间参数名 */
        since_param?: string;
        /** 响应数据路径，如 data.items */
        response_data_path?: string;
        /** 关闭工单接口URL (ITSM专用) */
        close_incident_url?: string;
        /** 关闭工单方法，默认 POST */
        close_incident_method?: string;
    }

    /** 同步过滤规则 */
    interface SyncFilterRule {
        /** 字段名 */
        field: string;
        /** 操作符 */
        operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'regex' | 'in' | 'not_in';
        /** 匹配值 */
        value: string | string[];
    }

    /** 同步过滤器 */
    interface SyncFilter {
        /** 逻辑运算符 */
        logic: 'and' | 'or';
        /** 规则列表 */
        rules: (SyncFilterRule | SyncFilter)[];
    }

    /** 字段映射配置 */
    interface FieldMapping {
        /** 工单字段映射 */
        incident_mapping?: Record<string, string>;
        /** CMDB字段映射 */
        cmdb_mapping?: Record<string, string>;
    }

    /** 插件实体 */
    interface Plugin {
        id: string;
        name: string;
        type: PluginType;
        description?: string;
        version?: string;
        status: PluginStatus;
        config: PluginConfig;
        field_mapping?: FieldMapping;
        sync_filter?: SyncFilter;
        sync_enabled?: boolean;
        sync_interval_minutes?: number;
        last_sync_at?: string;
        next_sync_at?: string;
        error_message?: string;
        created_at: string;
        updated_at: string;
    }

    /** 创建插件请求 */
    interface CreatePluginRequest {
        name: string;
        type: PluginType;
        description?: string;
        version?: string;
        config: PluginConfig;
        field_mapping?: FieldMapping;
        sync_filter?: SyncFilter;
        sync_enabled?: boolean;
        sync_interval_minutes?: number;
    }

    /** 更新插件请求 */
    interface UpdatePluginRequest {
        description?: string;
        config?: Partial<PluginConfig>;
        field_mapping?: FieldMapping;
        sync_filter?: SyncFilter;
        sync_enabled?: boolean;
        sync_interval_minutes?: number;
    }

    /** 同步日志状态 */
    type SyncLogStatus = 'running' | 'success' | 'failed';

    /** 同步类型 */
    type SyncType = 'manual' | 'scheduled';

    /** 插件同步日志 */
    interface PluginSyncLog {
        id: string;
        plugin_id: string;
        sync_type: SyncType;
        status: SyncLogStatus;
        records_fetched?: number;
        records_processed?: number;
        records_failed?: number;
        details?: {
            new_count?: number;
            updated_count?: number;
        };
        started_at?: string;
        completed_at?: string;
        error_message?: string;
    }

    // ==================== 工单相关 ====================

    /** 严重程度 */
    type Severity = 'critical' | 'high' | 'medium' | 'low';

    /** 工单状态 */
    type IncidentStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

    /** 自愈状态 */
    type HealingStatus = 'pending' | 'processing' | 'healed' | 'failed' | 'skipped';

    /** 工单实体 */
    interface Incident {
        id: string;
        plugin_id?: string;
        source_plugin_name?: string;
        external_id: string;
        title: string;
        description?: string;
        severity?: Severity;
        priority?: string;
        status: IncidentStatus;
        category?: string;
        healing_status?: HealingStatus;
        created_at: string;
        updated_at: string;
    }

    // ==================== CMDB相关 ====================

    /** CMDB类型 */
    type CMDBType = 'server' | 'application' | 'network' | 'database';

    /** CMDB状态 */
    type CMDBStatus = 'active' | 'inactive' | 'maintenance';

    /** CMDB环境 */
    type CMDBEnvironment = 'production' | 'staging' | 'development';

    /** CMDB配置项 */
    interface CMDBItem {
        id: string;
        plugin_id?: string;
        source_plugin_name?: string;
        external_id: string;
        name: string;
        type: CMDBType;
        status: CMDBStatus;
        ip_address?: string;
        hostname?: string;
        os?: string;
        os_version?: string;
        environment?: CMDBEnvironment;
        owner?: string;
        department?: string;
        created_at: string;
        updated_at: string;
    }
}

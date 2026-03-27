import { useRequest } from '@umijs/max';
import { getDashboardOverview } from '@/services/auto-healing/dashboard';

const getTenantCacheScope = () => {
    try {
        const impersonationRaw = localStorage.getItem('impersonation-storage');
        if (impersonationRaw) {
            const impersonation = JSON.parse(impersonationRaw);
            const tenantId = impersonation?.session?.tenantId;
            if (tenantId) return `impersonation:${tenantId}`;
        }
    } catch {
        // ignore malformed storage
    }

    try {
        const tenantRaw = localStorage.getItem('tenant-storage');
        if (tenantRaw) {
            const tenantStorage = JSON.parse(tenantRaw);
            if (tenantStorage?.currentTenantId) {
                return `tenant:${tenantStorage.currentTenantId}`;
            }
        }
    } catch {
        // ignore malformed storage
    }

    return 'platform';
};

type StatusCountItem = {
    status?: string;
    count?: number;
};

type NameCountItem = {
    name?: string;
    count?: number;
};

type DateCountItem = {
    date?: string;
    count?: number;
};

type DashboardListItem = Record<string, unknown>;

type IncidentsSectionData = Record<string, unknown> & {
    total?: number;
    today?: number;
    this_week?: number;
    unscanned?: number;
    healing_rate?: number;
    by_status?: StatusCountItem[];
    by_healing_status?: StatusCountItem[];
    by_category?: StatusCountItem[];
    by_source?: StatusCountItem[];
    trend_7d?: DateCountItem[];
    trend_30d?: DateCountItem[];
    recent_incidents?: DashboardListItem[];
    critical_incidents?: DashboardListItem[];
};

type CmdbSectionData = Record<string, unknown> & {
    total?: number;
    active?: number;
    offline?: number;
    maintenance?: number;
    by_status?: StatusCountItem[];
    by_environment?: Array<StatusCountItem & { environment?: string }>;
    by_type?: StatusCountItem[];
    by_os?: StatusCountItem[];
    by_department?: StatusCountItem[];
    by_manufacturer?: StatusCountItem[];
    recent_maintenance?: DashboardListItem[];
    offline_assets?: DashboardListItem[];
};

type HealingSectionData = Record<string, unknown> & {
    flows_total?: number;
    flows_active?: number;
    rules_total?: number;
    rules_active?: number;
    instances_total?: number;
    instances_running?: number;
    pending_approvals?: number;
    pending_triggers?: number;
    instances_by_status?: StatusCountItem[];
    instance_trend_7d?: DateCountItem[];
    approvals_by_status?: StatusCountItem[];
    rules_by_trigger_mode?: StatusCountItem[];
    flow_top10?: NameCountItem[];
    recent_instances?: DashboardListItem[];
    pending_approval_list?: DashboardListItem[];
    pending_trigger_list?: DashboardListItem[];
};

type ExecutionSectionData = Record<string, unknown> & {
    runs_total?: number;
    running?: number;
    success_rate?: number;
    avg_duration_sec?: number;
    schedules_total?: number;
    schedules_enabled?: number;
    runs_by_status?: StatusCountItem[];
    trend_7d?: DateCountItem[];
    trend_30d?: DateCountItem[];
    schedules_by_type?: StatusCountItem[];
    task_top10?: NameCountItem[];
    recent_runs?: DashboardListItem[];
    failed_runs?: DashboardListItem[];
};

type PluginsSectionData = Record<string, unknown> & {
    total?: number;
    active?: number;
    error?: number;
    sync_success_rate?: number;
    by_status?: StatusCountItem[];
    by_type?: StatusCountItem[];
    sync_trend_7d?: DateCountItem[];
    recent_syncs?: DashboardListItem[];
    error_plugins?: DashboardListItem[];
    plugin_overview?: DashboardListItem[];
    plugins_list?: DashboardListItem[];
};

type NotificationsSectionData = Record<string, unknown> & {
    channels_total?: number;
    templates_total?: number;
    delivery_rate?: number;
    logs_total?: number;
    by_channel_type?: StatusCountItem[];
    by_log_status?: StatusCountItem[];
    trend_7d?: DateCountItem[];
    recent_logs?: DashboardListItem[];
    failed_logs?: DashboardListItem[];
};

type GitSectionData = Record<string, unknown> & {
    repos_total?: number;
    sync_success_rate?: number;
    repos?: DashboardListItem[];
    recent_syncs?: DashboardListItem[];
};

type PlaybooksSectionData = Record<string, unknown> & {
    total?: number;
    ready?: number;
    by_status?: StatusCountItem[];
    recent_scans?: DashboardListItem[];
};

type SecretsSectionData = Record<string, unknown> & {
    total?: number;
    active?: number;
    by_type?: StatusCountItem[];
    by_auth_type?: StatusCountItem[];
};

type UsersSectionData = Record<string, unknown> & {
    total?: number;
    active?: number;
    roles_total?: number;
    recent_logins?: DashboardListItem[];
};

export type DashboardSectionMap = {
    incidents: IncidentsSectionData;
    cmdb: CmdbSectionData;
    healing: HealingSectionData;
    execution: ExecutionSectionData;
    plugins: PluginsSectionData;
    notifications: NotificationsSectionData;
    git: GitSectionData;
    playbooks: PlaybooksSectionData;
    secrets: SecretsSectionData;
    users: UsersSectionData;
};

export type DashboardSectionKey = keyof DashboardSectionMap;

/**
 * Dashboard Section 数据 Hook
 *
 * 调用 /api/v1/dashboard/overview 接口获取指定 section 的数据
 *
 * 性能优化策略：
 * 1. cacheKey — 同一 section 在多个组件间共享缓存，避免重复请求
 * 2. staleTime — 30秒内不重新请求（SWR 策略）
 * 3. pollingInterval — 60秒自动刷新
 */
export function useDashboardSection<S extends DashboardSectionKey>(section: S) {
    const tenantCacheScope = getTenantCacheScope();
    type DashboardOverviewResult = Record<string, unknown> & {
        data?: Record<string, unknown>;
    };
    const { data: rawData, loading, refresh } = useRequest(
        () => getDashboardOverview([section], { skipTokenRefresh: true }),
        {
            cacheKey: `dashboard-section-${tenantCacheScope}-${section}`,
            staleTime: 30000,     // 30s 内使用缓存，不重新请求
            refreshDeps: [section, tenantCacheScope],
            pollingInterval: 60000, // 60s 自动刷新
            formatResult: (res: DashboardOverviewResult) => res,
        }
    );

    // 后端返回结构为 { code: 0, data: { [section]: { ... } } }
    // umi request 返回完整 body，需要先访问 .data
    const data =
        (rawData?.data?.[section] as DashboardSectionMap[S] | undefined)
        ?? (rawData?.[section] as DashboardSectionMap[S] | undefined)
        ?? null;

    return {
        data,
        loading,
        refresh,
    };
}

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { useAccess, history } from '@umijs/max';
import { message } from 'antd';
import StandardTable, { type StandardTableProps } from '@/components/StandardTable';
import {
    activatePlugin,
    deactivatePlugin,
    deletePlugin,
    getPluginSyncLogs,
    getPlugins,
    getPluginsStats,
    type PluginListParams,
    type PluginRecord,
    syncPlugin,
    testPlugin,
} from '@/services/auto-healing/plugins';
import { shouldApplyPluginLogResponse } from './pluginFormHelpers';
import PluginDetailDrawer from './PluginDetailDrawer';
import { buildPluginColumns, PluginStatsBar } from './pluginTableColumns';
import {
    PLUGIN_ADVANCED_SEARCH_FIELDS,
    PLUGIN_LIST_HEADER_ICON,
    PLUGIN_SEARCH_FIELDS,
} from './pluginShared';
import './index.css';

type PluginPageAccess = {
    canCreatePlugin?: boolean;
    canDeletePlugin?: boolean;
    canSyncPlugin?: boolean;
    canTestPlugin?: boolean;
    canUpdatePlugin?: boolean;
};

type PluginTableRequestParams = Parameters<NonNullable<StandardTableProps<PluginRecord>['request']>>[0];
type PluginStats = Awaited<ReturnType<typeof getPluginsStats>>['data'];

// ============ 主组件 ============
const PluginList: React.FC = () => {
    const access = useAccess() as PluginPageAccess;
    const [stats, setStats] = useState<PluginStats>({
        total: 0,
        active_count: 0,
        inactive_count: 0,
        error_count: 0,
        sync_enabled: 0,
        sync_disabled: 0,
        by_type: { itsm: 0, cmdb: 0 },
        by_status: { active: 0, inactive: 0, error: 0 },
    });

    const loadStats = useCallback(async () => {
        try {
            const response = await getPluginsStats();
            setStats(response.data);
        } catch { /* silent */ }
    }, []);
    useEffect(() => { loadStats(); }, [loadStats]);

    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [testingId, setTestingId] = useState<string>();
    const [syncingId, setSyncingId] = useState<string>();
    const [activatingId, setActivatingId] = useState<string>();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentPlugin, setCurrentPlugin] = useState<PluginRecord | null>(null);
    const [activeTab, setActiveTab] = useState('detail');
    const [syncLogs, setSyncLogs] = useState<AutoHealing.PluginSyncLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const currentPluginIdRef = useRef<string | undefined>(undefined);
    const logRequestIdRef = useRef(0);

    const triggerRefresh = useCallback(() => {
        setRefreshTrigger(n => n + 1);
        loadStats();
    }, [loadStats]);

    // ======= 操作 =======
    const loadLogs = useCallback(async (pluginId: string, showLoading = false) => {
        const requestId = logRequestIdRef.current + 1;
        logRequestIdRef.current = requestId;
        if (showLoading) setLogsLoading(true);
        try {
            const response = await getPluginSyncLogs(pluginId, { page: 1, page_size: 10 });
            if (!shouldApplyPluginLogResponse({
                requestId,
                latestRequestId: logRequestIdRef.current,
                pluginId,
                currentPluginId: currentPluginIdRef.current,
            })) {
                return;
            }
            setSyncLogs(response.data || []);
        }
        catch { /* global */ } finally {
            if (showLoading && requestId === logRequestIdRef.current) {
                setLogsLoading(false);
            }
        }
    }, []);

    const openDetail = useCallback((plugin: PluginRecord, tab: string = 'detail') => {
        currentPluginIdRef.current = plugin.id;
        setCurrentPlugin(plugin);
        setDrawerOpen(true);
        setActiveTab(tab);
        loadLogs(plugin.id, true);
    }, [loadLogs]);
    const openCreate = useCallback(() => { history.push('/resources/plugins/create'); }, []);
    const openEdit = useCallback((p: PluginRecord) => { history.push(`/resources/plugins/${p.id}/edit`); }, []);

    const handleTest = useCallback(async (id: string) => {
        setTestingId(id);
        try { await testPlugin(id); message.success('连接测试成功'); }
        catch { /* global */ } finally { setTestingId(undefined); triggerRefresh(); }
    }, [triggerRefresh]);

    const handleSync = useCallback(async (id: string) => {
        setSyncingId(id);
        try { await syncPlugin(id); message.success('同步已启动'); }
        catch { /* global */ } finally { setSyncingId(undefined); triggerRefresh(); }
    }, [triggerRefresh]);

    const handleDelete = useCallback(async (id: string) => {
        try {
            await deletePlugin(id);
            message.success('已删除');
            if (currentPlugin?.id === id) {
                currentPluginIdRef.current = undefined;
                setDrawerOpen(false);
                setCurrentPlugin(null);
                setSyncLogs([]);
            }
            triggerRefresh();
        } catch { /* global */ }
    }, [currentPlugin, triggerRefresh]);

    const handleActivate = useCallback(async (id: string) => {
        setActivatingId(id);
        try {
            await activatePlugin(id);
            message.success('激活成功');
            if (currentPlugin?.id === id) {
                setCurrentPlugin(prev => prev ? { ...prev, status: 'active' } : prev);
            }
        }
        catch { /* global */ } finally { setActivatingId(undefined); triggerRefresh(); }
    }, [triggerRefresh, currentPlugin]);

    const handleDeactivate = useCallback(async (id: string) => {
        setActivatingId(id);
        try {
            await deactivatePlugin(id);
            message.success('已停用');
            if (currentPlugin?.id === id) {
                setCurrentPlugin(prev => prev ? { ...prev, status: 'inactive' } : prev);
            }
        }
        catch { /* global */ } finally { setActivatingId(undefined); triggerRefresh(); }
    }, [triggerRefresh, currentPlugin]);

    useEffect(() => {
        currentPluginIdRef.current = currentPlugin?.id;
    }, [currentPlugin]);

    useEffect(() => {
        if (!drawerOpen || !currentPlugin) return;
        const interval = setInterval(() => loadLogs(currentPlugin.id, false), 5000);
        return () => clearInterval(interval);
    }, [drawerOpen, currentPlugin, loadLogs]);

    const columns = useMemo(() => buildPluginColumns({
        access,
        activatingId,
        onActivate: handleActivate,
        onDeactivate: handleDeactivate,
        onDelete: handleDelete,
        onEdit: openEdit,
        onOpenDetail: openDetail,
        onSync: handleSync,
        onTest: handleTest,
        syncingId,
        testingId,
    }), [access, activatingId, handleActivate, handleDeactivate, handleDelete, handleSync, handleTest, openDetail, openEdit, syncingId, testingId]);

    const handleRequest = useCallback(async (params: PluginTableRequestParams) => {
        const apiParams: PluginListParams = {
            page: params.page,
            page_size: params.pageSize,
        };
        if (params.searchValue) {
            apiParams.name = params.searchValue;
        }
        if (params.advancedSearch) {
            const advanced = params.advancedSearch as Partial<PluginListParams>;
            if (advanced.name) apiParams.name = advanced.name;
            if (advanced.name__exact) apiParams.name__exact = advanced.name__exact;
            if (advanced.description) apiParams.description = advanced.description;
            if (advanced.description__exact) apiParams.description__exact = advanced.description__exact;
            if (advanced.type) apiParams.type = advanced.type;
            if (advanced.status) apiParams.status = advanced.status;
        }
        if (params.sorter?.field) {
            apiParams.sort_by = params.sorter.field;
            apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
        }

        const response = await getPlugins(apiParams);
        const items = response.data || [];
        const total = response.pagination?.total || response.total || items.length;
        return { data: items, total };
    }, []);

    const normalizedStats = useMemo(() => ({
        total: stats.total || 0,
        active: stats.active_count || stats.by_status?.active || 0,
        inactive: stats.inactive_count || stats.by_status?.inactive || 0,
        error: stats.error_count || stats.by_status?.error || 0,
        itsm: stats.by_type?.itsm || 0,
        cmdb: stats.by_type?.cmdb || 0,
    }), [stats]);

    return (
        <>
            <StandardTable<PluginRecord>
                refreshTrigger={refreshTrigger}
                tabs={[{ key: 'list', label: '插件列表' }]}
                title="插件管理"
                description="管理 ITSM 和 CMDB 数据源插件，配置连接、同步和字段映射。"
                headerIcon={PLUGIN_LIST_HEADER_ICON}
                headerExtra={<PluginStatsBar stats={normalizedStats} />}
                searchFields={PLUGIN_SEARCH_FIELDS}
                advancedSearchFields={PLUGIN_ADVANCED_SEARCH_FIELDS}
                primaryActionLabel="新建插件"
                primaryActionIcon={<PlusOutlined />}
                primaryActionDisabled={!access.canCreatePlugin}
                onPrimaryAction={openCreate}
                columns={columns}
                rowKey="id"
                onRowClick={openDetail}
                request={handleRequest}
                defaultPageSize={20}
                preferenceKey="plugins_v2"
            />
            <PluginDetailDrawer
                access={access}
                activeTab={activeTab}
                currentPlugin={currentPlugin}
                logsLoading={logsLoading}
                onActiveTabChange={setActiveTab}
                onClose={() => {
                    currentPluginIdRef.current = undefined;
                    setDrawerOpen(false);
                    setCurrentPlugin(null);
                    setSyncLogs([]);
                }}
                onSync={handleSync}
                onTest={handleTest}
                open={drawerOpen}
                syncLogs={syncLogs}
            />
        </>
    );
};

export default PluginList;

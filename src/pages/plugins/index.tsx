import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    PlusOutlined, SyncOutlined, ApiOutlined, SettingOutlined,
    CheckCircleOutlined, DeleteOutlined, ExclamationCircleOutlined,
    CloseCircleOutlined, SearchOutlined,
    PlayCircleOutlined, PauseCircleOutlined, HistoryOutlined,
    CloudOutlined, InfoCircleOutlined, LinkOutlined, FilterOutlined,
} from '@ant-design/icons';
import { useAccess, history } from '@umijs/max';
import {
    Space, Tooltip, message, Typography, Tag, Button, Badge,
    Drawer, Spin, Popconfirm, Table, Tabs,
} from 'antd';
import dayjs from 'dayjs';
import StandardTable from '@/components/StandardTable';
import type { StandardColumnDef, SearchField, AdvancedSearchField } from '@/components/StandardTable';
import {
    getPlugins, getPluginsStats, deletePlugin,
    testPlugin, syncPlugin, activatePlugin, deactivatePlugin, getPluginSyncLogs,
} from '@/services/auto-healing/plugins';
import './index.css';

const { Text } = Typography;

// ============ 常量 ============
const PLUGIN_TYPES = [
    { value: 'itsm', label: 'ITSM - 工单系统', icon: '🎫', color: '#1890ff', bgColor: '#e6f7ff' },
    { value: 'cmdb', label: 'CMDB - 配置管理', icon: '🗄️', color: '#52c41a', bgColor: '#f6ffed' },
];
const AUTH_TYPES = [
    { value: 'basic', label: 'Basic 认证 (用户名/密码)' },
    { value: 'bearer', label: 'Bearer Token' },
    { value: 'api_key', label: 'API Key' },
];
const FILTER_OPERATORS = [
    { value: 'equals', label: '等于' }, { value: 'not_equals', label: '不等于' },
    { value: 'contains', label: '包含' }, { value: 'not_contains', label: '不包含' },
    { value: 'starts_with', label: '以...开头' }, { value: 'ends_with', label: '以...结尾' },
    { value: 'regex', label: '正则匹配' },
    { value: 'in', label: '在列表中 (逗号分隔)' }, { value: 'not_in', label: '不在列表中 (逗号分隔)' },
];
const ITSM_FIELDS = [
    { value: 'external_id', label: '外部工单ID' }, { value: 'title', label: '标题' },
    { value: 'description', label: '描述' }, { value: 'severity', label: '严重程度' },
    { value: 'priority', label: '优先级' }, { value: 'status', label: '状态' },
    { value: 'category', label: '分类' }, { value: 'affected_ci', label: '受影响配置项' },
    { value: 'affected_service', label: '受影响服务' }, { value: 'assignee', label: '处理人' },
    { value: 'reporter', label: '报告人' },
];
const CMDB_FIELDS = [
    { value: 'external_id', label: '外部ID' }, { value: 'name', label: '名称' },
    { value: 'type', label: '类型' }, { value: 'status', label: '状态' },
    { value: 'ip_address', label: 'IP地址' }, { value: 'hostname', label: '主机名' },
    { value: 'os', label: '操作系统' }, { value: 'os_version', label: '系统版本' },
    { value: 'cpu', label: 'CPU' }, { value: 'memory', label: '内存' },
    { value: 'disk', label: '磁盘' }, { value: 'location', label: '位置' },
    { value: 'owner', label: '负责人' }, { value: 'environment', label: '环境' },
    { value: 'manufacturer', label: '厂商' }, { value: 'model', label: '型号' },
    { value: 'serial_number', label: '序列号' }, { value: 'department', label: '部门' },
];

const getTypeConfig = (type: string) => PLUGIN_TYPES.find(t => t.value === type) || PLUGIN_TYPES[0];

// ============ 搜索 ============
const searchFields: SearchField[] = [{ key: 'keyword', label: '名称' }];
const advancedSearchFields: AdvancedSearchField[] = [
    { key: 'keyword', label: '名称', type: 'input', placeholder: '插件名称' },
    {
        key: 'type', label: '类型', type: 'select', placeholder: '全部类型',
        options: [{ label: 'ITSM', value: 'itsm' }, { label: 'CMDB', value: 'cmdb' }]
    },
    {
        key: 'status', label: '状态', type: 'select', placeholder: '全部状态',
        options: [{ label: '运行中', value: 'active' }, { label: '未激活', value: 'inactive' }, { label: '异常', value: 'error' }]
    },
];

const headerIcon = (
    <svg viewBox="0 0 48 48" fill="none">
        <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M24 16v16M16 24h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
    </svg>
);

// ============ 主组件 ============
const PluginList: React.FC = () => {
    const access = useAccess();

    // 统计
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, error: 0, itsm: 0, cmdb: 0 });
    const loadStats = useCallback(async () => {
        try {
            const res = await getPluginsStats();
            const d = res.data;
            setStats({
                total: d.total || 0,
                active: d.active_count || d.by_status?.active || 0,
                inactive: d.inactive_count || d.by_status?.inactive || 0,
                error: d.error_count || d.by_status?.error || 0,
                itsm: d.by_type?.itsm || 0, cmdb: d.by_type?.cmdb || 0,
            });
        } catch { /* silent */ }
    }, []);
    useEffect(() => { loadStats(); }, [loadStats]);

    // 状态
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [testingId, setTestingId] = useState<string>();
    const [syncingId, setSyncingId] = useState<string>();
    const [activatingId, setActivatingId] = useState<string>();



    // 详情 Drawer
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentPlugin, setCurrentPlugin] = useState<AutoHealing.Plugin | null>(null);
    const [activeTab, setActiveTab] = useState('detail');

    // 同步日志 (内嵌在详情 Drawer 中)
    const [syncLogs, setSyncLogs] = useState<AutoHealing.PluginSyncLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);

    const triggerRefresh = useCallback(() => {
        setRefreshTrigger(n => n + 1);
        loadStats();
    }, [loadStats]);

    // ======= 操作 =======
    const loadLogs = useCallback(async (pluginId: string, showLoading = false) => {
        if (showLoading) setLogsLoading(true);
        try { const res = await getPluginSyncLogs(pluginId, { page: 1, page_size: 10 }); setSyncLogs(res.data || []); }
        catch { /* global */ } finally { if (showLoading) setLogsLoading(false); }
    }, []);

    const openDetail = useCallback((plugin: AutoHealing.Plugin, tab: string = 'detail') => {
        setCurrentPlugin(plugin);
        setDrawerOpen(true);
        setActiveTab(tab);
        loadLogs(plugin.id, true);
    }, [loadLogs]);
    const openCreate = useCallback(() => { history.push('/resources/plugins/create'); }, []);
    const openEdit = useCallback((p: AutoHealing.Plugin) => { history.push(`/resources/plugins/${p.id}/edit`); }, []);

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
        try { await deletePlugin(id); message.success('已删除'); triggerRefresh(); } catch { /* global */ }
    }, [triggerRefresh]);

    const handleActivate = useCallback(async (id: string) => {
        setActivatingId(id);
        try { await activatePlugin(id); message.success('激活成功'); }
        catch { /* global */ } finally { setActivatingId(undefined); triggerRefresh(); }
    }, [triggerRefresh]);

    const handleDeactivate = useCallback(async (id: string) => {
        setActivatingId(id);
        try { await deactivatePlugin(id); message.success('已停用'); }
        catch { /* global */ } finally { setActivatingId(undefined); triggerRefresh(); }
    }, [triggerRefresh]);


    useEffect(() => {
        if (!drawerOpen || !currentPlugin) return;
        const interval = setInterval(() => loadLogs(currentPlugin.id, false), 5000);
        return () => clearInterval(interval);
    }, [drawerOpen, currentPlugin, loadLogs]);

    // ======= 列 =======
    const columns = useMemo<StandardColumnDef<AutoHealing.Plugin>[]>(() => [
        {
            columnKey: 'name', columnTitle: '名称', fixedColumn: true, dataIndex: 'name', width: 220, sorter: true,
            render: (_: any, r: AutoHealing.Plugin) => {
                const tc = getTypeConfig(r.type);
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{tc.icon}</span>
                        <div>
                            <a style={{ fontWeight: 500, color: '#1677ff', cursor: 'pointer' }}
                                onClick={(e) => { e.stopPropagation(); openDetail(r); }}>{r.name}</a>
                            <div style={{ fontSize: 11, color: '#8c8c8c' }}>{tc.label.split(' - ')[0]}</div>
                        </div>
                    </div>
                );
            },
        },
        {
            columnKey: 'type', columnTitle: '类型', dataIndex: 'type', width: 100, sorter: true,
            headerFilters: [{ label: 'ITSM', value: 'itsm' }, { label: 'CMDB', value: 'cmdb' }],
            render: (_: any, r: AutoHealing.Plugin) => {
                const tc = getTypeConfig(r.type);
                return <Tag color={tc.color}>{tc.label.split(' - ')[0]}</Tag>;
            },
        },
        {
            columnKey: 'status', columnTitle: '状态', dataIndex: 'status', width: 90, sorter: true,
            headerFilters: [{ label: '运行中', value: 'active' }, { label: '未激活', value: 'inactive' }, { label: '异常', value: 'error' }],
            render: (_: any, r: AutoHealing.Plugin) => {
                const map: Record<string, { status: 'success' | 'default' | 'error'; text: string }> = {
                    active: { status: 'success', text: '运行中' },
                    error: { status: 'error', text: '异常' },
                    inactive: { status: 'default', text: '未激活' },
                };
                const cfg = map[r.status] || map.inactive;
                return <Badge status={cfg.status} text={cfg.text} />;
            },
        },
        {
            columnKey: 'sync', columnTitle: '同步配置', width: 130,
            render: (_: any, r: AutoHealing.Plugin) => r.sync_enabled
                ? <Tag color="blue" icon={<SyncOutlined />}>每 {r.sync_interval_minutes} 分钟</Tag>
                : <Tag>未开启</Tag>,
        },
        {
            columnKey: 'last_sync_at', columnTitle: '上次同步', dataIndex: 'last_sync_at', width: 160, sorter: true,
            render: (_: any, r: AutoHealing.Plugin) =>
                r.last_sync_at ? dayjs(r.last_sync_at).format('YYYY-MM-DD HH:mm') : <Text type="secondary">暂无</Text>,
        },
        {
            columnKey: 'description', columnTitle: '描述', dataIndex: 'description', width: 200, defaultVisible: false,
            render: (_: any, r: AutoHealing.Plugin) =>
                r.description ? <Text ellipsis={{ tooltip: r.description }} style={{ maxWidth: 180 }}>{r.description}</Text> : '-',
        },
        {
            columnKey: 'created_at', columnTitle: '创建时间', dataIndex: 'created_at', width: 160, sorter: true,
            render: (_: any, r: AutoHealing.Plugin) => dayjs(r.created_at).format('YYYY-MM-DD HH:mm'),
        },
        {
            columnKey: 'actions', columnTitle: '操作', fixedColumn: true, width: 220,
            render: (_: any, r: AutoHealing.Plugin) => {
                const isActive = r.status === 'active';
                return (
                    <Space size="small" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="测试连接">
                            <Button type="link" size="small"
                                icon={testingId === r.id ? <Spin size="small" /> : <ApiOutlined />}
                                onClick={() => handleTest(r.id)} disabled={!!testingId || !access.canUpdatePlugin} />
                        </Tooltip>
                        {isActive ? (
                            <Tooltip title="停用">
                                <Button type="link" size="small"
                                    icon={activatingId === r.id ? <Spin size="small" /> : <PauseCircleOutlined />}
                                    onClick={() => handleDeactivate(r.id)} disabled={!!activatingId || !access.canUpdatePlugin} />
                            </Tooltip>
                        ) : (
                            <Tooltip title="激活">
                                <Button type="link" size="small"
                                    icon={activatingId === r.id ? <Spin size="small" /> : <PlayCircleOutlined />}
                                    onClick={() => handleActivate(r.id)} disabled={!!activatingId || !access.canUpdatePlugin} />
                            </Tooltip>
                        )}
                        <Tooltip title={isActive ? '手动同步' : '需先激活'}>
                            <Button type="link" size="small"
                                icon={syncingId === r.id ? <Spin size="small" /> : <SyncOutlined />}
                                onClick={() => handleSync(r.id)} disabled={!!syncingId || !isActive || !access.canUpdatePlugin} />
                        </Tooltip>
                        <Tooltip title="编辑"><Button type="link" size="small" icon={<SettingOutlined />}
                            onClick={() => openEdit(r)} disabled={!access.canUpdatePlugin} /></Tooltip>
                        <Tooltip title="同步历史"><Button type="link" size="small" icon={<HistoryOutlined />}
                            onClick={() => openDetail(r, 'history')} /></Tooltip>
                        <Popconfirm title="确定删除？" description="不可恢复" onConfirm={() => handleDelete(r.id)}>
                            <Button type="link" size="small" danger icon={<DeleteOutlined />} disabled={!access.canDeletePlugin} />
                        </Popconfirm>
                    </Space>
                );
            },
        },
    ], [openDetail, openEdit, handleTest, handleSync, handleDelete, handleActivate, handleDeactivate,
        testingId, syncingId, activatingId, access]);

    // ======= 数据请求（后端分页） =======
    const handleRequest = useCallback(async (params: {
        page: number; pageSize: number; searchField?: string; searchValue?: string;
        advancedSearch?: Record<string, any>; sorter?: { field: string; order: 'ascend' | 'descend' };
    }) => {
        const apiParams: any = { page: params.page, page_size: params.pageSize };
        // 类型/状态筛选
        if (params.advancedSearch?.type) apiParams.type = params.advancedSearch.type;
        if (params.advancedSearch?.status) apiParams.status = params.advancedSearch.status;

        // 搜索（后端支持）
        const kw = params.searchValue || params.advancedSearch?.keyword;
        if (kw) apiParams.search = kw;

        // 排序（后端支持）
        if (params.sorter?.field) {
            apiParams.sort_by = params.sorter.field;
            apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
        }

        const res = await getPlugins(apiParams);
        const items = res.data || [];
        const total = res.pagination?.total || res.total || items.length;

        return { data: items, total };
    }, []);

    // ======= 统计栏 =======
    const statsBar = useMemo(() => (
        <div className="plugins-stats-bar">
            {[
                { icon: <CloudOutlined />, cls: 'total', val: stats.total, lbl: '总插件' },
                { icon: <CheckCircleOutlined />, cls: 'active', val: stats.active, lbl: '运行中' },
                { icon: <ExclamationCircleOutlined />, cls: 'inactive', val: stats.inactive, lbl: '未激活' },
                { icon: <CloseCircleOutlined />, cls: 'error', val: stats.error, lbl: '异常' },
                { icon: <span style={{ fontSize: 18 }}>🎫</span>, cls: 'itsm', val: stats.itsm, lbl: 'ITSM' },
                { icon: <span style={{ fontSize: 18 }}>🗄️</span>, cls: 'cmdb', val: stats.cmdb, lbl: 'CMDB' },
            ].map((s, i) => (
                <React.Fragment key={i}>
                    {i > 0 && <div className="plugins-stat-divider" />}
                    <div className="plugins-stat-item">
                        <span className={`plugins-stat-icon plugins-stat-icon-${s.cls}`}>{s.icon}</span>
                        <div className="plugins-stat-content">
                            <div className="plugins-stat-value">{s.val}</div>
                            <div className="plugins-stat-label">{s.lbl}</div>
                        </div>
                    </div>
                </React.Fragment>
            ))}
        </div>
    ), [stats]);



    return (
        <>
            <StandardTable<AutoHealing.Plugin>
                refreshTrigger={refreshTrigger}
                tabs={[{ key: 'list', label: '插件列表' }]}
                title="插件管理"
                description="管理 ITSM 和 CMDB 数据源插件，配置连接、同步和字段映射。"
                headerIcon={headerIcon}
                headerExtra={statsBar}
                searchFields={searchFields}
                advancedSearchFields={advancedSearchFields}
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

            {/* 详情 Drawer */}
            <Drawer title={null} size={640} open={drawerOpen}
                onClose={() => { setDrawerOpen(false); setCurrentPlugin(null); setSyncLogs([]); }}
                styles={{ header: { display: 'none' }, body: { padding: 0 } }} destroyOnHidden>
                {currentPlugin && (() => {
                    const tc = getTypeConfig(currentPlugin.type);
                    const authLabel = currentPlugin.config?.auth_type === 'basic' ? '用户名密码' :
                        currentPlugin.config?.auth_type === 'bearer' ? 'Bearer Token' :
                            currentPlugin.config?.auth_type === 'api_key' ? 'API Key' : currentPlugin.config?.auth_type || '-';
                    return (<>
                        {/* Header */}
                        <div className="plugins-detail-header">
                            <div className="plugins-detail-header-top">
                                <div className="plugins-detail-header-icon" style={{ background: tc.bgColor, color: tc.color }}>{tc.icon}</div>
                                <div className="plugins-detail-header-info">
                                    <div className="plugins-detail-title">{currentPlugin.name}</div>
                                    <div className="plugins-detail-sub">{tc.label}</div>
                                </div>
                                <Badge status={currentPlugin.status === 'active' ? 'success' : currentPlugin.status === 'error' ? 'error' : 'default'}
                                    text={currentPlugin.status === 'active' ? '运行中' : currentPlugin.status === 'error' ? '异常' : '未激活'} />
                            </div>
                            <Space size="small">
                                <Button size="small" icon={<ApiOutlined />} onClick={() => handleTest(currentPlugin.id)} disabled={!access.canUpdatePlugin}>测试</Button>
                                <Button size="small" icon={<SyncOutlined />} onClick={() => handleSync(currentPlugin.id)}
                                    disabled={currentPlugin.status !== 'active' || !access.canUpdatePlugin}>同步</Button>
                                <Button size="small" icon={<SettingOutlined />}
                                    onClick={() => { setDrawerOpen(false); history.push(`/resources/plugins/${currentPlugin.id}/edit`); }} disabled={!access.canUpdatePlugin}>编辑</Button>
                            </Space>
                        </div>

                        <Tabs activeKey={activeTab} onChange={setActiveTab}
                            className="plugins-detail-tabs"
                            items={[
                                {
                                    key: 'detail',
                                    label: '详情',
                                    children: (
                                        <div className="plugins-detail-body">
                                            {/* 基本信息卡片 */}
                                            <div className="plugins-detail-card">
                                                <div className="plugins-detail-card-header">
                                                    <InfoCircleOutlined className="plugins-detail-card-header-icon" />
                                                    <span className="plugins-detail-card-header-title">基本信息</span>
                                                </div>
                                                <div className="plugins-detail-card-body">
                                                    <div className="plugins-detail-grid">
                                                        <div className="plugins-detail-field">
                                                            <span className="plugins-detail-field-label">描述</span>
                                                            <div className="plugins-detail-field-value">{currentPlugin.description || '-'}</div>
                                                        </div>
                                                        <div className="plugins-detail-field">
                                                            <span className="plugins-detail-field-label">版本</span>
                                                            <div className="plugins-detail-field-value">{currentPlugin.version || '-'}</div>
                                                        </div>
                                                        <div className="plugins-detail-field">
                                                            <span className="plugins-detail-field-label">创建时间</span>
                                                            <div className="plugins-detail-field-value">{dayjs(currentPlugin.created_at).format('YYYY-MM-DD HH:mm')}</div>
                                                        </div>
                                                        <div className="plugins-detail-field">
                                                            <span className="plugins-detail-field-label">更新时间</span>
                                                            <div className="plugins-detail-field-value">{currentPlugin.updated_at ? dayjs(currentPlugin.updated_at).format('YYYY-MM-DD HH:mm') : '-'}</div>
                                                        </div>
                                                        {currentPlugin.error_message && (
                                                            <div className="plugins-detail-field" style={{ gridColumn: '1 / -1' }}>
                                                                <span className="plugins-detail-field-label">错误信息</span>
                                                                <div className="plugins-detail-field-value" style={{ color: '#ff4d4f' }}>{currentPlugin.error_message}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 连接配置卡片 */}
                                            <div className="plugins-detail-card">
                                                <div className="plugins-detail-card-header">
                                                    <LinkOutlined className="plugins-detail-card-header-icon" />
                                                    <span className="plugins-detail-card-header-title">连接配置</span>
                                                </div>
                                                <div className="plugins-detail-card-body">
                                                    <div className="plugins-detail-grid">
                                                        <div className="plugins-detail-field" style={{ gridColumn: '1 / -1' }}>
                                                            <span className="plugins-detail-field-label">API 地址</span>
                                                            <div className="plugins-detail-field-value"><Text code copyable style={{ wordBreak: 'break-all' }}>{currentPlugin.config?.url || '-'}</Text></div>
                                                        </div>
                                                        <div className="plugins-detail-field">
                                                            <span className="plugins-detail-field-label">认证方式</span>
                                                            <div className="plugins-detail-field-value"><Tag>{authLabel}</Tag></div>
                                                        </div>
                                                        <div className="plugins-detail-field">
                                                            <span className="plugins-detail-field-label">时间参数</span>
                                                            <div className="plugins-detail-field-value">{currentPlugin.config?.since_param || '-'}</div>
                                                        </div>
                                                        {currentPlugin.config?.response_data_path && (
                                                            <div className="plugins-detail-field">
                                                                <span className="plugins-detail-field-label">数据路径</span>
                                                                <div className="plugins-detail-field-value"><Text code>{currentPlugin.config.response_data_path}</Text></div>
                                                            </div>
                                                        )}
                                                        {currentPlugin.config?.extra_params && Object.keys(currentPlugin.config.extra_params).length > 0 && (
                                                            <div className="plugins-detail-field" style={{ gridColumn: '1 / -1' }}>
                                                                <span className="plugins-detail-field-label">额外参数</span>
                                                                <div className="plugins-detail-field-value">
                                                                    {Object.entries(currentPlugin.config.extra_params).map(([k, v]) => (
                                                                        <Tag key={k} style={{ margin: '0 4px 4px 0' }}>{k}={String(v)}</Tag>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 同步配置卡片 */}
                                            <div className="plugins-detail-card">
                                                <div className="plugins-detail-card-header">
                                                    <SyncOutlined className="plugins-detail-card-header-icon" />
                                                    <span className="plugins-detail-card-header-title">同步配置</span>
                                                </div>
                                                <div className="plugins-detail-card-body">
                                                    <div className="plugins-detail-grid">
                                                        <div className="plugins-detail-field">
                                                            <span className="plugins-detail-field-label">定时同步</span>
                                                            <div className="plugins-detail-field-value">
                                                                {currentPlugin.sync_enabled
                                                                    ? <Tag color="blue">每 {currentPlugin.sync_interval_minutes} 分钟</Tag>
                                                                    : <Tag>未开启</Tag>}
                                                            </div>
                                                        </div>
                                                        <div className="plugins-detail-field">
                                                            <span className="plugins-detail-field-label">上次同步</span>
                                                            <div className="plugins-detail-field-value">{currentPlugin.last_sync_at ? dayjs(currentPlugin.last_sync_at).format('YYYY-MM-DD HH:mm') : '暂无'}</div>
                                                        </div>
                                                        {currentPlugin.next_sync_at && currentPlugin.status === 'active' && (
                                                            <div className="plugins-detail-field">
                                                                <span className="plugins-detail-field-label">下次同步</span>
                                                                <div className="plugins-detail-field-value" style={{ color: '#1890ff' }}>{dayjs(currentPlugin.next_sync_at).format('YYYY-MM-DD HH:mm')}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 过滤规则卡片 */}
                                            {currentPlugin.sync_filter?.rules?.length > 0 && (
                                                <div className="plugins-detail-card">
                                                    <div className="plugins-detail-card-header">
                                                        <FilterOutlined className="plugins-detail-card-header-icon" />
                                                        <span className="plugins-detail-card-header-title">过滤规则</span>
                                                    </div>
                                                    <div className="plugins-detail-card-body">
                                                        {currentPlugin.sync_filter.rules.map((r: any, i: number) => (
                                                            <Tag key={i} style={{ margin: '0 4px 4px 0' }}>{r.field} {r.operator} {Array.isArray(r.value) ? r.value.join(',') : String(r.value)}</Tag>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 字段映射卡片 */}
                                            {currentPlugin.field_mapping && Object.keys(currentPlugin.field_mapping).length > 0 && (() => {
                                                const mapping = currentPlugin.type === 'cmdb'
                                                    ? currentPlugin.field_mapping.cmdb_mapping
                                                    : currentPlugin.field_mapping.incident_mapping;
                                                return mapping && Object.keys(mapping).length > 0 ? (
                                                    <div className="plugins-detail-card">
                                                        <div className="plugins-detail-card-header">
                                                            <SettingOutlined className="plugins-detail-card-header-icon" />
                                                            <span className="plugins-detail-card-header-title">字段映射</span>
                                                        </div>
                                                        <div className="plugins-detail-card-body" style={{ padding: 0 }}>
                                                            <Table size="small" pagination={false} dataSource={Object.entries(mapping).map(([k, v]) => ({ key: k, standard: k, external: v }))}
                                                                columns={[
                                                                    { title: '标准字段', dataIndex: 'standard', key: 'standard' },
                                                                    { title: '外部字段', dataIndex: 'external', key: 'external' },
                                                                ]} />
                                                        </div>
                                                    </div>
                                                ) : null;
                                            })()}
                                        </div>
                                    ),
                                },
                                {
                                    key: 'history',
                                    label: '同步历史',
                                    children: (
                                        <div className="plugins-detail-body">
                                            <Table size="small" loading={logsLoading} pagination={false}
                                                dataSource={syncLogs} rowKey="id"
                                                locale={{ emptyText: '暂无同步记录' }}
                                                expandable={{
                                                    expandedRowRender: (r: AutoHealing.PluginSyncLog) => (
                                                        <div style={{ padding: '4px 0', fontSize: 12, color: '#ff4d4f', wordBreak: 'break-all' }}>
                                                            <Text type="danger" style={{ fontSize: 12 }}>{r.error_message}</Text>
                                                        </div>
                                                    ),
                                                    rowExpandable: (r: AutoHealing.PluginSyncLog) => !!r.error_message,
                                                    defaultExpandedRowKeys: syncLogs.filter(l => l.status === 'failed' && l.error_message).slice(0, 3).map(l => l.id),
                                                    expandIcon: ({ expanded, onExpand, record }: any) =>
                                                        record.error_message
                                                            ? <span style={{ cursor: 'pointer', color: '#ff4d4f', fontSize: 12, display: 'inline-block', width: 16, textAlign: 'center' }}
                                                                onClick={e => onExpand(record, e)}>{expanded ? '−' : '+'}</span>
                                                            : <span style={{ display: 'inline-block', width: 16, textAlign: 'center', color: '#52c41a', fontSize: 14 }}>✓</span>,
                                                }}
                                                columns={[
                                                    {
                                                        title: '状态', dataIndex: 'status', width: 80,
                                                        render: (s: string) => (
                                                            <Badge status={s === 'success' ? 'success' : s === 'failed' ? 'error' : 'processing'}
                                                                text={s === 'success' ? '成功' : s === 'failed' ? '失败' : '进行中'} />
                                                        ),
                                                    },
                                                    {
                                                        title: '类型', dataIndex: 'sync_type', width: 60,
                                                        render: (t: string) => <Tag>{t === 'manual' ? '手动' : '定时'}</Tag>,
                                                    },
                                                    {
                                                        title: '统计', key: 'stats', width: 180,
                                                        render: (_: any, r: AutoHealing.PluginSyncLog) => (
                                                            <Space size={4} wrap>
                                                                <span style={{ fontSize: 12 }}>获取 <Text strong>{r.records_fetched}</Text></span>
                                                                <span style={{ fontSize: 12 }}>处理 <Text strong>{r.records_processed}</Text></span>
                                                                {r.records_new > 0 && <span style={{ fontSize: 12, color: '#52c41a' }}>+{r.records_new}</span>}
                                                                {r.records_updated > 0 && <span style={{ fontSize: 12, color: '#1890ff' }}>~{r.records_updated}</span>}
                                                                {r.records_failed > 0 && <span style={{ fontSize: 12, color: '#ff4d4f' }}>✕{r.records_failed}</span>}
                                                            </Space>
                                                        ),
                                                    },
                                                    {
                                                        title: '时间', dataIndex: 'started_at', width: 140,
                                                        render: (t: string) => <span style={{ fontSize: 12 }}>{dayjs(t).format('MM-DD HH:mm:ss')}</span>,
                                                    },
                                                ]} />
                                        </div>
                                    ),
                                },
                            ]}
                        />
                    </>);
                })()}
            </Drawer>


        </>
    );
};



export default PluginList;

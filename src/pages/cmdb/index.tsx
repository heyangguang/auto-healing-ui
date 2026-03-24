import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAccess } from '@umijs/max';
import {
    CheckCircleOutlined, CloseCircleOutlined, ToolOutlined,
    ApiOutlined, CloudServerOutlined,
    LinuxOutlined, WindowsOutlined, CloudOutlined,
} from '@ant-design/icons';
import {
    Space, Tooltip, message, Typography, Modal, Select, Badge,
    Tag, Button, Alert, Progress, Drawer, Divider, Descriptions, Input, DatePicker,
} from 'antd';
import SecretsSourceSelector from '@/components/SecretsSourceSelector';
import ConnectionTestResultModal from '@/components/ConnectionTestResultModal';
import dayjs from 'dayjs';
import StandardTable from '@/components/StandardTable';
import type { StandardColumnDef, SearchField, AdvancedSearchField } from '@/components/StandardTable';

import {
    getCMDBItems, getCMDBItemIds, getCMDBStats, getCMDBItem, testCMDBConnection, batchTestCMDBConnection,
    enterMaintenance, resumeFromMaintenance, batchEnterMaintenance, batchResumeFromMaintenance,
    getCMDBMaintenanceLogs,
} from '@/services/auto-healing/cmdb';
import { getSecretsSources } from '@/services/auto-healing/secrets';
import { CMDB_TYPE_MAP, CMDB_STATUS_MAP, CMDB_ENV_MAP } from '@/constants/cmdbDicts';
import './index.css';

const { Text } = Typography;

/* ========== 枚举映射（已集中化到 constants/cmdbDicts.tsx，此处为别名） ========== */
const TYPE_MAP = CMDB_TYPE_MAP;
const STATUS_MAP = CMDB_STATUS_MAP;
const ENV_MAP = CMDB_ENV_MAP;

const getOSIcon = (os: string) => {
    const o = os?.toLowerCase() || '';
    if (o.includes('linux') || o.includes('ubuntu') || o.includes('centos') || o.includes('rhel'))
        return <LinuxOutlined style={{ color: '#E95420' }} />;
    if (o.includes('windows')) return <WindowsOutlined style={{ color: '#1890ff' }} />;
    return <CloudOutlined style={{ color: '#8c8c8c' }} />;
};

/* ========== 搜索字段 ========== */
const searchFields: SearchField[] = [
    { key: 'name', label: '关键字' },
    { key: 'ip_search', label: 'IP 地址' },
    { key: 'host_search', label: '主机名' },
];

const advancedSearchFields: AdvancedSearchField[] = [
    { key: 'name', label: '名称', type: 'input', placeholder: '资产名称' },
    { key: 'ip_address', label: 'IP 地址', type: 'input', placeholder: 'IP 地址' },
    { key: 'hostname', label: '主机名', type: 'input', placeholder: '主机名' },
    {
        key: 'type', label: '资产类型', type: 'select', placeholder: '全部类型',
        options: Object.entries(TYPE_MAP).map(([v, t]) => ({ label: t.text, value: v })),
    },
    {
        key: 'status', label: '资产状态', type: 'select', placeholder: '全部状态',
        options: Object.entries(STATUS_MAP).map(([v, s]) => ({ label: s.text, value: v })),
    },
    {
        key: 'environment', label: '环境', type: 'select', placeholder: '全部环境',
        options: Object.entries(ENV_MAP).map(([v, e]) => ({ label: e.text, value: v })),
    },
    { key: 'source_plugin_name', label: '数据来源', type: 'input', placeholder: '插件名称' },
];

/* ========== Header Icon ========== */
const headerIcon = (
    <svg viewBox="0 0 48 48" fill="none">
        <rect x="6" y="8" width="36" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
        <rect x="6" y="22" width="36" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
        <rect x="6" y="36" width="36" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
        <circle cx="12" cy="14" r="2" fill="#52c41a" />
        <circle cx="12" cy="28" r="2" fill="#52c41a" />
        <circle cx="12" cy="39" r="1.5" fill="#faad14" />
        <rect x="18" y="13" width="14" height="2" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="18" y="27" width="10" height="2" rx="1" fill="currentColor" opacity="0.3" />
    </svg>
);

/* ========== 组件 ========== */
const CMDBList: React.FC = () => {
    const access = useAccess();
    /* ---- 统计 ---- */
    const [stats, setStats] = useState<AutoHealing.CMDBStats | null>(null);

    const loadStats = useCallback(async () => {
        try {
            const res = await getCMDBStats();
            setStats(res);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { loadStats(); }, [loadStats]);

    /* ---- 密钥源 ---- */
    const [secretsSources, setSecretsSources] = useState<AutoHealing.SecretsSource[]>([]);
    useEffect(() => {
        getSecretsSources().then((res: any) => {
            setSecretsSources(res?.data || res?.items || []);
        }).catch(() => { });
    }, []);

    /* ---- 详情 Drawer ---- */
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [currentRow, setCurrentRow] = useState<AutoHealing.CMDBItem | null>(null);
    const [maintenanceLogs, setMaintenanceLogs] = useState<AutoHealing.CMDBMaintenanceLog[]>([]);

    const openDetail = useCallback(async (record: AutoHealing.CMDBItem) => {
        setCurrentRow(record);
        setDrawerOpen(true);
        setDetailLoading(true);
        try {
            const [detail, logRes] = await Promise.all([
                getCMDBItem(record.id),
                getCMDBMaintenanceLogs(record.id, { page: 1, page_size: 20 }),
            ]);
            setCurrentRow(detail);
            setMaintenanceLogs((logRes as any)?.data || (logRes as any)?.items || []);
        } catch { /* ignore */ }
        finally { setDetailLoading(false); }
    }, []);

    /* ---- 密钥测试 ---- */
    const [selectSourceModalOpen, setSelectSourceModalOpen] = useState(false);
    const [singleTestTarget, setSingleTestTarget] = useState<AutoHealing.CMDBItem | null>(null);
    const [testing, setTesting] = useState(false);
    const [testResults, setTestResults] = useState<AutoHealing.CMDBBatchConnectionTestResult | null>(null);
    const [testResultModalOpen, setTestResultModalOpen] = useState(false);

    /* ---- 维护模式 ---- */
    const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
    const [maintenanceTarget, setMaintenanceTarget] = useState<AutoHealing.CMDBItem | null>(null);
    const [maintenanceReason, setMaintenanceReason] = useState('');
    const [maintenanceEndAt, setMaintenanceEndAt] = useState<string>();

    /* ---- 选中行（批量操作 — 跨页保持） ---- */
    const [selectedRowMap, setSelectedRowMap] = useState<Map<string, AutoHealing.CMDBItem>>(new Map());
    const selectedRows = useMemo(() => Array.from(selectedRowMap.values()), [selectedRowMap]);
    const totalCountRef = useRef(0);
    const latestFilterRef = useRef<Record<string, any>>({});

    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const triggerRefresh = useCallback(() => {
        setRefreshTrigger(n => n + 1);
    }, []);

    /* ======= 密钥测试流程 ======= */
    const handleOpenTestModal = useCallback((target: AutoHealing.CMDBItem | null) => {
        setSingleTestTarget(target);
        setSelectSourceModalOpen(true);
    }, []);

    const handleRunTest = useCallback(async (sourceId: string) => {
        setTesting(true);
        try {
            if (singleTestTarget) {
                const res = await testCMDBConnection(singleTestTarget.id, sourceId);
                setTestResults({ total: 1, success: res.success ? 1 : 0, failed: res.success ? 0 : 1, results: [res] });
            } else {
                const ids = selectedRows.map(r => r.id);
                const res = await batchTestCMDBConnection(ids, sourceId);
                setTestResults(res);
            }
            setSelectSourceModalOpen(false);
            setTestResultModalOpen(true);
        } catch { /* global error handler */ }
        finally { setTesting(false); }
    }, [singleTestTarget, selectedRows]);

    /* ======= 维护模式流程 ======= */
    const handleEnterMaintenance = useCallback(async () => {
        if (!maintenanceReason) { message.warning('请输入维护原因'); return; }
        try {
            if (maintenanceTarget) {
                await enterMaintenance(maintenanceTarget.id, maintenanceReason, maintenanceEndAt);
                message.success('已进入维护模式');
            } else {
                const ids = selectedRows.map(r => r.id);
                const res = await batchEnterMaintenance(ids, maintenanceReason, maintenanceEndAt);
                message.success(`批量维护成功 (${res.success}/${res.total} 台)`);
            }
            setMaintenanceModalOpen(false);
            setMaintenanceReason('');
            setMaintenanceEndAt(undefined);
            setSelectedRowMap(new Map());
            triggerRefresh();
            loadStats();
        } catch { /* global error handler */ }
    }, [maintenanceTarget, maintenanceReason, maintenanceEndAt, selectedRows, triggerRefresh, loadStats]);

    const handleResumeMaintenance = useCallback(async (record: AutoHealing.CMDBItem) => {
        try {
            await resumeFromMaintenance(record.id);
            message.success('已退出维护模式');
            triggerRefresh();
            loadStats();
        } catch { /* global error handler */ }
    }, [triggerRefresh, loadStats]);

    const handleBatchResume = useCallback(async () => {
        const ids = selectedRows.filter(r => r.status === 'maintenance').map(r => r.id);
        if (ids.length === 0) { message.warning('没有处于维护模式的主机'); return; }
        try {
            const res = await batchResumeFromMaintenance(ids);
            message.success(`批量恢复成功 (${res.success}/${res.total} 台)`);
            setSelectedRowMap(new Map());
            triggerRefresh();
            loadStats();
        } catch { /* global error handler */ }
    }, [selectedRows, triggerRefresh, loadStats]);

    /* ========== 列定义 (memoized) ========== */
    const columns = useMemo<StandardColumnDef<AutoHealing.CMDBItem>[]>(() => [
        {
            columnKey: 'name',
            columnTitle: '名称',
            fixedColumn: true,
            dataIndex: 'name',
            width: 160,
            sorter: true,
            render: (_: any, record: AutoHealing.CMDBItem) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <a
                        style={{ fontWeight: 500, color: '#1677ff', cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); openDetail(record); }}
                    >
                        {record.name || record.hostname}
                    </a>
                    <span style={{ fontSize: 11, fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace", color: '#8590a6', letterSpacing: '0.02em' }}>
                        {record.ip_address}
                    </span>
                </div>
            ),
        },
        {
            columnKey: 'hostname',
            columnTitle: '主机名',
            dataIndex: 'hostname',
            width: 150,
            ellipsis: true,
            defaultVisible: false,
            render: (_: any, record: AutoHealing.CMDBItem) => record.hostname || <Text type="secondary">-</Text>,
        },
        {
            columnKey: 'type',
            columnTitle: '类型',
            dataIndex: 'type',
            width: 60,
            sorter: true,
            headerFilters: Object.entries(TYPE_MAP).map(([v, t]) => ({ label: t.text, value: v })),
            render: (_: any, record: AutoHealing.CMDBItem) => {
                const info = TYPE_MAP[record.type] || { text: record.type, icon: <CloudServerOutlined />, color: '#8c8c8c' };
                return (
                    <Tooltip title={info.text}>
                        <span style={{ fontSize: 16, color: info.color }}>{info.icon}</span>
                    </Tooltip>
                );
            },
        },
        {
            columnKey: 'status',
            columnTitle: '状态',
            dataIndex: 'status',
            width: 90,
            sorter: true,
            headerFilters: Object.entries(STATUS_MAP).map(([v, s]) => ({ label: s.text, value: v })),
            render: (_: any, record: AutoHealing.CMDBItem) => {
                const info = STATUS_MAP[record.status] || { text: record.status, badge: 'default' as const };
                return <Badge status={info.badge} text={info.text} />;
            },
        },
        {
            columnKey: 'environment',
            columnTitle: '环境',
            dataIndex: 'environment',
            width: 80,
            sorter: true,
            headerFilters: Object.entries(ENV_MAP).map(([v, e]) => ({ label: e.text, value: v })),
            render: (_: any, record: AutoHealing.CMDBItem) => {
                const info = ENV_MAP[record.environment] || { text: record.environment, color: 'default' };
                return <Tag color={info.color} style={{ margin: 0 }}>{info.text}</Tag>;
            },
        },
        {
            columnKey: 'os',
            columnTitle: 'OS',
            dataIndex: 'os',
            width: 60,
            sorter: true,
            render: (_: any, record: AutoHealing.CMDBItem) => {
                if (!record.os) return <Text type="secondary">-</Text>;
                return (
                    <Tooltip title={record.os}>
                        <span style={{ fontSize: 16 }}>{getOSIcon(record.os)}</span>
                    </Tooltip>
                );
            },
        },
        {
            columnKey: 'spec',
            columnTitle: 'CPU / 内存',
            width: 130,
            render: (_: any, record: AutoHealing.CMDBItem) => {
                if (!record.cpu && !record.memory) return <Text type="secondary">-</Text>;
                return <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>{record.cpu || '-'} / {record.memory || '-'}</Text>;
            },
        },
        {
            columnKey: 'owner',
            columnTitle: '负责人',
            dataIndex: 'owner',
            width: 100,
            sorter: true,
            ellipsis: true,
            defaultVisible: false,
            render: (_: any, record: AutoHealing.CMDBItem) => record.owner || <Text type="secondary">-</Text>,
        },
        {
            columnKey: 'department',
            columnTitle: '部门',
            dataIndex: 'department',
            width: 100,
            sorter: true,
            ellipsis: true,
            defaultVisible: false,
            render: (_: any, record: AutoHealing.CMDBItem) => record.department || <Text type="secondary">-</Text>,
        },
        {
            columnKey: 'source',
            columnTitle: '来源',
            dataIndex: 'source_plugin_name',
            width: 100,
            sorter: true,
            render: (_: any, record: AutoHealing.CMDBItem) =>
                record.source_plugin_name
                    ? <Tag style={{ margin: 0 }}>{record.source_plugin_name}</Tag>
                    : <Text type="secondary" style={{ fontSize: 12 }}>手动</Text>,
        },
        {
            columnKey: 'updated_at',
            columnTitle: '更新时间',
            dataIndex: 'updated_at',
            width: 170,
            sorter: true,
            render: (_: any, record: AutoHealing.CMDBItem) =>
                record.updated_at ? dayjs(record.updated_at).format('YYYY-MM-DD HH:mm:ss') : '-',
        },
        {
            columnKey: 'actions',
            columnTitle: '操作',
            fixedColumn: true,
            width: 140,
            render: (_: any, record: AutoHealing.CMDBItem) => (
                <Space size="small">
                    <Tooltip title="密钥测试">
                        <Button
                            type="link" size="small" icon={<ApiOutlined />}
                            disabled={!access.canTestPlugin}
                            onClick={(e) => { e.stopPropagation(); handleOpenTestModal(record); }}
                        />
                    </Tooltip>
                    {record.status === 'maintenance' ? (
                        <Tooltip title="退出维护">
                            <Button
                                type="link" size="small" icon={<CheckCircleOutlined />}
                                style={{ color: '#52c41a' }}
                                disabled={!access.canUpdatePlugin}
                                onClick={(e) => { e.stopPropagation(); handleResumeMaintenance(record); }}
                            />
                        </Tooltip>
                    ) : (
                        <Tooltip title="进入维护">
                            <Button
                                type="link" size="small" icon={<ToolOutlined />}
                                style={{ color: '#faad14' }}
                                disabled={!access.canUpdatePlugin}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMaintenanceTarget(record);
                                    setMaintenanceModalOpen(true);
                                }}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ], [openDetail, handleOpenTestModal, handleResumeMaintenance]);

    /* ========== 数据请求 ========== */
    const handleRequest = useCallback(async (params: {
        page: number;
        pageSize: number;
        searchField?: string;
        searchValue?: string;
        advancedSearch?: Record<string, any>;
        sorter?: { field: string; order: 'ascend' | 'descend' };
    }) => {
        const apiParams: Record<string, any> = {
            page: params.page,
            page_size: params.pageSize,
        };

        // 简单搜索
        if (params.searchValue) {
            if (params.searchField === 'ip_search') {
                apiParams.ip_address = params.searchValue;
            } else if (params.searchField === 'host_search') {
                apiParams.hostname = params.searchValue;
            } else {
                apiParams.name = params.searchValue;
            }
        }

        // 高级搜索
        if (params.advancedSearch) {
            const adv = params.advancedSearch;
            // 名称/IP/主机名 → 直接传独立参数
            if (adv.name) apiParams.name = adv.name;
            if (adv.name__exact) apiParams.name__exact = adv.name__exact;
            if (adv.hostname) apiParams.hostname = adv.hostname;
            if (adv.hostname__exact) apiParams.hostname__exact = adv.hostname__exact;
            if (adv.ip_address) apiParams.ip_address = adv.ip_address;
            if (adv.ip_address__exact) apiParams.ip_address__exact = adv.ip_address__exact;
            // 其他字段直接传
            if (adv.type) apiParams.type = adv.type;
            if (adv.status) apiParams.status = adv.status === 'online' ? 'active' : adv.status;
            if (adv.environment) apiParams.environment = adv.environment;
            if (adv.source_plugin_name) apiParams.source_plugin_name = adv.source_plugin_name;
            if (adv.source_plugin_name__exact) apiParams.source_plugin_name__exact = adv.source_plugin_name__exact;
            if (adv.has_plugin !== undefined && adv.has_plugin !== '' && adv.has_plugin !== null) apiParams.has_plugin = adv.has_plugin;
        }
        latestFilterRef.current = { ...apiParams };

        // 排序
        if (params.sorter?.field) {
            apiParams.sort_by = params.sorter.field;
            apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
        }

        const res = await getCMDBItems(apiParams);
        const items = (res as any)?.data || [];
        const total = (res as any)?.pagination?.total ?? (res as any)?.total ?? 0;

        totalCountRef.current = total;
        return { data: items, total };
    }, []);

    /* ========== 统计卡片 (memoized) ========== */
    const statsBar = useMemo(() => {
        if (!stats) return null;
        const activeCount = stats.by_status?.find(s => s.status === 'active')?.count ?? 0;
        const inactiveCount = stats.by_status?.find(s => s.status === 'offline')?.count ?? 0;
        const maintenanceCount = stats.by_status?.find(s => s.status === 'maintenance')?.count ?? 0;
        return (
            <div className="cmdb-stats-bar">
                <div className="cmdb-stat-item">
                    <CloudServerOutlined className="cmdb-stat-icon cmdb-stat-icon-total" />
                    <div className="cmdb-stat-content">
                        <div className="cmdb-stat-value">{stats.total}</div>
                        <div className="cmdb-stat-label">总资产</div>
                    </div>
                </div>
                <div className="cmdb-stat-divider" />
                <div className="cmdb-stat-item">
                    <CheckCircleOutlined className="cmdb-stat-icon cmdb-stat-icon-active" />
                    <div className="cmdb-stat-content">
                        <div className="cmdb-stat-value">{activeCount}</div>
                        <div className="cmdb-stat-label">活跃</div>
                    </div>
                </div>
                <div className="cmdb-stat-divider" />
                <div className="cmdb-stat-item">
                    <CloseCircleOutlined className="cmdb-stat-icon cmdb-stat-icon-offline" />
                    <div className="cmdb-stat-content">
                        <div className="cmdb-stat-value">{inactiveCount}</div>
                        <div className="cmdb-stat-label">离线</div>
                    </div>
                </div>
                <div className="cmdb-stat-divider" />
                <div className="cmdb-stat-item">
                    <ToolOutlined className="cmdb-stat-icon cmdb-stat-icon-maintenance" />
                    <div className="cmdb-stat-content">
                        <div className="cmdb-stat-value">{maintenanceCount}</div>
                        <div className="cmdb-stat-label">维护</div>
                    </div>
                </div>
            </div>
        );
    }, [stats]);

    /* ========== 全选所有 ========== */
    const handleSelectAll = useCallback(async () => {
        try {
            const { page, page_size, ...filters } = latestFilterRef.current;
            const hasTextFilters = Boolean(filters.name || filters.name__exact || filters.hostname || filters.hostname__exact || filters.ip_address || filters.ip_address__exact);
            let items: any[] = [];
            if (hasTextFilters) {
                let currentPage = 1;
                while (true) {
                    const res = await getCMDBItems({ ...filters, page: currentPage, page_size: 200 });
                    const batch = (res as any)?.data || [];
                    items.push(...batch);
                    const total = (res as any)?.pagination?.total ?? (res as any)?.total ?? batch.length;
                    if (items.length >= total || batch.length === 0) break;
                    currentPage += 1;
                }
            } else {
                const res = await getCMDBItemIds(filters);
                items = res?.data?.items || [];
            }
            const newMap = new Map<string, AutoHealing.CMDBItem>();
            items.forEach((item: any) => newMap.set(item.id, item as AutoHealing.CMDBItem));
            setSelectedRowMap(newMap);
            message.success(`已全选 ${items.length} 项`);
        } catch { /* global error handler */ }
    }, []);

    /* ========== 批量操作栏 (memoized) ========== */
    const batchToolbar = useMemo(() => {
        if (selectedRows.length === 0) return null;
        return (
            <div className="cmdb-batch-bar" style={{ gap: 6 }}>
                <span style={{ fontSize: 13, color: '#1677ff', fontWeight: 500 }}>已选 {selectedRows.length} 项</span>
                <Button type="link" style={{ padding: 0, fontWeight: 500 }}
                    onClick={handleSelectAll}>
                    全选所有
                </Button>
                <Button size="small" icon={<ApiOutlined />}
                    disabled={!access.canTestPlugin}
                    onClick={() => handleOpenTestModal(null)}>
                    测试密钥
                </Button>
                <Button size="small" icon={<ToolOutlined />}
                    disabled={!access.canUpdatePlugin}
                    onClick={() => { setMaintenanceTarget(null); setMaintenanceModalOpen(true); }}
                    style={{ borderColor: '#faad14', color: '#faad14' }}>
                    维护
                </Button>
                <Button size="small" icon={<CheckCircleOutlined />}
                    disabled={!access.canUpdatePlugin}
                    onClick={handleBatchResume}
                    style={{ borderColor: '#52c41a', color: '#52c41a' }}>
                    恢复
                </Button>
                <Button type="link" style={{ color: '#8c8c8c' }}
                    onClick={() => setSelectedRowMap(new Map())}>
                    取消选择
                </Button>
            </div>
        );
    }, [selectedRows.length, handleSelectAll, handleOpenTestModal, handleBatchResume]);

    return (
        <>
            <StandardTable<AutoHealing.CMDBItem>
                refreshTrigger={refreshTrigger}
                tabs={[{ key: 'list', label: '资产列表' }]}
                title="资产管理"
                description="管理和监控所有 IT 基础设施资产，支持 SSH 连接测试、维护模式切换和批量操作。"
                headerIcon={headerIcon}
                headerExtra={statsBar}
                searchFields={searchFields}
                advancedSearchFields={advancedSearchFields}
                extraToolbarActions={batchToolbar}
                columns={columns}
                rowKey="id"
                onRowClick={openDetail}
                rowSelection={{
                    selectedRowKeys: Array.from(selectedRowMap.keys()),
                    preserveSelectedRowKeys: true,
                    onChange: (keys: React.Key[], rows: AutoHealing.CMDBItem[]) => {
                        const validRows = rows.filter(Boolean);
                        const keySet = new Set(keys.map(String));
                        setSelectedRowMap(prev => {
                            const next = new Map<string, AutoHealing.CMDBItem>();
                            // 保留仍在 keys 中的旧选中项
                            for (const [id, item] of prev) {
                                if (keySet.has(id)) next.set(id, item);
                            }
                            // 加入当前页新选中的
                            for (const row of validRows) {
                                if (row?.id && keySet.has(row.id)) next.set(row.id, row);
                            }
                            return next;
                        });
                    },
                }}
                request={handleRequest}
                defaultPageSize={20}
                preferenceKey="cmdb_assets_v2"
            />

            {/* ====== 详情 Drawer ====== */}
            <Drawer
                title={null}
                size={560}
                open={drawerOpen}
                onClose={() => { setDrawerOpen(false); setCurrentRow(null); setMaintenanceLogs([]); }}
                styles={{ header: { display: 'none' }, body: { padding: 0 } }}
                loading={detailLoading}
                destroyOnHidden
            >
                {currentRow && (
                    <>
                        {/* 头部 */}
                        <div className="cmdb-detail-header">
                            <div className="cmdb-detail-header-top">
                                <div className="cmdb-detail-header-icon">
                                    {(TYPE_MAP[currentRow.type] || { icon: <CloudServerOutlined /> }).icon}
                                </div>
                                <div className="cmdb-detail-header-info">
                                    <div className="cmdb-detail-title">{currentRow.name}</div>
                                    <div className="cmdb-detail-sub">{currentRow.ip_address}</div>
                                </div>
                                <Badge
                                    status={(STATUS_MAP[currentRow.status] || { badge: 'default' as const }).badge}
                                    text={(STATUS_MAP[currentRow.status] || { text: currentRow.status }).text}
                                />
                            </div>
                            <Space size={8}>
                                <Button size="small" icon={<ApiOutlined />} disabled={!access.canTestPlugin} onClick={() => handleOpenTestModal(currentRow)}>
                                    密钥测试
                                </Button>
                                {currentRow.status === 'maintenance' ? (
                                    <Button
                                        size="small" icon={<CheckCircleOutlined />}
                                        disabled={!access.canUpdatePlugin}
                                        onClick={async () => {
                                            await handleResumeMaintenance(currentRow);
                                            setDrawerOpen(false);
                                        }}
                                    >
                                        退出维护
                                    </Button>
                                ) : (
                                    <Button
                                        size="small" icon={<ToolOutlined />}
                                        disabled={!access.canUpdatePlugin}
                                        onClick={() => { setMaintenanceTarget(currentRow); setMaintenanceModalOpen(true); }}
                                    >
                                        进入维护
                                    </Button>
                                )}
                            </Space>
                        </div>

                        {/* 维护模式警告 */}
                        {currentRow.status === 'maintenance' && (
                            <Alert
                                type="warning" showIcon icon={<ToolOutlined />}
                                message="维护模式"
                                description={
                                    <div>
                                        <div>原因：{currentRow.maintenance_reason || '-'}</div>
                                        {currentRow.maintenance_end_at && <div>计划结束：{dayjs(currentRow.maintenance_end_at).format('YYYY-MM-DD HH:mm')}</div>}
                                    </div>
                                }
                                style={{ margin: '16px 24px 0', borderRadius: 0 }}
                            />
                        )}

                        {/* 详细信息 */}
                        <div className="cmdb-detail-body">
                            {/* 基本信息 */}
                            <div className="cmdb-detail-section">
                                <div className="cmdb-detail-section-title">基本信息</div>
                                <div className="cmdb-detail-grid">
                                    <div>
                                        <Text className="cmdb-detail-field-label">名称</Text>
                                        <Text className="cmdb-detail-field-value">{currentRow.name}</Text>
                                    </div>
                                    <div>
                                        <Text className="cmdb-detail-field-label">主机名</Text>
                                        <Text className="cmdb-detail-field-value">{currentRow.hostname || '—'}</Text>
                                    </div>
                                    <div>
                                        <Text className="cmdb-detail-field-label">IP 地址</Text>
                                        <Text copyable className="cmdb-detail-field-value" style={{ fontFamily: 'monospace' }}>{currentRow.ip_address}</Text>
                                    </div>
                                    <div>
                                        <Text className="cmdb-detail-field-label">类型</Text>
                                        <Tag color={(TYPE_MAP[currentRow.type] || { color: 'default' }).color}>
                                            {(TYPE_MAP[currentRow.type] || { text: currentRow.type }).text}
                                        </Tag>
                                    </div>
                                    <div>
                                        <Text className="cmdb-detail-field-label">环境</Text>
                                        <Tag color={(ENV_MAP[currentRow.environment] || { color: 'default' }).color}>
                                            {(ENV_MAP[currentRow.environment] || { text: currentRow.environment }).text}
                                        </Tag>
                                    </div>
                                    <div>
                                        <Text className="cmdb-detail-field-label">负责人</Text>
                                        <Text className="cmdb-detail-field-value">{currentRow.owner || '—'}</Text>
                                    </div>
                                </div>
                            </div>

                            <Divider style={{ margin: '12px 0' }} />

                            {/* 硬件信息 */}
                            <div className="cmdb-detail-section">
                                <div className="cmdb-detail-section-title">硬件 / 系统</div>
                                <div className="cmdb-detail-grid">
                                    <div>
                                        <Text className="cmdb-detail-field-label">操作系统</Text>
                                        <Space size={4}>
                                            {getOSIcon(currentRow.os)}
                                            <Text className="cmdb-detail-field-value">{currentRow.os || '—'}</Text>
                                        </Space>
                                    </div>
                                    <div>
                                        <Text className="cmdb-detail-field-label">系统版本</Text>
                                        <Text className="cmdb-detail-field-value">{currentRow.os_version || '—'}</Text>
                                    </div>
                                    <div>
                                        <Text className="cmdb-detail-field-label">CPU</Text>
                                        <Text className="cmdb-detail-field-value">{currentRow.cpu || '—'}</Text>
                                    </div>
                                    <div>
                                        <Text className="cmdb-detail-field-label">内存</Text>
                                        <Text className="cmdb-detail-field-value">{currentRow.memory || '—'}</Text>
                                    </div>
                                    <div>
                                        <Text className="cmdb-detail-field-label">磁盘</Text>
                                        <Text className="cmdb-detail-field-value">{currentRow.disk || '—'}</Text>
                                    </div>
                                    <div>
                                        <Text className="cmdb-detail-field-label">位置</Text>
                                        <Text className="cmdb-detail-field-value">{currentRow.location || '—'}</Text>
                                    </div>
                                    <div>
                                        <Text className="cmdb-detail-field-label">厂商</Text>
                                        <Text className="cmdb-detail-field-value">{currentRow.manufacturer || '—'}</Text>
                                    </div>
                                    <div>
                                        <Text className="cmdb-detail-field-label">型号</Text>
                                        <Text className="cmdb-detail-field-value">{currentRow.model || '—'}</Text>
                                    </div>
                                    <div>
                                        <Text className="cmdb-detail-field-label">序列号</Text>
                                        <Text copyable className="cmdb-detail-field-value" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                                            {currentRow.serial_number || '—'}
                                        </Text>
                                    </div>
                                    <div>
                                        <Text className="cmdb-detail-field-label">部门</Text>
                                        <Text className="cmdb-detail-field-value">{currentRow.department || '—'}</Text>
                                    </div>
                                </div>
                            </div>

                            <Divider style={{ margin: '12px 0' }} />

                            {/* 来源 & 时间 */}
                            <div className="cmdb-detail-section">
                                <div className="cmdb-detail-section-title">来源 / 时间</div>
                                <div className="cmdb-detail-grid">
                                    <div>
                                        <Text className="cmdb-detail-field-label">数据来源</Text>
                                        <Text className="cmdb-detail-field-value">
                                            {currentRow.source_plugin_name || '手动录入'}
                                        </Text>
                                    </div>
                                    <div>
                                        <Text className="cmdb-detail-field-label">外部 ID</Text>
                                        <Text className="cmdb-detail-field-value" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                                            {currentRow.external_id || '—'}
                                        </Text>
                                    </div>
                                    <div>
                                        <Text className="cmdb-detail-field-label">创建时间</Text>
                                        <Text style={{ fontSize: 13 }}>
                                            {currentRow.created_at ? dayjs(currentRow.created_at).format('YYYY-MM-DD HH:mm') : '—'}
                                        </Text>
                                    </div>
                                    <div>
                                        <Text className="cmdb-detail-field-label">更新时间</Text>
                                        <Text style={{ fontSize: 13 }}>
                                            {currentRow.updated_at ? dayjs(currentRow.updated_at).format('YYYY-MM-DD HH:mm') : '—'}
                                        </Text>
                                    </div>
                                </div>
                            </div>

                            {/* 维护日志 */}
                            {maintenanceLogs.length > 0 && (
                                <>
                                    <Divider style={{ margin: '12px 0' }} />
                                    <div className="cmdb-detail-section">
                                        <div className="cmdb-detail-section-title">维护日志</div>
                                        <div className="cmdb-maintenance-log">
                                            {maintenanceLogs.map(log => (
                                                <div key={log.id} className="cmdb-maintenance-log-item">
                                                    <Tag color={log.action === 'enter' ? 'orange' : 'green'} style={{ margin: 0 }}>
                                                        {log.action === 'enter' ? '进入' : '退出'}
                                                    </Tag>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: 13 }}>{log.reason || '—'}</div>
                                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                                            {log.operator} · {dayjs(log.created_at).format('YYYY-MM-DD HH:mm')}
                                                        </Text>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* 资产 ID */}
                            <div style={{ paddingTop: 12, borderTop: '1px solid #f0f0f0', marginTop: 12 }}>
                                <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
                                    ID: {currentRow.id}
                                </Text>
                            </div>
                        </div>
                    </>
                )}
            </Drawer>

            {/* ====== 密钥源选择（独立组件，内部 state 不触发父组件渲染） ====== */}
            <SecretsSourceSelector
                open={selectSourceModalOpen}
                sources={secretsSources}
                targetName={singleTestTarget?.name}
                batchCount={singleTestTarget ? undefined : selectedRows.length}
                loading={testing}
                onConfirm={handleRunTest}
                onCancel={() => setSelectSourceModalOpen(false)}
            />

            {/* ====== 测试结果弹窗（聚合分组展示） ====== */}
            <ConnectionTestResultModal
                open={testResultModalOpen}
                results={testResults}
                cmdbItems={singleTestTarget ? [singleTestTarget] : selectedRows}
                onClose={() => setTestResultModalOpen(false)}
            />

            {/* ====== 维护模式弹窗 ====== */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ToolOutlined style={{ color: '#faad14' }} />
                        <span>{maintenanceTarget
                            ? `进入维护模式 - ${maintenanceTarget.name}`
                            : `批量进入维护模式 (${selectedRows.length})`}
                        </span>
                    </div>
                }
                open={maintenanceModalOpen}
                onCancel={() => { setMaintenanceModalOpen(false); setMaintenanceReason(''); setMaintenanceEndAt(undefined); }}
                okText="确认进入"
                okButtonProps={{ disabled: !maintenanceReason, icon: <ToolOutlined /> }}
                onOk={handleEnterMaintenance}
                destroyOnHidden
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* 操作说明 */}
                    <Alert
                        type="info"
                        showIcon
                        message="批量维护操作说明"
                        description={maintenanceTarget
                            ? `${maintenanceTarget.name} 将被标记为维护模式，暂时不参与自愈流程。`
                            : `选中的 ${selectedRows.length} 台主机将被标记为维护模式，暂时不参与自愈流程。`
                        }
                    />

                    {/* 维护原因 */}
                    <div>
                        <div style={{ marginBottom: 6, fontSize: 13 }}>维护原因（必填）：</div>
                        <Input.TextArea
                            rows={3}
                            placeholder="例如：批量系统升级、机房断电维护..."
                            value={maintenanceReason}
                            onChange={(e) => setMaintenanceReason(e.target.value)}
                            maxLength={200}
                            showCount
                        />
                    </div>

                    {/* 计划结束时间 */}
                    <div>
                        <div style={{ marginBottom: 6, fontSize: 13 }}>计划结束时间（可选）：</div>
                        <DatePicker
                            showTime={{ format: 'HH:mm' }}
                            format="YYYY/MM/DD HH:mm"
                            placeholder="YYYY/MM/DD hh:mm"
                            style={{ width: '100%' }}
                            value={maintenanceEndAt ? dayjs(maintenanceEndAt) : undefined}
                            onChange={(val) => setMaintenanceEndAt(val ? val.toISOString() : undefined)}
                            disabledDate={(current) => current && current < dayjs().startOf('day')}
                        />
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                            {[
                                { label: '2小时后', hours: 2 },
                                { label: '4小时后', hours: 4 },
                                { label: '8小时后', hours: 8 },
                                { label: '24小时后', hours: 24 },
                                { label: '3天后', hours: 72 },
                                { label: '7天后', hours: 168 },
                            ].map(item => (
                                <Button
                                    key={item.hours}
                                    size="small"
                                    onClick={() => setMaintenanceEndAt(dayjs().add(item.hours, 'hour').toISOString())}
                                >
                                    {item.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default CMDBList;

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAccess } from '@umijs/max';
import {
    AlertOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined,
    SyncOutlined, SearchOutlined, UndoOutlined, EyeOutlined,
    ClockCircleOutlined, BugOutlined, ThunderboltOutlined, MinusCircleOutlined,
    InfoCircleOutlined, FileTextOutlined, MedicineBoxOutlined, LinkOutlined, CodeOutlined,
} from '@ant-design/icons';
import {
    Space, Tooltip, message, Typography, Badge, Tag, Button, Drawer, Modal,
} from 'antd';
import dayjs from 'dayjs';
import StandardTable from '@/components/StandardTable';
import type { StandardColumnDef, SearchField, AdvancedSearchField } from '@/components/StandardTable';

import {
    getIncidents, getIncident, getIncidentStats, resetIncidentScan, batchResetIncidentScan,
} from '@/services/auto-healing/incidents';
import './index.css';

const { Text } = Typography;

/* ========== 枚举映射 ========== */
import {
    INCIDENT_SEVERITY_MAP as SEVERITY_MAP,
    INCIDENT_HEALING_MAP as HEALING_MAP,
    INCIDENT_STATUS_MAP as STATUS_MAP,
    getSeverityOptions, getIncidentStatusOptions, getHealingStatusOptions,
} from '@/constants/incidentDicts';

/* ========== 搜索字段 ========== */
const searchFields: SearchField[] = [
    { key: 'keyword', label: '关键字' },
    { key: 'external_id', label: '外部 ID' },
];

const advancedSearchFields: AdvancedSearchField[] = [
    { key: 'keyword', label: '关键字', type: 'input', placeholder: '搜索标题 / 外部ID' },
    { key: 'source_plugin_name', label: '来源插件', type: 'input', placeholder: '插件名称' },
    {
        key: 'severity', label: '严重程度', type: 'select', placeholder: '全部级别',
        options: getSeverityOptions(),
    },
    {
        key: 'healing_status', label: '自愈状态', type: 'select', placeholder: '全部状态',
        options: getHealingStatusOptions(),
    },
    {
        key: 'status', label: '工单状态', type: 'select', placeholder: '全部状态',
        options: getIncidentStatusOptions(),
    },
    {
        key: 'has_plugin', label: '关联插件', type: 'select', placeholder: '全部',
        options: [
            { label: '已关联', value: 'true' },
            { label: '未关联', value: 'false' },
        ],
    },
];

/* ========== Header Icon ========== */
const headerIcon = (
    <svg viewBox="0 0 48 48" fill="none">
        <rect x="4" y="6" width="40" height="36" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
        <line x1="4" y1="16" x2="44" y2="16" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="25" r="3" fill="#f5222d" opacity="0.8" />
        <circle cx="12" cy="35" r="3" fill="#faad14" opacity="0.8" />
        <rect x="20" y="23" width="18" height="2" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="20" y="33" width="14" height="2" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="8" y="9" width="8" height="4" rx="1" fill="currentColor" opacity="0.2" />
    </svg>
);

/* ========== 组件 ========== */
const IncidentList: React.FC = () => {
    const access = useAccess();
    /* ---- 统计 ---- */
    const [stats, setStats] = useState<AutoHealing.IncidentStats | null>(null);
    const loadStats = useCallback(async () => {
        try {
            const res = await getIncidentStats();
            setStats(res);
        } catch { /* ignore */ }
    }, []);
    useEffect(() => { loadStats(); }, []);

    /* ---- 详情 Drawer ---- */
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [currentRow, setCurrentRow] = useState<AutoHealing.Incident | null>(null);

    const openDetail = useCallback(async (record: AutoHealing.Incident) => {
        setCurrentRow(record);
        setDrawerOpen(true);
        setDetailLoading(true);
        try {
            const detail = await getIncident(record.id);
            setCurrentRow(detail);
        } catch { /* ignore */ }
        finally { setDetailLoading(false); }
    }, []);

    /* ---- 选中行（批量操作 — 跨页保持） ---- */
    const [selectedRowMap, setSelectedRowMap] = useState<Map<string, AutoHealing.Incident>>(new Map());
    const selectedRows = useMemo(() => Array.from(selectedRowMap.values()), [selectedRowMap]);

    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const triggerRefresh = useCallback(() => { setRefreshTrigger(n => n + 1); }, []);

    /* ======= 重置扫描 ======= */
    const handleResetScan = useCallback(async (record: AutoHealing.Incident) => {
        try {
            await resetIncidentScan(record.id);
            message.success('已重置扫描状态');
            triggerRefresh();
        } catch { message.error('重置失败'); }
    }, [triggerRefresh]);

    const handleBatchResetScan = useCallback(async () => {
        const ids = selectedRows.map(r => r.id);
        if (ids.length === 0) return;
        Modal.confirm({
            title: '批量重置扫描',
            content: `确定要重置 ${ids.length} 条工单的扫描状态吗？重置后将重新进行规则匹配。`,
            okText: '确定',
            cancelText: '取消',
            onOk: async () => {
                try {
                    const res: any = await batchResetIncidentScan({ ids });
                    message.success(`成功重置 ${res.data.affected_count} 条工单`);
                    setSelectedRowMap(new Map());
                    triggerRefresh();
                } catch { message.error('批量重置失败'); }
            },
        });
    }, [selectedRows, triggerRefresh]);

    /* ========== 列定义 ========== */
    const columns = useMemo<StandardColumnDef<AutoHealing.Incident>[]>(() => [
        {
            columnKey: 'title',
            columnTitle: '工单标题',
            fixedColumn: true,
            dataIndex: 'title',
            width: 240,
            sorter: true,
            render: (_: any, record: AutoHealing.Incident) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <a
                        style={{ fontWeight: 500, color: '#1677ff', cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); openDetail(record); }}
                    >
                        {record.title || '无标题'}
                    </a>
                    <span style={{ fontSize: 11, fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace", color: '#8590a6', letterSpacing: '0.02em' }}>
                        {record.external_id}
                    </span>
                </div>
            ),
        },
        {
            columnKey: 'source_plugin_name',
            columnTitle: '来源',
            dataIndex: 'source_plugin_name',
            width: 110,
            sorter: true,
            render: (_: any, record: AutoHealing.Incident) =>
                record.source_plugin_name
                    ? <Tag style={{ margin: 0 }}>{record.source_plugin_name}</Tag>
                    : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>,
        },
        {
            columnKey: 'severity',
            columnTitle: '级别',
            dataIndex: 'severity',
            width: 80,
            sorter: true,
            headerFilters: getSeverityOptions(),
            render: (_: any, record: AutoHealing.Incident) => {
                const info = SEVERITY_MAP[record.severity] || { text: record.severity, tagColor: 'default' };
                return <Tag color={info.tagColor} style={{ margin: 0 }}>{info.text}</Tag>;
            },
        },
        {
            columnKey: 'status',
            columnTitle: '工单状态',
            dataIndex: 'status',
            width: 90,
            sorter: true,
            headerFilters: getIncidentStatusOptions(),
            render: (_: any, record: AutoHealing.Incident) => {
                const info = STATUS_MAP[record.status] || { text: record.status, color: 'default' };
                return <Tag color={info.color} style={{ margin: 0 }}>{info.text}</Tag>;
            },
        },
        {
            columnKey: 'healing_status',
            columnTitle: '自愈状态',
            dataIndex: 'healing_status',
            width: 100,
            sorter: true,
            headerFilters: getHealingStatusOptions(),
            render: (_: any, record: AutoHealing.Incident) => {
                const info = HEALING_MAP[record.healing_status] || { text: record.healing_status, badge: 'default' as const };
                return <Badge status={info.badge} text={info.text} />;
            },
        },
        {
            columnKey: 'scanned',
            columnTitle: '扫描',
            dataIndex: 'scanned',
            width: 70,
            headerFilters: [
                { label: '已扫描', value: 'true' },
                { label: '待扫描', value: 'false' },
            ],
            render: (_: any, record: AutoHealing.Incident) => (
                <Tag color={record.scanned ? 'green' : 'default'} style={{ margin: 0 }}>
                    {record.scanned ? '已扫描' : '待扫描'}
                </Tag>
            ),
        },
        {
            columnKey: 'category',
            columnTitle: '分类',
            dataIndex: 'category',
            width: 100,
            sorter: true,
            defaultVisible: false,
            ellipsis: true,
            render: (_: any, record: AutoHealing.Incident) =>
                record.category || <Text type="secondary">-</Text>,
        },
        {
            columnKey: 'affected_ci',
            columnTitle: '影响 CI',
            dataIndex: 'affected_ci',
            width: 120,
            defaultVisible: false,
            ellipsis: true,
            render: (_: any, record: AutoHealing.Incident) =>
                record.affected_ci || <Text type="secondary">-</Text>,
        },
        {
            columnKey: 'assignee',
            columnTitle: '指派人',
            dataIndex: 'assignee',
            width: 100,
            sorter: true,
            defaultVisible: false,
            ellipsis: true,
            render: (_: any, record: AutoHealing.Incident) =>
                record.assignee || <Text type="secondary">-</Text>,
        },
        {
            columnKey: 'created_at',
            columnTitle: '创建时间',
            dataIndex: 'created_at',
            width: 170,
            sorter: true,
            render: (_: any, record: AutoHealing.Incident) =>
                record.created_at ? dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss') : '-',
        },
        {
            columnKey: 'actions',
            columnTitle: '操作',
            fixedColumn: true,
            width: 90,
            render: (_: any, record: AutoHealing.Incident) => (
                <Space size="small">
                    <Tooltip title="查看详情">
                        <Button
                            type="link" size="small" icon={<EyeOutlined />}
                            onClick={(e) => { e.stopPropagation(); openDetail(record); }}
                        />
                    </Tooltip>
                    <Tooltip title="重置扫描">
                        <Button
                            type="link" size="small" icon={<UndoOutlined />}
                            onClick={(e) => { e.stopPropagation(); handleResetScan(record); }}
                            disabled={!access.canTriggerHealing}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ], [openDetail, handleResetScan]);

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
            const field = params.searchField || 'keyword';
            if (field === 'external_id') {
                apiParams.external_id = params.searchValue;
            } else {
                apiParams.search = params.searchValue;
            }
        }

        // 高级搜索
        if (params.advancedSearch) {
            const adv = params.advancedSearch;
            if (adv.keyword) apiParams.search = adv.keyword;
            if (adv.external_id) apiParams.external_id = adv.external_id;
            if (adv.source_plugin_name) apiParams.source_plugin_name = adv.source_plugin_name;
            if (adv.severity) apiParams.severity = adv.severity;
            if (adv.healing_status) apiParams.healing_status = adv.healing_status;
            if (adv.status) apiParams.status = adv.status;
            if (adv.has_plugin !== undefined && adv.has_plugin !== '') {
                apiParams.has_plugin = adv.has_plugin === 'true';
            }
        }

        // 排序
        if (params.sorter?.field) {
            apiParams.sort_by = params.sorter.field;
            apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
        }

        const res = await getIncidents(apiParams);
        const items = (res as any)?.data || [];
        const total = (res as any)?.pagination?.total ?? (res as any)?.total ?? 0;

        // 异步刷新统计
        loadStats();
        return { data: items, total };
    }, [loadStats]);

    /* ========== 统计栏 ========== */
    const statsBar = useMemo(() => {
        if (!stats) return null;
        return (
            <div className="incidents-stats-bar">
                <div className="incidents-stat-item">
                    <AlertOutlined className="incidents-stat-icon incidents-stat-icon-total" />
                    <div className="incidents-stat-content">
                        <div className="incidents-stat-value">{stats.total}</div>
                        <div className="incidents-stat-label">总工单</div>
                    </div>
                </div>
                <div className="incidents-stat-divider" />
                <div className="incidents-stat-item">
                    <SearchOutlined className="incidents-stat-icon incidents-stat-icon-scanned" />
                    <div className="incidents-stat-content">
                        <div className="incidents-stat-value">{stats.scanned}</div>
                        <div className="incidents-stat-label">已扫描</div>
                    </div>
                </div>
                <div className="incidents-stat-divider" />
                <div className="incidents-stat-item">
                    <ClockCircleOutlined className="incidents-stat-icon incidents-stat-icon-unscanned" />
                    <div className="incidents-stat-content">
                        <div className="incidents-stat-value">{stats.unscanned}</div>
                        <div className="incidents-stat-label">待扫描</div>
                    </div>
                </div>
                <div className="incidents-stat-divider" />
                <div className="incidents-stat-item">
                    <ThunderboltOutlined className="incidents-stat-icon incidents-stat-icon-healed" />
                    <div className="incidents-stat-content">
                        <div className="incidents-stat-value">{stats.healed}</div>
                        <div className="incidents-stat-label">已自愈</div>
                    </div>
                </div>
                <div className="incidents-stat-divider" />
                <div className="incidents-stat-item">
                    <CloseCircleOutlined className="incidents-stat-icon incidents-stat-icon-failed" />
                    <div className="incidents-stat-content">
                        <div className="incidents-stat-value">{stats.failed}</div>
                        <div className="incidents-stat-label">自愈失败</div>
                    </div>
                </div>
            </div>
        );
    }, [stats]);

    /* ========== 批量操作栏 ========== */
    const batchToolbar = useMemo(() => {
        if (selectedRows.length === 0) return null;
        return (
            <div className="incidents-batch-bar" style={{ gap: 6 }}>
                <span style={{ fontSize: 13, color: '#1677ff', fontWeight: 500 }}>已选 {selectedRows.length} 项</span>
                <Button size="small" icon={<UndoOutlined />}
                    disabled={!access.canTriggerHealing}
                    onClick={handleBatchResetScan}>
                    重置扫描
                </Button>
                <Button type="link" style={{ color: '#8c8c8c' }}
                    onClick={() => setSelectedRowMap(new Map())}>
                    取消选择
                </Button>
            </div>
        );
    }, [selectedRows.length, handleBatchResetScan]);

    return (
        <>
            <StandardTable<AutoHealing.Incident>
                refreshTrigger={refreshTrigger}
                tabs={[{ key: 'list', label: '工单列表' }]}
                title="工单管理"
                description="集中管理来自 ITSM 系统的工单，支持自动扫描匹配自愈规则并触发自动修复流程。"
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
                    onChange: (keys: React.Key[], rows: AutoHealing.Incident[]) => {
                        const validRows = rows.filter(Boolean);
                        const keySet = new Set(keys.map(String));
                        setSelectedRowMap(prev => {
                            const next = new Map<string, AutoHealing.Incident>();
                            for (const [id, item] of prev) {
                                if (keySet.has(id)) next.set(id, item);
                            }
                            for (const row of validRows) {
                                if (row?.id && keySet.has(row.id)) next.set(row.id, row);
                            }
                            return next;
                        });
                    },
                }}
                request={handleRequest}
                defaultPageSize={20}
                preferenceKey="incidents_v2"
            />

            {/* ====== 详情 Drawer ====== */}
            <Drawer
                title={null}
                size={560}
                open={drawerOpen}
                onClose={() => { setDrawerOpen(false); setCurrentRow(null); }}
                styles={{ header: { display: 'none' }, body: { padding: 0 } }}
                loading={detailLoading}
                destroyOnHidden
            >
                {currentRow && (
                    <>
                        {/* 头部 */}
                        <div className="incidents-detail-header">
                            <div className="incidents-detail-header-top">
                                <div className="incidents-detail-header-icon">
                                    <AlertOutlined />
                                </div>
                                <div className="incidents-detail-header-info">
                                    <div className="incidents-detail-title">{currentRow.title || '无标题'}</div>
                                    <div className="incidents-detail-sub">{currentRow.external_id}</div>
                                </div>
                                {(() => {
                                    const sev = SEVERITY_MAP[currentRow.severity];
                                    return sev
                                        ? <Tag color={sev.tagColor}>{sev.text}</Tag>
                                        : <Tag>{currentRow.severity}</Tag>;
                                })()}
                            </div>
                            {/* 操作按钮 */}
                            <Space size="small">
                                <Button size="small" icon={<UndoOutlined />}
                                    disabled={!access.canTriggerHealing}
                                    onClick={() => handleResetScan(currentRow)}>
                                    重置扫描
                                </Button>
                            </Space>
                        </div>

                        {/* 内容体 */}
                        <div className="incidents-detail-body">
                            {/* 基本信息卡片 */}
                            <div className="incidents-detail-card">
                                <div className="incidents-detail-card-header">
                                    <InfoCircleOutlined className="incidents-detail-card-header-icon" />
                                    <span className="incidents-detail-card-header-title">基本信息</span>
                                </div>
                                <div className="incidents-detail-card-body">
                                    <div className="incidents-detail-grid">
                                        <div className="incidents-detail-field">
                                            <span className="incidents-detail-field-label">工单状态</span>
                                            <div className="incidents-detail-field-value">
                                                {(() => {
                                                    const info = STATUS_MAP[currentRow.status];
                                                    return info
                                                        ? <Tag color={info.color}>{info.text}</Tag>
                                                        : <Tag>{currentRow.status}</Tag>;
                                                })()}
                                            </div>
                                        </div>
                                        <div className="incidents-detail-field">
                                            <span className="incidents-detail-field-label">严重程度</span>
                                            <div className="incidents-detail-field-value">
                                                {(() => {
                                                    const info = SEVERITY_MAP[currentRow.severity];
                                                    return info
                                                        ? <Tag color={info.tagColor}>{info.text}</Tag>
                                                        : <Tag>{currentRow.severity}</Tag>;
                                                })()}
                                            </div>
                                        </div>
                                        <div className="incidents-detail-field">
                                            <span className="incidents-detail-field-label">优先级</span>
                                            <div className="incidents-detail-field-value">{currentRow.priority || '-'}</div>
                                        </div>
                                        <div className="incidents-detail-field">
                                            <span className="incidents-detail-field-label">分类</span>
                                            <div className="incidents-detail-field-value">{currentRow.category || '-'}</div>
                                        </div>
                                        <div className="incidents-detail-field">
                                            <span className="incidents-detail-field-label">影响 CI</span>
                                            <div className="incidents-detail-field-value">{currentRow.affected_ci || '-'}</div>
                                        </div>
                                        <div className="incidents-detail-field">
                                            <span className="incidents-detail-field-label">影响服务</span>
                                            <div className="incidents-detail-field-value">{currentRow.affected_service || '-'}</div>
                                        </div>
                                        <div className="incidents-detail-field">
                                            <span className="incidents-detail-field-label">指派人</span>
                                            <div className="incidents-detail-field-value">{currentRow.assignee || '-'}</div>
                                        </div>
                                        <div className="incidents-detail-field">
                                            <span className="incidents-detail-field-label">报告人</span>
                                            <div className="incidents-detail-field-value">{currentRow.reporter || '-'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 描述卡片 */}
                            {currentRow.description && (
                                <div className="incidents-detail-card">
                                    <div className="incidents-detail-card-header">
                                        <FileTextOutlined className="incidents-detail-card-header-icon" />
                                        <span className="incidents-detail-card-header-title">描述</span>
                                    </div>
                                    <div className="incidents-detail-card-body">
                                        <div className="incidents-detail-desc">
                                            {currentRow.description}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 自愈信息卡片 */}
                            <div className="incidents-detail-card">
                                <div className="incidents-detail-card-header">
                                    <MedicineBoxOutlined className="incidents-detail-card-header-icon" />
                                    <span className="incidents-detail-card-header-title">自愈信息</span>
                                </div>
                                <div className="incidents-detail-card-body">
                                    <div className="incidents-detail-grid">
                                        <div className="incidents-detail-field">
                                            <span className="incidents-detail-field-label">自愈状态</span>
                                            <div className="incidents-detail-field-value">
                                                {(() => {
                                                    const info = HEALING_MAP[currentRow.healing_status];
                                                    return info
                                                        ? <Badge status={info.badge} text={info.text} />
                                                        : <span>{currentRow.healing_status}</span>;
                                                })()}
                                            </div>
                                        </div>
                                        <div className="incidents-detail-field">
                                            <span className="incidents-detail-field-label">扫描状态</span>
                                            <div className="incidents-detail-field-value">
                                                <Tag color={currentRow.scanned ? 'green' : 'default'}>
                                                    {currentRow.scanned ? '已扫描' : '待扫描'}
                                                </Tag>
                                            </div>
                                        </div>
                                        <div className="incidents-detail-field">
                                            <span className="incidents-detail-field-label">匹配规则 ID</span>
                                            <div className="incidents-detail-field-value incidents-detail-field-value-mono">
                                                {currentRow.matched_rule_id || '-'}
                                            </div>
                                        </div>
                                        <div className="incidents-detail-field">
                                            <span className="incidents-detail-field-label">自愈流程 ID</span>
                                            <div className="incidents-detail-field-value incidents-detail-field-value-mono">
                                                {currentRow.healing_flow_instance_id || '-'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 来源与时间卡片 */}
                            <div className="incidents-detail-card">
                                <div className="incidents-detail-card-header">
                                    <LinkOutlined className="incidents-detail-card-header-icon" />
                                    <span className="incidents-detail-card-header-title">来源与时间</span>
                                </div>
                                <div className="incidents-detail-card-body">
                                    <div className="incidents-detail-grid">
                                        <div className="incidents-detail-field">
                                            <span className="incidents-detail-field-label">来源插件</span>
                                            <div className="incidents-detail-field-value">
                                                {currentRow.source_plugin_name
                                                    ? <Tag style={{ margin: 0 }}>{currentRow.source_plugin_name}</Tag>
                                                    : '-'
                                                }
                                            </div>
                                        </div>
                                        <div className="incidents-detail-field">
                                            <span className="incidents-detail-field-label">外部 ID</span>
                                            <div className="incidents-detail-field-value incidents-detail-field-value-mono">
                                                {currentRow.external_id || '-'}
                                            </div>
                                        </div>
                                        <div className="incidents-detail-field">
                                            <span className="incidents-detail-field-label">源系统创建</span>
                                            <div className="incidents-detail-field-value">
                                                {currentRow.source_created_at ? dayjs(currentRow.source_created_at).format('YYYY-MM-DD HH:mm') : '-'}
                                            </div>
                                        </div>
                                        <div className="incidents-detail-field">
                                            <span className="incidents-detail-field-label">源系统更新</span>
                                            <div className="incidents-detail-field-value">
                                                {currentRow.source_updated_at ? dayjs(currentRow.source_updated_at).format('YYYY-MM-DD HH:mm') : '-'}
                                            </div>
                                        </div>
                                        <div className="incidents-detail-field">
                                            <span className="incidents-detail-field-label">本地创建</span>
                                            <div className="incidents-detail-field-value">
                                                {currentRow.created_at ? dayjs(currentRow.created_at).format('YYYY-MM-DD HH:mm') : '-'}
                                            </div>
                                        </div>
                                        <div className="incidents-detail-field">
                                            <span className="incidents-detail-field-label">本地更新</span>
                                            <div className="incidents-detail-field-value">
                                                {currentRow.updated_at ? dayjs(currentRow.updated_at).format('YYYY-MM-DD HH:mm') : '-'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 原始数据卡片 */}
                            {currentRow.raw_data && Object.keys(currentRow.raw_data).length > 0 && (
                                <div className="incidents-detail-card">
                                    <div className="incidents-detail-card-header">
                                        <CodeOutlined className="incidents-detail-card-header-icon" />
                                        <span className="incidents-detail-card-header-title">原始数据</span>
                                    </div>
                                    <div className="incidents-raw-data">
                                        {JSON.stringify(currentRow.raw_data, null, 2)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </Drawer>
        </>
    );
};

export default IncidentList;

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useAccess } from '@umijs/max';
import { Button, message, Tag, Modal, Drawer, Descriptions, Typography, Space } from 'antd';
import {
    AlertOutlined, WarningOutlined, InfoCircleOutlined,
    CheckCircleOutlined, ClockCircleOutlined, ThunderboltOutlined, StopOutlined, UndoOutlined,
} from '@ant-design/icons';
import StandardTable, { type StandardColumnDef, type SearchField, type AdvancedSearchField } from '@/components/StandardTable';
import { getPendingTriggers, getDismissedTriggers, triggerHealing, dismissIncident, resetIncidentScan } from '@/services/auto-healing/healing';
import dayjs from 'dayjs';
import { INCIDENT_SEVERITY_MAP, SEVERITY_TAG_COLORS, CATEGORY_LABELS } from '@/constants/incidentDicts';

const { Text } = Typography;

/* ============================== 常量 ============================== */

const SEVERITY_ICON_MAP: Record<string, React.ReactNode> = {
    critical: <AlertOutlined />, high: <WarningOutlined />,
    medium: <InfoCircleOutlined />, low: <CheckCircleOutlined />,
    '1': <AlertOutlined />, '2': <WarningOutlined />,
    '3': <InfoCircleOutlined />, '4': <CheckCircleOutlined />,
};

const SEVERITY_MAP: Record<string, { color: string; label: string; icon: React.ReactNode }> = Object.fromEntries(
    Object.entries(INCIDENT_SEVERITY_MAP).map(([key, meta]) => [
        key,
        { color: SEVERITY_TAG_COLORS[key] || 'default', label: meta.text, icon: SEVERITY_ICON_MAP[key] || <InfoCircleOutlined /> },
    ])
);

/* ============================== 工具函数 ============================== */

const getSeverityTag = (severity: string | number) => {
    const s = String(severity).toLowerCase();
    const cfg = SEVERITY_MAP[s];
    if (cfg) return <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>;
    return <Tag color="default" icon={<CheckCircleOutlined />}>低</Tag>;
};

const formatTime = (t: string | null | undefined) => {
    if (!t) return '-';
    return dayjs(t).format('YYYY-MM-DD HH:mm:ss');
};

/* ============================== 搜索字段 ============================== */

const searchFields: SearchField[] = [
    { key: 'title', label: '工单标题', placeholder: '搜索标题/ID/CI' },
];

const advancedSearchFields: AdvancedSearchField[] = [
    {
        key: 'severity', label: '等级', type: 'select',
        options: [
            { label: '严重', value: 'critical' },
            { label: '高', value: 'high' },
            { label: '中', value: 'medium' },
            { label: '低', value: 'low' },
        ],
    },
    { key: 'created_at', label: '创建时间', type: 'dateRange' },
];

/* ============================== 组件 ============================== */

const PendingTriggers: React.FC = () => {
    const access = useAccess();
    const refreshCountRef = useRef(0);

    /* ------------ Tab 切换 ------------ */
    const [activeTab, setActiveTab] = useState<'pending' | 'dismissed'>('pending');

    /* ------------ 详情 Drawer ------------ */
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [detail, setDetail] = useState<any>(null);

    const openDetail = useCallback((record: any) => {
        setDetail(record);
        setDrawerOpen(true);
    }, []);

    const closeDrawer = useCallback(() => {
        setDrawerOpen(false);
        setDetail(null);
    }, []);

    /* ------------ 触发/忽略操作 ------------ */
    const [, setRefreshKey] = useState(0);
    const handleTrigger = useCallback((id: string, externalId: string) => {
        Modal.confirm({
            title: '确认启动自愈？',
            content: `确定要为工单 ${externalId} 启动自愈流程吗？`,
            okText: '启动',
            cancelText: '取消',
            onOk: async () => {
                try {
                    await triggerHealing(id);
                    message.success('已启动自愈流程');
                    refreshCountRef.current += 1;
                    setRefreshKey(prev => prev + 1);
                } catch {
                    /* global error handler */
                }
            },
        });
    }, []);

    const handleDismiss = useCallback((id: string, externalId: string) => {
        Modal.confirm({
            title: '确认忽略工单？',
            content: `确定要忽略工单 ${externalId} 吗？忽略后该工单将不再出现在待触发列表中。`,
            okText: '忽略',
            okButtonProps: { danger: true },
            cancelText: '取消',
            onOk: async () => {
                try {
                    await dismissIncident(id);
                    message.success('工单已忽略');
                    refreshCountRef.current += 1;
                    setRefreshKey(prev => prev + 1);
                } catch {
                    /* global error handler */
                }
            },
        });
    }, []);

    const handleResetScan = useCallback((id: string, externalId: string) => {
        Modal.confirm({
            title: '确认恢复工单？',
            content: `确定要将工单 ${externalId} 恢复为待处理状态吗？恢复后将重新扫描匹配规则。`,
            okText: '恢复',
            cancelText: '取消',
            onOk: async () => {
                try {
                    await resetIncidentScan(id);
                    message.success('工单已恢复为待处理');
                    refreshCountRef.current += 1;
                    setRefreshKey(prev => prev + 1);
                } catch {
                    /* global error handler */
                }
            },
        });
    }, []);

    /* ============================== 列定义（待处理） ============================== */

    const pendingColumns: StandardColumnDef<any>[] = useMemo(() => [
        {
            columnKey: 'title',
            columnTitle: '工单标题',
            dataIndex: 'title',
            ellipsis: true,
            fixedColumn: true,
        },
        {
            columnKey: 'external_id',
            columnTitle: '工单ID',
            dataIndex: 'external_id',
            width: 200,
        },
        {
            columnKey: 'severity',
            columnTitle: '等级',
            dataIndex: 'severity',
            width: 100,
            render: (_: any, record: any) => getSeverityTag(record.severity),
            headerFilters: [
                { label: '严重', value: 'critical' },
                { label: '高', value: 'high' },
                { label: '中', value: 'medium' },
                { label: '低', value: 'low' },
            ],
        },
        {
            columnKey: 'affected_ci',
            columnTitle: '影响CI',
            dataIndex: 'affected_ci',
            width: 150,
            ellipsis: true,
        },
        {
            columnKey: 'affected_service',
            columnTitle: '影响服务',
            dataIndex: 'affected_service',
            width: 150,
            ellipsis: true,
        },
        {
            columnKey: 'created_at',
            columnTitle: '创建时间',
            dataIndex: 'created_at',
            width: 180,
            sorter: true,
            render: (_: any, record: any) => formatTime(record.created_at),
        },
        {
            columnKey: 'actions',
            columnTitle: '操作',
            width: 150,
            fixedColumn: true,
            fixed: 'right',
            render: (_: any, record: any) => (
                <Space size={4}>
                    <Button
                        type="primary"
                        size="small"
                        icon={<ThunderboltOutlined />}
                        disabled={!access.canTriggerHealing}
                        onClick={() => handleTrigger(record.id, record.external_id)}
                    >
                        启动
                    </Button>
                    <Button
                        danger
                        size="small"
                        icon={<StopOutlined />}
                        disabled={!access.canTriggerHealing}
                        onClick={() => handleDismiss(record.id, record.external_id)}
                    >
                        忽略
                    </Button>
                </Space>
            ),
        },
    ], [handleTrigger, handleDismiss]);

    /* ============================== 列定义（已忽略） ============================== */

    const dismissedColumns: StandardColumnDef<any>[] = useMemo(() => [
        {
            columnKey: 'title',
            columnTitle: '工单标题',
            dataIndex: 'title',
            ellipsis: true,
            fixedColumn: true,
        },
        {
            columnKey: 'external_id',
            columnTitle: '工单ID',
            dataIndex: 'external_id',
            width: 200,
        },
        {
            columnKey: 'severity',
            columnTitle: '等级',
            dataIndex: 'severity',
            width: 100,
            render: (_: any, record: any) => getSeverityTag(record.severity),
            headerFilters: [
                { label: '严重', value: 'critical' },
                { label: '高', value: 'high' },
                { label: '中', value: 'medium' },
                { label: '低', value: 'low' },
            ],
        },
        {
            columnKey: 'affected_ci',
            columnTitle: '影响CI',
            dataIndex: 'affected_ci',
            width: 150,
            ellipsis: true,
        },
        {
            columnKey: 'affected_service',
            columnTitle: '影响服务',
            dataIndex: 'affected_service',
            width: 150,
            ellipsis: true,
        },
        {
            columnKey: 'created_at',
            columnTitle: '创建时间',
            dataIndex: 'created_at',
            width: 180,
            sorter: true,
            render: (_: any, record: any) => formatTime(record.created_at),
        },
        {
            columnKey: 'updated_at',
            columnTitle: '忽略时间',
            dataIndex: 'updated_at',
            width: 180,
            sorter: true,
            render: (_: any, record: any) => formatTime(record.updated_at),
        },
        {
            columnKey: 'actions',
            columnTitle: '操作',
            width: 100,
            fixedColumn: true,
            fixed: 'right',
            render: (_: any, record: any) => (
                <Button
                    size="small"
                    icon={<UndoOutlined />}
                    disabled={!access.canTriggerHealing}
                    onClick={() => handleResetScan(record.id, record.external_id)}
                >
                    恢复
                </Button>
            ),
        },
    ], [handleResetScan]);

    /* ============================== 数据请求 ============================== */

    const handlePendingRequest = useCallback(async (params: {
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

        // 快速搜索 → 后端 title 参数
        if (params.searchValue) {
            apiParams.title = params.searchValue;
        }

        // 高级搜索 — 通用字段传递（支持 __exact 后缀）
        if (params.advancedSearch) {
            Object.entries(params.advancedSearch).forEach(([key, value]) => {
                if (value === undefined || value === null || value === '') return;
                // dateRange 类型拆分为 date_from/date_to
                if (key === 'created_at' && Array.isArray(value) && value.length === 2) {
                    if (value[0]) apiParams.date_from = dayjs(value[0]).format('YYYY-MM-DD');
                    if (value[1]) apiParams.date_to = dayjs(value[1]).format('YYYY-MM-DD');
                    return;
                }
                apiParams[key] = value;
            });
        }

        if (params.sorter) {
            apiParams.sort_by = params.sorter.field;
            apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
        }

        const res = await getPendingTriggers(apiParams);
        const items = res?.data || [];
        const total = Number(res?.total ?? 0);
        return { data: items, total };
    }, []);

    const handleDismissedRequest = useCallback(async (params: {
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

        // 快速搜索 → 后端 title 参数
        if (params.searchValue) {
            apiParams.title = params.searchValue;
        }

        // 高级搜索 — 通用字段传递（支持 __exact 后缀）
        if (params.advancedSearch) {
            Object.entries(params.advancedSearch).forEach(([key, value]) => {
                if (value === undefined || value === null || value === '') return;
                // dateRange 类型拆分为 date_from/date_to
                if (key === 'created_at' && Array.isArray(value) && value.length === 2) {
                    if (value[0]) apiParams.date_from = dayjs(value[0]).format('YYYY-MM-DD');
                    if (value[1]) apiParams.date_to = dayjs(value[1]).format('YYYY-MM-DD');
                    return;
                }
                apiParams[key] = value;
            });
        }

        if (params.sorter) {
            apiParams.sort_by = params.sorter.field;
            apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
        }

        const res = await getDismissedTriggers(apiParams);
        const items = res?.data || [];
        const total = Number(res?.total ?? 0);
        return { data: items, total };
    }, []);

    /* ============================== Header Icon ============================== */

    const headerIcon = useMemo(() => (
        <svg viewBox="0 0 48 48" fill="none">
            <rect x="10" y="8" width="28" height="34" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M18 8V6a6 6 0 0 1 12 0v2" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M16 18l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="26" y1="18" x2="34" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M16 26l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="26" y1="26" x2="34" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="36" cy="38" r="7" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6" />
            <path d="M36 35v3l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        </svg>
    ), []);

    /* ============================== 详情 Drawer 内容 ============================== */

    const renderDetail = () => {
        if (!detail) return null;
        const isDismissed = detail.healing_status === 'dismissed';
        return (
            <>
                {/* 顶部状态横幅 */}
                <div style={{
                    padding: '12px 16px', marginBottom: 16,
                    background: isDismissed ? '#f5f5f5' : '#fffbe6',
                    border: isDismissed ? '1px solid #d9d9d9' : '1px solid #ffe58f',
                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    {isDismissed ? (
                        <StopOutlined style={{ color: '#8c8c8c' }} />
                    ) : (
                        <ClockCircleOutlined style={{ color: '#faad14' }} />
                    )}
                    <Text strong style={{ color: isDismissed ? '#8c8c8c' : '#d48806' }}>
                        {isDismissed ? '已忽略' : '待触发'}
                    </Text>
                    <div style={{ marginLeft: 'auto' }}>
                        {getSeverityTag(detail.severity)}
                    </div>
                </div>

                {/* 基本信息 */}
                <Descriptions
                    column={2}
                    size="small"
                    labelStyle={{ color: '#8c8c8c', width: 90 }}
                    style={{ marginBottom: 16 }}
                >
                    <Descriptions.Item label="工单标题" span={2}>
                        <Text strong>{detail.title}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="工单ID">
                        <Text code>{detail.external_id}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="等级">
                        {getSeverityTag(detail.severity)}
                    </Descriptions.Item>
                    <Descriptions.Item label="分类">
                        <Tag>{CATEGORY_LABELS[detail.category] || detail.category || '-'}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="优先级">
                        P{detail.priority || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="工单状态">
                        <Tag color="blue">{detail.status || '-'}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="自愈状态">
                        <Tag color={isDismissed ? 'default' : 'orange'}>
                            {isDismissed ? '已忽略' : (detail.healing_status || '-')}
                        </Tag>
                    </Descriptions.Item>
                </Descriptions>

                {/* 影响范围 */}
                <Descriptions
                    title="影响范围"
                    column={2}
                    size="small"
                    labelStyle={{ color: '#8c8c8c', width: 90 }}
                    style={{ marginBottom: 16 }}
                >
                    <Descriptions.Item label="影响CI">
                        <Text code>{detail.affected_ci || '-'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="影响服务">
                        {detail.affected_service || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="指派人">
                        {detail.assignee || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="报告人">
                        {detail.reporter || '-'}
                    </Descriptions.Item>
                </Descriptions>

                {/* 描述 */}
                {detail.description && (
                    <div style={{ marginBottom: 16 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>描述</Text>
                        <div style={{
                            padding: '8px 12px', marginTop: 4,
                            background: '#fafafa', border: '1px solid #f0f0f0',
                        }}>
                            {detail.description}
                        </div>
                    </div>
                )}

                {/* 来源信息 */}
                <Descriptions
                    title="来源信息"
                    column={2}
                    size="small"
                    labelStyle={{ color: '#8c8c8c', width: 90 }}
                    style={{ marginBottom: 16 }}
                >
                    <Descriptions.Item label="插件来源" span={2}>
                        {detail.source_plugin_name || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="创建时间">
                        {formatTime(detail.created_at)}
                    </Descriptions.Item>
                    <Descriptions.Item label="更新时间">
                        {formatTime(detail.updated_at)}
                    </Descriptions.Item>
                    {detail.matched_rule_id && (
                        <Descriptions.Item label="匹配规则" span={2}>
                            <Text code style={{ fontSize: 11 }}>{detail.matched_rule_id}</Text>
                        </Descriptions.Item>
                    )}
                </Descriptions>

                {/* 原始数据 */}
                {detail.raw_data && Object.keys(detail.raw_data).length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>原始数据</Text>
                        <pre style={{
                            padding: '8px 12px', marginTop: 4,
                            background: '#fafafa', border: '1px solid #f0f0f0',
                            fontSize: 12, overflow: 'auto', maxHeight: 200,
                        }}>
                            {JSON.stringify(detail.raw_data, null, 2)}
                        </pre>
                    </div>
                )}

                {/* 底部 ID */}
                <div style={{
                    padding: '8px 0', borderTop: '1px solid #f0f0f0',
                    display: 'flex', alignItems: 'center', gap: 4,
                }}>
                    <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
                        ID: {detail.id}
                    </Text>
                </div>
            </>
        );
    };

    /* ============================== Tab 配置 ============================== */

    const tabs = useMemo(() => [
        { key: 'pending', label: '待处理' },
        { key: 'dismissed', label: '已忽略' },
    ], []);

    const handleTabChange = useCallback((key: string) => {
        setActiveTab(key as 'pending' | 'dismissed');
    }, []);

    /* ============================== 渲染 ============================== */

    const isPending = activeTab === 'pending';

    return (
        <>
            <StandardTable<any>
                key={`triggers-${activeTab}-${refreshCountRef.current}`}
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                title={isPending ? '自愈审批' : '已忽略工单'}
                description={isPending
                    ? '查看待触发的自愈工单，确认后启动自愈流程。'
                    : '已忽略的自愈工单记录，这些工单不会执行自愈流程。'
                }
                headerIcon={headerIcon}
                searchFields={searchFields}
                advancedSearchFields={advancedSearchFields}
                columns={isPending ? pendingColumns : dismissedColumns}
                rowKey="id"
                onRowClick={openDetail}
                request={isPending ? handlePendingRequest : handleDismissedRequest}
                defaultPageSize={10}
                preferenceKey={isPending ? 'pending_triggers' : 'dismissed_triggers'}
            />

            {/* 详情抽屉 */}
            <Drawer
                title="工单详情"
                open={drawerOpen}
                onClose={closeDrawer}
                size={600}
                extra={detail && isPending ? (
                    <Space>
                        <Button
                            type="primary"
                            icon={<ThunderboltOutlined />}
                            disabled={!access.canTriggerHealing}
                            onClick={() => { closeDrawer(); handleTrigger(detail.id, detail.external_id); }}
                        >
                            启动自愈
                        </Button>
                        <Button
                            danger
                            icon={<StopOutlined />}
                            disabled={!access.canTriggerHealing}
                            onClick={() => { closeDrawer(); handleDismiss(detail.id, detail.external_id); }}
                        >
                            忽略
                        </Button>
                    </Space>
                ) : undefined}
            >
                {renderDetail()}
            </Drawer>
        </>
    );
};

export default PendingTriggers;

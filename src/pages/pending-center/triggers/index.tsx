import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Button, message, Tag, Modal, Drawer, Descriptions, Typography } from 'antd';
import {
    AlertOutlined, WarningOutlined, InfoCircleOutlined,
    CheckCircleOutlined, ClockCircleOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import StandardTable, { type StandardColumnDef, type SearchField } from '@/components/StandardTable';
import { getPendingTriggers, triggerHealing } from '@/services/auto-healing/healing';
import dayjs from 'dayjs';

const { Text } = Typography;

/* ============================== 常量 ============================== */

const SEVERITY_MAP: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    critical: { color: 'error', label: '严重', icon: <AlertOutlined /> },
    high: { color: 'warning', label: '高', icon: <WarningOutlined /> },
    medium: { color: 'processing', label: '中', icon: <InfoCircleOutlined /> },
    low: { color: 'default', label: '低', icon: <CheckCircleOutlined /> },
    '1': { color: 'error', label: '严重', icon: <AlertOutlined /> },
    '2': { color: 'warning', label: '高', icon: <WarningOutlined /> },
    '3': { color: 'processing', label: '中', icon: <InfoCircleOutlined /> },
    '4': { color: 'default', label: '低', icon: <CheckCircleOutlined /> },
};

const CATEGORY_LABELS: Record<string, string> = {
    network: '网络', application: '应用', database: '数据库',
    security: '安全', hardware: '硬件', storage: '存储',
};

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
    { key: 'search', label: '关键字', placeholder: '搜索标题/ID/CI' },
];

/* ============================== 组件 ============================== */

const PendingTriggers: React.FC = () => {
    const refreshCountRef = useRef(0);

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

    /* ------------ 触发操作 ------------ */
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
                    message.error('启动失败');
                }
            },
        });
    }, []);

    /* ============================== 列定义 ============================== */

    const columns: StandardColumnDef<any>[] = useMemo(() => [
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
            width: 100,
            fixedColumn: true,
            fixed: 'right',
            render: (_: any, record: any) => (
                <Button
                    type="primary"
                    size="small"
                    icon={<ThunderboltOutlined />}
                    onClick={() => handleTrigger(record.id, record.external_id)}
                >
                    启动
                </Button>
            ),
        },
    ], [handleTrigger]);

    /* ============================== 数据请求 ============================== */

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

        if (params.advancedSearch) {
            if (params.advancedSearch.search) {
                apiParams.search = params.advancedSearch.search;
            }
            if (params.advancedSearch.severity) {
                apiParams.severity = params.advancedSearch.severity;
            }
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
        return (
            <>
                {/* 顶部状态横幅 */}
                <div style={{
                    padding: '12px 16px', marginBottom: 16,
                    background: '#fffbe6', border: '1px solid #ffe58f',
                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    <ClockCircleOutlined style={{ color: '#faad14' }} />
                    <Text strong style={{ color: '#d48806' }}>待触发</Text>
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
                        <Tag color="orange">{detail.healing_status || '-'}</Tag>
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

    /* ============================== 渲染 ============================== */

    return (
        <>
            <StandardTable<any>
                key={`triggers-${refreshCountRef.current}`}
                tabs={[{ key: 'list', label: '待触发列表' }]}
                title="自愈审批"
                description="查看待触发的自愈工单，确认后启动自愈流程。"
                headerIcon={headerIcon}
                searchFields={searchFields}
                columns={columns}
                rowKey="id"
                onRowClick={openDetail}
                request={handleRequest}
                defaultPageSize={10}
                preferenceKey="pending_triggers"
            />

            {/* 详情抽屉 */}
            <Drawer
                title="工单详情"
                open={drawerOpen}
                onClose={closeDrawer}
                width={600}
                extra={detail ? (
                    <Button
                        type="primary"
                        icon={<ThunderboltOutlined />}
                        onClick={() => { closeDrawer(); handleTrigger(detail.id, detail.external_id); }}
                    >
                        启动自愈
                    </Button>
                ) : undefined}
            >
                {renderDetail()}
            </Drawer>
        </>
    );
};

export default PendingTriggers;

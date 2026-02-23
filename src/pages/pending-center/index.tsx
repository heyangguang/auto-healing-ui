import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useAccess } from '@umijs/max';
import { Button, message, Space, Tag, Modal, Input, Drawer, Descriptions, Typography } from 'antd';
import {
    AlertOutlined, WarningOutlined, InfoCircleOutlined,
    CheckCircleOutlined, ClockCircleOutlined, ThunderboltOutlined, StopOutlined,
} from '@ant-design/icons';
import StandardTable, { type StandardColumnDef, type SearchField } from '@/components/StandardTable';
import {
    getPendingTriggers, getPendingApprovals,
    triggerHealing, approveTask, rejectTask, dismissIncident,
} from '@/services/auto-healing/healing';
import { getSimpleUsers } from '@/services/auto-healing/users';
import dayjs from 'dayjs';
import { INCIDENT_SEVERITY_MAP, SEVERITY_TAG_COLORS, CATEGORY_LABELS } from '@/constants/incidentDicts';

const { Text } = Typography;

/* ============================== 常量 ============================== */

const TABS = [
    { key: 'triggers', label: '待触发工单' },
    { key: 'approvals', label: '待审批任务' },
];

/** 严重性图标映射（本地组装 JSX icon，数据来自集中化字典） */
const SEVERITY_ICON_MAP: Record<string, React.ReactNode> = {
    critical: <AlertOutlined />, high: <WarningOutlined />,
    medium: <InfoCircleOutlined />, low: <CheckCircleOutlined />,
    '1': <AlertOutlined />, '2': <WarningOutlined />,
    '3': <InfoCircleOutlined />, '4': <CheckCircleOutlined />,
};

/** 组合后的严重性配置（向后兼容原 SEVERITY_MAP 的用法） */
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

const triggerSearchFields: SearchField[] = [
    { key: 'title', label: '关键字', placeholder: '搜索标题/ID/CI' },
];

const approvalSearchFields: SearchField[] = [
    { key: 'node_name', label: '关键字', placeholder: '搜索节点名/流程ID' },
];

/* ============================== 组件 ============================== */

const PendingCenter: React.FC = () => {
    const access = useAccess();
    const [activeTab, setActiveTab] = useState('triggers');
    const refreshCountRef = useRef(0);

    /* ------------ 用户名映射 ------------ */
    const [userMap, setUserMap] = useState<Record<string, string>>({});
    useEffect(() => {
        getSimpleUsers().then((res) => {
            const map: Record<string, string> = {};
            (res?.data || []).forEach((u: any) => {
                map[u.id] = u.display_name || u.username || u.id;
            });
            setUserMap(map);
        }).catch(() => { });
    }, []);

    /** 将审批人UUID数组解析为用户名 */
    const resolveApprovers = useCallback((record: any): string => {
        const ids: string[] = record.approvers || [];
        if (ids.length === 0) return '-';
        const localMap = { ...userMap };
        if (record.initiator?.id) {
            localMap[record.initiator.id] = record.initiator.display_name || record.initiator.username || record.initiator.id;
        }
        return ids.map((id: string) => localMap[id] || id.substring(0, 8) + '...').join(', ');
    }, [userMap]);

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
                    setActiveTab(prev => prev);
                } catch {
                    message.error('启动失败');
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
                    setActiveTab(prev => prev);
                } catch {
                    message.error('忽略失败');
                }
            },
        });
    }, []);

    /* ------------ 审批操作 ------------ */
    const handleApprove = useCallback((id: string, nodeName: string) => {
        let comment = '';
        Modal.confirm({
            title: `批准任务: ${nodeName}`,
            content: (
                <div style={{ marginTop: 16 }}>
                    <Input.TextArea
                        placeholder="请输入审批意见（可选）"
                        onChange={(e) => { comment = e.target.value; }}
                    />
                </div>
            ),
            okText: '批准',
            cancelText: '取消',
            onOk: async () => {
                try {
                    await approveTask(id, { comment });
                    message.success('已批准');
                    refreshCountRef.current += 1;
                    setActiveTab(prev => prev);
                } catch {
                    message.error('操作失败');
                }
            },
        });
    }, []);

    const handleReject = useCallback((id: string, nodeName: string) => {
        let comment = '';
        Modal.confirm({
            title: `拒绝任务: ${nodeName}`,
            content: (
                <div style={{ marginTop: 16 }}>
                    <Input.TextArea
                        placeholder="请输入拒绝原因（必填）"
                        onChange={(e) => { comment = e.target.value; }}
                    />
                </div>
            ),
            okText: '拒绝',
            cancelText: '取消',
            okButtonProps: { danger: true },
            onOk: async () => {
                if (!comment.trim()) {
                    message.error('请输入拒绝原因');
                    return Promise.reject();
                }
                try {
                    await rejectTask(id, { comment });
                    message.success('已拒绝');
                    refreshCountRef.current += 1;
                    setActiveTab(prev => prev);
                } catch {
                    message.error('操作失败');
                }
            },
        });
    }, []);

    /* ============================== 列定义 ============================== */

    const triggerColumns: StandardColumnDef<any>[] = useMemo(() => [
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

    const approvalColumns: StandardColumnDef<any>[] = useMemo(() => [
        {
            columnKey: 'node_name',
            columnTitle: '节点名称',
            dataIndex: 'node_name',
            ellipsis: true,
            fixedColumn: true,
            render: (_: any, record: any) => record.node_name || '审批节点',
        },
        {
            columnKey: 'flow_instance_id',
            columnTitle: '流程实例',
            dataIndex: 'flow_instance_id',
            width: 200,
            render: (_: any, record: any) => (
                <Tag>FLOW-{record.flow_instance_id?.substring(0, 8)}</Tag>
            ),
        },
        {
            columnKey: 'status',
            columnTitle: '状态',
            dataIndex: 'status',
            width: 100,
            render: () => <Tag color="orange" icon={<ClockCircleOutlined />}>待审批</Tag>,
        },
        {
            columnKey: 'approvers',
            columnTitle: '审批人',
            dataIndex: 'approvers',
            width: 200,
            render: (_: any, record: any) => resolveApprovers(record),
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
            width: 160,
            fixedColumn: true,
            fixed: 'right',
            render: (_: any, record: any) => (
                <Space>
                    <Button
                        type="primary"
                        size="small"
                        disabled={!access.canApprove}
                        onClick={() => handleApprove(record.id, record.node_name || '节点')}
                    >
                        批准
                    </Button>
                    <Button
                        danger
                        size="small"
                        disabled={!access.canApprove}
                        onClick={() => handleReject(record.id, record.node_name || '节点')}
                    >
                        拒绝
                    </Button>
                </Space>
            ),
        },
    ], [handleApprove, handleReject, resolveApprovers]);

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
            if (params.advancedSearch.title) {
                apiParams.title = params.advancedSearch.title;
            }
            if (params.advancedSearch.node_name) {
                apiParams.node_name = params.advancedSearch.node_name;
            }
            if (params.advancedSearch.severity) {
                apiParams.severity = params.advancedSearch.severity;
            }
        }

        if (params.sorter) {
            apiParams.sort_by = params.sorter.field;
            apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
        }

        if (activeTab === 'triggers') {
            const res = await getPendingTriggers(apiParams);
            const items = res?.data || [];
            const total = Number(res?.total ?? 0);
            return { data: items, total };
        } else {
            const res = await getPendingApprovals(apiParams);
            const items = res?.data || [];
            const total = Number(res?.total ?? 0);
            return { data: items, total };
        }
    }, [activeTab]);

    /* ============================== Header Icon ============================== */

    const headerIcon = useMemo(() => (
        <svg viewBox="0 0 48 48" fill="none">
            <rect x="10" y="8" width="28" height="34" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M18 8V6a6 6 0 0 1 12 0v2" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M16 18l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="26" y1="18" x2="34" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M16 26l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="26" y1="26" x2="34" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="19" cy="34" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <line x1="26" y1="34" x2="34" y2="34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="36" cy="38" r="7" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6" />
            <path d="M36 35v3l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        </svg>
    ), []);

    /* ============================== 详情 Drawer 内容 ============================== */

    const renderTriggerDetail = () => {
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

    const renderApprovalDetail = () => {
        if (!detail) return null;
        return (
            <>
                {/* 顶部状态横幅 */}
                <div style={{
                    padding: '12px 16px', marginBottom: 16,
                    background: '#fff7e6', border: '1px solid #ffd591',
                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    <ClockCircleOutlined style={{ color: '#fa8c16' }} />
                    <Text strong style={{ color: '#d46b08' }}>待审批</Text>
                </div>

                {/* 基本信息 */}
                <Descriptions
                    column={2}
                    size="small"
                    labelStyle={{ color: '#8c8c8c', width: 90 }}
                    style={{ marginBottom: 16 }}
                >
                    <Descriptions.Item label="节点名称" span={2}>
                        <Text strong>{detail.node_name || '审批节点'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="流程实例" span={2}>
                        <Text code>{detail.flow_instance_id || '-'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">
                        <Tag color="orange" icon={<ClockCircleOutlined />}>待审批</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="审批人">
                        {resolveApprovers(detail)}
                    </Descriptions.Item>
                    <Descriptions.Item label="创建时间">
                        {formatTime(detail.created_at)}
                    </Descriptions.Item>
                    <Descriptions.Item label="更新时间">
                        {formatTime(detail.updated_at)}
                    </Descriptions.Item>
                </Descriptions>

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
                key={`${activeTab}-${refreshCountRef.current}`}
                tabs={TABS}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                title="待办中心"
                description={activeTab === 'triggers'
                    ? '查看待触发的自愈工单，确认后启动自愈流程。'
                    : '查看待审批的任务，执行批准或拒绝操作。'
                }
                headerIcon={headerIcon}
                searchFields={activeTab === 'triggers' ? triggerSearchFields : approvalSearchFields}
                columns={activeTab === 'triggers' ? triggerColumns : approvalColumns}
                rowKey="id"
                onRowClick={openDetail}
                request={handleRequest}
                defaultPageSize={10}
                preferenceKey={`pending_${activeTab}`}
            />

            {/* 详情抽屉 */}
            <Drawer
                title={activeTab === 'triggers' ? '工单详情' : '审批任务详情'}
                open={drawerOpen}
                onClose={closeDrawer}
                size={600}
                extra={activeTab === 'triggers' && detail ? (
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
                ) : activeTab === 'approvals' && detail ? (
                    <Space>
                        <Button
                            type="primary"
                            disabled={!access.canApprove}
                            onClick={() => { closeDrawer(); handleApprove(detail.id, detail.node_name || '节点'); }}
                        >
                            批准
                        </Button>
                        <Button
                            danger
                            disabled={!access.canApprove}
                            onClick={() => { closeDrawer(); handleReject(detail.id, detail.node_name || '节点'); }}
                        >
                            拒绝
                        </Button>
                    </Space>
                ) : undefined}
            >
                {activeTab === 'triggers' ? renderTriggerDetail() : renderApprovalDetail()}
            </Drawer>
        </>
    );
};

export default PendingCenter;

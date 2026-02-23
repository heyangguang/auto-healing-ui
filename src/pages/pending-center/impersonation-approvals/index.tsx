import React, { useState, useCallback, useMemo } from 'react';
import {
    Button, Space, message, Tag, Typography, Tooltip, Popconfirm, Modal, Input,
    Drawer, Descriptions,
} from 'antd';
import {
    CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
    UserSwitchOutlined, SafetyOutlined, StopOutlined,
    MinusCircleOutlined, EyeOutlined,
} from '@ant-design/icons';
import { useAccess } from '@umijs/max';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import StandardTable from '@/components/StandardTable';
import type { StandardColumnDef, SearchField, AdvancedSearchField } from '@/components/StandardTable';
import {
    listPendingImpersonation,
    listImpersonationHistory,
    approveImpersonation,
    rejectImpersonation,
    type ImpersonationRequest,
} from '@/services/auto-healing/platform/impersonation';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

/* ── 状态 Tag 映射 ── */
const STATUS_MAP: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    pending: { color: 'processing', label: '待审批', icon: <ClockCircleOutlined /> },
    approved: { color: 'cyan', label: '已批准', icon: <CheckCircleOutlined /> },
    rejected: { color: 'error', label: '已拒绝', icon: <CloseCircleOutlined /> },
    active: { color: 'success', label: '会话中', icon: <EyeOutlined /> },
    completed: { color: 'default', label: '已完成', icon: <CheckCircleOutlined /> },
    expired: { color: 'warning', label: '已过期', icon: <StopOutlined /> },
    cancelled: { color: 'default', label: '已撤销', icon: <MinusCircleOutlined /> },
};

const renderStatusTag = (status: string) => {
    const s = STATUS_MAP[status] || { color: 'default', label: status, icon: null };
    return <Tag color={s.color} icon={s.icon} style={{ margin: 0 }}>{s.label}</Tag>;
};

const formatTime = (t: string | null | undefined) => {
    if (!t) return '—';
    return dayjs(t).format('YYYY-MM-DD HH:mm:ss');
};

/* ── 搜索字段定义 ── */
const searchFields: SearchField[] = [
    { key: 'requester_name', label: '申请人', placeholder: '搜索申请人名称' },
    { key: 'reason', label: '申请原因', placeholder: '搜索申请原因' },
    {
        key: '__enum__status', label: '审批状态',
        description: '筛选审批请求状态',
        options: Object.entries(STATUS_MAP).map(([v, s]) => ({ label: s.label, value: v })),
    },
];

const advancedSearchFields: AdvancedSearchField[] = [
    { key: 'requester_name', label: '申请人', type: 'input', placeholder: '申请人名称' },
    { key: 'reason', label: '申请原因', type: 'input', placeholder: '申请原因关键字' },
    {
        key: 'status', label: '审批状态', type: 'select', placeholder: '全部状态',
        options: Object.entries(STATUS_MAP).map(([v, s]) => ({ label: s.label, value: v })),
    },
];

/* ── Header Icon ── */
const headerIcon = (
    <svg viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="16" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M36 24l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M28 28h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

/* ── 统计栏 ── */
const buildStatsBar = (total: number, pending: number) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '16px 24px', borderTop: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 20 }}>
            <SafetyOutlined style={{ fontSize: 22, color: '#1677ff', opacity: 0.75 }} />
            <div>
                <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{total}</div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>全部请求</div>
            </div>
        </div>
        <div style={{ width: 1, height: 32, background: '#f0f0f0', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px' }}>
            <ClockCircleOutlined style={{ fontSize: 22, color: '#fa8c16', opacity: 0.75 }} />
            <div>
                <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{pending}</div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>待审批</div>
            </div>
        </div>
    </div>
);

/* ===================================================
   租户级 Impersonation 审批页面
   =================================================== */
const ImpersonationApprovalsPage: React.FC = () => {
    const access = useAccess();
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectTarget, setRejectTarget] = useState<ImpersonationRequest | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [statsData, setStatsData] = useState({ total: 0, pending: 0 });
    const [activeTab, setActiveTab] = useState('pending');

    /* ── 详情抽屉 ── */
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [detail, setDetail] = useState<ImpersonationRequest | null>(null);

    const openDetail = useCallback((record: ImpersonationRequest) => {
        setDetail(record);
        setDrawerOpen(true);
    }, []);

    /* ── 审批通过 ── */
    const handleApprove = useCallback(async (record: ImpersonationRequest) => {
        setActionLoading(record.id);
        try {
            await approveImpersonation(record.id);
            message.success('已批准该请求');
            setDrawerOpen(false);
            setRefreshTrigger(prev => prev + 1);
        } catch (err: any) {
            message.error(err?.data?.message || '审批失败');
        } finally {
            setActionLoading(null);
        }
    }, []);

    /* ── 审批拒绝 ── */
    const openReject = useCallback((record: ImpersonationRequest) => {
        setRejectTarget(record);
        setRejectReason('');
        setRejectModalOpen(true);
    }, []);

    const handleReject = useCallback(async () => {
        if (!rejectTarget) return;
        setActionLoading(rejectTarget.id);
        try {
            await rejectImpersonation(rejectTarget.id);
            message.success('已拒绝该请求');
            setRejectModalOpen(false);
            setDrawerOpen(false);
            setRefreshTrigger(prev => prev + 1);
        } catch (err: any) {
            message.error(err?.data?.message || '拒绝失败');
        } finally {
            setActionLoading(null);
        }
    }, [rejectTarget]);

    /* ── 数据请求（待审批） ── */
    const handlePendingRequest = useCallback(async () => {
        const res = await listPendingImpersonation();
        const items = res?.data || [];
        const pending = items.filter(d => d.status === 'pending').length;
        setStatsData({ total: items.length, pending });
        return { data: items, total: items.length };
    }, []);

    /* ── 数据请求（审批记录）── */
    const handleHistoryRequest = useCallback(async (params: {
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
            Object.entries(params.advancedSearch).forEach(([key, value]) => {
                if (value === undefined || value === null || value === '') return;
                apiParams[key] = value;
            });
        }
        if (params.sorter) {
            apiParams.sort_by = params.sorter.field;
            apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
        }
        const res = await listImpersonationHistory(apiParams);
        return { data: res?.data || [], total: Number(res?.total) || 0 };
    }, []);

    /* ── 统计栏 ── */
    const statsBar = useMemo(() => buildStatsBar(statsData.total, statsData.pending), [statsData]);

    /* ── 待审批列定义 ── */
    const pendingColumns: StandardColumnDef<ImpersonationRequest>[] = useMemo(() => [
        {
            columnKey: 'requester_name',
            columnTitle: '申请人',
            dataIndex: 'requester_name',
            width: 120,
            render: (_: any, record: ImpersonationRequest) => (
                <Space size={4}>
                    <UserSwitchOutlined style={{ color: '#1677ff' }} />
                    <Text strong>{record.requester_name}</Text>
                </Space>
            ),
        },
        {
            columnKey: 'reason',
            columnTitle: '申请原因',
            dataIndex: 'reason',
            width: 180,
            ellipsis: true,
            render: (_: any, record: ImpersonationRequest) =>
                record.reason
                    ? <span>{record.reason}</span>
                    : <Text type="secondary">—</Text>,
        },
        {
            columnKey: 'duration_minutes',
            columnTitle: '时长',
            dataIndex: 'duration_minutes',
            width: 70,
            render: (_: any, record: ImpersonationRequest) =>
                record.duration_minutes >= 60 ? `${record.duration_minutes / 60}h` : `${record.duration_minutes}min`,
        },
        {
            columnKey: 'status',
            columnTitle: '状态',
            dataIndex: 'status',
            width: 90,
            render: (_: any, record: ImpersonationRequest) => renderStatusTag(record.status),
        },
        {
            columnKey: 'created_at',
            columnTitle: '申请时间',
            dataIndex: 'created_at',
            width: 150,
            render: (_: any, record: ImpersonationRequest) =>
                record.created_at ? dayjs(record.created_at).format('YYYY-MM-DD HH:mm') : '-',
        },
        {
            columnKey: 'action',
            columnTitle: '操作',
            dataIndex: 'id',
            width: 140,
            fixedColumn: true,
            fixed: 'right',
            render: (_: any, record: ImpersonationRequest) => {
                if (record.status !== 'pending') {
                    return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
                }
                if (!access.canApproveImpersonation) {
                    return (
                        <Space size={4}>
                            <Button type="primary" size="small" icon={<CheckCircleOutlined />} disabled>批准</Button>
                            <Button size="small" danger icon={<CloseCircleOutlined />} disabled>拒绝</Button>
                        </Space>
                    );
                }
                const isLoading = actionLoading === record.id;
                return (
                    <Space size={4}>
                        <Popconfirm
                            title="确定批准此访问请求？"
                            description={`${record.requester_name} 将获得 ${record.duration_minutes >= 60 ? record.duration_minutes / 60 + ' 小时' : record.duration_minutes + ' 分钟'}的访问权限`}
                            onConfirm={() => handleApprove(record)}
                        >
                            <Button
                                type="primary"
                                size="small"
                                icon={<CheckCircleOutlined />}
                                loading={isLoading}
                                onClick={(e) => e.stopPropagation()}
                            >
                                批准
                            </Button>
                        </Popconfirm>
                        <Button
                            size="small"
                            danger
                            icon={<CloseCircleOutlined />}
                            loading={isLoading}
                            onClick={(e) => { e.stopPropagation(); openReject(record); }}
                        >
                            拒绝
                        </Button>
                    </Space>
                );
            },
        },
    ], [actionLoading, handleApprove, openReject]);

    /* ── 审批记录列定义 ── */
    const historyColumns: StandardColumnDef<ImpersonationRequest>[] = useMemo(() => [
        {
            columnKey: 'requester_name',
            columnTitle: '申请人',
            dataIndex: 'requester_name',
            width: 120,
            render: (_: any, record: ImpersonationRequest) => (
                <Space size={4}>
                    <UserSwitchOutlined style={{ color: '#1677ff' }} />
                    <Text strong>{record.requester_name}</Text>
                </Space>
            ),
        },
        {
            columnKey: 'reason',
            columnTitle: '申请原因',
            dataIndex: 'reason',
            width: 150,
            ellipsis: true,
            render: (_: any, record: ImpersonationRequest) =>
                record.reason
                    ? <span>{record.reason}</span>
                    : <Text type="secondary">—</Text>,
        },
        {
            columnKey: 'duration_minutes',
            columnTitle: '时长',
            dataIndex: 'duration_minutes',
            width: 70,
            render: (_: any, record: ImpersonationRequest) =>
                record.duration_minutes >= 60 ? `${record.duration_minutes / 60}h` : `${record.duration_minutes}min`,
        },
        {
            columnKey: 'status',
            columnTitle: '状态',
            dataIndex: 'status',
            width: 90,
            headerFilters: Object.entries(STATUS_MAP).map(([v, s]) => ({ label: s.label, value: v })),
            render: (_: any, record: ImpersonationRequest) => renderStatusTag(record.status),
        },
        {
            columnKey: 'approver_name',
            columnTitle: '审批人',
            dataIndex: 'approver_name',
            width: 120,
            render: (_: any, record: ImpersonationRequest) =>
                record.approver_name || <Text type="secondary">—</Text>,
        },
        {
            columnKey: 'approved_at',
            columnTitle: '审批时间',
            dataIndex: 'approved_at',
            width: 150,
            sorter: true,
            render: (_: any, record: ImpersonationRequest) =>
                record.approved_at
                    ? dayjs(record.approved_at).format('YYYY-MM-DD HH:mm')
                    : <Text type="secondary">—</Text>,
        },
        {
            columnKey: 'created_at',
            columnTitle: '申请时间',
            dataIndex: 'created_at',
            width: 150,
            sorter: true,
            render: (_: any, record: ImpersonationRequest) =>
                record.created_at ? dayjs(record.created_at).format('YYYY-MM-DD HH:mm') : '-',
        },
    ], []);

    /* ── 详情抽屉内容 ── */
    const renderDetail = () => {
        if (!detail) return null;
        const s = STATUS_MAP[detail.status] || { color: 'default', label: detail.status, icon: null };
        return (
            <>
                {/* 顶部状态横幅 */}
                <div style={{
                    padding: '12px 16px', marginBottom: 16,
                    background: detail.status === 'pending' ? '#fff7e6' : detail.status === 'rejected' ? '#fff1f0' : '#f6ffed',
                    border: `1px solid ${detail.status === 'pending' ? '#ffd591' : detail.status === 'rejected' ? '#ffa39e' : '#b7eb8f'}`,
                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    {s.icon}
                    <Text strong style={{ color: detail.status === 'pending' ? '#d46b08' : detail.status === 'rejected' ? '#cf1322' : '#389e0d' }}>
                        {s.label}
                    </Text>
                </div>

                <Descriptions
                    column={2}
                    size="small"
                    labelStyle={{ color: '#8c8c8c', width: 90 }}
                    style={{ marginBottom: 16 }}
                >
                    <Descriptions.Item label="申请人" span={1}>
                        <Text strong>{detail.requester_name}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="访问时长" span={1}>
                        {detail.duration_minutes >= 60 ? `${detail.duration_minutes / 60} 小时` : `${detail.duration_minutes} 分钟`}
                    </Descriptions.Item>
                    <Descriptions.Item label="申请原因" span={2}>
                        {detail.reason || <Text type="secondary">未填写原因</Text>}
                    </Descriptions.Item>
                    <Descriptions.Item label="状态" span={1}>
                        {renderStatusTag(detail.status)}
                    </Descriptions.Item>
                    <Descriptions.Item label="审批人" span={1}>
                        {detail.approver_name || <Text type="secondary">—</Text>}
                    </Descriptions.Item>
                    <Descriptions.Item label="申请时间" span={1}>
                        {formatTime(detail.created_at)}
                    </Descriptions.Item>
                    <Descriptions.Item label="审批时间" span={1}>
                        {formatTime(detail.approved_at)}
                    </Descriptions.Item>
                    {detail.session_started_at && (
                        <Descriptions.Item label="会话开始" span={1}>
                            {formatTime(detail.session_started_at)}
                        </Descriptions.Item>
                    )}
                    {detail.session_expires_at && (
                        <Descriptions.Item label="会话到期" span={1}>
                            {formatTime(detail.session_expires_at)}
                        </Descriptions.Item>
                    )}
                    {detail.completed_at && (
                        <Descriptions.Item label="完成时间" span={2}>
                            {formatTime(detail.completed_at)}
                        </Descriptions.Item>
                    )}
                </Descriptions>

                {/* 底部 ID */}
                <div style={{ padding: '8px 0', borderTop: '1px solid #f0f0f0' }}>
                    <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
                        ID: {detail.id}
                    </Text>
                </div>
            </>
        );
    };

    return (
        <>
            <StandardTable<ImpersonationRequest>
                key={activeTab}
                tabs={[
                    { key: 'pending', label: '访问审批' },
                    { key: 'history', label: '审批记录' },
                ]}
                activeTab={activeTab}
                onTabChange={(key) => setActiveTab(key)}
                title="访问审批"
                description="审批来自平台管理员的租户访问（Impersonation）请求。批准后管理员可在有限时间内以审计模式查看租户数据。"
                headerIcon={headerIcon}
                headerExtra={statsBar}
                searchFields={searchFields}
                advancedSearchFields={advancedSearchFields}
                columns={activeTab === 'history' ? historyColumns : pendingColumns}
                rowKey="id"
                onRowClick={openDetail}
                request={activeTab === 'history' ? handleHistoryRequest : handlePendingRequest}
                defaultPageSize={20}
                preferenceKey={`system_impersonation_${activeTab}`}
                refreshTrigger={refreshTrigger}
            />

            {/* ── 详情抽屉 ── */}
            <Drawer
                title="访问请求详情"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                width={520}
                extra={detail?.status === 'pending' && access.canApproveImpersonation ? (
                    <Space>
                        <Popconfirm
                            title="确定批准此访问请求？"
                            onConfirm={() => detail && handleApprove(detail)}
                        >
                            <Button type="primary" icon={<CheckCircleOutlined />}>批准</Button>
                        </Popconfirm>
                        <Button danger icon={<CloseCircleOutlined />} onClick={() => detail && openReject(detail)}>拒绝</Button>
                    </Space>
                ) : undefined}
            >
                {renderDetail()}
            </Drawer>

            {/* ── 拒绝确认弹窗 ── */}
            <Modal
                title="拒绝访问请求"
                open={rejectModalOpen}
                onCancel={() => setRejectModalOpen(false)}
                onOk={handleReject}
                confirmLoading={actionLoading === rejectTarget?.id}
                okText="确认拒绝"
                okButtonProps={{ danger: true }}
                cancelText="取消"
                width={420}
                destroyOnHidden
            >
                <div style={{ marginBottom: 12 }}>
                    <Text>确定拒绝 <Text strong>{rejectTarget?.requester_name}</Text> 的访问请求？</Text>
                </div>
                <Input.TextArea
                    rows={3}
                    placeholder="拒绝原因（可选）"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                />
            </Modal>
        </>
    );
};

export default ImpersonationApprovalsPage;

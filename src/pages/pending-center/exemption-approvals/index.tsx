import React, { useState, useCallback, useMemo } from 'react';
import {
    Button, Space, message, Tag, Typography, Popconfirm, Modal, Input,
    Drawer,
} from 'antd';
import {
    CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
    SafetyCertificateOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useAccess } from '@umijs/max';
import dayjs from 'dayjs';
import StandardTable from '@/components/StandardTable';
import type { StandardColumnDef, SearchField, AdvancedSearchField } from '@/components/StandardTable';
import {
    getBlacklistExemptions,
    getPendingExemptions,
    approveBlacklistExemption,
    rejectBlacklistExemption,
} from '@/services/auto-healing/blacklistExemption';
import { extractErrorMsg } from '@/utils/errorMsg';

const { Text } = Typography;

/* ── 状态映射 ── */
const STATUS_MAP: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    pending: { color: 'processing', label: '待审批', icon: <ClockCircleOutlined /> },
    approved: { color: 'success', label: '已批准', icon: <CheckCircleOutlined /> },
    rejected: { color: 'error', label: '已拒绝', icon: <CloseCircleOutlined /> },
    expired: { color: 'warning', label: '已过期', icon: <ExclamationCircleOutlined /> },
};

const SEVERITY_COLORS: Record<string, string> = {
    critical: 'red', high: 'orange', medium: 'gold',
};

const renderStatusTag = (status: string) => {
    const s = STATUS_MAP[status] || { color: 'default', label: status, icon: null };
    return <Tag color={s.color} icon={s.icon} style={{ margin: 0 }}>{s.label}</Tag>;
};

const formatTime = (t: string | null | undefined) => {
    if (!t) return '—';
    return dayjs(t).format('YYYY-MM-DD HH:mm');
};

/* ── 搜索字段 ── */
const searchFields: SearchField[] = [
    { key: 'task_name', label: '任务模板', placeholder: '搜索任务模板名称' },
    { key: 'rule_name', label: '豁免规则', placeholder: '搜索规则名称' },
    {
        key: '__enum__status', label: '状态',
        options: Object.entries(STATUS_MAP).map(([v, s]) => ({ label: s.label, value: v })),
    },
];

const advancedSearchFields: AdvancedSearchField[] = [
    { key: 'task_name', label: '任务模板', type: 'input', placeholder: '任务模板名称' },
    { key: 'rule_name', label: '豁免规则', type: 'input', placeholder: '规则名称' },
    { key: 'requester_name', label: '申请人', type: 'input', placeholder: '申请人名称' },
    {
        key: 'status', label: '状态', type: 'select', placeholder: '全部状态',
        options: Object.entries(STATUS_MAP).map(([v, s]) => ({ label: s.label, value: v })),
    },
];

/* ── Header Icon ── */
const headerIcon = (
    <svg viewBox="0 0 48 48" fill="none">
        <rect x="6" y="10" width="26" height="32" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M12 20h14M12 26h10M12 32h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="36" cy="16" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M36 12v4l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M34 36l-3 3 1 1 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
);

/* ── 统计栏 ── */
const buildStatsBar = (total: number, pending: number) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '16px 24px', borderTop: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 20 }}>
            <SafetyCertificateOutlined style={{ fontSize: 22, color: '#1677ff', opacity: 0.75 }} />
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
   豁免审批页 — 参照 impersonation-approvals 标准模式
   =================================================== */
const ExemptionApprovalsPage: React.FC = () => {
    const access = useAccess();
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectTarget, setRejectTarget] = useState<any>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [statsData, setStatsData] = useState({ total: 0, pending: 0 });
    const [activeTab, setActiveTab] = useState('pending');

    /* ── 详情抽屉 ── */
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [detail, setDetail] = useState<any>(null);

    const openDetail = useCallback((record: any) => {
        setDetail(record);
        setDrawerOpen(true);
    }, []);

    /* ── 审批通过 ── */
    const handleApprove = useCallback(async (record: any) => {
        setActionLoading(record.id);
        try {
            await approveBlacklistExemption(record.id);
            message.success('已批准该豁免申请');
            setDrawerOpen(false);
            setRefreshTrigger(prev => prev + 1);
        } catch {
            /* 全局 errorHandler 已显示错误 */
        } finally {
            setActionLoading(null);
        }
    }, []);

    /* ── 审批拒绝 ── */
    const openReject = useCallback((record: any) => {
        setRejectTarget(record);
        setRejectReason('');
        setRejectModalOpen(true);
    }, []);

    const handleReject = useCallback(async () => {
        if (!rejectTarget) return;
        setActionLoading(rejectTarget.id);
        try {
            await rejectBlacklistExemption(rejectTarget.id, rejectReason);
            message.success('已拒绝该豁免申请');
            setRejectModalOpen(false);
            setDrawerOpen(false);
            setRefreshTrigger(prev => prev + 1);
        } catch {
            /* 全局 errorHandler 已显示错误 */
        } finally {
            setActionLoading(null);
        }
    }, [rejectTarget, rejectReason]);

    /* ── 数据请求（待审批）── */
    const handlePendingRequest = useCallback(async () => {
        const res = await getPendingExemptions({ page: 1, page_size: 100 });
        const items = res?.data || [];
        const pending = items.filter((d: any) => d.status === 'pending').length;
        setStatsData({ total: items.length, pending });
        return { data: items, total: items.length };
    }, []);

    /* ── 数据请求（审批记录）── */
    const handleHistoryRequest = useCallback(async (params: {
        page: number;
        pageSize: number;
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
        const res = await getBlacklistExemptions(apiParams);
        return { data: res?.data || [], total: Number(res?.total) || 0 };
    }, []);

    /* ── 统计栏 ── */
    const statsBar = useMemo(() => buildStatsBar(statsData.total, statsData.pending), [statsData]);

    /* ── 待审批列 ── */
    const pendingColumns: StandardColumnDef<any>[] = useMemo(() => [
        {
            columnKey: 'task_name', columnTitle: '任务模板', dataIndex: 'task_name',
            width: 140, ellipsis: true,
        },
        {
            columnKey: 'rule_name', columnTitle: '豁免规则', dataIndex: 'rule_name',
            width: 120, ellipsis: true,
        },
        {
            columnKey: 'rule_severity', columnTitle: '级别', dataIndex: 'rule_severity', width: 68,
            render: (_: any, r: any) => (
                <Tag color={SEVERITY_COLORS[r.rule_severity] || 'default'} style={{ margin: 0 }}>{r.rule_severity}</Tag>
            ),
        },
        {
            columnKey: 'requester_name', columnTitle: '申请人', dataIndex: 'requester_name', width: 72, ellipsis: true,
            render: (_: any, r: any) => <Text strong>{r.requester_name}</Text>,
        },
        {
            columnKey: 'validity_days', columnTitle: '有效期', dataIndex: 'validity_days', width: 65,
            render: (_: any, r: any) => `${r.validity_days} 天`,
        },
        {
            columnKey: 'created_at', columnTitle: '申请时间', dataIndex: 'created_at', width: 140,
            render: (_: any, r: any) => formatTime(r.created_at),
        },
        {
            columnKey: 'action', columnTitle: '操作', dataIndex: 'id', width: 120,
            render: (_: any, record: any) => {
                if (record.status !== 'pending') {
                    return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
                }
                if (!access.canApproveExemption) {
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
                            title="确定批准此豁免申请？"
                            description={`${record.requester_name} 将获得 ${record.validity_days} 天的豁免权限`}
                            onConfirm={() => handleApprove(record)}
                        >
                            <Button
                                type="primary" size="small" icon={<CheckCircleOutlined />}
                                loading={isLoading}
                                onClick={(e) => e.stopPropagation()}
                            >
                                批准
                            </Button>
                        </Popconfirm>
                        <Button
                            size="small" danger icon={<CloseCircleOutlined />}
                            loading={isLoading}
                            onClick={(e) => { e.stopPropagation(); openReject(record); }}
                        >
                            拒绝
                        </Button>
                    </Space>
                );
            },
        },
    ], [actionLoading, handleApprove, openReject, access.canApproveExemption]);

    /* ── 审批记录列 ── */
    const historyColumns: StandardColumnDef<any>[] = useMemo(() => [
        {
            columnKey: 'task_name', columnTitle: '任务模板', dataIndex: 'task_name',
            width: 140, ellipsis: true,
        },
        {
            columnKey: 'rule_name', columnTitle: '豁免规则', dataIndex: 'rule_name',
            width: 120, ellipsis: true,
        },
        {
            columnKey: 'rule_severity', columnTitle: '级别', dataIndex: 'rule_severity', width: 68,
            render: (_: any, r: any) => (
                <Tag color={SEVERITY_COLORS[r.rule_severity] || 'default'} style={{ margin: 0 }}>{r.rule_severity}</Tag>
            ),
        },
        {
            columnKey: 'requester_name', columnTitle: '申请人', dataIndex: 'requester_name', width: 72, ellipsis: true,
        },
        {
            columnKey: 'status', columnTitle: '状态', dataIndex: 'status', width: 80,
            headerFilters: Object.entries(STATUS_MAP).map(([v, s]) => ({ label: s.label, value: v })),
            render: (_: any, r: any) => renderStatusTag(r.status),
        },
        {
            columnKey: 'approver_name', columnTitle: '审批人', dataIndex: 'approver_name', width: 90, ellipsis: true,
            render: (_: any, r: any) => r.approver_name || <Text type="secondary">—</Text>,
        },
        {
            columnKey: 'approved_at', columnTitle: '审批时间', dataIndex: 'approved_at', width: 140,
            sorter: true,
            render: (_: any, r: any) => r.approved_at ? formatTime(r.approved_at) : <Text type="secondary">—</Text>,
        },
        {
            columnKey: 'created_at', columnTitle: '申请时间', dataIndex: 'created_at', width: 140,
            sorter: true,
            render: (_: any, r: any) => formatTime(r.created_at),
        },
    ], []);

    /* ── 详情抽屉内容 ── */
    const renderDetail = () => {
        if (!detail) return null;
        const s = STATUS_MAP[detail.status] || { color: 'default', label: detail.status, icon: null };
        const statusBg = detail.status === 'approved' ? '#f6ffed'
            : detail.status === 'rejected' ? '#fff1f0'
                : detail.status === 'expired' ? '#fffbe6' : '#e6f7ff';
        const statusBorder = detail.status === 'approved' ? '#b7eb8f'
            : detail.status === 'rejected' ? '#ffa39e'
                : detail.status === 'expired' ? '#ffe58f' : '#91caff';
        const statusColor = detail.status === 'approved' ? '#389e0d'
            : detail.status === 'rejected' ? '#cf1322'
                : detail.status === 'expired' ? '#d46b08' : '#1677ff';

        const labelStyle: React.CSSProperties = { fontSize: 12, color: '#8c8c8c', marginBottom: 4 };
        const valueStyle: React.CSSProperties = { fontSize: 13, color: '#262626' };

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* ── 状态横幅 ── */}
                <div style={{
                    padding: '14px 16px', background: statusBg, border: `1px solid ${statusBorder}`,
                    display: 'flex', alignItems: 'center', gap: 10,
                }}>
                    <span style={{ fontSize: 18, color: statusColor }}>{s.icon}</span>
                    <div>
                        <Text strong style={{ fontSize: 15, color: statusColor }}>{s.label}</Text>
                        {detail.expires_at && detail.status === 'approved' && (
                            <Text type="secondary" style={{ fontSize: 12, marginLeft: 12 }}>
                                到期 {formatTime(detail.expires_at)}
                            </Text>
                        )}
                    </div>
                </div>

                {/* ── 申请信息 ── */}
                <div style={{ background: '#fafafa', padding: '16px 20px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#262626', marginBottom: 14, paddingBottom: 8, borderBottom: '1px dashed #e8e8e8' }}>
                        申请信息
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <div style={labelStyle}>任务模板</div>
                            <Text strong style={{ fontSize: 14 }}>{detail.task_name}</Text>
                        </div>
                        <div>
                            <div style={labelStyle}>豁免规则</div>
                            <Space size={6}>
                                <Text style={valueStyle}>{detail.rule_name}</Text>
                                <Tag color={SEVERITY_COLORS[detail.rule_severity]} style={{ margin: 0, fontSize: 11 }}>
                                    {detail.rule_severity}
                                </Tag>
                            </Space>
                        </div>
                        <div>
                            <div style={labelStyle}>匹配模式</div>
                            <Text code style={{ fontSize: 12, color: '#cf1322' }}>{detail.rule_pattern}</Text>
                        </div>
                        <div>
                            <div style={labelStyle}>申请人</div>
                            <Text style={valueStyle}>{detail.requester_name}</Text>
                        </div>
                        <div>
                            <div style={labelStyle}>有效期</div>
                            <Text style={valueStyle}>{detail.validity_days} 天</Text>
                        </div>
                        <div>
                            <div style={labelStyle}>申请时间</div>
                            <Text style={valueStyle}>{formatTime(detail.created_at)}</Text>
                        </div>
                    </div>
                </div>

                {/* ── 豁免原因 ── */}
                <div style={{ background: '#fafafa', padding: '16px 20px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#262626', marginBottom: 10, paddingBottom: 8, borderBottom: '1px dashed #e8e8e8' }}>
                        豁免原因
                    </div>
                    <div style={{
                        padding: '12px 16px', background: '#fff', border: '1px solid #f0f0f0',
                        fontSize: 13, lineHeight: 1.7, color: '#434343', whiteSpace: 'pre-wrap',
                    }}>
                        {detail.reason || '—'}
                    </div>
                </div>

                {/* ── 审批信息 ── */}
                {detail.status !== 'pending' && (
                    <div style={{ background: '#fafafa', padding: '16px 20px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#262626', marginBottom: 14, paddingBottom: 8, borderBottom: '1px dashed #e8e8e8' }}>
                            审批信息
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
                            <div>
                                <div style={labelStyle}>审批人</div>
                                <Text style={valueStyle}>{detail.approver_name || '—'}</Text>
                            </div>
                            <div>
                                <div style={labelStyle}>审批时间</div>
                                <Text style={valueStyle}>{formatTime(detail.approved_at)}</Text>
                            </div>
                            {detail.expires_at && (
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <div style={labelStyle}>到期时间</div>
                                    <Text style={valueStyle}>{formatTime(detail.expires_at)}</Text>
                                </div>
                            )}
                            {detail.reject_reason && (
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <div style={labelStyle}>拒绝原因</div>
                                    <div style={{
                                        padding: '10px 14px', background: '#fff1f0', border: '1px solid #ffccc7',
                                        fontSize: 13, color: '#cf1322', whiteSpace: 'pre-wrap',
                                    }}>
                                        {detail.reject_reason}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── 底部 ID ── */}
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 11, fontFamily: 'SFMono-Regular, Consolas, monospace' }}>
                        ID: {detail.id}
                    </Text>
                </div>
            </div>
        );
    };

    return (
        <>
            <StandardTable<any>
                key={activeTab}
                tabs={[
                    { key: 'pending', label: '豁免审批' },
                    { key: 'history', label: '审批记录' },
                ]}
                activeTab={activeTab}
                onTabChange={(key) => setActiveTab(key)}
                title="豁免审批"
                description="审批安全豁免申请。批准后对应任务模板执行时将跳过已豁免的高危指令规则。"
                headerIcon={headerIcon}
                headerExtra={statsBar}
                searchFields={searchFields}
                advancedSearchFields={advancedSearchFields}
                columns={activeTab === 'history' ? historyColumns : pendingColumns}
                rowKey="id"
                onRowClick={openDetail}
                request={activeTab === 'history' ? handleHistoryRequest : handlePendingRequest}
                defaultPageSize={20}
                preferenceKey={`security_exemption_${activeTab}`}
                refreshTrigger={refreshTrigger}
            />

            {/* ── 详情抽屉 ── */}
            <Drawer
                title="豁免申请详情"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                width={560}
                extra={detail?.status === 'pending' && access.canApproveExemption ? (
                    <Space>
                        <Popconfirm
                            title="确定批准此豁免申请？"
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
                title="拒绝豁免申请"
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
                    <Text>确定拒绝 <Text strong>{rejectTarget?.requester_name}</Text> 对 <Text code>{rejectTarget?.rule_name}</Text> 的豁免申请？</Text>
                </div>
                <Input.TextArea
                    rows={3}
                    placeholder="拒绝原因（必填）"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                />
            </Modal>
        </>
    );
};

export default ExemptionApprovalsPage;

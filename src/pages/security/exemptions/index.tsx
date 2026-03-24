import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { history, useAccess } from '@umijs/max';
import { Tag, Drawer, Typography, Space } from 'antd';
import {
    PlusOutlined, SafetyCertificateOutlined, ClockCircleOutlined,
    CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import StandardTable, { type StandardColumnDef, type SearchField, type AdvancedSearchField } from '@/components/StandardTable';
import { getBlacklistExemptions } from '@/services/auto-healing/blacklistExemption';
import dayjs from 'dayjs';

const { Text } = Typography;

const STATUS_MAP: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    pending: { color: 'processing', label: '待审批', icon: <ClockCircleOutlined /> },
    approved: { color: 'success', label: '已批准', icon: <CheckCircleOutlined /> },
    rejected: { color: 'error', label: '已拒绝', icon: <CloseCircleOutlined /> },
    expired: { color: 'warning', label: '已过期', icon: <ExclamationCircleOutlined /> },
};

const SEVERITY_COLORS: Record<string, string> = {
    critical: 'red', high: 'orange', medium: 'gold',
};

const formatTime = (t?: string | null) => t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-';

const searchFields: SearchField[] = [
    { key: 'search', label: '关键字', placeholder: '搜索任务或规则' },
];

const advancedSearchFields: AdvancedSearchField[] = [
    {
        key: 'status', label: '状态', type: 'select', placeholder: '全部状态',
        options: Object.entries(STATUS_MAP).map(([value, item]) => ({ label: item.label, value })),
    },
];

/* ============================== SVG Header ============================== */
const headerIcon = (
    <svg viewBox="0 0 48 48" fill="none">
        <rect x="6" y="10" width="26" height="32" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M12 20h14M12 26h10M12 32h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="36" cy="16" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M36 12v4l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M34 36l-3 3 1 1 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
);

/* ============================== 统计栏 ============================== */
const buildStatsBar = (total: number, pending: number, approved: number) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '16px 24px', borderTop: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 20 }}>
            <SafetyCertificateOutlined style={{ fontSize: 22, color: '#1677ff', opacity: 0.75 }} />
            <div>
                <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{total}</div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>全部豁免</div>
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
        <div style={{ width: 1, height: 32, background: '#f0f0f0', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px' }}>
            <CheckCircleOutlined style={{ fontSize: 22, color: '#52c41a', opacity: 0.75 }} />
            <div>
                <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{approved}</div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>生效中</div>
            </div>
        </div>
    </div>
);

/* ============================== Component ============================== */
const ExemptionListPage: React.FC = () => {
    const access = useAccess();
    const [refreshKey, setRefreshKey] = useState(0);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [detail, setDetail] = useState<any>(null);
    const [statsData, setStatsData] = useState({ total: 0, pending: 0, approved: 0 });

    useEffect(() => {
        void (async () => {
            try {
                const [allRes, pendingRes, approvedRes] = await Promise.all([
                    getBlacklistExemptions({ page: 1, page_size: 1 }),
                    getBlacklistExemptions({ page: 1, page_size: 1, status: 'pending' }),
                    getBlacklistExemptions({ page: 1, page_size: 1, status: 'approved' }),
                ]);
                setStatsData({
                    total: Number(allRes?.total ?? 0),
                    pending: Number(pendingRes?.total ?? 0),
                    approved: Number(approvedRes?.total ?? 0),
                });
            } catch {
                // ignore
            }
        })();
    }, [refreshKey]);

    /* ---------- Stats bar ---------- */
    const statsBar = useMemo(() => buildStatsBar(statsData.total, statsData.pending, statsData.approved), [statsData]);

    /* ---------- Columns ---------- */
    const columns: StandardColumnDef<any>[] = useMemo(() => [
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
            render: (_: any, r: any) => <Tag color={SEVERITY_COLORS[r.rule_severity] || 'default'}>{r.rule_severity}</Tag>,
        },
        {
            columnKey: 'requester_name', columnTitle: '申请人', dataIndex: 'requester_name', width: 72, ellipsis: true,
        },
        {
            columnKey: 'status', columnTitle: '状态', dataIndex: 'status', width: 80,
            render: (_: any, r: any) => {
                const s = STATUS_MAP[r.status];
                return s ? <Tag color={s.color} icon={s.icon} style={{ margin: 0 }}>{s.label}</Tag> : <Tag>{r.status}</Tag>;
            },
            headerFilters: [
                { label: '待审批', value: 'pending' },
                { label: '已批准', value: 'approved' },
                { label: '已拒绝', value: 'rejected' },
                { label: '已过期', value: 'expired' },
            ],
        },
        {
            columnKey: 'validity_days', columnTitle: '有效期', dataIndex: 'validity_days', width: 65,
            render: (_: any, r: any) => `${r.validity_days} 天`,
        },
        {
            columnKey: 'expires_at', columnTitle: '到期时间', dataIndex: 'expires_at', width: 140,
            render: (_: any, r: any) => r.expires_at ? formatTime(r.expires_at) : '-',
        },
        {
            columnKey: 'created_at', columnTitle: '申请时间', dataIndex: 'created_at', width: 140,
            sorter: true,
            render: (_: any, r: any) => formatTime(r.created_at),
        },
    ], []);

    /* ---------- Data request ---------- */
    const handleRequest = useCallback(async (params: any) => {
        const apiParams: Record<string, any> = {
            page: params.page,
            page_size: params.pageSize,
        };
        if (params.advancedSearch) {
            const adv = params.advancedSearch as Record<string, any>;
            const normalized: Record<string, any> = {};
            Object.entries(adv).forEach(([key, value]) => {
                if (value === undefined || value === null || value === '') return;
                // StandardTable dateRange passes [dayjs, dayjs]; serialize to plain date strings for query params.
                if (Array.isArray(value) && value.length === 2) {
                    const [from, to] = value;
                    if (!from && !to) return;
                    const fmt = (v: any) => (dayjs.isDayjs(v) ? v.format('YYYY-MM-DD') : v);
                    normalized[key] = [from ? fmt(from) : undefined, to ? fmt(to) : undefined];
                    return;
                }
                if (dayjs.isDayjs(value)) {
                    normalized[key] = value.format('YYYY-MM-DD');
                    return;
                }
                normalized[key] = value;
            });
            Object.assign(apiParams, normalized);
        }
        if (params.sorter) {
            apiParams.sort_by = params.sorter.field;
            apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
        }
        const res = await getBlacklistExemptions(apiParams);
        const items = res?.data || [];
        const total = Number(res?.total ?? 0);
        return { data: items, total };
    }, []);

    /* ---------- Drawer ---------- */
    const openDetail = useCallback((record: any) => {
        setDetail(record);
        setDrawerOpen(true);
    }, []);

    /* ---------- Render ---------- */
    return (
        <>
            <StandardTable<any>
                key={refreshKey}
                title="安全豁免"
                description="管理针对高危指令黑名单规则的豁免申请。提交后需管理员审批方可生效。"
                headerIcon={headerIcon}
                headerExtra={statsBar}
                searchFields={searchFields}
                advancedSearchFields={advancedSearchFields}
                columns={columns}
                rowKey="id"
                onRowClick={openDetail}
                request={handleRequest}
                defaultPageSize={16}
                preferenceKey="security_exemptions"
                primaryActionLabel="申请豁免"
                primaryActionIcon={<PlusOutlined />}
                primaryActionDisabled={!access.canCreateExemption}
                onPrimaryAction={() => history.push('/security/exemptions/create')}
            />

            <Drawer
                title="豁免详情"
                open={drawerOpen}
                onClose={() => { setDrawerOpen(false); setDetail(null); }}
                width={560}
            >
                {detail && (() => {
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

                            {/* ── 基本信息 ── */}
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
                })()}
            </Drawer>
        </>
    );
};

export default ExemptionListPage;

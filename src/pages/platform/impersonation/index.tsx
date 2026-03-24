import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    Button, Space, message, Tag, Modal, Form, Select, Input,
    Typography, Tooltip, Popconfirm,
} from 'antd';
import {
    PlusOutlined, EyeOutlined, LogoutOutlined, CloseCircleOutlined,
    CheckCircleOutlined, ClockCircleOutlined, StopOutlined,
    SafetyOutlined, FileTextOutlined, SyncOutlined,
} from '@ant-design/icons';
import { useAccess } from '@umijs/max';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import StandardTable from '@/components/StandardTable';
import type { StandardColumnDef, SearchField, AdvancedSearchField } from '@/components/StandardTable';
import {
    createImpersonationRequest,
    listMyImpersonationRequests,
    enterTenant,
    exitTenant,
    terminateSession,
    cancelImpersonationRequest,
    type ImpersonationRequest,
} from '@/services/auto-healing/platform/impersonation';
import { getTenants } from '@/services/auto-healing/platform/tenants';
import { saveImpersonationState, clearImpersonationState } from '@/store/impersonation';
import { extractErrorMsg } from '@/utils/errorMsg';
import { fetchAllPages } from '@/utils/fetchAllPages';
import '../../system/audit-logs/index.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

/* ── 状态 Tag 映射 ── */
const STATUS_MAP: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    pending: { color: 'processing', label: '待审批', icon: <ClockCircleOutlined /> },
    approved: { color: 'cyan', label: '已批准', icon: <CheckCircleOutlined /> },
    rejected: { color: 'error', label: '已拒绝', icon: <CloseCircleOutlined /> },
    active: { color: 'success', label: '进行中', icon: <EyeOutlined /> },
    completed: { color: 'default', label: '已完成', icon: <CheckCircleOutlined /> },
    expired: { color: 'warning', label: '已过期', icon: <ClockCircleOutlined /> },
    cancelled: { color: 'default', label: '已撤销', icon: <StopOutlined /> },
};

/* ── 时长选项 ── */
const DURATION_OPTIONS = [
    { value: 30, label: '30 分钟' },
    { value: 60, label: '1 小时' },
    { value: 120, label: '2 小时' },
    { value: 240, label: '4 小时' },
];

/* ── 搜索字段 ── */
const searchFields: SearchField[] = [
    { key: 'requester_name', label: '申请人' },
];
const advancedSearchFields: AdvancedSearchField[] = [
    { key: 'tenant_name', label: '租户名', type: 'input', placeholder: '租户名称' },
    { key: 'reason', label: '申请原因', type: 'input', placeholder: '申请原因' },
    {
        key: 'status', label: '会话状态', type: 'select', placeholder: '全部状态',
        options: Object.entries(STATUS_MAP).map(([v, s]) => ({ label: s.label, value: v })),
    },
];

/* ── Header Icon ── */
const headerIcon = (
    <svg viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="16" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M32 10l6-6m0 0h-5m5 0v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

/* ===================================================
   主页面
   =================================================== */
const ImpersonationPage: React.FC = () => {
    const access = useAccess();
    const [modalOpen, setModalOpen] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [form] = Form.useForm();

    /* ── 打开申请弹窗 ── */
    const openModal = useCallback(async () => {
        setModalOpen(true);
        try {
            const list = await fetchAllPages<any>((page, pageSize) => getTenants({ page, page_size: pageSize }));
            setTenants(list.map((t: any) => ({ id: t.id, name: t.name })));
        } catch { /* 全局 errorHandler 已显示错误 */ }
    }, [refreshTrigger]);

    /* ── 提交申请 ── */
    const handleSubmit = useCallback(async () => {
        try {
            const values = await form.validateFields();
            setSubmitLoading(true);
            await createImpersonationRequest({
                tenant_id: values.tenant_id,
                reason: values.reason,
                duration_minutes: values.duration_minutes,
            });
            message.success('申请已提交，等待租户管理员审批');
            setModalOpen(false);
            form.resetFields();
            setRefreshTrigger(prev => prev + 1);
        } catch {
            /* 全局 errorHandler 已显示错误 */
        } finally {
            setSubmitLoading(false);
        }
    }, [form]);

    /* ── 进入租户 ── */
    const handleEnter = useCallback(async (record: ImpersonationRequest) => {
        setActionLoading(record.id);
        try {
            const res = await enterTenant(record.id);
            const entered = res?.data;
            if (entered?.status === 'active' && entered.session_expires_at) {
                saveImpersonationState({
                    requestId: entered.id,
                    tenantId: entered.tenant_id,
                    tenantName: entered.tenant_name,
                    expiresAt: entered.session_expires_at,
                    startedAt: entered.session_started_at || new Date().toISOString(),
                });
                // 🆕 同步锁定 tenant-storage 到目标租户（确保所有组件读到正确租户上下文）
                localStorage.setItem('tenant-storage', JSON.stringify({
                    currentTenantId: entered.tenant_id,
                    currentTenantName: entered.tenant_name,
                }));
                message.success(`已进入「${entered.tenant_name}」租户视角`);
                // 跳转到工作台再 reload，避免在 /platform/* 页面 reload 后因 isPlatformAdmin=false 导致 403
                setTimeout(() => { window.location.href = '/workbench'; }, 500);
            }
        } catch {
            /* 全局 errorHandler 已显示错误 */
        } finally {
            setActionLoading(null);
        }
    }, []);

    /* ── 退出租户 ── */
    const handleExit = useCallback(async (record: ImpersonationRequest) => {
        setActionLoading(record.id);
        try {
            await exitTenant(record.id);
            clearImpersonationState();
            message.success('已退出租户视角');
            setTimeout(() => window.location.reload(), 500);
        } catch {
            /* global error handler */
        } finally {
            setActionLoading(null);
        }
    }, []);

    /* ── 终止会话（彻底结束，不可再进入） ── */
    const handleTerminate = useCallback(async (record: ImpersonationRequest) => {
        setActionLoading(record.id);
        try {
            await terminateSession(record.id);
            clearImpersonationState();
            message.success('会话已终止');
            setRefreshTrigger(prev => prev + 1);
            // 如果是 active 状态终止，需要刷新页面重置视角
            if (record.status === 'active') {
                setTimeout(() => window.location.reload(), 500);
            }
        } catch {
            /* global error handler */
        } finally {
            setActionLoading(null);
        }
    }, []);

    /* ── 撤销申请 ── */
    const handleCancel = useCallback(async (record: ImpersonationRequest) => {
        setActionLoading(record.id);
        try {
            await cancelImpersonationRequest(record.id);
            message.success('申请已撤销');
            setRefreshTrigger(prev => prev + 1);
        } catch {
            /* global error handler */
        } finally {
            setActionLoading(null);
        }
    }, []);

    /* ── 数据请求（接入 StandardTable request 模式） ── */
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

        // 高级搜索 — 通用字段传递（支持 __exact 后缀）
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

        const res = await listMyImpersonationRequests(apiParams);
        const items = res?.data || [];
        const total = res?.total || 0;
        return { data: items, total };
    }, []);

    /* ── 统计面板 ── */
    const [statsData, setStatsData] = useState({ total: 0, pending: 0, active: 0 });

    useEffect(() => {
        void (async () => {
            try {
                const [allRes, pendingRes, activeRes] = await Promise.all([
                    listMyImpersonationRequests({ page: 1, page_size: 1 }),
                    listMyImpersonationRequests({ page: 1, page_size: 1, status: 'pending' } as any),
                    listMyImpersonationRequests({ page: 1, page_size: 1, status: 'active' } as any),
                ]);
                setStatsData({
                    total: Number(allRes?.total ?? 0),
                    pending: Number(pendingRes?.total ?? 0),
                    active: Number(activeRes?.total ?? 0),
                });
            } catch {
                // ignore
            }
        })();
    }, []);

    // 在 request 完成后更新统计
    const wrappedRequest = useCallback(async (params: any) => {
        return handleRequest(params);
    }, [handleRequest]);

    /* ── 统计栏（复用审计日志样式 + inline 保底） ── */
    const statsBar = useMemo(() => (
        <div className="audit-stats-bar" style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '16px 24px', borderTop: '1px solid #f0f0f0' }}>
            <div className="audit-stat-item" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 20 }}>
                <FileTextOutlined style={{ fontSize: 22, color: '#1677ff', opacity: 0.75 }} />
                <div>
                    <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{statsData.total}</div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>全部</div>
                </div>
            </div>
            <div style={{ width: 1, height: 32, background: '#f0f0f0', flexShrink: 0 }} />
            <div className="audit-stat-item" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px' }}>
                <ClockCircleOutlined style={{ fontSize: 22, color: '#1890ff', opacity: 0.75 }} />
                <div>
                    <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{statsData.pending}</div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>待审批</div>
                </div>
            </div>
            <div style={{ width: 1, height: 32, background: '#f0f0f0', flexShrink: 0 }} />
            <div className="audit-stat-item" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px' }}>
                <SyncOutlined style={{ fontSize: 22, color: '#52c41a', opacity: 0.75 }} />
                <div>
                    <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{statsData.active}</div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>进行中</div>
                </div>
            </div>
        </div>
    ), [statsData]);

    /* ── 表格列定义（StandardColumnDef） ── */
    const columns: StandardColumnDef<ImpersonationRequest>[] = useMemo(() => [
        {
            columnKey: 'tenant_name',
            columnTitle: '目标租户',
            dataIndex: 'tenant_name',
            width: 120,
            ellipsis: true,
            render: (_: any, record: ImpersonationRequest) => <Text strong>{record.tenant_name}</Text>,
        },
        {
            columnKey: 'status',
            columnTitle: '状态',
            dataIndex: 'status',
            width: 90,
            headerFilters: Object.entries(STATUS_MAP).map(([v, s]) => ({ label: s.label, value: v })),
            render: (_: any, record: ImpersonationRequest) => {
                const s = STATUS_MAP[record.status] || { color: 'default', label: record.status, icon: null };
                return <Tag color={s.color} icon={s.icon} style={{ margin: 0 }}>{s.label}</Tag>;
            },
        },
        {
            columnKey: 'reason',
            columnTitle: '申请原因',
            dataIndex: 'reason',
            width: 150,
            ellipsis: { showTitle: false },
            render: (_: any, record: ImpersonationRequest) =>
                record.reason
                    ? <Tooltip title={record.reason}><span>{record.reason}</span></Tooltip>
                    : <Text type="secondary">—</Text>,
        },
        {
            columnKey: 'duration_minutes',
            columnTitle: '时长',
            dataIndex: 'duration_minutes',
            width: 60,
            render: (_: any, record: ImpersonationRequest) =>
                record.duration_minutes >= 60 ? `${record.duration_minutes / 60}h` : `${record.duration_minutes}min`,
        },
        {
            columnKey: 'approver_name',
            columnTitle: '审批人',
            dataIndex: 'approver_name',
            width: 130,
            render: (_: any, record: ImpersonationRequest) =>
                record.approver_name || <Text type="secondary">—</Text>,
        },
        {
            columnKey: 'session_expires_at',
            columnTitle: '会话到期',
            dataIndex: 'session_expires_at',
            width: 110,
            sorter: true,
            render: (_: any, record: ImpersonationRequest) => {
                if (!record.session_expires_at) return <Text type="secondary">—</Text>;
                if (record.status === 'active') {
                    return (
                        <Tooltip title={dayjs(record.session_expires_at).format('YYYY-MM-DD HH:mm:ss')}>
                            <span style={{ color: '#52c41a' }}>{dayjs(record.session_expires_at).fromNow()}</span>
                        </Tooltip>
                    );
                }
                return dayjs(record.session_expires_at).format('MM-DD HH:mm');
            },
        },
        {
            columnKey: 'created_at',
            columnTitle: '申请时间',
            dataIndex: 'created_at',
            width: 140,
            sorter: true,
            render: (_: any, record: ImpersonationRequest) =>
                record.created_at ? dayjs(record.created_at).format('YYYY-MM-DD HH:mm') : '-',
        },
        {
            columnKey: 'action',
            columnTitle: '操作',
            dataIndex: 'id',
            width: 130,
            fixedColumn: true,
            fixed: 'right',
            render: (_: any, record: ImpersonationRequest) => {
                const isLoading = actionLoading === record.id;
                // 判断 approved 状态的请求是否已经过期（会话到期时间已过）
                const isApprovedButExpired = record.status === 'approved'
                    && record.session_expires_at
                    && dayjs(record.session_expires_at).isBefore(dayjs());
                // 已完成 / 已撤销 / 已拒绝 / 已过期 → 无可操作按钮
                const hasAction = ['approved', 'active', 'pending'].includes(record.status) && !isApprovedButExpired;
                if (!hasAction) {
                    return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
                }
                return (
                    <Space size={4}>
                        {record.status === 'approved' && (
                            <Button
                                type="primary"
                                size="small"
                                icon={<EyeOutlined />}
                                loading={isLoading}
                                onClick={(e) => { e.stopPropagation(); handleEnter(record); }}
                            >
                                进入
                            </Button>
                        )}
                        {record.status === 'active' && (
                            <Button
                                size="small"
                                icon={<LogoutOutlined />}
                                loading={isLoading}
                                onClick={(e) => { e.stopPropagation(); handleExit(record); }}
                            >
                                暂离
                            </Button>
                        )}
                        {(record.status === 'active' || (record.status === 'approved' && record.session_expires_at)) && (
                            <Popconfirm
                                title="确定终止会话？终止后将无法再次进入。"
                                onConfirm={() => handleTerminate(record)}
                            >
                                <Button size="small" danger icon={<StopOutlined />} loading={isLoading} onClick={(e) => e.stopPropagation()}>
                                    终止
                                </Button>
                            </Popconfirm>
                        )}
                        {record.status === 'pending' && (
                            <Popconfirm
                                title="确定撤销此申请？"
                                onConfirm={() => handleCancel(record)}
                            >
                                <Button size="small" loading={isLoading} onClick={(e) => e.stopPropagation()}>
                                    撤销
                                </Button>
                            </Popconfirm>
                        )}
                    </Space>
                );
            },
        },
    ], [actionLoading, handleEnter, handleExit, handleTerminate, handleCancel]);

    // ==================== Render ====================
    return (
        <>
            <StandardTable<ImpersonationRequest>
                tabs={[{ key: 'list', label: '我的申请' }]}
                title="租户访问管理"
                description="通过 Impersonation 审批机制安全访问租户数据。所有操作均被审计记录。"
                headerIcon={headerIcon}
                headerExtra={statsBar}
                searchFields={searchFields}
                advancedSearchFields={advancedSearchFields}
                columns={columns}
                rowKey="id"
                request={wrappedRequest}
                defaultPageSize={20}
                preferenceKey="platform_impersonation"
                refreshTrigger={refreshTrigger}
                primaryActionLabel="申请访问"
                primaryActionIcon={<SafetyOutlined />}
                onPrimaryAction={() => openModal()}
            />

            {/* ── 申请弹窗 ── */}
            <Modal
                title="申请租户访问"
                open={modalOpen}
                onCancel={() => { setModalOpen(false); form.resetFields(); }}
                onOk={handleSubmit}
                confirmLoading={submitLoading}
                okText="提交申请"
                cancelText="取消"
                width={480}
                destroyOnHidden
            >
                <div className="imp-modal-hint">
                    提交后需等待目标租户管理员审批通过，审批通过后方可进入租户。
                </div>
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item
                        name="tenant_id"
                        label="目标租户"
                        rules={[{ required: true, message: '请选择目标租户' }]}
                    >
                        <Select
                            placeholder="选择要访问的租户"
                            showSearch
                            optionFilterProp="label"
                            options={tenants.map(t => ({ value: t.id, label: t.name }))}
                        />
                    </Form.Item>
                    <Form.Item
                        name="duration_minutes"
                        label="访问时长"
                        rules={[{ required: true, message: '请选择访问时长' }]}
                        initialValue={60}
                    >
                        <Select options={DURATION_OPTIONS} />
                    </Form.Item>
                    <Form.Item
                        name="reason"
                        label="访问原因"
                    >
                        <Input.TextArea rows={3} placeholder="请说明访问原因（可选）" maxLength={500} showCount />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default ImpersonationPage;

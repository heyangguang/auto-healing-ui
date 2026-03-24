import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    Tag, Space, message, Drawer, Descriptions, Typography,
    Button, Tooltip,
} from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    WarningOutlined,
    FileTextOutlined,
    UserOutlined,
    ClockCircleOutlined,
    SafetyCertificateOutlined,
    DiffOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import StandardTable from '@/components/StandardTable';
import type { StandardColumnDef, SearchField, AdvancedSearchField } from '@/components/StandardTable';
import {
    getPlatformAuditLogs,
    getPlatformAuditLogDetail,
    getPlatformAuditStats,
    getPlatformAuditTrend,
} from '@/services/auto-healing/platform/auditLogs';
import dayjs from 'dayjs';
import { toDayRangeEndISO, toDayRangeStartISO } from '@/utils/dateRange';
import '../../system/audit-logs/index.css';
import {
    PLATFORM_RESOURCE_LABELS as RESOURCE_LABELS,
    ACTION_LABELS,
    ACTION_COLORS,
    HTTP_METHOD_COLORS as METHOD_COLORS,
} from '@/constants/auditDicts';

/* ========== 登录日志专用 action/resource 常量 ========== */
const LOGIN_ACTIONS = ['login', 'logout', 'impersonation_enter', 'impersonation_exit'];
const LOGIN_RESOURCES = ['auth', 'auth-logout', 'impersonation'];

const { Text } = Typography;

/* ========== 工具函数 ========== */
const formatChangeValue = (v: any): string => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') return JSON.stringify(v, null, 2);
    return String(v);
};

/* ========== 搜索字段配置（按 Tab 区分） ========== */

/** 操作日志 - 搜索字段 */
const operationSearchFields: SearchField[] = [
    { key: 'search', label: '全局搜索' },
    { key: 'username', label: '用户名' },
];
const operationAdvancedSearchFields: AdvancedSearchField[] = [
    { key: 'search', label: '关键字', type: 'input', placeholder: '搜索用户名 / 资源名 / 路径' },
    { key: 'username', label: '用户名', type: 'input', placeholder: '精确用户名', defaultMatchMode: 'exact' },
    {
        key: 'action', label: '操作类型', type: 'select', placeholder: '全部操作',
        options: Object.entries(ACTION_LABELS)
            .filter(([v]) => !LOGIN_ACTIONS.includes(v))
            .map(([v, l]) => ({ label: l, value: v })),
    },
    {
        key: 'resource_type', label: '资源类型', type: 'select', placeholder: '全部资源',
        options: Object.entries(RESOURCE_LABELS)
            .filter(([v]) => !LOGIN_RESOURCES.includes(v))
            .map(([v, l]) => ({ label: l, value: v })),
    },
    {
        key: 'status', label: '操作结果', type: 'select', placeholder: '全部状态',
        options: [{ label: '成功', value: 'success' }, { label: '失败', value: 'failed' }],
    },
    { key: 'created_at', label: '时间范围', type: 'dateRange' },
];

/** 登录日志 - 搜索字段 */
const loginSearchFields: SearchField[] = [
    { key: 'search', label: '全局搜索' },
    { key: 'username', label: '用户名' },
];
const loginAdvancedSearchFields: AdvancedSearchField[] = [
    { key: 'search', label: '关键字', type: 'input', placeholder: '搜索用户名 / IP 地址' },
    { key: 'username', label: '用户名', type: 'input', placeholder: '精确用户名', defaultMatchMode: 'exact' },
    {
        key: 'status', label: '操作结果', type: 'select', placeholder: '全部状态',
        options: [{ label: '成功', value: 'success' }, { label: '失败', value: 'failed' }],
    },
    { key: 'created_at', label: '时间范围', type: 'dateRange' },
];

/* ========== 页面组件 ========== */
const PlatformAuditLogsPage: React.FC = () => {
    /* ---- Tab 状态 ---- */
    const [activeTab, setActiveTab] = useState<string>('operation');
    /* ---- 统计数据 ---- */
    const [stats, setStats] = useState<any>(null);
    const [trendData, setTrendData] = useState<any[]>([]);

    useEffect(() => {
        getPlatformAuditStats().then(res => setStats((res as any)?.data || res)).catch(() => { });
        getPlatformAuditTrend(7).then(res => {
            const items = (res as any)?.data?.items || [];
            setTrendData(items);
        }).catch(() => { });
    }, []);

    /* ---- 详情 Drawer ---- */
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detail, setDetail] = useState<any>(null);

    const openDetail = useCallback(async (record: any) => {
        setDrawerOpen(true);
        setDetailLoading(true);
        try {
            const res = await getPlatformAuditLogDetail(record.id);
            setDetail((res as any)?.data || res);
        } catch {
            /* global error handler */
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const trendSvg = useMemo(() => {
        if (trendData.length === 0) return null;
        const maxCount = Math.max(...trendData.map((d: any) => d.count), 1);
        const width = 160;
        const height = 40;
        const points = trendData.map((d: any, i: number) => {
            const x = (i / Math.max(trendData.length - 1, 1)) * width;
            const y = height - (d.count / maxCount) * (height - 4) - 2;
            return `${x},${y}`;
        });
        const areaPoints = [...points, `${width},${height}`, `0,${height}`];
        return (
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                <defs>
                    <linearGradient id="platformTrendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#722ed1" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#722ed1" stopOpacity="0.02" />
                    </linearGradient>
                </defs>
                <polygon points={areaPoints.join(' ')} fill="url(#platformTrendGrad)" />
                <polyline points={points.join(' ')} fill="none" stroke="#722ed1" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
        );
    }, [trendData]);

    /* ========== 列定义（useMemo 缓存） ========== */
    const { operationColumns, loginColumns } = useMemo(() => {
        const colTime: StandardColumnDef<any> = {
            columnKey: 'created_at',
            columnTitle: '时间',
            dataIndex: 'created_at',
            width: 170,
            sorter: true,
            render: (_: any, record: any) =>
                record.created_at ? dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss') : '-',
        };
        const colUser: StandardColumnDef<any> = {
            columnKey: 'username',
            columnTitle: '用户',
            dataIndex: 'username',
            width: 130,
            render: (_: any, record: any) => (
                <Space size={4}>
                    <UserOutlined style={{ color: '#722ed1' }} />
                    <span>{record.username || '-'}</span>
                </Space>
            ),
        };
        const colStatus: StandardColumnDef<any> = {
            columnKey: 'status',
            columnTitle: '状态',
            dataIndex: 'status',
            width: 80,
            headerFilters: [
                { label: '成功', value: 'success' },
                { label: '失败', value: 'failed' },
            ],
            render: (_: any, record: any) => {
                const ok = record.status === 'success';
                return (
                    <Tag
                        color={ok ? 'green' : 'red'}
                        icon={ok ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                        style={{ margin: 0 }}
                    >
                        {ok ? '成功' : '失败'}
                    </Tag>
                );
            },
        };
        const colIP: StandardColumnDef<any> = {
            columnKey: 'ip_address',
            columnTitle: 'IP 地址',
            dataIndex: 'ip_address',
            width: 140,
            render: (_: any, record: any) => (
                <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{record.ip_address || '-'}</Text>
            ),
        };

        const opCols: StandardColumnDef<any>[] = [
            colTime,
            colUser,
            {
                columnKey: 'action',
                columnTitle: '操作',
                dataIndex: 'action',
                width: 110,
                headerFilters: Object.entries(ACTION_LABELS)
                    .filter(([v]) => !LOGIN_ACTIONS.includes(v))
                    .map(([v, l]) => ({ label: l, value: v })),
                render: (_: any, record: any) => (
                    <Tag color={ACTION_COLORS[record.action] || 'default'} style={{ margin: 0 }}>
                        {ACTION_LABELS[record.action] || record.action}
                    </Tag>
                ),
            },
            {
                columnKey: 'resource_type',
                columnTitle: '资源类型',
                dataIndex: 'resource_type',
                width: 110,
                headerFilters: Object.entries(RESOURCE_LABELS)
                    .filter(([v]) => !LOGIN_RESOURCES.includes(v))
                    .map(([v, l]) => ({ label: l, value: v })),
                render: (_: any, record: any) => (
                    <span>{RESOURCE_LABELS[record.resource_type] || record.resource_type}</span>
                ),
            },
            {
                columnKey: 'request_path',
                columnTitle: '请求',
                dataIndex: 'request_path',
                width: 280,
                ellipsis: true,
                render: (_: any, record: any) => (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600, color: METHOD_COLORS[record.request_method] || '#999' }}>
                            {record.request_method}
                        </span>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#595959' }}>{record.request_path}</span>
                    </span>
                ),
            },
            colStatus,
            {
                columnKey: 'risk_level',
                columnTitle: '风险',
                dataIndex: 'risk_level',
                width: 80,
                render: (_: any, record: any) => {
                    const riskMap: Record<string, { color: string; label: string }> = {
                        critical: { color: 'red', label: '极高' },
                        high: { color: 'orange', label: '高危' },
                        medium: { color: 'blue', label: '中' },
                    };
                    const risk = riskMap[record.risk_level];
                    if (risk) {
                        return (
                            <Tooltip title={record.risk_reason || risk.label}>
                                <Tag color={risk.color} icon={record.risk_level === 'critical' ? <WarningOutlined /> : undefined} style={{ margin: 0 }}>{risk.label}</Tag>
                            </Tooltip>
                        );
                    }
                    return <Text type="secondary" style={{ fontSize: 12 }}>正常</Text>;
                },
            },
            {
                columnKey: 'changes',
                columnTitle: '变更',
                dataIndex: 'changes',
                width: 90,
                render: (_: any, record: any) => {
                    if (!record.changes) return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
                    if (record.changes.deleted) {
                        return <Tag color="red" icon={<DeleteOutlined />} style={{ margin: 0 }}>删除详情</Tag>;
                    }
                    const count = Object.keys(record.changes).length;
                    return <Tag color="blue" icon={<DiffOutlined />} style={{ margin: 0 }}>{count} 项变更</Tag>;
                },
            },
            { ...colIP, defaultVisible: false },
        ];

        const loginCols: StandardColumnDef<any>[] = [
            colTime,
            colUser,
            {
                columnKey: 'action',
                columnTitle: '操作',
                dataIndex: 'action',
                width: 90,
                render: (_: any, record: any) => (
                    <Tag color={ACTION_COLORS[record.action] || 'default'} style={{ margin: 0 }}>
                        {ACTION_LABELS[record.action] || record.action}
                    </Tag>
                ),
            },
            colStatus,
            colIP,
            {
                columnKey: 'user_agent',
                columnTitle: '客户端',
                dataIndex: 'user_agent',
                width: 200,
                ellipsis: true,
                render: (_: any, record: any) => (
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.user_agent || '-'}</Text>
                ),
            },
        ];

        return { operationColumns: opCols, loginColumns: loginCols };
    }, []);

    /** 根据 activeTab 选取列和搜索字段 */
    const columns = useMemo(() => activeTab === 'login' ? loginColumns : operationColumns, [activeTab, loginColumns, operationColumns]);
    const searchFields = useMemo(() => activeTab === 'login' ? loginSearchFields : operationSearchFields, [activeTab]);
    const advancedSearchFields = useMemo(() => activeTab === 'login' ? loginAdvancedSearchFields : operationAdvancedSearchFields, [activeTab]);

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
            category: activeTab,
        };

        if (params.searchValue) {
            if (params.searchField && params.searchField !== 'username') {
                apiParams[params.searchField] = params.searchValue;
            } else {
                apiParams.username = params.searchValue;
            }
        }

        if (params.advancedSearch) {
            const adv = params.advancedSearch;
            // 特殊字段处理
            if (adv.created_at && adv.created_at[0] && adv.created_at[1]) {
                apiParams.created_after = toDayRangeStartISO(adv.created_at[0]);
                apiParams.created_before = toDayRangeEndISO(adv.created_at[1]);
            }
            // 通用字段传递（支持 __exact 后缀）
            const specialKeys = ['created_at'];
            Object.entries(adv).forEach(([key, value]) => {
                if (specialKeys.includes(key) || value === undefined || value === null || value === '') return;
                apiParams[key] = value;
            });
        }

        if (params.sorter) {
            apiParams.sort_by = params.sorter.field;
            apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
        }

        const res = await getPlatformAuditLogs(apiParams);
        const items = (res as any)?.data || [];
        const total = (res as any)?.total ?? 0;
        return { data: items, total };
    }, [activeTab]);

    /* ========== 头部图标（缓存） ========== */
    const headerIcon = useMemo(() => (
        <svg viewBox="0 0 48 48" fill="none">
            <rect x="8" y="6" width="32" height="36" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M16 16h16M16 24h16M16 32h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="36" cy="36" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M33 36l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ), []);

    /* ========== 统计卡片（缓存） ========== */
    const statsBar = useMemo(() => stats ? (
        <div className="audit-stats-bar">
            <div className="audit-stat-item">
                <FileTextOutlined className="audit-stat-icon audit-stat-icon-total" />
                <div className="audit-stat-content">
                    <div className="audit-stat-value">{stats.total_count ?? 0}</div>
                    <div className="audit-stat-label">总操作</div>
                </div>
            </div>
            <div className="audit-stat-divider" />
            <div className="audit-stat-item">
                <CheckCircleOutlined className="audit-stat-icon audit-stat-icon-success" />
                <div className="audit-stat-content">
                    <div className="audit-stat-value">{stats.success_count ?? 0}</div>
                    <div className="audit-stat-label">成功</div>
                </div>
            </div>
            <div className="audit-stat-divider" />
            <div className="audit-stat-item">
                <CloseCircleOutlined className="audit-stat-icon audit-stat-icon-failed" />
                <div className="audit-stat-content">
                    <div className="audit-stat-value">{stats.failed_count ?? 0}</div>
                    <div className="audit-stat-label">失败</div>
                </div>
            </div>
            <div className="audit-stat-divider" />
            <div className="audit-stat-item">
                <ClockCircleOutlined className="audit-stat-icon audit-stat-icon-today" />
                <div className="audit-stat-content">
                    <div className="audit-stat-value">{stats.today_count ?? 0}</div>
                    <div className="audit-stat-label">今日</div>
                </div>
            </div>
            <div className="audit-stat-divider" />
            <div className="audit-stat-item audit-stat-trend">
                <div className="audit-stat-content">
                    <div className="audit-stat-label" style={{ marginBottom: 4 }}>7 天趋势</div>
                    {trendSvg}
                </div>
            </div>
        </div>
    ) : null, [stats, trendSvg]);

    return (
        <>
            <StandardTable<any>
                key={activeTab}
                tabs={[
                    { key: 'operation', label: '操作日志' },
                    { key: 'login', label: '登录日志' },
                ]}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                title="平台审计日志"
                description={activeTab === 'login'
                    ? '记录平台管理员的所有登录和登出活动，用于安全审计和异常登录排查。'
                    : '记录平台管理员的所有操作（用户管理、角色管理、租户管理等），用于平台级安全审计。'
                }
                headerIcon={headerIcon}
                headerExtra={statsBar}
                searchFields={searchFields}
                advancedSearchFields={advancedSearchFields}
                columns={columns}
                rowKey="id"
                onRowClick={openDetail}
                request={handleRequest}
                defaultPageSize={20}
                preferenceKey={`platform_audit_log_${activeTab}`}
            />

            {/* 详情抽屉 */}
            <Drawer
                title="平台审计日志详情"
                open={drawerOpen}
                onClose={() => { setDrawerOpen(false); setDetail(null); }}
                size={640}
                loading={detailLoading}
            >
                {detail && (
                    <div className="audit-detail">
                        {/* 状态横幅 */}
                        <div className={`audit-detail-banner ${detail.status === 'failed' ? 'audit-detail-banner-failed' : ''} ${(detail.risk_level === 'high' || detail.risk_level === 'critical') ? 'audit-detail-banner-risk' : ''}`}>
                            <div className="audit-detail-banner-row">
                                <Tag
                                    color={detail.status === 'success' ? 'green' : 'red'}
                                    icon={detail.status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                                >
                                    {detail.status === 'success' ? '操作成功' : '操作失败'}
                                </Tag>
                                {(detail.risk_level === 'critical' || detail.risk_level === 'high') && (
                                    <Tag color={detail.risk_level === 'critical' ? 'red' : 'orange'} icon={<WarningOutlined />}>
                                        {detail.risk_level === 'critical' ? '极高' : '高危'} · {detail.risk_reason}
                                    </Tag>
                                )}
                                {detail.risk_level === 'medium' && (
                                    <Tag color="blue">
                                        中风险 · {detail.risk_reason}
                                    </Tag>
                                )}
                                <span className="audit-detail-time">
                                    {dayjs(detail.created_at).format('YYYY-MM-DD HH:mm:ss')}
                                </span>
                            </div>
                        </div>

                        {/* 基本信息 */}
                        <Descriptions
                            column={2}
                            size="small"
                            className="audit-detail-desc"
                            labelStyle={{ color: '#8c8c8c', width: 90 }}
                        >
                            <Descriptions.Item label="操作用户">
                                <Space size={4}>
                                    <UserOutlined />
                                    {detail.username}
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="IP 地址">
                                <Text code>{detail.ip_address}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="操作类型">
                                <Tag color={ACTION_COLORS[detail.action] || 'default'}>
                                    {ACTION_LABELS[detail.action] || detail.action}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="资源类型">
                                {RESOURCE_LABELS[detail.resource_type] || detail.resource_type}
                            </Descriptions.Item>
                            {detail.resource_type === 'impersonation' ? (
                                /* Impersonation 特殊展示 */
                                <>
                                    <Descriptions.Item label="目标租户" span={2}>
                                        <Tag color="purple">{detail.resource_name}</Tag>
                                    </Descriptions.Item>
                                    {detail.resource_id && (
                                        <Descriptions.Item label="申请 ID" span={2}>
                                            <Text code style={{ fontSize: 12 }}>{detail.resource_id}</Text>
                                        </Descriptions.Item>
                                    )}
                                </>
                            ) : (
                                /* 普通资源展示 */
                                <>
                                    {detail.resource_name && (
                                        <Descriptions.Item label="资源名称" span={2}>
                                            {detail.resource_name}
                                        </Descriptions.Item>
                                    )}
                                    {detail.resource_id && (
                                        <Descriptions.Item label="资源 ID" span={2}>
                                            <Text code style={{ fontSize: 12 }}>{detail.resource_id}</Text>
                                        </Descriptions.Item>
                                    )}
                                </>
                            )}
                        </Descriptions>

                        {/* 请求信息 */}
                        <div className="audit-detail-section">
                            <div className="audit-detail-section-title">请求信息</div>
                            <div className="audit-detail-request-line">
                                <span
                                    className="audit-method-badge audit-method-badge-lg"
                                    style={{ color: METHOD_COLORS[detail.request_method] || '#999' }}
                                >
                                    {detail.request_method}
                                </span>
                                <Text code className="audit-detail-path">{detail.request_path}</Text>
                                <Tag style={{ marginLeft: 'auto' }}>
                                    HTTP {detail.response_status}
                                </Tag>
                            </div>
                        </div>

                        {/* 请求体 */}
                        {detail.request_body && (
                            <div className="audit-detail-section">
                                <div className="audit-detail-section-title">请求体</div>
                                <pre className="audit-detail-json">
                                    {JSON.stringify(detail.request_body, null, 2)}
                                </pre>
                            </div>
                        )}

                        {/* 变更记录 */}
                        {detail.changes && (
                            <div className="audit-detail-section">
                                <div className="audit-detail-section-title">
                                    {detail.changes.deleted ? '删除资源信息' : '变更内容'}
                                </div>
                                {detail.changes.deleted ? (
                                    <table className="audit-changes-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: 120 }}>属性</th>
                                                <th>值</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(detail.changes.deleted as Record<string, any>).map(([k, v]) => (
                                                <tr key={k}>
                                                    <td className="audit-changes-field">{k}</td>
                                                    <td className="audit-changes-deleted-val">{formatChangeValue(v)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <table className="audit-changes-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: 120 }}>字段</th>
                                                <th>旧值</th>
                                                <th>新值</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(detail.changes as Record<string, any>).map(([field, diff]: [string, any]) => (
                                                <tr key={field}>
                                                    <td className="audit-changes-field">{field}</td>
                                                    <td className="audit-changes-old">{formatChangeValue(diff?.old)}</td>
                                                    <td className="audit-changes-new">{formatChangeValue(diff?.new)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {/* 错误信息 */}
                        {detail.error_message && (
                            <div className="audit-detail-section">
                                <div className="audit-detail-section-title" style={{ color: '#f5222d' }}>错误信息</div>
                                <div className="audit-detail-error">{detail.error_message}</div>
                            </div>
                        )}

                        {/* User Agent */}
                        <div className="audit-detail-section">
                            <div className="audit-detail-section-title">客户端信息</div>
                            <Text type="secondary" style={{ fontSize: 12, wordBreak: 'break-all' }}>
                                {detail.user_agent}
                            </Text>
                        </div>

                        {/* 日志 ID */}
                        <div className="audit-detail-footer">
                            <SafetyCertificateOutlined style={{ marginRight: 4 }} />
                            <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
                                {detail.id}
                            </Text>
                        </div>
                    </div>
                )}
            </Drawer>
        </>
    );
};

export default PlatformAuditLogsPage;

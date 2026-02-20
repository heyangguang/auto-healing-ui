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
import '../../system/audit-logs/index.css';

const { Text } = Typography;

/* ========== 枚举映射 ========== */
const ACTION_LABELS: Record<string, string> = {
    login: '登录',
    create: '创建',
    update: '更新',
    delete: '删除',
    assign_role: '分配角色',
    reset_password: '重置密码',
    enable: '启用',
    disable: '禁用',
};

const ACTION_COLORS: Record<string, string> = {
    login: 'purple',
    create: 'green',
    update: 'blue',
    delete: 'red',
    assign_role: 'magenta',
    reset_password: 'orange',
    enable: 'green',
    disable: 'orange',
};

const RESOURCE_LABELS: Record<string, string> = {
    auth: '认证',
    users: '用户管理',
    roles: '角色管理',
    permissions: '权限管理',
    tenants: '租户管理',
    settings: '平台设置',
};

const METHOD_COLORS: Record<string, string> = {
    GET: '#61affe',
    POST: '#49cc90',
    PUT: '#fca130',
    PATCH: '#50e3c2',
    DELETE: '#f93e3e',
};

/* ========== 工具函数 ========== */
const formatChangeValue = (v: any): string => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') return JSON.stringify(v, null, 2);
    return String(v);
};

/* ========== 搜索字段配置 ========== */
const searchFields: SearchField[] = [
    { key: 'search', label: '全局搜索' },
    { key: 'username', label: '用户名' },
];

const advancedSearchFields: AdvancedSearchField[] = [
    { key: 'search', label: '关键字', type: 'input', placeholder: '搜索用户名 / 资源名 / 路径' },
    { key: 'username', label: '用户名', type: 'input', placeholder: '精确用户名' },
    {
        key: 'category', label: '日志类型', type: 'select', placeholder: '全部类型',
        options: [{ label: '登录', value: 'login' }, { label: '操作', value: 'operation' }],
    },
    {
        key: 'action', label: '操作类型', type: 'select', placeholder: '全部操作',
        options: Object.entries(ACTION_LABELS).map(([v, l]) => ({ label: l, value: v })),
    },
    {
        key: 'resource_type', label: '资源类型', type: 'select', placeholder: '全部资源',
        options: Object.entries(RESOURCE_LABELS).map(([v, l]) => ({ label: l, value: v })),
    },
    {
        key: 'status', label: '状态', type: 'select', placeholder: '全部状态',
        options: [{ label: '成功', value: 'success' }, { label: '失败', value: 'failed' }],
    },
    { key: 'created_at', label: '时间范围', type: 'dateRange' },
];

/* ========== 页面组件 ========== */
const PlatformAuditLogsPage: React.FC = () => {
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
            message.error('加载详情失败');
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

    /* ========== 列定义 ========== */
    const columns: StandardColumnDef<any>[] = [
        {
            columnKey: 'created_at',
            columnTitle: '时间',
            dataIndex: 'created_at',
            width: 170,
            sorter: true,
            render: (_: any, record: any) =>
                record.created_at ? dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss') : '-',
        },
        {
            columnKey: 'username',
            columnTitle: '操作用户',
            dataIndex: 'username',
            width: 130,
            render: (_: any, record: any) => (
                <Space size={4}>
                    <UserOutlined style={{ color: '#722ed1' }} />
                    <span>{record.username || '-'}</span>
                </Space>
            ),
        },
        {
            columnKey: 'category',
            columnTitle: '类型',
            dataIndex: 'category',
            width: 80,
            render: (_: any, record: any) => (
                <Tag color={record.category === 'login' ? 'purple' : 'blue'} style={{ margin: 0 }}>
                    {record.category === 'login' ? '登录' : '操作'}
                </Tag>
            ),
        },
        {
            columnKey: 'action',
            columnTitle: '操作',
            dataIndex: 'action',
            width: 110,
            headerFilters: Object.entries(ACTION_LABELS).map(([v, l]) => ({ label: l, value: v })),
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
            headerFilters: Object.entries(RESOURCE_LABELS).map(([v, l]) => ({ label: l, value: v })),
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
        {
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
        },
        {
            columnKey: 'risk_level',
            columnTitle: '风险',
            dataIndex: 'risk_level',
            width: 80,
            render: (_: any, record: any) => {
                if (record.risk_level === 'high') {
                    return (
                        <Tooltip title={record.risk_reason || '高危操作'}>
                            <Tag color="orange" icon={<WarningOutlined />} style={{ margin: 0 }}>高危</Tag>
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
        {
            columnKey: 'ip_address',
            columnTitle: 'IP',
            dataIndex: 'ip_address',
            width: 130,
            defaultVisible: false,
            render: (_: any, record: any) => (
                <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{record.ip_address || '-'}</Text>
            ),
        },
    ];

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

        if (params.searchValue) {
            if (params.searchField && params.searchField !== 'search') {
                apiParams[params.searchField] = params.searchValue;
            } else {
                apiParams.search = params.searchValue;
            }
        }

        if (params.advancedSearch) {
            const adv = params.advancedSearch;
            if (adv.search) apiParams.search = adv.search;
            if (adv.username) apiParams.username = adv.username;
            if (adv.category) apiParams.category = adv.category;
            if (adv.action) apiParams.action = adv.action;
            if (adv.resource_type) apiParams.resource_type = adv.resource_type;
            if (adv.status) apiParams.status = adv.status;
            if (adv.created_at && adv.created_at[0] && adv.created_at[1]) {
                apiParams.created_after = adv.created_at[0].toISOString();
                apiParams.created_before = adv.created_at[1].toISOString();
            }
        }

        if (params.sorter) {
            apiParams.sort_by = params.sorter.field;
            apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
        }

        const res = await getPlatformAuditLogs(apiParams);
        const items = (res as any)?.data || [];
        const total = (res as any)?.total ?? 0;
        return { data: items, total };
    }, []);

    /* ========== 头部图标 ========== */
    const headerIcon = (
        <svg viewBox="0 0 48 48" fill="none">
            <rect x="8" y="6" width="32" height="36" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M16 16h16M16 24h16M16 32h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="36" cy="36" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M33 36l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    /* ========== 统计卡片 ========== */
    const statsBar = stats ? (
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
    ) : null;

    return (
        <>
            <StandardTable<any>
                tabs={[{ key: 'list', label: '平台操作日志' }]}
                title="平台审计日志"
                description="记录平台管理员的所有操作（登录、用户管理、角色管理、租户管理等），用于平台级安全审计。"
                headerIcon={headerIcon}
                headerExtra={statsBar}
                searchFields={searchFields}
                advancedSearchFields={advancedSearchFields}
                columns={columns}
                rowKey="id"
                onRowClick={openDetail}
                request={handleRequest}
                defaultPageSize={20}
                preferenceKey="platform_audit_log_list"
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
                    <div>
                        {/* 状态横幅 */}
                        <div style={{
                            padding: '12px 16px',
                            background: detail.status === 'failed' ? '#fff2f0' : detail.risk_level === 'high' ? '#fff7e6' : '#f6ffed',
                            borderRadius: 6,
                            marginBottom: 16,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}>
                            <Tag
                                color={detail.status === 'success' ? 'green' : 'red'}
                                icon={detail.status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                            >
                                {detail.status === 'success' ? '操作成功' : '操作失败'}
                            </Tag>
                            {detail.risk_level === 'high' && (
                                <Tag color="orange" icon={<WarningOutlined />}>
                                    高危 · {detail.risk_reason}
                                </Tag>
                            )}
                            <span style={{ marginLeft: 'auto', color: '#8c8c8c', fontSize: 12 }}>
                                {dayjs(detail.created_at).format('YYYY-MM-DD HH:mm:ss')}
                            </span>
                        </div>

                        {/* 基本信息 */}
                        <Descriptions
                            column={2}
                            size="small"
                            labelStyle={{ color: '#8c8c8c', width: 90 }}
                            style={{ marginBottom: 16 }}
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
                        </Descriptions>

                        {/* 请求信息 */}
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#595959', marginBottom: 8 }}>请求信息</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#fafafa', borderRadius: 4 }}>
                                <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600, color: METHOD_COLORS[detail.request_method] || '#999' }}>
                                    {detail.request_method}
                                </span>
                                <Text code style={{ fontSize: 12, flex: 1 }}>{detail.request_path}</Text>
                                <Tag>HTTP {detail.response_status}</Tag>
                            </div>
                        </div>

                        {/* 请求体 */}
                        {detail.request_body && Object.keys(detail.request_body).length > 0 && (
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#595959', marginBottom: 8 }}>请求体 (Request Body)</div>
                                <pre style={{
                                    padding: '10px 12px',
                                    background: '#fafafa',
                                    borderRadius: 4,
                                    fontSize: 12,
                                    fontFamily: 'monospace',
                                    margin: 0,
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all',
                                    maxHeight: 300,
                                    overflow: 'auto',
                                    border: '1px solid #f0f0f0',
                                }}>
                                    {JSON.stringify(detail.request_body, null, 2)}
                                </pre>
                            </div>
                        )}

                        {/* 变更记录 */}
                        {detail.changes && (
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#595959', marginBottom: 8 }}>
                                    {detail.changes.deleted ? '删除资源信息' : '变更内容'}
                                </div>
                                {detail.changes.deleted ? (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                        <thead>
                                            <tr style={{ background: '#fafafa' }}>
                                                <th style={{ padding: '6px 8px', textAlign: 'left', width: 120, borderBottom: '1px solid #f0f0f0' }}>属性</th>
                                                <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>值</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(detail.changes.deleted as Record<string, any>).map(([k, v]) => (
                                                <tr key={k} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                    <td style={{ padding: '6px 8px', color: '#8c8c8c' }}>{k}</td>
                                                    <td style={{ padding: '6px 8px', color: '#ff4d4f' }}>{formatChangeValue(v)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                        <thead>
                                            <tr style={{ background: '#fafafa' }}>
                                                <th style={{ padding: '6px 8px', textAlign: 'left', width: 120, borderBottom: '1px solid #f0f0f0' }}>字段</th>
                                                <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>旧值</th>
                                                <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>新值</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(detail.changes as Record<string, any>).map(([field, diff]: [string, any]) => (
                                                <tr key={field} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                    <td style={{ padding: '6px 8px', color: '#8c8c8c' }}>{field}</td>
                                                    <td style={{ padding: '6px 8px', color: '#ff4d4f', textDecoration: 'line-through' }}>{formatChangeValue(diff?.old)}</td>
                                                    <td style={{ padding: '6px 8px', color: '#52c41a' }}>{formatChangeValue(diff?.new)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {/* 错误信息 */}
                        {detail.error_message && (
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#f5222d', marginBottom: 8 }}>错误信息</div>
                                <div style={{ padding: '8px 12px', background: '#fff2f0', borderRadius: 4, color: '#cf1322', fontSize: 12 }}>
                                    {detail.error_message}
                                </div>
                            </div>
                        )}

                        {/* 客户端信息 */}
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#595959', marginBottom: 8 }}>客户端信息</div>
                            <Text type="secondary" style={{ fontSize: 12, wordBreak: 'break-all' }}>
                                {detail.user_agent}
                            </Text>
                        </div>

                        {/* 日志 ID */}
                        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <SafetyCertificateOutlined style={{ color: '#8c8c8c' }} />
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

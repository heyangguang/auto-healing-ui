import {
    CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
    SyncOutlined, EyeOutlined, MailOutlined, ApiOutlined,
    DingdingOutlined, SendOutlined, BellOutlined,
    ExclamationCircleOutlined, FileTextOutlined,
    RobotOutlined, CalendarOutlined, PlayCircleOutlined, HistoryOutlined,
} from '@ant-design/icons';
import {
    Tag, Button, Drawer, Typography, Descriptions, Space, Tooltip,
    Avatar, message, Divider,
} from 'antd';
import React, { useState, useEffect, useCallback, startTransition } from 'react';
import { history, useAccess } from '@umijs/max';
import { getNotifications, retryNotification, getChannels, getTemplates, getNotificationStats } from '@/services/auto-healing/notification';
import { getExecutionRun } from '@/services/auto-healing/execution';
import StandardTable from '@/components/StandardTable';
import type { StandardColumnDef, AdvancedSearchField } from '@/components/StandardTable';
import './index.css';
import { getChannelTypeConfig } from '@/constants/notificationDicts';

const { Text } = Typography;

// ==================== Constants ====================

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string; tagColor: 'success' | 'error' | 'warning' | 'default' }> = {
    sent: { color: '#52c41a', icon: <CheckCircleOutlined />, label: '已发送', tagColor: 'success' },
    delivered: { color: '#52c41a', icon: <CheckCircleOutlined />, label: '已送达', tagColor: 'success' },
    pending: { color: '#faad14', icon: <ClockCircleOutlined />, label: '待发送', tagColor: 'warning' },
    failed: { color: '#ff4d4f', icon: <CloseCircleOutlined />, label: '失败', tagColor: 'error' },
    bounced: { color: '#ff4d4f', icon: <ExclamationCircleOutlined />, label: '退信', tagColor: 'error' },
};

const TRIGGERED_BY_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    manual: { icon: <PlayCircleOutlined />, label: '手动执行', color: 'blue' },
    'scheduler:cron': { icon: <CalendarOutlined />, label: '定时调度', color: 'purple' },
    'scheduler:once': { icon: <ClockCircleOutlined />, label: '单次调度', color: 'cyan' },
    healing: { icon: <RobotOutlined />, label: '自愈触发', color: 'orange' },
};

// ==================== Helpers ====================
const getTypeConfig = (type: string) => getChannelTypeConfig(type);
const getStatusConfig = (status: string) => STATUS_CONFIG[status] || STATUS_CONFIG.pending;

const formatTime = (timeStr: string) => {
    if (!timeStr) return '-';
    const date = new Date(timeStr);
    return date.toLocaleString('zh-CN', {
        month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
};

const formatFullTime = (timeStr: string) => {
    if (!timeStr) return '-';
    return new Date(timeStr).toLocaleString('zh-CN');
};

// ==================== Statistics Dashboard ====================
const StatsDashboard: React.FC<{ refreshKey?: number }> = ({ refreshKey }) => {
    const [statsData, setStatsData] = useState({ total: 0, sentCount: 0, failedCount: 0, pendingCount: 0 });
    useEffect(() => {
        getNotificationStats().then(res => {
            if (res?.data) {
                const byStatus = res.data.logs_by_status || [];
                const getCount = (s: string) => byStatus.find((x: any) => x.status === s)?.count || 0;
                setStatsData({
                    total: res.data.logs_total || 0,
                    sentCount: getCount('sent') + getCount('delivered'),
                    failedCount: getCount('failed') + getCount('bounced'),
                    pendingCount: getCount('pending'),
                });
            }
        }).catch(() => { });
    }, [refreshKey]);
    const { total, sentCount, failedCount, pendingCount } = statsData;
    const successRate = total > 0 ? ((sentCount / total) * 100).toFixed(1) : '0';

    return (
        <div className="records-stats-bar">
            <div className="records-stat-item">
                <BellOutlined className="records-stat-icon records-stat-icon-total" />
                <div className="records-stat-content">
                    <div className="records-stat-value">{total}</div>
                    <div className="records-stat-label">总通知</div>
                </div>
            </div>
            <div className="records-stat-divider" />
            <div className="records-stat-item">
                <CheckCircleOutlined className="records-stat-icon records-stat-icon-sent" />
                <div className="records-stat-content">
                    <div className="records-stat-value">{sentCount}</div>
                    <div className="records-stat-label">已发送</div>
                </div>
            </div>
            <div className="records-stat-divider" />
            <div className="records-stat-item">
                <CloseCircleOutlined className="records-stat-icon records-stat-icon-failed" />
                <div className="records-stat-content">
                    <div className="records-stat-value">{failedCount}</div>
                    <div className="records-stat-label">失败</div>
                </div>
            </div>
            <div className="records-stat-divider" />
            <div className="records-stat-item">
                <ClockCircleOutlined className="records-stat-icon records-stat-icon-pending" />
                <div className="records-stat-content">
                    <div className="records-stat-value">{pendingCount}</div>
                    <div className="records-stat-label">待发送</div>
                </div>
            </div>
            <div className="records-stat-divider" />
            <div className="records-stat-item">
                <SendOutlined className="records-stat-icon records-stat-icon-rate" />
                <div className="records-stat-content">
                    <div className="records-stat-value">{successRate}%</div>
                    <div className="records-stat-label">成功率</div>
                </div>
            </div>
        </div>
    );
};

// ==================== Main Component ====================
const NotificationRecords: React.FC = () => {
    const access = useAccess();
    const [detailOpen, setDetailOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<AutoHealing.Notification | null>(null);
    const [retryLoading, setRetryLoading] = useState<string | null>(null);
    const [allData, setAllData] = useState<AutoHealing.Notification[]>([]);
    const [reloadKey, setReloadKey] = useState(0);

    // Execution detail drawer
    const [execDetailOpen, setExecDetailOpen] = useState(false);
    const [execDetail, setExecDetail] = useState<AutoHealing.ExecutionRun | null>(null);
    const [execLoading, setExecLoading] = useState(false);

    // Filter data for dropdowns
    const [channels, setChannels] = useState<AutoHealing.NotificationChannel[]>([]);
    const [templates, setTemplates] = useState<AutoHealing.NotificationTemplate[]>([]);

    useEffect(() => {
        Promise.all([
            getChannels({ page_size: 100 }),
            getTemplates({ page_size: 100 })
        ]).then(([chRes, tplRes]) => {
            if (chRes.data) setChannels(chRes.data);
            if (tplRes.data) setTemplates(tplRes.data);
        });
    }, []);

    // ==================== Actions ====================
    const handleRetry = useCallback(async (id: string) => {
        setRetryLoading(id);
        try {
            await retryNotification(id);
            message.success('重试发送成功');
            setReloadKey(k => k + 1);
            setDetailOpen(false);
        } catch {
            // global error handler
        } finally {
            setRetryLoading(null);
        }
    }, []);

    const handleViewDetail = useCallback((record: AutoHealing.Notification) => {
        setCurrentRecord(record);
        setDetailOpen(true);
    }, []);

    // ==================== Column Definitions ====================
    const columns: StandardColumnDef<AutoHealing.Notification>[] = [
        {
            columnKey: 'status',
            columnTitle: '状态',
            dataIndex: 'status',
            width: 100,
            sorter: true,
            headerFilters: [
                { label: '已发送', value: 'sent' },
                { label: '已送达', value: 'delivered' },
                { label: '失败', value: 'failed' },
                { label: '退信', value: 'bounced' },
                { label: '待发送', value: 'pending' },
            ],
            render: (_val, record) => {
                const config = getStatusConfig(record.status);
                return <Tag icon={config.icon} color={config.tagColor} style={{ margin: 0 }}>{config.label}</Tag>;
            },
        },
        {
            columnKey: 'channel',
            columnTitle: '通知渠道',
            width: 180,
            headerFilters: channels.map(c => ({ label: c.name, value: c.id })),
            render: (_val, record) => {
                const config = getTypeConfig(record.channel?.type || 'unknown');
                return (
                    <Space size={8}>
                        <Avatar size={28} style={{ background: config.bg, color: config.color }} icon={config.icon} />
                        <div style={{ lineHeight: 1.3 }}>
                            <div style={{ fontWeight: 500 }}>{record.channel?.name || '未知渠道'}</div>
                            <div style={{ fontSize: 11, color: '#8c8c8c' }}>{config.label}</div>
                        </div>
                    </Space>
                );
            },
        },
        {
            columnKey: 'task',
            columnTitle: '关联任务',
            width: 180,
            render: (_val, record) => {
                const execRun = (record as any).execution_run;
                if (!execRun?.task?.name) return <Text type="secondary">-</Text>;
                const triggeredByConfig = TRIGGERED_BY_CONFIG[execRun.triggered_by] || { label: execRun.triggered_by, color: 'default' };
                return (
                    <div style={{ lineHeight: 1.4 }}>
                        <Tooltip title="点击查看执行详情">
                            <a onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setExecLoading(true);
                                setExecDetailOpen(true);
                                try {
                                    const res = await getExecutionRun(record.execution_run_id!);
                                    setExecDetail(res.data || res);
                                } catch { message.error('加载执行详情失败'); }
                                finally { setExecLoading(false); }
                            }} style={{ fontWeight: 500, cursor: 'pointer' }}>
                                {execRun.task.name}
                            </a>
                        </Tooltip>
                        <div>
                            <Tag style={{ margin: 0, fontSize: 10 }} color={triggeredByConfig.color}>
                                {triggeredByConfig.label}
                            </Tag>
                        </div>
                    </div>
                );
            },
        },
        {
            columnKey: 'subject',
            columnTitle: '通知主题',
            dataIndex: 'subject',
            width: 220,
            sorter: true,
            ellipsis: true,
            render: (_val, record) => (
                <div style={{ lineHeight: 1.5 }}>
                    <div>{record.subject || '(无主题)'}</div>
                    {record.template && (
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                            <FileTextOutlined style={{ marginRight: 4 }} />
                            {record.template.name}
                        </div>
                    )}
                </div>
            ),
        },
        {
            columnKey: 'error_message',
            columnTitle: '错误信息',
            width: 200,
            render: (_val, record) => {
                const isFailed = record.status === 'failed' || record.status === 'bounced';
                if (!isFailed || !record.error_message) return <Text type="secondary">-</Text>;
                return (
                    <Tooltip title={record.error_message}>
                        <Text type="secondary" ellipsis style={{ maxWidth: 180 }}>{record.error_message}</Text>
                    </Tooltip>
                );
            },
        },
        {
            columnKey: 'sent_at',
            columnTitle: '发送时间',
            dataIndex: 'sent_at',
            width: 130,
            sorter: true,
            render: (_val, record) => <Text type="secondary">{formatTime(record.sent_at || record.created_at)}</Text>,
        },
        {
            columnKey: 'actions',
            columnTitle: '操作',
            width: 100,
            fixed: 'right',
            render: (_val, record) => {
                const isFailed = record.status === 'failed' || record.status === 'bounced';
                return (
                    <Space size={4} onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="查看详情">
                            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
                        </Tooltip>
                        {isFailed && (
                            <Tooltip title="重试发送">
                                <Button type="text" size="small" danger icon={<SyncOutlined />}
                                    disabled={!access.canSendNotification}
                                    loading={retryLoading === record.id} onClick={() => handleRetry(record.id)} />
                            </Tooltip>
                        )}
                    </Space>
                );
            },
        },
    ];

    // ==================== Render ====================
    return (
        <>
            <StandardTable<AutoHealing.Notification>
                key={reloadKey}
                tabs={[{ key: 'list', label: '发送记录' }]}
                title="通知记录"
                description="查看和管理所有通知发送记录"
                headerIcon={
                    <svg viewBox="0 0 48 48" fill="none">
                        <rect x="6" y="10" width="36" height="28" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                        <path d="M6 18h36M14 26h12M14 32h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="36" cy="14" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
                        <path d="M36 12v4M34 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                }
                headerExtra={<StatsDashboard />}
                columns={columns}
                rowKey="id"
                searchFields={[
                    { key: 'subject', label: '通知主题' },
                    { key: 'task_name', label: '任务名称' },
                    { key: 'recipient', label: '接收者' },
                ]}
                advancedSearchFields={[
                    { key: 'subject', label: '通知主题', type: 'input', placeholder: '搜索通知主题' },
                    { key: 'task_name', label: '任务名称', type: 'input', placeholder: '模糊搜索任务模板名称' },
                    {
                        key: 'status', label: '发送状态', type: 'select', placeholder: '全部状态',
                        options: [
                            { label: '已发送', value: 'sent' },
                            { label: '已送达', value: 'delivered' },
                            { label: '失败', value: 'failed' },
                            { label: '退信', value: 'bounced' },
                            { label: '待发送', value: 'pending' },
                        ],
                    },
                    {
                        key: 'channel_id', label: '通知渠道', type: 'select', placeholder: '全部渠道',
                        options: channels.map(c => ({ label: c.name, value: c.id })),
                    },
                    {
                        key: 'template_id', label: '通知模板', type: 'select', placeholder: '全部模板',
                        options: templates.map(t => ({ label: t.name, value: t.id })),
                    },
                    {
                        key: 'triggered_by', label: '触发类型', type: 'select', placeholder: '全部类型',
                        options: [
                            { label: '手动执行', value: 'manual' },
                            { label: '定时调度', value: 'scheduler:cron' },
                            { label: '单次调度', value: 'scheduler:once' },
                            { label: '自愈触发', value: 'healing' },
                        ],
                    },
                    { key: 'created_at', label: '创建时间', type: 'dateRange' },
                ] as AdvancedSearchField[]}
                request={async (params) => {
                    const apiParams: Record<string, any> = {
                        page: params.page,
                        page_size: params.pageSize,
                    };

                    // 搜索字段映射
                    if (params.searchValue) {
                        apiParams[params.searchField || 'subject'] = params.searchValue;
                    }

                    // 排序映射
                    if (params.sorter?.field && params.sorter?.order) {
                        apiParams.sort_by = params.sorter.field;
                        apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
                    }

                    // 高级搜索 — 通用字段传递（支持 __exact 后缀）
                    if (params.advancedSearch) {
                        const adv = params.advancedSearch;
                        // 特殊字段：左侧枚举筛选 channel → channel_id
                        if (adv.channel) { apiParams.channel_id = adv.channel; }
                        // 日期范围
                        if (adv.created_at) {
                            const [start, end] = adv.created_at;
                            if (start) apiParams.created_after = start;
                            if (end) apiParams.created_before = end;
                        }
                        // 通用字段传递
                        const specialKeys = ['channel', 'created_at'];
                        Object.entries(adv).forEach(([key, value]) => {
                            if (specialKeys.includes(key) || value === undefined || value === null || value === '') return;
                            apiParams[key] = value;
                        });
                    }

                    const res = await getNotifications(apiParams);
                    const data = res.data || [];
                    setAllData(data);
                    return {
                        data,
                        total: res.total || data.length,
                    };
                }}
                defaultPageSize={16}
                preferenceKey="notification_records"
                onRowClick={handleViewDetail}
            />

            {/* Detail Drawer */}
            <Drawer
                title={
                    <Space>
                        <BellOutlined />
                        <span>通知详情</span>
                        {currentRecord && (
                            <Tag icon={getStatusConfig(currentRecord.status).icon} color={getStatusConfig(currentRecord.status).tagColor}>
                                {getStatusConfig(currentRecord.status).label}
                            </Tag>
                        )}
                    </Space>
                }
                size={700}
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                extra={
                    currentRecord && (currentRecord.status === 'failed' || currentRecord.status === 'bounced') && (
                        <Button type="primary" danger icon={<SendOutlined />}
                            loading={retryLoading === currentRecord.id}
                            disabled={!access.canSendNotification}
                            onClick={() => handleRetry(currentRecord.id)}>
                            重试发送
                        </Button>
                    )
                }
            >
                {currentRecord && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* Error Alert */}
                        {(currentRecord.status === 'failed' || currentRecord.status === 'bounced') && currentRecord.error_message && (
                            <div style={{ padding: '12px 16px', background: '#fff1f0', border: '1px solid #ffccc7' }}>
                                <Space align="start">
                                    <CloseCircleOutlined style={{ color: '#ff4d4f', marginTop: 4, fontSize: 16 }} />
                                    <div>
                                        <Text strong style={{ color: '#cf1322' }}>发送失败</Text>
                                        <div style={{ marginTop: 4, color: '#cf1322', fontFamily: 'monospace', fontSize: 13 }}>
                                            {currentRecord.error_message}
                                        </div>
                                        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                                            <Tag>重试 {currentRecord.retry_count || 0}/{currentRecord.channel?.retry_config?.max_retries || 3}</Tag>
                                            {currentRecord.next_retry_at && (
                                                <Tag color="orange">
                                                    <ClockCircleOutlined /> 下次重试: {formatFullTime(currentRecord.next_retry_at)}
                                                </Tag>
                                            )}
                                        </div>
                                    </div>
                                </Space>
                            </div>
                        )}

                        {/* Basic Info */}
                        <Descriptions title="基本信息" column={2} bordered size="small">
                            <Descriptions.Item label="记录 ID">
                                <Text copyable style={{ fontFamily: 'monospace', fontSize: 12 }}>{currentRecord.id}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="创建时间">{formatFullTime(currentRecord.created_at)}</Descriptions.Item>
                            <Descriptions.Item label="发送渠道">
                                <Space>
                                    <Avatar size="small" style={{
                                        background: getTypeConfig(currentRecord.channel?.type || 'unknown').bg,
                                        color: getTypeConfig(currentRecord.channel?.type || 'unknown').color
                                    }} icon={getTypeConfig(currentRecord.channel?.type || 'unknown').icon} />
                                    {currentRecord.channel?.name || '未知渠道'}
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="关联模板">
                                {currentRecord.template
                                    ? <Tag icon={<FileTextOutlined />}>{currentRecord.template.name}</Tag>
                                    : <Text type="secondary">-</Text>}
                            </Descriptions.Item>
                            <Descriptions.Item label="接收者" span={2}>
                                {currentRecord.recipients && currentRecord.recipients.length > 0
                                    ? currentRecord.recipients.join(', ')
                                    : <Text type="secondary">
                                        {currentRecord.channel?.type === 'webhook' ? '远程终端' :
                                            currentRecord.channel?.type === 'dingtalk' ? '群组机器人' : '无指定接收者'}
                                    </Text>}
                            </Descriptions.Item>
                            <Descriptions.Item label="通知主题" span={2}>
                                <Text strong>{currentRecord.subject || '(无主题)'}</Text>
                            </Descriptions.Item>
                            {currentRecord.sent_at && (
                                <Descriptions.Item label="发送时间" span={2}>
                                    {formatFullTime(currentRecord.sent_at)}
                                </Descriptions.Item>
                            )}
                        </Descriptions>

                        {/* Execution Run Info */}
                        {(currentRecord as any).execution_run && (
                            <>
                                <Divider style={{ margin: 0 }} />
                                <Descriptions title="关联执行" column={2} bordered size="small">
                                    <Descriptions.Item label="任务模板">
                                        <a onClick={(e) => { e.preventDefault(); startTransition(() => { setDetailOpen(false); history.push(`/execution/templates/${(currentRecord as any).execution_run.task_id}?from=/notification/records`); }); }} style={{ cursor: 'pointer' }}>
                                            {(currentRecord as any).execution_run.task?.name || '未知任务'}
                                        </a>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="触发类型">
                                        {(() => {
                                            const triggeredBy = (currentRecord as any).execution_run.triggered_by;
                                            const config = TRIGGERED_BY_CONFIG[triggeredBy] || { label: triggeredBy, color: 'default', icon: <HistoryOutlined /> };
                                            return <Tag icon={config.icon} color={config.color}>{config.label}</Tag>;
                                        })()}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="执行状态">
                                        <Tag color={(currentRecord as any).execution_run.status === 'success' ? 'green' :
                                            (currentRecord as any).execution_run.status === 'failed' ? 'red' : 'orange'}>
                                            {(currentRecord as any).execution_run.status}
                                        </Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="执行记录">
                                        <a onClick={(e) => { e.preventDefault(); startTransition(() => { setDetailOpen(false); history.push(`/execution/runs/${currentRecord.execution_run_id}?from=/notification/records`); }); }} style={{ cursor: 'pointer' }}>查看详情 →</a>
                                    </Descriptions.Item>
                                </Descriptions>
                            </>
                        )}

                        {/* Body Content */}
                        <div>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>通知内容</Text>
                            <div style={{
                                padding: 16, background: '#1e1e1e', color: '#d4d4d4',
                                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                                fontSize: 13, lineHeight: 1.6, borderRadius: 4,
                                maxHeight: 300, overflowY: 'auto'
                            }}>
                                {(() => {
                                    const body = currentRecord.body || '';
                                    try { return JSON.stringify(JSON.parse(body), null, 2); }
                                    catch { return body || '(无内容)'; }
                                })()}
                            </div>
                        </div>

                        {/* Response Data */}
                        {currentRecord.response_data && (
                            <div>
                                <Text strong style={{ display: 'block', marginBottom: 8 }}>渠道响应数据</Text>
                                <div style={{ padding: 16, background: '#1e1e1e', borderRadius: 4, maxHeight: 400, overflowY: 'auto' }}>
                                    <pre style={{
                                        margin: 0, fontSize: 12, lineHeight: 1.5,
                                        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                                        color: '#9cdcfe', whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                                    }}>
                                        {(() => {
                                            const parseNestedJson = (obj: any): any => {
                                                if (typeof obj === 'string') { try { return parseNestedJson(JSON.parse(obj)); } catch { return obj; } }
                                                if (Array.isArray(obj)) return obj.map(parseNestedJson);
                                                if (obj && typeof obj === 'object') {
                                                    const result: any = {};
                                                    for (const [key, value] of Object.entries(obj)) { result[key] = parseNestedJson(value); }
                                                    return result;
                                                }
                                                return obj;
                                            };
                                            const data = currentRecord.response_data;
                                            try {
                                                let parsed = typeof data === 'string' ? JSON.parse(data) : data;
                                                parsed = parseNestedJson(parsed);
                                                return JSON.stringify(parsed, null, 2);
                                            } catch { return typeof data === 'string' ? data : JSON.stringify(data, null, 2); }
                                        })()}
                                    </pre>
                                </div>
                            </div>
                        )}

                        {/* External Message ID */}
                        {(currentRecord as any).external_message_id && (
                            <Descriptions size="small" column={1}>
                                <Descriptions.Item label="外部消息 ID">
                                    <Text copyable style={{ fontFamily: 'monospace', fontSize: 12 }}>
                                        {(currentRecord as any).external_message_id}
                                    </Text>
                                </Descriptions.Item>
                            </Descriptions>
                        )}
                    </div>
                )}
            </Drawer>

            {/* Execution Detail Drawer */}
            <Drawer
                title={
                    <Space>
                        <PlayCircleOutlined />
                        <span>执行详情</span>
                        {execDetail && (
                            <Tag color={execDetail.status === 'success' ? 'green' : execDetail.status === 'failed' ? 'red' : 'orange'}>
                                {execDetail.status}
                            </Tag>
                        )}
                    </Space>
                }
                size={600}
                open={execDetailOpen}
                onClose={() => { setExecDetailOpen(false); setExecDetail(null); }}
                loading={execLoading}
            >
                {execDetail && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <Descriptions title="基本信息" column={2} bordered size="small">
                            <Descriptions.Item label="任务模板" span={2}>
                                <Text strong>{(execDetail as any).task?.name || '未知任务'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="触发类型">
                                {(() => {
                                    const config = TRIGGERED_BY_CONFIG[execDetail.triggered_by] || { label: execDetail.triggered_by, color: 'default', icon: <HistoryOutlined /> };
                                    return <Tag icon={config.icon} color={config.color}>{config.label}</Tag>;
                                })()}
                            </Descriptions.Item>
                            <Descriptions.Item label="执行状态">
                                <Tag color={execDetail.status === 'success' ? 'green' : execDetail.status === 'failed' ? 'red' : 'orange'}>
                                    {execDetail.status}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="开始时间">{execDetail.started_at ? formatFullTime(execDetail.started_at) : '-'}</Descriptions.Item>
                            <Descriptions.Item label="结束时间">{execDetail.ended_at ? formatFullTime(execDetail.ended_at) : '-'}</Descriptions.Item>
                            {execDetail.duration_ms && (
                                <Descriptions.Item label="执行耗时" span={2}>
                                    {(execDetail.duration_ms / 1000).toFixed(2)}s
                                </Descriptions.Item>
                            )}
                        </Descriptions>

                        {(execDetail as any).task?.target_hosts && (
                            <div>
                                <Text strong style={{ display: 'block', marginBottom: 8 }}>目标主机</Text>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {String((execDetail as any).task.target_hosts).split(',').map((host: string) => (
                                        <Tag key={host}>{host}</Tag>
                                    ))}
                                </div>
                            </div>
                        )}

                        {execDetail.status === 'failed' && (execDetail as any).error_message && (
                            <div style={{ padding: '12px 16px', background: '#fff1f0', border: '1px solid #ffccc7' }}>
                                <Space align="start">
                                    <CloseCircleOutlined style={{ color: '#ff4d4f', marginTop: 4, fontSize: 16 }} />
                                    <div>
                                        <Text strong style={{ color: '#cf1322' }}>执行失败</Text>
                                        <div style={{ marginTop: 4, color: '#cf1322', fontFamily: 'monospace', fontSize: 13 }}>
                                            {(execDetail as any).error_message}
                                        </div>
                                    </div>
                                </Space>
                            </div>
                        )}

                        <div style={{ textAlign: 'center', paddingTop: 12 }}>
                            <Button type="link" onClick={() => startTransition(() => { setExecDetailOpen(false); history.push(`/execution/runs/${execDetail.id}?from=/notification/records`); })}>
                                查看完整执行日志 →
                            </Button>
                        </div>
                    </div>
                )}
            </Drawer>
        </>
    );
};

export default NotificationRecords;

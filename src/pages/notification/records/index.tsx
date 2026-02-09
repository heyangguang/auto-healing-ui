import {
    CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
    SyncOutlined, EyeOutlined, MailOutlined, ApiOutlined,
    DingdingOutlined, ReloadOutlined, SendOutlined, BellOutlined,
    ExclamationCircleOutlined, FileTextOutlined,
    RobotOutlined, CalendarOutlined, PlayCircleOutlined, HistoryOutlined,
} from '@ant-design/icons';
import {
    Tag, Button, Drawer, Typography, Descriptions, Space, Tooltip,
    Avatar, message, Select, Input, Divider
} from 'antd';
import { ProTable, ActionType, ProColumns, PageContainer } from '@ant-design/pro-components';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getNotifications, retryNotification, getChannels, getTemplates } from '@/services/auto-healing/notification';
import { getExecutionRun } from '@/services/auto-healing/execution';
import '../../execution/execute/style.css';

const { Text, Title } = Typography;

// ==================== Constants ====================
const CHANNEL_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string; bg: string }> = {
    webhook: { icon: <ApiOutlined />, color: '#722ed1', label: 'WEBHOOK', bg: '#f9f0ff' },
    email: { icon: <MailOutlined />, color: '#1890ff', label: 'EMAIL', bg: '#e6f7ff' },
    dingtalk: { icon: <DingdingOutlined />, color: '#0079f2', label: 'DINGTALK', bg: '#f0f5ff' },
    unknown: { icon: <BellOutlined />, color: '#8c8c8c', label: 'UNKNOWN', bg: '#f5f5f5' },
};

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

// ==================== Main Component ====================
const NotificationRecords: React.FC = () => {
    const actionRef = useRef<ActionType>();
    const [detailOpen, setDetailOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<AutoHealing.Notification | null>(null);
    const [retryLoading, setRetryLoading] = useState<string | null>(null);

    // Execution detail drawer
    const [execDetailOpen, setExecDetailOpen] = useState(false);
    const [execDetail, setExecDetail] = useState<AutoHealing.ExecutionRun | null>(null);
    const [execLoading, setExecLoading] = useState(false);

    // Filter data
    const [channels, setChannels] = useState<AutoHealing.NotificationChannel[]>([]);
    const [templates, setTemplates] = useState<AutoHealing.NotificationTemplate[]>([]);

    // Filter states
    const [searchText, setSearchText] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>();
    const [filterChannel, setFilterChannel] = useState<string>();
    const [filterTemplate, setFilterTemplate] = useState<string>();
    const [filterTriggeredBy, setFilterTriggeredBy] = useState<string>();
    const [taskNameSearch, setTaskNameSearch] = useState('');
    const [sortBy, setSortBy] = useState<string>('created_at');
    const [sortOrder, setSortOrder] = useState<string>('desc');

    // Load filter options
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
            actionRef.current?.reload();
            setDetailOpen(false);
        } catch {
            // 错误消息由全局错误处理器显示
        } finally {
            setRetryLoading(null);
        }
    }, []);

    const handleViewDetail = useCallback((record: AutoHealing.Notification) => {
        setCurrentRecord(record);
        setDetailOpen(true);
    }, []);

    // ==================== Helpers ====================
    const getTypeConfig = (type: string) => CHANNEL_TYPE_CONFIG[type] || CHANNEL_TYPE_CONFIG.unknown;
    const getStatusConfig = (status: string) => STATUS_CONFIG[status] || STATUS_CONFIG.pending;

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '-';
        const date = new Date(timeStr);
        return date.toLocaleString('zh-CN', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatFullTime = (timeStr: string) => {
        if (!timeStr) return '-';
        return new Date(timeStr).toLocaleString('zh-CN');
    };

    // ==================== Table Columns ====================
    const columns: ProColumns<AutoHealing.Notification>[] = [
        {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (_, record) => {
                const config = getStatusConfig(record.status);
                return (
                    <Tag icon={config.icon} color={config.tagColor} style={{ margin: 0 }}>
                        {config.label}
                    </Tag>
                );
            },
        },
        {
            title: '通知渠道',
            key: 'channel',
            width: 180,
            render: (_, record) => {
                const config = getTypeConfig(record.channel?.type || 'unknown');
                return (
                    <Space size={8}>
                        <Avatar
                            size={28}
                            style={{ background: config.bg, color: config.color }}
                            icon={config.icon}
                        />
                        <div style={{ lineHeight: 1.3 }}>
                            <div style={{ fontWeight: 500 }}>{record.channel?.name || '未知渠道'}</div>
                            <div style={{ fontSize: 11, color: '#8c8c8c' }}>{config.label}</div>
                        </div>
                    </Space>
                );
            },
        },
        {
            title: '关联任务',
            key: 'task',
            width: 180,
            render: (_, record) => {
                const execRun = (record as any).execution_run;
                if (!execRun?.task?.name) {
                    return <Text type="secondary">-</Text>;
                }
                const triggeredByConfig = TRIGGERED_BY_CONFIG[execRun.triggered_by] || { label: execRun.triggered_by, color: 'default' };
                return (
                    <div style={{ lineHeight: 1.4 }}>
                        <Tooltip title="点击查看执行详情">
                            <a
                                onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setExecLoading(true);
                                    setExecDetailOpen(true);
                                    try {
                                        const res = await getExecutionRun(record.execution_run_id);
                                        setExecDetail(res.data || res);
                                    } catch {
                                        message.error('加载执行详情失败');
                                    } finally {
                                        setExecLoading(false);
                                    }
                                }}
                                style={{ fontWeight: 500, cursor: 'pointer' }}
                            >
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
            title: '通知主题',
            dataIndex: 'subject',
            width: 220,
            ellipsis: true,
            render: (_, record) => (
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
            title: '错误信息',
            key: 'error',
            width: 200,
            render: (_, record) => {
                const isFailed = record.status === 'failed' || record.status === 'bounced';
                if (!isFailed || !record.error_message) {
                    return <Text type="secondary">-</Text>;
                }
                return (
                    <Tooltip title={record.error_message}>
                        <Text type="secondary" ellipsis style={{ maxWidth: 180 }}>
                            {record.error_message}
                        </Text>
                    </Tooltip>
                );
            },
        },
        {
            title: '发送时间',
            dataIndex: 'sent_at',
            width: 130,
            render: (_, record) => (
                <Text type="secondary">
                    {formatTime(record.sent_at || record.created_at)}
                </Text>
            ),
        },
        {
            title: '操作',
            valueType: 'option',
            width: 100,
            fixed: 'right',
            render: (_, record) => {
                const isFailed = record.status === 'failed' || record.status === 'bounced';
                return (
                    <Space size={4} onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="查看详情">
                            <Button
                                type="text"
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => handleViewDetail(record)}
                            />
                        </Tooltip>
                        {isFailed && (
                            <Tooltip title="重试发送">
                                <Button
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<SyncOutlined />}
                                    loading={retryLoading === record.id}
                                    onClick={() => handleRetry(record.id)}
                                />
                            </Tooltip>
                        )}
                    </Space>
                );
            },
        },
    ];

    // ==================== Render ====================
    return (
        <PageContainer header={{ title: null, breadcrumb: {} }}>
            <div className="mission-control-container" style={{ height: 'auto', overflow: 'visible' }}>
                <div className="launchpad-grid" style={{ height: 'auto', overflow: 'visible' }}>
                    {/* Header */}
                    <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <Space size="large">
                            <Title level={4} style={{ margin: 0 }}><HistoryOutlined /> 通知日志 / LOGS</Title>
                        </Space>
                        <Space wrap>
                            <Input.Search
                                placeholder="搜索主题..."
                                onSearch={val => { setSearchText(val); actionRef.current?.reload(); }}
                                onChange={e => setSearchText(e.target.value)}
                                allowClear
                                style={{ width: 150 }}
                            />
                            <Input.Search
                                placeholder="任务名称..."
                                onSearch={val => { setTaskNameSearch(val); actionRef.current?.reload(); }}
                                onChange={e => setTaskNameSearch(e.target.value)}
                                allowClear
                                style={{ width: 150 }}
                            />
                            <Select
                                placeholder="状态"
                                allowClear
                                style={{ width: 100 }}
                                value={filterStatus}
                                onChange={v => { setFilterStatus(v); actionRef.current?.reload(); }}
                                options={[
                                    { label: '已发送', value: 'sent' },
                                    { label: '已投递', value: 'delivered' },
                                    { label: '失败', value: 'failed' },
                                    { label: '退回', value: 'bounced' },
                                    { label: '待发送', value: 'pending' },
                                ]}
                            />
                            <Select
                                placeholder="渠道"
                                allowClear
                                showSearch
                                optionFilterProp="label"
                                style={{ width: 120 }}
                                value={filterChannel}
                                onChange={v => { setFilterChannel(v); actionRef.current?.reload(); }}
                                options={channels.map(c => ({ label: c.name, value: c.id }))}
                            />
                            <Select
                                placeholder="模板"
                                allowClear
                                showSearch
                                optionFilterProp="label"
                                style={{ width: 120 }}
                                value={filterTemplate}
                                onChange={v => { setFilterTemplate(v); actionRef.current?.reload(); }}
                                options={templates.map(t => ({ label: t.name, value: t.id }))}
                            />
                            <Select
                                placeholder="触发类型"
                                allowClear
                                style={{ width: 120 }}
                                value={filterTriggeredBy}
                                onChange={v => { setFilterTriggeredBy(v); actionRef.current?.reload(); }}
                                options={[
                                    { label: '手动', value: 'manual' },
                                    { label: '定时(Cron)', value: 'scheduler:cron' },
                                    { label: '定时(单次)', value: 'scheduler:once' },
                                    { label: '自愈', value: 'healing' },
                                ]}
                            />
                            <Select
                                placeholder="排序"
                                style={{ width: 130 }}
                                value={`${sortBy}:${sortOrder}`}
                                onChange={v => {
                                    const [field, order] = v.split(':');
                                    setSortBy(field);
                                    setSortOrder(order);
                                    actionRef.current?.reload();
                                }}
                                options={[
                                    { label: '时间 ╬ 新→旧', value: 'created_at:desc' },
                                    { label: '时间 ╬ 旧→新', value: 'created_at:asc' },
                                    { label: '发送时间 ╬ 新→旧', value: 'sent_at:desc' },
                                    { label: '发送时间 ╬ 旧→新', value: 'sent_at:asc' },
                                    { label: '主题 ╬ A→Z', value: 'subject:asc' },
                                    { label: '主题 ╬ Z→A', value: 'subject:desc' },
                                ]}
                            />
                            <Button icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()} />
                        </Space>
                    </div>

                    {/* Table */}
                    <ProTable<AutoHealing.Notification>
                        actionRef={actionRef}
                        rowKey="id"
                        search={false}
                        toolBarRender={false}
                        options={false}
                        onRow={(record) => ({
                            onClick: () => handleViewDetail(record),
                            style: { cursor: 'pointer' },
                        })}
                        request={async (params) => {
                            const res = await getNotifications({
                                page: params.current,
                                page_size: params.pageSize,
                                status: filterStatus,
                                channel_id: filterChannel,
                                template_id: filterTemplate,
                                triggered_by: filterTriggeredBy,
                                search: searchText || undefined,
                                task_name: taskNameSearch || undefined,
                                sort_by: sortBy,
                                sort_order: sortOrder,
                            });
                            return {
                                data: res.data || [],
                                success: true,
                                total: res.total,
                            };
                        }}
                        columns={columns}
                        pagination={{
                            defaultPageSize: 16,
                            showSizeChanger: true,
                            pageSizeOptions: ['16', '32', '64'],
                            showTotal: (total) => `共 ${total} 条`,
                        }}
                        scroll={{ x: 1200 }}
                    />
                </div>

                {/* Detail Drawer */}
                <Drawer
                    title={
                        <Space>
                            <BellOutlined />
                            <span>通知详情</span>
                            {currentRecord && (
                                <Tag
                                    icon={getStatusConfig(currentRecord.status).icon}
                                    color={getStatusConfig(currentRecord.status).tagColor}
                                >
                                    {getStatusConfig(currentRecord.status).label}
                                </Tag>
                            )}
                        </Space>
                    }
                    width={700}
                    open={detailOpen}
                    onClose={() => setDetailOpen(false)}
                    extra={
                        currentRecord && (currentRecord.status === 'failed' || currentRecord.status === 'bounced') && (
                            <Button
                                type="primary"
                                danger
                                icon={<SendOutlined />}
                                loading={retryLoading === currentRecord.id}
                                onClick={() => handleRetry(currentRecord.id)}
                            >
                                重试发送
                            </Button>
                        )
                    }
                >
                    {currentRecord && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {/* Error Alert */}
                            {(currentRecord.status === 'failed' || currentRecord.status === 'bounced') && currentRecord.error_message && (
                                <div style={{
                                    padding: '12px 16px',
                                    background: '#fff1f0',
                                    border: '1px solid #ffccc7',
                                }}>
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
                                    <Text copyable style={{ fontFamily: 'monospace', fontSize: 12 }}>
                                        {currentRecord.id}
                                    </Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="创建时间">
                                    {formatFullTime(currentRecord.created_at)}
                                </Descriptions.Item>
                                <Descriptions.Item label="发送渠道">
                                    <Space>
                                        <Avatar
                                            size="small"
                                            style={{
                                                background: getTypeConfig(currentRecord.channel?.type || 'unknown').bg,
                                                color: getTypeConfig(currentRecord.channel?.type || 'unknown').color
                                            }}
                                            icon={getTypeConfig(currentRecord.channel?.type || 'unknown').icon}
                                        />
                                        {currentRecord.channel?.name || '未知渠道'}
                                    </Space>
                                </Descriptions.Item>
                                <Descriptions.Item label="关联模板">
                                    {currentRecord.template ? (
                                        <Tag icon={<FileTextOutlined />}>{currentRecord.template.name}</Tag>
                                    ) : <Text type="secondary">-</Text>}
                                </Descriptions.Item>
                                <Descriptions.Item label="接收者" span={2}>
                                    {currentRecord.recipients && currentRecord.recipients.length > 0
                                        ? currentRecord.recipients.join(', ')
                                        : (
                                            <Text type="secondary">
                                                {currentRecord.channel?.type === 'webhook' ? '远程终端' :
                                                    currentRecord.channel?.type === 'dingtalk' ? '群组机器人' : '无指定接收者'}
                                            </Text>
                                        )}
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
                                            <a href={`/execution/templates`}>
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
                                            <a href={`/execution/runs/${currentRecord.execution_run_id}`}>
                                                查看详情 →
                                            </a>
                                        </Descriptions.Item>
                                    </Descriptions>
                                </>
                            )}

                            {/* Body Content */}
                            <div>
                                <Text strong style={{ display: 'block', marginBottom: 8 }}>通知内容</Text>
                                <div style={{
                                    padding: 16,
                                    background: '#1e1e1e',
                                    color: '#d4d4d4',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                                    fontSize: 13,
                                    lineHeight: 1.6,
                                    borderRadius: 4,
                                    maxHeight: 300,
                                    overflowY: 'auto'
                                }}>
                                    {(() => {
                                        const body = currentRecord.body || '';
                                        // 尝试格式化JSON
                                        try {
                                            const parsed = JSON.parse(body);
                                            return JSON.stringify(parsed, null, 2);
                                        } catch {
                                            // 不是JSON，直接显示文本（保留换行）
                                            return body || '(无内容)';
                                        }
                                    })()}
                                </div>
                            </div>

                            {/* Response Data */}
                            {currentRecord.response_data && (
                                <div>
                                    <Text strong style={{ display: 'block', marginBottom: 8 }}>渠道响应数据</Text>
                                    <div style={{
                                        padding: 16,
                                        background: '#1e1e1e',
                                        borderRadius: 4,
                                        maxHeight: 400,
                                        overflowY: 'auto'
                                    }}>
                                        <pre style={{
                                            margin: 0,
                                            fontSize: 12,
                                            lineHeight: 1.5,
                                            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                                            color: '#9cdcfe',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word'
                                        }}>
                                            {(() => {
                                                // 递归解析嵌套 JSON
                                                const parseNestedJson = (obj: any): any => {
                                                    if (typeof obj === 'string') {
                                                        try {
                                                            const parsed = JSON.parse(obj);
                                                            return parseNestedJson(parsed);
                                                        } catch {
                                                            return obj;
                                                        }
                                                    }
                                                    if (Array.isArray(obj)) {
                                                        return obj.map(parseNestedJson);
                                                    }
                                                    if (obj && typeof obj === 'object') {
                                                        const result: any = {};
                                                        for (const [key, value] of Object.entries(obj)) {
                                                            result[key] = parseNestedJson(value);
                                                        }
                                                        return result;
                                                    }
                                                    return obj;
                                                };

                                                const data = currentRecord.response_data;
                                                try {
                                                    // 首先解析外层
                                                    let parsed = typeof data === 'string' ? JSON.parse(data) : data;
                                                    // 递归解析内层嵌套字符串
                                                    parsed = parseNestedJson(parsed);
                                                    return JSON.stringify(parsed, null, 2);
                                                } catch {
                                                    return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
                                                }
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
                    width={600}
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
                                <Descriptions.Item label="开始时间">
                                    {execDetail.started_at ? formatFullTime(execDetail.started_at) : '-'}
                                </Descriptions.Item>
                                <Descriptions.Item label="结束时间">
                                    {execDetail.ended_at ? formatFullTime(execDetail.ended_at) : '-'}
                                </Descriptions.Item>
                                {execDetail.duration_ms && (
                                    <Descriptions.Item label="执行耗时" span={2}>
                                        {(execDetail.duration_ms / 1000).toFixed(2)}s
                                    </Descriptions.Item>
                                )}
                            </Descriptions>

                            {/* Target Hosts */}
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

                            {/* Error Message */}
                            {execDetail.status === 'failed' && (execDetail as any).error_message && (
                                <div style={{
                                    padding: '12px 16px',
                                    background: '#fff1f0',
                                    border: '1px solid #ffccc7',
                                }}>
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

                            {/* Link to full page */}
                            <div style={{ textAlign: 'center', paddingTop: 12 }}>
                                <Button
                                    type="link"
                                    href={`/execution/runs/${execDetail.id}`}
                                >
                                    查看完整执行日志 →
                                </Button>
                            </div>
                        </div>
                    )}
                </Drawer>
            </div>
        </PageContainer>
    );
};

export default NotificationRecords;

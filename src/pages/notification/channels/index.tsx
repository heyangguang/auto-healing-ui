import {
    PlusOutlined, SearchOutlined, ReloadOutlined,
    DeleteOutlined, EditOutlined, ApiOutlined,
    MailOutlined, DingdingOutlined, BellOutlined,
    GlobalOutlined, ThunderboltOutlined,
    CheckCircleOutlined, StopOutlined, ExperimentOutlined,
    UserOutlined, SettingOutlined, LinkOutlined, SafetyCertificateOutlined,
    SendOutlined, RobotOutlined, TeamOutlined, EyeOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
    Button, message, Space, Tag, Typography, Input,
    Empty, Switch, Spin, Popconfirm, Row, Col, Pagination, Avatar,
    Form, Select, Modal, Drawer, Alert, InputNumber, Divider,
    Tooltip, Card, Segmented, Descriptions
} from 'antd';
import React, { useState, useEffect, useCallback } from 'react';
import { useAccess } from '@umijs/max';
import {
    getChannels, createChannel, updateChannel, deleteChannel, testChannel
} from '@/services/auto-healing/notification';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

// ==================== Constants ====================
const CHANNEL_TYPE_CONFIG: Record<string, { icon: React.ReactElement; color: string; label: string; bg: string }> = {
    webhook: { icon: <ApiOutlined style={{ fontSize: 24 }} />, color: '#722ed1', label: 'WEBHOOK', bg: '#f9f0ff' },
    email: { icon: <MailOutlined style={{ fontSize: 24 }} />, color: '#1890ff', label: 'EMAIL', bg: '#e6f7ff' },
    dingtalk: { icon: <DingdingOutlined style={{ fontSize: 24 }} />, color: '#0079f2', label: 'DINGTALK', bg: '#f0f5ff' },
};

// ==================== Main Page Component ====================
const NotificationChannelsPage: React.FC = () => {
    const access = useAccess();
    // Data State
    const [channels, setChannels] = useState<AutoHealing.NotificationChannel[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Pagination & Filters
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [pageSize, setPageSize] = useState(16); // Default 16 for full screen grid
    const [searchText, setSearchText] = useState('');
    const [filterType, setFilterType] = useState<string>('');

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [editingChannel, setEditingChannel] = useState<AutoHealing.NotificationChannel | null>(null);
    const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
    const [detailChannel, setDetailChannel] = useState<AutoHealing.NotificationChannel | null>(null);

    const [channelType, setChannelType] = useState<AutoHealing.ChannelType | undefined>(undefined);
    const [webhookAuthType, setWebhookAuthType] = useState<'headers' | 'basic'>('headers');
    const [form] = Form.useForm();
    const [submitLoading, setSubmitLoading] = useState(false);

    // ==================== Data Loading ====================
    const loadChannels = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getChannels({
                page: currentPage,
                page_size: pageSize,
                type: filterType as AutoHealing.ChannelType || undefined,
            });
            let data = res.data || [];
            // Client-side search (API may not support search param)
            if (searchText) {
                const lower = searchText.toLowerCase();
                data = data.filter(c => c.name.toLowerCase().includes(lower) || c.description?.toLowerCase().includes(lower));
            }
            setChannels(data);
            setTotal(res.total || data.length);
        } catch (error) {
            console.error('Failed to load channels:', error);
            message.error('加载渠道列表失败');
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, filterType, searchText]);

    useEffect(() => {
        loadChannels();
    }, [loadChannels]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchText, filterType]);

    // ==================== Actions ====================
    const handleToggle = async (channel: AutoHealing.NotificationChannel, checked: boolean) => {
        const originalState = channel.is_active; // Backup for rollback
        // Optimistic update: update local state immediately
        setChannels(prev => prev.map(c => c.id === channel.id ? { ...c, is_active: checked } : c));

        setActionLoading(channel.id);
        try {
            await updateChannel(channel.id, { is_active: checked });
            message.success(checked ? '渠道已启用' : '渠道已禁用');
        } catch {
            // 回滚状态，错误消息由全局错误处理器显示
            setChannels(prev => prev.map(c => c.id === channel.id ? { ...c, is_active: originalState } : c));
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (channel: AutoHealing.NotificationChannel) => {
        setActionLoading(channel.id);
        try {
            await deleteChannel(channel.id);
            message.success('渠道已删除');
            // Optimistic update: remove from local state
            setChannels(prev => prev.filter(c => c.id !== channel.id));
            setTotal(prev => Math.max(0, prev - 1));
        } catch {
            // 错误消息由全局错误处理器显示
        } finally {
            setActionLoading(null);
        }
    };

    const handleTest = async (channel: AutoHealing.NotificationChannel) => {
        setActionLoading(channel.id);
        try {
            await testChannel(channel.id);
            message.success('测试消息已发送');
        } catch {
            // 错误消息由全局错误处理器显示
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreate = () => {
        setEditingChannel(null);
        setChannelType(undefined);
        setWebhookAuthType('headers');
        form.resetFields();
        setModalOpen(true);
    };

    const handleEdit = (channel: AutoHealing.NotificationChannel) => {
        setEditingChannel(channel);
        setChannelType(channel.type);
        form.setFieldsValue({
            name: channel.name,
            type: channel.type,
            description: channel.description,
            recipients: channel.recipients,
            is_default: channel.is_default,
            max_retries: channel.retry_config?.max_retries ?? 3,
            rate_limit_per_minute: channel.rate_limit_per_minute,
        });
        // Set individual interval fields
        const intervals = channel.retry_config?.retry_intervals || [1, 5, 15];
        intervals.forEach((val: number, idx: number) => {
            form.setFieldValue(`interval_${idx}`, val);
        });
        // Determine auth type based on existing config
        if (channel.type === 'webhook' && (channel as any).config?.username) {
            setWebhookAuthType('basic');
        } else {
            setWebhookAuthType('headers');
        }
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        try {
            setSubmitLoading(true);
            const values = await form.validateFields();

            // Build config object based on type
            const config: Record<string, any> = {};
            if (values.type === 'webhook') {
                if (values.webhook_url) config.url = values.webhook_url;
                if (values.method) config.method = values.method;
                if (values.timeout_seconds) config.timeout_seconds = values.timeout_seconds;
                if (values.timeout_seconds) config.timeout_seconds = values.timeout_seconds;

                // Mutually exclusive auth config
                if (webhookAuthType === 'headers') {
                    if (values.headers) {
                        try { config.headers = JSON.parse(values.headers); } catch (e) { /* ignore */ }
                    }
                } else if (webhookAuthType === 'basic') {
                    if (values.username) config.username = values.username;
                    if (values.password) config.password = values.password;
                }
            } else if (values.type === 'email') {
                if (values.smtp_host) config.smtp_host = values.smtp_host;
                if (values.smtp_port) config.smtp_port = values.smtp_port;
                if (values.username) config.username = values.username;
                if (values.password) config.password = values.password;
                if (values.from_address) config.from_address = values.from_address;
                config.use_tls = values.use_tls ?? true;
            } else if (values.type === 'dingtalk') {
                if (values.webhook_url) config.webhook_url = values.webhook_url;
                if (values.secret) config.secret = values.secret;
            }

            const maxRetries = values.max_retries ?? 3;
            const retryIntervals: number[] = [];
            for (let i = 0; i < maxRetries; i++) {
                const val = values[`interval_${i}`];
                retryIntervals.push(val ?? (i === 0 ? 1 : i === 1 ? 5 : 15));
            }
            const retry_config = {
                max_retries: maxRetries,
                retry_intervals: retryIntervals,
            };

            const payload: AutoHealing.CreateChannelRequest = {
                name: values.name,
                type: values.type,
                description: values.description,
                config: Object.keys(config).length > 0 ? config : {},
                retry_config,
                default_recipients: values.recipients || [],
                is_default: values.is_default || false,
            };

            if (editingChannel) {
                await updateChannel(editingChannel.id, payload);
                message.success('渠道已更新');
            } else {
                await createChannel(payload);
                message.success('渠道已创建');
            }

            setModalOpen(false);
            loadChannels();
        } catch (error) {
            if (!(error as any).errorFields) {
                message.error('保存失败');
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleViewDetail = (channel: AutoHealing.NotificationChannel) => {
        setDetailChannel(channel);
        setDetailDrawerOpen(true);
    };

    const renderDetailDrawer = () => {
        if (!detailChannel) return null;
        const typeConfig = getTypeConfig(detailChannel.type);

        return (
            <Drawer
                title={
                    <Space>
                        {typeConfig.icon}
                        <span>{detailChannel.name}</span>
                        {detailChannel.is_default && <Tag color="gold">默认</Tag>}
                    </Space>
                }
                width={600}
                open={detailDrawerOpen}
                onClose={() => setDetailDrawerOpen(false)}
                extra={
                    <Space>
                        <Button onClick={() => { setDetailDrawerOpen(false); handleTest(detailChannel); }}>测试通道</Button>
                        <Button type="primary" onClick={() => { setDetailDrawerOpen(false); handleEdit(detailChannel); }}>编辑</Button>
                    </Space>
                }
            >
                <Card size="small" style={{ marginBottom: 16 }}>
                    <Descriptions column={2} size="small" bordered>
                        <Descriptions.Item label="类型">
                            <Tag color={typeConfig.color}>{typeConfig.label}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="状态">
                            <Tag color={detailChannel.is_active ? 'success' : 'error'}>
                                {detailChannel.is_active ? '启用' : '禁用'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="限流">
                            {(detailChannel.rate_limit_per_minute ?? 0) > 0
                                ? `${detailChannel.rate_limit_per_minute} 次/分`
                                : '无限制'}
                        </Descriptions.Item>
                        <Descriptions.Item label="重试机制">
                            {detailChannel.retry_config?.max_retries || 0} 次
                            ({(detailChannel.retry_config?.retry_intervals || []).join(', ')}s)
                        </Descriptions.Item>
                        <Descriptions.Item label="描述" span={2}>
                            {detailChannel.description || '无描述'}
                        </Descriptions.Item>
                        <Descriptions.Item label="更新时间" span={2}>
                            {detailChannel.updated_at ? new Date(detailChannel.updated_at).toLocaleString() : '-'}
                        </Descriptions.Item>
                    </Descriptions>
                </Card>

                <Alert
                    message="配置详情"
                    description="敏感配置信息（如 Webhook URL、密码、密钥等）出于安全原因不在详情中显示。如需修改配置，请点击「编辑」按钮。"
                    type="info"
                    style={{ marginBottom: 16 }}
                />

                <Card size="small" title={`接收者列表 (${detailChannel.recipients?.length || 0})`}>
                    {detailChannel.recipients && detailChannel.recipients.length > 0 ? (
                        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                            {detailChannel.recipients.map((r, i) => (
                                <div key={i} style={{
                                    padding: '8px 12px',
                                    borderBottom: '1px solid #f0f0f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8
                                }}>
                                    <UserOutlined style={{ color: '#8c8c8c' }} />
                                    <Text copyable>{r}</Text>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无接收者" />
                    )}
                </Card>
            </Drawer>
        );
    };

    // ==================== Render Helpers ====================
    const getTypeConfig = (type: string) => CHANNEL_TYPE_CONFIG[type] || { icon: <GlobalOutlined style={{ fontSize: 24 }} />, color: '#8c8c8c', label: type, bg: '#f5f5f5' };

    const renderConfigFields = () => {
        if (!channelType) {
            return <Empty description="请先选择渠道类型" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
        }

        if (channelType === 'webhook') {
            return (
                <>
                    <Form.Item label="Webhook URL" name="webhook_url" rules={[{ required: !editingChannel, message: '请输入 URL' }]}>
                        <Input placeholder="https://example.com/webhook" />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="请求方法" name="method" initialValue="POST">
                                <Select options={[{ value: 'POST' }, { value: 'GET' }, { value: 'PUT' }]} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="超时秒数" name="timeout_seconds" initialValue={30}>
                                <InputNumber min={1} max={300} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation={'left' as any} style={{ fontSize: 12, color: '#8c8c8c', margin: '12px 0' }}>认证配置</Divider>

                    <Form.Item label="认证方式" style={{ marginBottom: 12 }}>
                        <Segmented
                            value={webhookAuthType}
                            onChange={v => setWebhookAuthType(v as 'headers' | 'basic')}
                            options={[
                                { label: 'Custom Headers / Token', value: 'headers' },
                                { label: 'Basic Auth', value: 'basic' }
                            ]}
                        />
                    </Form.Item>

                    {webhookAuthType === 'headers' ? (
                        <Form.Item
                            label="自定义 Headers (JSON)"
                            name="headers"
                            tooltip="在此处配置 Authorization 头或其他 Token"
                        >
                            <TextArea placeholder='{"Authorization": "Bearer <token>", "X-Custom-Header": "value"}' autoSize={{ minRows: 2, maxRows: 4 }} />
                        </Form.Item>
                    ) : (
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="密码" name="password" rules={[{ required: !editingChannel, message: '请输入密码' }]}>
                                    <Input.Password placeholder={editingChannel ? '留空保持不变' : ''} />
                                </Form.Item>
                            </Col>
                        </Row>
                    )}
                </>
            );
        }

        if (channelType === 'email') {
            return (
                <>
                    <Row gutter={16}>
                        <Col span={16}>
                            <Form.Item label="SMTP 服务器" name="smtp_host" rules={[{ required: !editingChannel, message: '请输入 SMTP 地址' }]}>
                                <Input placeholder="smtp.example.com" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="端口" name="smtp_port" initialValue={587}>
                                <InputNumber style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="用户名" name="username" rules={[{ required: !editingChannel, message: '请输入用户名' }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="密码" name="password" rules={[{ required: !editingChannel, message: '请输入密码' }]}>
                                <Input.Password placeholder={editingChannel ? '留空保持不变' : ''} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label="发送方地址" name="from_address">
                        <Input placeholder="noreply@example.com" />
                    </Form.Item>
                    <Form.Item name="use_tls" valuePropName="checked" initialValue={true}>
                        <Switch checkedChildren="启用 TLS" unCheckedChildren="禁用 TLS" />
                    </Form.Item>
                </>
            );
        }

        if (channelType === 'dingtalk') {
            return (
                <>
                    <Form.Item label="Webhook URL" name="webhook_url" rules={[{ required: !editingChannel, message: '请输入钉钉机器人 Webhook' }]}>
                        <Input placeholder="https://oapi.dingtalk.com/robot/send?access_token=xxx" />
                    </Form.Item>
                    <Form.Item label="加签密钥" name="secret">
                        <Input.Password placeholder={editingChannel ? '留空保持不变' : 'SEC...'} />
                    </Form.Item>
                </>
            );
        }

        return null;
    };

    const getChannelEndpoint = (channel: AutoHealing.NotificationChannel) => {
        return channel.description || '无详细描述';
    };

    // ==================== Main Render ====================
    return (
        <PageContainer ghost header={{ title: <><BellOutlined /> 通知渠道 / CHANNELS</>, subTitle: `${total} 个接入口` }}>
            <div className="mission-control-container" style={{ height: 'auto', overflow: 'visible' }}>
                <div className="launchpad-grid" style={{ height: 'auto', overflow: 'visible' }}>
                    {/* Toolbar */}
                    <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <Space wrap>
                            <Input
                                placeholder="搜索渠道..."
                                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                                allowClear
                                style={{ width: 220, borderRadius: 2 }}
                            />
                            <Select
                                placeholder="类型"
                                value={filterType || undefined}
                                onChange={v => setFilterType(v || '')}
                                allowClear
                                style={{ width: 120, borderRadius: 2 }}
                                options={[
                                    { label: 'Webhook', value: 'webhook' },
                                    { label: '邮件', value: 'email' },
                                    { label: '钉钉', value: 'dingtalk' },
                                ]}
                            />
                            <Button icon={<ReloadOutlined />} onClick={loadChannels} loading={loading} />
                            <Button type="primary" icon={<PlusOutlined />} disabled={!access.canCreateChannel} onClick={handleCreate}>
                                新建渠道
                            </Button>
                        </Space>
                    </div>

                    {/* Content: Ticket Style Grid */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
                    ) : channels.length === 0 ? (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={<Text type="secondary">暂无通知渠道配置</Text>}
                        >
                            <Button type="dashed" onClick={handleCreate}>创建第一个渠道</Button>
                        </Empty>
                    ) : (
                        <Row gutter={[24, 24]}>
                            {channels.map(channel => {
                                const typeConfig = getTypeConfig(channel.type);

                                return (
                                    <Col key={channel.id} xs={24} sm={12} md={12} lg={8} xl={6} xxl={6}>
                                        <div
                                            className="ticket-card"
                                            onClick={() => handleViewDetail(channel)}
                                            style={{
                                                display: 'flex',
                                                height: 160,
                                                borderRadius: 4,
                                                border: '1px solid #d9d9d9',
                                                overflow: 'hidden',
                                                background: '#fff',
                                                boxShadow: '0 2px 4px 0 rgba(0,0,0,0.02)',
                                                transition: 'all 0.2s',
                                                position: 'relative',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {/* Left Stub: Visual Identity (Ultra Slim) */}
                                            <div style={{
                                                width: 64,
                                                minWidth: 64,
                                                background: channel.is_active ? typeConfig.bg : '#f5f5f5',
                                                borderRight: '1px dashed #d9d9d9',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '8px 4px',
                                                flexShrink: 0,
                                                position: 'relative'
                                            }}>
                                                {/* Default Badge - Restored to Left */}
                                                {channel.is_default && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: 0,
                                                        height: 0,
                                                        borderTop: '24px solid #1890ff',
                                                        borderRight: '24px solid transparent',
                                                        zIndex: 1
                                                    }}>
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: -22,
                                                            left: 2,
                                                            color: '#fff',
                                                            fontSize: 10,
                                                            fontWeight: 'bold',
                                                            transform: 'scale(0.8)'
                                                        }}>D</div>
                                                    </div>
                                                )}

                                                {/* Icon & Type */}
                                                <div style={{
                                                    flex: 1,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: 4
                                                }}>
                                                    <div style={{
                                                        color: channel.is_active ? typeConfig.color : '#bfbfbf',
                                                        opacity: channel.is_active ? 1 : 0.8
                                                    }}>
                                                        {React.cloneElement(typeConfig.icon as React.ReactElement<{ style?: React.CSSProperties }>, { style: { fontSize: 22 } })}
                                                    </div>
                                                    <div style={{
                                                        fontSize: 9,
                                                        fontWeight: 700,
                                                        color: channel.is_active ? typeConfig.color : '#8c8c8c',
                                                        letterSpacing: 0,
                                                        textAlign: 'center',
                                                        lineHeight: 1
                                                    }}>
                                                        {typeConfig.label}
                                                    </div>
                                                </div>

                                                {/* Switch */}
                                                <div onClick={e => e.stopPropagation()} style={{ marginBottom: 4 }}>
                                                    <Switch
                                                        size="small"
                                                        checked={channel.is_active}
                                                        onChange={c => handleToggle(channel, c)}
                                                        loading={actionLoading === channel.id}
                                                        disabled={!access.canUpdateChannel}
                                                    />
                                                </div>
                                            </div>

                                            {/* Right Section: Info & Config */}
                                            <div style={{
                                                flex: 1,
                                                padding: '10px 14px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                minWidth: 0
                                            }}>
                                                {/* Top: Header */}
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <Text strong style={{ fontSize: 14, marginBottom: 4, color: channel.is_active ? '#262626' : '#8c8c8c' }} ellipsis>
                                                            {channel.name}
                                                        </Text>
                                                    </div>

                                                    {/* Endpoint / Description */}
                                                    <div style={{
                                                        marginBottom: 8,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                        background: '#fafafa',
                                                        padding: '4px 6px',
                                                        borderRadius: 2,
                                                        border: '1px solid #f0f0f0'
                                                    }}>
                                                        <LinkOutlined style={{ fontSize: 10, color: '#bfbfbf' }} />
                                                        <Text type="secondary" style={{ fontSize: 11, width: '100%' }} ellipsis={{ tooltip: getChannelEndpoint(channel) || channel.description }}>
                                                            {getChannelEndpoint(channel) || channel.description || '-'}
                                                        </Text>
                                                    </div>
                                                </div>

                                                {/* Middle: Operational Metrics */}
                                                <div style={{
                                                    display: 'flex',
                                                    gap: 8,
                                                    marginBottom: 8,
                                                    fontSize: 11,
                                                    color: '#8c8c8c',
                                                    alignItems: 'center',
                                                    whiteSpace: 'nowrap',
                                                    flexShrink: 0
                                                }}>
                                                    <Tooltip title="最大重试次数">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <SafetyCertificateOutlined />
                                                            <span>{channel.retry_config?.max_retries ?? 3} 次</span>
                                                        </div>
                                                    </Tooltip>
                                                    <Divider type="vertical" style={{ margin: 0, height: 10 }} />
                                                    <Tooltip title="速率限制">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <ThunderboltOutlined />
                                                            <span>{channel.rate_limit_per_minute ? `${channel.rate_limit_per_minute}/m` : '∞'}</span>
                                                        </div>
                                                    </Tooltip>
                                                </div>

                                                {/* Bottom: Footer (Recipients & Actions) */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: 8, flexWrap: 'wrap', gap: 4 }}>
                                                    {/* Semantic Recipient Info */}
                                                    {(() => {
                                                        if (channel.type === 'dingtalk') {
                                                            const hasRecipients = channel.recipients && channel.recipients.length > 0;
                                                            return (
                                                                <Tooltip title={hasRecipients ? `会@提醒: ${channel.recipients.join(', ')}` : '直接推送到钉钉群组'}>
                                                                    <Space size={4} style={{ cursor: 'help' }}>
                                                                        {hasRecipients ? <TeamOutlined style={{ fontSize: 13, color: '#8c8c8c' }} /> : <RobotOutlined style={{ fontSize: 13, color: '#8c8c8c' }} />}
                                                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                                                            {hasRecipients ? `${channel.recipients.length} @提醒` : '群组机器人'}
                                                                        </Text>
                                                                    </Space>
                                                                </Tooltip>
                                                            );
                                                        }
                                                        if (channel.type === 'webhook') {
                                                            return (
                                                                <Tooltip title="通过 Webhook 推送数据">
                                                                    <Space size={4} style={{ cursor: 'help' }}>
                                                                        <ApiOutlined style={{ fontSize: 13, color: '#8c8c8c' }} />
                                                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                                                            远程终端
                                                                        </Text>
                                                                    </Space>
                                                                </Tooltip>
                                                            );
                                                        }
                                                        return (
                                                            <Tooltip title={channel.recipients?.length ? (
                                                                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                                                                    {channel.recipients.join(', ')}
                                                                </div>
                                                            ) : '无接收者'}>
                                                                <Space size={4} style={{ cursor: 'help' }}>
                                                                    <UserOutlined style={{ fontSize: 13, color: '#8c8c8c' }} />
                                                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                                                        {channel.recipients?.length || 0} 接收者
                                                                    </Text>
                                                                </Space>
                                                            </Tooltip>
                                                        );
                                                    })()}

                                                    {/* Actions */}
                                                    <div style={{ display: 'flex', gap: 2 }} onClick={e => e.stopPropagation()}>
                                                        <Tooltip title="查看详情">
                                                            <Button
                                                                type="text"
                                                                size="small"
                                                                icon={<EyeOutlined style={{ fontSize: 13, color: '#8c8c8c' }} />}
                                                                onClick={() => handleViewDetail(channel)}
                                                            />
                                                        </Tooltip>
                                                        <Tooltip title="测试发送">
                                                            <Button
                                                                type="text"
                                                                size="small"
                                                                icon={<SendOutlined style={{ fontSize: 13, color: '#8c8c8c' }} />}
                                                                onClick={() => handleTest(channel)}
                                                                loading={actionLoading === channel.id}
                                                                disabled={!access.canTestChannel}
                                                            />
                                                        </Tooltip>
                                                        <Tooltip title="编辑配置">
                                                            <Button
                                                                type="text"
                                                                size="small"
                                                                icon={<EditOutlined style={{ fontSize: 13, color: '#8c8c8c' }} />}
                                                                onClick={() => handleEdit(channel)}
                                                                disabled={!access.canUpdateChannel}
                                                            />
                                                        </Tooltip>
                                                        <Popconfirm
                                                            title="确定删除该渠道?"
                                                            onConfirm={() => handleDelete(channel)}
                                                            okText="确定"
                                                            cancelText="取消"
                                                            okButtonProps={{ danger: true, size: 'small' }}
                                                            cancelButtonProps={{ size: 'small' }}
                                                        >
                                                            <Button
                                                                type="text"
                                                                danger
                                                                size="small"
                                                                disabled={!access.canDeleteChannel}
                                                                icon={<DeleteOutlined style={{ fontSize: 13, opacity: 0.6 }} />}
                                                            />
                                                        </Popconfirm>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Col>
                                );
                            })}
                        </Row>
                    )}

                    {/* Pagination */}
                    {!loading && total > 0 && (
                        <div style={{ marginTop: 24, paddingBottom: 24, display: 'flex', justifyContent: 'flex-end' }}>
                            <Pagination
                                current={currentPage}
                                pageSize={pageSize}
                                total={total}
                                onChange={(page, size) => {
                                    setCurrentPage(page);
                                    setPageSize(size);
                                }}
                                showSizeChanger={true}
                                pageSizeOptions={['16', '32', '64']}
                                showQuickJumper
                                showTotal={t => `共 ${t} 条`}
                            />
                        </div>
                    )}
                </div>

                {/* Create/Edit Drawer */}
                <Drawer
                    title={editingChannel ? `编辑通知渠道: ${editingChannel.name}` : '新建通知渠道'}
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    width={600}
                    destroyOnClose
                    footer={
                        <div style={{ textAlign: 'right' }}>
                            <Button onClick={() => setModalOpen(false)} style={{ marginRight: 8 }}>
                                取消
                            </Button>
                            <Button onClick={handleSubmit} type="primary" loading={submitLoading}>
                                提交
                            </Button>
                        </div>
                    }
                >
                    <Form form={form} layout="vertical">
                        {editingChannel && (
                            <Alert
                                message="敏感配置保护中"
                                description="出于安全考虑，URL、密码和密钥等敏感信息不会回显。如需修改，请直接输入新值覆盖；留空则保持原有配置不变。"
                                type="info"
                                showIcon
                                style={{ marginBottom: 24 }}
                            />
                        )}

                        {/* Basic Info */}
                        <Card type="inner" title="基本信息" size="small" style={{ marginBottom: 16 }}>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="渠道名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
                                        <Input placeholder="例如：运维告警群" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="渠道类型" name="type" rules={[{ required: true, message: '请选择类型' }]}>
                                        <Select
                                            onChange={v => setChannelType(v)}
                                            disabled={!!editingChannel}
                                            options={[
                                                { label: 'Webhook (通用)', value: 'webhook' },
                                                { label: '邮件 (Email)', value: 'email' },
                                                { label: '钉钉 (DingTalk)', value: 'dingtalk' },
                                            ]}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Form.Item label="描述" name="description" style={{ marginBottom: 0 }}>
                                <TextArea rows={2} placeholder="可选的描述信息" />
                            </Form.Item>
                        </Card>

                        <Card type="inner" title="连接配置" size="small" style={{ marginBottom: 16 }}>
                            {renderConfigFields()}
                        </Card>

                        <Card type="inner" title="策略与接收人" size="small">
                            <Form.Item label="默认接收人列表" name="recipients" help="输入邮箱或手机号后回车添加">
                                <Select
                                    mode="tags"
                                    placeholder="输入..."
                                    style={{ width: '100%' }}
                                    tokenSeparators={[',', ' ']}
                                />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="最大重试次数" name="max_retries" initialValue={3}>
                                        <Select
                                            options={[
                                                { value: 0, label: '不重试' },
                                                { value: 1, label: '1 次' },
                                                { value: 2, label: '2 次' },
                                                { value: 3, label: '3 次' },
                                            ]}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="速率限制 (条/分)" name="rate_limit_per_minute">
                                        <InputNumber min={1} style={{ width: '100%' }} placeholder="默认无限制" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.max_retries !== curr.max_retries}>
                                {({ getFieldValue }) => {
                                    const count = getFieldValue('max_retries') || 0;
                                    if (count === 0) return null;
                                    return (
                                        <Form.Item label="重试间隔配置 (分钟)">
                                            <div style={{ display: 'flex', gap: 16 }}>
                                                {Array.from({ length: count }).map((_, idx) => (
                                                    <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                                                        <span style={{ marginRight: 8, fontSize: 12, color: '#8c8c8c', whiteSpace: 'nowrap' }}>
                                                            第 {idx + 1} 次:
                                                        </span>
                                                        <Form.Item
                                                            name={`interval_${idx}`}
                                                            initialValue={idx === 0 ? 1 : idx === 1 ? 5 : 15}
                                                            rules={[{ required: true, message: '必填' }]}
                                                            noStyle
                                                        >
                                                            <InputNumber min={1} max={1440} style={{ width: 110 }} />
                                                        </Form.Item>
                                                    </div>
                                                ))}
                                            </div>
                                        </Form.Item>
                                    );
                                }}
                            </Form.Item>

                            <Form.Item name="is_default" valuePropName="checked" label="设为默认渠道" style={{ marginBottom: 0 }}>
                                <Switch />
                            </Form.Item>
                        </Card>
                    </Form>
                </Drawer>

                {/* 详情抽屉 */}
                {renderDetailDrawer()}
            </div>
        </PageContainer>
    );
};

export default NotificationChannelsPage;

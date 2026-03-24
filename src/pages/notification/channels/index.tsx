import {
    DeleteOutlined, EditOutlined, ApiOutlined,
    MailOutlined, DingdingOutlined, BellOutlined,
    GlobalOutlined, ThunderboltOutlined,
    CheckCircleOutlined, StopOutlined,
    UserOutlined, SafetyCertificateOutlined,
    SendOutlined, RobotOutlined, TeamOutlined, EyeOutlined,
    LinkOutlined
} from '@ant-design/icons';
import {
    Button, message, Space, Tag, Typography,
    Empty, Switch, Spin, Popconfirm, Row, Col, Pagination,
    Drawer, Alert, Card, Descriptions, Tooltip, Divider
} from 'antd';
import React, { useState, useEffect, useCallback } from 'react';
import { history } from '@umijs/max';
import { useAccess } from '@umijs/max';
import StandardTable from '@/components/StandardTable';
import {
    getChannels, deleteChannel, testChannel, updateChannel
} from '@/services/auto-healing/notification';
import './index.css';
import { CHANNEL_TYPE_CONFIG, getChannelTypeConfig } from '@/constants/notificationDicts';

const { Text } = Typography;

const getTypeConfig = (type: string) => getChannelTypeConfig(type);

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
    const [pageSize, setPageSize] = useState(12);
    const [searchText, setSearchText] = useState('');
    const [filterType, setFilterType] = useState<string>('');

    // Detail Drawer
    const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
    const [detailChannel, setDetailChannel] = useState<AutoHealing.NotificationChannel | null>(null);

    // ==================== Data Loading ====================
    const loadChannels = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getChannels({
                page: currentPage,
                page_size: pageSize,
                type: filterType as AutoHealing.ChannelType || undefined,
                name: searchText || undefined,
            } as any);
            setChannels(res.data || []);
            setTotal(res.total || 0);
        } catch (error) {
            console.error('Failed to load channels:', error);
            /* global error handler */
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, filterType, searchText]);

    useEffect(() => {
        loadChannels();
    }, [loadChannels]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchText, filterType]);

    // StandardTable onSearch callback
    const handleSearchChange = useCallback((params: { searchField?: string; searchValue?: string; advancedSearch?: Record<string, any>; filters?: { field: string; value: string }[] }) => {
        const filters = params.filters || [];
        const nameFilter = filters.find(f => f.field === 'name');
        const typeFilter = filters.find(f => f.field === '__enum__type') || filters.find(f => f.field === 'type');
        const advType = params.advancedSearch?.type;
        const advName = params.advancedSearch?.name;
        setSearchText(nameFilter?.value || advName || '');
        setFilterType(typeFilter?.value || advType || '');
    }, []);

    // ==================== Actions ====================
    const handleToggle = async (channel: AutoHealing.NotificationChannel, checked: boolean) => {
        const originalState = channel.is_active;
        setChannels(prev => prev.map(c => c.id === channel.id ? { ...c, is_active: checked } : c));
        setActionLoading(channel.id);
        try {
            await updateChannel(channel.id, { is_active: checked });
            message.success(checked ? '渠道已启用' : '渠道已禁用');
        } catch {
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
            const nextTotal = Math.max(0, total - 1);
            const nextPage = Math.min(currentPage, Math.max(1, Math.ceil(nextTotal / pageSize)));
            setChannels(prev => prev.filter(c => c.id !== channel.id));
            setTotal(nextTotal);
            if (nextPage !== currentPage) {
                setCurrentPage(nextPage);
            } else {
                loadChannels();
            }
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
            message.success('连接测试成功');
        } catch {
            // 错误消息由全局错误处理器显示
        } finally {
            setActionLoading(null);
        }
    };

    const handleViewDetail = (channel: AutoHealing.NotificationChannel) => {
        setDetailChannel(channel);
        setDetailDrawerOpen(true);
    };

    // ==================== Detail Drawer ====================
    const renderDetailDrawer = () => {
        if (!detailChannel) return null;
        const typeConfig = getTypeConfig(detailChannel.type);

        return (
            <Drawer
                title={
                    <Space>
                        {React.cloneElement(typeConfig.icon as React.ReactElement<{ style?: React.CSSProperties }>, { style: { fontSize: 18, color: typeConfig.color } })}
                        <span>{detailChannel.name}</span>
                        {detailChannel.is_default && <Tag color="gold">默认</Tag>}
                    </Space>
                }
                size={600}
                open={detailDrawerOpen}
                onClose={() => setDetailDrawerOpen(false)}
                extra={
                    <Space>
                        <Button onClick={() => { setDetailDrawerOpen(false); handleTest(detailChannel); }} disabled={!access.canTestChannel}>测试通道</Button>
                        <Button type="primary" onClick={() => { setDetailDrawerOpen(false); history.push(`/notification/channels/${detailChannel.id}/edit`); }} disabled={!access.canUpdateChannel}>编辑</Button>
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
    const getChannelEndpoint = (channel: AutoHealing.NotificationChannel) => {
        return channel.description || '无详细描述';
    };

    const renderRecipientInfo = (channel: AutoHealing.NotificationChannel) => {
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
                        <Text type="secondary" style={{ fontSize: 11 }}>远程终端</Text>
                    </Space>
                </Tooltip>
            );
        }
        return (
            <Tooltip title={channel.recipients?.length ? channel.recipients.join(', ') : '无接收者'}>
                <Space size={4} style={{ cursor: 'help' }}>
                    <UserOutlined style={{ fontSize: 13, color: '#8c8c8c' }} />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        {channel.recipients?.length || 0} 接收者
                    </Text>
                </Space>
            </Tooltip>
        );
    };

    // ==================== Main Render ====================
    return (
        <StandardTable<AutoHealing.NotificationChannel>
            tabs={[{ key: 'grid', label: '渠道列表' }]}
            title="通知渠道"
            description={`管理通知渠道配置，当前共 ${total} 个渠道`}
            headerIcon={
                <svg viewBox="0 0 48 48" fill="none">
                    <path d="M24 6v4M24 38v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M10 24c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path d="M8 28h32v2a4 4 0 01-4 4H12a4 4 0 01-4-4v-2z" stroke="currentColor" strokeWidth="2" fill="none" />
                    <circle cx="24" cy="38" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
            }
            searchFields={[
                { key: 'name', label: '渠道名称' },
            ]}
            columns={[
                {
                    columnKey: 'type',
                    columnTitle: '渠道类型',
                    dataIndex: 'type',
                    headerFilters: [
                        { label: 'Webhook', value: 'webhook' },
                        { label: '邮件', value: 'email' },
                        { label: '钉钉', value: 'dingtalk' },
                    ],
                },
            ]}
            onSearch={handleSearchChange}
            primaryActionLabel="新建渠道"
            primaryActionDisabled={!access.canCreateChannel}
            onPrimaryAction={() => history.push('/notification/channels/create')}
        >
            {/* ===== 卡片网格 ===== */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
            ) : channels.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={<Text type="secondary">暂无通知渠道配置</Text>}
                >
                    <Button type="dashed" disabled={!access.canCreateChannel} onClick={() => history.push('/notification/channels/create')}>创建第一个渠道</Button>
                </Empty>
            ) : (
                <Row gutter={[20, 20]} className="channels-grid">
                    {channels.map(channel => {
                        const typeConfig = getTypeConfig(channel.type);

                        return (
                            <Col key={channel.id} xs={24} sm={12} md={12} lg={8} xl={6} xxl={6}>
                                <div
                                    className="channel-card"
                                    onClick={() => handleViewDetail(channel)}
                                >
                                    {/* Left Stub: Visual Identity */}
                                    <div className="channel-card-stub" style={{
                                        background: channel.is_active ? typeConfig.bg : '#f5f5f5',
                                    }}>
                                        {channel.is_default && (
                                            <div className="channel-card-default-badge">
                                                <div className="channel-card-default-badge-text">D</div>
                                            </div>
                                        )}

                                        <div className="channel-card-stub-content">
                                            <div style={{
                                                color: channel.is_active ? typeConfig.color : '#bfbfbf',
                                                opacity: channel.is_active ? 1 : 0.8
                                            }}>
                                                {React.cloneElement(typeConfig.icon as React.ReactElement<{ style?: React.CSSProperties }>, { style: { fontSize: 22 } })}
                                            </div>
                                            <div className="channel-card-type-label" style={{
                                                color: channel.is_active ? typeConfig.color : '#8c8c8c',
                                            }}>
                                                {typeConfig.label}
                                            </div>
                                        </div>

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
                                    <div className="channel-card-body">
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Text strong style={{ fontSize: 14, marginBottom: 4, color: channel.is_active ? '#262626' : '#8c8c8c' }} ellipsis>
                                                    {channel.name}
                                                </Text>
                                            </div>

                                            <div className="channel-card-endpoint">
                                                <LinkOutlined style={{ fontSize: 10, color: '#bfbfbf' }} />
                                                <Text type="secondary" style={{ fontSize: 11, width: '100%' }} ellipsis={{ tooltip: getChannelEndpoint(channel) }}>
                                                    {getChannelEndpoint(channel)}
                                                </Text>
                                            </div>
                                        </div>

                                        {/* Operational Metrics */}
                                        <div className="channel-card-metrics">
                                            <Tooltip title="最大重试次数">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <SafetyCertificateOutlined />
                                                    <span>{channel.retry_config?.max_retries ?? 3} 次</span>
                                                </div>
                                            </Tooltip>
                                            <Divider orientation="vertical" style={{ margin: 0, height: 10 }} />
                                            <Tooltip title="速率限制">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <ThunderboltOutlined />
                                                    <span>{channel.rate_limit_per_minute ? `${channel.rate_limit_per_minute}/m` : '∞'}</span>
                                                </div>
                                            </Tooltip>
                                        </div>

                                        {/* Footer: Recipients & Actions */}
                                        <div className="channel-card-footer">
                                            {renderRecipientInfo(channel)}

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
                                                        onClick={() => history.push(`/notification/channels/${channel.id}/edit`)}
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

            {/* ===== 分页 ===== */}
            {!loading && total > 0 && (
                <div className="channels-pagination">
                    <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={total}
                        onChange={(page, size) => {
                            setCurrentPage(page);
                            setPageSize(size);
                        }}
                        showSizeChanger={true}
                        pageSizeOptions={['12', '24', '48']}
                        showQuickJumper
                        showTotal={t => `共 ${t} 条`}
                    />
                </div>
            )}

            {/* 详情抽屉 */}
            {renderDetailDrawer()}
        </StandardTable>
    );
};

export default NotificationChannelsPage;

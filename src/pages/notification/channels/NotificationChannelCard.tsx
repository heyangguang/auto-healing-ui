import React from 'react';
import {
    ApiOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    LinkOutlined,
    RobotOutlined,
    SafetyCertificateOutlined,
    SendOutlined,
    TeamOutlined,
    ThunderboltOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Button, Col, Divider, Popconfirm, Space, Switch, Tooltip, Typography } from 'antd';
import { getChannelTypeConfig } from '@/constants/notificationDicts';

const { Text } = Typography;

interface NotificationChannelCardProps {
    channel: AutoHealing.NotificationChannel;
    actionLoading: boolean;
    canDelete: boolean;
    canTest: boolean;
    canUpdate: boolean;
    onDelete: (channel: AutoHealing.NotificationChannel) => void;
    onEdit: (channel: AutoHealing.NotificationChannel) => void;
    onTest: (channel: AutoHealing.NotificationChannel) => void;
    onToggle: (channel: AutoHealing.NotificationChannel, checked: boolean) => void;
    onViewDetail: (channel: AutoHealing.NotificationChannel) => void;
}

const getChannelEndpoint = (channel: AutoHealing.NotificationChannel) =>
    channel.description || '无详细描述';

const renderRecipientInfo = (channel: AutoHealing.NotificationChannel) => {
    if (channel.type === 'dingtalk') {
        const hasRecipients = !!channel.recipients?.length;

        return (
            <Tooltip title={hasRecipients ? `会@提醒: ${channel.recipients.join(', ')}` : '直接推送到钉钉群组'}>
                <Space size={4} style={{ cursor: 'help' }}>
                    {hasRecipients ? (
                        <TeamOutlined style={{ fontSize: 13, color: '#8c8c8c' }} />
                    ) : (
                        <RobotOutlined style={{ fontSize: 13, color: '#8c8c8c' }} />
                    )}
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

const NotificationChannelCard: React.FC<NotificationChannelCardProps> = ({
    channel,
    actionLoading,
    canDelete,
    canTest,
    canUpdate,
    onDelete,
    onEdit,
    onTest,
    onToggle,
    onViewDetail,
}) => {
    const typeConfig = getChannelTypeConfig(channel.type);

    return (
        <Col xs={24} sm={12} md={12} lg={8} xl={6} xxl={6}>
            <div className="channel-card" onClick={() => onViewDetail(channel)}>
                <div
                    className="channel-card-stub"
                    style={{ background: channel.is_active ? typeConfig.bg : '#f5f5f5' }}
                >
                    {channel.is_default && (
                        <div className="channel-card-default-badge">
                            <div className="channel-card-default-badge-text">D</div>
                        </div>
                    )}

                    <div className="channel-card-stub-content">
                        <div
                            style={{
                                color: channel.is_active ? typeConfig.color : '#bfbfbf',
                                opacity: channel.is_active ? 1 : 0.8,
                            }}
                        >
                            {React.cloneElement(
                                typeConfig.icon as React.ReactElement<{ style?: React.CSSProperties }>,
                                { style: { fontSize: 22 } },
                            )}
                        </div>
                        <div
                            className="channel-card-type-label"
                            style={{ color: channel.is_active ? typeConfig.color : '#8c8c8c' }}
                        >
                            {typeConfig.label}
                        </div>
                    </div>

                    <div onClick={(event) => event.stopPropagation()} style={{ marginBottom: 4 }}>
                        <Switch
                            size="small"
                            checked={channel.is_active}
                            onChange={(checked) => onToggle(channel, checked)}
                            loading={actionLoading}
                            disabled={!canUpdate}
                        />
                    </div>
                </div>

                <div className="channel-card-body">
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Text
                                strong
                                style={{ fontSize: 14, marginBottom: 4, color: channel.is_active ? '#262626' : '#8c8c8c' }}
                                ellipsis
                            >
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

                    <div className="channel-card-footer">
                        {renderRecipientInfo(channel)}

                        <div style={{ display: 'flex', gap: 2 }} onClick={(event) => event.stopPropagation()}>
                            <Tooltip title="查看详情">
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<EyeOutlined style={{ fontSize: 13, color: '#8c8c8c' }} />}
                                    onClick={() => onViewDetail(channel)}
                                />
                            </Tooltip>
                            <Tooltip title="测试发送">
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<SendOutlined style={{ fontSize: 13, color: '#8c8c8c' }} />}
                                    onClick={() => onTest(channel)}
                                    loading={actionLoading}
                                    disabled={!canTest}
                                />
                            </Tooltip>
                            <Tooltip title="编辑配置">
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<EditOutlined style={{ fontSize: 13, color: '#8c8c8c' }} />}
                                    onClick={() => onEdit(channel)}
                                    disabled={!canUpdate}
                                />
                            </Tooltip>
                            <Popconfirm
                                title="确定删除该渠道?"
                                onConfirm={() => onDelete(channel)}
                                okText="确定"
                                cancelText="取消"
                                okButtonProps={{ danger: true, size: 'small' }}
                                cancelButtonProps={{ size: 'small' }}
                            >
                                <Button
                                    type="text"
                                    danger
                                    size="small"
                                    disabled={!canDelete}
                                    icon={<DeleteOutlined style={{ fontSize: 13, opacity: 0.6 }} />}
                                />
                            </Popconfirm>
                        </div>
                    </div>
                </div>
            </div>
        </Col>
    );
};

export default NotificationChannelCard;

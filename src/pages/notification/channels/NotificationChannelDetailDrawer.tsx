import React from 'react';
import { Button, Card, Descriptions, Drawer, Empty, Space, Tag, Typography, Alert } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { getChannelTypeConfig } from '@/constants/notificationDicts';

const { Text } = Typography;

interface NotificationChannelDetailDrawerProps {
    channel: AutoHealing.NotificationChannel | null;
    open: boolean;
    canTest: boolean;
    canUpdate: boolean;
    onClose: () => void;
    onEdit: (channel: AutoHealing.NotificationChannel) => void;
    onTest: (channel: AutoHealing.NotificationChannel) => void;
}

const NotificationChannelDetailDrawer: React.FC<NotificationChannelDetailDrawerProps> = ({
    channel,
    open,
    canTest,
    canUpdate,
    onClose,
    onEdit,
    onTest,
}) => {
    if (!channel) {
        return null;
    }

    const typeConfig = getChannelTypeConfig(channel.type);

    return (
        <Drawer
            title={
                <Space>
                    {React.cloneElement(
                        typeConfig.icon as React.ReactElement<{ style?: React.CSSProperties }>,
                        { style: { fontSize: 18, color: typeConfig.color } },
                    )}
                    <span>{channel.name}</span>
                    {channel.is_default && <Tag color="gold">默认</Tag>}
                </Space>
            }
            size={600}
            open={open}
            onClose={onClose}
            extra={(
                <Space>
                    <Button onClick={() => onTest(channel)} disabled={!canTest}>测试通道</Button>
                    <Button type="primary" onClick={() => onEdit(channel)} disabled={!canUpdate}>编辑</Button>
                </Space>
            )}
        >
            <Card size="small" style={{ marginBottom: 16 }}>
                <Descriptions column={2} size="small" bordered>
                    <Descriptions.Item label="类型">
                        <Tag color={typeConfig.color}>{typeConfig.label}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">
                        <Tag color={channel.is_active ? 'success' : 'error'}>
                            {channel.is_active ? '启用' : '禁用'}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="限流">
                        {(channel.rate_limit_per_minute ?? 0) > 0
                            ? `${channel.rate_limit_per_minute} 次/分`
                            : '无限制'}
                    </Descriptions.Item>
                    <Descriptions.Item label="重试机制">
                        {channel.retry_config?.max_retries || 0} 次
                        ({(channel.retry_config?.retry_intervals || []).join(', ')}s)
                    </Descriptions.Item>
                    <Descriptions.Item label="描述" span={2}>
                        {channel.description || '无描述'}
                    </Descriptions.Item>
                    <Descriptions.Item label="更新时间" span={2}>
                        {channel.updated_at ? new Date(channel.updated_at).toLocaleString() : '-'}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            <Alert
                title="配置详情"
                description="敏感配置信息（如 Webhook URL、密码、密钥等）出于安全原因不在详情中显示。如需修改配置，请点击「编辑」按钮。"
                type="info"
                style={{ marginBottom: 16 }}
            />

            <Card size="small" title={`接收者列表 (${channel.recipients?.length || 0})`}>
                {channel.recipients && channel.recipients.length > 0 ? (
                    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                        {channel.recipients.map((recipient) => (
                            <div
                                key={recipient}
                                style={{
                                    padding: '8px 12px',
                                    borderBottom: '1px solid #f0f0f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                            >
                                <UserOutlined style={{ color: '#8c8c8c' }} />
                                <Text copyable>{recipient}</Text>
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

export default NotificationChannelDetailDrawer;

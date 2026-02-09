import { BellOutlined } from '@ant-design/icons';
import { Badge, Empty, List, Tag, Typography, Tooltip } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';

const STATUS_MAP: Record<string, { color: string; text: string }> = {
    sent: { color: 'success', text: '已发送' },
    failed: { color: 'error', text: '失败' },
    pending: { color: 'processing', text: '发送中' },
};

const ListRecentNotifications: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('notifications');
    // dashboard overview 返回 recent_logs 字段
    const items = data?.recent_logs ?? [];

    return (
        <WidgetWrapper title="最近通知" icon={<BellOutlined />} loading={loading} onRefresh={refresh} noPadding isEditing={isEditing} onRemove={onRemove}>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {items.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
                    </div>
                ) : (
                    <>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 80px 100px',
                            gap: 8,
                            padding: '8px 12px',
                            background: '#fafafa',
                            borderBottom: '1px solid #f0f0f0',
                            fontSize: 12,
                            color: '#888',
                            fontWeight: 500
                        }}>
                            <div>主题</div>
                            <div style={{ textAlign: 'center' }}>状态</div>
                            <div style={{ textAlign: 'right' }}>时间</div>
                        </div>

                        <div style={{ flex: 1, overflow: 'auto' }}>
                            <List
                                size="small"
                                dataSource={Array.isArray(items) ? items : []}
                                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" /> }}
                                renderItem={(item: any, index: number) => {
                                    const st = STATUS_MAP[item.status] || { color: 'default', text: item.status };
                                    const title = item.subject || item.template_name || item.id?.slice(0, 8);

                                    return (
                                        <div
                                            className="list-item-hover"
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 80px 100px',
                                                gap: 8,
                                                padding: '8px 12px',
                                                background: index % 2 === 1 ? '#fafafa' : '#fff',
                                                borderBottom: '1px solid #f0f0f0',
                                                alignItems: 'center',
                                                transition: 'background 0.3s',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                                                <Badge status={st.color as any} />
                                                <Tooltip title={item.subject || title}>
                                                    <Typography.Text ellipsis style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>
                                                        {title}
                                                    </Typography.Text>
                                                </Tooltip>
                                            </div>

                                            <div style={{ textAlign: 'center' }}>
                                                <Tag color={st.color} style={{ margin: 0, fontSize: 11, lineHeight: '18px' }}>{st.text}</Tag>
                                            </div>

                                            <div style={{ textAlign: 'right' }}>
                                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                                    {dayjs(item.created_at).format('MM-DD HH:mm')}
                                                </Typography.Text>
                                            </div>
                                        </div>
                                    );
                                }}
                            />
                        </div>
                    </>
                )}
            </div>
        </WidgetWrapper>
    );
};
export default ListRecentNotifications;

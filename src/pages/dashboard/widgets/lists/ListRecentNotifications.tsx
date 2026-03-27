import { BellOutlined } from '@ant-design/icons';
import { Badge, Empty, Tag, Typography, Tooltip } from 'antd';
import type { BadgeProps } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import { NOTIF_LOG_STATUS_MAP } from '@/constants/commonDicts';
import type { WidgetComponentProps } from '../widgetRegistry';

const STATUS_MAP = NOTIF_LOG_STATUS_MAP;
type NotificationItem = {
    id?: string;
    status?: string;
    subject?: string;
    template_name?: string;
    created_at?: string;
};

function resolveBadgeStatus(color?: string): BadgeProps['status'] {
    if (color === 'success' || color === 'processing' || color === 'error' || color === 'warning') {
        return color;
    }
    return 'default';
}

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
                            {(Array.isArray(items) ? items : []).map((item: NotificationItem, index: number) => {
                                const status = item.status ?? '';
                                const st = STATUS_MAP[status] || { color: 'default', text: status };
                                const title = item.subject || item.template_name || item.id?.slice(0, 8);

                                return (
                                    <div
                                        key={item.id || index}
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
                                            <Badge status={resolveBadgeStatus(st.color)} />
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
                            })}
                        </div>
                    </>
                )}
            </div>
        </WidgetWrapper>
    );
};
export default ListRecentNotifications;

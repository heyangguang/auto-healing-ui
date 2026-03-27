import { RocketOutlined } from '@ant-design/icons';
import { Badge, Empty, Tag, Typography, Tooltip } from 'antd';
import { useAccess, history } from '@umijs/max';
import dayjs from 'dayjs';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';

const SEVERITY_COLORS: Record<string, string> = {
    critical: 'red',
    high: 'orange',
    medium: 'gold',
    low: 'green',
    info: 'blue',
};

type PendingTriggerItem = {
    id?: string;
    title?: string;
    external_id?: string;
    source_plugin_name?: string;
    plugin?: { name?: string };
    category?: string;
    severity?: string;
    created_at?: string;
};

const ListPendingTriggers: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const access = useAccess();
    const { data, loading, refresh } = useDashboardSection('healing');
    const items = Array.isArray(data?.pending_trigger_list) ? data.pending_trigger_list : [];

    return (
        <WidgetWrapper title="待触发列表" icon={<RocketOutlined />} loading={loading} onRefresh={refresh} noPadding isEditing={isEditing} onRemove={onRemove}>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.5fr 1fr 60px 100px',
                    gap: 8,
                    padding: '8px 12px',
                    background: '#fafafa',
                    borderBottom: '1px solid #f0f0f0',
                    fontSize: 12,
                    color: '#888',
                    fontWeight: 500
                }}>
                    <div>工单标题 / ID</div>
                    <div>来源 / 分类</div>
                    <div style={{ textAlign: 'center' }}>等级</div>
                    <div style={{ textAlign: 'right' }}>时间</div>
                </div>

                <div style={{ flex: 1, overflow: 'auto' }}>
                    {items.slice(0, 15).length === 0 ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
                    ) : (
                        items.slice(0, 15).map((item: PendingTriggerItem, index: number) => {
                            const title = item.title || item.external_id || item.id?.slice(0, 8);
                            const source = item.source_plugin_name || item.plugin?.name || '-';
                            const category = item.category || '-';

                            return (
                                <div
                                    key={item.id || index}
                                    className="list-item-hover"
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1.5fr 1fr 60px 100px',
                                        gap: 8,
                                        padding: '8px 12px',
                                        cursor: access.canViewPendingTrigger ? 'pointer' : 'default',
                                        background: index % 2 === 1 ? '#fafafa' : '#fff',
                                        borderBottom: '1px solid #f0f0f0',
                                        transition: 'background 0.3s',
                                        alignItems: 'center',
                                        ...(access.canViewPendingTrigger ? {} : { opacity: 0.65 }),
                                    }}
                                    onClick={() => access.canViewPendingTrigger && history.push('/pending/triggers')}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                                        <Badge status="processing" />
                                        <Tooltip title={item.title || item.external_id}>
                                            <Typography.Text ellipsis style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>
                                                {title}
                                            </Typography.Text>
                                        </Tooltip>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                        <Tooltip title={`Source: ${source}`}>
                                            <Typography.Text ellipsis style={{ fontSize: 12, color: '#666' }}>
                                                {source}
                                            </Typography.Text>
                                        </Tooltip>
                                        {category !== '-' && (
                                            <Typography.Text ellipsis type="secondary" style={{ fontSize: 10 }}>
                                                {category}
                                            </Typography.Text>
                                        )}
                                    </div>

                                    <div style={{ textAlign: 'center' }}>
                                        {item.severity && (
                                            <Tag color={SEVERITY_COLORS[item.severity]} style={{ margin: 0, fontSize: 11, lineHeight: '18px' }}>
                                                {item.severity}
                                            </Tag>
                                        )}
                                    </div>

                                    <div style={{ textAlign: 'right' }}>
                                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                            {dayjs(item.created_at).format('MM-DD HH:mm')}
                                        </Typography.Text>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </WidgetWrapper>
    );
};
export default ListPendingTriggers;

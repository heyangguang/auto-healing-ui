import { NodeIndexOutlined } from '@ant-design/icons';
import { Badge, Empty, Tag, Typography, Tooltip } from 'antd';
import type { BadgeProps } from 'antd';
import { useAccess, history } from '@umijs/max';
import dayjs from 'dayjs';
import React from 'react';
import { INSTANCE_STATUS_MAP } from '@/constants/instanceDicts';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';

type RecentInstanceItem = {
    id?: string;
    status?: string;
    title?: string;
    name?: string;
    flow_name?: string;
    current_node_id?: string;
    created_at?: string;
};

function resolveBadgeStatus(color?: string): BadgeProps['status'] {
    if (color === 'success' || color === 'processing' || color === 'error' || color === 'warning') {
        return color;
    }
    return 'default';
}

const ListRecentInstances: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const access = useAccess();
    const { data, loading, refresh } = useDashboardSection('healing');
    const items = Array.isArray(data?.recent_instances) ? data.recent_instances : [];

    return (
        <WidgetWrapper title="最近自愈实例" icon={<NodeIndexOutlined />} loading={loading} onRefresh={refresh} noPadding isEditing={isEditing} onRemove={onRemove}>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* 表头 - 使用 Grid 布局对齐 */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.5fr 1fr 80px 100px',
                    gap: 8,
                    padding: '8px 12px',
                    background: '#fafafa',
                    borderBottom: '1px solid #f0f0f0',
                    fontSize: 12,
                    color: '#888',
                    fontWeight: 500
                }}>
                    <div>实例 ID / 名称</div>
                    <div>流程 / 节点</div>
                    <div style={{ textAlign: 'center' }}>状态</div>
                    <div style={{ textAlign: 'right' }}>时间</div>
                </div>

                {/* 列表内容 */}
                <div style={{ flex: 1, overflow: 'auto' }}>
                    {(!Array.isArray(items) || items.length === 0) ? (
                        <div style={{ padding: '24px 0' }}>
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
                        </div>
                    ) : (
                        items.map((item: RecentInstanceItem, index: number) => {
                            const status = item.status ?? '';
                            const st = INSTANCE_STATUS_MAP[status] || { color: 'default', text: status };
                            const displayName = item.title || item.name || (item.id ? `${item.id.slice(0, 8)}...` : '-');
                            const flowName = item.flow_name || '-';
                            const currentNode = item.current_node_id || '-';

                            return (
                                <div
                                    key={item.id || index}
                                    className="list-item-hover"
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1.5fr 1fr 80px 100px',
                                        gap: 8,
                                        padding: '8px 12px',
                                        cursor: access.canViewInstances ? 'pointer' : 'default',
                                        background: index % 2 === 1 ? '#fafafa' : '#fff',
                                        borderBottom: '1px solid #f0f0f0',
                                        transition: 'background 0.3s',
                                        alignItems: 'center',
                                        ...(access.canViewInstances ? {} : { opacity: 0.65 }),
                                    }}
                                    onClick={() => access.canViewInstances && history.push(`/healing/instances/${item.id}`)}
                                >
                                    {/* Column 1: ID / Name */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                                        <Badge status={resolveBadgeStatus(st.color)} />
                                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                            <Tooltip title={item.id}>
                                                <Typography.Text ellipsis style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>
                                                    {displayName}
                                                </Typography.Text>
                                            </Tooltip>
                                        </div>
                                    </div>

                                    {/* Column 2: Context (Flow / Node) */}
                                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                        <Tooltip title={`Flow: ${flowName}`}>
                                            <Typography.Text ellipsis style={{ fontSize: 12, color: '#666' }}>
                                                {flowName}
                                            </Typography.Text>
                                        </Tooltip>
                                        {currentNode !== '-' && (
                                            <Tooltip title={`Node: ${currentNode}`}>
                                                <Typography.Text ellipsis type="secondary" style={{ fontSize: 10 }}>
                                                    {currentNode}
                                                </Typography.Text>
                                            </Tooltip>
                                        )}
                                    </div>

                                    {/* Column 3: Status */}
                                    <div style={{ textAlign: 'center' }}>
                                        <Tag variant="filled" color={st.color} style={{ margin: 0, fontSize: 11, lineHeight: '18px' }}>
                                            {st.text}
                                        </Tag>
                                    </div>

                                    {/* Column 4: Time */}
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
export default ListRecentInstances;

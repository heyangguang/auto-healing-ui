import { NodeIndexOutlined } from '@ant-design/icons';
import { Badge, Empty, List, Tag, Typography, Tooltip } from 'antd';
import { useRequest, history } from '@umijs/max';
import dayjs from 'dayjs';
import React from 'react';
import { getHealingInstances } from '@/services/auto-healing/instances';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';

const STATUS_MAP: Record<string, { color: string; text: string; bg?: string }> = {
    completed: { color: 'success', text: '完成', bg: '#f6ffed' },
    running: { color: 'processing', text: '运行中', bg: '#e6f7ff' },
    pending: { color: 'warning', text: '待处理', bg: '#fffbe6' },
    failed: { color: 'error', text: '失败', bg: '#fff2f0' },
    skipped: { color: 'default', text: '跳过', bg: '#fafafa' },
    cancelled: { color: 'default', text: '取消', bg: '#fafafa' },
};

const ListRecentInstances: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    // 增加 page_size 到 15 以填充大屏幕
    const { data: rawData, loading, refresh } = useRequest(() => getHealingInstances({ page_size: 15 }), { formatResult: (r: any) => r });
    const data = rawData as any;
    const items = data?.data ?? data?.items ?? [];

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
                    <List
                        size="small"
                        dataSource={Array.isArray(items) ? items : []}
                        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" /> }}
                        renderItem={(item: any, index: number) => {
                            const st = STATUS_MAP[item.status] || { color: 'default', text: item.status };
                            const displayName = item.title || item.name || (item.id ? `${item.id.slice(0, 8)}...` : '-');
                            // 尝试获取额外信息：流程名称和当前节点
                            // 优先使用 flow.name，其次 flow_name
                            const flowName = item.flow?.name || item.flow_name || '-';
                            const currentNode = item.current_node_id || '-';

                            return (
                                <div
                                    className="list-item-hover"
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1.5fr 1fr 80px 100px',
                                        gap: 8,
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        background: index % 2 === 1 ? '#fafafa' : '#fff', // 斑马纹
                                        borderBottom: '1px solid #f0f0f0',
                                        transition: 'background 0.3s',
                                        alignItems: 'center'
                                    }}
                                    onClick={() => history.push(`/healing/instances/${item.id}`)}
                                >
                                    {/* Column 1: ID / Name */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                                        <Badge status={st.color as any} />
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
                                        <Tag bordered={false} color={st.color} style={{ margin: 0, fontSize: 11, lineHeight: '18px' }}>
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
                        }}
                    />
                </div>
            </div>
        </WidgetWrapper>
    );
};
export default ListRecentInstances;

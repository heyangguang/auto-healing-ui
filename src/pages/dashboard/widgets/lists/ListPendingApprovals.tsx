import { ClockCircleOutlined } from '@ant-design/icons';
import { Badge, Empty, List, Typography, Tooltip, Tag } from 'antd';
import { useRequest, history } from '@umijs/max';
import dayjs from 'dayjs';
import React from 'react';
import { getPendingApprovals } from '@/services/auto-healing/healing';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';

const ListPendingApprovals: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data: rawData, loading, refresh } = useRequest(() => getPendingApprovals({ page_size: 15 }), { formatResult: (r: any) => r });
    const data = rawData as any;
    const items = data?.data?.items ?? data?.data ?? data?.items ?? [];

    return (
        <WidgetWrapper title="待审批列表" icon={<ClockCircleOutlined />} loading={loading} onRefresh={refresh} noPadding isEditing={isEditing} onRemove={onRemove}>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr 100px',
                    gap: 8,
                    padding: '8px 12px',
                    background: '#fafafa',
                    borderBottom: '1px solid #f0f0f0',
                    fontSize: 12,
                    color: '#888',
                    fontWeight: 500
                }}>
                    <div>任务 ID / 节点</div>
                    <div>关联流程 / 实例</div>
                    <div style={{ textAlign: 'right' }}>创建时间</div>
                </div>

                <div style={{ flex: 1, overflow: 'auto' }}>
                    <List
                        size="small"
                        dataSource={Array.isArray(items) ? items : []}
                        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" /> }}
                        renderItem={(item: any, index: number) => {
                            const nodeId = item.node_id || item.id?.slice(0, 8);
                            const flowName = item.flow_instance?.flow?.name || item.flow_name || '-';
                            const instanceId = item.flow_instance_id || '-';

                            return (
                                <div
                                    className="list-item-hover"
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1.2fr 1fr 100px',
                                        gap: 8,
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        background: index % 2 === 1 ? '#fafafa' : '#fff',
                                        borderBottom: '1px solid #f0f0f0',
                                        transition: 'background 0.3s',
                                        alignItems: 'center'
                                    }}
                                    onClick={() => history.push('/pending-center')}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                                        <Badge status="warning" />
                                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                            <Tooltip title={`Node ID: ${item.node_id}`}>
                                                <Typography.Text ellipsis style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>
                                                    {nodeId}
                                                </Typography.Text>
                                            </Tooltip>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                        <Tooltip title={`Flow: ${flowName}`}>
                                            <Typography.Text ellipsis style={{ fontSize: 12, color: '#666' }}>
                                                {flowName}
                                            </Typography.Text>
                                        </Tooltip>
                                        {instanceId !== '-' && (
                                            <Typography.Text ellipsis type="secondary" style={{ fontSize: 10 }}>
                                                Inst: {instanceId.slice(0, 8)}
                                            </Typography.Text>
                                        )}
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
            </div>
        </WidgetWrapper>
    );
};
export default ListPendingApprovals;

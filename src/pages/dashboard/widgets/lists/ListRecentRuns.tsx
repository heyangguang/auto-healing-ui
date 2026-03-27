import { FileTextOutlined } from '@ant-design/icons';
import { Badge, Empty, Tag, Typography, Tooltip } from 'antd';
import { useAccess, history } from '@umijs/max';
import dayjs from 'dayjs';
import React from 'react';
import { RUN_STATUS_MAP } from '@/constants/executionDicts';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';

const ListRecentRuns: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const access = useAccess();
    const { data, loading, refresh } = useDashboardSection('execution');
    const items = Array.isArray(data?.recent_runs) ? data.recent_runs : [];

    return (
        <WidgetWrapper title="最近执行记录" icon={<FileTextOutlined />} loading={loading} onRefresh={refresh} noPadding isEditing={isEditing} onRemove={onRemove}>
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
                    <div>任务名称</div>
                    <div>触发 / 统计</div>
                    <div style={{ textAlign: 'center' }}>状态</div>
                    <div style={{ textAlign: 'right' }}>时间</div>
                </div>

                <div style={{ flex: 1, overflow: 'auto' }}>
                    {(Array.isArray(items) ? items : []).length === 0 ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
                    ) : (
                        (Array.isArray(items) ? items : []).map((item: any, index: number) => {
                            const st = RUN_STATUS_MAP[item.status] || { color: 'default', text: item.status };
                            const triggeredBy = item.triggered_by || '-';

                            return (
                                <div
                                    key={item.id || index}
                                    className="list-item-hover"
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1.5fr 1fr 60px 100px',
                                        gap: 8,
                                        padding: '8px 12px',
                                        cursor: access.canViewTaskDetail ? 'pointer' : 'default',
                                        background: index % 2 === 1 ? '#fafafa' : '#fff',
                                        borderBottom: '1px solid #f0f0f0',
                                        transition: 'background 0.3s',
                                        alignItems: 'center',
                                        ...(access.canViewTaskDetail ? {} : { opacity: 0.65 }),
                                    }}
                                    onClick={() => access.canViewTaskDetail && history.push(`/execution/runs/${item.id}`)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                                        <Badge status={st.color as any} />
                                        <Tooltip title={item.task_name || item.id}>
                                            <Typography.Text ellipsis style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>
                                                {item.task_name || item.id?.slice(0, 8)}
                                            </Typography.Text>
                                        </Tooltip>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                        <Typography.Text ellipsis style={{ fontSize: 12, color: '#666' }}>
                                            {triggeredBy}
                                        </Typography.Text>
                                        <Typography.Text ellipsis type="secondary" style={{ fontSize: 10 }}>
                                            {item.completed_at ? '已完成' : '进行中'}
                                        </Typography.Text>
                                    </div>

                                    <div style={{ textAlign: 'center' }}>
                                        <Tag color={st.color} style={{ margin: 0, fontSize: 11, lineHeight: '18px' }}>{st.text}</Tag>
                                    </div>

                                    <div style={{ textAlign: 'right' }}>
                                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                            {dayjs(item.started_at || item.created_at).format('MM-DD HH:mm')}
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
export default ListRecentRuns;

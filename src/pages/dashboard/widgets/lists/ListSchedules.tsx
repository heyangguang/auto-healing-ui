import { ScheduleOutlined } from '@ant-design/icons';
import { Badge, Empty, Tag, Typography, Tooltip } from 'antd';
import { useAccess, useRequest, history } from '@umijs/max';
import dayjs from 'dayjs';
import React from 'react';
import { getExecutionSchedules } from '@/services/auto-healing/execution';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';

const ListSchedules: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const access = useAccess();
    const { data: rawData, loading, refresh } = useRequest(() => getExecutionSchedules({ page_size: 15 }), {
        ready: !!access.canViewTasks,
    });
    const data = rawData as any;
    const items = data?.data ?? data?.items ?? [];

    return (
        <WidgetWrapper title="定时任务" icon={<ScheduleOutlined />} loading={loading} onRefresh={refresh} noPadding isEditing={isEditing} onRemove={onRemove}>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr 50px 120px',
                    gap: 8,
                    padding: '8px 12px',
                    background: '#fafafa',
                    borderBottom: '1px solid #f0f0f0',
                    fontSize: 12,
                    color: '#888',
                    fontWeight: 500
                }}>
                    <div>名称</div>
                    <div>任务 / 下次运行</div>
                    <div style={{ textAlign: 'center' }}>状态</div>
                    <div style={{ textAlign: 'right' }}>调度/类型</div>
                </div>

                <div style={{ flex: 1, overflow: 'auto' }}>
                    {(!Array.isArray(items) || items.length === 0) ? (
                        <div style={{ padding: '24px 0' }}>
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
                        </div>
                    ) : (
                        items.map((item: any, index: number) => {
                            const taskName = item.task?.name || item.task_name || '-';
                            const nextRun = item.next_run_at ? dayjs(item.next_run_at).format('MM-DD HH:mm') : '-';

                            return (
                                <div
                                    key={item.id || index}
                                    className="list-item-hover"
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1.2fr 1fr 50px 120px',
                                        gap: 8,
                                        padding: '8px 12px',
                                        cursor: access.canViewTasks ? 'pointer' : 'default',
                                        background: index % 2 === 1 ? '#fafafa' : '#fff',
                                        borderBottom: '1px solid #f0f0f0',
                                        transition: 'background 0.3s',
                                        alignItems: 'center',
                                        ...(access.canViewTasks ? {} : { opacity: 0.65 }),
                                    }}
                                    onClick={() => access.canViewTasks && history.push('/execution/schedules')}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                                        <Badge status={item.enabled ? 'success' : 'default'} />
                                        <Tooltip title={item.name}>
                                            <Typography.Text ellipsis style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>
                                                {item.name || item.id?.slice(0, 8)}
                                            </Typography.Text>
                                        </Tooltip>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                        <Tooltip title={`Task: ${taskName}`}>
                                            <Typography.Text ellipsis style={{ fontSize: 12, color: '#666' }}>
                                                {taskName}
                                            </Typography.Text>
                                        </Tooltip>
                                        <Typography.Text ellipsis type="secondary" style={{ fontSize: 10 }}>
                                            Next: {nextRun}
                                        </Typography.Text>
                                    </div>

                                    <div style={{ textAlign: 'center' }}>
                                        <Tag color={item.status === 'auto_paused' ? 'orange' : item.enabled ? 'green' : 'default'} style={{ margin: 0, fontSize: 11, lineHeight: '18px' }}>
                                            {item.status === 'auto_paused' ? '自动暂停' : item.enabled ? '启用' : '停用'}
                                        </Tag>
                                    </div>

                                    <div style={{ textAlign: 'right' }}>
                                        <Typography.Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                                            {item.cron_expression || item.schedule_type}
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
export default ListSchedules;

import { FileTextOutlined } from '@ant-design/icons';
import { Badge, Empty, List, Tag, Typography, Tooltip } from 'antd';
import { useRequest, history } from '@umijs/max';
import dayjs from 'dayjs';
import React from 'react';
import { getExecutionRuns } from '@/services/auto-healing/execution';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';

const STATUS_MAP: Record<string, { color: string; text: string }> = {
    success: { color: 'success', text: '成功' },
    failed: { color: 'error', text: '失败' },
    running: { color: 'processing', text: '运行中' },
    partial: { color: 'warning', text: '部分成功' },
    cancelled: { color: 'default', text: '取消' },
};

const ListRecentRuns: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data: rawData, loading, refresh } = useRequest(() => getExecutionRuns({ page_size: 15 }));
    const data = rawData as any;
    const items = data?.data ?? data?.items ?? [];

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
                    <List
                        size="small"
                        dataSource={Array.isArray(items) ? items : []}
                        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" /> }}
                        renderItem={(item: any, index: number) => {
                            const st = STATUS_MAP[item.status] || { color: 'default', text: item.status };
                            const triggeredBy = item.triggered_by || '-';
                            const stats = item.stats || { ok: 0, failed: 0, changed: 0 };

                            return (
                                <div
                                    className="list-item-hover"
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1.5fr 1fr 60px 100px',
                                        gap: 8,
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        background: index % 2 === 1 ? '#fafafa' : '#fff',
                                        borderBottom: '1px solid #f0f0f0',
                                        transition: 'background 0.3s',
                                        alignItems: 'center'
                                    }}
                                    onClick={() => history.push(`/execution/runs/${item.id}`)}
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
                                            OK:{stats.ok} Fail:{stats.failed}
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
                        }}
                    />
                </div>
            </div>
        </WidgetWrapper>
    );
};
export default ListRecentRuns;

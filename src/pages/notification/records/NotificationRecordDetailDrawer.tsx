import React, { startTransition } from 'react';
import { Avatar, Descriptions, Divider, Drawer, Space, Tag, Typography } from 'antd';
import { BellOutlined, ClockCircleOutlined, CloseCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import {
    formatFullTime,
    getStatusConfig,
    getTriggeredByConfig,
    getTypeConfig,
    parseNestedJson,
    type NotificationRecord,
} from './notificationRecordsConfig';

const { Text } = Typography;

interface NotificationRecordDetailDrawerProps {
    open: boolean;
    record: NotificationRecord | null;
    onClose: () => void;
}

const NotificationRecordDetailDrawer: React.FC<NotificationRecordDetailDrawerProps> = ({ open, record, onClose }) => {
    return (
        <Drawer
            title={(
                <Space>
                    <BellOutlined />
                    <span>通知详情</span>
                    {record && <Tag icon={getStatusConfig(record.status).icon} color={getStatusConfig(record.status).tagColor}>{getStatusConfig(record.status).label}</Tag>}
                </Space>
            )}
            size={700}
            open={open}
            onClose={onClose}
        >
            {record && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {(record.status === 'failed' || record.status === 'bounced') && record.error_message && (
                        <div style={{ padding: '12px 16px', background: '#fff1f0', border: '1px solid #ffccc7' }}>
                            <Space align="start">
                                <CloseCircleOutlined style={{ color: '#ff4d4f', marginTop: 4, fontSize: 16 }} />
                                <div>
                                    <Text strong style={{ color: '#cf1322' }}>发送失败</Text>
                                    <div style={{ marginTop: 4, color: '#cf1322', fontFamily: 'monospace', fontSize: 13 }}>{record.error_message}</div>
                                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                                        <Tag>重试 {record.retry_count || 0}/{record.channel?.retry_config?.max_retries || 3}</Tag>
                                        {record.next_retry_at && <Tag color="orange"><ClockCircleOutlined /> 下次重试: {formatFullTime(record.next_retry_at)}</Tag>}
                                    </div>
                                </div>
                            </Space>
                        </div>
                    )}

                    <Descriptions title="基本信息" column={2} bordered size="small">
                        <Descriptions.Item label="记录 ID"><Text copyable style={{ fontFamily: 'monospace', fontSize: 12 }}>{record.id}</Text></Descriptions.Item>
                        <Descriptions.Item label="创建时间">{formatFullTime(record.created_at)}</Descriptions.Item>
                        <Descriptions.Item label="发送渠道">
                            <Space>
                                <Avatar size="small" style={{ background: getTypeConfig(record.channel?.type || 'unknown').bg, color: getTypeConfig(record.channel?.type || 'unknown').color }} icon={getTypeConfig(record.channel?.type || 'unknown').icon} />
                                {record.channel?.name || '未知渠道'}
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="关联模板">
                            {record.template ? <Tag icon={<FileTextOutlined />}>{record.template.name}</Tag> : <Text type="secondary">-</Text>}
                        </Descriptions.Item>
                        <Descriptions.Item label="接收者" span={2}>
                            {record.recipients && record.recipients.length > 0
                                ? record.recipients.join(', ')
                                : <Text type="secondary">{record.channel?.type === 'webhook' ? '远程终端' : record.channel?.type === 'dingtalk' ? '群组机器人' : '无指定接收者'}</Text>}
                        </Descriptions.Item>
                        <Descriptions.Item label="通知主题" span={2}><Text strong>{record.subject || '(无主题)'}</Text></Descriptions.Item>
                        {record.sent_at && <Descriptions.Item label="发送时间" span={2}>{formatFullTime(record.sent_at)}</Descriptions.Item>}
                    </Descriptions>

                    {record.execution_run && (
                        <>
                            <Divider style={{ margin: 0 }} />
                            <Descriptions title="关联执行" column={2} bordered size="small">
                                <Descriptions.Item label="任务模板">
                                    <a onClick={(event) => { event.preventDefault(); startTransition(() => { onClose(); history.push(`/execution/templates/${record.execution_run?.task_id}?from=/notification/records`); }); }} style={{ cursor: 'pointer' }}>
                                        {record.execution_run.task?.name || '未知任务'}
                                    </a>
                                </Descriptions.Item>
                                <Descriptions.Item label="触发类型">
                                    {(() => {
                                        const config = getTriggeredByConfig(record.execution_run?.triggered_by);
                                        return <Tag icon={config.icon} color={config.color}>{config.label}</Tag>;
                                    })()}
                                </Descriptions.Item>
                                <Descriptions.Item label="执行状态">
                                    <Tag color={record.execution_run.status === 'success' ? 'green' : record.execution_run.status === 'failed' ? 'red' : 'orange'}>
                                        {record.execution_run.status}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="执行记录">
                                    <a onClick={(event) => { event.preventDefault(); startTransition(() => { onClose(); history.push(`/execution/runs/${record.execution_run_id}?from=/notification/records`); }); }} style={{ cursor: 'pointer' }}>查看详情 →</a>
                                </Descriptions.Item>
                            </Descriptions>
                        </>
                    )}

                    <div>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>通知内容</Text>
                        <div style={{ padding: 16, background: '#1e1e1e', color: '#d4d4d4', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'Consolas, Monaco, \"Courier New\", monospace', fontSize: 13, lineHeight: 1.6, borderRadius: 4, maxHeight: 300, overflowY: 'auto' }}>
                            {(() => {
                                const body = record.body || '';
                                try { return JSON.stringify(JSON.parse(body), null, 2); }
                                catch { return body || '(无内容)'; }
                            })()}
                        </div>
                    </div>

                    {record.response_data && (
                        <div>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>渠道响应数据</Text>
                            <div style={{ padding: 16, background: '#1e1e1e', borderRadius: 4, maxHeight: 400, overflowY: 'auto' }}>
                                <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.5, fontFamily: 'Consolas, Monaco, \"Courier New\", monospace', color: '#9cdcfe', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                    {(() => {
                                        const data = record.response_data;
                                        try {
                                            let parsed = typeof data === 'string' ? JSON.parse(data) : data;
                                            parsed = parseNestedJson(parsed);
                                            return JSON.stringify(parsed, null, 2);
                                        } catch { return typeof data === 'string' ? data : JSON.stringify(data, null, 2); }
                                    })()}
                                </pre>
                            </div>
                        </div>
                    )}

                    {record.external_message_id && (
                        <Descriptions size="small" column={1}>
                            <Descriptions.Item label="外部消息 ID"><Text copyable style={{ fontFamily: 'monospace', fontSize: 12 }}>{record.external_message_id}</Text></Descriptions.Item>
                        </Descriptions>
                    )}
                </div>
            )}
        </Drawer>
    );
};

export default NotificationRecordDetailDrawer;

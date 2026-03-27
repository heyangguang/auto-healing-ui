import React from 'react';
import { Avatar, Button, Space, Tag, Tooltip, Typography } from 'antd';
import { EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import type { StandardColumnDef } from '@/components/StandardTable';
import {
    formatTime,
    getStatusConfig,
    getTriggeredByConfig,
    getTypeConfig,
    type NotificationRecord,
} from './notificationRecordsConfig';

const { Text } = Typography;

export const buildNotificationRecordColumns = (options: {
    channels: AutoHealing.NotificationChannel[];
    onOpenDetail: (record: NotificationRecord) => void;
    onOpenExecution: (runId: string) => void;
}): StandardColumnDef<NotificationRecord>[] => [
    {
        columnKey: 'status',
        columnTitle: '状态',
        dataIndex: 'status',
        width: 100,
        sorter: true,
        headerFilters: [
            { label: '已发送', value: 'sent' },
            { label: '已送达', value: 'delivered' },
            { label: '失败', value: 'failed' },
            { label: '退信', value: 'bounced' },
            { label: '待发送', value: 'pending' },
        ],
        render: (_value, record) => {
            const config = getStatusConfig(record.status);
            return <Tag icon={config.icon} color={config.tagColor} style={{ margin: 0 }}>{config.label}</Tag>;
        },
    },
    {
        columnKey: 'channel',
        columnTitle: '通知渠道',
        width: 180,
        headerFilters: options.channels.map((item) => ({ label: item.name, value: item.id })),
        render: (_value, record) => {
            const config = getTypeConfig(record.channel?.type || 'unknown');
            return (
                <Space size={8}>
                    <Avatar size={28} style={{ background: config.bg, color: config.color }} icon={config.icon} />
                    <div style={{ lineHeight: 1.3 }}>
                        <div style={{ fontWeight: 500 }}>{record.channel?.name || '未知渠道'}</div>
                        <div style={{ fontSize: 11, color: '#8c8c8c' }}>{config.label}</div>
                    </div>
                </Space>
            );
        },
    },
    {
        columnKey: 'task',
        columnTitle: '关联任务',
        width: 180,
        render: (_value, record) => {
            const executionRun = record.execution_run;
            const executionRunId = record.execution_run_id;
            if (!executionRun?.task?.name || !executionRunId) return <Text type="secondary">-</Text>;
            const triggeredByConfig = getTriggeredByConfig(executionRun.triggered_by);
            return (
                <div style={{ lineHeight: 1.4 }}>
                    <Tooltip title="点击查看执行详情">
                        <a
                            onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                options.onOpenExecution(executionRunId);
                            }}
                            style={{ fontWeight: 500, cursor: 'pointer' }}
                        >
                            {executionRun.task.name}
                        </a>
                    </Tooltip>
                    <div><Tag style={{ margin: 0, fontSize: 10 }} color={triggeredByConfig.color}>{triggeredByConfig.label}</Tag></div>
                </div>
            );
        },
    },
    {
        columnKey: 'subject',
        columnTitle: '通知主题',
        dataIndex: 'subject',
        width: 220,
        sorter: true,
        ellipsis: true,
        render: (_value, record) => (
            <div style={{ lineHeight: 1.5 }}>
                <div>{record.subject || '(无主题)'}</div>
                {record.template && <div style={{ fontSize: 12, color: '#8c8c8c' }}><FileTextOutlined style={{ marginRight: 4 }} />{record.template.name}</div>}
            </div>
        ),
    },
    {
        columnKey: 'error_message',
        columnTitle: '错误信息',
        width: 200,
        render: (_value, record) => {
            const isFailed = record.status === 'failed' || record.status === 'bounced';
            if (!isFailed || !record.error_message) return <Text type="secondary">-</Text>;
            return <Tooltip title={record.error_message}><Text type="secondary" ellipsis style={{ maxWidth: 180 }}>{record.error_message}</Text></Tooltip>;
        },
    },
    {
        columnKey: 'sent_at',
        columnTitle: '发送时间',
        dataIndex: 'sent_at',
        width: 130,
        sorter: true,
        render: (_value, record) => <Text type="secondary">{formatTime(record.sent_at || record.created_at)}</Text>,
    },
    {
        columnKey: 'actions',
        columnTitle: '操作',
        width: 100,
        fixed: 'right',
        render: (_value, record) => (
            <Space size={4} onClick={(event) => event.stopPropagation()}>
                <Tooltip title="查看详情">
                    <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => options.onOpenDetail(record)} />
                </Tooltip>
            </Space>
        ),
    },
];

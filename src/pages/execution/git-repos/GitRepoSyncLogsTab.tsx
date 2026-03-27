import React from 'react';
import { Badge, Empty, Table, Tag, Typography, Spin } from 'antd';
import dayjs from 'dayjs';
import type { GitSyncLogRecord } from '@/services/auto-healing/git-repos';

const { Text } = Typography;

type GitRepoSyncLogsTabProps = {
    loadingLogs: boolean;
    syncLogs: GitSyncLogRecord[];
};

function renderSyncStatus(status: string) {
    if (status === 'success') {
        return <Badge status="success" text="成功" />;
    }
    if (status === 'failed') {
        return <Badge status="error" text="失败" />;
    }
    return <Badge status="processing" text="进行中" />;
}

export default function GitRepoSyncLogsTab(props: GitRepoSyncLogsTabProps) {
    const { loadingLogs, syncLogs } = props;

    if (loadingLogs) {
        return <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>;
    }

    if (syncLogs.length === 0) {
        return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无同步记录" />;
    }

    return (
        <Table<GitSyncLogRecord>
            size="small"
            pagination={false}
            dataSource={syncLogs}
            rowKey="id"
            expandable={{
                expandedRowRender: (record) => (
                    <div style={{ padding: '4px 0', fontSize: 12, color: '#ff4d4f', wordBreak: 'break-all' }}>
                        <Text type="danger" style={{ fontSize: 12 }}>{record.error_message}</Text>
                    </div>
                ),
                rowExpandable: (record) => !!record.error_message,
                defaultExpandedRowKeys: syncLogs
                    .filter((log) => log.status === 'failed' && log.error_message)
                    .slice(0, 3)
                    .map((log) => log.id),
            }}
            columns={[
                { title: '状态', dataIndex: 'status', width: 80, render: renderSyncStatus },
                {
                    title: '触发',
                    dataIndex: 'trigger_type',
                    width: 60,
                    render: (value: string) => <Tag>{value === 'manual' ? '手动' : value === 'create' ? '创建' : value === 'scheduled' ? '定时' : value}</Tag>,
                },
                {
                    title: '操作',
                    dataIndex: 'action',
                    width: 60,
                    render: (value: string) => value === 'pull' ? '拉取' : value === 'clone' ? '克隆' : value || '-',
                },
                {
                    title: 'Commit',
                    dataIndex: 'commit_id',
                    width: 100,
                    render: (value: string) => value ? <Text code style={{ fontSize: 11 }}>{value}</Text> : '-',
                },
                {
                    title: '时间',
                    dataIndex: 'created_at',
                    width: 120,
                    render: (value: string) => <span style={{ fontSize: 12 }}>{dayjs(value).format('MM-DD HH:mm:ss')}</span>,
                },
            ]}
        />
    );
}

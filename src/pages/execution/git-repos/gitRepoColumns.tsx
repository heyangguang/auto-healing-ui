import React from 'react';
import {
    CloudSyncOutlined,
    CodeOutlined,
    DeleteOutlined,
    FileTextOutlined,
    FolderOutlined,
    SettingOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { Badge, Button, Popconfirm, Space, Spin, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import type { StandardColumnDef } from '@/components/StandardTable';
import type { GitRepositoryRecord } from '@/services/auto-healing/git-repos';
import { authLabels, getProviderInfo, statusConfig, type GitRepoTableAccess } from './gitRepoListMeta';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

type GitRepoColumnsOptions = {
    access: GitRepoTableAccess;
    authTypeOptions: Array<{ label: string; value: string }>;
    onDelete: (id: string) => void;
    onEdit: (record: GitRepositoryRecord) => void;
    onOpenDetail: (record: GitRepositoryRecord) => void;
    onOpenFileBrowser: (record: GitRepositoryRecord) => void;
    onSync: (record: GitRepositoryRecord) => void;
    statusOptions: Array<{ label: string; value: string }>;
    syncing?: string;
};

function GitRepoNameCell(props: {
    onOpenDetail: (record: GitRepositoryRecord) => void;
    record: GitRepositoryRecord;
}) {
    const { onOpenDetail, record } = props;
    const status = statusConfig[record.status] || statusConfig.pending;
    const playbookCount = record.playbook_count || 0;
    const provider = getProviderInfo(record.url);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tooltip title={provider.label}>
                <div className="git-repo-icon" style={{ background: provider.bg, color: provider.color }}>
                    <span style={{ fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{provider.icon}</span>
                </div>
            </Tooltip>
            <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                    <a style={{ fontWeight: 500, color: '#1677ff', cursor: 'pointer' }} onClick={(event) => {
                        event.stopPropagation();
                        onOpenDetail(record);
                    }}>
                        {record.name}
                    </a>
                    <Tag color={status.color} style={{ marginLeft: 6, fontSize: 11 }}>{status.text}</Tag>
                    {record.sync_enabled && <Tooltip title="已启用定时同步"><CloudSyncOutlined style={{ color: '#1890ff', marginLeft: 4 }} /></Tooltip>}
                    {playbookCount > 0 && <Tooltip title={`关联 ${playbookCount} 个 Playbook`}><span className="git-playbook-badge"><FileTextOutlined />{playbookCount}</span></Tooltip>}
                </div>
                <div style={{ fontSize: 11, color: '#8c8c8c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <CodeOutlined style={{ marginRight: 2 }} />
                    {record.default_branch || 'main'} · {record.url}
                </div>
            </div>
        </div>
    );
}

function GitRepoSyncInfoCell({ record }: { record: GitRepositoryRecord }) {
    return (
        <div>
            {record.sync_enabled ? <Tag color="blue" icon={<SyncOutlined />}>{record.sync_interval}</Tag> : <Tag>未开启</Tag>}
            {record.last_sync_at && (
                <Tooltip title={dayjs(record.last_sync_at).format('YYYY-MM-DD HH:mm:ss')}>
                    <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2, cursor: 'default' }}>{dayjs(record.last_sync_at).fromNow()}</div>
                </Tooltip>
            )}
        </div>
    );
}

function GitRepoActionsCell(props: {
    access: GitRepoTableAccess;
    onDelete: (id: string) => void;
    onEdit: (record: GitRepositoryRecord) => void;
    onOpenFileBrowser: (record: GitRepositoryRecord) => void;
    onSync: (record: GitRepositoryRecord) => void;
    record: GitRepositoryRecord;
    syncing?: string;
}) {
    const { access, onDelete, onEdit, onOpenFileBrowser, onSync, record, syncing } = props;
    return (
        <Space size="small" onClick={(event) => event.stopPropagation()}>
            <Tooltip title="手动同步">
                <Button type="link" size="small" icon={syncing === record.id ? <Spin size="small" /> : <SyncOutlined />} onClick={() => onSync(record)} disabled={!!syncing || !access.canSyncRepo} />
            </Tooltip>
            <Tooltip title="文件浏览">
                <Button type="link" size="small" icon={<FolderOutlined />} onClick={() => onOpenFileBrowser(record)} disabled={record.status !== 'ready'} />
            </Tooltip>
            <Tooltip title="编辑">
                <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => onEdit(record)} disabled={!access.canUpdateGitRepo} />
            </Tooltip>
            <Popconfirm title="确定删除？" description="本地代码也会被清除，不可恢复" onConfirm={() => onDelete(record.id)}>
                <Button type="link" size="small" danger icon={<DeleteOutlined />} disabled={!access.canDeleteRepo} />
            </Popconfirm>
        </Space>
    );
}

export function createGitRepoColumns(options: GitRepoColumnsOptions): StandardColumnDef<GitRepositoryRecord>[] {
    const {
        access,
        authTypeOptions,
        onDelete,
        onEdit,
        onOpenDetail,
        onOpenFileBrowser,
        onSync,
        statusOptions,
        syncing,
    } = options;

    return [
        {
            columnKey: 'name',
            columnTitle: '仓库',
            fixedColumn: true,
            dataIndex: 'name',
            width: 360,
            sorter: true,
            render: (_: unknown, record: GitRepositoryRecord) => <GitRepoNameCell onOpenDetail={onOpenDetail} record={record} />,
        },
        {
            columnKey: 'status',
            columnTitle: '状态',
            dataIndex: 'status',
            width: 90,
            sorter: true,
            headerFilters: statusOptions,
            render: (_: unknown, record: GitRepositoryRecord) => {
                const status = statusConfig[record.status] || statusConfig.pending;
                return <Badge status={status.badge} text={status.text} />;
            },
        },
        {
            columnKey: 'auth_type',
            columnTitle: '认证',
            dataIndex: 'auth_type',
            width: 80,
            headerFilters: authTypeOptions,
            render: (value: string) => {
                const auth = authLabels[value] || authLabels.none;
                return (
                    <Space size={4}>
                        <Text type="secondary">{auth.icon}</Text>
                        <Text type="secondary">{auth.text}</Text>
                    </Space>
                );
            },
        },
        {
            columnKey: 'last_commit_id',
            columnTitle: 'Commit',
            dataIndex: 'last_commit_id',
            width: 120,
            render: (value: string) => (
                value ? <Text code copyable={{ text: value }} style={{ fontSize: 11 }}>{value}</Text> : '-'
            ),
        },
        {
            columnKey: 'sync_info',
            columnTitle: '同步',
            width: 150,
            render: (_: unknown, record: GitRepositoryRecord) => <GitRepoSyncInfoCell record={record} />,
        },
        {
            columnKey: 'created_at',
            columnTitle: '创建时间',
            dataIndex: 'created_at',
            width: 140,
            defaultVisible: false,
            sorter: true,
            render: (_: unknown, record: GitRepositoryRecord) => dayjs(record.created_at).format('YYYY-MM-DD HH:mm'),
        },
        {
            columnKey: 'actions',
            columnTitle: '操作',
            fixedColumn: true,
            width: 160,
            render: (_: unknown, record: GitRepositoryRecord) => (
                <GitRepoActionsCell access={access} onDelete={onDelete} onEdit={onEdit} onOpenFileBrowser={onOpenFileBrowser} onSync={onSync} record={record} syncing={syncing} />
            ),
        },
    ];
}

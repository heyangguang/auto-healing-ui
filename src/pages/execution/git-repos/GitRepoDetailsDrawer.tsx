import React from 'react';
import {
    CloudSyncOutlined,
    DeleteOutlined,
    FolderOutlined,
    SettingOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { Badge, Button, Drawer, Popconfirm, Space, Tabs } from 'antd';
import type { GitCommitRecord, GitRepositoryRecord, GitSyncLogRecord } from '@/services/auto-healing/git-repos';
import { authLabels, getProviderInfo, statusConfig, type GitRepoTableAccess } from './gitRepoListMeta';
import GitRepoOverviewTab from './GitRepoOverviewTab';
import GitRepoSyncLogsTab from './GitRepoSyncLogsTab';
import './index.css';

type GitRepoDetailsDrawerProps = {
    activeTab: string;
    commits: GitCommitRecord[];
    currentRow?: GitRepositoryRecord;
    drawerOpen: boolean;
    drawerPlaybooks: AutoHealing.Playbook[];
    loadingCommits: boolean;
    loadingLogs: boolean;
    onClose: () => void;
    onDelete: (id: string) => void;
    onEdit: (record: GitRepositoryRecord) => void;
    onOpenFiles: (record: GitRepositoryRecord) => void;
    onOpenPlaybooks: () => void;
    onSync: (record: GitRepositoryRecord) => void;
    permissions: GitRepoTableAccess;
    setActiveTab: (key: string) => void;
    syncing?: string;
    syncLogs: GitSyncLogRecord[];
};

export default function GitRepoDetailsDrawer(props: GitRepoDetailsDrawerProps) {
    const {
        activeTab,
        commits,
        currentRow,
        drawerOpen,
        drawerPlaybooks,
        loadingCommits,
        loadingLogs,
        onClose,
        onDelete,
        onEdit,
        onOpenFiles,
        onOpenPlaybooks,
        onSync,
        permissions,
        setActiveTab,
        syncing,
        syncLogs,
    } = props;

    if (!currentRow) {
        return null;
    }

    const status = statusConfig[currentRow.status] || statusConfig.pending;
    const auth = authLabels[currentRow.auth_type] || authLabels.none;
    const provider = getProviderInfo(currentRow.url);

    return (
        <Drawer
            title={null}
            size={680}
            open={drawerOpen}
            onClose={onClose}
            styles={{ header: { display: 'none' }, body: { padding: 0 } }}
            destroyOnHidden
        >
            <div className="git-detail-header">
                <div className="git-detail-header-top">
                    <div className="git-detail-header-icon" style={{ background: provider.bg, color: provider.color }}>
                        {provider.icon}
                    </div>
                    <div className="git-detail-header-info">
                        <div className="git-detail-title">{currentRow.name}</div>
                        <div className="git-detail-sub">{currentRow.url}</div>
                    </div>
                    <Badge status={status.badge} text={status.text} />
                </div>
                <Space size="small">
                    <Button
                        size="small"
                        icon={<SyncOutlined spin={syncing === currentRow.id} />}
                        onClick={() => onSync(currentRow)}
                        disabled={!!syncing || !permissions.canSyncRepo}
                    >
                        同步
                    </Button>
                    <Button
                        size="small"
                        icon={<FolderOutlined />}
                        onClick={() => onOpenFiles(currentRow)}
                        disabled={currentRow.status !== 'ready'}
                    >
                        文件
                    </Button>
                    <Button
                        size="small"
                        icon={<SettingOutlined />}
                        onClick={() => onEdit(currentRow)}
                        disabled={!permissions.canUpdateGitRepo}
                    >
                        编辑
                    </Button>
                    <Popconfirm title="确定删除？" description="本地代码也会被清除" onConfirm={() => onDelete(currentRow.id)}>
                        <Button size="small" danger icon={<DeleteOutlined />} disabled={!permissions.canDeleteRepo}>
                            删除
                        </Button>
                    </Popconfirm>
                </Space>
            </div>

            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                className="git-detail-tabs"
                items={[
                    {
                        key: 'info',
                        label: '概览',
                        children: <GitRepoOverviewTab auth={auth} commits={commits} currentRow={currentRow} drawerPlaybooks={drawerPlaybooks} loadingCommits={loadingCommits} onOpenPlaybooks={onOpenPlaybooks} />,
                    },
                    {
                        key: 'logs',
                        label: <><CloudSyncOutlined style={{ marginRight: 4 }} />同步日志</>,
                        children: <GitRepoSyncLogsTab loadingLogs={loadingLogs} syncLogs={syncLogs} />,
                    },
                ]}
            />
        </Drawer>
    );
}

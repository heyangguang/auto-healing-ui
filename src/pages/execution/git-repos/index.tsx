import React, { useMemo } from 'react';
import { CodeOutlined, PlusOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { history, useAccess } from '@umijs/max';
import StandardTable from '@/components/StandardTable';
import GitRepoDetailsDrawer from './GitRepoDetailsDrawer';
import GitRepoFileBrowserModal from './GitRepoFileBrowserModal';
import { createGitRepoColumns } from './gitRepoColumns';
import { advancedSearchFields, headerIcon, searchFields } from './gitRepoListMeta';
import { useGitRepoListModel } from './useGitRepoListModel';
import './index.css';

const STAT_ITEMS = [
    { key: 'total', icon: <CodeOutlined />, cls: 'total', label: '总仓库' },
    { key: 'ready', icon: <CheckCircleOutlined />, cls: 'ready', label: '就绪' },
    { key: 'syncing', icon: <SyncOutlined />, cls: 'syncing', label: '同步中' },
    { key: 'pending', icon: <ClockCircleOutlined />, cls: 'pending', label: '待同步' },
    { key: 'error', icon: <CloseCircleOutlined />, cls: 'error', label: '错误' },
] as const;

const GitRepoList: React.FC = () => {
    const access = useAccess();
    const model = useGitRepoListModel();

    const columns = useMemo(() => createGitRepoColumns({
        access: {
            canDeleteRepo: access.canDeleteRepo,
            canSyncRepo: access.canSyncRepo,
            canUpdateGitRepo: access.canUpdateGitRepo,
        },
        authTypeOptions: model.authTypeOptions,
        onDelete: model.handleDelete,
        onEdit: model.openEdit,
        onOpenDetail: model.openDetail,
        onOpenFileBrowser: model.openFileBrowser,
        onSync: model.handleSync,
        statusOptions: model.statusOptions,
        syncing: model.syncing,
    }), [
        access.canDeleteRepo,
        access.canSyncRepo,
        access.canUpdateGitRepo,
        model.authTypeOptions,
        model.handleDelete,
        model.handleSync,
        model.openDetail,
        model.openEdit,
        model.openFileBrowser,
        model.statusOptions,
        model.syncing,
    ]);

    const statsBar = useMemo(() => (
        <div className="git-stats-bar">
            {STAT_ITEMS.map((item, index) => (
                <React.Fragment key={item.key}>
                    {index > 0 && <div className="git-stat-divider" />}
                    <div className="git-stat-item">
                        <span className={`git-stat-icon git-stat-icon-${item.cls}${model.syncing && item.key === 'syncing' ? ' git-stat-icon-syncing' : ''}`}>
                            {item.icon}
                        </span>
                        <div className="git-stat-content">
                            <div className="git-stat-value">{model.stats[item.key]}</div>
                            <div className="git-stat-label">{item.label}</div>
                        </div>
                    </div>
                </React.Fragment>
            ))}
        </div>
    ), [model.stats, model.syncing]);

    return (
        <>
            <StandardTable
                refreshTrigger={model.refreshTrigger}
                tabs={[{ key: 'list', label: '仓库列表' }]}
                title="代码仓库"
                description="管理 Git 代码仓库，同步 Ansible Playbook 和配置文件。"
                headerIcon={headerIcon}
                headerExtra={statsBar}
                searchFields={searchFields}
                advancedSearchFields={advancedSearchFields}
                primaryActionLabel="添加仓库"
                primaryActionIcon={<PlusOutlined />}
                primaryActionDisabled={!access.canCreateGitRepo}
                onPrimaryAction={model.openCreate}
                columns={columns}
                rowKey="id"
                onRowClick={model.openDetail}
                request={model.handleRequest}
                defaultPageSize={20}
                preferenceKey="git_repos_v2"
            />

            <GitRepoDetailsDrawer
                activeTab={model.activeTab}
                commits={model.commits}
                currentRow={model.currentRow}
                drawerOpen={model.drawerOpen}
                drawerPlaybooks={model.drawerPlaybooks}
                loadingCommits={model.loadingCommits}
                loadingLogs={model.loadingLogs}
                onClose={model.closeDetail}
                onDelete={model.handleDelete}
                onEdit={(record) => {
                    model.closeDetail();
                    model.openEdit(record);
                }}
                onOpenFiles={model.openFileBrowser}
                onOpenPlaybooks={() => history.push('/execution/playbooks')}
                onSync={model.handleSync}
                permissions={{
                    canDeleteRepo: access.canDeleteRepo,
                    canSyncRepo: access.canSyncRepo,
                    canUpdateGitRepo: access.canUpdateGitRepo,
                }}
                setActiveTab={model.setActiveTab}
                syncing={model.syncing}
                syncLogs={model.syncLogs}
            />

            <GitRepoFileBrowserModal
                fileBrowserOpen={model.fileBrowserOpen}
                fileContent={model.fileContent}
                fileTree={model.fileTree}
                loadingContent={model.loadingContent}
                loadingFiles={model.loadingFiles}
                onCancel={model.closeFileBrowser}
                onRefresh={model.loadFileTree}
                onSelectFile={model.loadFileContent}
                selectedFilePath={model.selectedFilePath}
                selectedRepo={model.currentRow}
            />
        </>
    );
};

export default GitRepoList;

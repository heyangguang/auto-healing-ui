import React from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { history, useAccess } from '@umijs/max';
import StandardTable from '@/components/StandardTable';
import PlaybookDialogs from './PlaybookDialogs';
import PlaybookStatsBar from './PlaybookStatsBar';
import PlaybookWorkspace from './PlaybookWorkspace';
import { playbookAdvancedSearchFields, playbookHeaderIcon, playbookSearchFields } from './playbookShellConfig';
import { usePlaybookListModel } from './usePlaybookListModel';
import './index.css';

const PlaybookList: React.FC = () => {
    const access = useAccess();
    const model = usePlaybookListModel();

    return (
        <StandardTable
            tabs={[{ key: 'workbench', label: 'Playbook 工作台' }]}
            title="Playbook 模板管理"
            description="管理 Ansible Playbook 模板，支持从 Git 仓库导入、变量扫描和版本追踪。"
            headerExtra={<PlaybookStatsBar stats={model.stats} />}
            headerIcon={playbookHeaderIcon}
            columns={[]}
            searchFields={playbookSearchFields}
            advancedSearchFields={playbookAdvancedSearchFields}
            onSearch={model.handleSearch}
            primaryActionLabel="导入 Playbook"
            primaryActionIcon={<PlusOutlined />}
            primaryActionDisabled={!access.canImportPlaybook}
            onPrimaryAction={() => history.push('/execution/playbooks/import')}
        >
            <PlaybookWorkspace
                activeTab={model.activeTab}
                canManagePlaybook={!!access.canManagePlaybook}
                deferredVariables={model.deferredVariables}
                editedVariables={model.editedVariables}
                expandedKeys={model.expandedKeys}
                fileContent={model.fileContent}
                groupedPlaybooks={model.groupedPlaybooks}
                initialized={model.initialized}
                isVariablesStale={model.isVariablesStale}
                loadingDetail={model.loadingDetail}
                loadingFileContent={model.loadingFileContent}
                loadingLogs={model.loadingLogs}
                onAutoSave={model.autoSaveVariables}
                onDelete={model.openDeleteConfirm}
                onEdit={() => model.setEditModalOpen(true)}
                onScan={model.handleScan}
                onSelectFile={model.handleSelectFile}
                onSelectPlaybook={model.handleSelectPlaybook}
                onSetActiveTab={model.setActiveTab}
                onSetOffline={model.handleSetOffline}
                onSetReady={model.handleSetReady}
                onToggleRepo={model.toggleRepo}
                playbookFiles={model.playbookFiles}
                repos={model.repos}
                scanLogs={model.scanLogs}
                scanning={model.scanning}
                selectedFilePath={model.selectedFilePath}
                selectedPlaybook={model.selectedPlaybook}
                statusInfo={model.statusInfo}
            />

            <PlaybookDialogs
                deleteConfirmOpen={model.deleteConfirmOpen}
                deleteTarget={model.deleteTarget}
                editModalOpen={model.editModalOpen}
                onCloseDelete={() => model.setDeleteConfirmOpen(false)}
                onDelete={model.handleDelete}
                onEditFinish={model.handleEditPlaybook}
                onEditOpenChange={model.setEditModalOpen}
                relatedTaskCount={model.relatedTaskCount}
                selectedPlaybook={model.selectedPlaybook}
            />
        </StandardTable>
    );
};

export default PlaybookList;

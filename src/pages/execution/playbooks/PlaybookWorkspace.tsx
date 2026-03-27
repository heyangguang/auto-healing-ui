import React from 'react';
import { Card } from 'antd';
import PlaybookDetailPane from './PlaybookDetailPane';
import PlaybookSidebar from './PlaybookSidebar';
import type { PlaybookStatusSummary } from './playbookTypes';

type PlaybookWorkspaceProps = {
    activeTab: string;
    canManagePlaybook: boolean;
    deferredVariables: AutoHealing.PlaybookVariable[];
    editedVariables: AutoHealing.PlaybookVariable[];
    expandedKeys: React.Key[];
    fileContent: string;
    groupedPlaybooks: Record<string, { repo: AutoHealing.GitRepository | null; playbooks: AutoHealing.Playbook[] }>;
    initialized: boolean;
    isVariablesStale: boolean;
    loadingDetail: boolean;
    loadingFileContent: boolean;
    loadingLogs: boolean;
    onAutoSave: (variables: AutoHealing.PlaybookVariable[]) => void;
    onDelete: () => void;
    onEdit: () => void;
    onScan: () => void;
    onSelectFile: (filePath: string) => void;
    onSelectPlaybook: (playbook: AutoHealing.Playbook) => void;
    onSetActiveTab: (key: string) => void;
    onSetOffline: () => void;
    onSetReady: () => void;
    onToggleRepo: (repoId: string) => void;
    playbookFiles: AutoHealing.PlaybookFile[];
    repos: AutoHealing.GitRepository[];
    scanLogs: AutoHealing.PlaybookScanLog[];
    scanning?: string;
    selectedFilePath: string;
    selectedPlaybook?: AutoHealing.Playbook;
    statusInfo?: PlaybookStatusSummary;
};

export default function PlaybookWorkspace(props: PlaybookWorkspaceProps) {
    const {
        activeTab,
        canManagePlaybook,
        deferredVariables,
        editedVariables,
        expandedKeys,
        fileContent,
        groupedPlaybooks,
        initialized,
        isVariablesStale,
        loadingDetail,
        loadingFileContent,
        loadingLogs,
        onAutoSave,
        onDelete,
        onEdit,
        onScan,
        onSelectFile,
        onSelectPlaybook,
        onSetActiveTab,
        onSetOffline,
        onSetReady,
        onToggleRepo,
        playbookFiles,
        repos,
        scanLogs,
        scanning,
        selectedFilePath,
        selectedPlaybook,
        statusInfo,
    } = props;

    return (
        <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 260px)' }}>
            <div style={{ width: (activeTab === 'variables' || activeTab === 'files') ? 48 : 280, flexShrink: 0, transition: 'opacity 0.15s ease-out', opacity: 1 }}>
                <PlaybookSidebar activeTab={activeTab} expandedKeys={expandedKeys} groupedPlaybooks={groupedPlaybooks} initialized={initialized} onSelectPlaybook={onSelectPlaybook} onSetActiveTab={onSetActiveTab} onToggleRepo={onToggleRepo} selectedPlaybook={selectedPlaybook} />
            </div>
            <div style={{ flex: 1, minWidth: 0, transition: 'opacity 0.15s ease-out' }}>
                <Card styles={{ body: { padding: 0, height: '100%', overflow: 'hidden' } }} style={{ height: '100%', overflow: 'hidden' }}>
                    <PlaybookDetailPane activeTab={activeTab} canManagePlaybook={canManagePlaybook} deferredVariables={deferredVariables} editedVariables={editedVariables} fileContent={fileContent} isVariablesStale={isVariablesStale} loadingDetail={loadingDetail} loadingFileContent={loadingFileContent} loadingLogs={loadingLogs} onAutoSave={onAutoSave} onDelete={onDelete} onEdit={onEdit} onScan={onScan} onSelectFile={onSelectFile} onSetActiveTab={onSetActiveTab} onSetOffline={onSetOffline} onSetReady={onSetReady} playbookFiles={playbookFiles} repos={repos} scanLogs={scanLogs} scanning={scanning} selectedFilePath={selectedFilePath} selectedPlaybook={selectedPlaybook} statusInfo={statusInfo} />
                </Card>
            </div>
        </div>
    );
}

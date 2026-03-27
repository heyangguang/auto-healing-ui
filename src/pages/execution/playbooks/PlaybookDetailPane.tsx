import React from 'react';
import { Badge, Empty, Spin, Tabs } from 'antd';
import PlaybookDetailHeader from './PlaybookDetailHeader';
import PlaybookFilesPanel from './PlaybookFilesPanel';
import PlaybookOverviewPanel from './PlaybookOverviewPanel';
import PlaybookScanLogsPanel from './PlaybookScanLogsPanel';
import PlaybookVariablesPanel from './PlaybookVariablesPanel';
import { getProviderInfo } from './playbookProviderInfo';
import type { PlaybookStatusSummary } from './playbookTypes';

type PlaybookDetailPaneProps = {
    activeTab: string;
    canManagePlaybook: boolean;
    deferredVariables: AutoHealing.PlaybookVariable[];
    editedVariables: AutoHealing.PlaybookVariable[];
    fileContent: string;
    isVariablesStale: boolean;
    loadingDetail: boolean;
    loadingFileContent: boolean;
    loadingLogs: boolean;
    onAutoSave: (variables: AutoHealing.PlaybookVariable[]) => void;
    onDelete: () => void;
    onEdit: () => void;
    onScan: () => void;
    onSelectFile: (filePath: string) => void;
    onSetActiveTab: (key: string) => void;
    onSetOffline: () => void;
    onSetReady: () => void;
    playbookFiles: AutoHealing.PlaybookFile[];
    repos: AutoHealing.GitRepository[];
    scanLogs: AutoHealing.PlaybookScanLog[];
    scanning?: string;
    selectedFilePath: string;
    selectedPlaybook?: AutoHealing.Playbook;
    statusInfo?: PlaybookStatusSummary;
};

function buildTabItems(props: PlaybookDetailPaneProps) {
    const {
        canManagePlaybook,
        deferredVariables,
        editedVariables,
        fileContent,
        isVariablesStale,
        loadingFileContent,
        loadingLogs,
        onAutoSave,
        onSelectFile,
        playbookFiles,
        repos,
        scanLogs,
        selectedFilePath,
        selectedPlaybook,
        statusInfo,
    } = props;

    return [
        {
            key: 'overview',
            label: '概览',
            children: selectedPlaybook && statusInfo
                ? <PlaybookOverviewPanel playbook={selectedPlaybook} playbookFiles={playbookFiles} repos={repos} scanLogs={scanLogs} statusInfo={statusInfo} getProviderInfo={getProviderInfo} />
                : null,
        },
        {
            key: 'variables',
            label: <Badge count={editedVariables.length} size="small" offset={[8, 0]}>变量 </Badge>,
            children: <PlaybookVariablesPanel canManage={canManagePlaybook} deferredVariables={deferredVariables} editedVariables={editedVariables} isVariablesStale={isVariablesStale} onAutoSave={onAutoSave} />,
        },
        {
            key: 'files',
            label: <Badge count={playbookFiles.length} size="small" offset={[8, 0]}>文件 </Badge>,
            children: <PlaybookFilesPanel fileContent={fileContent} loadingFileContent={loadingFileContent} onSelectFile={onSelectFile} playbookFiles={playbookFiles} selectedFilePath={selectedFilePath} />,
        },
        {
            key: 'logs',
            label: '扫描日志',
            children: <PlaybookScanLogsPanel loadingLogs={loadingLogs} scanLogs={scanLogs} />,
        },
    ];
}

export default function PlaybookDetailPane(props: PlaybookDetailPaneProps) {
    const {
        activeTab,
        canManagePlaybook,
        loadingDetail,
        onDelete,
        onEdit,
        onScan,
        onSetActiveTab,
        onSetOffline,
        onSetReady,
        scanning,
        selectedPlaybook,
        statusInfo,
    } = props;

    if (!selectedPlaybook) {
        return <div style={{ height: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Empty description="请从左侧选择一个 Playbook" /></div>;
    }
    if (loadingDetail || !statusInfo) {
        return <div style={{ height: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin size="large" /></div>;
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <PlaybookDetailHeader canManage={canManagePlaybook} onDelete={onDelete} onEdit={onEdit} onScan={onScan} onSetOffline={onSetOffline} onSetReady={onSetReady} playbook={selectedPlaybook} scanning={scanning} statusInfo={statusInfo} />
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Tabs activeKey={activeTab} onChange={onSetActiveTab} className="pb-detail-tabs" tabBarStyle={{ padding: '0 24px', marginBottom: 0 }} items={buildTabItems(props)} />
            </div>
        </div>
    );
}

import React from 'react';
import { history, useAccess } from '@umijs/max';
import ExecuteLaunchpad from './components/ExecuteLaunchpad';
import ExecutionMissionControl from './components/ExecutionMissionControl';
import { useExecuteExecutionSession } from './useExecuteExecutionSession';
import { useExecuteLaunchpadData } from './useExecuteLaunchpadData';
import './style.css';
import '../templates/index.css';

const ExecuteTaskPage: React.FC = () => {
    const access = useAccess();
    const mission = useExecuteExecutionSession();
    const launchpad = useExecuteLaunchpadData({
        onSelectTemplate: mission.handleSelectTemplate,
        preselectedTemplateSequenceRef: mission.preselectedTemplateSequenceRef,
    });

    if (mission.mode === 'selection') {
        return (
            <ExecuteLaunchpad
                canCreateTask={access.canCreateTask}
                currentPage={launchpad.currentPage}
                errorMessage={launchpad.listError}
                filteredTemplates={launchpad.templates}
                initialized={launchpad.initialized}
                loading={launchpad.loading}
                pageSize={launchpad.pageSize}
                stats={launchpad.stats}
                statsAvailability={launchpad.statsAvailability}
                totalTemplates={launchpad.totalTemplates}
                onPageChange={(page, size) => {
                    launchpad.setCurrentPage(page);
                    launchpad.setPageSize(size);
                }}
                onPrimaryAction={() => history.push('/execution/templates/create')}
                onRetry={() => {
                    void launchpad.refreshData();
                }}
                onSearch={launchpad.handleLaunchpadSearch}
                onSelectTemplate={mission.handleSelectTemplate}
            />
        );
    }

    if (!mission.selectedTemplate) {
        return null;
    }

    return (
        <ExecutionMissionControl
            additionalHosts={mission.additionalHosts}
            additionalSecretIds={mission.additionalSecretIds}
            canExecuteTask={access.canExecuteTask}
            channels={launchpad.channels}
            executing={mission.executing}
            hasNotificationConfig={mission.hasNotificationConfig}
            loadingPlaybook={mission.loadingPlaybook}
            notifyTemplates={launchpad.notifyTemplates}
            playbookLoadFailed={mission.playbookLoadFailed}
            secretsSources={launchpad.secretsSources}
            selectedTemplate={mission.selectedTemplate}
            skipNotification={mission.skipNotification}
            templatePlaybook={mission.templatePlaybook}
            variableValues={mission.variableValues}
            onAdditionalHostsChange={mission.setAdditionalHosts}
            onAdditionalSecretIdsChange={mission.setAdditionalSecretIds}
            onBack={mission.handleBackToSelection}
            onExecute={mission.handleExecute}
            onSkipNotificationChange={mission.setSkipNotification}
            onVariableChange={mission.handleVariableChange}
        />
    );
};

export default ExecuteTaskPage;

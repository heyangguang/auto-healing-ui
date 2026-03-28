import React from 'react';
import { Col, Row, Tag } from 'antd';
import SubPageHeader from '@/components/SubPageHeader';
import { getExecutorConfig } from '@/constants/executionDicts';
import ExecutionMissionControlFooter from './ExecutionMissionControlFooter';
import ExecutionMissionControlMainHeader from './ExecutionMissionControlMainHeader';
import ExecutionMissionControlSecretsCard from './ExecutionMissionControlSecretsCard';
import ExecutionMissionControlSidebar from './ExecutionMissionControlSidebar';
import ExecutionMissionControlTargetsCard from './ExecutionMissionControlTargetsCard';
import ExecutionMissionControlVariablesSection from './ExecutionMissionControlVariablesSection';
import {
    getMissionVariables,
    getTemplateHosts,
    getTimeoutConfigs,
    hasMissingRequiredVariables,
    shouldShowNotificationDisplay,
    splitMissionVariables,
} from './executionMissionControlHelpers';
import type { ExecutionMissionControlProps } from './executionMissionControlTypes';

const ExecutionMissionControl: React.FC<ExecutionMissionControlProps> = ({
    additionalHosts,
    additionalSecretIds,
    canExecuteTask,
    channels,
    executing,
    hasNotificationConfig,
    loadingPlaybook,
    notifyTemplates,
    playbookLoadFailed,
    secretsSources,
    selectedTemplate,
    skipNotification,
    templatePlaybook,
    variableValues,
    onAdditionalHostsChange,
    onAdditionalSecretIdsChange,
    onBack,
    onExecute,
    onSkipNotificationChange,
    onVariableChange,
}) => {
    const variables = getMissionVariables(templatePlaybook);
    const { requiredVariables, optionalVariables } = splitMissionVariables(variables);
    const hasMissingVariables = hasMissingRequiredVariables(requiredVariables, variableValues);
    const templateSecretsCount = selectedTemplate.secrets_source_ids?.length || 0;
    const resolvedTemplateHosts = getTemplateHosts(selectedTemplate.target_hosts);
    const templateHostsCount = resolvedTemplateHosts.length;
    const totalSecretsCount = templateSecretsCount + additionalSecretIds.length;
    const totalHostsCount = templateHostsCount + additionalHosts.length;
    const timeoutConfigs = getTimeoutConfigs(selectedTemplate.notification_config);
    const executorConfig = getExecutorConfig(selectedTemplate.executor_type);
    const showNotificationDisplay = shouldShowNotificationDisplay(
        selectedTemplate.notification_config,
        hasNotificationConfig,
    );
    const executeDisabled = (
        (templateHostsCount === 0 && additionalHosts.length === 0)
        || selectedTemplate.needs_review
        || loadingPlaybook
        || playbookLoadFailed
        || hasMissingVariables
        || !canExecuteTask
    );

    return (
        <div style={{ height: 'auto', overflow: 'visible' }}>
            <SubPageHeader
                title={selectedTemplate.name || '未命名任务'}
                titleExtra={
                    <Tag color={executorConfig.tagColor || executorConfig.color}>
                        {executorConfig.label}
                    </Tag>
                }
                onBack={onBack}
            />

            <div style={{ background: '#fff', margin: '16px 24px 24px', border: '1px solid #f0f0f0' }}>
                <div className="execution-cockpit" style={{ margin: 0 }}>
                    <ExecutionMissionControlSidebar
                        channels={channels}
                        hasNotificationConfig={hasNotificationConfig}
                        notifyTemplates={notifyTemplates}
                        selectedTemplate={selectedTemplate}
                        showNotificationDisplay={showNotificationDisplay}
                        skipNotification={skipNotification}
                        templateHostsCount={templateHostsCount}
                        templatePlaybookName={templatePlaybook?.name}
                        timeoutConfigs={timeoutConfigs}
                        variableCount={variables.length}
                        onSkipNotificationChange={onSkipNotificationChange}
                    />

                    <div className="cockpit-main">
                        <ExecutionMissionControlMainHeader
                            totalHostsCount={totalHostsCount}
                            totalSecretsCount={totalSecretsCount}
                        />

                        <div className="main-content">
                            <Row gutter={24}>
                                <Col span={12}>
                                    <ExecutionMissionControlTargetsCard
                                        additionalHosts={additionalHosts}
                                        targetHosts={selectedTemplate.target_hosts}
                                        templateHosts={resolvedTemplateHosts}
                                        onAdditionalHostsChange={onAdditionalHostsChange}
                                    />
                                </Col>

                                <Col span={12}>
                                    <ExecutionMissionControlSecretsCard
                                        additionalSecretIds={additionalSecretIds}
                                        secretsSources={secretsSources}
                                        templateSecretIds={selectedTemplate.secrets_source_ids || []}
                                        onAdditionalSecretIdsChange={onAdditionalSecretIdsChange}
                                    />
                                </Col>
                            </Row>

                            <ExecutionMissionControlVariablesSection
                                loadingPlaybook={loadingPlaybook}
                                optionalVariables={optionalVariables}
                                playbookLoadFailed={playbookLoadFailed}
                                requiredVariables={requiredVariables}
                                variableValues={variableValues}
                                onVariableChange={onVariableChange}
                            />
                        </div>

                        <ExecutionMissionControlFooter
                            disabled={executeDisabled}
                            executing={executing}
                            onExecute={onExecute}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExecutionMissionControl;

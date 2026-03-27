import React, { useCallback, useEffect, useState } from 'react';
import { history, useAccess, useParams } from '@umijs/max';
import { Alert, Button, Form, Spin, message } from 'antd';
import { ExclamationCircleOutlined, SaveOutlined } from '@ant-design/icons';
import SubPageHeader from '@/components/SubPageHeader';
import {
    createCommandBlacklistRule,
    getCommandBlacklistRule,
    type CommandBlacklistRule,
    updateCommandBlacklistRule,
} from '@/services/auto-healing/commandBlacklist';
import BlacklistRuleBasicInfoSection from './BlacklistRuleBasicInfoSection';
import BlacklistRuleMatchConfigSection from './BlacklistRuleMatchConfigSection';
import BlacklistRuleSimulationPanel from './BlacklistRuleSimulationPanel';
import BlacklistTaskTemplateSelectorModal from './BlacklistTaskTemplateSelectorModal';
import { useBlacklistSimulation } from './useBlacklistSimulation';
import { useBlacklistTaskSelector } from './useBlacklistTaskSelector';
import './BlacklistRuleForm.css';

type FormValidationError = {
    errorFields?: unknown;
};

const INITIAL_VALUES = {
    match_type: 'contains',
    severity: 'critical',
} as const;

const hasFormErrorFields = (error: unknown): error is FormValidationError =>
    typeof error === 'object' && error !== null && 'errorFields' in error;

const BlacklistRuleForm: React.FC = () => {
    const access = useAccess();
    const formParams = useParams<{ id?: string }>();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [isSystem, setIsSystem] = useState(false);
    const [loadFailed, setLoadFailed] = useState(false);
    const [selectedMatchType, setSelectedMatchType] =
        useState<CommandBlacklistRule['match_type']>('contains');

    const isEdit = Boolean(formParams.id);
    const patternValue = Form.useWatch('pattern', form);

    const {
        displayTasks,
        executorType,
        expandedKeys,
        hasMore,
        handleScroll,
        initLoading,
        pendingPlaybook,
        pendingTask,
        playbookList,
        selectedTreeKey,
        setExecutorType,
        setExpandedKeys,
        setPendingTask,
        setSelectedTreeKey,
        setStatusFilter,
        setTaskSearch,
        statusFilter,
        taskSearch,
        tasksLoading,
        tasksTotal,
        treeData,
    } = useBlacklistTaskSelector({ open: selectorOpen });

    const {
        handleClearLoaded,
        handleConfirmTemplate,
        handleFileCheckChange,
        loadProgress,
        loadedFiles,
        loadingPlaybook,
        matchCount,
        matchedFiles,
        resetSimulationResults,
        selectedPlaybookName,
        selectedTemplateName,
        setSimMode,
        setTestInput,
        simMode,
        simulating,
        testInput,
        testResults,
    } = useBlacklistSimulation(patternValue, selectedMatchType);

    useEffect(() => {
        if (!isEdit || !formParams.id) {
            form.setFieldsValue(INITIAL_VALUES);
            setLoadFailed(false);
            return;
        }

        const loadRule = async () => {
            setLoading(true);
            try {
                const rule = await getCommandBlacklistRule(formParams.id!);
                setLoadFailed(false);
                form.setFieldsValue({
                    name: rule.name,
                    pattern: rule.pattern,
                    match_type: rule.match_type,
                    severity: rule.severity,
                    category: rule.category,
                    description: rule.description,
                });
                setSelectedMatchType(rule.match_type);
                setIsSystem(rule.is_system);
            } catch {
                setLoadFailed(true);
                message.error('加载规则详情失败，当前不可提交');
                /* global error handler */
            } finally {
                setLoading(false);
            }
        };

        void loadRule();
    }, [form, formParams.id, isEdit]);

    const handleSimulationModeChange = useCallback((mode: 'template' | 'manual') => {
        setSimMode(mode);
        resetSimulationResults();
    }, [resetSimulationResults, setSimMode]);

    const handleTemplateConfirm = useCallback(async () => {
        if (!pendingTask || loadingPlaybook) {
            return;
        }
        try {
            const loaded = await handleConfirmTemplate(pendingTask);
            if (loaded) {
                setSelectorOpen(false);
            }
        } catch (error) {
            message.error(error instanceof Error ? error.message : '加载任务模板关联文件失败');
        }
    }, [handleConfirmTemplate, loadingPlaybook, pendingTask]);

    const handleSubmit = useCallback(async () => {
        try {
            if (loadFailed) {
                message.error('规则详情加载失败，无法提交');
                return;
            }
            if (isEdit && isSystem) {
                message.warning('系统内置规则不允许编辑');
                return;
            }

            const values = await form.validateFields();
            values.match_type = selectedMatchType;
            setSubmitting(true);

            if (isEdit && formParams.id) {
                await updateCommandBlacklistRule(formParams.id, values);
                message.success('规则已更新');
            } else {
                await createCommandBlacklistRule(values);
                message.success('规则已创建');
            }
            history.push('/security/command-blacklist');
        } catch (error: unknown) {
            if (!hasFormErrorFields(error)) {
                /* global error handler */
            }
        } finally {
            setSubmitting(false);
        }
    }, [form, formParams.id, isEdit, isSystem, loadFailed, selectedMatchType]);

    return (
        <div className="blacklist-form-page">
            <SubPageHeader
                actions={(
                    <div className="blacklist-form-header-actions">
                        <Button onClick={() => history.push('/security/command-blacklist')}>取消</Button>
                        <Button
                            disabled={!access.canManageBlacklist || (isEdit && isSystem) || loadFailed}
                            icon={<SaveOutlined />}
                            loading={submitting}
                            onClick={handleSubmit}
                            type="primary"
                        >
                            {isEdit ? '保存修改' : '创建规则'}
                        </Button>
                    </div>
                )}
                onBack={() => history.push('/security/command-blacklist')}
                title={isEdit ? (isSystem ? '查看内置黑名单规则' : '编辑黑名单规则') : '添加黑名单规则'}
            />

            <Spin spinning={loading}>
                <Form form={form} initialValues={INITIAL_VALUES} layout="vertical" requiredMark={false} size="large">
                    <div className="blacklist-form-cards">
                        {loadFailed && (
                            <Alert
                                description="规则详情未加载成功，请返回列表后重试。"
                                title="加载失败"
                                showIcon
                                type="error"
                            />
                        )}
                        {isEdit && isSystem && (
                            <Alert
                                description="该规则为系统预置规则，部分字段不可修改。"
                                icon={<ExclamationCircleOutlined style={{ fontSize: 20 }} />}
                                title="系统内置规则"
                                showIcon
                                style={{ border: '1px solid #ffe58f' }}
                                type="warning"
                            />
                        )}

                        <BlacklistRuleBasicInfoSection isSystem={isSystem} />
                        <BlacklistRuleMatchConfigSection
                            form={form}
                            isSystem={isSystem}
                            onMatchTypeChange={setSelectedMatchType}
                            patternValue={patternValue}
                            selectedMatchType={selectedMatchType}
                        />
                        <BlacklistRuleSimulationPanel
                            loadedFiles={loadedFiles}
                            loadingPlaybook={loadingPlaybook}
                            loadProgress={loadProgress}
                            matchCount={matchCount}
                            matchedFiles={matchedFiles}
                            onClearLoaded={handleClearLoaded}
                            onFileCheckChange={handleFileCheckChange}
                            onManualInputChange={setTestInput}
                            onModeChange={handleSimulationModeChange}
                            onOpenSelector={() => setSelectorOpen(true)}
                            selectedPlaybookName={selectedPlaybookName}
                            selectedTemplateName={selectedTemplateName}
                            simMode={simMode}
                            simulating={simulating}
                            testInput={testInput}
                            testResults={testResults}
                        />
                    </div>
                </Form>
            </Spin>

            <BlacklistTaskTemplateSelectorModal
                confirmLoading={loadingPlaybook}
                displayTasks={displayTasks}
                executorType={executorType}
                expandedKeys={expandedKeys}
                hasMore={hasMore}
                initLoading={initLoading}
                onCancel={() => setSelectorOpen(false)}
                onConfirm={handleTemplateConfirm}
                onExecutorTypeChange={setExecutorType}
                onExpandedKeysChange={setExpandedKeys}
                onPendingTaskChange={setPendingTask}
                onScroll={handleScroll}
                onSelectedTreeKeyChange={setSelectedTreeKey}
                onStatusFilterChange={setStatusFilter}
                onTaskSearchChange={setTaskSearch}
                open={selectorOpen}
                pendingPlaybook={pendingPlaybook}
                pendingTask={pendingTask}
                playbookList={playbookList}
                selectedTreeKey={selectedTreeKey}
                statusFilter={statusFilter}
                taskSearch={taskSearch}
                tasksLoading={tasksLoading}
                tasksTotal={tasksTotal}
                treeData={treeData}
            />
        </div>
    );
};

export default BlacklistRuleForm;

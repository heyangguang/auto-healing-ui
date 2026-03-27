import { history } from '@umijs/max';
import { message } from 'antd';
import { useCallback, useMemo, useRef, useState } from 'react';
import { executeTask } from '@/services/auto-healing/execution';
import { getPlaybook } from '@/services/auto-healing/playbooks';
import { toJsonValue } from '@/utils/jsonValue';
import { createRequestSequence } from '@/utils/requestSequence';
import { hasEffectiveNotificationConfig } from '@/utils/notificationConfig';
import {
    buildExecuteTaskPayload,
    EXECUTION_RUN_ID_MISSING_ERROR,
    getExecutionRunIdOrThrow,
    getMissingRequiredVariableNames,
} from './executePageHelpers';
import {
    buildInitialVariableValues,
    buildSubmissionVariableValues,
    type VariableValueMap,
} from '../templates/templateVariableHelpers';

export function useExecuteExecutionSession() {
    const [mode, setMode] = useState<'selection' | 'execution'>('selection');
    const [selectedTemplate, setSelectedTemplate] = useState<AutoHealing.ExecutionTask>();
    const [templatePlaybook, setTemplatePlaybook] = useState<AutoHealing.Playbook>();
    const [playbookLoadFailed, setPlaybookLoadFailed] = useState(false);
    const [loadingPlaybook, setLoadingPlaybook] = useState(false);
    const [variableValues, setVariableValues] = useState<VariableValueMap>({});
    const [executing, setExecuting] = useState(false);
    const [additionalHosts, setAdditionalHosts] = useState<string[]>([]);
    const [additionalSecretIds, setAdditionalSecretIds] = useState<string[]>([]);
    const [skipNotification, setSkipNotification] = useState(false);
    const playbookRequestSequenceRef = useRef(createRequestSequence());
    const preselectedTemplateSequenceRef = useRef(createRequestSequence());

    const resetPlaybookState = useCallback((nextValues: VariableValueMap = {}) => {
        playbookRequestSequenceRef.current.invalidate();
        setLoadingPlaybook(false);
        setTemplatePlaybook(undefined);
        setPlaybookLoadFailed(false);
        setVariableValues(nextValues);
    }, []);

    const handleSelectTemplate = useCallback(async (template: AutoHealing.ExecutionTask) => {
        preselectedTemplateSequenceRef.current.invalidate();
        if (template.needs_review) {
            message.warning('任务模板需审核：请前往"任务模板管理"确认 Playbook 变更后方可执行。');
            return;
        }
        if (template.playbook && template.playbook.status !== 'ready') {
            message.warning('Playbook 未上线：只有上线状态的 Playbook 才能执行。');
            return;
        }
        setSelectedTemplate(template);
        setMode('execution');
        setAdditionalHosts([]);
        setAdditionalSecretIds([]);
        setSkipNotification(false);
        resetPlaybookState({ ...(template.extra_vars || {}) });
        if (!template.playbook_id) {
            return;
        }
        const token = playbookRequestSequenceRef.current.next();
        setLoadingPlaybook(true);
        try {
            const response = await getPlaybook(template.playbook_id);
            if (!playbookRequestSequenceRef.current.isCurrent(token)) return;
            if (!response.data) {
                setTemplatePlaybook(undefined);
                setPlaybookLoadFailed(true);
                return;
            }
            if (response.data.status && response.data.status !== 'ready') {
                message.warning('Playbook 未上线：只有上线状态的 Playbook 才能执行。');
                setMode('selection');
                setSelectedTemplate(undefined);
                setVariableValues({});
                return;
            }
            setTemplatePlaybook(response.data);
            setVariableValues(buildInitialVariableValues(response.data, template.extra_vars || {}));
        } catch {
            if (!playbookRequestSequenceRef.current.isCurrent(token)) return;
            setTemplatePlaybook(undefined);
            setPlaybookLoadFailed(true);
        } finally {
            if (playbookRequestSequenceRef.current.isCurrent(token)) setLoadingPlaybook(false);
        }
    }, [resetPlaybookState]);

    const handleExecute = useCallback(async () => {
        if (!selectedTemplate) return;
        if (loadingPlaybook) {
            message.warning('Playbook 元数据仍在加载，请稍后再执行');
            return;
        }
        if (selectedTemplate.playbook_id && playbookLoadFailed) {
            message.error('Playbook 元数据加载失败，无法确认必填变量，请刷新后重试');
            return;
        }
        const missingVariables = getMissingRequiredVariableNames(templatePlaybook, variableValues);
        if (missingVariables.length > 0) {
            message.error(`缺少必填参数: ${missingVariables.join(', ')}`);
            return;
        }
        let extraVars: VariableValueMap;
        try {
            extraVars = buildSubmissionVariableValues(templatePlaybook, variableValues);
        } catch (error) {
            message.error(error instanceof Error ? error.message : '变量格式无效');
            return;
        }
        setExecuting(true);
        try {
            const response = await executeTask(selectedTemplate.id, buildExecuteTaskPayload({
                additionalHosts,
                additionalSecretIds,
                extraVars,
                selectedTemplate,
                skipNotification,
            }));
            const runId = getExecutionRunIdOrThrow(response);
            message.success('任务已启动：执行初始化成功');
            history.push(`/execution/runs/${runId}`);
        } catch (error) {
            if (error instanceof Error && error.message === EXECUTION_RUN_ID_MISSING_ERROR) {
                message.error(error.message);
            }
        } finally {
            setExecuting(false);
        }
    }, [additionalHosts, additionalSecretIds, loadingPlaybook, playbookLoadFailed, selectedTemplate, skipNotification, templatePlaybook, variableValues]);

    const handleVariableChange = useCallback((name: string, value: unknown) => {
        setVariableValues((prev) => {
            const nextValues: VariableValueMap = { ...prev, [name]: toJsonValue(value) };
            return nextValues;
        });
    }, []);

    const handleBackToSelection = useCallback(() => {
        resetPlaybookState();
        setMode('selection');
        setSelectedTemplate(undefined);
    }, [resetPlaybookState]);

    return {
        additionalHosts,
        additionalSecretIds,
        executing,
        hasNotificationConfig: useMemo(
            () => hasEffectiveNotificationConfig(selectedTemplate?.notification_config as never),
            [selectedTemplate],
        ),
        loadingPlaybook,
        mode,
        playbookLoadFailed,
        preselectedTemplateSequenceRef,
        selectedTemplate,
        skipNotification,
        templatePlaybook,
        variableValues,
        handleBackToSelection,
        handleExecute,
        handleSelectTemplate,
        handleVariableChange,
        resetPlaybookState,
        setAdditionalHosts,
        setAdditionalSecretIds,
        setSkipNotification,
        setSelectedTemplate,
    };
}

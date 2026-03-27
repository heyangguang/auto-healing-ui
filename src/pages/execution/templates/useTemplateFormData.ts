import { message, type FormInstance } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    getExecutionTask,
} from '@/services/auto-healing/execution';
import { getPlaybook } from '@/services/auto-healing/playbooks';
import { getSecretsSources } from '@/services/auto-healing/secrets';
import {
    getCachedNotificationChannelInventory,
    getCachedNotificationTemplateInventory,
    getCachedPlaybookInventory,
} from '@/utils/selectorInventoryCache';
import { createRequestSequence } from '@/utils/requestSequence';
import {
    buildInitialVariableValues,
    type VariableValueMap,
} from './templateVariableHelpers';

type TemplateFormRecord = AutoHealing.ExecutionTask;

interface UseTemplateFormDataArgs {
    form: FormInstance;
    isEdit: boolean;
    taskId?: string;
}

interface LoadPlaybookArgs {
    overrides?: VariableValueMap;
    playbookId: string;
    taskToken?: number;
}

function buildTaskFormFields(record: TemplateFormRecord) {
    return {
        description: record.description,
        executor_type: record.executor_type || 'local',
        name: record.name,
        notification_config: record.notification_config || {},
        playbook_id: record.playbook_id,
        secrets_source_ids: record.secrets_source_ids || [],
        target_hosts: record.target_hosts ? record.target_hosts.split(',') : [],
    };
}

function isStalePlaybookRequest(options: {
    playbookSequence: ReturnType<typeof createRequestSequence>;
    playbookToken: number;
    taskSequence: ReturnType<typeof createRequestSequence>;
    taskToken?: number;
}) {
    const {
        playbookSequence,
        playbookToken,
        taskSequence,
        taskToken,
    } = options;
    if (!playbookSequence.isCurrent(playbookToken)) {
        return true;
    }
    if (taskToken === undefined) {
        return false;
    }
    return !taskSequence.isCurrent(taskToken);
}

export function useTemplateFormData({
    form,
    isEdit,
    taskId,
}: UseTemplateFormDataArgs) {
    const [loading, setLoading] = useState(false);
    const [loadingPlaybook, setLoadingPlaybook] = useState(false);
    const [playbooks, setPlaybooks] = useState<AutoHealing.Playbook[]>([]);
    const [selectedPlaybook, setSelectedPlaybook] = useState<AutoHealing.Playbook>();
    const [variableValues, setVariableValues] = useState<VariableValueMap>({});
    const [secretsSources, setSecretsSources] = useState<AutoHealing.SecretsSource[]>([]);
    const [notifyChannels, setNotifyChannels] = useState<AutoHealing.NotificationChannel[]>([]);
    const [notifyTemplates, setNotifyTemplates] = useState<AutoHealing.NotificationTemplate[]>([]);
    const [needsReview, setNeedsReview] = useState(false);
    const [changedVariables, setChangedVariables] = useState<unknown[]>([]);
    const taskRequestSequenceRef = useRef(createRequestSequence());
    const playbookRequestSequenceRef = useRef(createRequestSequence());

    const clearPlaybookState = useCallback((clearReview: boolean) => {
        playbookRequestSequenceRef.current.invalidate();
        setLoadingPlaybook(false);
        setSelectedPlaybook(undefined);
        setVariableValues({});
        if (!clearReview) {
            return;
        }
        setNeedsReview(false);
        setChangedVariables([]);
    }, []);

    const resetTemplateState = useCallback(() => {
        taskRequestSequenceRef.current.invalidate();
        clearPlaybookState(true);
        setLoading(false);
        form.resetFields();
    }, [clearPlaybookState, form]);

    const loadPlaybook = useCallback(async ({
        overrides = {},
        playbookId,
        taskToken,
    }: LoadPlaybookArgs) => {
        const playbookToken = playbookRequestSequenceRef.current.next();
        setLoadingPlaybook(true);

        try {
            const response = await getPlaybook(playbookId);
            if (isStalePlaybookRequest({
                playbookSequence: playbookRequestSequenceRef.current,
                playbookToken,
                taskSequence: taskRequestSequenceRef.current,
                taskToken,
            })) {
                return;
            }

            if (!response.data) {
                setSelectedPlaybook(undefined);
                setVariableValues({});
                return;
            }

            setSelectedPlaybook(response.data);
            setVariableValues(buildInitialVariableValues(response.data, overrides));
        } catch {
            if (isStalePlaybookRequest({
                playbookSequence: playbookRequestSequenceRef.current,
                playbookToken,
                taskSequence: taskRequestSequenceRef.current,
                taskToken,
            })) {
                return;
            }
            setSelectedPlaybook(undefined);
            setVariableValues({});
        } finally {
            if (!isStalePlaybookRequest({
                playbookSequence: playbookRequestSequenceRef.current,
                playbookToken,
                taskSequence: taskRequestSequenceRef.current,
                taskToken,
            })) {
                setLoadingPlaybook(false);
            }
        }
    }, []);

    const handleSelectPlaybook = useCallback(async (playbookId: string) => {
        form.setFieldsValue({ playbook_id: playbookId });
        clearPlaybookState(true);
        await loadPlaybook({ playbookId });
    }, [clearPlaybookState, form, loadPlaybook]);

    useEffect(() => {
        let active = true;

        Promise.allSettled([
            getCachedPlaybookInventory(),
            getSecretsSources(),
            getCachedNotificationChannelInventory(),
            getCachedNotificationTemplateInventory(),
        ]).then(([playbookResult, secretsResult, channelResult, templateResult]) => {
            if (!active) {
                return;
            }

            if (playbookResult.status === 'fulfilled') {
                setPlaybooks(playbookResult.value as AutoHealing.Playbook[]);
            }
            if (secretsResult.status === 'fulfilled') {
                setSecretsSources(secretsResult.value.data || []);
            }
            if (channelResult.status === 'fulfilled') {
                setNotifyChannels(channelResult.value as AutoHealing.NotificationChannel[]);
            }
            if (templateResult.status === 'fulfilled') {
                setNotifyTemplates(templateResult.value as AutoHealing.NotificationTemplate[]);
            }

            const hasRejectedResult = [playbookResult, secretsResult, channelResult, templateResult]
                .some((result) => result.status === 'rejected');
            if (hasRejectedResult) {
                message.error('模板表单依赖数据加载失败');
            }
        });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => () => {
        taskRequestSequenceRef.current.invalidate();
        playbookRequestSequenceRef.current.invalidate();
    }, []);

    useEffect(() => {
        resetTemplateState();
    }, [isEdit, resetTemplateState, taskId]);

    useEffect(() => {
        if (!isEdit || !taskId) {
            return;
        }

        const taskToken = taskRequestSequenceRef.current.next();
        setLoading(true);

        getExecutionTask(taskId).then(async (response) => {
            if (!taskRequestSequenceRef.current.isCurrent(taskToken)) {
                return;
            }

            const record = response.data;
            form.setFieldsValue(buildTaskFormFields(record));
            setVariableValues(record.extra_vars || {});
            setNeedsReview(!!record.needs_review);
            setChangedVariables(record.changed_variables || []);

            if (!record.playbook_id) {
                return;
            }

            await loadPlaybook({
                overrides: record.extra_vars || {},
                playbookId: record.playbook_id,
                taskToken,
            });
        }).catch(() => {
            /* global error handler */
        }).finally(() => {
            if (taskRequestSequenceRef.current.isCurrent(taskToken)) {
                setLoading(false);
            }
        });
    }, [form, isEdit, loadPlaybook, taskId]);

    return {
        changedVariables,
        handleSelectPlaybook,
        loading,
        loadingPlaybook,
        needsReview,
        notifyChannels,
        notifyTemplates,
        playbooks,
        secretsSources,
        selectedPlaybook,
        setVariableValues,
        variableValues,
    };
}

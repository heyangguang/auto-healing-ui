import { history } from '@umijs/max';
import { message } from 'antd';
import type { FormInstance } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
    createExecutionSchedule,
    getExecutionSchedule,
    getExecutionTasks,
    updateExecutionSchedule,
} from '@/services/auto-healing/execution';
import { getPlaybook } from '@/services/auto-healing/playbooks';
import { getSecretsSources } from '@/services/auto-healing/secrets';
import { toJsonValue } from '@/utils/jsonValue';
import { hasEffectiveNotificationConfig } from '@/utils/notificationConfig';
import {
    getCachedNotificationChannelInventory,
    getCachedNotificationTemplateInventory,
} from '@/utils/selectorInventoryCache';
import { createRequestSequence } from '@/utils/requestSequence';
import { fetchAllPages } from '@/utils/fetchAllPages';
import { useScheduleTemplatePicker } from './useScheduleTemplatePicker';
import {
    buildInitialVariableValues,
    buildSubmissionVariableValues,
    type VariableValueMap,
} from '../templates/templateVariableHelpers';
import {
    buildScheduleRequestData,
    hasFormErrorFields,
    isEmptyOverrideValue,
} from './scheduleFormHelpers';

type UseScheduleFormControllerOptions = {
    form: FormInstance;
    isEdit: boolean;
    scheduleId?: string;
};

export function useScheduleFormController(options: UseScheduleFormControllerOptions) {
    const { form, isEdit, scheduleId } = options;
    const [step, setStep] = useState<'select' | 'configure'>(isEdit ? 'configure' : 'select');
    const [templates, setTemplates] = useState<AutoHealing.ExecutionTask[]>([]);
    const [secretsSources, setSecretsSources] = useState<AutoHealing.SecretsSource[]>([]);
    const [channels, setChannels] = useState<AutoHealing.NotificationChannel[]>([]);
    const [notifyTemplates, setNotifyTemplates] = useState<AutoHealing.NotificationTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingPlaybook, setLoadingPlaybook] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<AutoHealing.ExecutionTask | null>(null);
    const [editingSchedule, setEditingSchedule] = useState<AutoHealing.ExecutionSchedule | null>(null);
    const [templatePlaybook, setTemplatePlaybook] = useState<AutoHealing.Playbook | null>(null);
    const [targetHostsOverride, setTargetHostsOverride] = useState<string[]>([]);
    const [secretsSourceIds, setSecretsSourceIds] = useState<string[]>([]);
    const [variableValues, setVariableValues] = useState<VariableValueMap>({});
    const [skipNotification, setSkipNotification] = useState(false);
    const scheduleRequestSequenceRef = useRef(createRequestSequence());
    const playbookRequestSequenceRef = useRef(createRequestSequence());
    const picker = useScheduleTemplatePicker(templates);
    const isRequestCurrent = useCallback((requestToken: number | undefined, playbookToken: number) => (
        (requestToken === undefined || scheduleRequestSequenceRef.current.isCurrent(requestToken))
        && playbookRequestSequenceRef.current.isCurrent(playbookToken)
    ), []);
    const resetCreateScheduleState = useCallback(() => {
        playbookRequestSequenceRef.current.invalidate();
        setLoadingPlaybook(false);
        setSelectedTemplate(null);
        setEditingSchedule(null);
        setTemplatePlaybook(null);
        setTargetHostsOverride([]);
        setSecretsSourceIds([]);
        setVariableValues({});
        setSkipNotification(false);
        form.resetFields();
    }, [form]);
    const loadTemplatePlaybook = useCallback(async (playbookId?: string, requestToken?: number) => {
        if (!playbookId) {
            return;
        }
        const token = playbookRequestSequenceRef.current.next();
        setLoadingPlaybook(true);
        try {
            const response = await getPlaybook(playbookId);
            if (!isRequestCurrent(requestToken, token)) {
                return;
            }
            if (response.data?.status && response.data.status !== 'ready') {
                message.warning('Playbook 未上线：只有上线状态的 Playbook 才能创建调度。');
                setTemplatePlaybook(null);
                return;
            }
            setTemplatePlaybook(response.data || null);
        } catch {
            if (!isRequestCurrent(requestToken, token)) {
                return;
            }
            setTemplatePlaybook(null);
            setVariableValues({});
            message.error('Playbook 元数据加载失败');
        } finally {
            if (isRequestCurrent(requestToken, token)) {
                setLoadingPlaybook(false);
            }
        }
    }, [isRequestCurrent]);
    useEffect(() => {
        resetCreateScheduleState();
        setStep(isEdit ? 'configure' : 'select');
    }, [isEdit, scheduleId, resetCreateScheduleState]);
    useEffect(() => {
        const loadData = async () => {
            const requestToken = scheduleRequestSequenceRef.current.next();
            setLoading(true);
            const [taskResult, secretsResult, channelsResult, templatesResult] = await Promise.allSettled([
                fetchAllPages<AutoHealing.ExecutionTask>((page, pageSizeValue) => getExecutionTasks({ page, page_size: pageSizeValue })),
                getSecretsSources(),
                getCachedNotificationChannelInventory(),
                getCachedNotificationTemplateInventory(),
            ]);
            if (!scheduleRequestSequenceRef.current.isCurrent(requestToken)) {
                return;
            }
            if (taskResult.status === 'rejected') {
                message.error('调度表单依赖数据加载失败');
                setLoading(false);
                return;
            }
            setTemplates(taskResult.value);
            setSecretsSources(secretsResult.status === 'fulfilled' ? secretsResult.value.data || [] : []);
            setChannels(channelsResult.status === 'fulfilled' ? channelsResult.value : []);
            setNotifyTemplates(templatesResult.status === 'fulfilled' ? templatesResult.value : []);
            if ([secretsResult, channelsResult, templatesResult].some((result) => result.status === 'rejected')) {
                message.error('调度表单依赖数据加载失败');
            }
            if (isEdit && scheduleId) {
                try {
                    const schedule = await getExecutionSchedule(scheduleId);
                    if (!scheduleRequestSequenceRef.current.isCurrent(requestToken)) {
                        return;
                    }
                    setEditingSchedule(schedule);
                    setVariableValues(schedule.extra_vars_override || {});
                    setTargetHostsOverride(schedule.target_hosts_override?.split(',').filter(Boolean) || []);
                    setSecretsSourceIds(schedule.secrets_source_ids || []);
                    setSkipNotification(!!schedule.skip_notification);
                    form.setFieldsValue({
                        name: schedule.name,
                        task_id: schedule.task_id,
                        schedule_type: schedule.schedule_type,
                        schedule_expr: schedule.schedule_expr,
                        scheduled_at: schedule.scheduled_at ? dayjs(schedule.scheduled_at) : undefined,
                        description: schedule.description,
                        max_failures: schedule.max_failures,
                    });
                    const template = taskResult.value.find((item) => item.id === schedule.task_id);
                    if (template) {
                        setSelectedTemplate(template);
                        playbookRequestSequenceRef.current.invalidate();
                        setLoadingPlaybook(false);
                        await loadTemplatePlaybook(template.playbook_id, requestToken);
                    }
                } catch {
                    if (scheduleRequestSequenceRef.current.isCurrent(requestToken)) {
                        message.error('调度详情加载失败');
                    }
                }
            }
            if (scheduleRequestSequenceRef.current.isCurrent(requestToken)) {
                setLoading(false);
            }
        };
        void loadData();
        return () => {
            scheduleRequestSequenceRef.current.invalidate();
            playbookRequestSequenceRef.current.invalidate();
        };
    }, [form, isEdit, loadTemplatePlaybook, scheduleId]);
    const handleSelectTemplate = useCallback(async (template: AutoHealing.ExecutionTask) => {
        if (template.needs_review) {
            message.warning('任务模板需审核：请先确认 Playbook 变量变更，再创建调度。');
            return;
        }
        if (template.playbook && template.playbook.status !== 'ready') {
            message.warning('Playbook 未上线：只有上线状态的 Playbook 才能创建调度。');
            return;
        }
        setSelectedTemplate(template);
        form.resetFields();
        form.setFieldsValue({ task_id: template.id, schedule_type: 'cron' });
        playbookRequestSequenceRef.current.invalidate();
        setLoadingPlaybook(false);
        setTemplatePlaybook(null);
        setTargetHostsOverride([]);
        setSecretsSourceIds([]);
        setVariableValues({});
        setSkipNotification(false);
        if (template.playbook_id) {
            await loadTemplatePlaybook(template.playbook_id);
        }
        setStep('configure');
    }, [form, loadTemplatePlaybook]);
    const handleVariableChange = useCallback((name: string, value: unknown) => {
        setVariableValues((prev) => {
            if (isEmptyOverrideValue(value)) {
                const nextValues: VariableValueMap = { ...prev };
                delete nextValues[name];
                return nextValues;
            }
            const nextValues: VariableValueMap = { ...prev, [name]: toJsonValue(value) };
            return nextValues;
        });
    }, []);

    const handleVariableClear = useCallback((name: string) => {
        setVariableValues((prev) => {
            const nextValues = { ...prev };
            delete nextValues[name];
            return nextValues;
        });
    }, []);
    const effectiveVariableValues = useMemo(() => buildInitialVariableValues(templatePlaybook, {
        ...(selectedTemplate?.extra_vars || {}),
        ...variableValues,
    }), [selectedTemplate, templatePlaybook, variableValues]);

    const handleSubmit = useCallback(async () => {
        try {
            const values = await form.validateFields();
            if (selectedTemplate?.playbook_id && loadingPlaybook) {
                message.warning('Playbook 变量仍在加载，请稍后再保存');
                return;
            }
            if (selectedTemplate?.playbook_id && !templatePlaybook) {
                message.error('Playbook 元数据加载失败，无法校验变量覆盖，请刷新后重试');
                return;
            }
            const normalizedOverrideValues = buildSubmissionVariableValues(templatePlaybook, variableValues, {
                includeUnknown: isEdit,
                omitBlankString: true,
                omitEmptyCollection: true,
            });
            setSubmitting(true);
            const requestData = buildScheduleRequestData({
                editingSchedule,
                formValues: values,
                isEdit,
                normalizedOverrideValues,
                secretsSourceIds,
                skipNotification,
                targetHostsOverride,
            });
            if (isEdit && editingSchedule) {
                await updateExecutionSchedule(editingSchedule.id, requestData);
                message.success('调度已更新');
            } else {
                await createExecutionSchedule(requestData);
                message.success('调度已创建');
            }
            history.push('/execution/schedules');
        } catch (error: unknown) {
            if (error instanceof Error) {
                message.error(error.message);
                return;
            }
            if (!hasFormErrorFields(error)) {
                message.error('保存调度失败');
            }
        } finally {
            setSubmitting(false);
        }
    }, [editingSchedule, form, isEdit, loadingPlaybook, secretsSourceIds, selectedTemplate?.playbook_id, skipNotification, targetHostsOverride, templatePlaybook, variableValues]);
    return {
        channels, editingSchedule, effectiveVariableValues,
        hasNotificationConfig: hasEffectiveNotificationConfig(selectedTemplate?.notification_config),
        loading, loadingPlaybook, notifyTemplates, secretsSourceIds, secretsSources, selectedTemplate, skipNotification,
        step, submitting, targetHostsOverride, templatePlaybook, variableValues, ...picker, handleSelectTemplate,
        handleSubmit, handleVariableChange, handleVariableClear, resetCreateScheduleState, setSecretsSourceIds,
        setSkipNotification, setStep, setTargetHostsOverride,
    };
}

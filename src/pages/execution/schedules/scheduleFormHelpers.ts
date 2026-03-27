import dayjs from 'dayjs';

export type FilterNotification = '' | 'yes' | 'no';

export const hasFormErrorFields = (error: unknown): error is { errorFields: unknown[] } =>
    typeof error === 'object' && error !== null && 'errorFields' in error;

export const isEmptyOverrideValue = (value: unknown) =>
    value === undefined
    || value === null
    || value === ''
    || (Array.isArray(value) && value.length === 0)
    || (!!value && typeof value === 'object' && Object.keys(value as Record<string, unknown>).length === 0);

export function buildScheduleRequestData(options: {
    editingSchedule: AutoHealing.ExecutionSchedule | null;
    formValues: Pick<AutoHealing.CreateExecutionScheduleRequest, 'name' | 'task_id' | 'schedule_type'> & Record<string, any>;
    isEdit: boolean;
    normalizedOverrideValues: Record<string, unknown>;
    secretsSourceIds: string[];
    skipNotification: boolean;
    targetHostsOverride: string[];
}): AutoHealing.CreateExecutionScheduleRequest & { max_failures?: number } {
    const {
        editingSchedule,
        formValues,
        isEdit,
        normalizedOverrideValues,
        secretsSourceIds,
        skipNotification,
        targetHostsOverride,
    } = options;
    return {
        ...formValues,
        schedule_expr: formValues.schedule_type === 'cron' ? formValues.schedule_expr : undefined,
        scheduled_at: formValues.schedule_type === 'once' && formValues.scheduled_at
            ? (dayjs.isDayjs(formValues.scheduled_at) ? formValues.scheduled_at.format() : formValues.scheduled_at)
            : undefined,
        target_hosts_override: isEdit ? targetHostsOverride.join(',') : (targetHostsOverride.length > 0 ? targetHostsOverride.join(',') : undefined),
        extra_vars_override: isEdit
            ? normalizedOverrideValues
            : (Object.keys(normalizedOverrideValues).length > 0 ? normalizedOverrideValues : undefined),
        secrets_source_ids: isEdit ? secretsSourceIds : (secretsSourceIds.length > 0 ? secretsSourceIds : undefined),
        skip_notification: isEdit ? skipNotification : (skipNotification || undefined),
        max_failures: editingSchedule?.max_failures,
    };
}

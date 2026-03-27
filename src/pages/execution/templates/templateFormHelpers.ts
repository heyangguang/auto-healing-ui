import type { NotificationConfig } from '@/components/NotificationSelector';
import { hasEffectiveNotificationConfig } from '@/utils/notificationConfig';
import {
    buildSubmissionVariableValues,
    type TemplateVariableRecord,
    type VariableValueMap,
} from './templateVariableHelpers';

export const createEmptyNotificationConfig = (): NotificationConfig => ({
    enabled: false,
    on_start: { enabled: false, configs: [], channel_ids: [] },
    on_success: { enabled: false, configs: [], channel_ids: [] },
    on_failure: { enabled: false, configs: [], channel_ids: [] },
});

export function normalizeNotificationConfig(
    config: NotificationConfig | undefined,
) {
    let normalizedConfig: NotificationConfig = config
        ? { ...config }
        : createEmptyNotificationConfig();

    if (!hasEffectiveNotificationConfig(normalizedConfig as never)) {
        return createEmptyNotificationConfig();
    }

    let hasAnyConfig = false;
    (['on_start', 'on_success', 'on_failure'] as const).forEach((trigger) => {
        const triggerConfig = normalizedConfig[trigger];
        const triggerEnabled = triggerConfig && (
            triggerConfig.enabled
            ?? ((triggerConfig.configs?.length || 0) > 0
                || (((triggerConfig.channel_ids?.length || 0) > 0) && !!triggerConfig.template_id))
        );
        if (!triggerEnabled) {
            return;
        }

        const hasConfigs = (triggerConfig.configs?.length || 0) > 0
            || ((triggerConfig.channel_ids?.length || 0) > 0 && !!triggerConfig.template_id);
        if (!hasConfigs) {
            normalizedConfig = {
                ...normalizedConfig,
                [trigger]: { ...triggerConfig, enabled: false },
            };
            return;
        }
        hasAnyConfig = true;
    });

    return hasAnyConfig ? normalizedConfig : createEmptyNotificationConfig();
}

export interface TemplateFormValues {
    description?: string;
    executor_type?: AutoHealing.ExecutorType;
    name: string;
    notification_config?: NotificationConfig;
    playbook_id: string;
    secrets_source_ids?: string[];
    target_hosts?: string[] | string;
}

export function getMissingRequiredVariables(
    variables: TemplateVariableRecord[],
    variableValues: VariableValueMap,
) {
    return variables.filter(
        (variable) => variable.required
            && (variableValues[variable.name] === undefined || variableValues[variable.name] === ''),
    );
}

export function buildTemplateMutationPayload(options: {
    selectedPlaybook?: AutoHealing.Playbook;
    values: TemplateFormValues;
    variableValues: VariableValueMap;
}) {
    const { selectedPlaybook, values, variableValues } = options;
    return {
        description: values.description,
        executor_type: values.executor_type,
        extra_vars: buildSubmissionVariableValues(selectedPlaybook, variableValues, {
            includeUnknown: false,
        }),
        name: values.name,
        notification_config: normalizeNotificationConfig(values.notification_config),
        playbook_id: values.playbook_id,
        secrets_source_ids: values.secrets_source_ids || [],
        target_hosts: Array.isArray(values.target_hosts)
            ? values.target_hosts.join(',')
            : values.target_hosts,
    };
}

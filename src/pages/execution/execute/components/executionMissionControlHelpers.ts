import { getEnabledNotificationTriggers } from '@/utils/notificationConfig';
import { getPlaybookVariables, type TemplateVariableRecord, type VariableValueMap } from '../../templates/templateVariableHelpers';
import { splitTargetHosts } from './HostList';
import type {
    NotificationTargetConfig,
    TriggerNotificationConfig,
} from './executionMissionControlTypes';

function isMissingValue(value: unknown) {
    return value === undefined || value === null || value === '';
}

export function getMissionVariables(playbook?: AutoHealing.Playbook | null) {
    return getPlaybookVariables(playbook);
}

export function splitMissionVariables(variables: TemplateVariableRecord[]) {
    const requiredVariables: TemplateVariableRecord[] = [];
    const optionalVariables: TemplateVariableRecord[] = [];

    variables.forEach((variable) => {
        if (variable.required) {
            requiredVariables.push(variable);
            return;
        }
        optionalVariables.push(variable);
    });

    return { requiredVariables, optionalVariables };
}

export function hasMissingRequiredVariables(
    requiredVariables: TemplateVariableRecord[],
    variableValues: VariableValueMap,
) {
    return requiredVariables.some((variable) => isMissingValue(variableValues[variable.name]));
}

export function getTemplateHosts(targetHosts?: string) {
    return splitTargetHosts(targetHosts);
}

export function getTriggerConfigs(config?: TriggerNotificationConfig) {
    if (!config || config.enabled === false) {
        return [];
    }
    if (config.configs?.length) {
        return config.configs;
    }
    if (config.channel_ids?.length && config.template_id) {
        return config.channel_ids.map((channelId) => ({
            channel_id: channelId,
            template_id: config.template_id!,
        }));
    }
    return [];
}

export function getTimeoutConfigs(notificationConfig: unknown): NotificationTargetConfig[] {
    const timeoutConfig = (notificationConfig as { on_timeout?: TriggerNotificationConfig } | undefined)?.on_timeout;
    return getTriggerConfigs(timeoutConfig);
}

export function shouldShowNotificationDisplay(
    notificationConfig: unknown,
    hasNotificationConfig: boolean,
) {
    const enabledTriggers = getEnabledNotificationTriggers(notificationConfig as any);
    return enabledTriggers.some((trigger) => trigger !== 'on_timeout') || !hasNotificationConfig;
}

export function resolveDisplayName<T extends { id?: string; name?: string }>(
    items: T[],
    id: string,
) {
    return items.find((item) => item.id === id)?.name || id.slice(0, 8);
}

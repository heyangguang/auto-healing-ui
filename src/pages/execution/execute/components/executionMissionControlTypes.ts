import type { VariableValueMap } from '../../templates/templateVariableHelpers';

export interface NotificationTargetConfig {
    channel_id: string;
    template_id: string;
}

export interface TriggerNotificationConfig {
    enabled?: boolean;
    channel_ids?: string[];
    template_id?: string;
    configs?: NotificationTargetConfig[];
}

export interface ExecutionMissionControlProps {
    additionalHosts: string[];
    additionalSecretIds: string[];
    canExecuteTask: boolean;
    channels: AutoHealing.NotificationChannel[];
    executing: boolean;
    hasNotificationConfig: boolean;
    loadingPlaybook: boolean;
    notifyTemplates: AutoHealing.NotificationTemplate[];
    playbookLoadFailed: boolean;
    secretsSources: AutoHealing.SecretsSource[];
    selectedTemplate: AutoHealing.ExecutionTask;
    skipNotification: boolean;
    templatePlaybook?: AutoHealing.Playbook;
    variableValues: VariableValueMap;
    onAdditionalHostsChange: (hosts: string[]) => void;
    onAdditionalSecretIdsChange: (secretIds: string[]) => void;
    onBack: () => void;
    onExecute: () => void;
    onSkipNotificationChange: (checked: boolean) => void;
    onVariableChange: (name: string, value: unknown) => void;
}

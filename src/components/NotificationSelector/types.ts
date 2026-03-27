import type React from 'react';

export type TriggerType = 'on_start' | 'on_success' | 'on_failure';

export interface ChannelTemplateConfig {
    channel_id: string;
    template_id: string;
}

export interface TriggerNotificationConfig {
    enabled?: boolean;
    channel_ids?: string[];
    template_id?: string;
    configs?: ChannelTemplateConfig[];
}

export interface NotificationConfig {
    enabled?: boolean;
    on_start?: TriggerNotificationConfig;
    on_success?: TriggerNotificationConfig;
    on_failure?: TriggerNotificationConfig;
}

export interface TriggerMeta {
    key: TriggerType;
    label: string;
    icon: React.ReactNode;
    color: string;
    tagColor: string;
}

export interface ChannelOption {
    id: string;
    name: string;
    type: string;
    is_active?: boolean;
    enabled?: boolean;
}

export interface TemplateOption {
    id: string;
    name: string;
    supported_channels?: string[];
}

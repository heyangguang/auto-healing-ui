import { getChannelTypeConfigWithDefault, type ChannelTypeConfig } from '@/constants/notificationDicts';

export interface ChannelTemplateConfig {
    channel_id: string;
    channel_name?: string;
    template_id: string;
    template_name?: string;
}

export interface ChannelInfo {
    id: string;
    name: string;
    type: string;
    enabled?: boolean;
}

export interface TemplateInfo {
    id: string;
    name: string;
    supported_channels?: string[];
    description?: string;
}

export interface NotificationChannelTemplateSelectorProps {
    value?: ChannelTemplateConfig[];
    onChange?: (value: ChannelTemplateConfig[]) => void;
}

export const PAGE_SIZE = 8;

export const getChannelTypeConfig = (type: string): ChannelTypeConfig =>
    getChannelTypeConfigWithDefault(type);

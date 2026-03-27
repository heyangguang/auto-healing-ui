import { message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    getCachedNotificationChannelInventory,
    getCachedNotificationTemplateInventory,
} from '@/utils/selectorInventoryCache';
import type {
    ChannelInfo,
    ChannelTemplateConfig,
    NotificationChannelTemplateSelectorProps,
    TemplateInfo,
} from './notificationChannelTemplateSelectorShared';
import { PAGE_SIZE } from './notificationChannelTemplateSelectorShared';
const paginateItems = <T,>(items: T[], currentPage: number) => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
};
const useNotificationSelectorInventory = () => {
    const [channels, setChannels] = useState<ChannelInfo[]>([]);
    const [templates, setTemplates] = useState<TemplateInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const loadChannels = useCallback(async (forceRefresh = false) => {
        setLoading(true);
        try {
            const channelItems = await getCachedNotificationChannelInventory({ forceRefresh });
            setChannels(channelItems.map(channel => ({
                id: channel.id,
                name: channel.name,
                type: channel.type,
                enabled: channel.enabled ?? channel.is_active,
            })));
        } catch (error) {
            void error;
        } finally {
            setLoading(false);
        }
    }, []);
    const loadTemplates = useCallback(async (forceRefresh = false) => {
        setLoadingTemplates(true);
        try {
            const templateItems = await getCachedNotificationTemplateInventory({ forceRefresh });
            setTemplates(templateItems.map(template => ({
                id: template.id,
                name: template.name,
                supported_channels: template.supported_channels,
                description: template.description,
            })));
        } catch (error) {
            void error;
        } finally {
            setLoadingTemplates(false);
        }
    }, []);
    useEffect(() => {
        void loadChannels();
        void loadTemplates();
    }, [loadChannels, loadTemplates]);
    return { channels, templates, loading, loadingTemplates, loadChannels, loadTemplates };
};
const useNotificationSelectorDialogState = () => {
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [step, setStep] = useState<'channel' | 'template'>('channel');
    const [selectedChannel, setSelectedChannel] = useState<ChannelInfo | null>(null);
    const [channelSearch, setChannelSearch] = useState('');
    const [channelTypeFilter, setChannelTypeFilter] = useState('all');
    const [channelPage, setChannelPage] = useState(1);
    const [templateSearch, setTemplateSearch] = useState('');
    const [templatePage, setTemplatePage] = useState(1);
    const openSelector = () => {
        setStep('channel');
        setSelectedChannel(null);
        setChannelSearch('');
        setTemplateSearch('');
        setChannelTypeFilter('all');
        setChannelPage(1);
        setTemplatePage(1);
        setSelectorOpen(true);
    };
    const handleSelectChannel = (channel: ChannelInfo) => {
        setSelectedChannel(channel);
        setTemplateSearch('');
        setTemplatePage(1);
        setStep('template');
    };
    const handleBackToChannel = () => {
        setStep('channel');
        setTemplateSearch('');
    };
    const handleChannelSearchChange = (value: string) => {
        setChannelSearch(value);
        setChannelPage(1);
    };
    const handleChannelTypeChange = (value: string) => {
        setChannelTypeFilter(value);
        setChannelPage(1);
    };
    const handleTemplateSearchChange = (value: string) => {
        setTemplateSearch(value);
        setTemplatePage(1);
    };
    return {
        channelPage,
        channelSearch,
        channelTypeFilter,
        handleBackToChannel,
        handleChannelSearchChange,
        handleChannelTypeChange,
        handleSelectChannel,
        handleTemplateSearchChange,
        openSelector,
        selectedChannel,
        selectorOpen,
        setChannelPage,
        setSelectorOpen,
        setTemplatePage,
        step,
        templatePage,
        templateSearch,
    };
};
interface NotificationSelectorCollectionsOptions {
    channelPage: number;
    channelSearch: string;
    channelTypeFilter: string;
    channels: ChannelInfo[];
    selectedChannel: ChannelInfo | null;
    templatePage: number;
    templateSearch: string;
    templates: TemplateInfo[];
}
const useNotificationSelectorCollections = ({
    channelPage,
    channelSearch,
    channelTypeFilter,
    channels,
    selectedChannel,
    templatePage,
    templateSearch,
    templates,
}: NotificationSelectorCollectionsOptions) => {
    const channelMap = useMemo(() => new Map(channels.map(channel => [channel.id, channel])), [channels]);
    const templateMap = useMemo(() => new Map(templates.map(template => [template.id, template])), [templates]);
    const channelTypeStats = useMemo(() => {
        const stats: Record<string, number> = { all: channels.length };
        channels.forEach(channel => {
            const channelType = channel.type.toLowerCase();
            stats[channelType] = (stats[channelType] || 0) + 1;
        });
        return stats;
    }, [channels]);
    const filteredChannels = useMemo(() => {
        const enabledChannels = channels.filter(channel => channel.enabled !== false);
        const typeMatched = channelTypeFilter === 'all'
            ? enabledChannels
            : enabledChannels.filter(channel => channel.type.toLowerCase() === channelTypeFilter);
        if (!channelSearch) {
            return typeMatched;
        }

        const keyword = channelSearch.toLowerCase();
        return typeMatched.filter(channel =>
            channel.name.toLowerCase().includes(keyword) ||
            channel.type.toLowerCase().includes(keyword),
        );
    }, [channelSearch, channelTypeFilter, channels]);
    const filteredTemplates = useMemo(() => {
        const typeMatched = !selectedChannel
            ? templates
            : templates.filter(template => {
                if (!template.supported_channels || template.supported_channels.length === 0) {
                    return true;
                }
                return template.supported_channels.some(channelType =>
                    channelType.toLowerCase() === selectedChannel.type.toLowerCase(),
                );
            });
        if (!templateSearch) {
            return typeMatched;
        }

        const keyword = templateSearch.toLowerCase();
        return typeMatched.filter(template =>
            template.name.toLowerCase().includes(keyword) ||
            template.description?.toLowerCase().includes(keyword),
        );
    }, [selectedChannel, templateSearch, templates]);
    return {
        channelMap,
        channelTypeStats,
        filteredChannels,
        filteredTemplates,
        getChannelName: (id: string) => channelMap.get(id)?.name || id.slice(0, 8),
        getChannelType: (id: string) => channelMap.get(id)?.type || '',
        getTemplateName: (id: string) => templateMap.get(id)?.name || id.slice(0, 8),
        paginatedChannels: paginateItems(filteredChannels, channelPage),
        paginatedTemplates: paginateItems(filteredTemplates, templatePage),
        templateMap,
    };
};
interface NotificationSelectorActionsOptions {
    onChange?: NotificationChannelTemplateSelectorProps['onChange'];
    selectedChannel: ChannelInfo | null;
    setSelectorOpen: (open: boolean) => void;
    templateMap: Map<string, TemplateInfo>;
    value: ChannelTemplateConfig[];
}
const useNotificationSelectorActions = ({
    onChange,
    selectedChannel,
    setSelectorOpen,
    templateMap,
    value,
}: NotificationSelectorActionsOptions) => {
    const handleSelectTemplate = (templateId: string) => {
        if (!selectedChannel) {
            return;
        }
        const newConfig: ChannelTemplateConfig = {
            channel_id: selectedChannel.id,
            channel_name: selectedChannel.name,
            template_id: templateId,
            template_name: templateMap.get(templateId)?.name,
        };
        const exists = value.some(config =>
            config.channel_id === newConfig.channel_id && config.template_id === newConfig.template_id,
        );
        if (exists) {
            message.warning('该渠道-模板配置已存在');
            return;
        }
        onChange?.([...value, newConfig]);
        setSelectorOpen(false);
    };
    const handleRemoveConfig = (index: number) => {
        onChange?.(value.filter((_, currentIndex) => currentIndex !== index));
    };
    return { handleRemoveConfig, handleSelectTemplate };
};
const useNotificationChannelTemplateSelector = ({
    onChange,
    value = [],
}: NotificationChannelTemplateSelectorProps) => {
    const inventory = useNotificationSelectorInventory();
    const dialog = useNotificationSelectorDialogState();
    const collections = useNotificationSelectorCollections({
        channelPage: dialog.channelPage,
        channelSearch: dialog.channelSearch,
        channelTypeFilter: dialog.channelTypeFilter,
        channels: inventory.channels,
        selectedChannel: dialog.selectedChannel,
        templatePage: dialog.templatePage,
        templateSearch: dialog.templateSearch,
        templates: inventory.templates,
    });
    const actions = useNotificationSelectorActions({
        onChange,
        selectedChannel: dialog.selectedChannel,
        setSelectorOpen: dialog.setSelectorOpen,
        templateMap: collections.templateMap,
        value,
    });
    return {
        ...actions,
        ...collections,
        ...dialog,
        ...inventory,
        handleRefreshChannels: () => {
            void inventory.loadChannels(true);
        },
        handleRefreshTemplates: () => {
            void inventory.loadTemplates(true);
        },
        value,
    };
};

export default useNotificationChannelTemplateSelector;

import React, { useMemo, useState } from 'react';
import { BellOutlined } from '@ant-design/icons';
import { Button, Modal, Space, Tag, message } from 'antd';
import SelectorModalContent from './SelectorModalContent';
import TriggerCard from './TriggerCard';
import { TRIGGERS } from './constants';
import type {
    ChannelOption,
    ChannelTemplateConfig,
    NotificationConfig,
    TemplateOption,
    TriggerNotificationConfig,
    TriggerType,
} from './types';
export type { NotificationConfig, TriggerNotificationConfig, ChannelTemplateConfig } from './types';

interface NotificationSelectorProps {
    value?: NotificationConfig;
    onChange?: (value: NotificationConfig) => void;
    channels: ChannelOption[];
    templates: TemplateOption[];
}

const NotificationSelector: React.FC<NotificationSelectorProps> = ({
    value = {},
    onChange,
    channels,
    templates,
}) => {
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [currentTrigger, setCurrentTrigger] = useState<TriggerType | null>(null);
    const [step, setStep] = useState<'channel' | 'template'>('channel');
    const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
    const [searchText, setSearchText] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    const triggerHasConfigs = (triggerConfig?: TriggerNotificationConfig) => {
        if (!triggerConfig) return false;
        return (triggerConfig.configs?.length || 0) > 0
            || ((triggerConfig.channel_ids?.length || 0) > 0 && !!triggerConfig.template_id);
    };

    const isTriggerEnabled = (triggerConfig?: TriggerNotificationConfig) => {
        if (!triggerConfig) return false;
        return triggerConfig.enabled ?? triggerHasConfigs(triggerConfig);
    };

    const syncRootEnabled = (next: NotificationConfig): NotificationConfig => {
        const hasAnyActiveTrigger = TRIGGERS.some(({ key }) => {
            const triggerConfig = next[key];
            if (!isTriggerEnabled(triggerConfig)) return false;
            return triggerHasConfigs(triggerConfig);
        });
        return { ...next, enabled: hasAnyActiveTrigger };
    };

    const getTriggerConfig = (trigger: TriggerType): TriggerNotificationConfig => {
        return value?.[trigger] || {};
    };
    const getConfigList = (trigger: TriggerType): ChannelTemplateConfig[] => {
        const config = getTriggerConfig(trigger);
        if (config.configs?.length) return config.configs;
        const templateId = config.template_id;
        if (config.channel_ids?.length && templateId) {
            return config.channel_ids.map((cid) => ({ channel_id: cid, template_id: templateId }));
        }
        return [];
    };

    const getChannel = (id: string) => channels.find((c) => c.id === id);
    const getChannelName = (id: string) => getChannel(id)?.name || id.slice(0, 8);
    const getChannelType = (id: string) => getChannel(id)?.type || '';
    const getTemplate = (id: string) => templates.find((t) => t.id === id);
    const getTemplateName = (id: string) => getTemplate(id)?.name || id.slice(0, 8);

    const channelTypes = useMemo(() => {
        return [...new Set(channels.map((c) => c.type))].sort();
    }, [channels]);

    const filteredChannels = useMemo(() => {
        let list = channels.filter((c) => (c.enabled ?? c.is_active) !== false);
        if (activeTab !== 'all') list = list.filter((c) => c.type === activeTab);
        if (searchText) {
            const lower = searchText.toLowerCase();
            list = list.filter((c) => c.name.toLowerCase().includes(lower) || c.type.toLowerCase().includes(lower));
        }
        return list;
    }, [channels, activeTab, searchText]);

    const filteredTemplates = useMemo(() => {
        if (!selectedChannel) return templates;
        const channelType = getChannelType(selectedChannel).toLowerCase();
        let filtered = templates.filter((t) => {
            if (!t.supported_channels || t.supported_channels.length === 0) return true;
            return t.supported_channels.some((supported) => supported.toLowerCase() === channelType);
        });
        if (searchText) {
            filtered = filtered.filter((t) => t.name.toLowerCase().includes(searchText.toLowerCase()));
        }
        return filtered;
    }, [selectedChannel, templates, searchText]);

    const openSelector = (trigger: TriggerType) => {
        setCurrentTrigger(trigger);
        setStep('channel');
        setSelectedChannel(null);
        setSearchText('');
        setActiveTab('all');
        setSelectorOpen(true);
    };

    const handleTriggerEnableChange = (trigger: TriggerType, enabled: boolean) => {
        const current = getTriggerConfig(trigger);
        onChange?.(syncRootEnabled({ ...value, [trigger]: { ...current, enabled } }));
    };

    const handleSelectChannel = (channelId: string) => {
        setSelectedChannel(channelId);
        setSearchText('');
        setStep('template');
    };

    const handleSelectTemplate = (templateId: string) => {
        if (!currentTrigger || !selectedChannel) return;
        const existingConfigs = getConfigList(currentTrigger);
        const exists = existingConfigs.some((config) => {
            return config.channel_id === selectedChannel && config.template_id === templateId;
        });
        if (exists) {
            message.warning('该通知配置已存在');
            return;
        }

        const newConfig: ChannelTemplateConfig = { channel_id: selectedChannel, template_id: templateId };
        onChange?.(syncRootEnabled({
            ...value,
            [currentTrigger]: {
                enabled: true,
                configs: [...existingConfigs, newConfig],
                channel_ids: [...existingConfigs.map((c) => c.channel_id), selectedChannel],
                template_id: templateId,
            },
        }));
        setSelectorOpen(false);
    };

    const handleRemoveConfig = (trigger: TriggerType, index: number) => {
        const configs = getConfigList(trigger);
        const newConfigs = configs.filter((_, i) => i !== index);
        const nextTemplateID = newConfigs.length === 1 ? newConfigs[0].template_id : undefined;

        onChange?.(syncRootEnabled({
            ...value,
            [trigger]: {
                enabled: newConfigs.length > 0,
                configs: newConfigs,
                channel_ids: newConfigs.length > 0 ? newConfigs.map((c) => c.channel_id) : undefined,
                template_id: nextTemplateID,
            },
        }));
    };

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {TRIGGERS.map((trigger) => {
                    const config = getTriggerConfig(trigger.key);
                    const isEnabled = isTriggerEnabled(config);
                    const configList = getConfigList(trigger.key);

                    return (
                        <TriggerCard
                            key={trigger.key}
                            trigger={trigger}
                            isEnabled={isEnabled}
                            configList={configList}
                            getChannelName={getChannelName}
                            getTemplateName={getTemplateName}
                            onToggleEnabled={(checked) => handleTriggerEnableChange(trigger.key, checked)}
                            onRemoveConfig={(index) => handleRemoveConfig(trigger.key, index)}
                            onAddConfig={() => openSelector(trigger.key)}
                        />
                    );
                })}
            </div>
            <Modal
                title={
                    <Space>
                        <BellOutlined style={{ color: '#1890ff' }} />
                        <span>{step === 'channel' ? '选择通知渠道' : '选择消息模板'}</span>
                        {currentTrigger && (
                            <Tag color={TRIGGERS.find((t) => t.key === currentTrigger)?.tagColor}>
                                {TRIGGERS.find((t) => t.key === currentTrigger)?.label}
                            </Tag>
                        )}
                    </Space>
                }
                open={selectorOpen}
                onCancel={() => setSelectorOpen(false)}
                footer={step === 'template' ? (
                    <Button onClick={() => { setStep('channel'); setSearchText(''); }}>
                        返回选择渠道
                    </Button>
                ) : null}
                width={500}
                destroyOnHidden
            >
                <SelectorModalContent
                    step={step}
                    channels={channels}
                    channelTypes={channelTypes}
                    activeTab={activeTab}
                    searchText={searchText}
                    filteredChannels={filteredChannels}
                    selectedChannel={selectedChannel}
                    filteredTemplates={filteredTemplates}
                    getChannelName={getChannelName}
                    getChannelType={getChannelType}
                    onTabChange={setActiveTab}
                    onSearchChange={setSearchText}
                    onSelectChannel={handleSelectChannel}
                    onSelectTemplate={handleSelectTemplate}
                />
            </Modal>
        </div>
    );
};

export default NotificationSelector;

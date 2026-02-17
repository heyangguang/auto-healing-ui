import React, { useState, useMemo } from 'react';
import { Button, Select, Modal, Tag, Switch, Typography, Space, Empty, Input, Divider, Tabs } from 'antd';
import {
    PlusOutlined, BellOutlined, CloseOutlined,
    CheckCircleOutlined, RocketOutlined, StopOutlined,
    SendOutlined, SearchOutlined, CheckOutlined
} from '@ant-design/icons';

const { Text } = Typography;

// 触发器类型
type TriggerType = 'on_start' | 'on_success' | 'on_failure';

// 单个渠道+模板配置
interface ChannelTemplateConfig {
    channel_id: string;
    template_id: string;
}

// 单个触发器配置
export interface TriggerNotificationConfig {
    enabled?: boolean;
    channel_ids?: string[];
    template_id?: string;
    configs?: ChannelTemplateConfig[];
}

// 完整通知配置
export interface NotificationConfig {
    enabled?: boolean;
    on_start?: TriggerNotificationConfig;
    on_success?: TriggerNotificationConfig;
    on_failure?: TriggerNotificationConfig;
}

interface NotificationSelectorProps {
    value?: NotificationConfig;
    onChange?: (value: NotificationConfig) => void;
    channels: { id: string; name: string; type: string }[];
    templates: { id: string; name: string; supported_channels?: string[] }[];
}

// 触发器配置
const TRIGGERS: { key: TriggerType; label: string; icon: React.ReactNode; color: string; tagColor: string }[] = [
    { key: 'on_start', label: '开始时', icon: <RocketOutlined />, color: '#1890ff', tagColor: 'processing' },
    { key: 'on_success', label: '成功时', icon: <CheckCircleOutlined />, color: '#52c41a', tagColor: 'success' },
    { key: 'on_failure', label: '失败时', icon: <StopOutlined />, color: '#ff4d4f', tagColor: 'error' },
];

const NotificationSelector: React.FC<NotificationSelectorProps> = ({
    value = {},
    onChange,
    channels,
    templates
}) => {
    // 选择器状态
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [currentTrigger, setCurrentTrigger] = useState<TriggerType | null>(null);
    const [step, setStep] = useState<'channel' | 'template'>('channel');
    const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
    const [searchText, setSearchText] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    // 获取某个触发器的配置
    const getTriggerConfig = (trigger: TriggerType): TriggerNotificationConfig => {
        return value?.[trigger] || {};
    };

    // 获取渠道信息
    const getChannel = (id: string) => channels.find(c => c.id === id);
    const getChannelName = (id: string) => getChannel(id)?.name || id.slice(0, 8);
    const getChannelType = (id: string) => getChannel(id)?.type || '';

    // 获取模板信息
    const getTemplate = (id: string) => templates.find(t => t.id === id);
    const getTemplateName = (id: string) => getTemplate(id)?.name || id.slice(0, 8);

    // 渠道类型分类
    const channelTypes = useMemo(() => {
        const types = [...new Set(channels.map(c => c.type))];
        return types.sort();
    }, [channels]);

    // 过滤渠道
    const filteredChannels = useMemo(() => {
        let list = channels;
        // 按类型过滤
        if (activeTab !== 'all') {
            list = list.filter(c => c.type === activeTab);
        }
        // 按搜索词过滤
        if (searchText) {
            list = list.filter(c =>
                c.name.toLowerCase().includes(searchText.toLowerCase()) ||
                c.type.toLowerCase().includes(searchText.toLowerCase())
            );
        }
        return list;
    }, [channels, activeTab, searchText]);

    // 根据选中渠道过滤模板
    const filteredTemplates = useMemo(() => {
        if (!selectedChannel) return templates;
        const channelType = getChannelType(selectedChannel);
        let filtered = templates.filter(t => {
            if (!t.supported_channels || t.supported_channels.length === 0) return true;
            return t.supported_channels.includes(channelType);
        });
        if (searchText) {
            filtered = filtered.filter(t => t.name.toLowerCase().includes(searchText.toLowerCase()));
        }
        return filtered;
    }, [selectedChannel, templates, searchText]);

    // 获取已配置的策略列表
    const getConfigList = (trigger: TriggerType): ChannelTemplateConfig[] => {
        const config = getTriggerConfig(trigger);
        if (config.configs?.length) return config.configs;
        // 兼容旧格式
        if (config.channel_ids?.length && config.template_id) {
            return config.channel_ids.map(cid => ({ channel_id: cid, template_id: config.template_id! }));
        }
        return [];
    };

    // 更新触发器启用状态
    const handleTriggerEnableChange = (trigger: TriggerType, enabled: boolean) => {
        const current = getTriggerConfig(trigger);
        onChange?.({
            ...value,
            enabled: true,
            [trigger]: { ...current, enabled }
        });
    };

    // 打开选择器
    const openSelector = (trigger: TriggerType) => {
        setCurrentTrigger(trigger);
        setStep('channel');
        setSelectedChannel(null);
        setSearchText('');
        setActiveTab('all');
        setSelectorOpen(true);
    };

    // 选择渠道
    const handleSelectChannel = (channelId: string) => {
        setSelectedChannel(channelId);
        setSearchText('');
        setStep('template');
    };

    // 选择模板并完成添加
    const handleSelectTemplate = (templateId: string) => {
        if (!currentTrigger || !selectedChannel) return;

        const current = getTriggerConfig(currentTrigger);
        const existingConfigs = getConfigList(currentTrigger);
        const newConfig: ChannelTemplateConfig = {
            channel_id: selectedChannel,
            template_id: templateId
        };

        onChange?.({
            ...value,
            enabled: true,
            [currentTrigger]: {
                enabled: true,
                configs: [...existingConfigs, newConfig],
                channel_ids: [...existingConfigs.map(c => c.channel_id), selectedChannel],
                template_id: templateId
            }
        });

        setSelectorOpen(false);
    };

    // 移除配置
    const handleRemoveConfig = (trigger: TriggerType, index: number) => {
        const configs = getConfigList(trigger);
        const newConfigs = configs.filter((_, i) => i !== index);

        onChange?.({
            ...value,
            [trigger]: {
                enabled: newConfigs.length > 0,
                configs: newConfigs,
                channel_ids: newConfigs.map(c => c.channel_id)
            }
        });
    };

    // 渲染选择器Modal内容
    const renderSelectorContent = () => {
        if (step === 'channel') {
            // 生成Tabs items
            const tabItems = [
                { key: 'all', label: `全部 (${channels.length})` },
                ...channelTypes.map(type => ({
                    key: type,
                    label: `${type} (${channels.filter(c => c.type === type).length})`
                }))
            ];

            return (
                <>
                    {/* 类型分类 Tabs */}
                    <Tabs
                        activeKey={activeTab}
                        onChange={key => { setActiveTab(key); setSearchText(''); }}
                        size="small"
                        style={{ marginBottom: 12 }}
                        items={tabItems}
                    />
                    <Input
                        placeholder="搜索通知渠道..."
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ marginBottom: 12 }}
                        allowClear
                    />
                    <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 4 }}>
                        {filteredChannels.length === 0 ? (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配渠道" />
                        ) : (
                            filteredChannels.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => handleSelectChannel(c.id)}
                                    style={{
                                        padding: '12px 16px',
                                        borderBottom: '1px solid #f0f0f0',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: '#fff',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <SendOutlined style={{ marginRight: 10, color: '#1890ff', fontSize: 16 }} />
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{c.name}</div>
                                            <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                                                {c.type}
                                            </div>
                                        </div>
                                    </div>
                                    <Tag style={{ margin: 0 }}>{c.type}</Tag>
                                </div>
                            ))
                        )}
                    </div>
                </>
            );
        }

        // Step: template
        return (
            <>
                <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        已选渠道：<Text strong>{getChannelName(selectedChannel!)}</Text>
                        <Tag style={{ marginLeft: 8, fontSize: 10 }}>{getChannelType(selectedChannel!)}</Tag>
                    </Text>
                </div>
                <Input
                    placeholder="搜索消息模板..."
                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    style={{ marginBottom: 16 }}
                    allowClear
                />
                <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 4 }}>
                    {filteredTemplates.length === 0 ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配模板" />
                    ) : (
                        filteredTemplates.map(t => (
                            <div
                                key={t.id}
                                onClick={() => handleSelectTemplate(t.id)}
                                style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid #f0f0f0',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: '#fff',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                            >
                                <div>
                                    <div style={{ fontWeight: 500 }}>{t.name}</div>
                                    {t.supported_channels?.length ? (
                                        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                                            支持: {t.supported_channels.join(', ')}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </>
        );
    };

    return (
        <div>
            {/* 三个触发器区域 - 横排紧凑 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {TRIGGERS.map(trigger => {
                    const config = getTriggerConfig(trigger.key);
                    const isEnabled = config.enabled ?? false;
                    const configList = getConfigList(trigger.key);

                    return (
                        <div
                            key={trigger.key}
                            style={{
                                border: `1px dashed ${isEnabled ? trigger.color : '#d9d9d9'}`,
                                borderRadius: 0,
                                padding: 12,
                                background: isEnabled ? `${trigger.color}08` : '#fafafa'
                            }}
                        >
                            {/* 标题行 */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Space size={4}>
                                    <span style={{ color: trigger.color, fontSize: 13 }}>{trigger.icon}</span>
                                    <Text strong style={{ fontSize: 13 }}>{trigger.label}</Text>
                                    {configList.length > 0 && (
                                        <Tag color={trigger.tagColor} style={{ margin: 0, fontSize: 10 }}>
                                            {configList.length}
                                        </Tag>
                                    )}
                                </Space>
                                <Switch
                                    size="small"
                                    checked={isEnabled}
                                    onChange={checked => handleTriggerEnableChange(trigger.key, checked)}
                                />
                            </div>

                            {/* 已配置的策略 + 添加按钮 */}
                            {isEnabled && (
                                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {configList.map((cfg, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '4px 8px',
                                                border: '1px dashed #d9d9d9',
                                                borderRadius: 0,
                                                background: '#fff',
                                                fontSize: 11
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
                                                <SendOutlined style={{ color: '#999', fontSize: 10, flexShrink: 0 }} />
                                                <Text ellipsis={{ tooltip: getChannelName(cfg.channel_id) }} style={{ fontSize: 11, maxWidth: 80 }}>{getChannelName(cfg.channel_id)}</Text>
                                                <Text type="secondary" style={{ fontSize: 10 }}>→</Text>
                                                <Text type="secondary" ellipsis={{ tooltip: getTemplateName(cfg.template_id) }} style={{ fontSize: 11, maxWidth: 80 }}>{getTemplateName(cfg.template_id)}</Text>
                                            </div>
                                            <CloseOutlined
                                                style={{ color: '#bfbfbf', cursor: 'pointer', fontSize: 9, flexShrink: 0 }}
                                                onClick={() => handleRemoveConfig(trigger.key, idx)}
                                                onMouseEnter={e => e.currentTarget.style.color = '#ff4d4f'}
                                                onMouseLeave={e => e.currentTarget.style.color = '#bfbfbf'}
                                            />
                                        </div>
                                    ))}

                                    {/* 添加按钮 */}
                                    <Button
                                        type="dashed"
                                        size="small"
                                        icon={<PlusOutlined />}
                                        onClick={() => openSelector(trigger.key)}
                                        style={{
                                            borderRadius: 0,
                                            borderColor: '#d9d9d9',
                                            color: '#595959',
                                            fontSize: 11
                                        }}
                                    >
                                        添加策略
                                    </Button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* 选择器Modal */}
            <Modal
                title={
                    <Space>
                        <BellOutlined style={{ color: '#1890ff' }} />
                        <span>{step === 'channel' ? '选择通知渠道' : '选择消息模板'}</span>
                        {currentTrigger && (
                            <Tag color={TRIGGERS.find(t => t.key === currentTrigger)?.tagColor}>
                                {TRIGGERS.find(t => t.key === currentTrigger)?.label}
                            </Tag>
                        )}
                    </Space>
                }
                open={selectorOpen}
                onCancel={() => setSelectorOpen(false)}
                footer={
                    step === 'template' ? (
                        <Button onClick={() => { setStep('channel'); setSearchText(''); }}>
                            返回选择渠道
                        </Button>
                    ) : null
                }
                width={500}
                destroyOnClose
            >
                {renderSelectorContent()}
            </Modal>
        </div>
    );
};

export default NotificationSelector;

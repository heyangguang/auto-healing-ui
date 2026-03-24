import React from 'react';
import { Typography, Space, Tag, Empty } from 'antd';
import {
    RocketOutlined, CheckCircleOutlined, StopOutlined,
    SendOutlined, BellOutlined
} from '@ant-design/icons';
import { hasEffectiveNotificationConfig } from '@/utils/notificationConfig';

const { Text } = Typography;

// 触发器类型
type TriggerType = 'on_start' | 'on_success' | 'on_failure';

// 单个渠道+模板配置
interface ChannelTemplateConfig {
    channel_id: string;
    template_id: string;
}

// 单个触发器配置
interface TriggerNotificationConfig {
    enabled?: boolean;
    channel_ids?: string[];
    template_id?: string;
    configs?: ChannelTemplateConfig[];
}

// 完整通知配置
interface NotificationConfig {
    enabled?: boolean;
    on_start?: TriggerNotificationConfig;
    on_success?: TriggerNotificationConfig;
    on_failure?: TriggerNotificationConfig;
}

interface NotificationConfigDisplayProps {
    value?: NotificationConfig;
    channels?: { id: string; name: string; type: string }[];
    templates?: { id: string; name: string }[];
    compact?: boolean; // 紧凑模式
}

// 触发器配置
const TRIGGERS: { key: TriggerType; label: string; icon: React.ReactNode; color: string; borderColor: string }[] = [
    { key: 'on_start', label: '开始时', icon: <RocketOutlined />, color: '#1890ff', borderColor: '#91d5ff' },
    { key: 'on_success', label: '成功时', icon: <CheckCircleOutlined />, color: '#52c41a', borderColor: '#b7eb8f' },
    { key: 'on_failure', label: '失败时', icon: <StopOutlined />, color: '#ff4d4f', borderColor: '#ffa39e' },
];

/**
 * 通知配置只读展示组件
 * 用于任务详情、执行任务、调度任务等页面的通知配置展示
 */
const NotificationConfigDisplay: React.FC<NotificationConfigDisplayProps> = ({
    value,
    channels = [],
    templates = [],
    compact = false
}) => {
    // 获取渠道名称
    const getChannelName = (id: string) => {
        const channel = channels.find(c => c.id === id);
        return channel?.name || id.slice(0, 8);
    };

    // 获取渠道类型
    const getChannelType = (id: string) => {
        const channel = channels.find(c => c.id === id);
        return channel?.type || '';
    };

    // 获取模板名称
    const getTemplateName = (id: string) => {
        const template = templates.find(t => t.id === id);
        return template?.name || id.slice(0, 8);
    };

    // 获取触发器配置
    const getTriggerConfig = (trigger: TriggerType): TriggerNotificationConfig => {
        return value?.[trigger] || {};
    };

    // 获取配置列表
    const getConfigList = (trigger: TriggerType): ChannelTemplateConfig[] => {
        const config = getTriggerConfig(trigger);
        if (config.configs?.length) return config.configs;
        // 兼容旧格式
        if (config.channel_ids?.length && config.template_id) {
            return config.channel_ids.map(cid => ({ channel_id: cid, template_id: config.template_id! }));
        }
        return [];
    };

    // 检查是否有任何配置
    const hasAnyConfig = hasEffectiveNotificationConfig(value as any);

    if (!hasAnyConfig) {
        return (
            <div style={{
                padding: compact ? '8px 12px' : '12px 16px',
                background: '#fafafa',
                border: '1px dashed #d9d9d9',
                borderRadius: 0,
                color: '#999',
                fontSize: 12
            }}>
                <BellOutlined style={{ marginRight: 6 }} />
                未配置通知策略
            </div>
        );
    }

    // 获取启用的触发器
    const enabledTriggers = TRIGGERS.filter(t => {
        const config = getTriggerConfig(t.key);
        return config.enabled !== false && getConfigList(t.key).length > 0;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 6 : 8 }}>
            {enabledTriggers.map(trigger => {
                const configList = getConfigList(trigger.key);

                return (
                    <div
                        key={trigger.key}
                        style={{
                            border: `1px dashed ${trigger.borderColor}`,
                            borderRadius: 0,
                            padding: compact ? '6px 10px' : '10px 12px',
                            background: `${trigger.color}08`
                        }}
                    >
                        {/* 触发器标题 */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: configList.length > 0 ? (compact ? 6 : 8) : 0
                        }}>
                            <span style={{ color: trigger.color, marginRight: 6, fontSize: compact ? 12 : 14 }}>
                                {trigger.icon}
                            </span>
                            <Text strong style={{ fontSize: compact ? 12 : 13, color: trigger.color }}>
                                {trigger.label}
                            </Text>
                            <Tag
                                color={trigger.color}
                                style={{
                                    margin: '0 0 0 8px',
                                    fontSize: 10,
                                    lineHeight: compact ? '14px' : '16px',
                                    padding: '0 4px',
                                    borderRadius: 0
                                }}
                            >
                                {configList.length} 策略
                            </Tag>
                        </div>

                        {/* 渠道+模板列表 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 4 : 6 }}>
                            {configList.map((cfg, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: compact ? '4px 8px' : '6px 10px',
                                        background: '#fff',
                                        border: '1px solid #f0f0f0',
                                        borderRadius: 0,
                                        fontSize: compact ? 11 : 12
                                    }}
                                >
                                    <SendOutlined style={{ color: '#999', fontSize: 10, marginRight: 6 }} />
                                    <Text style={{ fontSize: compact ? 11 : 12 }}>
                                        {getChannelName(cfg.channel_id)}
                                    </Text>
                                    <Tag style={{
                                        margin: '0 0 0 4px',
                                        fontSize: 9,
                                        lineHeight: '12px',
                                        padding: '0 3px',
                                        borderRadius: 0
                                    }}>
                                        {getChannelType(cfg.channel_id)}
                                    </Tag>
                                    <Text type="secondary" style={{ margin: '0 6px', fontSize: 10 }}>→</Text>
                                    <Text type="secondary" style={{ fontSize: compact ? 11 : 12 }}>
                                        {getTemplateName(cfg.template_id)}
                                    </Text>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default NotificationConfigDisplay;

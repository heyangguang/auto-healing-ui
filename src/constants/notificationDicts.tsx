/**
 * 通知渠道相关字典值
 *
 * 数据源：后端 API > localStorage 缓存 > 硬编码兜底
 * 注意：icon 字段为 React 组件，由前端 iconRegistry 维护
 */
import React from 'react';
import {
    ApiOutlined, MailOutlined, DingdingOutlined, WechatWorkOutlined, SlackOutlined, WindowsOutlined,
    BellOutlined, SendOutlined,
} from '@ant-design/icons';
import { getDictItems, onDictRefresh } from '@/utils/dictCache';

// ==================== Icon 注册表 ====================

const ICON_REGISTRY: Record<string, React.ReactNode> = {
    ApiOutlined: <ApiOutlined />,
    MailOutlined: <MailOutlined />,
    DingdingOutlined: <DingdingOutlined />,
    WechatWorkOutlined: <WechatWorkOutlined />,
    SlackOutlined: <SlackOutlined />,
    WindowsOutlined: <WindowsOutlined />,
    BellOutlined: <BellOutlined />,
    SendOutlined: <SendOutlined />,
};

function resolveIcon(name?: string, fallback?: React.ReactNode): React.ReactNode {
    if (!name) return fallback || <BellOutlined />;
    return ICON_REGISTRY[name] || fallback || <BellOutlined />;
}

// ==================== 类型定义 ====================

export interface ChannelTypeConfig {
    icon: React.ReactNode;
    color: string;
    label: string;
    labelCN: string;
    bg: string;
}

type ChannelOptionVariant = 'filter' | 'form' | 'template';

const CHANNEL_TYPE_ORDER = ['webhook', 'email', 'dingtalk', 'wecom', 'slack', 'teams'] as const;

const CHANNEL_OPTION_LABELS: Record<ChannelOptionVariant, Record<string, string>> = {
    filter: {
        webhook: 'Webhook',
        email: '邮件',
        dingtalk: '钉钉',
        wecom: '企业微信',
        slack: 'Slack',
        teams: 'Teams',
    },
    form: {
        webhook: 'Webhook (通用)',
        email: '邮件 (Email)',
        dingtalk: '钉钉 (DingTalk)',
        wecom: '企业微信',
        slack: 'Slack',
        teams: 'Teams',
    },
    template: {
        webhook: 'Webhook',
        email: 'Email 邮件',
        dingtalk: 'DingTalk 钉钉',
        wecom: '企业微信',
        slack: 'Slack',
        teams: 'Teams',
    },
};

// ==================== 硬编码兜底 ====================

const FB_CONFIG: Record<string, ChannelTypeConfig> = {
    webhook: { icon: <ApiOutlined />, color: '#722ed1', label: 'WEBHOOK', labelCN: 'Webhook', bg: '#f9f0ff' },
    email: { icon: <MailOutlined />, color: '#1890ff', label: 'EMAIL', labelCN: '邮件', bg: '#e6f7ff' },
    dingtalk: { icon: <DingdingOutlined />, color: '#0079f2', label: 'DINGTALK', labelCN: '钉钉', bg: '#f0f5ff' },
    wecom: { icon: <WechatWorkOutlined />, color: '#07c160', label: 'WECOM', labelCN: '企业微信', bg: '#f6ffed' },
    slack: { icon: <SlackOutlined />, color: '#4a154b', label: 'SLACK', labelCN: 'Slack', bg: '#fff0f6' },
    teams: { icon: <WindowsOutlined />, color: '#6264a7', label: 'TEAMS', labelCN: 'Teams', bg: '#f0f5ff' },
};

const UNKNOWN_CONFIG: ChannelTypeConfig = {
    icon: <BellOutlined />, color: '#8c8c8c', label: 'UNKNOWN', labelCN: '未知', bg: '#f5f5f5',
};

const DEFAULT_CONFIG: ChannelTypeConfig = {
    icon: <SendOutlined />, color: '#8c8c8c', label: 'DEFAULT', labelCN: '通知', bg: '#f5f5f5',
};

// ==================== 动态变量 ====================

export let CHANNEL_TYPE_CONFIG: Record<string, ChannelTypeConfig> = { ...FB_CONFIG };

/**
 * 获取渠道类型配置（带 unknown 后备）
 */
export function getChannelTypeConfig(type: string): ChannelTypeConfig {
    return CHANNEL_TYPE_CONFIG[type?.toLowerCase()] || UNKNOWN_CONFIG;
}

/**
 * 获取渠道类型配置（带 default 后备）
 */
export function getChannelTypeConfigWithDefault(type: string): ChannelTypeConfig {
    return CHANNEL_TYPE_CONFIG[type?.toLowerCase()] || DEFAULT_CONFIG;
}

export function getChannelTypeDisplayLabel(type: string): string {
    const normalizedType = type?.toLowerCase();
    const config = CHANNEL_TYPE_CONFIG[normalizedType];
    return config?.labelCN || config?.label || type;
}

export function getChannelTypeLabelMap() {
    const keys = Array.from(new Set([...CHANNEL_TYPE_ORDER, ...Object.keys(CHANNEL_TYPE_CONFIG)]));
    return Object.fromEntries(keys.map((type) => [type, getChannelTypeDisplayLabel(type)]));
}

export function formatChannelTypeDisplayList(types: readonly string[], separator = ' / ') {
    return types.map((type) => getChannelTypeDisplayLabel(type)).join(separator);
}

export function isKnownNotificationChannelType(type: string): type is AutoHealing.ChannelType {
    return CHANNEL_TYPE_ORDER.includes(type as typeof CHANNEL_TYPE_ORDER[number]);
}

function getOrderedChannelTypes() {
    const dictKeys = getDictItems('notification_channel_type')?.map((item) => item.dict_key) || [];
    const extraKeys = dictKeys.filter((key) => !CHANNEL_TYPE_ORDER.includes(key as typeof CHANNEL_TYPE_ORDER[number]));
    return [...CHANNEL_TYPE_ORDER.filter((key) => dictKeys.length === 0 || dictKeys.includes(key)), ...extraKeys];
}

function getChannelTypeOptionLabel(type: string, variant: ChannelOptionVariant) {
    return CHANNEL_OPTION_LABELS[variant][type]
        || getChannelTypeConfig(type).labelCN
        || type;
}

export function getChannelTypeOptions(variant: ChannelOptionVariant = 'filter') {
    return getOrderedChannelTypes().map((type) => ({
        label: getChannelTypeOptionLabel(type, variant),
        value: type,
    }));
}

// ==================== 刷新逻辑 ====================

function refresh() {
    const items = getDictItems('notification_channel_type');
    if (items?.length) {
        const map: Record<string, ChannelTypeConfig> = {};
        items.forEach(i => {
            const fallback = FB_CONFIG[i.dict_key];
            const normalizedLabelEn = i.label_en || i.label || i.dict_key;
            map[i.dict_key] = {
                icon: resolveIcon(i.icon, fallback?.icon),
                color: i.color || fallback?.color || '#8c8c8c',
                label: normalizedLabelEn.toUpperCase(),
                labelCN: i.label || i.dict_key,
                bg: i.bg || fallback?.bg || '#f5f5f5',
            };
        });
        CHANNEL_TYPE_CONFIG = map;
    }
}

onDictRefresh(refresh);
refresh();

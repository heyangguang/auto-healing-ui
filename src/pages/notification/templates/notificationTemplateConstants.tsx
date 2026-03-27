import React from 'react';
import { AppstoreOutlined, FlagOutlined, ThunderboltOutlined } from '@ant-design/icons';

export type EventTypeConfig = {
    bg: string;
    color: string;
    icon: React.ReactNode;
    label: string;
};

export const EVENT_TYPE_CONFIG: Record<AutoHealing.EventType, EventTypeConfig> = {
    execution_result: {
        icon: <ThunderboltOutlined />,
        color: '#faad14',
        label: 'EXECUTION',
        bg: '#fffbe6',
    },
    alert: {
        icon: <FlagOutlined />,
        color: '#ff4d4f',
        label: 'ALERT',
        bg: '#fff1f0',
    },
    execution_started: {
        icon: <AppstoreOutlined />,
        color: '#13c2c2',
        label: 'STARTED',
        bg: '#e6fffb',
    },
};

export const FORMAT_COLORS: Record<string, string> = {
    text: 'default',
    markdown: 'blue',
    html: 'orange',
};

export const NOTIFICATION_TEMPLATE_HEADER_ICON = (
    <svg viewBox="0 0 48 48" fill="none">
        <rect x="8" y="6" width="32" height="36" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M16 14h16M16 22h16M16 30h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M30 32l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const NOTIFICATION_TEMPLATE_SEARCH_FIELDS = [
    { key: 'name', label: '模板名称' },
];

export const NOTIFICATION_TEMPLATE_COLUMNS = [
    {
        columnKey: 'event_type',
        columnTitle: '事件类型',
        dataIndex: 'event_type',
        headerFilters: (Object.keys(EVENT_TYPE_CONFIG) as AutoHealing.EventType[]).map((key) => ({
            label: EVENT_TYPE_CONFIG[key].label,
            value: key,
        })),
    },
    {
        columnKey: 'status',
        columnTitle: '状态',
        dataIndex: 'is_active',
        headerFilters: [
            { label: '启用', value: 'active' },
            { label: '禁用', value: 'inactive' },
        ],
    },
    {
        columnKey: 'format',
        columnTitle: '格式',
        dataIndex: 'format',
        headerFilters: [
            { label: '纯文本', value: 'text' },
            { label: 'Markdown', value: 'markdown' },
            { label: 'HTML', value: 'html' },
        ],
    },
    {
        columnKey: 'channel_type',
        columnTitle: '渠道类型',
        dataIndex: 'channel_type',
        headerFilters: [
            { label: 'Webhook', value: 'webhook' },
            { label: 'Email', value: 'email' },
            { label: 'DingTalk', value: 'dingtalk' },
        ],
    },
];

export const TEMPLATE_SORT_OPTIONS = [
    { value: 'updated_at', label: '更新时间' },
    { value: 'created_at', label: '创建时间' },
    { value: 'name', label: '名称' },
];

export const EVENT_TYPE_OPTIONS = (Object.keys(EVENT_TYPE_CONFIG) as AutoHealing.EventType[]).map((key) => ({
    label: EVENT_TYPE_CONFIG[key].label,
    value: key,
}));

export const CHANNEL_OPTIONS = [
    { label: 'Webhook', value: 'webhook' },
    { label: 'Email 邮件', value: 'email' },
    { label: 'DingTalk 钉钉', value: 'dingtalk' },
];

export const FORMAT_OPTIONS = [
    { label: '纯文本', value: 'text' },
    { label: 'Markdown', value: 'markdown' },
    { label: 'HTML', value: 'html' },
];

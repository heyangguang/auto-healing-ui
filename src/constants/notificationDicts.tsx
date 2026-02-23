/**
 * 通知渠道相关字典值集中管理
 *
 * 包含：渠道类型（webhook / email / dingtalk）的图标、颜色、标签、背景色。
 * 合并了 channels/index.tsx、records/index.tsx、NotificationChannelTemplateSelector.tsx 三处定义的超集。
 *
 * **注意**：icon 字段为 React.ReactNode，本文件依赖 React 和 antd icons。
 */

import React from 'react';
import {
    ApiOutlined, MailOutlined, DingdingOutlined,
    BellOutlined, SendOutlined, GlobalOutlined,
} from '@ant-design/icons';

export interface ChannelTypeConfig {
    icon: React.ReactNode;
    color: string;
    /** 大写英文标签（渠道列表 / 记录页面使用） */
    label: string;
    /** 中文标签（编辑器选择器等使用） */
    labelCN: string;
    /** 卡片背景色 */
    bg: string;
}

export const CHANNEL_TYPE_CONFIG: Record<string, ChannelTypeConfig> = {
    webhook: {
        icon: <ApiOutlined />,
        color: '#722ed1',
        label: 'WEBHOOK',
        labelCN: 'Webhook',
        bg: '#f9f0ff',
    },
    email: {
        icon: <MailOutlined />,
        color: '#1890ff',
        label: 'EMAIL',
        labelCN: '邮件',
        bg: '#e6f7ff',
    },
    dingtalk: {
        icon: <DingdingOutlined />,
        color: '#0079f2',
        label: 'DINGTALK',
        labelCN: '钉钉',
        bg: '#f0f5ff',
    },
};

/** 未知类型的后备配置 */
const UNKNOWN_CONFIG: ChannelTypeConfig = {
    icon: <BellOutlined />,
    color: '#8c8c8c',
    label: 'UNKNOWN',
    labelCN: '未知',
    bg: '#f5f5f5',
};

/** 默认配置（编辑器选择器中使用） */
const DEFAULT_CONFIG: ChannelTypeConfig = {
    icon: <SendOutlined />,
    color: '#8c8c8c',
    label: 'DEFAULT',
    labelCN: '通知',
    bg: '#f5f5f5',
};

/**
 * 获取渠道类型配置（带 unknown 后备）
 * 用于 channels / records 等管理页面
 */
export function getChannelTypeConfig(type: string): ChannelTypeConfig {
    return CHANNEL_TYPE_CONFIG[type?.toLowerCase()] || UNKNOWN_CONFIG;
}

/**
 * 获取渠道类型配置（带 default 后备）
 * 用于编辑器中的渠道选择器
 */
export function getChannelTypeConfigWithDefault(type: string): ChannelTypeConfig {
    return CHANNEL_TYPE_CONFIG[type?.toLowerCase()] || DEFAULT_CONFIG;
}

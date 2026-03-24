/**
 * CMDB 资产相关字典值
 *
 * 数据源：后端 API > localStorage 缓存 > 硬编码兜底
 * 注意：icon 字段为 React 组件，由前端 iconRegistry 维护（后端只存 icon 名称字符串）
 */
import React from 'react';
import {
    DesktopOutlined, AppstoreOutlined, GlobalOutlined, HddOutlined,
} from '@ant-design/icons';
import { getDictItems, onDictRefresh } from '@/utils/dictCache';

// ==================== Icon 注册表 ====================

const ICON_REGISTRY: Record<string, React.ReactNode> = {
    DesktopOutlined: <DesktopOutlined />,
    AppstoreOutlined: <AppstoreOutlined />,
    GlobalOutlined: <GlobalOutlined />,
    HddOutlined: <HddOutlined />,
};

function resolveIcon(name?: string, fallback?: React.ReactNode): React.ReactNode {
    if (!name) return fallback || <DesktopOutlined />;
    return ICON_REGISTRY[name] || fallback || <DesktopOutlined />;
}

// ==================== 硬编码兜底 ====================

const FB_TYPE: Record<string, { text: string; icon: React.ReactNode; color: string }> = {
    server: { text: '服务器', icon: <DesktopOutlined />, color: '#1890ff' },
    application: { text: '应用', icon: <AppstoreOutlined />, color: '#13c2c2' },
    network: { text: '网络', icon: <GlobalOutlined />, color: '#722ed1' },
    database: { text: '数据库', icon: <HddOutlined />, color: '#fa8c16' },
};

const FB_STATUS: Record<string, { text: string; color: string; badge: 'success' | 'error' | 'warning' | 'default' }> = {
    active: { text: '在线', color: '#52c41a', badge: 'success' },
    offline: { text: '离线', color: '#ff4d4f', badge: 'error' },
    maintenance: { text: '维护', color: '#faad14', badge: 'warning' },
};

const FB_STATUS_LABELS: Record<string, string> = {
    active: '在线', offline: '离线', maintenance: '维护中',
};

const FB_ENV: Record<string, { text: string; color: string }> = {
    production: { text: '生产', color: 'red' },
    staging: { text: '预发', color: 'orange' },
    test: { text: '测试', color: 'green' },
    dev: { text: '开发', color: 'blue' },
};

// ==================== 动态变量 ====================

export let CMDB_TYPE_MAP: Record<string, { text: string; icon: React.ReactNode; color: string }> = { ...FB_TYPE };
export let CMDB_STATUS_MAP: Record<string, { text: string; color: string; badge: 'success' | 'error' | 'warning' | 'processing' | 'default' }> = { ...FB_STATUS };
export let CMDB_STATUS_LABELS: Record<string, string> = { ...FB_STATUS_LABELS };
export let CMDB_ENV_MAP: Record<string, { text: string; color: string }> = { ...FB_ENV };

// ==================== 刷新逻辑 ====================

function refresh() {
    const types = getDictItems('cmdb_type');
    if (types?.length) {
        const map: Record<string, any> = {};
        types.forEach(i => {
            map[i.dict_key] = {
                text: i.label,
                icon: resolveIcon(i.icon, FB_TYPE[i.dict_key]?.icon),
                color: i.color || '#8c8c8c',
            };
        });
        CMDB_TYPE_MAP = map;
    }

    const status = getDictItems('cmdb_status');
    if (status?.length) {
        const map: Record<string, any> = {};
        const labels: Record<string, string> = {};
        status.forEach(i => {
            map[i.dict_key] = { text: i.label, color: i.color || '#8c8c8c', badge: (i.badge || 'default') as 'success' | 'error' | 'warning' | 'processing' | 'default' };
            labels[i.dict_key] = i.label;
        });
        CMDB_STATUS_MAP = map;
        CMDB_STATUS_LABELS = labels;
    }

    const env = getDictItems('cmdb_environment');
    if (env?.length) {
        const map: Record<string, any> = {};
        env.forEach(i => {
            map[i.dict_key] = { text: i.label, color: i.tag_color || 'default' };
        });
        CMDB_ENV_MAP = map;
    }
}

onDictRefresh(refresh);
refresh();

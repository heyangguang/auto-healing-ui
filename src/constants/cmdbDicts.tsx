/**
 * CMDB 资产相关字典值集中管理
 *
 * 包含：资产类型、资产状态、环境映射。
 * cmdb/index.tsx 和 Dashboard ChartCMDBStatus 统一引用。
 */
import React from 'react';
import {
    DesktopOutlined, AppstoreOutlined, GlobalOutlined, HddOutlined,
} from '@ant-design/icons';

/* ========== 资产类型 ========== */

export const CMDB_TYPE_MAP: Record<string, { text: string; icon: React.ReactNode; color: string }> = {
    server: { text: '服务器', icon: <DesktopOutlined />, color: '#1890ff' },
    application: { text: '应用', icon: <AppstoreOutlined />, color: '#13c2c2' },
    network: { text: '网络', icon: <GlobalOutlined />, color: '#722ed1' },
    database: { text: '数据库', icon: <HddOutlined />, color: '#fa8c16' },
};

/* ========== 资产状态 ========== */

export const CMDB_STATUS_MAP: Record<string, { text: string; color: string; badge: 'success' | 'error' | 'warning' | 'default' }> = {
    active: { text: '活跃', color: '#52c41a', badge: 'success' },
    inactive: { text: '离线', color: '#ff4d4f', badge: 'error' },
    maintenance: { text: '维护', color: '#faad14', badge: 'warning' },
};

/** CMDB 状态标签（图表专用） */
export const CMDB_STATUS_LABELS: Record<string, string> = {
    active: '活跃',
    inactive: '停用',
    maintenance: '维护中',
};

/* ========== 环境 ========== */

export const CMDB_ENV_MAP: Record<string, { text: string; color: string }> = {
    production: { text: '生产', color: 'red' },
    staging: { text: '预发', color: 'orange' },
    test: { text: '测试', color: 'green' },
    development: { text: '开发', color: 'blue' },
};

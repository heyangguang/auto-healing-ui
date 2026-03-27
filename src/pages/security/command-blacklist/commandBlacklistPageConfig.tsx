import React from 'react';
import {
    BugOutlined,
    CheckCircleOutlined,
    CloudOutlined,
    CodeOutlined,
    DatabaseOutlined,
    DesktopOutlined,
    ExclamationCircleOutlined,
    FireOutlined,
    LockOutlined,
    SearchOutlined,
    SecurityScanOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import { Tag } from 'antd';
import type { CommandBlacklistRule } from '@/services/auto-healing/commandBlacklist';

export const SEVERITY_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; tagColor: string }> = {
    critical: { label: '严重', color: '#ff4d4f', icon: <FireOutlined />, tagColor: 'red' },
    high: { label: '高危', color: '#fa8c16', icon: <WarningOutlined />, tagColor: 'orange' },
    medium: { label: '中危', color: '#fadb14', icon: <ExclamationCircleOutlined />, tagColor: 'gold' },
};

export const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    filesystem: { label: '文件系统', icon: <CodeOutlined />, color: '#1890ff' },
    network: { label: '网络', icon: <CloudOutlined />, color: '#52c41a' },
    system: { label: '系统', icon: <DesktopOutlined />, color: '#722ed1' },
    database: { label: '数据库', icon: <DatabaseOutlined />, color: '#eb2f96' },
};

export const MATCH_TYPE_CONFIG: Record<string, { label: string; desc: string; icon: React.ReactNode }> = {
    contains: { label: '包含匹配', desc: '检查行中是否包含该文本', icon: <SearchOutlined /> },
    regex: { label: '正则匹配', desc: '使用正则表达式匹配', icon: <BugOutlined /> },
    exact: { label: '精确匹配', desc: '行内容去空格后完全匹配', icon: <LockOutlined /> },
};

export const headerIcon = (
    <svg viewBox="0 0 48 48" fill="none">
        <rect x="4" y="8" width="40" height="32" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M4 16h40" stroke="currentColor" strokeWidth="2" opacity="0.3" />
        <circle cx="10" cy="12" r="1.5" fill="currentColor" opacity="0.4" />
        <circle cx="15" cy="12" r="1.5" fill="currentColor" opacity="0.4" />
        <circle cx="20" cy="12" r="1.5" fill="currentColor" opacity="0.4" />
        <path d="M14 26h20" stroke="currentColor" strokeWidth="2" opacity="0.5" />
        <path d="M14 32h12" stroke="currentColor" strokeWidth="2" opacity="0.3" />
        <circle cx="35" cy="32" r="6" stroke="#ff4d4f" strokeWidth="2" fill="none" />
        <path d="M32 29l6 6M38 29l-6 6" stroke="#ff4d4f" strokeWidth="2" />
    </svg>
);

export const searchFields = [
    { key: 'name', label: '规则名称', description: '按名称模糊搜索' },
];

export const buildStatsBar = (stats: { total: number; active: number; critical: number; high: number; medium: number }) => (
    <div className="blacklist-stats-bar">
        <div className="blacklist-stat-item">
            <SecurityScanOutlined className="blacklist-stat-icon blacklist-stat-icon-total" />
            <div className="blacklist-stat-content">
                <div className="blacklist-stat-value">{stats.total}</div>
                <div className="blacklist-stat-label">总规则数</div>
            </div>
        </div>
        <div className="blacklist-stat-divider" />
        <div className="blacklist-stat-item">
            <CheckCircleOutlined className="blacklist-stat-icon blacklist-stat-icon-active" />
            <div className="blacklist-stat-content">
                <div className="blacklist-stat-value">{stats.active}</div>
                <div className="blacklist-stat-label">已启用</div>
            </div>
        </div>
        <div className="blacklist-stat-divider" />
        <div className="blacklist-stat-item">
            <FireOutlined className="blacklist-stat-icon blacklist-stat-icon-critical" />
            <div className="blacklist-stat-content">
                <div className="blacklist-stat-value">{stats.critical}</div>
                <div className="blacklist-stat-label">严重</div>
            </div>
        </div>
        <div className="blacklist-stat-divider" />
        <div className="blacklist-stat-item">
            <WarningOutlined className="blacklist-stat-icon blacklist-stat-icon-high" />
            <div className="blacklist-stat-content">
                <div className="blacklist-stat-value">{stats.high}</div>
                <div className="blacklist-stat-label">高危</div>
            </div>
        </div>
        <div className="blacklist-stat-divider" />
        <div className="blacklist-stat-item">
            <ExclamationCircleOutlined className="blacklist-stat-icon blacklist-stat-icon-medium" />
            <div className="blacklist-stat-content">
                <div className="blacklist-stat-value">{stats.medium}</div>
                <div className="blacklist-stat-label">中危</div>
            </div>
        </div>
    </div>
);

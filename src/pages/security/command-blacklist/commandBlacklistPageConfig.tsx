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
import {
    getBlacklistCategoryMeta,
    getBlacklistMatchTypeMeta,
    getBlacklistSeverityMeta,
} from '@/constants/securityDicts';

const SEVERITY_ICON_REGISTRY: Record<string, React.ReactNode> = {
    critical: <FireOutlined />,
    high: <WarningOutlined />,
    medium: <ExclamationCircleOutlined />,
};

const CATEGORY_ICON_REGISTRY: Record<string, React.ReactNode> = {
    filesystem: <CodeOutlined />,
    network: <CloudOutlined />,
    system: <DesktopOutlined />,
    database: <DatabaseOutlined />,
};

const MATCH_TYPE_ICON_REGISTRY: Record<string, React.ReactNode> = {
    contains: <SearchOutlined />,
    regex: <BugOutlined />,
    exact: <LockOutlined />,
};

export const getSeverityConfig = (key: string) => {
    const meta = getBlacklistSeverityMeta(key);
    return {
        ...meta,
        icon: SEVERITY_ICON_REGISTRY[key] || <ExclamationCircleOutlined />,
    };
};

export const getCategoryConfig = (key: string) => {
    const meta = getBlacklistCategoryMeta(key);
    return {
        ...meta,
        icon: CATEGORY_ICON_REGISTRY[key] || <CodeOutlined />,
    };
};

export const getMatchTypeConfig = (key: string) => {
    const meta = getBlacklistMatchTypeMeta(key);
    return {
        ...meta,
        desc: meta.desc || '',
        icon: MATCH_TYPE_ICON_REGISTRY[key] || <SearchOutlined />,
    };
};

export const headerIcon = (
    <svg viewBox="0 0 48 48" fill="none">
        <title>命令黑名单图标</title>
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
    (() => {
        const critical = getBlacklistSeverityMeta('critical');
        const high = getBlacklistSeverityMeta('high');
        const medium = getBlacklistSeverityMeta('medium');
        return (
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
                    <FireOutlined className="blacklist-stat-icon blacklist-stat-icon-critical" style={{ color: critical.color }} />
                    <div className="blacklist-stat-content">
                        <div className="blacklist-stat-value">{stats.critical}</div>
                        <div className="blacklist-stat-label">{critical.label}</div>
                    </div>
                </div>
                <div className="blacklist-stat-divider" />
                <div className="blacklist-stat-item">
                    <WarningOutlined className="blacklist-stat-icon blacklist-stat-icon-high" style={{ color: high.color }} />
                    <div className="blacklist-stat-content">
                        <div className="blacklist-stat-value">{stats.high}</div>
                        <div className="blacklist-stat-label">{high.label}</div>
                    </div>
                </div>
                <div className="blacklist-stat-divider" />
                <div className="blacklist-stat-item">
                    <ExclamationCircleOutlined className="blacklist-stat-icon blacklist-stat-icon-medium" style={{ color: medium.color }} />
                    <div className="blacklist-stat-content">
                        <div className="blacklist-stat-value">{stats.medium}</div>
                        <div className="blacklist-stat-label">{medium.label}</div>
                    </div>
                </div>
            </div>
        );
    })()
);

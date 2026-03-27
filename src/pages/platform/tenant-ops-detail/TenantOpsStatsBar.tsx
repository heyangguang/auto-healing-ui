import React from 'react';
import {
    BankOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SafetyCertificateOutlined,
    TeamOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';

type TenantStats = {
    total: number;
    active: number;
    inactive: number;
    totalMembers: number;
    totalRules: number;
    totalAudit: number;
};

type TenantOpsStatsBarProps = {
    stats: TenantStats;
};

const TenantOpsStatsBar: React.FC<TenantOpsStatsBarProps> = ({ stats }) => {
    const items = [
        { icon: <BankOutlined />, cls: 'total', val: stats.total, lbl: '全部租户' },
        { icon: <CheckCircleOutlined />, cls: 'ready', val: stats.active, lbl: '活跃' },
        { icon: <CloseCircleOutlined />, cls: 'error', val: stats.inactive, lbl: '停用' },
        { icon: <TeamOutlined />, cls: 'total', val: stats.totalMembers, lbl: '总用户' },
        { icon: <ThunderboltOutlined />, cls: 'ready', val: stats.totalRules, lbl: '总规则' },
        { icon: <SafetyCertificateOutlined />, cls: 'total', val: stats.totalAudit, lbl: '审计事件' },
    ];

    return (
        <div className="git-stats-bar">
            {items.map((item, index) => (
                <React.Fragment key={item.lbl}>
                    {index > 0 && <div className="git-stat-divider" />}
                    <div className="git-stat-item">
                        <span className={`git-stat-icon git-stat-icon-${item.cls}`}>{item.icon}</span>
                        <div className="git-stat-content">
                            <div className="git-stat-value">{item.val}</div>
                            <div className="git-stat-label">{item.lbl}</div>
                        </div>
                    </div>
                </React.Fragment>
            ))}
        </div>
    );
};

export default TenantOpsStatsBar;

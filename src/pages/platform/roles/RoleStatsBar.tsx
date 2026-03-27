import React from 'react';
import { SafetyCertificateOutlined, SecurityScanOutlined } from '@ant-design/icons';

type RoleStats = {
    total: number;
    system: number;
};

type RoleStatsBarProps = {
    stats: RoleStats;
};

const RoleStatsBar: React.FC<RoleStatsBarProps> = ({ stats }) => {
    const items = [
        { icon: <SafetyCertificateOutlined />, cls: 'total', val: stats.total, lbl: '全部' },
        { icon: <SecurityScanOutlined />, cls: 'ready', val: stats.system, lbl: '系统角色' },
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

export default RoleStatsBar;

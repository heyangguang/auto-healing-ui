import React from 'react';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    CloudServerOutlined,
    ToolOutlined,
} from '@ant-design/icons';

type CMDBStatsBarProps = {
    stats: AutoHealing.CMDBStats | null;
};

export const CMDBStatsBar: React.FC<CMDBStatsBarProps> = ({ stats }) => {
    if (!stats) {
        return null;
    }

    const activeCount = stats.by_status?.find((status) => status.status === 'active')?.count ?? 0;
    const inactiveCount = stats.by_status?.find((status) => status.status === 'offline')?.count ?? 0;
    const maintenanceCount = stats.by_status?.find((status) => status.status === 'maintenance')?.count ?? 0;

    return (
        <div className="cmdb-stats-bar">
            <div className="cmdb-stat-item">
                <CloudServerOutlined className="cmdb-stat-icon cmdb-stat-icon-total" />
                <div className="cmdb-stat-content">
                    <div className="cmdb-stat-value">{stats.total}</div>
                    <div className="cmdb-stat-label">总资产</div>
                </div>
            </div>
            <div className="cmdb-stat-divider" />
            <div className="cmdb-stat-item">
                <CheckCircleOutlined className="cmdb-stat-icon cmdb-stat-icon-active" />
                <div className="cmdb-stat-content">
                    <div className="cmdb-stat-value">{activeCount}</div>
                    <div className="cmdb-stat-label">活跃</div>
                </div>
            </div>
            <div className="cmdb-stat-divider" />
            <div className="cmdb-stat-item">
                <CloseCircleOutlined className="cmdb-stat-icon cmdb-stat-icon-offline" />
                <div className="cmdb-stat-content">
                    <div className="cmdb-stat-value">{inactiveCount}</div>
                    <div className="cmdb-stat-label">离线</div>
                </div>
            </div>
            <div className="cmdb-stat-divider" />
            <div className="cmdb-stat-item">
                <ToolOutlined className="cmdb-stat-icon cmdb-stat-icon-maintenance" />
                <div className="cmdb-stat-content">
                    <div className="cmdb-stat-value">{maintenanceCount}</div>
                    <div className="cmdb-stat-label">维护</div>
                </div>
            </div>
        </div>
    );
};

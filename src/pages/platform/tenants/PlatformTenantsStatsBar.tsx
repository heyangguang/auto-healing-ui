import React from 'react';
import { AppstoreOutlined, BankOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { TenantStats } from './platformTenantsShared';

type PlatformTenantsStatsBarProps = {
  stats: TenantStats;
};

const PlatformTenantsStatsBar: React.FC<PlatformTenantsStatsBarProps> = ({ stats }) => {
  const items = [
    { icon: <BankOutlined />, cls: 'total', val: stats.total, lbl: '全部' },
    { icon: <CheckCircleOutlined />, cls: 'ready', val: stats.active, lbl: '启用' },
    { icon: <AppstoreOutlined />, cls: 'error', val: stats.inactive, lbl: '停用' },
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

export default PlatformTenantsStatsBar;

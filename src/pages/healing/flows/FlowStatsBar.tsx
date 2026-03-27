import React from 'react';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeploymentUnitOutlined,
} from '@ant-design/icons';

type FlowStats = {
  active_count: number;
  inactive_count: number;
  total: number;
};

type FlowStatsBarProps = {
  stats: FlowStats | null;
};

export const FlowStatsBar: React.FC<FlowStatsBarProps> = ({ stats }) => {
  if (!stats) {
    return null;
  }

  const items = [
    { icon: <DeploymentUnitOutlined />, cls: 'total', val: stats.total, lbl: '总流程' },
    { icon: <CheckCircleOutlined />, cls: 'ready', val: stats.active_count, lbl: '启用' },
    { icon: <CloseCircleOutlined />, cls: 'error', val: stats.inactive_count, lbl: '停用' },
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

import React from 'react';
import {
  AlertOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

type IncidentStatsBarProps = {
  stats: AutoHealing.IncidentStats | null;
};

export const IncidentStatsBar: React.FC<IncidentStatsBarProps> = ({ stats }) => {
  if (!stats) {
    return null;
  }

  return (
    <div className="incidents-stats-bar">
      <div className="incidents-stat-item">
        <AlertOutlined className="incidents-stat-icon incidents-stat-icon-total" />
        <div className="incidents-stat-content">
          <div className="incidents-stat-value">{stats.total}</div>
          <div className="incidents-stat-label">总工单</div>
        </div>
      </div>
      <div className="incidents-stat-divider" />
      <div className="incidents-stat-item">
        <SearchOutlined className="incidents-stat-icon incidents-stat-icon-scanned" />
        <div className="incidents-stat-content">
          <div className="incidents-stat-value">{stats.scanned}</div>
          <div className="incidents-stat-label">已扫描</div>
        </div>
      </div>
      <div className="incidents-stat-divider" />
      <div className="incidents-stat-item">
        <ClockCircleOutlined className="incidents-stat-icon incidents-stat-icon-unscanned" />
        <div className="incidents-stat-content">
          <div className="incidents-stat-value">{stats.unscanned}</div>
          <div className="incidents-stat-label">待扫描</div>
        </div>
      </div>
      <div className="incidents-stat-divider" />
      <div className="incidents-stat-item">
        <ThunderboltOutlined className="incidents-stat-icon incidents-stat-icon-healed" />
        <div className="incidents-stat-content">
          <div className="incidents-stat-value">{stats.healed}</div>
          <div className="incidents-stat-label">已自愈</div>
        </div>
      </div>
      <div className="incidents-stat-divider" />
      <div className="incidents-stat-item">
        <CloseCircleOutlined className="incidents-stat-icon incidents-stat-icon-failed" />
        <div className="incidents-stat-content">
          <div className="incidents-stat-value">{stats.failed}</div>
          <div className="incidents-stat-label">自愈失败</div>
        </div>
      </div>
    </div>
  );
};

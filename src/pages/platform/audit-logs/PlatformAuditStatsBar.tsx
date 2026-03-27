import React from 'react';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import AuditTrendSparkline from '@/pages/system/audit-logs/AuditTrendSparkline';
import type { AuditStatsSummary, TrendPoint } from '@/pages/system/audit-logs/types';

type PlatformAuditStatsBarProps = {
  stats: AuditStatsSummary | null;
  trendData: TrendPoint[];
};

const PlatformAuditStatsBar: React.FC<PlatformAuditStatsBarProps> = ({ stats, trendData }) => {
  if (!stats) {
    return null;
  }

  return (
    <div className="audit-stats-bar">
      <div className="audit-stat-item">
        <FileTextOutlined className="audit-stat-icon audit-stat-icon-total" />
        <div className="audit-stat-content">
          <div className="audit-stat-value">{stats.total_count ?? 0}</div>
          <div className="audit-stat-label">总操作</div>
        </div>
      </div>
      <div className="audit-stat-divider" />
      <div className="audit-stat-item">
        <CheckCircleOutlined className="audit-stat-icon audit-stat-icon-success" />
        <div className="audit-stat-content">
          <div className="audit-stat-value">{stats.success_count ?? 0}</div>
          <div className="audit-stat-label">成功</div>
        </div>
      </div>
      <div className="audit-stat-divider" />
      <div className="audit-stat-item">
        <CloseCircleOutlined className="audit-stat-icon audit-stat-icon-failed" />
        <div className="audit-stat-content">
          <div className="audit-stat-value">{stats.failed_count ?? 0}</div>
          <div className="audit-stat-label">失败</div>
        </div>
      </div>
      <div className="audit-stat-divider" />
      <div className="audit-stat-item">
        <ClockCircleOutlined className="audit-stat-icon audit-stat-icon-today" />
        <div className="audit-stat-content">
          <div className="audit-stat-value">{stats.today_count ?? 0}</div>
          <div className="audit-stat-label">今日</div>
        </div>
      </div>
      <div className="audit-stat-divider" />
      <div className="audit-stat-item audit-stat-trend">
        <div className="audit-stat-content">
          <div className="audit-stat-label" style={{ marginBottom: 4 }}>
            7 天趋势
          </div>
          <AuditTrendSparkline
            data={trendData}
            gradientId="platformAuditTrendGradient"
            strokeColor="#722ed1"
          />
        </div>
      </div>
    </div>
  );
};

export default PlatformAuditStatsBar;

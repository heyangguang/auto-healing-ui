import React from 'react';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
  LoadingOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';
import { INSTANCE_STATUS_LABELS } from '@/constants/instanceDicts';

type InstanceStatsBarProps = {
  stats: {
    total: number;
    by_status: { status: string; count: number }[];
  } | null;
};

export const InstanceStatsBar: React.FC<InstanceStatsBarProps> = ({ stats }) => {
  if (!stats) {
    return null;
  }

  const statusMap: Record<string, number> = {};
  (stats.by_status || []).forEach((status) => {
    statusMap[status.status] = status.count;
  });

  const items = [
    { icon: <HistoryOutlined />, cls: 'total', val: stats.total, lbl: '总实例' },
    { icon: <CheckCircleOutlined />, cls: 'ready', val: statusMap.completed || 0, lbl: INSTANCE_STATUS_LABELS.completed || 'completed' },
    { icon: <LoadingOutlined />, cls: 'pending', val: statusMap.running || 0, lbl: INSTANCE_STATUS_LABELS.running || 'running' },
    { icon: <PauseCircleOutlined />, cls: 'warning', val: statusMap.waiting_approval || 0, lbl: INSTANCE_STATUS_LABELS.waiting_approval || 'waiting_approval' },
    { icon: <CloseCircleOutlined />, cls: 'error', val: statusMap.failed || 0, lbl: INSTANCE_STATUS_LABELS.failed || 'failed' },
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

import React from 'react';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  PauseCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { INSTANCE_STATUS_MAP } from '@/constants/instanceDicts';
import { normalizeNodeState } from './utils/canvasBuilder';

const INSTANCE_STATUS_ICONS: Record<string, React.ReactElement> = {
  pending: <ClockCircleOutlined />,
  running: <LoadingOutlined spin />,
  waiting_approval: <PauseCircleOutlined />,
  completed: <CheckCircleOutlined />,
  success: <CheckCircleOutlined />,
  approved: <CheckCircleOutlined />,
  failed: <CloseCircleOutlined />,
  rejected: <CloseCircleOutlined />,
  partial: <ClockCircleOutlined />,
  cancelled: <StopOutlined />,
  skipped: <StopOutlined />,
  simulated: <CheckCircleOutlined />,
};

export function getInstanceStatusConfig(status: string) {
  const info = INSTANCE_STATUS_MAP[status] || INSTANCE_STATUS_MAP.pending || { color: 'default', text: status || '未知' };
  return {
    color: info.color,
    icon: INSTANCE_STATUS_ICONS[status] || INSTANCE_STATUS_ICONS.pending,
    label: info.text,
  };
}

export function hasFailedNodes(instance: AutoHealing.FlowInstance): boolean {
  if (instance.status !== 'completed') return false;
  if (typeof instance.failed_node_count === 'number') return instance.failed_node_count > 0;
  const nodeStates = instance.node_states;
  if (!nodeStates || typeof nodeStates !== 'object') return false;
  return Object.values(nodeStates).some((raw) => {
    const normalized = normalizeNodeState(raw);
    return normalized?.status === 'failed' || normalized?.status === 'error';
  });
}

export function hasRejectedNodes(instance: AutoHealing.FlowInstance): boolean {
  if (instance.status !== 'completed') return false;
  if (typeof instance.rejected_node_count === 'number') return instance.rejected_node_count > 0;
  const nodeStates = instance.node_states;
  if (!nodeStates || typeof nodeStates !== 'object') return false;
  return Object.values(nodeStates).some((raw) => {
    const normalized = normalizeNodeState(raw);
    return normalized?.status === 'rejected';
  });
}

export function formatInstanceDuration(startedAt?: string, completedAt?: string) {
  if (!startedAt) return '-';
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const diff = Math.floor((end - start) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
}

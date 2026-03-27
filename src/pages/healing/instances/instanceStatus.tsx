import React from 'react';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  PauseCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { normalizeNodeState } from './utils/canvasBuilder';

export const INSTANCE_STATUS_CONFIG: Record<string, { color: string; icon: React.ReactElement; label: string }> = {
  pending: { color: '#d9d9d9', icon: <ClockCircleOutlined />, label: '等待中' },
  running: { color: '#1890ff', icon: <LoadingOutlined spin />, label: '执行中' },
  waiting_approval: { color: '#fa8c16', icon: <PauseCircleOutlined />, label: '待审批' },
  completed: { color: '#52c41a', icon: <CheckCircleOutlined />, label: '已完成' },
  success: { color: '#52c41a', icon: <CheckCircleOutlined />, label: '成功' },
  approved: { color: '#52c41a', icon: <CheckCircleOutlined />, label: '已通过' },
  failed: { color: '#ff4d4f', icon: <CloseCircleOutlined />, label: '失败' },
  rejected: { color: '#ff4d4f', icon: <CloseCircleOutlined />, label: '已拒绝' },
  partial: { color: '#faad14', icon: <ClockCircleOutlined />, label: '部分成功' },
  cancelled: { color: '#8c8c8c', icon: <StopOutlined />, label: '已取消' },
  skipped: { color: '#d9d9d9', icon: <StopOutlined />, label: '已跳过' },
  simulated: { color: '#13c2c2', icon: <CheckCircleOutlined />, label: '模拟通过' },
};

export function getInstanceStatusConfig(status: string) {
  return INSTANCE_STATUS_CONFIG[status] || INSTANCE_STATUS_CONFIG.pending;
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

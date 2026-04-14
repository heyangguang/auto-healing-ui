import type { DashboardSectionKey } from '../useDashboardSection';

const SECTION_METRIC_LABELS: Record<DashboardSectionKey, string> = {
  incidents: '工单数',
  cmdb: '资产数',
  healing: '实例数',
  execution: '执行次数',
  plugins: '插件数',
  notifications: '通知数',
  git: '仓库数',
  playbooks: 'Playbook 数',
  secrets: '密钥源数',
  users: '用户数',
};

const FIELD_METRIC_LABELS: Record<string, string> = {
  'healing.approvals_by_status': '审批数',
  'healing.rules_by_trigger_mode': '规则数',
  'healing.flow_top10': '触发次数',
  'execution.schedules_by_type': '定时任务数',
  'plugins.sync_trend_7d': '同步次数',
  'notifications.by_channel_type': '渠道数',
};

export function getDashboardChartMetricLabel(section: DashboardSectionKey, field: string): string {
  return FIELD_METRIC_LABELS[`${section}.${field}`] || SECTION_METRIC_LABELS[section] || '数量';
}

export function withMetricLabel<T extends Record<string, unknown>>(base: T, metricLabel: string, value: number) {
  return { ...base, [metricLabel]: value };
}

export function readMetricValue(data: Record<string, unknown>, metricLabel: string): number {
  return Number(data[metricLabel] ?? 0);
}

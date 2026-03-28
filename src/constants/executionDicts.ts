/**
 * 执行管理相关字典值
 *
 * 数据源：后端 API > localStorage 缓存 > 硬编码兜底
 */
import { getDictItems, onDictRefresh } from '@/utils/dictCache';

type BadgeStatus = 'success' | 'error' | 'warning' | 'processing' | 'default';

export interface ExecutionDictMeta {
  label: string;
  color: string;
  tagColor: string;
  badge: BadgeStatus;
}

export interface ExecutorTypeConfig extends ExecutionDictMeta {}

const DEFAULT_META: ExecutionDictMeta = {
  label: '未知',
  color: '#8c8c8c',
  tagColor: 'default',
  badge: 'default',
};

const FB_EXECUTOR: Record<string, ExecutorTypeConfig> = {
  local: { label: '本地执行', color: '#52c41a', tagColor: 'success', badge: 'success' },
  docker: { label: 'Docker 容器', color: '#1677ff', tagColor: 'processing', badge: 'processing' },
  ssh: { label: 'SSH', color: '#722ed1', tagColor: 'purple', badge: 'processing' },
};

const FB_RUN_STATUS: Record<string, ExecutionDictMeta> = {
  success: { label: '成功', color: '#52c41a', tagColor: 'success', badge: 'success' },
  failed: { label: '失败', color: '#ff4d4f', tagColor: 'error', badge: 'error' },
  running: { label: '运行中', color: '#1677ff', tagColor: 'processing', badge: 'processing' },
  partial: { label: '部分成功', color: '#faad14', tagColor: 'warning', badge: 'warning' },
  cancelled: { label: '已取消', color: '#8c8c8c', tagColor: 'default', badge: 'default' },
  pending: { label: '等待中', color: '#722ed1', tagColor: 'processing', badge: 'processing' },
  timeout: { label: '超时', color: '#eb2f96', tagColor: 'error', badge: 'error' },
};

const FB_EXECUTION_TRIGGERED_BY: Record<string, ExecutionDictMeta> = {
  manual: { label: '手动触发', color: '#1677ff', tagColor: 'processing', badge: 'processing' },
  'scheduler:cron': { label: 'Cron 调度', color: '#722ed1', tagColor: 'purple', badge: 'processing' },
  'scheduler:once': { label: '一次性调度', color: '#722ed1', tagColor: 'purple', badge: 'processing' },
  healing: { label: '自愈触发', color: '#52c41a', tagColor: 'success', badge: 'success' },
};

export let EXECUTOR_TYPE_CONFIG: Record<string, ExecutorTypeConfig> = { ...FB_EXECUTOR };
export let RUN_STATUS_CONFIG: Record<string, ExecutionDictMeta> = { ...FB_RUN_STATUS };
export let EXECUTION_TRIGGERED_BY_CONFIG: Record<string, ExecutionDictMeta> = { ...FB_EXECUTION_TRIGGERED_BY };

export let RUN_STATUS_COLORS: Record<string, string> = toColors(RUN_STATUS_CONFIG);
export let RUN_STATUS_LABELS: Record<string, string> = toLabels(RUN_STATUS_CONFIG);
export let RUN_STATUS_MAP: Record<string, { color: string; text: string }> = toTagMap(RUN_STATUS_CONFIG);

function toLabels(map: Record<string, ExecutionDictMeta>) {
  return Object.fromEntries(Object.entries(map).map(([key, meta]) => [key, meta.label]));
}

function toColors(map: Record<string, ExecutionDictMeta>) {
  return Object.fromEntries(Object.entries(map).map(([key, meta]) => [key, meta.color]));
}

function toTagMap(map: Record<string, ExecutionDictMeta>) {
  return Object.fromEntries(Object.entries(map).map(([key, meta]) => [key, { color: meta.tagColor, text: meta.label }]));
}

function toMeta(item: { label: string; color?: string; tag_color?: string; badge?: string }) {
  return {
    label: item.label,
    color: item.color || DEFAULT_META.color,
    tagColor: item.tag_color || item.color || DEFAULT_META.tagColor,
    badge: (item.badge || DEFAULT_META.badge) as BadgeStatus,
  };
}

function refreshExecutorTypes() {
  const items = getDictItems('executor_type');
  if (!items?.length) {
    EXECUTOR_TYPE_CONFIG = { ...FB_EXECUTOR };
    return;
  }
  EXECUTOR_TYPE_CONFIG = {
    ...FB_EXECUTOR,
    ...Object.fromEntries(items.map(item => [item.dict_key, toMeta(item)])),
  };
}

function refreshRunStatuses() {
  const items = getDictItems('run_status');
  RUN_STATUS_CONFIG = items?.length
    ? { ...FB_RUN_STATUS, ...Object.fromEntries(items.map(item => [item.dict_key, toMeta(item)])) }
    : { ...FB_RUN_STATUS };
  RUN_STATUS_COLORS = toColors(RUN_STATUS_CONFIG);
  RUN_STATUS_LABELS = toLabels(RUN_STATUS_CONFIG);
  RUN_STATUS_MAP = toTagMap(RUN_STATUS_CONFIG);
}

function refreshTriggeredBy() {
  const items = getDictItems('execution_triggered_by');
  EXECUTION_TRIGGERED_BY_CONFIG = items?.length
    ? { ...FB_EXECUTION_TRIGGERED_BY, ...Object.fromEntries(items.map(item => [item.dict_key, toMeta(item)])) }
    : { ...FB_EXECUTION_TRIGGERED_BY };
}

function refresh() {
  refreshExecutorTypes();
  refreshRunStatuses();
  refreshTriggeredBy();
}

function fallbackMeta(key?: string): ExecutionDictMeta {
  return {
    ...DEFAULT_META,
    label: key || DEFAULT_META.label,
  };
}

function toOptions(map: Record<string, ExecutionDictMeta>) {
  return Object.entries(map).map(([value, meta]) => ({ label: meta.label, value }));
}

export function getExecutorConfig(type?: string): ExecutorTypeConfig {
  if (!type) {
    return fallbackMeta() as ExecutorTypeConfig;
  }
  return EXECUTOR_TYPE_CONFIG[type] || (fallbackMeta(type) as ExecutorTypeConfig);
}

export function getRunStatusConfig(status?: string): ExecutionDictMeta {
  if (!status) {
    return fallbackMeta();
  }
  return RUN_STATUS_CONFIG[status] || fallbackMeta(status);
}

export function getExecutionTriggeredByConfig(value?: string): ExecutionDictMeta {
  if (!value) {
    return fallbackMeta();
  }
  return EXECUTION_TRIGGERED_BY_CONFIG[value] || fallbackMeta(value);
}

export function getExecutorOptions() {
  return toOptions(EXECUTOR_TYPE_CONFIG);
}

export function getRunStatusOptions() {
  return toOptions(RUN_STATUS_CONFIG);
}

export function getExecutionTriggeredByOptions() {
  return toOptions(EXECUTION_TRIGGERED_BY_CONFIG);
}

onDictRefresh(refresh);
refresh();

import type { LogEntry } from '@/components/execution/LogConsole';
import type { SelectedNodeDataLike } from './nodeDetailTypes';

const EXECUTION_LOG_VISIBLE_STATUSES = new Set([
  'running',
  'completed',
  'success',
  'failed',
  'error',
  'partial',
  'cancelled',
  'timeout',
  'skipped',
]);

function getStringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export function resolveExecutionRunId(
  selectedNodeData?: SelectedNodeDataLike | null,
) {
  const nodeState = selectedNodeData?.state;
  return (
    getStringValue(nodeState?.run?.run_id) ||
    getStringValue(nodeState?.run_id) ||
    getStringValue(selectedNodeData?.config?.run_id)
  );
}

export function resolveExecutionTaskId(
  selectedNodeData?: SelectedNodeDataLike | null,
) {
  const nodeState = selectedNodeData?.state;
  return (
    getStringValue(nodeState?.task_id) ||
    getStringValue(nodeState?.run?.task_id) ||
    getStringValue(selectedNodeData?.config?.task_template_id)
  );
}

export function hasExecutionStarted(
  selectedNodeData?: SelectedNodeDataLike | null,
) {
  if (selectedNodeData?.type !== 'execution') {
    return false;
  }

  const status =
    getStringValue(selectedNodeData.state?.status) ||
    getStringValue(selectedNodeData.status);

  return Boolean(
    resolveExecutionRunId(selectedNodeData) ||
      selectedNodeData.state?.started_at ||
      selectedNodeData.state?.finished_at ||
      selectedNodeData.state?.updated_at ||
      (status && EXECUTION_LOG_VISIBLE_STATUSES.has(status)),
  );
}

export function shouldShowExecutionLogTab(
  selectedNodeData: SelectedNodeDataLike | null | undefined,
  fallbackLogs: readonly LogEntry[],
) {
  return hasExecutionStarted(selectedNodeData) || fallbackLogs.length > 0;
}

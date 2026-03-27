import { type LogEntry, toLogEntries } from '@/components/execution/LogConsole';

const RECENT_STREAM_WINDOW_MS = 30_000;
const FINAL_RUN_STATUSES = new Set<AutoHealing.ExecutionStatus>([
    'success',
    'failed',
    'partial',
    'cancelled',
    'timeout',
]);

export function sortExecutionLogs(logEntries: AutoHealing.ExecutionLog[]) {
    return toLogEntries(logEntries).sort((a, b) => a.sequence - b.sequence);
}

export function mergeExecutionLogs(currentLogs: LogEntry[], nextLogs: AutoHealing.ExecutionLog[]) {
    const mergedLogs = new Map<number, LogEntry>();
    [...currentLogs, ...sortExecutionLogs(nextLogs)].forEach((log) => {
        mergedLogs.set(log.sequence, log);
    });
    return [...mergedLogs.values()].sort((a, b) => a.sequence - b.sequence);
}

export function shouldKeepLiveStream(
    runData?: AutoHealing.ExecutionRun,
    options: { allowRecentFinal?: boolean } = {},
) {
    const { allowRecentFinal = true } = options;
    const isRecent = !!runData?.created_at
        && (Date.now() - new Date(runData.created_at).getTime()) < RECENT_STREAM_WINDOW_MS;
    return !!runData?.status && (
        runData.status === 'running'
        || runData.status === 'pending'
        || (allowRecentFinal && FINAL_RUN_STATUSES.has(runData.status) && isRecent)
    );
}

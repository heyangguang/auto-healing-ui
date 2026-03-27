import type { LogEntry } from '@/components/execution/LogConsole';

export function sortLogEntries(logs: readonly LogEntry[]) {
    return [...logs].sort((left, right) => left.sequence - right.sequence);
}

export function mergeLogEntries(
    previousLogs: readonly LogEntry[],
    nextLogs: readonly LogEntry[],
) {
    const mergedLogs = new Map<number, LogEntry>();

    sortLogEntries(previousLogs).forEach((log) => {
        mergedLogs.set(log.sequence, log);
    });
    sortLogEntries(nextLogs).forEach((log) => {
        mergedLogs.set(log.sequence, log);
    });

    return sortLogEntries(Array.from(mergedLogs.values()));
}

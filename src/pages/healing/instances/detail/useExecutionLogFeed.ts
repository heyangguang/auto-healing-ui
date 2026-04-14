import { type LogEntry, toLogEntries, toLogEntry } from '@/components/execution/LogConsole';
import { mergeLogEntries, sortLogEntries } from '@/pages/execution/logs/logStreamHelpers';
import { shouldKeepLiveStream } from '@/pages/execution/runs/runDetailLogHelpers';
import { createLogStream, getExecutionLogs, getExecutionRun } from '@/services/auto-healing/execution';
import { createRequestSequence } from '@/utils/requestSequence';
import { useCallback, useEffect, useRef, useState } from 'react';

const LOG_REFRESH_INTERVAL_MS = 2_000;

const mergeExecutionLogEntries = (
    previousLogs: readonly LogEntry[],
    executionLogs: readonly AutoHealing.ExecutionLog[],
) => mergeLogEntries(previousLogs, sortLogEntries(toLogEntries(executionLogs)));

export function useExecutionLogFeed(runId?: string) {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [streaming, setStreaming] = useState(false);
    const closeStreamRef = useRef<(() => void) | null>(null);
    const pollTimerRef = useRef<number | null>(null);
    const requestSequenceRef = useRef(createRequestSequence());
    const currentStreamRunIdRef = useRef<string | undefined>(undefined);
    const streamingRef = useRef(false);

    const markStreamClosed = useCallback(() => {
        streamingRef.current = false;
        currentStreamRunIdRef.current = undefined;
        closeStreamRef.current = null;
        setStreaming(false);
    }, []);

    const closeCurrentStream = useCallback(() => {
        const closeStream = closeStreamRef.current;
        markStreamClosed();
        closeStream?.();
    }, [markStreamClosed]);

    const closePolling = useCallback(() => {
        if (pollTimerRef.current === null) {
            return;
        }
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
    }, []);

    const refreshSnapshot = useCallback(async (currentRunId: string, token = requestSequenceRef.current.current()) => {
        try {
            const [runResponse, logsResponse] = await Promise.all([
                getExecutionRun(currentRunId),
                getExecutionLogs(currentRunId),
            ]);
            if (!requestSequenceRef.current.isCurrent(token)) {
                return undefined;
            }
            setLogs((previous) => mergeExecutionLogEntries(previous, logsResponse.data || []));
            return runResponse.data;
        } catch {
            if (!requestSequenceRef.current.isCurrent(token)) {
                return undefined;
            }
            return undefined;
        }
    }, []);

    const startStream = useCallback((currentRunId: string, token: number) => {
        if (streamingRef.current && currentStreamRunIdRef.current === currentRunId) {
            return;
        }

        closeCurrentStream();
        streamingRef.current = true;
        currentStreamRunIdRef.current = currentRunId;
        setStreaming(true);

        closeStreamRef.current = createLogStream(
            currentRunId,
            (log) => {
                if (!requestSequenceRef.current.isCurrent(token)) {
                    return;
                }
                setLogs((previous) => mergeLogEntries(previous, [toLogEntry(log)]));
            },
            () => {
                if (!requestSequenceRef.current.isCurrent(token)) {
                    return;
                }
                markStreamClosed();
                void refreshSnapshot(currentRunId, token);
            },
            () => {
                if (!requestSequenceRef.current.isCurrent(token)) {
                    return;
                }
                markStreamClosed();
                void refreshSnapshot(currentRunId, token).then((runData) => {
                    if (!requestSequenceRef.current.isCurrent(token)) {
                        return;
                    }
                    if (shouldKeepLiveStream(runData)) {
                        startStream(currentRunId, token);
                    }
                });
            },
        );
    }, [closeCurrentStream, markStreamClosed, refreshSnapshot]);

    const startPolling = useCallback((currentRunId: string, token: number) => {
        if (pollTimerRef.current !== null) {
            return;
        }

        pollTimerRef.current = window.setInterval(() => {
            void refreshSnapshot(currentRunId, token).then((runData) => {
                if (!requestSequenceRef.current.isCurrent(token)) {
                    return;
                }
                const shouldStream = shouldKeepLiveStream(runData);
                if (shouldStream && !streamingRef.current) {
                    startStream(currentRunId, token);
                }
                if (!shouldStream) {
                    closePolling();
                    if (currentStreamRunIdRef.current === currentRunId) {
                        closeCurrentStream();
                    }
                }
            });
        }, LOG_REFRESH_INTERVAL_MS);
    }, [closeCurrentStream, closePolling, refreshSnapshot, startStream]);

    useEffect(() => {
        if (!runId) {
            requestSequenceRef.current.invalidate();
            closeCurrentStream();
            closePolling();
            setLogs([]);
            setLoading(false);
            return undefined;
        }

        const token = requestSequenceRef.current.next();
        setLogs([]);
        setLoading(true);

        void (async () => {
            try {
                const runResponse = await getExecutionRun(runId);
                if (!requestSequenceRef.current.isCurrent(token)) {
                    return;
                }

                if (shouldKeepLiveStream(runResponse.data)) {
                    startStream(runId, token);
                    startPolling(runId, token);
                } else if (currentStreamRunIdRef.current === runId) {
                    closeCurrentStream();
                    closePolling();
                }

                const logsResponse = await getExecutionLogs(runId);
                if (!requestSequenceRef.current.isCurrent(token)) {
                    return;
                }
                setLogs((previous) => mergeExecutionLogEntries(previous, logsResponse.data || []));
            } finally {
                if (requestSequenceRef.current.isCurrent(token)) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            requestSequenceRef.current.invalidate();
            closeCurrentStream();
            closePolling();
        };
    }, [closeCurrentStream, closePolling, runId, startPolling, startStream]);

    return {
        loading,
        logs,
        streaming,
    };
}

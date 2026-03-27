import { createInstanceEventStream } from '@/services/auto-healing/sse';
import type { LogEntry } from '@/components/execution/LogConsole';
import { message } from 'antd';
import { useEffect, useState } from 'react';
import type { SelectedNodeDataLike } from './nodeDetailTypes';

type UseInstanceDetailStreamOptions = {
    id?: string;
    instanceStatus: string;
    refresh: () => Promise<unknown>;
    selectedNodeDataRef: React.MutableRefObject<SelectedNodeDataLike | null>;
    setInstanceStatus: React.Dispatch<React.SetStateAction<string>>;
    setSelectedNodeData: React.Dispatch<React.SetStateAction<SelectedNodeDataLike | null>>;
    updateNodeStatus: (nodeId: string, status: string, errorMessage?: string, description?: string) => void;
};

const buildNodeLogEntry = (data: { details?: unknown; level: string; message: string; node_id: string }): LogEntry => ({
    id: `${Date.now()}-${Math.random()}`,
    sequence: Date.now(),
    log_level: data.level,
    message: data.message,
    created_at: new Date().toISOString(),
    details: normalizeLogDetails(data.details),
});

const normalizeLogDetails = (details: unknown): LogEntry['details'] | undefined => {
    if (!details || typeof details !== 'object' || Array.isArray(details)) {
        return undefined;
    }

    const detailRecord = details as Record<string, unknown>;
    return {
        ...detailRecord,
        stdout: typeof detailRecord.stdout === 'string' ? detailRecord.stdout : undefined,
        stderr: typeof detailRecord.stderr === 'string' ? detailRecord.stderr : undefined,
    } as LogEntry['details'];
};

export const useInstanceDetailStream = ({
    id,
    instanceStatus,
    refresh,
    selectedNodeDataRef,
    setInstanceStatus,
    setSelectedNodeData,
    updateNodeStatus,
}: UseInstanceDetailStreamOptions) => {
    const [nodeLogs, setNodeLogs] = useState<Record<string, LogEntry[]>>({});

    useEffect(() => {
        if (!id || !instanceStatus) return;
        if (['completed', 'failed', 'cancelled'].includes(instanceStatus)) return;

        const eventSource = createInstanceEventStream(id, {
            onFlowStart: () => {
                setInstanceStatus('running');
            },
            onNodeStart: (data) => {
                updateNodeStatus(data.node_id, 'running');
            },
            onNodeLog: (data) => {
                const entry = buildNodeLogEntry(data);
                setNodeLogs((previous) => ({
                    ...previous,
                    [data.node_id]: [...(previous[data.node_id] || []), entry],
                }));
                if (selectedNodeDataRef.current?.id === data.node_id) {
                    setSelectedNodeData((previous) => previous?.id === data.node_id ? ({
                        ...previous,
                        logs: [...(previous.logs || []), entry],
                    }) : previous);
                }
            },
            onNodeComplete: (data) => {
                updateNodeStatus(data.node_id, data.status, undefined, data.message);
                if (selectedNodeDataRef.current?.id === data.node_id) {
                    setSelectedNodeData((previous) => previous ? ({
                        ...previous,
                        status: data.status,
                        state: {
                            ...previous.state,
                            status: data.status,
                            description: data.message,
                            input: data.input,
                            output: data.output,
                        },
                    }) : previous);
                }
            },
            onFlowComplete: (data) => {
                const finalStatus = data.status || (data.success ? 'completed' : 'failed');
                setInstanceStatus(finalStatus);
                const completedWithIssues = finalStatus === 'completed' && data.success === false;
                if (finalStatus === 'completed' && !completedWithIssues) message.success(data.message || '流程执行完成');
                else if (completedWithIssues) message.warning(data.message || '流程已完成，但存在异常节点');
                else if (finalStatus === 'cancelled') message.info(data.message || '流程已取消');
                else message.error(data.message || '流程执行失败');
                void refresh();
            },
            onError: (error) => {
                console.error('SSE Error:', error);
            },
        });

        return () => {
            eventSource.close();
        };
    }, [id, instanceStatus, refresh, selectedNodeDataRef, setInstanceStatus, setSelectedNodeData, updateNodeStatus]);

    return nodeLogs;
};

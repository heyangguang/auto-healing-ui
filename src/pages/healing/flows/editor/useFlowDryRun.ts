import { useCallback, useMemo } from 'react';
import { message } from 'antd';
import type { Dispatch, SetStateAction } from 'react';
import type { FlowEditorEdge, FlowEditorLogEntry, FlowEditorNode, DryRunNodeResult } from './flowEditorTypes';

type UseFlowDryRunOptions = {
    nodes: FlowEditorNode[];
    setDryRunOpen: Dispatch<SetStateAction<boolean>>;
    setEdges: Dispatch<SetStateAction<FlowEditorEdge[]>>;
    setNodes: Dispatch<SetStateAction<FlowEditorNode[]>>;
};

function resetNodeState(node: FlowEditorNode, includeLogs: boolean) {
    return {
        ...node,
        data: {
            ...node.data,
            dryRunInput: undefined,
            dryRunMessage: undefined,
            dryRunOutput: undefined,
            dryRunProcess: undefined,
            logs: includeLogs ? [] : node.data.logs,
            status: undefined,
        },
    };
}

function getEdgeStyle(status: string) {
    if (status === 'running') return { animated: true, style: { stroke: '#1890ff', strokeWidth: 2 } };
    if (status === 'error' || status === 'failed') return { animated: false, style: { stroke: '#ff4d4f', strokeWidth: 2 } };
    if (status === 'skipped') return { animated: false, style: { stroke: '#bfbfbf', strokeWidth: 1 } };
    return { animated: false, style: { stroke: '#52c41a', strokeWidth: 2 } };
}

export function useFlowDryRun({
    nodes,
    setDryRunOpen,
    setEdges,
    setNodes,
}: UseFlowDryRunOptions) {
    const approvalNodes = useMemo(
        () => nodes
            .filter((node) => node.data?.type === 'approval')
            .map((node) => ({ id: node.id, label: String(node.data?.label || '审批节点') })),
        [nodes],
    );

    const handleResetState = useCallback(() => {
        setNodes((currentNodes) => currentNodes.map((node) => resetNodeState(node, true)));
        setEdges((currentEdges) => currentEdges.map((edge) => ({ ...edge, animated: false, style: { stroke: '#b1b1b7' } })));
        message.success('状态已重置');
    }, [setEdges, setNodes]);

    const handleStartRun = useCallback(() => {
        setDryRunOpen(false);
        setNodes((currentNodes) => currentNodes.map((node) => resetNodeState(node, true)));
        setEdges((currentEdges) => currentEdges.map((edge) => ({ ...edge, animated: false, style: { stroke: '#b1b1b7' } })));
    }, [setDryRunOpen, setEdges, setNodes]);

    const handleNodeLog = useCallback((nodeId: string, level: string, logMessage: string, details?: unknown) => {
        setNodes((currentNodes) => currentNodes.map((node) => {
            if (node.id !== nodeId) return node;
            const nextLog: FlowEditorLogEntry = {
                details,
                level,
                message: logMessage,
                timestamp: new Date().toISOString(),
            };
            const logs = [...(node.data.logs || []), nextLog];
            return { ...node, data: { ...node.data, logs } };
        }));
    }, [setNodes]);

    const handleNodeResult = useCallback((result: DryRunNodeResult) => {
        const { node_id: nodeId, output_handle: outputHandle, ...rest } = result;
        setNodes((currentNodes) => currentNodes.map((node) => (
            node.id === nodeId
                ? { ...node, data: { ...node.data, dryRunInput: rest.input, dryRunMessage: rest.message, dryRunOutput: rest.output, dryRunProcess: rest.process, status: rest.status } }
                : node
        )));
        setEdges((currentEdges) => currentEdges.map((edge) => {
            if (edge.target === nodeId) return { ...edge, ...getEdgeStyle(rest.status) };
            if (outputHandle && edge.source === nodeId && edge.sourceHandle === outputHandle) {
                return { ...edge, ...getEdgeStyle(rest.status) };
            }
            return edge;
        }));
    }, [setEdges, setNodes]);

    const handleRunComplete = useCallback((success: boolean, runMessage: string) => {
        message.open({
            content: runMessage,
            duration: 3,
            type: success ? 'success' : 'error',
        });
    }, []);

    return {
        approvalNodes,
        handleNodeLog,
        handleNodeResult,
        handleResetState,
        handleRunComplete,
        handleStartRun,
    };
}

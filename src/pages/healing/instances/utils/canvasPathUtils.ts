type NodeStatusMap = Record<string, string | undefined>;
type OutgoingEdgesMap = Record<string, AutoHealing.FlowEdge[]>;

const DEFAULT_HANDLE_ID = 'default';

export function isBranchHandle(handle: string | null | undefined): handle is string {
    return Boolean(handle && handle !== DEFAULT_HANDLE_ID);
}

export function getActiveBranchHandle(
    nodeType: string,
    nodeStatus: string | undefined,
): string | null {
    if (!nodeStatus) return null;
    switch (nodeType) {
        case 'approval':
            if (['approved', 'completed', 'success', 'simulated'].includes(nodeStatus)) return 'approved';
            if (nodeStatus === 'rejected') return 'rejected';
            return null;
        case 'execution':
            if (['completed', 'success'].includes(nodeStatus)) return 'success';
            if (nodeStatus === 'partial') return 'partial';
            if (nodeStatus === 'failed') return 'failed';
            return null;
        case 'condition':
            if (['completed', 'success', 'true'].includes(nodeStatus)) return 'true';
            if (['failed', 'false'].includes(nodeStatus)) return 'false';
            return null;
        default:
            return null;
    }
}

export function buildOutgoingEdges(flowEdges: AutoHealing.FlowEdge[]) {
    const outgoingEdges: OutgoingEdgesMap = {};
    for (const edge of flowEdges) {
        if (!outgoingEdges[edge.source]) outgoingEdges[edge.source] = [];
        outgoingEdges[edge.source].push(edge);
    }
    return outgoingEdges;
}

export function collectCandidateNodeIds(
    flowEdges: AutoHealing.FlowEdge[],
    nodeStates: Record<string, unknown>,
    currentNodeId: string | null,
) {
    const reverseAdj: Record<string, string[]> = {};
    for (const edge of flowEdges) {
        if (!reverseAdj[edge.target]) reverseAdj[edge.target] = [];
        reverseAdj[edge.target].push(edge.source);
    }
    const queue = [...Object.keys(nodeStates)];
    if (currentNodeId) queue.push(currentNodeId);
    const candidateNodeIds = new Set(queue);
    while (queue.length > 0) {
        const nodeId = queue.shift();
        if (!nodeId) continue;
        for (const parent of reverseAdj[nodeId] || []) {
            if (candidateNodeIds.has(parent)) continue;
            candidateNodeIds.add(parent);
            queue.push(parent);
        }
    }
    return candidateNodeIds;
}

export function isEdgeOnActiveBranch(
    edge: AutoHealing.FlowEdge,
    nodeTypeMap: Record<string, string>,
    nodeStatusMap: NodeStatusMap,
) {
    if (!isBranchHandle(edge.sourceHandle)) return true;
    const activeHandle = getActiveBranchHandle(nodeTypeMap[edge.source] || '', nodeStatusMap[edge.source]);
    return activeHandle === edge.sourceHandle;
}

export function collectExecutedNodeIds(
    flowNodes: AutoHealing.FlowNode[],
    outgoingEdges: OutgoingEdgesMap,
    candidateNodeIds: Set<string>,
    nodeTypeMap: Record<string, string>,
    nodeStatusMap: NodeStatusMap,
) {
    const incomingCounts = Object.fromEntries(flowNodes.map((node) => [node.id, 0]));
    for (const edges of Object.values(outgoingEdges)) {
        for (const edge of edges) incomingCounts[edge.target] = (incomingCounts[edge.target] || 0) + 1;
    }
    const queue = flowNodes
        .filter((node) => candidateNodeIds.has(node.id) && (incomingCounts[node.id] || 0) === 0)
        .map((node) => node.id);
    const executedNodeIds = new Set<string>();

    while (queue.length > 0) {
        const nodeId = queue.shift();
        if (!nodeId || executedNodeIds.has(nodeId)) continue;
        executedNodeIds.add(nodeId);
        for (const edge of outgoingEdges[nodeId] || []) {
            if (!candidateNodeIds.has(edge.target)) continue;
            if (!isEdgeOnActiveBranch(edge, nodeTypeMap, nodeStatusMap)) continue;
            queue.push(edge.target);
        }
    }
    return executedNodeIds;
}

export function getInactiveBranchColor(handle: string | null | undefined) {
    if (handle === 'rejected' || handle === 'failed' || handle === 'false') return '#ff4d4f';
    if (handle === 'partial') return '#faad14';
    return '#52c41a';
}

export type { NodeStatusMap, OutgoingEdgesMap };

import type { Node, Edge } from 'reactflow';
import { NODE_TYPE_LABELS } from '../../nodeConfig';
export { NODE_TYPE_LABELS };

// ==================== 共享配置 ====================

/** 边颜色映射 — 根据目标节点状态决定流线颜色 */
export const STATUS_EDGE_COLOR: Record<string, string> = {
    success: '#52c41a', completed: '#52c41a', approved: '#52c41a',
    ok: '#52c41a', triggered: '#722ed1', simulated: '#13c2c2',
    running: '#1890ff', pending: '#d9d9d9',
    waiting_approval: '#fa8c16',
    failed: '#ff4d4f', error: '#ff4d4f', rejected: '#ff4d4f',
    partial: '#faad14',
};

/**
 * 标准化 node_state 到对象格式
 * 后端可能返回 string（只包含 status）或 object
 */
export function normalizeNodeState(raw: any): { status: string; error_message?: string; message?: string; description?: string;[key: string]: any } | null {
    if (!raw) return null;
    if (typeof raw === 'string') return { status: raw };
    return raw;
}

/**
 * 根据节点类型和状态，返回实际走过的 sourceHandle 名称
 * 用于分支感知的边高亮
 */
export function getActiveBranchHandle(
    nodeType: string,
    nodeStatus: string | undefined,
): string | null {
    if (!nodeStatus) return null;
    switch (nodeType) {
        case 'approval':
            if (['approved', 'completed', 'success', 'simulated'].includes(nodeStatus)) return 'approved';
            if (['rejected'].includes(nodeStatus)) return 'rejected';
            return null;
        case 'execution':
            if (['completed', 'success'].includes(nodeStatus)) return 'success';
            if (['partial'].includes(nodeStatus)) return 'partial';
            if (['failed'].includes(nodeStatus)) return 'failed';
            return null;
        case 'condition':
            if (['completed', 'success', 'true'].includes(nodeStatus)) return 'true';
            if (['failed', 'false'].includes(nodeStatus)) return 'false';
            return null;
        default:
            return null;
    }
}

// ==================== 核心画布构建逻辑 ====================

interface CanvasBuildInput {
    flowNodes: any[];
    flowEdges: any[];
    nodeStates: Record<string, any>;
    currentNodeId: string | null;
    rule?: any;     // 可选的自愈规则（用于注入虚拟触发节点）
}

interface CanvasBuildResult {
    nodes: Node[];
    edges: Edge[];
}

/**
 * 统一画布构建函数 — 列表页和详情页共用
 *
 * 逻辑：
 * 1. 从 currentNodeId + nodeStates 中有记录的节点出发，反向 BFS 推算已执行路径
 * 2. 节点状态：优先使用后端 nodeStates 真实状态（保留 rejected/failed），
 *    无后端记录时用 wasPassedThrough 推断为 success
 * 3. 边着色：分支感知 — 只高亮实际走过的分支，未走分支半透明虚线
 * 4. 可选注入虚拟规则触发节点
 * 5. 计算每个节点的活跃连接点（用于 Handle 高亮）
 */
export function buildCanvasElements(input: CanvasBuildInput): CanvasBuildResult {
    const { flowNodes, flowEdges, nodeStates, currentNodeId, rule } = input;

    // ====== Step 1: 反向 BFS 推算已执行路径 ======
    const reverseAdj: Record<string, string[]> = {};
    for (const edge of flowEdges) {
        if (!reverseAdj[edge.target]) reverseAdj[edge.target] = [];
        reverseAdj[edge.target].push(edge.source);
    }

    const executedNodeIds = new Set<string>();
    // 从 currentNodeId 反向 BFS
    if (currentNodeId) {
        const queue = [currentNodeId];
        executedNodeIds.add(currentNodeId);
        while (queue.length > 0) {
            const nodeId = queue.shift()!;
            for (const parent of (reverseAdj[nodeId] || [])) {
                if (!executedNodeIds.has(parent)) {
                    executedNodeIds.add(parent);
                    queue.push(parent);
                }
            }
        }
    }
    // 有明确 nodeStates 记录的节点也算已执行
    Object.keys(nodeStates).forEach(id => executedNodeIds.add(id));

    // 正向邻接表（判断节点是否被"穿过"）
    const forwardAdj: Record<string, string[]> = {};
    for (const edge of flowEdges) {
        if (!forwardAdj[edge.source]) forwardAdj[edge.source] = [];
        forwardAdj[edge.source].push(edge.target);
    }

    // ====== Step 2: 节点映射 ======
    const nodeTypeMap: Record<string, string> = {};
    const nodeEffectiveStatus: Record<string, string | undefined> = {};

    let resultNodes: Node[] = flowNodes.map((node: any) => {
        const nodeState = normalizeNodeState(nodeStates[node.id]);
        nodeTypeMap[node.id] = node.type;

        // 判断是否"已穿过"：在已执行路径上 + 有下游节点也已执行
        const wasPassedThrough = executedNodeIds.has(node.id)
            && (forwardAdj[node.id] || []).some(child => executedNodeIds.has(child));

        // 优先使用后端真实状态（保留 rejected/failed），
        // 只有无后端状态时才用 wasPassedThrough 推断为 success
        const nodeStatus = nodeState?.status
            || (wasPassedThrough ? 'success' : undefined);

        nodeEffectiveStatus[node.id] = nodeState?.status || (wasPassedThrough ? 'success' : undefined);

        return {
            ...node,
            draggable: false,
            connectable: false,
            selectable: true,
            data: {
                ...node.config,
                label: node.name || node.config?.label || NODE_TYPE_LABELS[node.type] || node.type,
                type: node.type,
                status: nodeStatus,
                dryRunMessage: nodeState?.error_message || nodeState?.message || nodeState?.description,
                _nodeState: nodeState,
                isCurrent: node.id === currentNodeId,
            },
        } as Node;
    });

    // ====== Step 3: 边着色 — 分支感知 ======
    let resultEdges: Edge[] = flowEdges.map((edge: any) => {
        const bothExecuted = executedNodeIds.has(edge.source) && executedNodeIds.has(edge.target);

        // 有 sourceHandle 的边需检查是否走的就是这条分支
        let isActiveBranch = true;
        if (edge.sourceHandle) {
            const srcType = nodeTypeMap[edge.source] || '';
            const srcStatus = nodeEffectiveStatus[edge.source];
            const activeHandle = getActiveBranchHandle(srcType, srcStatus);
            isActiveBranch = activeHandle === edge.sourceHandle;
        }

        const isExecutedEdge = bothExecuted && isActiveBranch;
        // 未走过的分支边：使用对应分支颜色但半透明
        const inactiveBranchColor = edge.sourceHandle
            ? (edge.sourceHandle === 'rejected' || edge.sourceHandle === 'failed' || edge.sourceHandle === 'false'
                ? '#ff4d4f' : edge.sourceHandle === 'partial' ? '#faad14' : '#52c41a')
            : '#d9d9d9';

        return {
            ...edge,
            animated: isExecutedEdge,
            style: {
                stroke: isExecutedEdge
                    ? (STATUS_EDGE_COLOR[nodeEffectiveStatus[edge.target] || ''] || '#52c41a')
                    : (edge.sourceHandle && bothExecuted ? inactiveBranchColor : '#d9d9d9'),
                strokeWidth: isExecutedEdge ? 2.5 : 1,
                opacity: isExecutedEdge ? 1 : (edge.sourceHandle && bothExecuted ? 0.2 : 0.35),
                strokeDasharray: (!isExecutedEdge && edge.sourceHandle && bothExecuted) ? '5 3' : undefined,
            },
        };
    }) as Edge[];

    // ====== Step 4: 注入虚拟规则触发节点 ======
    if (rule) {
        const ruleNodeId = 'virtual-rule-trigger';
        const startNode = resultNodes.find((n: any) => n.type === 'start') || resultNodes[0];

        const ruleNode: Node = {
            id: ruleNodeId,
            type: 'custom',
            position: {
                x: startNode?.position?.x ?? 0,
                y: (startNode?.position?.y ?? 0) - 100,
            },
            data: {
                label: `自愈规则: ${rule.name}`,
                type: 'trigger',
                status: 'triggered',
                details: rule,
            },
            draggable: false,
            connectable: false,
        };

        resultNodes = [ruleNode, ...resultNodes];

        if (startNode) {
            resultEdges = [{
                id: `edge-${ruleNodeId}-${startNode.id}`,
                source: ruleNodeId,
                target: startNode.id,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#722ed1', strokeWidth: 2 },
            }, ...resultEdges];
        }
    }

    // ====== Step 5: 计算活跃连接点 ======
    const activeHandlesMap: Record<string, string[]> = {};
    for (const edge of resultEdges) {
        if (edge.animated) {
            const srcH = (edge as any).sourceHandle || 'default';
            if (!activeHandlesMap[edge.source]) activeHandlesMap[edge.source] = [];
            activeHandlesMap[edge.source].push(srcH);
            if (!activeHandlesMap[edge.target]) activeHandlesMap[edge.target] = [];
            activeHandlesMap[edge.target].push('target');
        }
    }
    resultNodes = resultNodes.map((node: any) => ({
        ...node,
        data: { ...node.data, activeHandles: activeHandlesMap[node.id] || [] },
    }));

    return { nodes: resultNodes, edges: resultEdges };
}

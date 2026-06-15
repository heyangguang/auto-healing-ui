import type { Edge, Node } from 'reactflow';
import { normalizeExecutionTaskTemplateFields } from '@/pages/healing/executionTaskTemplateMeta';
import { NODE_TYPE_LABELS } from '../../nodeConfig';
import {
  buildOutgoingEdges,
  collectCandidateNodeIds,
  collectExecutedNodeIds,
  getInactiveBranchColor,
  isBranchHandle,
  isEdgeOnActiveBranch,
  type NodeStatusMap,
  type OutgoingEdgesMap,
} from './canvasPathUtils';

export { NODE_TYPE_LABELS };

// ==================== 共享配置 ====================

/** 边颜色映射 — 根据目标节点状态决定流线颜色 */
export const STATUS_EDGE_COLOR: Record<string, string> = {
  success: '#52c41a',
  completed: '#52c41a',
  approved: '#52c41a',
  ok: '#52c41a',
  triggered: '#722ed1',
  simulated: '#13c2c2',
  running: '#1890ff',
  pending: '#d9d9d9',
  waiting_approval: '#fa8c16',
  failed: '#ff4d4f',
  error: '#ff4d4f',
  rejected: '#ff4d4f',
  partial: '#faad14',
};

/**
 * 标准化 node_state 到对象格式
 * 后端可能返回 string（只包含 status）或 object
 */
type FlowNodeStateLike = Omit<AutoHealing.FlowNodeState, 'status'> & {
  duration_ms?: number;
  error?: string;
  error_message?: string;
  finished_at?: string;
  message?: string;
  started_at?: string;
  status?: string;
  task_id?: string;
  timeout_at?: string;
  title?: string;
};

type CanvasNodeData = AutoHealing.FlowNodeConfig & {
  _nodeState?: FlowNodeStateLike | null;
  activeHandles?: string[];
  details?: AutoHealing.HealingRule;
  dryRunMessage?: string;
  isCurrent?: boolean;
  label?: string;
  status?: string;
  type?: string;
};

type CanvasNode = Node<CanvasNodeData>;
type CanvasEdge = Edge;
const DEFAULT_HANDLE_ID = 'default';
type FlowEdgeLike = AutoHealing.FlowEdge & {
  source?: string;
  target?: string;
};

function getCanvasEdgeId(edge: FlowEdgeLike) {
  return (
    edge.id ||
    `edge-${edge.source}-${edge.target}-${edge.sourceHandle || DEFAULT_HANDLE_ID}-${edge.targetHandle || DEFAULT_HANDLE_ID}`
  );
}

function normalizeFlowEdge(edge: FlowEdgeLike): AutoHealing.FlowEdge | null {
  const source = edge.source;
  const target = edge.target;
  if (!source || !target) return null;

  return {
    ...edge,
    id: getCanvasEdgeId(edge),
    source,
    target,
    sourceHandle: edge.sourceHandle || undefined,
    targetHandle: edge.targetHandle || undefined,
  };
}

function normalizeFlowEdges(flowEdges: AutoHealing.FlowEdge[]) {
  return flowEdges
    .map((edge) => normalizeFlowEdge(edge as FlowEdgeLike))
    .filter((edge): edge is AutoHealing.FlowEdge => Boolean(edge));
}

export function normalizeNodeState(raw: unknown): FlowNodeStateLike | null {
  if (!raw) return null;
  if (typeof raw === 'string') return { status: raw };
  if (typeof raw === 'object') return raw as FlowNodeStateLike;
  return null;
}

function buildNodeMaps(
  flowNodes: AutoHealing.FlowNode[],
  nodeStates: Record<string, unknown>,
) {
  const nodeTypeMap: Record<string, string> = {};
  const nodeRawStatus: NodeStatusMap = {};
  for (const node of flowNodes) {
    nodeTypeMap[node.id] = node.type;
    nodeRawStatus[node.id] = normalizeNodeState(nodeStates[node.id])?.status;
  }
  return { nodeTypeMap, nodeRawStatus };
}

function buildCanvasNodes(
  flowNodes: AutoHealing.FlowNode[],
  nodeStates: Record<string, unknown>,
  currentNodeId: string | null,
  executedNodeIds: Set<string>,
  outgoingEdges: OutgoingEdgesMap,
) {
  const nodeEffectiveStatus: NodeStatusMap = {};
  const nodes: CanvasNode[] = flowNodes.map((node) => {
    const nodeState = normalizeNodeState(nodeStates[node.id]);
    const wasPassedThrough =
      executedNodeIds.has(node.id) &&
      (outgoingEdges[node.id] || []).some((edge) =>
        executedNodeIds.has(edge.target),
      );
    const nodeStatus =
      nodeState?.status || (wasPassedThrough ? 'success' : undefined);

    nodeEffectiveStatus[node.id] = nodeStatus;
    return {
      ...node,
      draggable: false,
      connectable: false,
      selectable: true,
      data: {
        ...(node.type === 'execution'
          ? normalizeExecutionTaskTemplateFields(node.config || {})
          : node.config),
        label:
          node.name ||
          String(
            node.config?.label || NODE_TYPE_LABELS[node.type] || node.type,
          ),
        type: node.type,
        status: nodeStatus,
        dryRunMessage:
          nodeState?.error_message ||
          nodeState?.message ||
          nodeState?.description,
        _nodeState: nodeState,
        isCurrent: node.id === currentNodeId,
      },
    };
  });
  return { nodeEffectiveStatus, nodes };
}

function buildCanvasEdges(
  flowEdges: AutoHealing.FlowEdge[],
  executedNodeIds: Set<string>,
  nodeTypeMap: Record<string, string>,
  nodeEffectiveStatus: NodeStatusMap,
) {
  return flowEdges.map((edge) => {
    const sourceExecuted = executedNodeIds.has(edge.source);
    const targetExecuted = executedNodeIds.has(edge.target);
    const isActiveBranch = isEdgeOnActiveBranch(
      edge,
      nodeTypeMap,
      nodeEffectiveStatus,
    );
    const isExecutedEdge = sourceExecuted && targetExecuted && isActiveBranch;
    const isInactiveBranchEdge =
      isBranchHandle(edge.sourceHandle) && sourceExecuted && !isActiveBranch;

    return {
      id: getCanvasEdgeId(edge),
      ...edge,
      animated: isExecutedEdge,
      style: {
        stroke: isExecutedEdge
          ? STATUS_EDGE_COLOR[nodeEffectiveStatus[edge.target] || ''] ||
            '#52c41a'
          : isInactiveBranchEdge
            ? getInactiveBranchColor(edge.sourceHandle)
            : '#d9d9d9',
        strokeWidth: isExecutedEdge ? 2.5 : 1,
        opacity: isExecutedEdge ? 1 : isInactiveBranchEdge ? 0.2 : 0.35,
        strokeDasharray: isInactiveBranchEdge ? '5 3' : undefined,
      },
    };
  });
}

function injectRuleTrigger(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  rule?: AutoHealing.HealingRule,
) {
  if (!rule) return { edges, nodes };

  const ruleNodeId = 'virtual-rule-trigger';
  const startNode = nodes.find((node) => node.type === 'start') || nodes[0];
  const ruleNode: CanvasNode = {
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
  if (!startNode) return { edges, nodes: [ruleNode, ...nodes] };

  return {
    nodes: [ruleNode, ...nodes],
    edges: [
      {
        id: `edge-${ruleNodeId}-${startNode.id}`,
        source: ruleNodeId,
        target: startNode.id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#722ed1', strokeWidth: 2 },
      },
      ...edges,
    ],
  };
}

function attachActiveHandles(nodes: CanvasNode[], edges: CanvasEdge[]) {
  const activeHandlesMap: Record<string, string[]> = {};
  for (const edge of edges) {
    if (!edge.animated) continue;
    const sourceHandle = edge.sourceHandle || DEFAULT_HANDLE_ID;
    if (!activeHandlesMap[edge.source]) activeHandlesMap[edge.source] = [];
    activeHandlesMap[edge.source].push(sourceHandle);
    if (!activeHandlesMap[edge.target]) activeHandlesMap[edge.target] = [];
    activeHandlesMap[edge.target].push('target');
  }
  return nodes.map((node) => ({
    ...node,
    data: { ...node.data, activeHandles: activeHandlesMap[node.id] || [] },
  }));
}

// ==================== 核心画布构建逻辑 ====================

interface CanvasBuildInput {
  flowNodes: AutoHealing.FlowNode[];
  flowEdges: AutoHealing.FlowEdge[];
  nodeStates: Record<string, unknown>;
  currentNodeId: string | null;
  rule?: AutoHealing.HealingRule;
}

interface CanvasBuildResult {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

/**
 * 统一画布构建函数 — 列表页和详情页共用
 *
 * 逻辑：
 * 1. 先从 currentNodeId + nodeStates 反向回溯候选节点，再从起点按真实分支正向筛出实际执行路径
 * 2. 节点状态优先使用后端真实状态，无后端记录时仅对真正穿过的节点推断为 success
 * 3. 边着色只高亮真实走过的分支，未走分支保留半透明虚线提示
 * 4. 可选注入虚拟规则触发节点
 * 5. 计算每个节点的活跃连接点（用于 Handle 高亮）
 */
export function buildCanvasElements(
  input: CanvasBuildInput,
): CanvasBuildResult {
  const { flowNodes, flowEdges, nodeStates, currentNodeId, rule } = input;
  const normalizedFlowEdges = normalizeFlowEdges(flowEdges);
  const { nodeTypeMap, nodeRawStatus } = buildNodeMaps(flowNodes, nodeStates);
  const outgoingEdges = buildOutgoingEdges(normalizedFlowEdges);
  const candidateNodeIds = collectCandidateNodeIds(
    normalizedFlowEdges,
    nodeStates,
    currentNodeId,
  );
  const executedNodeIds = collectExecutedNodeIds(
    flowNodes,
    outgoingEdges,
    candidateNodeIds,
    nodeTypeMap,
    nodeRawStatus,
  );
  const { nodeEffectiveStatus, nodes } = buildCanvasNodes(
    flowNodes,
    nodeStates,
    currentNodeId,
    executedNodeIds,
    outgoingEdges,
  );
  const edges = buildCanvasEdges(
    normalizedFlowEdges,
    executedNodeIds,
    nodeTypeMap,
    nodeEffectiveStatus,
  );
  const withRuleTrigger = injectRuleTrigger(nodes, edges, rule);
  return {
    nodes: attachActiveHandles(withRuleTrigger.nodes, withRuleTrigger.edges),
    edges: withRuleTrigger.edges,
  };
}

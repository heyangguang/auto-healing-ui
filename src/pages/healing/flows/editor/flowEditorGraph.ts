import dagre from 'dagre';
import type { Connection, XYPosition } from 'reactflow';
import { MarkerType } from 'reactflow';
import {
    createNodeId,
    DEFAULT_END_NODE_ID,
    DEFAULT_FLOW_NAME,
    DEFAULT_START_NODE_ID,
    getReactFlowNodeType,
} from './flowEditorConstants';
import type {
    ContextMenuState,
    FlowEditorEdge,
    FlowEditorNode,
} from './flowEditorTypes';

type FlowGraphState = {
    edges: FlowEditorEdge[];
    flowIsActive: boolean;
    flowName: string;
    nodes: FlowEditorNode[];
};

const LAYOUT_NODE_WIDTH = 200;
const LAYOUT_NODE_HEIGHT = 80;
const LAYOUT_PADDING_X = 50;
const LAYOUT_PADDING_Y = 30;

export function createDefaultFlowGraph(onRetry: () => void): FlowGraphState {
    return {
        edges: [],
        flowIsActive: true,
        flowName: DEFAULT_FLOW_NAME,
        nodes: [
            {
                id: DEFAULT_START_NODE_ID,
                type: 'start',
                data: { label: '开始', onRetry, type: 'start' },
                position: { x: 200, y: 50 },
            },
            {
                id: DEFAULT_END_NODE_ID,
                type: 'end',
                data: { label: '结束', onRetry, type: 'end' },
                position: { x: 200, y: 300 },
            },
        ],
    };
}

export function mapFlowResponseToGraph(
    flow: AutoHealing.HealingFlow,
    onRetry: () => void,
): FlowGraphState {
    return {
        edges: (flow.edges || []).map((edge, index) => ({
            id: edge.id || `e${index}`,
            label: edge.label,
            markerEnd: { type: MarkerType.ArrowClosed },
            source: edge.source || edge.from || '',
            sourceHandle: edge.sourceHandle,
            target: edge.target || edge.to || '',
            targetHandle: edge.targetHandle,
            type: 'smoothstep',
        })),
        flowIsActive: flow.is_active !== false,
        flowName: flow.name,
        nodes: (flow.nodes || []).map((node) => ({
            id: node.id,
            type: getReactFlowNodeType(node.type),
            position: node.position || { x: 100, y: 100 },
            data: {
                ...node.config,
                label: node.name || node.type,
                onRetry,
                type: node.type,
            },
        })),
    };
}

export function createConnectedEdge(params: Connection): FlowEditorEdge {
    return {
        id: `edge-${params.source || 'unknown'}-${params.target || 'unknown'}-${params.sourceHandle || 'default'}-${params.targetHandle || 'default'}`,
        ...params,
        markerEnd: { type: MarkerType.ArrowClosed },
        source: params.source || '',
        target: params.target || '',
        type: 'smoothstep',
    };
}

export function createDroppedNode(
    type: string,
    label: string,
    position: XYPosition,
    onRetry: () => void,
): FlowEditorNode {
    return {
        id: createNodeId(),
        type: getReactFlowNodeType(type),
        position,
        data: {
            label,
            onRetry,
            type,
        },
    };
}

export function buildContextMenuState(
    event: React.MouseEvent,
    wrapper: HTMLDivElement | null,
    itemId: string,
    type: 'node' | 'edge',
): ContextMenuState {
    const bounds = wrapper?.getBoundingClientRect();

    return {
        id: itemId,
        left: event.clientX - (bounds?.left || 0),
        top: event.clientY - (bounds?.top || 0),
        type,
    };
}

export function getNodeDeleteError(
    node: FlowEditorNode | undefined,
    nodes: FlowEditorNode[],
): string | null {
    if (node?.data?.type === 'start') {
        return '开始节点不能删除';
    }

    if (node?.data?.type !== 'end') {
        return null;
    }

    const endNodeCount = nodes.filter((item) => item.data?.type === 'end').length;
    return endNodeCount <= 1 ? '至少需要保留一个结束节点' : null;
}

export function applyAutoLayout(
    nodes: FlowEditorNode[],
    edges: FlowEditorEdge[],
): FlowEditorNode[] {
    const graph = new dagre.graphlib.Graph();
    graph.setDefaultEdgeLabel(() => ({}));
    graph.setGraph({
        edgesep: 20,
        marginx: 40,
        marginy: 40,
        nodesep: 60,
        rankdir: 'TB',
        ranksep: 80,
    });

    nodes.forEach((node) => {
        graph.setNode(node.id, { width: LAYOUT_NODE_WIDTH, height: LAYOUT_NODE_HEIGHT });
    });
    edges.forEach((edge) => {
        graph.setEdge(edge.source, edge.target);
    });
    dagre.layout(graph);

    return nodes.map((node) => {
        const position = graph.node(node.id);
        return {
            ...node,
            position: {
                x: position.x - LAYOUT_NODE_WIDTH / 2 + LAYOUT_PADDING_X,
                y: position.y - LAYOUT_NODE_HEIGHT / 2 + LAYOUT_PADDING_Y,
            },
        };
    });
}

import {
    useEdgesState,
    useNodesState,
} from 'reactflow';
import { getLayoutedElements } from '../utils/layoutUtils';
import { buildCanvasElements } from '../utils/canvasBuilder';

type InstanceGraphData = {
    current_node_id?: string;
    flow_edges?: AutoHealing.FlowEdge[];
    flow_nodes?: AutoHealing.FlowNode[];
    node_states?: Record<string, unknown>;
    rule?: AutoHealing.HealingRule;
};

export const useInstanceCanvasState = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const handleAutoLayout = () => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            nodes.map((node) => ({ ...node })),
            edges.map((edge) => ({ ...edge })),
            'TB',
            true,
        );
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
    };

    const updateNodeStatus = (
        nodeId: string,
        status: string,
        errorMessage?: string,
        description?: string,
    ) => {
        setNodes((currentNodes) => currentNodes.map((node) => (
            node.id === nodeId
                ? {
                    ...node,
                    data: {
                        ...node.data,
                        status,
                        dryRunMessage: errorMessage || description,
                    },
                }
                : node
        )));
    };

    const hydrateCanvasFromInstance = (data: InstanceGraphData) => {
        if (!data.flow_nodes || !data.flow_edges) {
            return;
        }
        const { nodes: builtNodes, edges: builtEdges } = buildCanvasElements({
            flowNodes: data.flow_nodes,
            flowEdges: data.flow_edges,
            nodeStates: data.node_states || {},
            currentNodeId: data.current_node_id ?? null,
            rule: data.rule,
        });
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            builtNodes,
            builtEdges,
        );
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
    };

    return {
        edges,
        handleAutoLayout,
        hydrateCanvasFromInstance,
        nodes,
        onEdgesChange,
        onNodesChange,
        updateNodeStatus,
    };
};

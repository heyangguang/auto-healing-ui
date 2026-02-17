import dagre from 'dagre';

/**
 * 使用 dagre 对节点和边进行自动布局
 *
 * @param nodes     ReactFlow 节点数组
 * @param edges     ReactFlow 边数组
 * @param direction 布局方向，'TB' 从上到下 / 'LR' 从左到右
 * @param forceLayout 是否强制重新布局所有节点（忽略已有位置）
 */
export const getLayoutedElements = (
    nodes: any[],
    edges: any[],
    direction = 'TB',
    forceLayout = false,
) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
        rankdir: direction,
        nodesep: 60,
        ranksep: 80,
        marginx: 20,
        marginy: 20,
    });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 180, height: 60 });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const isMissingPosition =
            !node.position || (node.position.x === 0 && node.position.y === 0);

        if (forceLayout || isMissingPosition) {
            node.position = {
                x: nodeWithPosition.x - 90,
                y: nodeWithPosition.y - 30,
            };
        }
        return node;
    });

    return { nodes: layoutedNodes, edges };
};

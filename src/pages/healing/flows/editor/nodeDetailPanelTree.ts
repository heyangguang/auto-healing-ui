import { NODE_TYPE_CONFIG as nodeTypeConfig } from '../../nodeConfig';
import type { FlatNodeTreeRow, NodeTreeItem } from './NodeDetailPanel.types';
import type { FlowEditorEdge, FlowEditorNode } from './flowEditorTypes';

type AdjacencyEntry = {
    targetId: string;
    handle?: string;
};

const WEAK_HANDLES = new Set([
    'bottom',
    'default',
    'false',
    'left',
    'right',
    'source',
    'target',
    'top',
    'true',
]);

const EXECUTION_BRANCH_LABELS: Record<string, string> = {
    bottom: '➔ 继续',
    default: '➔ 继续',
    failed: '✗ 失败',
    false: '✗ 失败',
    left: '➔ 继续',
    partial: '⚠ 部分',
    right: '➔ 继续',
    source: '➔ 继续',
    success: '✓ 成功',
    target: '➔ 继续',
    top: '➔ 继续',
    true: '✓ 成功',
};

export const NODE_TREE_INDENT_UNIT = 16;

const createAdjacencyMap = (allEdges: FlowEditorEdge[]) => {
    const adjacencyMap = new Map<string, AdjacencyEntry[]>();
    allEdges.forEach((edge) => {
        const sources = adjacencyMap.get(edge.source) || [];
        sources.push({ targetId: edge.target, handle: edge.sourceHandle || undefined });
        adjacencyMap.set(edge.source, sources);
    });
    return adjacencyMap;
};

const dedupeTargets = (targets: AdjacencyEntry[]) => {
    const uniqueTargets = new Map<string, string | undefined>();
    targets.forEach(({ targetId, handle }) => {
        const existingHandle = uniqueTargets.get(targetId);
        const shouldReplace = !uniqueTargets.has(targetId) || (WEAK_HANDLES.has(existingHandle || '') && !WEAK_HANDLES.has(handle || ''));
        if (shouldReplace) {
            uniqueTargets.set(targetId, handle);
        }
    });

    return Array.from(uniqueTargets.entries()).map(([targetId, handle]) => ({ targetId, handle }));
};

const resolveBranchLabel = (node: FlowEditorNode, handle?: string) => {
    const nodeType = node.data?.type;
    if (nodeType === 'condition') {
        return handle === 'true' ? '✓ 是' : handle === 'false' ? '✗ 否' : undefined;
    }
    if (nodeType === 'execution') {
        return handle ? EXECUTION_BRANCH_LABELS[handle] || handle : undefined;
    }
    if (nodeType === 'approval') {
        return handle === 'approved' ? '✓ 通过' : handle === 'rejected' ? '✗ 拒绝' : undefined;
    }
    return undefined;
};

const appendDisconnectedNodes = (allNodes: FlowEditorNode[], visited: Set<string>, tree: NodeTreeItem[]) => {
    allNodes.forEach((node) => {
        if (!visited.has(node.id)) {
            tree.push({ node, children: [], depth: 0 });
        }
    });
    return tree;
};

const createTreeBuilder = (
    allNodes: FlowEditorNode[],
    adjacencyMap: Map<string, AdjacencyEntry[]>,
    visited: Set<string>,
) => {
    const buildTree = (nodeId: string, depth: number, branchLabel?: string): NodeTreeItem | null => {
        if (visited.has(nodeId)) {
            return null;
        }

        const node = allNodes.find((item) => item.id === nodeId);
        if (!node) {
            return null;
        }

        visited.add(nodeId);
        const processedTargets = dedupeTargets(adjacencyMap.get(nodeId) || []);
        const childDepth = processedTargets.length > 1 ? depth + 1 : depth;
        const children = processedTargets
            .map(({ targetId, handle }) => buildTree(targetId, childDepth, processedTargets.length > 1 ? resolveBranchLabel(node, handle) : undefined))
            .filter(Boolean) as NodeTreeItem[];

        return { node, children, branchLabel, depth };
    };

    return buildTree;
};

export const buildNodeTree = (allNodes: FlowEditorNode[], allEdges: FlowEditorEdge[]) => {
    const startNode = allNodes.find((node) => node.data?.type === 'start');
    if (!startNode) {
        return allNodes.map((node) => ({ node, children: [], depth: 0 }));
    }

    const visited = new Set<string>();
    const adjacencyMap = createAdjacencyMap(allEdges);
    const buildTree = createTreeBuilder(allNodes, adjacencyMap, visited);
    const rootTree = buildTree(startNode.id, 0);
    const tree = rootTree ? [rootTree] : [];
    return appendDisconnectedNodes(allNodes, visited, tree);
};

const flattenNodeTreeRows = (items: NodeTreeItem[], rows: FlatNodeTreeRow[]) => {
    items.forEach((item) => {
        rows.push({ node: item.node, depth: item.depth, branchLabel: item.branchLabel });
        flattenNodeTreeRows(item.children, rows);
    });
};

export const flattenNodeTree = (items: NodeTreeItem[]) => {
    const rows: FlatNodeTreeRow[] = [];
    flattenNodeTreeRows(items, rows);
    return rows;
};

export const getBranchLabelColor = (branchLabel?: string) => {
    if (!branchLabel) {
        return '#8c8c8c';
    }
    if (branchLabel.includes('✓') || branchLabel.includes('成功') || branchLabel.includes('通过')) {
        return '#52c41a';
    }
    if (branchLabel.includes('✗') || branchLabel.includes('失败') || branchLabel.includes('拒绝')) {
        return '#ff4d4f';
    }
    if (branchLabel.includes('⚠') || branchLabel.includes('部分')) {
        return '#faad14';
    }
    return '#1890ff';
};

export const getNodeLabel = (node: FlowEditorNode) => {
    const nodeType = typeof node.data?.type === 'string' ? node.data.type : '';
    return String(node.data?.label || nodeTypeConfig[nodeType]?.label || '节点');
};

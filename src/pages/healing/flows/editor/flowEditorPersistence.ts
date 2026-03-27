import { getExecutionTask } from '@/services/auto-healing/execution';
import { getPlaybook } from '@/services/auto-healing/playbooks';
import type { FlowEditorEdge, FlowEditorNode } from './flowEditorTypes';

type FlowValidationResult =
    | { deadEndNodeLabels: string[]; ok: false; reason: 'dead-end' | 'unreachable-branch' }
    | { ok: true };

type ExecutionValidationIssue = {
    missingVars: string[];
    node: FlowEditorNode;
};

type ExecutionValidationResult = {
    issue: ExecutionValidationIssue | null;
    unavailableNodeLabels: string[];
};

function buildAdjacencyMap(edges: FlowEditorEdge[]) {
    const adjacencyMap = new Map<string, string[]>();
    edges.forEach((edge) => {
        const targets = adjacencyMap.get(edge.source) || [];
        targets.push(edge.target);
        adjacencyMap.set(edge.source, targets);
    });
    return adjacencyMap;
}

function canReachEnd(
    adjacencyMap: Map<string, string[]>,
    nodeId: string,
    endNodeIds: Set<string>,
    cache: Map<string, boolean>,
    path = new Set<string>(),
): boolean {
    if (endNodeIds.has(nodeId)) return true;
    if (path.has(nodeId)) return false;
    if (cache.has(nodeId)) return cache.get(nodeId) || false;

    path.add(nodeId);
    const targets = adjacencyMap.get(nodeId) || [];
    if (targets.length === 0) {
        cache.set(nodeId, false);
        return false;
    }

    const result = targets.every((targetId) => canReachEnd(adjacencyMap, targetId, endNodeIds, cache, new Set(path)));
    cache.set(nodeId, result);
    return result;
}

export function validateFlowStructure(
    nodes: FlowEditorNode[],
    edges: FlowEditorEdge[],
): FlowValidationResult {
    const startNode = nodes.find((node) => node.data?.type === 'start');
    const endNodes = nodes.filter((node) => node.data?.type === 'end');
    if (!startNode || endNodes.length === 0) {
        return { deadEndNodeLabels: [], ok: false, reason: 'unreachable-branch' };
    }

    const adjacencyMap = buildAdjacencyMap(edges);
    const endNodeIds = new Set(endNodes.map((node) => node.id));
    const cache = new Map<string, boolean>();
    if (canReachEnd(adjacencyMap, startNode.id, endNodeIds, cache)) {
        return { ok: true };
    }

    const deadEndNodeLabels = nodes
        .filter((node) => node.data?.type !== 'end' && node.data?.type !== 'start')
        .filter((node) => (adjacencyMap.get(node.id) || []).length === 0)
        .map((node) => String(node.data?.label || node.data?.type || node.id))
        .slice(0, 3);

    return {
        deadEndNodeLabels,
        ok: false,
        reason: deadEndNodeLabels.length > 0 ? 'dead-end' : 'unreachable-branch',
    };
}

function hasValue(value: unknown) {
    return value !== undefined && value !== null && value !== '';
}

function getNodeLabel(node: FlowEditorNode) {
    return String(node.data?.label || node.data?.type || node.id);
}

export async function validateExecutionNodes(
    nodes: FlowEditorNode[],
): Promise<ExecutionValidationResult> {
    const executionNodes = nodes.filter((node) => node.data?.type === 'execution');
    const unavailableNodeLabels = new Set<string>();

    for (const node of executionNodes) {
        const taskTemplateId = node.data?.task_template_id;
        if (!taskTemplateId || typeof taskTemplateId !== 'string') {
            return { issue: { missingVars: ['task_template_id'], node }, unavailableNodeLabels: [] };
        }

        let task: AutoHealing.ExecutionTask | undefined;
        try {
            task = (await getExecutionTask(taskTemplateId)).data;
        } catch (error) {
            console.error('Failed to validate execution task template:', error);
            unavailableNodeLabels.add(getNodeLabel(node));
            continue;
        }

        if (!task?.playbook?.id) {
            continue;
        }

        let playbook: AutoHealing.Playbook | undefined;
        try {
            playbook = (await getPlaybook(task.playbook.id)).data;
        } catch (error) {
            console.error('Failed to validate playbook variables:', error);
            unavailableNodeLabels.add(getNodeLabel(node));
            continue;
        }

        const requiredVars = (playbook?.variables || []).filter((variable) => variable.required);
        if (requiredVars.length === 0) {
            continue;
        }

        const extraVars = (node.data?.extra_vars as Record<string, unknown> | undefined) || {};
        const mappings = (node.data?.variable_mappings as Record<string, string> | undefined) || {};
        const templateVars = task.extra_vars || {};

        const missingVars = requiredVars
            .filter((variable) => !mappings[variable.name])
            .filter((variable) => !hasValue(extraVars[variable.name]))
            .filter((variable) => !hasValue(templateVars[variable.name]))
            .filter((variable) => !hasValue(variable.default))
            .map((variable) => variable.name);

        if (missingVars.length > 0) {
            return {
                issue: { missingVars, node },
                unavailableNodeLabels: Array.from(unavailableNodeLabels),
            };
        }
    }

    return {
        issue: null,
        unavailableNodeLabels: Array.from(unavailableNodeLabels),
    };
}

export function buildFlowPayload(
    edges: FlowEditorEdge[],
    flowIsActive: boolean,
    flowName: string,
    nodes: FlowEditorNode[],
): AutoHealing.CreateFlowRequest {
    const apiNodes = nodes.map((node) => {
        const { dryRunMessage, dryRunOutput, logs, onRetry, status, ...config } = node.data;
        return {
            config: config as AutoHealing.FlowNodeConfig,
            id: node.id,
            name: String(node.data.label || node.id),
            position: node.position,
            type: String(node.data.type || node.type) as AutoHealing.NodeType,
        };
    });

    edges.forEach((edge) => {
        const sourceNode = apiNodes.find((node) => node.id === edge.source);
        if (!sourceNode || sourceNode.type !== 'condition') {
            return;
        }
        if (edge.sourceHandle === 'true') sourceNode.config.true_target = edge.target;
        if (edge.sourceHandle === 'false') sourceNode.config.false_target = edge.target;
    });

    return {
        edges: edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            sourceHandle: edge.sourceHandle || undefined,
            target: edge.target,
            targetHandle: edge.targetHandle || undefined,
        })),
        is_active: flowIsActive,
        name: flowName,
        nodes: apiNodes,
    };
}

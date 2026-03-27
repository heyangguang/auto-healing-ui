import type { Edge, Node } from 'reactflow';

export type FlowEditorLogEntry = {
    timestamp: string;
    level: string;
    message: string;
    details?: unknown;
};

export type FlowEditorNodeData = Record<string, unknown> & {
    dryRunInput?: unknown;
    dryRunMessage?: string;
    dryRunOutput?: unknown;
    dryRunProcess?: unknown;
    label?: string;
    logs?: FlowEditorLogEntry[];
    onRetry?: () => void;
    status?: string;
    task_template_id?: string;
    type?: string;
    variable_mappings?: Record<string, string>;
};

export type FlowEditorNode = Node<FlowEditorNodeData>;
export type FlowEditorEdge = Edge;

export type ContextMenuState = {
    id: string;
    top: number;
    left: number;
    right?: number;
    bottom?: number;
    type: 'node' | 'edge';
};

export type DryRunNodeResult = {
    input?: unknown;
    message?: string;
    node_id: string;
    output?: unknown;
    output_handle?: string;
    process?: unknown;
    status: string;
};

import type { MutableRefObject } from 'react';
import type { FlowEditorEdge, FlowEditorNode } from './flowEditorTypes';

export type NodeDetailChangeHandler = (nodeId: string, values: Record<string, unknown>) => void;

export type NodeDetailFormValues = Record<string, unknown>;

export type NodeDetailFormApi = {
    getFieldValue: (name: string) => unknown;
    getFieldsValue: () => NodeDetailFormValues;
    resetFields: () => void;
    setFieldValue: (name: string, value: unknown) => void;
    setFieldsValue: (values: NodeDetailFormValues) => void;
} | null;

export type NodeDetailFormRef = MutableRefObject<NodeDetailFormApi>;

export interface NodeDetailPanelProps {
    node: FlowEditorNode | null;
    allNodes: FlowEditorNode[];
    allEdges: FlowEditorEdge[];
    open: boolean;
    onClose: () => void;
    onChange: NodeDetailChangeHandler;
    onNodeSelect: (nodeId: string) => void;
    onRetry?: () => void;
}

export interface NodeDetailSettingsProps {
    node: FlowEditorNode;
    formRef: NodeDetailFormRef;
    onChange: NodeDetailChangeHandler;
}

export interface NodeTreeItem {
    node: FlowEditorNode;
    children: NodeTreeItem[];
    branchLabel?: string;
    depth: number;
}

export interface FlatNodeTreeRow {
    node: FlowEditorNode;
    depth: number;
    branchLabel?: string;
}

import React, { Suspense, lazy } from 'react';
import type { Connection, NodeTypes, OnEdgesChange, OnNodesChange } from 'reactflow';
import ReactFlow, { Background, BackgroundVariant, Controls, MiniMap } from 'reactflow';
import { Layout } from 'antd';
import ContextMenu from './ContextMenu';
import type { ContextMenuState, DryRunNodeResult, FlowEditorEdge, FlowEditorNode } from './flowEditorTypes';

const NodeDetailPanel = lazy(() => import('./NodeDetailPanel'));
const DryRunModal = lazy(() => import('./DryRunModal'));

const { Content } = Layout;

type FlowEditorWorkspaceProps = {
    activeSelectedNode: FlowEditorNode | null;
    approvalNodes: Array<{ id: string; label: string }>;
    configOpen: boolean;
    dryRunOpen: boolean;
    edges: FlowEditorEdge[];
    flowId?: string;
    menu: ContextMenuState | null;
    nodeTypes: NodeTypes;
    nodes: FlowEditorNode[];
    onCloseConfig: () => void;
    onCloseDryRun: () => void;
    onConnect: (connection: Connection) => void;
    onDrop: (event: React.DragEvent) => void;
    onEdgeContextMenu: (event: React.MouseEvent, edge: FlowEditorEdge) => void;
    onEdgesChange: OnEdgesChange;
    onInit: (instance: unknown) => void;
    onMenuClick: () => void;
    onNodeClick: (_: React.MouseEvent, node: FlowEditorNode) => void;
    onNodeConfigChange: (nodeId: string, values: Record<string, unknown>) => void;
    onNodeContextMenu: (event: React.MouseEvent, node: FlowEditorNode) => void;
    onNodeLog: (nodeId: string, level: string, message: string, details?: unknown) => void;
    onNodeResult: (result: DryRunNodeResult) => void;
    onNodeSelect: (nodeId: string) => void;
    onNodesChange: OnNodesChange;
    onPaneClick: () => void;
    onRetry: () => void;
    onRunComplete: (success: boolean, message: string) => void;
    onStartRun: () => void;
    reactFlowWrapper: React.RefObject<HTMLDivElement | null>;
};

export const FlowEditorWorkspace: React.FC<FlowEditorWorkspaceProps> = ({
    activeSelectedNode,
    approvalNodes,
    configOpen,
    dryRunOpen,
    edges,
    flowId,
    menu,
    nodeTypes,
    nodes,
    onCloseConfig,
    onCloseDryRun,
    onConnect,
    onDrop,
    onEdgeContextMenu,
    onEdgesChange,
    onInit,
    onMenuClick,
    onNodeClick,
    onNodeConfigChange,
    onNodeContextMenu,
    onNodeLog,
    onNodeResult,
    onNodeSelect,
    onNodesChange,
    onPaneClick,
    onRetry,
    onRunComplete,
    onStartRun,
    reactFlowWrapper,
}) => (
    <>
        <Content style={{ position: 'relative', overflow: 'hidden', flex: 1, height: '100%' }}>
            <div className="reactflow-wrapper" ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onInit={onInit as never}
                    onDrop={onDrop}
                    onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';
                    }}
                    onNodeClick={onNodeClick as never}
                    onNodeContextMenu={onNodeContextMenu as never}
                    onEdgeContextMenu={onEdgeContextMenu as never}
                    onPaneClick={onPaneClick}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.3, maxZoom: 0.8 }}
                    defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
                    minZoom={0.3}
                    maxZoom={1.5}
                >
                    <Controls style={{ bottom: 100 }} />
                    <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#999" />
                    <MiniMap nodeStrokeWidth={3} zoomable pannable style={{ bottom: 100 }} />
                    {menu && <ContextMenu {...menu} onClick={onMenuClick} onClose={onPaneClick} />}
                </ReactFlow>
            </div>
        </Content>

        <Suspense fallback={null}>
            <NodeDetailPanel
                node={activeSelectedNode}
                allNodes={nodes}
                allEdges={edges}
                open={configOpen}
                onClose={onCloseConfig}
                onChange={onNodeConfigChange as never}
                onNodeSelect={onNodeSelect}
                onRetry={onRetry}
            />
        </Suspense>

        {flowId && (
            <Suspense fallback={null}>
                <DryRunModal
                    open={dryRunOpen}
                    flowId={flowId}
                    approvalNodes={approvalNodes}
                    onClose={onCloseDryRun}
                    onStartRun={onStartRun}
                    onNodeLog={onNodeLog}
                    onNodeResult={onNodeResult}
                    onRunComplete={onRunComplete}
                />
            </Suspense>
        )}
    </>
);

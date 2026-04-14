import LogConsole, { type LogEntry } from '@/components/execution/LogConsole';
import { CodeOutlined } from '@ant-design/icons';
import { Alert, Drawer, Tabs } from 'antd';
import React from 'react';
import ApprovalQuickActionsBar from './ApprovalQuickActionsBar';
import NodeConfigContextCards from './NodeConfigContextCards';
import NodeDetailDrawerHeader from './NodeDetailDrawerHeader';
import NodeDeveloperTab from './NodeDeveloperTab';
import NodePrimaryCards from './NodePrimaryCards';
import type { SelectedNodeDataLike } from './nodeDetailTypes';
import ExecutionLogTab from './ExecutionLogTab';

type NodeDetailDrawerProps = {
    canApprove: boolean;
    flowInstanceId?: string;
    nodeLogs: Record<string, LogEntry[]>;
    onClose: () => void;
    onApprovalActionSuccess: () => void;
    open: boolean;
    resolvedNames: Record<string, string>;
    resolutionErrors: Record<string, string>;
    selectedNodeData?: SelectedNodeDataLike | null;
};

const NODE_STATUS_KEYS = ['nodeState', 'dryRunMessage', '_nodeState', 'isCurrent', 'status'] as const;

const isPlainObject = (value: unknown): value is Record<string, unknown> => (
    Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

type OverviewTabContentProps = {
    canApprove: boolean;
    configEntries: [string, unknown][];
    contextEntries: [string, unknown][];
    flowInstanceId?: string;
    onApprovalActionSuccess: () => void;
    resolvedNames: Record<string, string>;
    selectedNodeData: SelectedNodeDataLike;
    stdoutLogs: LogEntry[];
};

const buildStdoutLogs = (stdout: unknown, startedAt?: string): LogEntry[] => {
    if (typeof stdout !== 'string' || stdout.trim() === '') {
        return [];
    }
    return stdout
        .split('\n')
        .filter((line) => line.trim())
        .map((line, index) => ({
            id: `stdout-${index}`,
            sequence: index,
            log_level: line.includes('fatal:') || line.includes('UNREACHABLE') ? 'error'
                : line.includes('changed:') ? 'changed'
                    : line.includes('ok:') ? 'ok'
                        : line.includes('skipping:') ? 'skipping'
                            : 'info',
            message: line,
            created_at: startedAt || new Date().toISOString(),
        }));
};

function OverviewTabContent({
    canApprove,
    configEntries,
    contextEntries,
    flowInstanceId,
    onApprovalActionSuccess,
    resolvedNames,
    selectedNodeData,
    stdoutLogs,
}: OverviewTabContentProps) {
    return (
        <div style={{ padding: '16px 20px', height: 'calc(100vh - 160px)', overflow: 'auto' }}>
            <ApprovalQuickActionsBar
                canApprove={canApprove}
                flowInstanceId={flowInstanceId}
                onActionSuccess={onApprovalActionSuccess}
                selectedNodeData={selectedNodeData}
            />
            <NodePrimaryCards resolvedNames={resolvedNames} selectedNodeData={selectedNodeData} stdoutLogs={stdoutLogs} />
            <NodeConfigContextCards configEntries={configEntries} contextEntries={contextEntries} resolvedNames={resolvedNames} />
        </div>
    );
}

function buildDrawerTabs({
    canApprove,
    contextEntries,
    configEntries,
    flowInstanceId,
    liveLogs,
    nodeState,
    onApprovalActionSuccess,
    resolvedNames,
    runId,
    selectedNodeData,
    stdoutLogs,
}: {
    canApprove: boolean;
    contextEntries: [string, unknown][];
    configEntries: [string, unknown][];
    flowInstanceId?: string;
    liveLogs: LogEntry[];
    nodeState: SelectedNodeDataLike['state'];
    onApprovalActionSuccess: () => void;
    resolvedNames: Record<string, string>;
    runId?: string;
    selectedNodeData: SelectedNodeDataLike;
    stdoutLogs: LogEntry[];
}) {
    return [
        {
            key: 'overview',
            label: '执行详情',
            children: (
                <OverviewTabContent
                    canApprove={canApprove}
                    configEntries={configEntries}
                    contextEntries={contextEntries}
                    flowInstanceId={flowInstanceId}
                    onApprovalActionSuccess={onApprovalActionSuccess}
                    resolvedNames={resolvedNames}
                    selectedNodeData={selectedNodeData}
                    stdoutLogs={stdoutLogs}
                />
            ),
        },
        ...((runId || stdoutLogs.length > 0) ? [{
            key: 'execution_log',
            label: '执行日志',
            children: <ExecutionLogTab runId={runId} fallbackLogs={stdoutLogs} />,
        }] : []),
        ...(liveLogs.length > 0 ? [{
            key: 'live_logs',
            label: '实时日志',
            children: (
                <LogConsole
                    logs={liveLogs}
                    height="calc(100vh - 160px)"
                    streaming={selectedNodeData.status === 'running'}
                />
            ),
        }] : []),
        {
            key: 'developer',
            label: <span><CodeOutlined /> 开发者排错</span>,
            children: <NodeDeveloperTab contextEntries={contextEntries} filteredConfig={Object.fromEntries(configEntries)} nodeState={nodeState} />,
        },
    ];
}

const NodeDetailDrawer: React.FC<NodeDetailDrawerProps> = ({
    canApprove,
    flowInstanceId,
    nodeLogs,
    onClose,
    onApprovalActionSuccess,
    open,
    resolvedNames,
    resolutionErrors,
    selectedNodeData,
}) => {
    const nodeState = selectedNodeData?.state;
    const runId = nodeState?.run?.run_id;
    const stdoutLogs = buildStdoutLogs(nodeState?.stdout, nodeState?.started_at);
    const liveLogs = selectedNodeData ? (nodeLogs[selectedNodeData.id] || selectedNodeData.logs || []) : [];
    const configData = isPlainObject(selectedNodeData?.config) ? selectedNodeData.config : {};
    const filteredConfig = Object.fromEntries(
        Object.entries(configData).filter(([key]) => !NODE_STATUS_KEYS.includes(key as (typeof NODE_STATUS_KEYS)[number])),
    );
    const configEntries = Object.entries(filteredConfig);
    const contextEntries = nodeState
        ? Object.entries(nodeState).filter(([key]) => !['stdout', 'stderr', 'error_message', 'message', 'run', 'status'].includes(key))
        : [];
    const resolutionErrorEntries = Object.entries(resolutionErrors);

    return (
        <Drawer title={null} placement="right" size={600} onClose={onClose} open={open} styles={{ header: { display: 'none' }, body: { padding: 0 } }}>
            <NodeDetailDrawerHeader selectedNodeData={selectedNodeData} />
            {selectedNodeData && (
                <>
                    {resolutionErrorEntries.length > 0 && (
                        <div style={{ padding: '16px 16px 0' }}>
                            <Alert
                                showIcon
                                type="warning"
                                title="部分引用名称解析失败"
                                description={(
                                    <div>
                                        {resolutionErrorEntries.map(([key, error]) => (
                                            <div key={key}>{error}</div>
                                        ))}
                                    </div>
                                )}
                            />
                        </div>
                    )}
                    <Tabs
                        defaultActiveKey="overview"
                        tabBarStyle={{ padding: '0 16px' }}
                        items={buildDrawerTabs({
                            canApprove,
                            contextEntries,
                            configEntries,
                            flowInstanceId,
                            liveLogs,
                            nodeState,
                            onApprovalActionSuccess,
                            resolvedNames,
                            runId,
                            selectedNodeData,
                            stdoutLogs,
                        })}
                    />
                </>
            )}
        </Drawer>
    );
};

export default NodeDetailDrawer;

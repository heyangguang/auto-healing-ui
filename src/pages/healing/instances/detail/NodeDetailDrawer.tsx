import LogConsole, { type LogEntry } from '@/components/execution/LogConsole';
import { CodeOutlined } from '@ant-design/icons';
import { Drawer, Tabs } from 'antd';
import React from 'react';
import NodeConfigContextCards from './NodeConfigContextCards';
import NodeDetailDrawerHeader from './NodeDetailDrawerHeader';
import NodeDeveloperTab from './NodeDeveloperTab';
import NodePrimaryCards from './NodePrimaryCards';
import type { SelectedNodeDataLike } from './nodeDetailTypes';
import ExecutionLogTab from './ExecutionLogTab';

type NodeDetailDrawerProps = {
    nodeLogs: Record<string, LogEntry[]>;
    onClose: () => void;
    open: boolean;
    resolvedNames: Record<string, string>;
    selectedNodeData?: SelectedNodeDataLike | null;
};

const NODE_STATUS_KEYS = ['nodeState', 'dryRunMessage', '_nodeState', 'isCurrent', 'status'] as const;

const isPlainObject = (value: unknown): value is Record<string, unknown> => (
    Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

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

const NodeDetailDrawer: React.FC<NodeDetailDrawerProps> = ({
    nodeLogs,
    onClose,
    open,
    resolvedNames,
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

    return (
        <Drawer title={null} placement="right" size={600} onClose={onClose} open={open} styles={{ header: { display: 'none' }, body: { padding: 0 } }}>
            <NodeDetailDrawerHeader selectedNodeData={selectedNodeData} />
            {selectedNodeData && (
                <Tabs
                    defaultActiveKey="overview"
                    tabBarStyle={{ padding: '0 16px' }}
                    items={[
                        {
                            key: 'overview',
                            label: '执行详情',
                            children: (
                                <div style={{ padding: '16px 20px', height: 'calc(100vh - 160px)', overflow: 'auto' }}>
                                    <NodePrimaryCards resolvedNames={resolvedNames} selectedNodeData={selectedNodeData} stdoutLogs={stdoutLogs} />
                                    <NodeConfigContextCards configEntries={configEntries} contextEntries={contextEntries} resolvedNames={resolvedNames} />
                                </div>
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
                            children: <NodeDeveloperTab contextEntries={contextEntries} filteredConfig={filteredConfig} nodeState={nodeState} />,
                        },
                    ]}
                />
            )}
        </Drawer>
    );
};

export default NodeDetailDrawer;

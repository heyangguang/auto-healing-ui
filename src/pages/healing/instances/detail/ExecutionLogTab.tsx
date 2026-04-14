import LogConsole, { type LogEntry } from '@/components/execution/LogConsole';
import { Empty } from 'antd';
import React, { useMemo } from 'react';
import { useExecutionLogFeed } from './useExecutionLogFeed';

type ExecutionLogTabProps = {
    fallbackLogs: LogEntry[];
    hasStarted: boolean;
    runId?: string;
};

const ExecutionLogTab: React.FC<ExecutionLogTabProps> = ({ fallbackLogs, hasStarted, runId }) => {
    const { loading, logs: apiLogs, streaming } = useExecutionLogFeed(runId);
    const displayLogs = useMemo(
        () => (apiLogs.length > 0 ? apiLogs : fallbackLogs),
        [apiLogs, fallbackLogs],
    );

    if (displayLogs.length === 0 && hasStarted && !runId) {
        return <Empty description="已进入执行节点，等待执行记录与日志输出..." style={{ marginTop: 60 }} />;
    }

    if (displayLogs.length === 0 && !loading) {
        return <Empty description="暂无执行日志" style={{ marginTop: 60 }} />;
    }

    return (
        <div style={{ height: 'calc(100vh - 160px)', background: '#1e1e1e' }}>
            <LogConsole
                logs={displayLogs}
                loading={loading && displayLogs.length === 0}
                streaming={streaming || (hasStarted && !runId)}
                height="100%"
                theme="dark"
                emptyText="加载执行日志中..."
            />
        </div>
    );
};

export default ExecutionLogTab;

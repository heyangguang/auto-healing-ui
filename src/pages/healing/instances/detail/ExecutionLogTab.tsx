import { getExecutionLogs } from '@/services/auto-healing/execution';
import LogConsole, { type LogEntry } from '@/components/execution/LogConsole';
import { Empty, Spin } from 'antd';
import React, { useEffect, useState } from 'react';

type ExecutionLogTabProps = {
    fallbackLogs: LogEntry[];
    runId?: string;
};

type ExecutionLogLike = {
    created_at: string;
    id: string;
    log_level?: string;
    message: string;
    sequence: number;
};

const mapApiLog = (log: ExecutionLogLike): LogEntry => ({
    id: log.id,
    sequence: log.sequence,
    log_level: log.log_level || 'info',
    message: log.message,
    created_at: log.created_at,
});

const ExecutionLogTab: React.FC<ExecutionLogTabProps> = ({ fallbackLogs, runId }) => {
    const [apiLogs, setApiLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!runId) {
            setApiLogs([]);
            setLoading(false);
            return undefined;
        }

        let active = true;
        setLoading(true);
        setApiLogs([]);

        getExecutionLogs(runId)
            .then((response) => {
                if (!active) {
                    return;
                }

                const rawLogs = Array.isArray(response?.data) ? response.data as ExecutionLogLike[] : [];
                if (rawLogs.length > 0) {
                    setApiLogs(rawLogs.map((log) => mapApiLog(log)));
                }
            })
            .catch(() => {
                // fallback logs stay visible
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [runId]);

    const displayLogs = apiLogs.length > 0 ? apiLogs : fallbackLogs;

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 160px)' }}><Spin tip="加载执行日志中..."><div /></Spin></div>;
    }

    if (displayLogs.length === 0) {
        return <Empty description="暂无执行日志" style={{ marginTop: 60 }} />;
    }

    return (
        <div style={{ height: 'calc(100vh - 160px)', background: '#1e1e1e' }}>
            <LogConsole logs={displayLogs} height="100%" theme="dark" />
        </div>
    );
};

export default ExecutionLogTab;

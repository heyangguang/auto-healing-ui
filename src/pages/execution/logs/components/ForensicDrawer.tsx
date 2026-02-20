import React, { useEffect, useState, useRef } from 'react';
import { Drawer, Space, Typography, Tag, Button, Tabs, Spin } from 'antd';
import { CloseOutlined, ReloadOutlined, ExpandOutlined } from '@ant-design/icons';
import { getExecutionRun, getExecutionLogs, createLogStream } from '@/services/auto-healing/execution';
import LogConsole, { LogEntry } from '@/components/execution/LogConsole';
import dayjs from 'dayjs';

const { Text } = Typography;

interface ForensicDrawerProps {
    runId?: string;
    open: boolean;
    onClose: () => void;
}

const ForensicDrawer: React.FC<ForensicDrawerProps> = ({ runId, open, onClose }) => {
    const [run, setRun] = useState<AutoHealing.ExecutionRun>();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [streaming, setStreaming] = useState(false);
    const closeStreamRef = useRef<(() => void) | null>(null);

    const loadData = async () => {
        if (!runId) return;
        setLoading(true);
        // Clear previous logs to avoid stale data showing while loading
        setLogs([]);
        try {
            const [runRes, logsRes] = await Promise.all([
                getExecutionRun(runId),
                getExecutionLogs(runId)
            ]);
            setRun(runRes.data);
            const rawLogs = logsRes.data || [];
            // Console.log debugging if needed, but for now rely on sorting
            setLogs(rawLogs.sort((a: any, b: any) => a.sequence - b.sequence));

            // Start stream if needed
            if (runRes.data.status === 'running' || runRes.data.status === 'pending') {
                startStream(runId);
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const startStream = (id: string) => {
        if (streaming) return;
        setStreaming(true);
        const close = createLogStream(id, (log) => {
            setLogs(prev => {
                if (prev.some(p => p.sequence === log.sequence)) return prev;
                return [...prev, log as LogEntry];
            });
        }, (res) => {
            setStreaming(false);
            setRun(prev => prev ? { ...prev, status: res.status as any } : prev);
        });
        closeStreamRef.current = close;
    };

    useEffect(() => {
        if (open && runId) {
            loadData();
        } else {
            // Clean up
            if (closeStreamRef.current) closeStreamRef.current();
            setLogs([]);
            setRun(undefined);
            setStreaming(false);
        }
    }, [open, runId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (closeStreamRef.current) closeStreamRef.current();
        };
    }, []);

    const Title = (
        <Space size={16}>
            <Text style={{ fontFamily: 'Fira Code' }}>#{runId?.slice(0, 8)}</Text>
            {run && (
                <Tag color={
                    run.status === 'running' ? '#1890ff' :
                        run.status === 'success' ? '#52c41a' :
                            run.status === 'partial' ? '#fa8c16' :
                                run.status === 'timeout' ? '#eb2f96' :
                                    run.status === 'cancelled' ? '#8c8c8c' :
                                        run.status === 'pending' ? '#722ed1' :
                                            '#ff4d4f'
                }>
                    {run.status === 'partial' ? '部分成功' :
                        run.status === 'timeout' ? '超时' :
                            run.status === 'cancelled' ? '已取消' :
                                run.status.toUpperCase()}
                </Tag>
            )}
            <Text type="secondary" style={{ fontSize: 13 }}>
                {run?.started_at ? dayjs(run.started_at).format('YYYY-MM-DD HH:mm:ss') : ''}
            </Text>
        </Space>
    );

    return (
        <Drawer
            title={Title}
            size={1000}
            open={open}
            onClose={onClose}
            styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
            styles={{ header: { padding: '16px 24px' } }}
            destroyOnHidden
            extra={
                <Space>
                    <Button icon={<ReloadOutlined />} size="small" onClick={loadData}>刷新</Button>
                    <Button
                        icon={<ExpandOutlined />}
                        size="small"
                        type="primary"
                        onClick={() => window.open(`/execution/runs/${runId}`, '_blank')}
                    >
                        完整视图
                    </Button>
                </Space>
            }
        >
            <div style={{ flex: 1, background: '#1e1e1e', display: 'flex', flexDirection: 'column' }}>
                <LogConsole
                    logs={logs}
                    loading={loading && logs.length === 0}
                    streaming={streaming}
                    height="100%"
                    theme="dark"
                />
            </div>
        </Drawer>
    );
};

export default ForensicDrawer;

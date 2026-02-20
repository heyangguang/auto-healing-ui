import React, { useEffect, useState, useMemo } from 'react';
import { Drawer, Button, Space, Typography, Card, Statistic, Row, Col, Alert, Tabs, Tag } from 'antd';
import {
    ReloadOutlined, StopOutlined,
    ClockCircleOutlined, UserOutlined,
    CheckCircleOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import { getExecutionRun, getExecutionLogs, cancelExecutionRun, createLogStream } from '@/services/auto-healing/execution';
import LogConsole, { LogEntry } from './LogConsole';
import StatusBadge from './StatusBadge';
import dayjs from 'dayjs';

interface ExecutionDrawerProps {
    runId?: string;
    open: boolean;
    onClose: () => void;
    onRunUpdated?: () => void;
}

const ExecutionDrawer: React.FC<ExecutionDrawerProps> = ({ runId, open, onClose, onRunUpdated }) => {
    const [run, setRun] = useState<AutoHealing.ExecutionRun>();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [streamController, setStreamController] = useState<AbortController | null>(null);

    const loadRun = async (id: string) => {
        if (!id) return;
        try {
            const res = await getExecutionRun(id);
            setRun(res.data);
        } catch { /* ignore */ }
    };

    const loadLogs = async (id: string) => {
        if (!id) return;
        setLoadingLogs(true);
        try {
            const res = await getExecutionLogs(id, { page: 1, page_size: 200 });
            setLogs(res.data || []);
        } catch { /* ignore */ }
        finally { setLoadingLogs(false); }
    };

    useEffect(() => {
        if (open && runId) {
            loadRun(runId);
            loadLogs(runId);
        } else {
            setRun(undefined);
            setLogs([]);
            if (streamController) {
                streamController.abort();
                setStreamController(null);
            }
        }
    }, [open, runId]);

    useEffect(() => {
        if (!open || !runId || !run) return;
        if (run.status === 'running' || run.status === 'pending') {
            if (streamController) return;
            const controller = new AbortController();
            setStreamController(controller);

            createLogStream(runId, (log) => {
                setLogs(prev => {
                    if (prev.some(l => l.id === log.id)) return prev;
                    return [...prev, log];
                });
            }, (res) => { /* Done */ });

            const statusInterval = setInterval(() => loadRun(runId), 3000);
            return () => {
                controller.abort();
                clearInterval(statusInterval);
            };
        } else {
            if (streamController) {
                streamController.abort();
                setStreamController(null);
            }
        }
    }, [open, runId, run?.status]);

    const handleCancel = async () => {
        if (!run) return;
        setCancelling(true);
        try {
            await cancelExecutionRun(run.id);
            loadRun(run.id);
            if (onRunUpdated) onRunUpdated();
        } catch { /* ignore */ }
        finally { setCancelling(false); }
    };

    const stats = useMemo(() => {
        const s = run?.stats || { ok: 0, changed: 0, failed: 0, skipped: 0, unreachable: 0 };
        return s;
    }, [run?.stats]);

    return (
        <Drawer
            title={run ? `任务详情 #${run.id.slice(0, 8)}` : '加载中...'}
            placement="right"
            size={900}
            onClose={onClose}
            open={open}
            extra={
                <Space>
                    {run?.status === 'running' && (
                        <Button danger size="small" icon={<StopOutlined />} onClick={handleCancel} loading={cancelling}>
                            终止执行
                        </Button>
                    )}
                    <Button size="small" icon={<ReloadOutlined />} onClick={() => run && loadRun(run.id)}>
                        刷新
                    </Button>
                </Space>
            }
        >
            {run && (
                <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                    {/* 头部信息 */}
                    <Card size="small" bordered={false} style={{ background: '#f5f5f5' }}>
                        <Row gutter={24}>
                            <Col span={6}>
                                <Statistic title="执行状态" value=" " prefix={<StatusBadge status={run.status} />} />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="执行耗时"
                                    value={run.completed_at ? dayjs(run.completed_at).diff(dayjs(run.started_at), 'second') + 's' : '-'}
                                    prefix={<ClockCircleOutlined />}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic title="开始时间" value={run.started_at ? dayjs(run.started_at).format('HH:mm:ss') : '-'} />
                            </Col>
                            <Col span={6}>
                                <Statistic title="触发人/方式" value={run.triggered_by === 'scheduler' ? '定时调度' : (run.triggered_by || '系统')} prefix={<UserOutlined />} />
                            </Col>
                        </Row>
                        {run.error_message && (
                            <Alert
                                message="执行失败"
                                description={run.error_message}
                                type="error"
                                showIcon
                                style={{ marginTop: 16 }}
                            />
                        )}
                    </Card>

                    {/* 标签页 */}
                    <Tabs
                        items={[
                            {
                                key: 'console',
                                label: '日志控制台',
                                children: (
                                    <LogConsole logs={logs} loading={loadingLogs} />
                                )
                            },
                            {
                                key: 'stats',
                                label: '任务统计',
                                children: (
                                    <Row gutter={16}>
                                        <Col span={6}><Card><Statistic title="成功 (OK)" value={stats.ok} styles={{ content: { color: '#52c41a' } }} prefix={<CheckCircleOutlined />} /></Card></Col>
                                        <Col span={6}><Card><Statistic title="变更 (Changed)" value={stats.changed} styles={{ content: { color: '#faad14' } }} /></Card></Col>
                                        <Col span={6}><Card><Statistic title="失败 (Failed)" value={stats.failed} styles={{ content: { color: '#ff4d4f' } }} prefix={<CloseCircleOutlined />} /></Card></Col>
                                        <Col span={6}><Card><Statistic title="跳过 (Skipped)" value={stats.skipped} styles={{ content: { color: '#bfbfbf' } }} /></Card></Col>
                                    </Row>
                                )
                            }
                        ]}
                    />
                </Space>
            )}
        </Drawer>
    );
};

export default ExecutionDrawer;

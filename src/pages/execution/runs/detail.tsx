import {
    LeftOutlined,
    SyncOutlined,
    CopyOutlined,
    ReloadOutlined,
    DashboardOutlined,
    ConsoleSqlOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    UserOutlined,
    RocketOutlined,
    RedoOutlined,
    KeyOutlined,
    DesktopOutlined,
    SettingOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import {
    Button, Card, Descriptions, Tag, Space, Typography, message, Row, Col, Statistic, Tooltip, Divider, Alert
} from 'antd';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getExecutionRun, getExecutionLogs, cancelExecutionRun, createLogStream, executeTask } from '@/services/auto-healing/execution';
import { getSecretsSources } from '@/services/auto-healing/secrets';
import StatusBadge from '@/components/execution/StatusBadge';
import LogConsole, { LogEntry } from '@/components/execution/LogConsole';
import dayjs from 'dayjs';

const { Text, Title, Paragraph } = Typography;

// ==================== 主组件 ====================
const ExecutionRunDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [run, setRun] = useState<AutoHealing.ExecutionRun>();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [streaming, setStreaming] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [retrying, setRetrying] = useState(false);
    const [secretsSources, setSecretsSources] = useState<AutoHealing.SecretsSource[]>([]);
    const closeStreamRef = useRef<(() => void) | null>(null);

    // 加载执行记录
    const loadRun = useCallback(async (): Promise<AutoHealing.ExecutionRun | undefined> => {
        if (!id) return undefined;
        try {
            const res = await getExecutionRun(id);
            setRun(res.data);
            return res.data;
        } catch {
            return undefined;
        }
    }, [id]);

    // 加载历史日志
    const loadLogs = useCallback(async () => {
        if (!id) return;
        try {
            const res = await getExecutionLogs(id);
            // Ensure logs are sorted by sequence if backend doesn't guaranteed it (though sequence field implies it)
            const sorted = (res.data || []).sort((a: any, b: any) => a.sequence - b.sequence);
            setLogs(sorted);
        } catch { /* ignore */ }
    }, [id]);

    // 启动实时日志流
    const startStream = useCallback(() => {
        if (!id || streaming) return;
        setStreaming(true);

        const closeStream = createLogStream(
            id,
            (log) => {
                setLogs(prev => {
                    // 简单去重，防止重复
                    if (prev.some(p => p.sequence === log.sequence)) return prev;
                    return [...prev, log as LogEntry];
                });
            },
            (result) => {
                setStreaming(false);
                setRun(prev => prev ? {
                    ...prev,
                    status: result.status as AutoHealing.ExecutionStatus,
                    stats: result.stats || prev.stats,
                    completed_at: new Date().toISOString() // 近似完成时间
                } : prev);
            }
        );

        closeStreamRef.current = closeStream;
    }, [id, streaming]);

    // 初始化
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            const runData = await loadRun();

            // 加载密钥源列表（用于显示名称）
            getSecretsSources({ page_size: 100 }).then(res => {
                if (res.data) setSecretsSources(res.data);
            });

            // 终结状态列表（这些状态不需要 streaming）
            const finalStatuses = ['success', 'failed', 'partial', 'cancelled', 'timeout'];
            const isFinalStatus = runData?.status && finalStatuses.includes(runData.status);

            // 判断是否需要实时流（运行中/等待中/刚创建30秒内，且不是终结状态）
            const isRunning = runData?.status === 'running' || runData?.status === 'pending';
            const isRecent = runData?.created_at &&
                (Date.now() - new Date(runData.created_at).getTime()) < 30000;

            if ((isRunning || isRecent) && !isFinalStatus) {
                // 对于正在执行的任务：并行启动 SSE 和加载历史日志
                startStream();
                loadLogs().finally(() => setLoading(false));
            } else {
                // 对于已完成的任务：直接加载日志
                await loadLogs();
                setLoading(false);
            }
        };
        init();

        return () => {
            if (closeStreamRef.current) {
                closeStreamRef.current();
            }
        };
    }, [id]);



    // 取消执行
    const handleCancel = async () => {
        if (!id) return;
        setCancelling(true);
        try {
            await cancelExecutionRun(id);
            message.success('已发送取消请求');
            await loadRun();
        } catch {
            message.error('取消失败');
        } finally { setCancelling(false); }
    };

    const handleRefresh = async () => {
        await loadRun();
        await loadLogs();
    };

    // 重试任务 - 使用原始运行时参数重新执行
    const handleRetry = async () => {
        if (!run?.task_id) {
            message.error('无法获取任务ID');
            return;
        }
        setRetrying(true);
        try {
            // 使用保存的运行时参数快照，确保与原始执行使用相同的参数
            const retryParams: AutoHealing.ExecuteTaskRequest = {
                triggered_by: 'manual',
            };
            // 如果有保存的运行时参数，使用它们
            if (run.runtime_target_hosts) {
                retryParams.target_hosts = run.runtime_target_hosts;
            }
            if (run.runtime_secrets_source_ids && run.runtime_secrets_source_ids.length > 0) {
                retryParams.secrets_source_ids = run.runtime_secrets_source_ids;
            }
            if (run.runtime_extra_vars && Object.keys(run.runtime_extra_vars).length > 0) {
                retryParams.extra_vars = run.runtime_extra_vars;
            }
            if (run.runtime_skip_notification) {
                retryParams.skip_notification = run.runtime_skip_notification;
            }

            const res = await executeTask(run.task_id, retryParams);
            message.success('任务已重新触发（使用原始参数）');
            // 跳转到新的执行详情页
            if (res.data?.id) {
                history.push(`/execution/runs/${res.data.id}`);
            }
        } catch {
            message.error('重试失败');
        } finally {
            setRetrying(false);
        }
    };

    if (!run && !loading) {
        return (
            <PageContainer>
                <Card>
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <Title level={4}>未找到执行记录</Title>
                        <Button onClick={() => history.push('/execution/runs')}>返回列表</Button>
                    </div>
                </Card>
            </PageContainer>
        );
    }

    const stats = run?.stats || { ok: 0, changed: 0, failed: 0, unreachable: 0, skipped: 0 };
    const totalTasks = stats.ok + stats.changed + stats.failed + stats.unreachable + stats.skipped;
    const successRate = totalTasks > 0 ? Math.round(((stats.ok + stats.changed) / totalTasks) * 100) : 0;

    // Header Content
    const headerTitle = (
        <Space>
            <RocketOutlined />
            <span>执行详情</span>
            <Text type="secondary" style={{ fontSize: 14, fontWeight: 'normal' }}>#{id?.substring(0, 8)}</Text>
        </Space>
    );

    return (
        <PageContainer
            header={{
                title: headerTitle,
                ghost: true,
                breadcrumb: {
                    items: [
                        { title: <a onClick={() => history.push('/execution/execute')}>发射台</a> },
                        { title: run?.task?.name || '执行详情' },
                    ],
                },
                extra: [
                    // 重试按钮 (任务完成后显示)
                    run?.status && run.status !== 'running' && run.status !== 'pending' && (
                        <Button key="retry" icon={<RedoOutlined />} onClick={handleRetry} loading={retrying}>
                            任务重试
                        </Button>
                    ),
                    run?.status === 'running' && (
                        <Button key="cancel" danger onClick={handleCancel} loading={cancelling} icon={<CloseCircleOutlined />}>
                            终止任务
                        </Button>
                    ),
                    <Button key="refresh" icon={<ReloadOutlined spin={loading || streaming} />} onClick={handleRefresh}>
                        刷新
                    </Button>,
                ],
            }}
        >
            <Row gutter={[16, 16]}>
                {/* 左侧：信息 & 统计 */}
                <Col xs={24} lg={8}>
                    <Space direction="vertical" style={{ width: '100%' }} size={16}>
                        <Card title="基本信息" bordered={false}>
                            <Descriptions column={1} size="small" bordered>
                                <Descriptions.Item label="任务模板">
                                    <Space>
                                        <Text strong>{run?.task?.name || 'Unknown'}</Text>
                                        <Tooltip title="跳转到发射台执行此任务">
                                            <Button type="link" size="small" icon={<RocketOutlined />} onClick={() => history.push(`/execution/execute?template=${run?.task_id}`)} />
                                        </Tooltip>
                                    </Space>
                                </Descriptions.Item>
                                <Descriptions.Item label="状态">
                                    <StatusBadge status={run?.status || 'unknown'} />
                                </Descriptions.Item>
                                <Descriptions.Item label="触发方式">
                                    <Tag icon={<UserOutlined />}>{run?.triggered_by || 'System'}</Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="开始时间">
                                    {run?.started_at ? dayjs(run.started_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
                                </Descriptions.Item>
                                <Descriptions.Item label="结束时间">
                                    {run?.completed_at ? dayjs(run.completed_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
                                </Descriptions.Item>
                                <Descriptions.Item label="耗时">
                                    {run?.started_at && run?.completed_at ?
                                        `${(dayjs(run.completed_at).diff(dayjs(run.started_at), 'millisecond') / 1000).toFixed(2)} 秒` :
                                        (run?.started_at ? <Text type="success"><ClockCircleOutlined spin /> 进行中...</Text> : '-')}
                                </Descriptions.Item>
                            </Descriptions>

                            {run?.error_message && (
                                <Alert
                                    message="执行错误"
                                    description={run.error_message}
                                    type="error"
                                    showIcon
                                    style={{ marginTop: 16 }}
                                />
                            )}
                        </Card>

                        {/* 运行时参数卡片 */}
                        <Card title={<Space><SettingOutlined />运行时参数</Space>} bordered={false} size="small">
                            <Descriptions column={1} size="small" bordered>
                                <Descriptions.Item label={<><DesktopOutlined /> 目标主机</>}>
                                    {run?.runtime_target_hosts ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                            {run.runtime_target_hosts.split(',').map((host: string) => (
                                                <Tag key={host} style={{ margin: 0 }}>{host.trim()}</Tag>
                                            ))}
                                        </div>
                                    ) : (
                                        <Text type="secondary">使用模板默认配置</Text>
                                    )}
                                </Descriptions.Item>
                                <Descriptions.Item label={<><KeyOutlined /> 密钥源</>}>
                                    {run?.runtime_secrets_source_ids && run.runtime_secrets_source_ids.length > 0 ? (
                                        <Space size={4} wrap>
                                            {run.runtime_secrets_source_ids.map((id: string) => {
                                                const source = secretsSources.find(s => s.id === id);
                                                return (
                                                    <Tag key={id} color="blue" style={{ margin: 0 }}>
                                                        {source ? source.name : `${id.substring(0, 8)}...`}
                                                    </Tag>
                                                );
                                            })}
                                        </Space>
                                    ) : (
                                        <Text type="secondary">未指定</Text>
                                    )}
                                </Descriptions.Item>
                                {run?.runtime_extra_vars && Object.keys(run.runtime_extra_vars).length > 0 && (
                                    <Descriptions.Item label="额外变量">
                                        <pre style={{ margin: 0, fontSize: 11, background: '#f5f5f5', padding: 8, maxHeight: 100, overflow: 'auto' }}>
                                            {JSON.stringify(run.runtime_extra_vars, null, 2)}
                                        </pre>
                                    </Descriptions.Item>
                                )}
                                {run?.runtime_skip_notification && (
                                    <Descriptions.Item label="跳过通知">
                                        <Tag color="orange">是</Tag>
                                    </Descriptions.Item>
                                )}
                            </Descriptions>
                        </Card>

                        <Card title={<Space><DashboardOutlined />执行统计</Space>} bordered={false}>
                            <Row gutter={[8, 8]}>
                                <Col span={12}>
                                    <Statistic
                                        title="成功率"
                                        value={successRate}
                                        suffix="%"
                                        valueStyle={{ color: successRate === 100 ? '#3f8600' : successRate < 60 ? '#cf1322' : '#faad14' }}
                                    />
                                </Col>
                                <Col span={12}>
                                    <Statistic title="总任务数" value={totalTasks} />
                                </Col>
                            </Row>
                            <Divider style={{ margin: '12px 0' }} />
                            <Row gutter={[4, 4]}>
                                <Col span={8}><Statistic title="成功" value={stats.ok} valueStyle={{ color: '#52c41a', fontSize: 16 }} /></Col>
                                <Col span={8}><Statistic title="变更" value={stats.changed} valueStyle={{ color: '#faad14', fontSize: 16 }} /></Col>
                                <Col span={8}><Statistic title="失败" value={stats.failed} valueStyle={{ color: '#ff4d4f', fontSize: 16 }} /></Col>
                                <Col span={8}><Statistic title="跳过" value={stats.skipped} valueStyle={{ color: '#1890ff', fontSize: 16 }} /></Col>
                                <Col span={8}><Statistic title="不可达" value={stats.unreachable} valueStyle={{ color: '#cf1322', fontSize: 16 }} /></Col>
                            </Row>
                        </Card>
                    </Space>
                </Col>

                {/* 右侧：日志 - 占据更多空间 */}
                <Col xs={24} lg={16}>
                    <Card
                        title={<Space><ConsoleSqlOutlined />执行日志</Space>}
                        bordered={false}
                        bodyStyle={{ padding: 0 }}
                        extra={
                            <Space>
                                {streaming && <Tag color="processing" icon={<SyncOutlined spin />}>实时同步中</Tag>}
                            </Space>
                        }
                    >
                        <LogConsole
                            logs={logs}
                            loading={loading && logs.length === 0}
                            streaming={streaming}
                            height="calc(100vh - 280px)"
                            theme="dark"
                            emptyText={
                                <div style={{ padding: 40, textAlign: 'center' }}>
                                    <Space direction="vertical">
                                        <ClockCircleOutlined style={{ fontSize: 24, color: '#d9d9d9' }} />
                                        <Text type="secondary">暂无日志输出</Text>
                                    </Space>
                                </div>
                            }
                        />
                    </Card>
                </Col>
            </Row>
        </PageContainer>
    );
};

export default ExecutionRunDetail;

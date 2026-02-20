import {
    LeftOutlined,
    SyncOutlined,
    ReloadOutlined,
    DashboardOutlined,
    ConsoleSqlOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    UserOutlined,
    RocketOutlined,
    RedoOutlined,
    KeyOutlined,
    DesktopOutlined,
    SettingOutlined,
    LinkOutlined,
    BranchesOutlined,
    ThunderboltOutlined,
    BellOutlined,
    FileTextOutlined,
    CodeOutlined,
    PlayCircleOutlined,
} from '@ant-design/icons';
import { history, useParams } from '@umijs/max';
import {
    Button, Tag, Space, Typography, message, Statistic, Tooltip, Alert, Drawer,
} from 'antd';
import React, { useEffect, useState, useRef, useCallback, startTransition } from 'react';
import { getExecutionRun, getExecutionLogs, cancelExecutionRun, createLogStream, executeTask } from '@/services/auto-healing/execution';
import { getSecretsSources } from '@/services/auto-healing/secrets';
import StatusBadge from '@/components/execution/StatusBadge';
import LogConsole, { LogEntry } from '@/components/execution/LogConsole';
import dayjs from 'dayjs';

const { Text } = Typography;

/* ========== 区块标题 ========== */
const SectionTitle: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
    <div style={{
        fontSize: 12, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: 0.5,
        marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600,
    }}>
        {icon} {title}
    </div>
);

/* ========== 字段行 ========== */
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', padding: '5px 0', fontSize: 13, lineHeight: '22px' }}>
        <span style={{ width: 80, flexShrink: 0, color: '#8c8c8c', fontSize: 12 }}>{label}</span>
        <span style={{ flex: 1, color: '#262626', fontWeight: 500 }}>{children}</span>
    </div>
);

// ==================== 主组件 ====================
const ExecutionRunDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const fromUrl = new URLSearchParams(window.location.search).get('from');
    const handleGoBack = useCallback(() => {
        if (fromUrl) { history.push(fromUrl); }
        else if (window.history.length > 1) { history.goBack(); }
        else { history.push('/execution/logs'); }
    }, [fromUrl]);
    const [loading, setLoading] = useState(true);
    const [run, setRun] = useState<AutoHealing.ExecutionRun>();
    const [drawerType, setDrawerType] = useState<'task' | 'playbook' | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [streaming, setStreaming] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [retrying, setRetrying] = useState(false);
    const [secretsSources, setSecretsSources] = useState<AutoHealing.SecretsSource[]>([]);
    const closeStreamRef = useRef<(() => void) | null>(null);

    const loadRun = useCallback(async (): Promise<AutoHealing.ExecutionRun | undefined> => {
        if (!id) return undefined;
        try { const res = await getExecutionRun(id); setRun(res.data); return res.data; }
        catch { return undefined; }
    }, [id]);

    const loadLogs = useCallback(async () => {
        if (!id) return;
        try {
            const res = await getExecutionLogs(id);
            setLogs((res.data || []).sort((a: any, b: any) => a.sequence - b.sequence));
        } catch { /* ignore */ }
    }, [id]);

    const startStream = useCallback(() => {
        if (!id || streaming) return;
        setStreaming(true);
        const closeStream = createLogStream(id,
            (log) => { setLogs(prev => prev.some(p => p.sequence === log.sequence) ? prev : [...prev, log as LogEntry]); },
            (result) => {
                setStreaming(false);
                setRun(prev => prev ? { ...prev, status: result.status as AutoHealing.ExecutionStatus, stats: result.stats || prev.stats, completed_at: new Date().toISOString() } : prev);
            }
        );
        closeStreamRef.current = closeStream;
    }, [id, streaming]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            const runData = await loadRun();
            getSecretsSources({ page_size: 100 } as any).then(res => { if (res.data) setSecretsSources(res.data); });
            const finalStatuses = ['success', 'failed', 'partial', 'cancelled', 'timeout'];
            const isFinal = runData?.status && finalStatuses.includes(runData.status);
            const isRunning = runData?.status === 'running' || runData?.status === 'pending';
            const isRecent = runData?.created_at && (Date.now() - new Date(runData.created_at).getTime()) < 30000;
            if ((isRunning || isRecent) && !isFinal) { startStream(); loadLogs().finally(() => setLoading(false)); }
            else { await loadLogs(); setLoading(false); }
        };
        init();
        return () => { if (closeStreamRef.current) closeStreamRef.current(); };
    }, [id]);

    const handleCancel = async () => {
        if (!id) return;
        setCancelling(true);
        try { await cancelExecutionRun(id); message.success('已发送取消请求'); await loadRun(); }
        catch { message.error('取消失败'); }
        finally { setCancelling(false); }
    };

    const handleRefresh = async () => { await loadRun(); await loadLogs(); };

    const handleRetry = async () => {
        if (!run?.task_id) { message.error('无法获取任务ID'); return; }
        setRetrying(true);
        try {
            const retryParams: AutoHealing.ExecuteTaskRequest = { triggered_by: 'manual' };
            if (run.runtime_target_hosts) retryParams.target_hosts = run.runtime_target_hosts;
            if (run.runtime_secrets_source_ids?.length) retryParams.secrets_source_ids = run.runtime_secrets_source_ids;
            if (run.runtime_extra_vars && Object.keys(run.runtime_extra_vars).length > 0) retryParams.extra_vars = run.runtime_extra_vars;
            if (run.runtime_skip_notification) retryParams.skip_notification = run.runtime_skip_notification;
            const res = await executeTask(run.task_id, retryParams);
            message.success('任务已重新触发');
            if (res.data?.id) history.push(`/execution/runs/${res.data.id}`);
        } catch { message.error('重试失败'); }
        finally { setRetrying(false); }
    };

    if (!run && !loading) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 16 }}>未找到执行记录</Text>
                <div style={{ marginTop: 16 }}><Button onClick={handleGoBack}>返回</Button></div>
            </div>
        );
    }

    const stats = run?.stats || { ok: 0, changed: 0, failed: 0, unreachable: 0, skipped: 0 };
    const totalTasks = stats.ok + stats.changed + stats.failed + stats.unreachable + stats.skipped;
    const successRate = totalTasks > 0 ? Math.round(((stats.ok + stats.changed) / totalTasks) * 100) : 0;
    const duration = run?.started_at && run?.completed_at
        ? `${(dayjs(run.completed_at).diff(dayjs(run.started_at), 'millisecond') / 1000).toFixed(2)}s`
        : (run?.started_at ? undefined : '-');

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f5f5f5', overflow: 'hidden' }}>

            {/* ====== 块 1：标题栏（独立区块） ====== */}
            <div className="industrial-dashed-box" style={{
                padding: '16px 24px',
                margin: '16px 16px 0 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
                background: '#fff',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Button type="text" size="small" icon={<LeftOutlined />}
                        onClick={handleGoBack} style={{ color: '#595959' }} />
                    <RocketOutlined style={{ fontSize: 18, color: '#595959' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 16, fontWeight: 600 }}>{run?.task?.name || '执行详情'}</span>
                            <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>#{id?.substring(0, 8)}</Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {run && <StatusBadge status={run.status || 'unknown'} />}
                            {duration && <Tag style={{ margin: 0, fontSize: 11 }}><ClockCircleOutlined /> {duration}</Tag>}
                            {!duration && run?.started_at && <Tag color="processing" style={{ margin: 0, fontSize: 11 }}><ClockCircleOutlined spin /> 进行中</Tag>}
                            {streaming && <Tag color="processing" icon={<SyncOutlined spin />} style={{ margin: 0, fontSize: 11 }}>实时同步中</Tag>}
                        </div>
                    </div>
                </div>
                <Space size={8}>
                    {run?.status && run.status !== 'running' && run.status !== 'pending' && (
                        <Button size="small" icon={<RedoOutlined />} onClick={handleRetry} loading={retrying}>重试</Button>
                    )}
                    {run?.status === 'running' && (
                        <Button size="small" danger onClick={handleCancel} loading={cancelling} icon={<CloseCircleOutlined />}>终止</Button>
                    )}
                    <Button size="small" icon={<ReloadOutlined spin={loading || streaming} />} onClick={handleRefresh}>刷新</Button>
                </Space>
            </div>

            {/* ====== 块 2 + 3：左侧信息 + 右侧日志 ====== */}
            <div style={{ flex: 1, display: 'flex', gap: 16, padding: 16, overflow: 'hidden' }}>

                {/* ====== 块 2：左侧信息面板 ====== */}
                <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>

                    {/* 基本信息 */}
                    <div className="industrial-dashed-box">
                        <SectionTitle icon={<RocketOutlined />} title="基本信息 / BASIC INFO" />
                        <Field label="任务模板">
                            <a onClick={() => setDrawerType('task')} style={{ cursor: 'pointer' }}>
                                {run?.task?.name || 'Unknown'}
                            </a>
                            <Tooltip title="跳转到发射台">
                                <RocketOutlined style={{ marginLeft: 6, color: '#1890ff', cursor: 'pointer', fontSize: 11 }}
                                    onClick={() => startTransition(() => history.push(`/execution/execute?template=${run?.task_id}`))} />
                            </Tooltip>
                        </Field>
                        <Field label="触发方式">
                            <Tag icon={<UserOutlined />} style={{ margin: 0 }}>{run?.triggered_by || 'System'}</Tag>
                        </Field>
                        <Field label="开始时间">{run?.started_at ? dayjs(run.started_at).format('YYYY-MM-DD HH:mm:ss') : '-'}</Field>
                        <Field label="结束时间">{run?.completed_at ? dayjs(run.completed_at).format('YYYY-MM-DD HH:mm:ss') : '-'}</Field>
                    </div>

                    {/* 错误信息 */}
                    {(run as any)?.error_message && (
                        <Alert message="执行错误" description={(run as any).error_message}
                            type="error" showIcon style={{ fontSize: 12 }} />
                    )}

                    {/* 关联信息 */}
                    <div className="industrial-dashed-box">
                        <SectionTitle icon={<LinkOutlined />} title="关联信息 / ASSOCIATIONS" />
                        <Field label="Playbook">
                            {run?.task?.playbook ? (
                                <a onClick={() => setDrawerType('playbook')} style={{ cursor: 'pointer' }}>
                                    <FileTextOutlined style={{ marginRight: 4, fontSize: 11 }} />
                                    {run.task.playbook.name}
                                </a>
                            ) : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>}
                        </Field>
                        {run?.task?.playbook?.repository && (
                            <Field label="Git 仓库">
                                <Tag icon={<BranchesOutlined />} style={{ margin: 0, fontSize: 11 }}>
                                    {run.task.playbook.repository.name}
                                </Tag>
                            </Field>
                        )}
                        <Field label="执行器">
                            <Tag icon={<ThunderboltOutlined />}
                                color={run?.task?.executor_type === 'docker' ? 'blue' : 'default'}
                                style={{ margin: 0, fontSize: 11 }}>
                                {run?.task?.executor_type || 'local'}
                            </Tag>
                        </Field>
                        <Field label="通知">
                            {run?.task?.notification_config?.enabled !== false ? (
                                <Tag icon={<BellOutlined />} color="green" style={{ margin: 0, fontSize: 11 }}>已启用</Tag>
                            ) : (
                                <Tag style={{ margin: 0, fontSize: 11 }} color="default">未启用</Tag>
                            )}
                        </Field>
                        {run?.task?.description && (
                            <Field label="任务描述">
                                <Text style={{ fontSize: 12, color: '#595959' }}>{run.task.description}</Text>
                            </Field>
                        )}
                    </div>

                    {/* 运行时参数 */}
                    <div className="industrial-dashed-box">
                        <SectionTitle icon={<SettingOutlined />} title="运行时参数 / RUNTIME" />
                        <Field label="目标主机">
                            {run?.runtime_target_hosts ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {run.runtime_target_hosts.split(',').map((h: string) => (
                                        <Tag key={h} style={{ margin: 0, fontSize: 11 }}><DesktopOutlined style={{ marginRight: 4 }} />{h.trim()}</Tag>
                                    ))}
                                </div>
                            ) : <Text type="secondary" style={{ fontSize: 12 }}>使用模板默认</Text>}
                        </Field>
                        <Field label="密钥源">
                            {run?.runtime_secrets_source_ids?.length ? (
                                <Space size={4} wrap>
                                    {run.runtime_secrets_source_ids.map((sid: string) => {
                                        const s = secretsSources.find(x => x.id === sid);
                                        return <Tag key={sid} color="blue" style={{ margin: 0, fontSize: 11 }}><KeyOutlined style={{ marginRight: 4 }} />{s?.name || sid.substring(0, 8)}</Tag>;
                                    })}
                                </Space>
                            ) : <Text type="secondary" style={{ fontSize: 12 }}>未指定</Text>}
                        </Field>
                        {run?.runtime_extra_vars && Object.keys(run.runtime_extra_vars).length > 0 && (
                            <Field label="额外变量">
                                <pre style={{ margin: 0, fontSize: 11, background: '#f0f0f0', padding: 8, maxHeight: 80, overflow: 'auto' }}>
                                    {JSON.stringify(run.runtime_extra_vars, null, 2)}
                                </pre>
                            </Field>
                        )}
                        {run?.runtime_skip_notification && (
                            <Field label="跳过通知"><Tag color="orange" style={{ margin: 0 }}>是</Tag></Field>
                        )}
                    </div>

                    {/* 执行统计 */}
                    <div className="industrial-dashed-box">
                        <SectionTitle icon={<DashboardOutlined />} title="执行统计 / STATS" />
                        <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                            <Statistic title="成功率" value={successRate} suffix="%"
                                styles={{ content: { fontSize: 22, color: successRate === 100 ? '#3f8600' : successRate < 60 ? '#cf1322' : '#faad14' } }} />
                            <Statistic title="总任务" value={totalTasks} styles={{ content: { fontSize: 22 } }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px 0', borderTop: '1px dashed #e0e0e0', paddingTop: 8 }}>
                            <Statistic title="成功" value={stats.ok} styles={{ content: { color: '#52c41a', fontSize: 14 } }} />
                            <Statistic title="变更" value={stats.changed} styles={{ content: { color: '#faad14', fontSize: 14 } }} />
                            <Statistic title="失败" value={stats.failed} styles={{ content: { color: '#ff4d4f', fontSize: 14 } }} />
                            <Statistic title="跳过" value={stats.skipped} styles={{ content: { color: '#1890ff', fontSize: 14 } }} />
                            <Statistic title="不可达" value={stats.unreachable} styles={{ content: { color: '#cf1322', fontSize: 14 } }} />
                        </div>
                    </div>
                </div>

                {/* ====== 块 3：日志区块 ====== */}
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0,
                    border: '1px dashed #d9d9d9', background: '#fafafa', borderRadius: 4, overflow: 'hidden',
                }}>
                    {/* 日志标题 */}
                    <div style={{
                        padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderBottom: '1px dashed #d9d9d9', background: '#fff',
                    }}>
                        <Space>
                            <ConsoleSqlOutlined style={{ fontSize: 14, color: '#595959' }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
                                执行日志 / EXECUTION LOG
                            </span>
                        </Space>
                        {streaming && <Tag color="processing" icon={<SyncOutlined spin />} style={{ margin: 0, fontSize: 11 }}>LIVE</Tag>}
                    </div>
                    {/* 日志内容 */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <LogConsole
                            logs={logs}
                            loading={loading && logs.length === 0}
                            streaming={streaming}
                            height="100%"
                            theme="dark"
                            emptyText={
                                <div style={{ padding: 40, textAlign: 'center' }}>
                                    <Space orientation="vertical">
                                        <ClockCircleOutlined style={{ fontSize: 24, color: '#d9d9d9' }} />
                                        <Text type="secondary">暂无日志输出</Text>
                                    </Space>
                                </div>
                            }
                        />
                    </div>
                </div>
            </div>

            {/* ====== 快速预览抽屉 ====== */}
            <Drawer
                open={drawerType !== null}
                onClose={() => setDrawerType(null)}
                size={520}
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {drawerType === 'task' ? <SettingOutlined /> : <FileTextOutlined />}
                        <span>{drawerType === 'task' ? '任务模板详情' : 'Playbook 详情'}</span>
                    </div>
                }
                extra={
                    drawerType === 'task' && run?.task_id ? (
                        <Button size="small" icon={<PlayCircleOutlined />}
                            onClick={() => { setDrawerType(null); startTransition(() => history.push(`/execution/execute?template=${run.task_id}`)); }}>
                            发射台
                        </Button>
                    ) : null
                }
            >
                {drawerType === 'task' && run?.task && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* 任务基本信息 */}
                        <div className="industrial-dashed-box">
                            <SectionTitle icon={<SettingOutlined />} title="基本信息 / BASIC INFO" />
                            <Field label="模板名称">{run.task.name}</Field>
                            {run.task.description && (
                                <Field label="描述">
                                    <Text style={{ fontSize: 12, color: '#595959' }}>{run.task.description}</Text>
                                </Field>
                            )}
                            <Field label="任务 ID">
                                <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>#{run.task_id?.substring(0, 8)}</Text>
                            </Field>
                            <Field label="执行器">
                                <Tag icon={<ThunderboltOutlined />}
                                    color={run.task.executor_type === 'docker' ? 'blue' : 'default'}
                                    style={{ margin: 0, fontSize: 11 }}>
                                    {run.task.executor_type || 'local'}
                                </Tag>
                            </Field>
                            <Field label="创建时间">{dayjs(run.task.created_at).format('YYYY-MM-DD HH:mm:ss')}</Field>
                            <Field label="更新时间">{dayjs(run.task.updated_at).format('YYYY-MM-DD HH:mm:ss')}</Field>
                        </div>

                        {/* 目标配置 */}
                        <div className="industrial-dashed-box">
                            <SectionTitle icon={<DesktopOutlined />} title="目标配置 / TARGETS" />
                            <Field label="目标主机">
                                {run.task.target_hosts ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {run.task.target_hosts.split(',').map((h: string) => (
                                            <Tag key={h} style={{ margin: 0, fontSize: 11 }}><DesktopOutlined style={{ marginRight: 4 }} />{h.trim()}</Tag>
                                        ))}
                                    </div>
                                ) : <Text type="secondary" style={{ fontSize: 12 }}>未配置</Text>}
                            </Field>
                            <Field label="密钥源">
                                {run.task.secrets_source_ids?.length ? (
                                    <Space size={4} wrap>
                                        {run.task.secrets_source_ids.map((sid: string) => {
                                            const s = secretsSources.find(x => x.id === sid);
                                            return <Tag key={sid} color="blue" style={{ margin: 0, fontSize: 11 }}><KeyOutlined style={{ marginRight: 4 }} />{s?.name || sid.substring(0, 8)}</Tag>;
                                        })}
                                    </Space>
                                ) : <Text type="secondary" style={{ fontSize: 12 }}>未指定</Text>}
                            </Field>
                        </div>

                        {/* 通知配置 */}
                        <div className="industrial-dashed-box">
                            <SectionTitle icon={<BellOutlined />} title="通知配置 / NOTIFICATION" />
                            <Field label="通知状态">
                                {run.task.notification_config?.enabled !== false ? (
                                    <Tag icon={<BellOutlined />} color="green" style={{ margin: 0, fontSize: 11 }}>已启用</Tag>
                                ) : (
                                    <Tag style={{ margin: 0, fontSize: 11 }} color="default">未启用</Tag>
                                )}
                            </Field>
                            {(() => {
                                const nc = run.task.notification_config;
                                const triggers: string[] = [];
                                if (nc?.on_start?.enabled) triggers.push('开始时');
                                if (nc?.on_success?.enabled) triggers.push('成功时');
                                if (nc?.on_failure?.enabled) triggers.push('失败时');
                                if (nc?.on_timeout?.enabled) triggers.push('超时时');
                                return triggers.length > 0 ? (
                                    <Field label="触发条件">
                                        <Space size={4} wrap>
                                            {triggers.map(t => <Tag key={t} style={{ margin: 0, fontSize: 11 }}>{t}</Tag>)}
                                        </Space>
                                    </Field>
                                ) : null;
                            })()}
                        </div>

                        {/* 额外变量 */}
                        {run.task.extra_vars && Object.keys(run.task.extra_vars).length > 0 && (
                            <div className="industrial-dashed-box">
                                <SectionTitle icon={<CodeOutlined />} title="额外变量 / EXTRA VARS" />
                                <pre style={{
                                    margin: 0, fontSize: 12, background: '#1e1e1e', color: '#d4d4d4',
                                    padding: 12, borderRadius: 4, overflow: 'auto', maxHeight: 200,
                                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                }}>
                                    {JSON.stringify(run.task.extra_vars, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                )}

                {drawerType === 'playbook' && run?.task?.playbook && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Playbook 基本信息 */}
                        <div className="industrial-dashed-box">
                            <SectionTitle icon={<FileTextOutlined />} title="基本信息 / BASIC INFO" />
                            <Field label="名称">{run.task.playbook.name}</Field>
                            <Field label="文件路径">
                                <code style={{ fontSize: 11, background: '#f0f0f0', padding: '1px 6px' }}>
                                    {run.task.playbook.file_path}
                                </code>
                            </Field>
                            <Field label="配置模式">
                                <Tag style={{ margin: 0, fontSize: 11 }}
                                    color={run.task.playbook.config_mode === 'enhanced' ? 'blue' : 'default'}>
                                    {run.task.playbook.config_mode || 'auto'}
                                </Tag>
                            </Field>
                            <Field label="状态">
                                <Tag style={{ margin: 0, fontSize: 11 }}
                                    color={run.task.playbook.status === 'ready' ? 'green' : run.task.playbook.status === 'error' ? 'red' : 'default'}>
                                    {run.task.playbook.status}
                                </Tag>
                            </Field>
                            {run.task.playbook.description && (
                                <Field label="描述">
                                    <Text style={{ fontSize: 12, color: '#595959' }}>{run.task.playbook.description}</Text>
                                </Field>
                            )}
                            <Field label="Playbook ID">
                                <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>#{run.task.playbook.id?.substring(0, 8)}</Text>
                            </Field>
                        </div>

                        {/* 仓库信息 */}
                        {run.task.playbook.repository && (
                            <div className="industrial-dashed-box">
                                <SectionTitle icon={<BranchesOutlined />} title="Git 仓库 / REPOSITORY" />
                                <Field label="仓库名称">{run.task.playbook.repository.name}</Field>
                                <Field label="默认分支">
                                    <Tag icon={<BranchesOutlined />} style={{ margin: 0, fontSize: 11 }}>
                                        {run.task.playbook.repository.default_branch || 'main'}
                                    </Tag>
                                </Field>
                                <Field label="仓库地址">
                                    <Text copyable style={{ fontSize: 11, fontFamily: 'monospace' }}>
                                        {run.task.playbook.repository.url}
                                    </Text>
                                </Field>
                                <Field label="同步状态">
                                    <Tag style={{ margin: 0, fontSize: 11 }}
                                        color={run.task.playbook.repository.status === 'ready' ? 'green' : 'orange'}>
                                        {run.task.playbook.repository.status}
                                    </Tag>
                                </Field>
                            </div>
                        )}

                        {/* Playbook 变量 */}
                        {run.task.playbook.variables && run.task.playbook.variables.length > 0 && (
                            <div className="industrial-dashed-box">
                                <SectionTitle icon={<CodeOutlined />} title={`变量定义 / VARIABLES (${run.task.playbook.variables.length})`} />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {run.task.playbook.variables.map((v) => (
                                        <div key={v.name} style={{
                                            padding: '6px 10px', background: '#fafafa', border: '1px solid #e8e8e8',
                                            borderRadius: 4, fontSize: 12,
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v.name}</span>
                                                <Space size={4}>
                                                    <Tag style={{ margin: 0, fontSize: 10 }}>{v.type}</Tag>
                                                    {v.required && <Tag color="red" style={{ margin: 0, fontSize: 10 }}>必填</Tag>}
                                                </Space>
                                            </div>
                                            {v.description && (
                                                <div style={{ color: '#8c8c8c', fontSize: 11, marginTop: 2 }}>{v.description}</div>
                                            )}
                                            {v.default !== undefined && v.default !== null && (
                                                <div style={{ marginTop: 2, fontSize: 11 }}>
                                                    <Text type="secondary">默认值：</Text>
                                                    <code style={{ fontSize: 11, background: '#f0f0f0', padding: '1px 4px' }}>{String(v.default)}</code>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 最后扫描 */}
                        {run.task.playbook.last_scanned_at && (
                            <div style={{ fontSize: 11, color: '#8c8c8c', textAlign: 'center', padding: '4px 0' }}>
                                最后扫描于 {dayjs(run.task.playbook.last_scanned_at).format('YYYY-MM-DD HH:mm:ss')}
                            </div>
                        )}
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default ExecutionRunDetail;

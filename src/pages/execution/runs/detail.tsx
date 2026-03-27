import { history, useParams, useAccess } from '@umijs/max';
import { Button, Alert, Spin, Typography, message } from 'antd';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getExecutionRun, getExecutionLogs, cancelExecutionRun, createLogStream, executeTask } from '@/services/auto-healing/execution';
import { getSecretsSources } from '@/services/auto-healing/secrets';
import { fetchAllPages } from '@/utils/fetchAllPages';
import type { LogEntry } from '@/components/execution/LogConsole';
import dayjs from 'dayjs';
import { createRequestSequence } from '@/utils/requestSequence';
import RunDetailHeader from './RunDetailHeader';
import RunDetailSidebar from './RunDetailSidebar';
import RunLogPanel from './RunLogPanel';
import RunQuickPreviewDrawer from './RunQuickPreviewDrawer';
import {
    mergeExecutionLogs,
    shouldKeepLiveStream,
    sortExecutionLogs,
} from './runDetailLogHelpers';
const { Text } = Typography;
const ExecutionRunDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const access = useAccess();
    const fromUrl = new URLSearchParams(window.location.search).get('from');
    const handleGoBack = useCallback(() => {
        if (fromUrl) { history.push(fromUrl); }
        else if (window.history.length > 1) { history.back(); }
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
    const [detailLoadError, setDetailLoadError] = useState<string>();
    const [logLoadError, setLogLoadError] = useState<string>();
    const closeStreamRef = useRef<(() => void) | null>(null);
    const detailRequestSequenceRef = useRef(createRequestSequence());
    const streamSequenceRef = useRef(createRequestSequence());
    const streamingRef = useRef(false);
    const currentRouteRunIdRef = useRef(id);
    const refreshRunDetailRef = useRef<((options?: { reset?: boolean; allowRecentFinal?: boolean }) => Promise<void>) | null>(null);
    currentRouteRunIdRef.current = id;
    const markStreamClosed = useCallback(() => {
        streamingRef.current = false;
        closeStreamRef.current = null;
        setStreaming(false);
    }, []);
    const closeCurrentStream = useCallback(() => {
        const closeStream = closeStreamRef.current;
        markStreamClosed();
        closeStream?.();
    }, [markStreamClosed]);
    const loadRun = useCallback(async (options: { runId?: string; token?: number } = {}): Promise<AutoHealing.ExecutionRun | undefined> => {
        const { runId = id, token } = options;
        if (!runId) return undefined;
        const res = await getExecutionRun(runId);
        if (token !== undefined && !detailRequestSequenceRef.current.isCurrent(token)) {
            return undefined;
        }
        setDetailLoadError(undefined);
        setRun(res.data);
        return res.data;
    }, [id]);

    const loadLogs = useCallback(async (options: { merge?: boolean; runId?: string; token?: number } = {}) => {
        const { merge = false, runId = id, token } = options;
        if (!runId) return;
        try {
            const res = await getExecutionLogs(runId);
            if (token !== undefined && !detailRequestSequenceRef.current.isCurrent(token)) {
                return;
            }
            const rawLogs = res.data || [];
            setLogLoadError(undefined);
            setLogs((prev) => (merge ? mergeExecutionLogs(prev, rawLogs) : sortExecutionLogs(rawLogs)));
        } catch {
            if (token !== undefined && !detailRequestSequenceRef.current.isCurrent(token)) {
                return;
            }
            setLogLoadError('加载执行日志失败');
            if (!merge) {
                setLogs([]);
            }
        }
    }, [id]);
    const startStream = useCallback((runId = id, detailToken?: number) => {
        if (!runId || streamingRef.current) return;
        const token = streamSequenceRef.current.next();
        streamingRef.current = true;
        setStreaming(true);
        const closeStream = createLogStream(runId,
            (log) => {
                if (!streamSequenceRef.current.isCurrent(token)) return;
                setLogLoadError(undefined);
                setLogs(prev => mergeExecutionLogs(prev, [log]));
            },
            (result) => {
                if (!streamSequenceRef.current.isCurrent(token)) return;
                markStreamClosed();
                setRun(prev => prev ? { ...prev, status: result.status as AutoHealing.ExecutionStatus, stats: result.stats || prev.stats } : prev);
                void Promise.all([
                    loadRun({ runId, token: detailToken }),
                    loadLogs({ merge: true, runId, token: detailToken }),
                ]);
            },
            () => {
                if (!streamSequenceRef.current.isCurrent(token)) return;
                markStreamClosed();
                void refreshRunDetailRef.current?.({ allowRecentFinal: false });
            },
        );
        closeStreamRef.current = closeStream;
    }, [id, loadLogs, loadRun, markStreamClosed]);
    const refreshRunDetail = useCallback(async (options: { reset?: boolean; allowRecentFinal?: boolean } = {}) => {
        if (!id) {
            return;
        }
        const { reset = false, allowRecentFinal = true } = options;
        const token = detailRequestSequenceRef.current.next();
        if (reset) {
            setRun(undefined);
            setLogs([]);
        }
        setLoading(true);
        setDetailLoadError(undefined);
        setLogLoadError(undefined);
        streamSequenceRef.current.invalidate();
        closeCurrentStream();
        let runData: AutoHealing.ExecutionRun | undefined;
        try {
            runData = await loadRun({ token });
        } catch {
            if (detailRequestSequenceRef.current.isCurrent(token)) {
                setDetailLoadError('加载执行详情失败');
                setLoading(false);
            }
            return;
        }
        if (!detailRequestSequenceRef.current.isCurrent(token)) {
            return;
        }
        const useLiveStream = shouldKeepLiveStream(runData, { allowRecentFinal });
        if (useLiveStream) {
            startStream(id, token);
        }
        await loadLogs({ merge: useLiveStream, token });
        if (detailRequestSequenceRef.current.isCurrent(token)) {
            setLoading(false);
        }
    }, [closeCurrentStream, id, loadLogs, loadRun, startStream]);
    refreshRunDetailRef.current = refreshRunDetail;
    useEffect(() => {
        fetchAllPages<any>((page, pageSize) => getSecretsSources({ page, page_size: pageSize } as any)).then(setSecretsSources);
    }, []);
    useEffect(() => {
        void refreshRunDetail({ reset: true });
        return () => {
            detailRequestSequenceRef.current.invalidate();
            streamSequenceRef.current.invalidate();
            closeCurrentStream();
        };
    }, [closeCurrentStream, id, refreshRunDetail]);
    const handleCancel = async () => {
        if (!id) return;
        const runId = id;
        setCancelling(true);
        try {
            await cancelExecutionRun(runId);
            if (currentRouteRunIdRef.current !== runId) {
                return;
            }
            message.success('已发送取消请求');
            await refreshRunDetailRef.current?.();
        }
        catch {
            if (currentRouteRunIdRef.current === runId) {
                message.error('取消失败');
            }
        }
        finally { setCancelling(false); }
    };
    const handleRefresh = async () => { await refreshRunDetail(); };
    const handleRetry = async () => {
        if (!run?.task_id || run.id !== id) { message.error('无法获取当前执行记录'); return; }
        const runId = id;
        const currentRun = run;
        setRetrying(true);
        try {
            const retryParams: AutoHealing.ExecuteTaskRequest = { triggered_by: 'manual' };
            if (currentRun.runtime_target_hosts) retryParams.target_hosts = currentRun.runtime_target_hosts;
            if (currentRun.runtime_secrets_source_ids?.length) retryParams.secrets_source_ids = currentRun.runtime_secrets_source_ids;
            if (currentRun.runtime_extra_vars && Object.keys(currentRun.runtime_extra_vars).length > 0) retryParams.extra_vars = currentRun.runtime_extra_vars;
            if (currentRun.runtime_skip_notification) retryParams.skip_notification = currentRun.runtime_skip_notification;
            const res = await executeTask(currentRun.task_id, retryParams);
            if (currentRouteRunIdRef.current !== runId) {
                return;
            }
            message.success('任务已重新触发');
            if (res.data?.id) history.push(`/execution/runs/${res.data.id}`);
        } catch { /* global error handler */ }
        finally { setRetrying(false); }
    };
    if (run && run.id !== id) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!run && !loading) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <Text type={detailLoadError ? 'danger' : 'secondary'} style={{ fontSize: 16 }}>
                    {detailLoadError || '未找到执行记录'}
                </Text>
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
            <RunDetailHeader
                accessCanCancelRun={!!access.canCancelRun}
                accessCanExecuteTask={!!access.canExecuteTask}
                cancelling={cancelling}
                duration={duration}
                loading={loading}
                retrying={retrying}
                run={run}
                runId={id}
                streaming={streaming}
                onBack={handleGoBack}
                onCancel={handleCancel}
                onRefresh={handleRefresh}
                onRetry={handleRetry}
            />

            {detailLoadError && run && (
                <div style={{ padding: '12px 16px 0' }}>
                    <Alert type="error" showIcon message={detailLoadError} />
                </div>
            )}

            <div style={{ flex: 1, display: 'flex', gap: 16, padding: 16, overflow: 'hidden' }}>
                <RunDetailSidebar
                    accessCanExecuteTask={!!access.canExecuteTask}
                    run={run}
                    secretsSources={secretsSources}
                    successRate={successRate}
                    totalTasks={totalTasks}
                    onLaunchpad={() => {
                        if (!run?.task_id) {
                            return;
                        }
                        history.push(`/execution/execute?template=${run.task_id}`);
                    }}
                    onOpenDrawer={setDrawerType}
                />
                <RunLogPanel loading={loading} logLoadError={logLoadError} logs={logs} streaming={streaming} />
            </div>

            <RunQuickPreviewDrawer
                accessCanExecuteTask={!!access.canExecuteTask}
                drawerType={drawerType}
                run={run}
                secretsSources={secretsSources}
                onClose={() => setDrawerType(null)}
                onLaunchpad={() => {
                    setDrawerType(null);
                    if (!run?.task_id) {
                        return;
                    }
                    history.push(`/execution/execute?template=${run.task_id}`);
                }}
            />
        </div>
    );
};

export default ExecutionRunDetail;

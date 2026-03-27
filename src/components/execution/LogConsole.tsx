import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Card, Divider, Empty, Space, Typography } from 'antd';
import {
    CheckCircleFilled,
    ClockCircleOutlined,
    CloseCircleFilled,
    DownloadOutlined,
    ExclamationCircleFilled,
    PauseCircleOutlined,
    PlayCircleOutlined,
    RightOutlined,
    SyncOutlined,
    VerticalAlignBottomOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;
const STATUS_KEYS = ['stdout', 'stderr', 'msg'] as const;
type StatusColor = 'success' | 'warning' | 'error' | 'processing' | 'default';
type TaskState = 'success' | 'warning' | 'error';

interface LogDetails { stdout?: string; stderr?: string; msg?: unknown; [key: string]: unknown; }
export interface LogEntry {
    id: string;
    sequence: number;
    log_level: string;
    message: string;
    stage?: string;
    host?: string;
    task_name?: string;
    play_name?: string;
    created_at?: string;
    details?: LogDetails;
}
interface LogConsoleProps { logs: LogEntry[]; loading?: boolean; streaming?: boolean; height?: string | number; emptyText?: React.ReactNode; theme?: 'light' | 'dark'; }
interface TaskBucket { id: string; name: string; rawName?: string; logs: LogEntry[]; startTime?: string; status: TaskState; hasResult: boolean; }
interface PlayBucket { id: string; name: string; tasks: TaskBucket[]; startTime?: string; status: TaskState; }
interface ThemePalette { isDark: boolean; bg: string; borderColor: string; textColor: string; headerBg: string; cardBg: string; mutedColor?: string; dividerColor: string; }
interface LevelStatus { color: StatusColor; icon: React.ReactNode; }

export const toLogEntry = (log: AutoHealing.ExecutionLog): LogEntry => ({
    id: log.id,
    sequence: log.sequence,
    log_level: log.level || log.log_level,
    message: log.message,
    stage: log.stage,
    host: log.host,
    task_name: log.task_name,
    play_name: log.play_name,
    created_at: log.created_at,
    details: log.details,
});

export const toLogEntries = (logs: readonly AutoHealing.ExecutionLog[]) => logs.map((log) => toLogEntry(log));

const getThemePalette = (theme: 'light' | 'dark'): ThemePalette => {
    const isDark = theme === 'dark';
    return {
        isDark,
        bg: isDark ? '#1e1e1e' : '#fff',
        borderColor: isDark ? '#333' : '#f0f0f0',
        textColor: isDark ? '#d9d9d9' : '#333',
        headerBg: isDark ? '#262626' : '#fafafa',
        cardBg: isDark ? '#2a2a2a' : '#f9f9f9',
        mutedColor: isDark ? '#8c8c8c' : undefined,
        dividerColor: isDark ? '#444' : '#e8e8e8',
    };
};

const getLevelStatus = (level: string): LevelStatus => {
    switch (level.toLowerCase()) {
        case 'ok': return { color: 'success', icon: <CheckCircleFilled style={{ color: '#52c41a' }} /> };
        case 'changed': return { color: 'warning', icon: <ExclamationCircleFilled style={{ color: '#faad14' }} /> };
        case 'failed': case 'fatal': case 'error': case 'unreachable': return { color: 'error', icon: <CloseCircleFilled style={{ color: '#ff4d4f' }} /> };
        case 'skipping': return { color: 'processing', icon: <RightOutlined style={{ color: '#1890ff' }} /> };
        default: return { color: 'default', icon: <ClockCircleOutlined style={{ color: '#d9d9d9' }} /> };
    }
};

const getPlayDisplay = (play: PlayBucket, streaming: boolean, isLastPlay: boolean) => {
    if (streaming && isLastPlay) return { bg: '#1890ff', icon: <SyncOutlined spin /> };
    if (play.status === 'error') return { bg: '#ff4d4f', icon: <CloseCircleFilled /> };
    if (play.status === 'warning') return { bg: '#fa8c16', icon: <ExclamationCircleFilled /> };
    return { bg: '#52c41a', icon: <CheckCircleFilled /> };
};

const getTaskIcon = (task: TaskBucket, streaming: boolean, isLastTask: boolean) => {
    if (streaming && isLastTask && !task.hasResult) return <SyncOutlined spin style={{ color: '#1890ff' }} />;
    if (task.status === 'error') return <CloseCircleFilled style={{ color: '#ff4d4f' }} />;
    return <CheckCircleFilled style={{ color: '#52c41a' }} />;
};

const normalizeTaskName = (log: LogEntry) => {
    const baseName = log.task_name || log.message || 'Initializing';
    return baseName.startsWith('TASK [') ? baseName.replace(/^TASK \[(.*)\](\s+\*{3})?$/, '$1') : baseName;
};

const shouldStartTask = (log: LogEntry, currentTask: TaskBucket | null) =>
    log.message.startsWith('TASK [') || (log.task_name && (!currentTask || currentTask.rawName !== log.task_name));

const extractExtraDetails = (details?: LogDetails): Array<[string, unknown]> =>
    Object.entries(details || {}).filter(([key]) => !STATUS_KEYS.includes(key as (typeof STATUS_KEYS)[number]));

const buildStructuredLogs = (logs: LogEntry[]): PlayBucket[] => {
    const plays: PlayBucket[] = [];
    let currentPlay: PlayBucket | null = null;
    let currentTask: TaskBucket | null = null;
    logs.forEach((log) => {
        const playName = log.play_name || 'System Review';
        if (!currentPlay || currentPlay.name !== playName) {
            currentPlay = { id: `play-${plays.length}`, name: playName, tasks: [], startTime: log.created_at, status: 'success' };
            plays.push(currentPlay);
            currentTask = null;
        }
        if (shouldStartTask(log, currentTask) || !currentTask) {
            currentTask = { id: `task-${plays.length}-${currentPlay.tasks.length}`, name: normalizeTaskName(log), rawName: log.task_name, logs: [], startTime: log.created_at, status: 'success', hasResult: false };
            if (!log.message.startsWith('TASK [') && !log.message.startsWith('PLAY [')) {
                currentTask.logs.push(log);
                if (log.host) currentTask.hasResult = true;
            }
            currentPlay.tasks.push(currentTask);
        } else if (!log.message.startsWith('PLAY [')) {
            currentTask.logs.push(log);
            if (log.host) currentTask.hasResult = true;
        }
        const status = getLevelStatus(log.log_level).color;
        if (status === 'error') { currentTask.status = 'error'; currentPlay.status = 'error'; return; }
        if (log.log_level === 'unreachable' && currentTask.status !== 'error') {
            currentTask.status = 'warning';
            if (currentPlay.status !== 'error') currentPlay.status = 'warning';
        }
    });
    return plays;
};

const buildDownloadContent = (logs: LogEntry[]) => logs.map((log) => {
    const time = dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss.SSS');
    const level = log.log_level ? log.log_level.toUpperCase() : 'INFO';
    const host = log.host ? `[${log.host}] ` : '';
    let entry = `${time} ${level} ${host}${log.message}`;
    if (log.details?.stdout) entry += `\n${log.details.stdout}`;
    if (log.details?.stderr) entry += `\n${log.details.stderr}`;
    const extraDetails = extractExtraDetails(log.details);
    if (extraDetails.length > 0) entry += `\n${JSON.stringify(Object.fromEntries(extraDetails))}`;
    return entry;
}).join('\n');

const DetailBlocks: React.FC<{ log: LogEntry; palette: ThemePalette }> = ({ log, palette }) => {
    const extraDetails = extractExtraDetails(log.details);
    return (
        <>
            {log.details?.stdout && <div style={{ marginTop: 4, padding: 8, background: palette.isDark ? '#000' : '#fff', border: `1px solid ${palette.isDark ? '#333' : '#eee'}`, color: palette.isDark ? '#ccc' : '#666', fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{log.details.stdout}</div>}
            {log.details?.stderr && <div style={{ marginTop: 4, padding: 8, background: palette.isDark ? '#2a1215' : '#fff1f0', border: `1px solid ${palette.isDark ? '#5c1d25' : '#ffccc7'}`, color: '#ff4d4f', fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{log.details.stderr}</div>}
            {extraDetails.length > 0 && (
                <div style={{ marginTop: 4, padding: '4px 8px', background: palette.isDark ? '#1f1f1f' : '#f9f9f9', border: `1px dashed ${palette.isDark ? '#444' : '#d9d9d9'}`, fontSize: 11, color: '#8c8c8c' }}>
                    {extraDetails.map(([key, value]) => <div key={key} style={{ display: 'flex', gap: 8 }}><span style={{ fontWeight: 600 }}>{key}:</span><span style={{ wordBreak: 'break-all' }}>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span></div>)}
                </div>
            )}
        </>
    );
};

const LogConsole: React.FC<LogConsoleProps> = ({ logs, loading, streaming, height = '600px', emptyText, theme = 'light' }) => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);
    const palette = getThemePalette(theme);
    const structuredLogs = useMemo(() => buildStructuredLogs(logs), [logs]);

    const handleDownload = () => {
        if (!logs.length) return;
        const blob = new Blob([buildDownloadContent(logs)], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `execution_logs_${dayjs().format('YYYYMMDD_HHmmss')}.log`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        if (autoScroll && bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [logs, autoScroll]);

    if (logs.length === 0 && loading) return <div style={{ padding: 40, textAlign: 'center', color: palette.textColor }}>{emptyText || '等待日志...'}</div>;
    if (logs.length === 0) return <Empty description={<span style={{ color: palette.textColor }}>暂无日志</span>} image={Empty.PRESENTED_IMAGE_SIMPLE} />;

    return (
        <div style={{ height, display: 'flex', flexDirection: 'column', background: palette.bg, border: `1px solid ${palette.borderColor}` }}>
            <div style={{ padding: '8px 16px', borderBottom: `1px solid ${palette.borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: palette.headerBg }}>
                <Space>
                    <Badge status={streaming ? 'processing' : 'default'} text={<span style={{ color: palette.textColor }}>{streaming ? '实时接收中' : '执行完成'}</span>} />
                    <Divider orientation="vertical" style={{ borderColor: palette.dividerColor }} />
                    <Text type="secondary" style={{ fontSize: 12, color: palette.mutedColor }}>{logs.length} 条日志</Text>
                </Space>
                <Space>
                    <Button type="text" size="small" icon={<DownloadOutlined />} onClick={handleDownload} style={{ color: palette.textColor }}>下载日志</Button>
                    <Divider orientation="vertical" style={{ borderColor: palette.dividerColor }} />
                    <Button type={autoScroll ? 'link' : 'text'} size="small" icon={autoScroll ? <PauseCircleOutlined /> : <PlayCircleOutlined />} onClick={() => setAutoScroll(!autoScroll)} style={{ color: palette.isDark ? '#1890ff' : undefined }}>
                        {autoScroll ? '自动滚动: 开' : '自动滚动: 关'}
                    </Button>
                    <Button type="text" size="small" icon={<VerticalAlignBottomOutlined />} onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })} style={{ color: palette.textColor }}>到底部</Button>
                </Space>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {structuredLogs.map((play, playIndex) => {
                        const isLastPlay = playIndex === structuredLogs.length - 1;
                        const display = getPlayDisplay(play, Boolean(streaming), isLastPlay);
                        return (
                            <div key={play.id}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: display.bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, marginRight: 12, flexShrink: 0 }}>{display.icon}</div>
                                    <Text strong style={{ fontSize: 16, color: palette.textColor }}>{play.name}</Text>
                                    <Text type="secondary" style={{ marginLeft: 8, fontSize: 12, color: palette.mutedColor }}>{dayjs(play.startTime).format('HH:mm:ss')}</Text>
                                </div>
                                <div style={{ paddingLeft: 10, borderLeft: `1px solid ${palette.isDark ? '#444' : '#f0f0f0'}`, marginLeft: 10 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 22 }}>
                                        {play.tasks.map((task, taskIndex) => {
                                            const icon = getTaskIcon(task, Boolean(streaming), isLastPlay && taskIndex === play.tasks.length - 1);
                                            return (
                                                <Card key={task.id} size="small" bordered={false} style={{ background: palette.cardBg, overflow: 'hidden' }} styles={{ body: { padding: '8px 12px' } }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: task.logs.length > 0 ? 8 : 0 }}>
                                                        <Space>{icon}<Text strong style={{ color: palette.textColor }}>{task.name}</Text></Space>
                                                        <Text type="secondary" style={{ fontSize: 11, color: palette.isDark ? '#666' : undefined }}>{dayjs(task.startTime).format('HH:mm:ss.SSS')}</Text>
                                                    </div>
                                                    {task.logs.length > 0 && (
                                                        <div style={{ borderTop: `1px solid ${palette.isDark ? '#444' : '#f0f0f0'}`, paddingTop: 8 }}>
                                                            {task.logs.map((log) => {
                                                                const status = getLevelStatus(log.log_level);
                                                                const hostResult = Boolean(log.host);
                                                                const color = status.color === 'error' ? '#ff4d4f' : status.color === 'warning' ? '#faad14' : status.color === 'success' ? '#52c41a' : palette.textColor;
                                                                return (
                                                                    <div key={log.id} style={{ marginBottom: 4, fontSize: 13, fontFamily: 'Menlo, Monaco, "Courier New", monospace', display: 'flex', alignItems: 'flex-start', color: palette.textColor }}>
                                                                        <div style={{ width: 24, paddingTop: 2, flexShrink: 0 }}>{hostResult ? status.icon : <div style={{ width: 6, height: 6, borderRadius: '50%', background: status.color === 'error' ? '#ff4d4f' : palette.isDark ? '#555' : '#ddd', marginTop: 6 }} />}</div>
                                                                        <div style={{ flex: 1 }}>
                                                                            <div style={{ display: 'flex', flexWrap: 'wrap' }}>{log.host && <Text type="secondary" style={{ marginRight: 8, minWidth: 100 }}>[{log.host}]</Text>}<span style={{ color, wordBreak: 'break-all' }}>{log.message}</span></div>
                                                                            <DetailBlocks log={log} palette={palette} />
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div ref={bottomRef} />
            </div>
        </div>
    );
};

export default LogConsole;

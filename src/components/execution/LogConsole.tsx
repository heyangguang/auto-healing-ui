import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Button, Space, Typography, Collapse, Tag, Empty, Steps, Card, Badge, Divider } from 'antd';
import {
    VerticalAlignBottomOutlined, PauseCircleOutlined, PlayCircleOutlined,
    CaretRightOutlined, CheckCircleFilled, CloseCircleFilled, ExclamationCircleFilled,
    ClockCircleOutlined, RightOutlined, DownloadOutlined, SyncOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

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
    details?: {
        stdout?: string;
        stderr?: string;
        [key: string]: any;
    };
    [key: string]: any;
}

interface LogConsoleProps {
    logs: LogEntry[];
    loading?: boolean;
    streaming?: boolean;
    height?: string | number;
    emptyText?: React.ReactNode;
    theme?: 'light' | 'dark';
}

// 辅助：获取状态颜色和图标
const getLevelStatus = (level: string) => {
    switch (level?.toLowerCase()) {
        case 'ok': return { color: 'success', icon: <CheckCircleFilled style={{ color: '#52c41a' }} /> };
        case 'changed': return { color: 'warning', icon: <ExclamationCircleFilled style={{ color: '#faad14' }} /> };
        case 'failed':
        case 'fatal':
        case 'error':
        case 'unreachable':
            return { color: 'error', icon: <CloseCircleFilled style={{ color: '#ff4d4f' }} /> };
        case 'skipping': return { color: 'processing', icon: <RightOutlined style={{ color: '#1890ff' }} /> };
        default: return { color: 'default', icon: <ClockCircleOutlined style={{ color: '#d9d9d9' }} /> };
    }
};

// 获取 Play 的状态图标和颜色 (根据统计)
const getPlayStatusDisplay = (play: any, streaming: boolean, isLastPlay: boolean) => {
    const hasError = play.status === 'error';
    const hasWarning = play.status === 'warning'; // 部分成功/有 unreachable
    const isRunning = streaming && isLastPlay;

    if (isRunning) {
        return { bg: '#1890ff', icon: <SyncOutlined spin /> };
    }
    if (hasError) {
        return { bg: '#ff4d4f', icon: <CloseCircleFilled /> };
    }
    if (hasWarning) {
        return { bg: '#fa8c16', icon: <ExclamationCircleFilled /> }; // 橙色，部分成功
    }
    // 执行成功 (即使是 changed 也算成功)
    return { bg: '#52c41a', icon: <CheckCircleFilled /> };
};

// 获取 Task 的状态图标 (只区分成功和失败)
const getTaskStatusIcon = (task: any, streaming: boolean, isLastTask: boolean) => {
    const isRunning = streaming && isLastTask && !task.hasResult;

    if (isRunning) {
        return <SyncOutlined spin style={{ color: '#1890ff' }} />;
    }
    if (task.status === 'error') {
        return <CloseCircleFilled style={{ color: '#ff4d4f' }} />;
    }
    // changed 和 ok 都算成功，显示绿色
    return <CheckCircleFilled style={{ color: '#52c41a' }} />;
};


const LogConsole: React.FC<LogConsoleProps> = ({ logs, loading, streaming, height = '600px', emptyText, theme = 'light' }) => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);

    const isDark = theme === 'dark';
    const bg = isDark ? '#1e1e1e' : '#fff';
    const borderColor = isDark ? '#333' : '#f0f0f0';
    const textColor = isDark ? '#d9d9d9' : '#333';
    const headerBg = isDark ? '#262626' : '#fafafa';
    const cardBg = isDark ? '#2a2a2a' : '#f9f9f9';

    // 1. 按 Play 分组 -> 按 Task 分组
    const structuredLogs = useMemo(() => {
        const plays: any[] = [];
        let currentPlay: any = null;
        let currentTask: any = null;

        // 预处理：如果没有 Play/Task 结构的散乱日志，归入 "System / Setup"
        const ensureStructure = (log: LogEntry) => {
            const playName = log.play_name || 'System Review';
            // 如果 Play 变了，或者当前没有 Play
            if (!currentPlay || currentPlay.name !== playName) {
                currentPlay = {
                    id: `play-${plays.length}`,
                    name: playName,
                    tasks: [],
                    startTime: log.created_at,
                    status: 'success' // 默认为 success, 遇到 error 变 error
                };
                plays.push(currentPlay);
                currentTask = null; // 重置 Task
            }

            const taskName = log.task_name || log.message || 'Initializing';
            // 只有当日志真的看起来像一个 Task 开始，或者我们需要一个新的 Task bucket 时
            const isTaskHeader = log.message.startsWith('TASK [') || (log.task_name && (!currentTask || currentTask.rawName !== log.task_name));

            if (isTaskHeader || !currentTask) {
                // 提取纯净 Task Name
                let cleanName = log.task_name || log.message;
                if (cleanName.startsWith('TASK [')) cleanName = cleanName.replace(/^TASK \[(.*)\](\s+\*{3})?$/, '$1');

                currentTask = {
                    id: `task-${plays.length}-${currentPlay.tasks.length}`,
                    name: cleanName,
                    rawName: log.task_name,
                    logs: [],
                    startTime: log.created_at,
                    status: 'success',
                    hasResult: false // 是否有主机结果
                };
                if (!log.message.startsWith('TASK [') && !log.message.startsWith('PLAY [')) {
                    currentTask.logs.push(log);
                    if (log.host) currentTask.hasResult = true;
                }
                currentPlay.tasks.push(currentTask);
            } else {
                if (!log.message.startsWith('PLAY [')) {
                    currentTask.logs.push(log);
                    if (log.host) currentTask.hasResult = true;
                }
            }

            // 更新状态冒泡：
            // - error/failed/fatal → error
            // - unreachable → warning (部分成功)
            // - changed 和 ok 保持成功
            const st = getLevelStatus(log.log_level);
            if (st.color === 'error') {
                currentTask.status = 'error';
                currentPlay.status = 'error';
            } else if (log.log_level === 'unreachable' && currentTask.status !== 'error') {
                // 有 unreachable 但不是完全失败，标记为 warning
                currentTask.status = 'warning';
                if (currentPlay.status !== 'error') {
                    currentPlay.status = 'warning';
                }
            }
        };

        logs.forEach(ensureStructure);
        return plays;
    }, [logs]);

    const handleDownload = () => {
        if (!logs.length) return;

        const content = logs.map(log => {
            const time = dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss.SSS');
            const level = log.log_level ? log.log_level.toUpperCase() : 'INFO';
            const host = log.host ? `[${log.host}] ` : '';

            let entry = `${time} ${level} ${host}${log.message}`;

            // Append Details with simple indentation, mirroring UI structure
            if (log.details) {
                if (log.details.stdout) {
                    entry += `\n${log.details.stdout}`;
                }
                if (log.details.stderr) {
                    entry += `\n${log.details.stderr}`;
                }
                // Dump other details
                const otherKeys = Object.keys(log.details).filter(k => k !== 'stdout' && k !== 'stderr' && k !== 'msg');
                if (otherKeys.length > 0) {
                    const others: Record<string, any> = {};
                    otherKeys.forEach(k => others[k] = log.details![k]);
                    entry += `\n${JSON.stringify(others)}`;
                }
            }
            return entry;
        }).join('\n');

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `execution_logs_${dayjs().format('YYYYMMDD_HHmmss')}.log`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        if (autoScroll && bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, autoScroll]);

    if (logs.length === 0 && loading) {
        return <div style={{ padding: 40, textAlign: 'center', color: textColor }}>{emptyText || '等待日志...'}</div>;
    }

    if (logs.length === 0) {
        return <Empty description={<span style={{ color: textColor }}>暂无日志</span>} image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    return (
        <div style={{ height: height, display: 'flex', flexDirection: 'column', background: bg, border: `1px solid ${borderColor}`, borderRadius: 0 }}>
            {/* Header / Toolbar */}
            <div style={{ padding: '8px 16px', borderBottom: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: headerBg, borderRadius: 0 }}>
                <Space>
                    <Badge status={streaming ? 'processing' : 'default'} text={<span style={{ color: textColor }}>{streaming ? '实时接收中' : '执行完成'}</span>} />
                    <Divider orientation="vertical" style={{ borderColor: isDark ? '#444' : '#e8e8e8' }} />
                    <Text type="secondary" style={{ fontSize: 12, color: isDark ? '#8c8c8c' : undefined }}>{logs.length} 条日志</Text>
                </Space>
                <Space>
                    <Button
                        type="text"
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={handleDownload}
                        style={{ color: textColor }}
                    >
                        下载日志
                    </Button>
                    <Divider orientation="vertical" style={{ borderColor: isDark ? '#444' : '#e8e8e8' }} />
                    <Button
                        type={autoScroll ? 'link' : 'text'}
                        size="small"
                        icon={autoScroll ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                        onClick={() => setAutoScroll(!autoScroll)}
                        style={{ color: isDark ? '#1890ff' : undefined }}
                    >
                        {autoScroll ? '自动滚动: 开' : '自动滚动: 关'}
                    </Button>
                    <Button type="text" size="small" icon={<VerticalAlignBottomOutlined />} onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })} style={{ color: textColor }}>
                        到底部
                    </Button>
                </Space>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {structuredLogs.map((play, playIndex) => {
                        const isLastPlay = playIndex === structuredLogs.length - 1;
                        const playDisplay = getPlayStatusDisplay(play, !!streaming, isLastPlay);

                        return (
                            <div key={play.id}>
                                {/* Play Header */}
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                                    <div style={{
                                        width: 20, height: 20, borderRadius: '50%',
                                        background: playDisplay.bg,
                                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 12, marginRight: 12, flexShrink: 0
                                    }}>
                                        {playDisplay.icon}
                                    </div>
                                    <Text strong style={{ fontSize: 16, color: textColor }}>{play.name}</Text>
                                    <Text type="secondary" style={{ marginLeft: 8, fontSize: 12, color: isDark ? '#8c8c8c' : undefined }}>
                                        {dayjs(play.startTime).format('HH:mm:ss')}
                                    </Text>
                                </div>

                                {/* Play Content (Tasks) */}
                                <div style={{ paddingLeft: 10, borderLeft: `1px solid ${isDark ? '#444' : '#f0f0f0'}`, marginLeft: 10 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 22 }}>
                                        {play.tasks.map((task: any, taskIndex: number) => {
                                            const isLastTask = isLastPlay && taskIndex === play.tasks.length - 1;
                                            const taskIcon = getTaskStatusIcon(task, !!streaming, isLastTask);

                                            return (
                                                <Card
                                                    key={task.id}
                                                    size="small"
                                                    bordered={false}
                                                    style={{ background: cardBg, borderRadius: 0, overflow: 'hidden' }}
                                                    styles={{ body: { padding: '8px 12px' } }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: task.logs.length > 0 ? 8 : 0 }}>
                                                        <Space>
                                                            {taskIcon}
                                                            <Text strong style={{ color: textColor }}>{task.name}</Text>
                                                        </Space>
                                                        <Text type="secondary" style={{ fontSize: 11, color: isDark ? '#666' : undefined }}>
                                                            {dayjs(task.startTime).format('HH:mm:ss.SSS')}
                                                        </Text>
                                                    </div>

                                                    {task.logs.length > 0 && (
                                                        <div style={{ borderTop: `1px solid ${isDark ? '#444' : '#f0f0f0'}`, paddingTop: 8 }}>
                                                            {task.logs.map((log: LogEntry) => {
                                                                const st = getLevelStatus(log.log_level);
                                                                const isHostResult = !!log.host;
                                                                return (
                                                                    <div key={log.id} style={{
                                                                        marginBottom: 4,
                                                                        fontSize: 13,
                                                                        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                                                                        display: 'flex',
                                                                        alignItems: 'flex-start',
                                                                        color: textColor
                                                                    }}>
                                                                        <div style={{ width: 24, paddingTop: 2, flexShrink: 0 }}>
                                                                            {isHostResult ? st.icon : (
                                                                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: st.color === 'error' ? '#ff4d4f' : isDark ? '#555' : '#ddd', marginTop: 6 }} />
                                                                            )}
                                                                        </div>
                                                                        <div style={{ flex: 1 }}>
                                                                            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                                                                {log.host && <Text type="secondary" style={{ marginRight: 8, minWidth: 100 }}>[{log.host}]</Text>}
                                                                                <span style={{
                                                                                    color: st.color === 'error' ? '#ff4d4f' : st.color === 'warning' ? '#faad14' : st.color === 'success' ? '#52c41a' : textColor,
                                                                                    wordBreak: 'break-all'
                                                                                }}>
                                                                                    {log.message}
                                                                                </span>
                                                                            </div>

                                                                            {/* Render STDOUT */}
                                                                            {log.details?.stdout && (
                                                                                <div style={{
                                                                                    marginTop: 4,
                                                                                    padding: 8,
                                                                                    background: isDark ? '#000' : '#fff',
                                                                                    border: `1px solid ${isDark ? '#333' : '#eee'}`,
                                                                                    borderRadius: 0,
                                                                                    color: isDark ? '#ccc' : '#666',
                                                                                    fontSize: 12,
                                                                                    whiteSpace: 'pre-wrap',
                                                                                    wordBreak: 'break-all'
                                                                                }}>
                                                                                    {log.details.stdout}
                                                                                </div>
                                                                            )}

                                                                            {/* Render STDERR (Independent of STDOUT) */}
                                                                            {log.details?.stderr && (
                                                                                <div style={{
                                                                                    marginTop: 4,
                                                                                    padding: 8,
                                                                                    background: isDark ? '#2a1215' : '#fff1f0',
                                                                                    border: `1px solid ${isDark ? '#5c1d25' : '#ffccc7'}`,
                                                                                    borderRadius: 0,
                                                                                    color: '#ff4d4f',
                                                                                    fontSize: 12,
                                                                                    whiteSpace: 'pre-wrap',
                                                                                    wordBreak: 'break-all'
                                                                                }}>
                                                                                    {log.details.stderr}
                                                                                </div>
                                                                            )}

                                                                            {/* Render Other Details (Generic) */}
                                                                            {Object.keys(log.details || {}).filter(k => k !== 'stdout' && k !== 'stderr' && k !== 'msg').length > 0 && (
                                                                                <div style={{
                                                                                    marginTop: 4,
                                                                                    padding: '4px 8px',
                                                                                    background: isDark ? '#1f1f1f' : '#f9f9f9',
                                                                                    border: `1px dashed ${isDark ? '#444' : '#d9d9d9'}`,
                                                                                    fontSize: 11,
                                                                                    color: isDark ? '#8c8c8c' : '#8c8c8c',
                                                                                    borderRadius: 0
                                                                                }}>
                                                                                    {Object.entries(log.details!).filter(([k]) => k !== 'stdout' && k !== 'stderr').map(([key, val]) => (
                                                                                        <div key={key} style={{ display: 'flex', gap: 8 }}>
                                                                                            <span style={{ fontWeight: 600 }}>{key}:</span>
                                                                                            <span style={{ wordBreak: 'break-all' }}>
                                                                                                {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                                                            </span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
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

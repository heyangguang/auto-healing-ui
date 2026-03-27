import React, { useMemo } from 'react';
import {
    Alert,
    Descriptions,
    Tag,
    Timeline,
    Typography,
} from 'antd';
import {
    BugOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';
import { normalizeNodeState } from '../utils/canvasBuilder';
import { INSTANCE_STATUS_LABELS } from '@/constants/instanceDicts';

type InstanceExecutionResultTabProps = {
    contextData: Record<string, unknown>;
    instance?: AutoHealing.FlowInstance | null;
    instanceStatus: string;
};

type TimelineEntry = {
    color: string;
    dot: React.ReactNode;
    key: string;
    message?: string;
    nodeName: string;
    statusKey: string;
    timeStr: string;
    durationStr: string;
};

const getInstanceStatusColor = (instanceStatus: string) => {
    if (instanceStatus === 'completed') return 'success';
    if (instanceStatus === 'failed') return 'error';
    if (instanceStatus === 'running') return 'processing';
    return 'default';
};

const getResultStatusColor = (status: string) => (
    status === 'failed' ? 'error' : 'success'
);

const formatDuration = (durationMs?: number) => {
    if (durationMs == null) return '';
    return durationMs >= 1000 ? `${(durationMs / 1000).toFixed(1)}s` : `${durationMs}ms`;
};

const buildTimelineEntries = (
    instance?: AutoHealing.FlowInstance | null,
): TimelineEntry[] => {
    if (!instance?.node_states) {
        return [];
    }

    return Object.entries(instance.node_states)
        .map(([nodeId, rawState]) => {
            const nodeState = normalizeNodeState(rawState);
            const statusKey = nodeState?.status || 'unknown';
            const isFailed = statusKey === 'failed' || statusKey === 'error' || statusKey === 'rejected';
            const isSuccess = statusKey === 'success' || statusKey === 'completed' || statusKey === 'approved';
            const isSkipped = statusKey === 'skipped';
            const timestamp = nodeState?.started_at || nodeState?.updated_at;
            return {
                color: isFailed ? 'red' : isSuccess ? 'green' : isSkipped ? 'gray' : 'blue',
                dot: isFailed
                    ? <CloseCircleOutlined style={{ fontSize: 14 }} />
                    : isSuccess
                        ? <CheckCircleOutlined style={{ fontSize: 14 }} />
                        : <ClockCircleOutlined style={{ fontSize: 14 }} />,
                key: nodeId,
                message: nodeState?.error_message || nodeState?.message,
                nodeName: instance.flow_nodes?.find((node) => node.id === nodeId)?.name || nodeId,
                statusKey,
                timeStr: timestamp
                    ? new Date(timestamp).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : '',
                durationStr: formatDuration(nodeState?.duration_ms),
            };
        })
        .sort((left, right) => {
            const leftTime = new Date(
                normalizeNodeState(instance.node_states?.[left.key])?.started_at
                || normalizeNodeState(instance.node_states?.[left.key])?.updated_at
                || 0,
            ).getTime();
            const rightTime = new Date(
                normalizeNodeState(instance.node_states?.[right.key])?.started_at
                || normalizeNodeState(instance.node_states?.[right.key])?.updated_at
                || 0,
            ).getTime();
            return leftTime - rightTime;
        });
};

const InstanceExecutionResultTab: React.FC<InstanceExecutionResultTabProps> = ({
    contextData,
    instance,
    instanceStatus,
}) => {
    const executionResult = contextData.execution_result as Record<string, unknown> | undefined;
    const timelineEntries = useMemo(
        () => buildTimelineEntries(instance),
        [instance],
    );
    const isFailed = executionResult?.status === 'failed' || instanceStatus === 'failed';
    const isSuccess = instanceStatus === 'completed' && !isFailed;
    const executionMessage = typeof executionResult?.message === 'string'
        ? executionResult.message
        : '';

    return (
        <div style={{ padding: 24 }}>
            {isFailed && Boolean(executionMessage) && (
                <Alert
                    type="error"
                    showIcon
                    icon={<BugOutlined />}
                    message="执行失败"
                    description={executionMessage}
                    style={{ marginBottom: 20 }}
                />
            )}
            {isSuccess && (
                <Alert
                    type="success"
                    showIcon
                    message="执行成功"
                    description={String(executionResult?.message || '流程已成功完成')}
                    style={{ marginBottom: 20 }}
                />
            )}
            <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="实例状态">
                    <Tag color={getInstanceStatusColor(instanceStatus)}>{instanceStatus}</Tag>
                </Descriptions.Item>
                {typeof executionResult?.status === 'string' && (
                    <Descriptions.Item label="执行结果状态">
                        <Tag color={getResultStatusColor(executionResult.status)}>{executionResult.status}</Tag>
                    </Descriptions.Item>
                )}
                {instance?.created_at && <Descriptions.Item label="触发时间">{instance.created_at}</Descriptions.Item>}
                {instance?.completed_at && <Descriptions.Item label="完成时间">{instance.completed_at}</Descriptions.Item>}
                {typeof executionResult?.started_at === 'string' && (
                    <Descriptions.Item label="执行开始">{executionResult.started_at}</Descriptions.Item>
                )}
                {typeof executionResult?.finished_at === 'string' && (
                    <Descriptions.Item label="执行结束">{executionResult.finished_at}</Descriptions.Item>
                )}
                {typeof executionResult?.duration_ms === 'number' && (
                    <Descriptions.Item label="执行耗时">{formatDuration(executionResult.duration_ms)}</Descriptions.Item>
                )}
                {typeof executionResult?.task_id === 'string' && (
                    <Descriptions.Item label="关联任务 ID">
                        <Typography.Text copyable style={{ fontFamily: 'monospace', fontSize: 12 }}>
                            {executionResult.task_id}
                        </Typography.Text>
                    </Descriptions.Item>
                )}
                {typeof executionResult?.target_hosts === 'string' && (
                    <Descriptions.Item label="目标主机" span={2}>{executionResult.target_hosts || '-'}</Descriptions.Item>
                )}
            </Descriptions>

            {timelineEntries.length > 0 && (
                <div style={{ marginTop: 24, borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#262626', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ClockCircleOutlined style={{ color: '#1890ff' }} />
                        执行时间线
                    </div>
                    <Timeline
                        items={timelineEntries.map((entry) => ({
                            color: entry.color,
                            dot: entry.dot,
                            children: (
                                <div style={{ paddingBottom: 4 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <Typography.Text strong style={{ fontSize: 13, color: '#262626' }}>{entry.nodeName}</Typography.Text>
                                        <Tag
                                            style={{
                                                margin: 0,
                                                border: 'none',
                                                fontSize: 11,
                                                background: entry.color === 'red' ? '#fff1f0' : entry.color === 'green' ? '#f6ffed' : entry.color === 'gray' ? '#f5f5f5' : '#e6f7ff',
                                                color: entry.color === 'red' ? '#ff4d4f' : entry.color === 'green' ? '#52c41a' : entry.color === 'gray' ? '#999' : '#1890ff',
                                            }}
                                        >
                                            {INSTANCE_STATUS_LABELS[entry.statusKey] || entry.statusKey}
                                        </Tag>
                                        {entry.timeStr && <Typography.Text type="secondary" style={{ fontSize: 11 }}>{entry.timeStr}</Typography.Text>}
                                        {entry.durationStr && <Typography.Text type="secondary" style={{ fontSize: 11 }}>耗时 {entry.durationStr}</Typography.Text>}
                                    </div>
                                    {entry.message && (
                                        <div
                                            style={{
                                                marginTop: 6,
                                                color: entry.color === 'red' ? '#ff4d4f' : '#8c8c8c',
                                                fontSize: 12,
                                                background: entry.color === 'red' ? '#fff1f0' : '#fafafa',
                                                padding: '4px 10px',
                                                borderRadius: 4,
                                                borderLeft: `2px solid ${entry.color === 'red' ? '#ff4d4f' : '#d9d9d9'}`,
                                            }}
                                        >
                                            {entry.message}
                                        </div>
                                    )}
                                </div>
                            ),
                        }))}
                    />
                </div>
            )}
        </div>
    );
};

export default InstanceExecutionResultTab;

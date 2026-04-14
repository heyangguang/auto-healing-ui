import React, { useMemo } from 'react';
import {
    CheckCircleFilled,
    ClockCircleOutlined,
    ExclamationCircleFilled,
    ReloadOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { Alert, Button, Collapse, Descriptions, Empty, Spin, Tag, Typography } from 'antd';
import type { FlowRecoveryAttempt } from '@/services/auto-healing/instances';

const { Text } = Typography;

type InstanceRecoveryAttemptsCardProps = {
    attempts: FlowRecoveryAttempt[];
    loading: boolean;
    mode?: 'page' | 'drawer';
    onRecover: () => void;
    recoverSubmitting: boolean;
    showRecoverAction: boolean;
};

const RECOVERY_ACTION_LABELS: Record<string, string> = {
    complete_instance: '补做收口',
    resume_approval: '恢复审批分支',
    resume_default: '继续默认分支',
    resume_execution: '恢复执行分支',
    resume_from_start: '从起点恢复',
    rerun_current_node: '重跑当前节点',
    wait_approval: '继续等待审批',
    wait_external_run: '继续等待外部执行',
    fail_instance: '失败收口',
};

const TRIGGER_SOURCE_LABELS: Record<string, string> = {
    manual: '人工触发',
    scheduler: '系统自动',
};

const STATUS_META: Record<FlowRecoveryAttempt['status'], {
    alertType: 'error' | 'info' | 'success' | 'warning';
    icon: React.ReactNode;
    label: string;
    tagColor: string;
}> = {
    failed: {
        alertType: 'error',
        icon: <ExclamationCircleFilled />,
        label: '恢复失败',
        tagColor: 'error',
    },
    skipped: {
        alertType: 'warning',
        icon: <SyncOutlined />,
        label: '无需动作',
        tagColor: 'default',
    },
    started: {
        alertType: 'info',
        icon: <SyncOutlined spin />,
        label: '恢复中',
        tagColor: 'processing',
    },
    success: {
        alertType: 'success',
        icon: <CheckCircleFilled />,
        label: '恢复成功',
        tagColor: 'success',
    },
};

function formatDateTime(value?: string | null) {
    if (!value) {
        return '-';
    }
    return new Date(value).toLocaleString('zh-CN');
}

function prettyJSON(value: unknown) {
    if (value == null) {
        return '-';
    }
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

function renderStatusTag(status: FlowRecoveryAttempt['status']) {
    const meta = STATUS_META[status];
    return (
        <Tag color={meta.tagColor} style={{ display: 'inline-flex', gap: 6, margin: 0 }}>
            {meta.icon}
            {meta.label}
        </Tag>
    );
}

export default function InstanceRecoveryAttemptsCard({
    attempts,
    loading,
    mode = 'page',
    onRecover,
    recoverSubmitting,
    showRecoverAction,
}: InstanceRecoveryAttemptsCardProps) {
    const latestAttempt = attempts[0];
    const summary = useMemo(() => {
        const counts = {
            failed: 0,
            skipped: 0,
            started: 0,
            success: 0,
        };
        attempts.forEach((attempt) => {
            counts[attempt.status] += 1;
        });
        return {
            latestStatus: latestAttempt?.status || null,
            total: attempts.length,
            ...counts,
        };
    }, [attempts, latestAttempt]);

    if (loading) {
        return (
            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'center', minHeight: 180 }}>
                <Spin />
            </div>
        );
    }

    return (
        <section>
            <div style={{ alignItems: 'flex-start', display: 'flex', gap: 16, justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                    <div style={{ color: '#262626', fontSize: 14, fontWeight: 600 }}>
                        {mode === 'drawer' ? '恢复记录' : '实例恢复'}
                    </div>
                    <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {mode === 'drawer'
                                ? '按时间查看系统或人工做过的恢复动作，需要时再手动补一次恢复。'
                                : '当流程卡住、收口中断或恢复执行断链时，这里会记录系统和人工做过的补救动作。'}
                        </Text>
                    </div>
                </div>
                {showRecoverAction ? (
                    <Button
                        type="primary"
                        icon={<ReloadOutlined />}
                        loading={recoverSubmitting}
                        onClick={onRecover}
                    >
                        恢复实例
                    </Button>
                ) : null}
            </div>
            {latestAttempt ? (
                <Alert
                    type={STATUS_META[latestAttempt.status].alertType}
                    showIcon
                    style={{ marginBottom: 16 }}
                    message={`${STATUS_META[latestAttempt.status].label} · ${RECOVERY_ACTION_LABELS[latestAttempt.recovery_action || ''] || latestAttempt.recovery_action || '恢复尝试'}`}
                    description={latestAttempt.detect_reason || '系统会根据当前节点的真实状态决定是续跑、补做收口还是等待外部结果。'}
                />
            ) : null}

            <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="总尝试">{summary.total}</Descriptions.Item>
                <Descriptions.Item label="最近状态">
                    {latestAttempt ? renderStatusTag(latestAttempt.status) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="成功">{summary.success}</Descriptions.Item>
                <Descriptions.Item label="失败">{summary.failed}</Descriptions.Item>
                <Descriptions.Item label="跳过">{summary.skipped}</Descriptions.Item>
                <Descriptions.Item label="恢复中">{summary.started}</Descriptions.Item>
                <Descriptions.Item label="最后发生">
                    {latestAttempt ? formatDateTime(latestAttempt.created_at) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="触发来源">
                    {latestAttempt ? (TRIGGER_SOURCE_LABELS[latestAttempt.trigger_source] || latestAttempt.trigger_source) : '-'}
                </Descriptions.Item>
            </Descriptions>

            {attempts.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无恢复记录"
                    style={{ marginTop: 32 }}
                />
            ) : (
                <div style={{ marginTop: 20 }}>
                    <div style={{ color: '#262626', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                        恢复时间线
                    </div>
                    <Collapse
                        size="small"
                        items={attempts.map((attempt) => ({
                            key: attempt.id,
                            label: (
                                <div style={{ minWidth: 0, paddingRight: 12 }}>
                                    <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        <Text strong>{RECOVERY_ACTION_LABELS[attempt.recovery_action || ''] || attempt.recovery_action || '恢复尝试'}</Text>
                                        {renderStatusTag(attempt.status)}
                                        <Tag color="blue" style={{ margin: 0 }}>
                                            {TRIGGER_SOURCE_LABELS[attempt.trigger_source] || attempt.trigger_source}
                                        </Tag>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                                            {formatDateTime(attempt.created_at)}
                                        </Text>
                                    </div>
                                    <div style={{ color: '#8c8c8c', fontSize: 12, lineHeight: 1.6, marginTop: 4 }}>
                                        {attempt.detect_reason || '未记录判定原因'}
                                    </div>
                                </div>
                            ),
                            children: (
                                <div>
                                    <Descriptions bordered size="small" column={2}>
                                        <Descriptions.Item label="当前节点">
                                            {attempt.current_node_id || '-'}
                                            {attempt.current_node_type ? ` (${attempt.current_node_type})` : ''}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="恢复动作">
                                            {RECOVERY_ACTION_LABELS[attempt.recovery_action || ''] || attempt.recovery_action || '-'}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="开始时间">{formatDateTime(attempt.started_at)}</Descriptions.Item>
                                        <Descriptions.Item label="结束时间">{formatDateTime(attempt.finished_at)}</Descriptions.Item>
                                    </Descriptions>
                                    {attempt.error_message ? (
                                        <Alert
                                            type="error"
                                            showIcon
                                            message="恢复失败信息"
                                            description={attempt.error_message}
                                            style={{ marginTop: 12 }}
                                        />
                                    ) : null}
                                    <div style={{ marginTop: 12 }}>
                                        <Text strong>恢复细节</Text>
                                        <pre className="instance-recovery-code">{prettyJSON(attempt.details)}</pre>
                                    </div>
                                </div>
                            ),
                        }))}
                    />
                </div>
            )}
        </section>
    );
}

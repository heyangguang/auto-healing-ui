import React from 'react';
import {
    BellOutlined,
    BranchesOutlined,
    DashboardOutlined,
    DesktopOutlined,
    FileTextOutlined,
    KeyOutlined,
    LinkOutlined,
    RocketOutlined,
    SettingOutlined,
    ThunderboltOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Alert, Space, Statistic, Tag, Tooltip, Typography } from 'antd';
import { getExecutionTriggeredByConfig, getExecutorConfig } from '@/constants/executionDicts';
import { hasEffectiveNotificationConfig } from '@/utils/notificationConfig';
import dayjs from 'dayjs';
import { Field, SectionTitle } from './runDetailShared';

const { Text } = Typography;

interface RunDetailSidebarProps {
    accessCanExecuteTask: boolean;
    run?: AutoHealing.ExecutionRun;
    secretsSources: AutoHealing.SecretsSource[];
    successRate: number;
    totalTasks: number;
    onLaunchpad: () => void;
    onOpenDrawer: (type: 'task' | 'playbook') => void;
}

function splitHosts(hosts?: string) {
    return hosts?.split(',').map((host) => host.trim()).filter(Boolean) || [];
}

const RunDetailSidebar: React.FC<RunDetailSidebarProps> = ({
    accessCanExecuteTask,
    run,
    secretsSources,
    successRate,
    totalTasks,
    onLaunchpad,
    onOpenDrawer,
}) => {
    const stats = run?.stats || { ok: 0, changed: 0, failed: 0, unreachable: 0, skipped: 0 };
    const runtimeHosts = splitHosts(run?.runtime_target_hosts);
    const triggeredBy = getExecutionTriggeredByConfig(run?.triggered_by);
    const executor = getExecutorConfig(run?.task?.executor_type);

    return (
        <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
            <div className="industrial-dashed-box">
                <SectionTitle icon={<RocketOutlined />} title="基本信息 / BASIC INFO" />
                <Field label="任务模板">
                    <a onClick={() => onOpenDrawer('task')} style={{ cursor: 'pointer' }}>
                        {run?.task?.name || 'Unknown'}
                    </a>
                    <Tooltip title="跳转到发射台">
                        <RocketOutlined
                            style={{ marginLeft: 6, color: '#1890ff', cursor: 'pointer', fontSize: 11 }}
                            onClick={(event) => {
                                event.stopPropagation();
                                if (!accessCanExecuteTask) {
                                    return;
                                }
                                onLaunchpad();
                            }}
                        />
                    </Tooltip>
                </Field>
                <Field label="触发方式">
                    <Tag icon={<UserOutlined />} color={triggeredBy.tagColor || triggeredBy.color} style={{ margin: 0 }}>{triggeredBy.label}</Tag>
                </Field>
                <Field label="开始时间">{run?.started_at ? dayjs(run.started_at).format('YYYY-MM-DD HH:mm:ss') : '-'}</Field>
                <Field label="结束时间">{run?.completed_at ? dayjs(run.completed_at).format('YYYY-MM-DD HH:mm:ss') : '-'}</Field>
            </div>

            {run?.error_message && (
                <Alert message="执行错误" description={run.error_message} type="error" showIcon style={{ fontSize: 12 }} />
            )}

            <div className="industrial-dashed-box">
                <SectionTitle icon={<LinkOutlined />} title="关联信息 / ASSOCIATIONS" />
                <Field label="Playbook">
                    {run?.task?.playbook ? (
                        <a onClick={() => onOpenDrawer('playbook')} style={{ cursor: 'pointer' }}>
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
                    <Tag
                        icon={<ThunderboltOutlined />}
                        color={executor.tagColor || executor.color}
                        style={{ margin: 0, fontSize: 11 }}
                    >
                        {executor.label}
                    </Tag>
                </Field>
                <Field label="通知">
                    {hasEffectiveNotificationConfig(run?.task?.notification_config as never) ? (
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

            <div className="industrial-dashed-box">
                <SectionTitle icon={<SettingOutlined />} title="运行时参数 / RUNTIME" />
                <Field label="目标主机">
                    {runtimeHosts.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {runtimeHosts.map((host) => (
                                <Tag key={host} style={{ margin: 0, fontSize: 11 }}>
                                    <DesktopOutlined style={{ marginRight: 4 }} />
                                    {host}
                                </Tag>
                            ))}
                        </div>
                    ) : <Text type="secondary" style={{ fontSize: 12 }}>使用模板默认</Text>}
                </Field>
                <Field label="密钥源">
                    {run?.runtime_secrets_source_ids?.length ? (
                        <Space size={4} wrap>
                            {run.runtime_secrets_source_ids.map((sourceId) => {
                                const source = secretsSources.find((item) => item.id === sourceId);
                                return (
                                    <Tag key={sourceId} color="blue" style={{ margin: 0, fontSize: 11 }}>
                                        <KeyOutlined style={{ marginRight: 4 }} />
                                        {source?.name || sourceId.substring(0, 8)}
                                    </Tag>
                                );
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

            <div className="industrial-dashed-box">
                <SectionTitle icon={<DashboardOutlined />} title="执行统计 / STATS" />
                <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                    <Statistic
                        title="成功率"
                        value={successRate}
                        suffix="%"
                        styles={{ content: { fontSize: 22, color: successRate === 100 ? '#3f8600' : successRate < 60 ? '#cf1322' : '#faad14' } }}
                    />
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
    );
};

export default RunDetailSidebar;

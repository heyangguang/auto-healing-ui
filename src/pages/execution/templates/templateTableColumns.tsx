import {
    BellOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CodeOutlined,
    ContainerOutlined,
    DeleteOutlined,
    DesktopOutlined,
    EditOutlined,
    ExclamationCircleOutlined,
    EyeOutlined,
    KeyOutlined,
    PlayCircleOutlined,
    ProjectOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import { history as appHistory } from '@umijs/max';
import {
    Button,
    Popconfirm,
    Space,
    Tag,
    Tooltip,
    Typography,
} from 'antd';
import type { StandardColumnDef } from '@/components/StandardTable';
import { getExecutorConfig, getExecutorOptions } from '@/constants/executionDicts';
import { hasEffectiveNotificationConfig } from '@/utils/notificationConfig';
import { ExecutorIcon } from './TemplateIcons';
import { type ExecutionTaskRecord, getChangedVariableName, getTaskHosts } from './templateListHelpers';

const { Text: TypographyText } = Typography;

type TemplateTableAccess = {
    canDeleteTask: boolean;
    canExecuteTask: boolean;
    canUpdateTask: boolean;
};

type CreateTemplateColumnsOptions = {
    access: TemplateTableAccess;
    onDelete: (id: string) => void;
    onOpenDetail: (record: ExecutionTaskRecord) => void;
    playbooks: AutoHealing.Playbook[];
};

export function createTemplateColumns({
    access,
    onDelete,
    onOpenDetail,
    playbooks,
}: CreateTemplateColumnsOptions): StandardColumnDef<ExecutionTaskRecord>[] {
    return [
        {
            columnKey: 'name',
            columnTitle: '模板',
            sorter: true,
            width: 340,
            render: (_, record) => {
                const executor = getExecutorConfig(record.executor_type);
                const playbook = playbooks.find((item) => item.id === record.playbook_id);
                const hosts = getTaskHosts(record);
                const configuredCount = Object.keys(record.extra_vars || {}).length;
                const scheduleCount = record.schedule_count || 0;

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Tooltip title={`${executor.label} 执行`}>
                            <ExecutorIcon executorType={record.executor_type} />
                        </Tooltip>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                                <span style={{ fontWeight: 600, color: '#262626', fontSize: 13.5 }}>{record.name}</span>
                                {record.needs_review && (
                                    <Tooltip
                                        title={(
                                            <div>
                                                Playbook 变量发生变更
                                                <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                                                    变更变量: {record.changed_variables?.map(getChangedVariableName).join(', ') || '—'}
                                                </div>
                                            </div>
                                        )}
                                    >
                                        <Tag color="error" style={{ margin: 0, fontSize: 11, lineHeight: '18px', cursor: 'help', padding: '0 6px' }}>
                                            <ExclamationCircleOutlined style={{ marginRight: 3 }} />需审核
                                        </Tag>
                                    </Tooltip>
                                )}
                                {scheduleCount > 0 && (
                                    <Tooltip title={`关联 ${scheduleCount} 个调度任务`}>
                                        <Tag color="purple" variant="filled" style={{ margin: 0, fontSize: 11, lineHeight: '18px', padding: '0 6px', cursor: 'default' }}>
                                            <ClockCircleOutlined style={{ marginRight: 3 }} />{scheduleCount}
                                        </Tag>
                                    </Tooltip>
                                )}
                            </div>
                            <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <ProjectOutlined style={{ marginRight: 3 }} />{playbook?.name || record.playbook_id?.slice(0, 8)}
                                {hosts.length > 0 && <> · <DesktopOutlined style={{ marginRight: 3 }} />{hosts.length} 主机</>}
                                {configuredCount > 0 && <> · <SettingOutlined style={{ marginRight: 3 }} />{configuredCount} 参数</>}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            columnKey: 'executor',
            columnTitle: '执行环境',
            width: 150,
            headerFilters: getExecutorOptions().map(item => ({ label: item.label, value: item.value })),
            render: (_, record) => {
                const executor = getExecutorConfig(record.executor_type);
                const hosts = getTaskHosts(record);
                const hasNotify = hasEffectiveNotificationConfig(record.notification_config);
                const hasSecrets = (record.secrets_source_ids?.length ?? 0) > 0;

                return (
                    <Space orientation="vertical" size={0}>
                        <Tag
                            icon={record.executor_type === 'docker' ? <ContainerOutlined /> : <CodeOutlined />}
                            color={executor.tagColor || executor.color}
                            style={{ fontSize: 12, margin: 0 }}
                        >
                            {executor.label}
                        </Tag>
                        <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {hosts.length > 0 && (
                                <Tooltip title={hosts.join(', ')}>
                                    <Tag variant="filled" style={{ fontSize: 11, margin: 0, padding: '0 4px', color: '#52c41a', background: '#f6ffed', cursor: 'default' }}>
                                        <DesktopOutlined /> {hosts.length}
                                    </Tag>
                                </Tooltip>
                            )}
                            {hasSecrets && (
                                <Tooltip title="已配置凭据">
                                    <Tag variant="filled" style={{ fontSize: 11, margin: 0, padding: '0 4px', color: '#fa8c16', background: '#fff7e6', cursor: 'default' }}>
                                        <KeyOutlined />
                                    </Tag>
                                </Tooltip>
                            )}
                            {hasNotify && (
                                <Tooltip title="已配置通知">
                                    <Tag variant="filled" style={{ fontSize: 11, margin: 0, padding: '0 4px', color: '#1890ff', background: '#e6f7ff', cursor: 'default' }}>
                                        <BellOutlined />
                                    </Tag>
                                </Tooltip>
                            )}
                        </div>
                    </Space>
                );
            },
        },
        {
            columnKey: 'playbook',
            columnTitle: 'Playbook',
            width: 180,
            render: (_, record) => {
                const playbook = playbooks.find((item) => item.id === record.playbook_id);
                const variablesCount = record.playbook_variables_snapshot?.length ?? playbook?.variables?.length ?? playbook?.variables_count ?? 0;
                const configuredCount = Object.keys(record.extra_vars || {}).length;
                const isReady = playbook?.status === 'ready';

                return (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span
                                style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: '50%',
                                    background: isReady ? '#52c41a' : '#faad14',
                                    display: 'inline-block',
                                    flexShrink: 0,
                                }}
                            />
                            <TypographyText style={{ fontSize: 13, fontWeight: 500 }} ellipsis={{ tooltip: playbook?.name || record.playbook_id }}>
                                {playbook?.name || record.playbook_id?.slice(0, 8)}
                            </TypographyText>
                        </div>
                        <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2, paddingLeft: 13 }}>
                            <SettingOutlined style={{ marginRight: 3, fontSize: 10 }} />
                            {configuredCount}/{variablesCount} 参数已配置
                        </div>
                    </div>
                );
            },
        },
        {
            columnKey: 'needs_review',
            columnTitle: '状态',
            width: 100,
            headerFilters: [
                { label: '需审核', value: 'true' },
                { label: '正常', value: 'false' },
            ],
            render: (_, record) => (
                record.needs_review ? (
                    <Tooltip title={`变更变量: ${record.changed_variables?.map(getChangedVariableName).join(', ') || '—'}`}>
                        <Tag color="error" style={{ margin: 0, fontSize: 11, cursor: 'help' }}>
                            <ExclamationCircleOutlined style={{ marginRight: 3 }} />需审核
                        </Tag>
                    </Tooltip>
                ) : (
                    <Tag color="success" style={{ margin: 0, fontSize: 11 }}>
                        <CheckCircleOutlined style={{ marginRight: 3 }} />正常
                    </Tag>
                )
            ),
        },
        {
            columnKey: 'updated_at',
            columnTitle: '更新',
            dataIndex: 'updated_at',
            width: 110,
            sorter: true,
            render: (value: string) => {
                if (!value) {
                    return '-';
                }
                const updatedAt = new Date(value);
                const now = new Date();
                const diff = now.getTime() - updatedAt.getTime();
                const minutes = Math.floor(diff / 60000);
                let text = '';
                if (minutes < 1) text = '刚刚';
                else if (minutes < 60) text = `${minutes} 分钟前`;
                else {
                    const hours = Math.floor(minutes / 60);
                    if (hours < 24) text = `${hours} 小时前`;
                    else {
                        const days = Math.floor(hours / 24);
                        text = days < 30 ? `${days} 天前` : updatedAt.toLocaleDateString();
                    }
                }
                return (
                    <Tooltip title={updatedAt.toLocaleString()}>
                        <TypographyText type="secondary" style={{ fontSize: 12 }}>
                            <ClockCircleOutlined style={{ marginRight: 4, fontSize: 11 }} />{text}
                        </TypographyText>
                    </Tooltip>
                );
            },
        },
        {
            columnKey: 'actions',
            columnTitle: '操作',
            width: 160,
            render: (_, record) => {
                const playbook = playbooks.find((item) => item.id === record.playbook_id);
                const canExecute = !record.needs_review && playbook?.status === 'ready';
                const scheduleCount = record.schedule_count || 0;
                const hasSchedules = scheduleCount > 0;

                return (
                    <Space size="small" onClick={(event) => event.stopPropagation()}>
                        <Tooltip title="查看详情">
                            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => onOpenDetail(record)} />
                        </Tooltip>
                        <Tooltip title={record.needs_review ? '需确认变更后方可执行' : !playbook || playbook.status !== 'ready' ? 'Playbook 未就绪' : '执行'}>
                            <Button
                                type="link"
                                size="small"
                                icon={<PlayCircleOutlined style={{ color: canExecute ? '#52c41a' : undefined }} />}
                                disabled={!canExecute || !access.canExecuteTask}
                                onClick={() => appHistory.push(`/execution/execute?template=${record.id}`)}
                            />
                        </Tooltip>
                        <Tooltip title="编辑">
                            <Button
                                type="link"
                                size="small"
                                icon={<EditOutlined />}
                                disabled={!access.canUpdateTask}
                                onClick={() => appHistory.push(`/execution/templates/${record.id}/edit`)}
                            />
                        </Tooltip>
                        <Popconfirm
                            title={hasSchedules ? <span>无法删除：关联 <b>{scheduleCount}</b> 个调度</span> : '确定删除该模板？'}
                            onConfirm={() => onDelete(record.id)}
                            okButtonProps={{ disabled: hasSchedules }}
                            description={hasSchedules ? '请先删除关联的调度任务' : undefined}
                        >
                            <Button type="link" size="small" danger icon={<DeleteOutlined />} disabled={hasSchedules || !access.canDeleteTask} />
                        </Popconfirm>
                    </Space>
                );
            },
        },
    ];
}

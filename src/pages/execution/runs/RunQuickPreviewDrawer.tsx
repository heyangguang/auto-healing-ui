import React from 'react';
import {
    BellOutlined,
    BranchesOutlined,
    CodeOutlined,
    DesktopOutlined,
    FileTextOutlined,
    KeyOutlined,
    PlayCircleOutlined,
    SettingOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import { Button, Drawer, Space, Tag, Typography } from 'antd';
import { getEnabledNotificationTriggers, hasEffectiveNotificationConfig } from '@/utils/notificationConfig';
import dayjs from 'dayjs';
import { Field, getNotificationTriggerLabel, SectionTitle } from './runDetailShared';

const { Text } = Typography;

interface RunQuickPreviewDrawerProps {
    accessCanExecuteTask: boolean;
    drawerType: 'task' | 'playbook' | null;
    run?: AutoHealing.ExecutionRun;
    secretsSources: AutoHealing.SecretsSource[];
    onClose: () => void;
    onLaunchpad: () => void;
}

function splitHosts(hosts?: string) {
    return hosts?.split(',').map((host) => host.trim()).filter(Boolean) || [];
}

const RunQuickPreviewDrawer: React.FC<RunQuickPreviewDrawerProps> = ({
    accessCanExecuteTask,
    drawerType,
    run,
    secretsSources,
    onClose,
    onLaunchpad,
}) => {
    const task = run?.task;
    const playbook = run?.task?.playbook;
    const taskHosts = splitHosts(task?.target_hosts);

    return (
        <Drawer
            open={drawerType !== null}
            onClose={onClose}
            size={520}
            title={(
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {drawerType === 'task' ? <SettingOutlined /> : <FileTextOutlined />}
                    <span>{drawerType === 'task' ? '任务模板详情' : 'Playbook 详情'}</span>
                </div>
            )}
            extra={drawerType === 'task' && run?.task_id ? (
                <Button size="small" icon={<PlayCircleOutlined />} disabled={!accessCanExecuteTask} onClick={onLaunchpad}>
                    发射台
                </Button>
            ) : null}
        >
            {drawerType === 'task' && task && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="industrial-dashed-box">
                        <SectionTitle icon={<SettingOutlined />} title="基本信息 / BASIC INFO" />
                        <Field label="模板名称">{task.name}</Field>
                        {task.description && (
                            <Field label="描述">
                                <Text style={{ fontSize: 12, color: '#595959' }}>{task.description}</Text>
                            </Field>
                        )}
                        <Field label="任务 ID">
                            <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>#{run.task_id?.substring(0, 8)}</Text>
                        </Field>
                        <Field label="执行器">
                            <Tag icon={<ThunderboltOutlined />} color={task.executor_type === 'docker' ? 'blue' : 'default'} style={{ margin: 0, fontSize: 11 }}>
                                {task.executor_type || 'local'}
                            </Tag>
                        </Field>
                        <Field label="创建时间">{dayjs(task.created_at).format('YYYY-MM-DD HH:mm:ss')}</Field>
                        <Field label="更新时间">{dayjs(task.updated_at).format('YYYY-MM-DD HH:mm:ss')}</Field>
                    </div>

                    <div className="industrial-dashed-box">
                        <SectionTitle icon={<DesktopOutlined />} title="目标配置 / TARGETS" />
                        <Field label="目标主机">
                            {taskHosts.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {taskHosts.map((host) => (
                                        <Tag key={host} style={{ margin: 0, fontSize: 11 }}>
                                            <DesktopOutlined style={{ marginRight: 4 }} />
                                            {host}
                                        </Tag>
                                    ))}
                                </div>
                            ) : <Text type="secondary" style={{ fontSize: 12 }}>未配置</Text>}
                        </Field>
                        <Field label="密钥源">
                            {task.secrets_source_ids?.length ? (
                                <Space size={4} wrap>
                                    {task.secrets_source_ids.map((sourceId) => {
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
                    </div>

                    <div className="industrial-dashed-box">
                        <SectionTitle icon={<BellOutlined />} title="通知配置 / NOTIFICATION" />
                        <Field label="通知状态">
                            {hasEffectiveNotificationConfig(task.notification_config as never) ? (
                                <Tag icon={<BellOutlined />} color="green" style={{ margin: 0, fontSize: 11 }}>已启用</Tag>
                            ) : (
                                <Tag style={{ margin: 0, fontSize: 11 }} color="default">未启用</Tag>
                            )}
                        </Field>
                        {getEnabledNotificationTriggers(task.notification_config as never).length > 0 && (
                            <Field label="触发条件">
                                <Space size={4} wrap>
                                    {getEnabledNotificationTriggers(task.notification_config as never).map((trigger) => (
                                        <Tag key={trigger} style={{ margin: 0, fontSize: 11 }}>
                                            {getNotificationTriggerLabel(trigger)}
                                        </Tag>
                                    ))}
                                </Space>
                            </Field>
                        )}
                    </div>

                    {task.extra_vars && Object.keys(task.extra_vars).length > 0 && (
                        <div className="industrial-dashed-box">
                            <SectionTitle icon={<CodeOutlined />} title="额外变量 / EXTRA VARS" />
                            <pre style={{
                                margin: 0,
                                fontSize: 12,
                                background: '#1e1e1e',
                                color: '#d4d4d4',
                                padding: 12,
                                borderRadius: 4,
                                overflow: 'auto',
                                maxHeight: 200,
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                            }}
                            >
                                {JSON.stringify(task.extra_vars, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}

            {drawerType === 'playbook' && playbook && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="industrial-dashed-box">
                        <SectionTitle icon={<FileTextOutlined />} title="基本信息 / BASIC INFO" />
                        <Field label="名称">{playbook.name}</Field>
                        <Field label="文件路径">
                            <code style={{ fontSize: 11, background: '#f0f0f0', padding: '1px 6px' }}>{playbook.file_path}</code>
                        </Field>
                        <Field label="配置模式">
                            <Tag style={{ margin: 0, fontSize: 11 }} color={playbook.config_mode === 'enhanced' ? 'blue' : 'default'}>
                                {playbook.config_mode || 'auto'}
                            </Tag>
                        </Field>
                        <Field label="状态">
                            <Tag style={{ margin: 0, fontSize: 11 }} color={playbook.status === 'ready' ? 'green' : playbook.status === 'error' ? 'red' : 'default'}>
                                {playbook.status}
                            </Tag>
                        </Field>
                        {playbook.description && (
                            <Field label="描述">
                                <Text style={{ fontSize: 12, color: '#595959' }}>{playbook.description}</Text>
                            </Field>
                        )}
                        <Field label="Playbook ID">
                            <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>#{playbook.id?.substring(0, 8)}</Text>
                        </Field>
                    </div>

                    {playbook.repository && (
                        <div className="industrial-dashed-box">
                            <SectionTitle icon={<BranchesOutlined />} title="Git 仓库 / REPOSITORY" />
                            <Field label="仓库名称">{playbook.repository.name}</Field>
                            <Field label="默认分支">
                                <Tag icon={<BranchesOutlined />} style={{ margin: 0, fontSize: 11 }}>
                                    {playbook.repository.default_branch || 'main'}
                                </Tag>
                            </Field>
                            <Field label="仓库地址">
                                <Text copyable style={{ fontSize: 11, fontFamily: 'monospace' }}>{playbook.repository.url}</Text>
                            </Field>
                            <Field label="同步状态">
                                <Tag style={{ margin: 0, fontSize: 11 }} color={playbook.repository.status === 'ready' ? 'green' : 'orange'}>
                                    {playbook.repository.status}
                                </Tag>
                            </Field>
                        </div>
                    )}

                    {playbook.variables?.length ? (
                        <div className="industrial-dashed-box">
                            <SectionTitle icon={<CodeOutlined />} title={`变量定义 / VARIABLES (${playbook.variables.length})`} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {playbook.variables.map((variable) => (
                                    <div key={variable.name} style={{
                                        padding: '6px 10px',
                                        background: '#fafafa',
                                        border: '1px solid #e8e8e8',
                                        borderRadius: 4,
                                        fontSize: 12,
                                    }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{variable.name}</span>
                                            <Space size={4}>
                                                <Tag style={{ margin: 0, fontSize: 10 }}>{variable.type}</Tag>
                                                {variable.required && <Tag color="red" style={{ margin: 0, fontSize: 10 }}>必填</Tag>}
                                            </Space>
                                        </div>
                                        {variable.description && (
                                            <div style={{ color: '#8c8c8c', fontSize: 11, marginTop: 2 }}>{variable.description}</div>
                                        )}
                                        {variable.default !== undefined && variable.default !== null && (
                                            <div style={{ marginTop: 2, fontSize: 11 }}>
                                                <Text type="secondary">默认值：</Text>
                                                <code style={{ fontSize: 11, background: '#f0f0f0', padding: '1px 4px' }}>{String(variable.default)}</code>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {playbook.last_scanned_at && (
                        <div style={{ fontSize: 11, color: '#8c8c8c', textAlign: 'center', padding: '4px 0' }}>
                            最后扫描于 {dayjs(playbook.last_scanned_at).format('YYYY-MM-DD HH:mm:ss')}
                        </div>
                    )}
                </div>
            )}
        </Drawer>
    );
};

export default RunQuickPreviewDrawer;

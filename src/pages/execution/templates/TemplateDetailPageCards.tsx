import {
    BellOutlined,
    DesktopOutlined,
    FileTextOutlined,
    GlobalOutlined,
    KeyOutlined,
    SettingOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import { Divider, Empty, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import NotificationConfigDisplay from '@/components/NotificationSelector/NotificationConfigDisplay';
import { getExecutorConfig } from '@/constants/executionDicts';
import { DockerExecIcon, LocalExecIcon } from './TemplateIcons';
import {
    formatVariableDisplayValue,
    getPlaybookVariables,
} from './templateVariableHelpers';
const { Text } = Typography;
function DetailCard(props: React.PropsWithChildren) {
    return <div className="tpl-detail-card">{props.children}</div>;
}
function BasicInfoCard({ task }: { task: AutoHealing.ExecutionTask }) {
    return (
        <DetailCard>
            <h4 className="tpl-detail-section-title">
                <ThunderboltOutlined />基础信息
            </h4>
            <div className="tpl-detail-field-grid">
                <div className="tpl-detail-field">
                    <span className="tpl-detail-field-label">模板名称</span>
                    <span className="tpl-detail-field-value">{task.name}</span>
                </div>
                <div className="tpl-detail-field">
                    <span className="tpl-detail-field-label">关联 Playbook</span>
                    <span className="tpl-detail-field-value">
                        <PlaybookValue task={task} />
                    </span>
                </div>
                <div className="tpl-detail-field">
                    <span className="tpl-detail-field-label">执行器类型</span>
                    <span className="tpl-detail-field-value">
                        <ExecutorTypeValue executorType={task.executor_type} />
                    </span>
                </div>
                <div className="tpl-detail-field">
                    <span className="tpl-detail-field-label">创建时间</span>
                    <span className="tpl-detail-field-value">
                        {dayjs(task.created_at).format('YYYY-MM-DD HH:mm:ss')}
                    </span>
                </div>
            </div>

            {task.description && (
                <>
                    <Divider style={{ margin: '14px 0' }} dashed />
                    <div className="tpl-detail-field">
                        <span className="tpl-detail-field-label">描述</span>
                        <span className="tpl-detail-field-value" style={{ color: '#595959', fontWeight: 400 }}>
                            {task.description}
                        </span>
                    </div>
                </>
            )}
        </DetailCard>
    );
}
function PlaybookValue({ task }: { task: AutoHealing.ExecutionTask }) {
    if (!task.playbook) {
        return <Text type="secondary">未关联</Text>;
    }
    return (
        <Space size={6}>
            <FileTextOutlined style={{ color: '#1890ff' }} />
            <span style={{ fontWeight: 600 }}>{task.playbook.name}</span>
            {task.playbook.file_path && (
                <code style={{ fontSize: 11, background: '#f5f5f5', padding: '2px 6px', color: '#595959' }}>
                    {task.playbook.file_path}
                </code>
            )}
        </Space>
    );
}
function ExecutorTypeValue({ executorType }: { executorType?: AutoHealing.ExecutorType }) {
    const executor = getExecutorConfig(executorType);
    const isDocker = executorType === 'docker';
    return (
        <Space size={6}>
            {isDocker ? <DockerExecIcon size={14} /> : <LocalExecIcon size={14} />}
            <span>{executor.label}</span>
        </Space>
    );
}

function EnvironmentCard({ hosts }: { hosts: string[] }) {
    return (
        <DetailCard>
            <h4 className="tpl-detail-section-title">
                <GlobalOutlined />执行环境
            </h4>

            <div className="tpl-detail-field">
                <span className="tpl-detail-field-label">目标主机 ({hosts.length})</span>
                <span className="tpl-detail-field-value">
                    {hosts.length > 0 ? <HostsValue hosts={hosts} /> : <Text type="secondary" style={{ fontSize: 12 }}>未配置</Text>}
                </span>
            </div>
        </DetailCard>
    );
}

function HostsValue({ hosts }: { hosts: string[] }) {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {hosts.map((host) => (
                <Tag key={host} style={{ margin: 0, fontSize: 11 }}>
                    <DesktopOutlined style={{ marginRight: 4 }} />
                    {host.trim()}
                </Tag>
            ))}
        </div>
    );
}

function SecretsCard(props: {
    secretsSources: AutoHealing.SecretsSource[];
    task: AutoHealing.ExecutionTask;
}) {
    const { secretsSources, task } = props;
    return (
        <DetailCard>
            <h4 className="tpl-detail-section-title">
                <KeyOutlined />凭据配置
            </h4>

            <div className="tpl-detail-field">
                <span className="tpl-detail-field-label">密钥源</span>
                <span className="tpl-detail-field-value">
                    {task.secrets_source_ids?.length ? (
                        <Space size={4} wrap>
                            {task.secrets_source_ids.map((sourceId) => (
                                <Tag key={sourceId} color="blue" style={{ margin: 0, fontSize: 11 }}>
                                    <KeyOutlined style={{ marginRight: 4 }} />
                                    {resolveSecretName(sourceId, secretsSources)}
                                </Tag>
                            ))}
                        </Space>
                    ) : <Text type="secondary" style={{ fontSize: 12 }}>未指定</Text>}
                </span>
            </div>
        </DetailCard>
    );
}

function resolveSecretName(
    sourceId: string,
    secretsSources: AutoHealing.SecretsSource[],
) {
    const source = secretsSources.find((item) => item.id === sourceId);
    return source?.name || sourceId.substring(0, 8);
}

function VariablesCard({ task }: { task: AutoHealing.ExecutionTask }) {
    const extraVars = task.extra_vars || {};
    const configuredCount = Object.keys(extraVars).length;
    const playbookVariables = getPlaybookVariables(task.playbook);

    return (
        <DetailCard>
            <h4 className="tpl-detail-section-title">
                <SettingOutlined />变量配置
                <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 400, color: '#8c8c8c' }}>
                    {configuredCount + playbookVariables.length > 0
                        ? `${configuredCount} 已配置 / ${playbookVariables.length} 定义`
                        : ''}
                </span>
            </h4>

            {configuredCount > 0 && <ExtraVarsSection extraVars={extraVars as Record<string, unknown>} />}
            {playbookVariables.length > 0 && <PlaybookVarsSection playbookVariables={playbookVariables} />}
            {configuredCount === 0 && playbookVariables.length === 0 && (
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无变量配置" />
                </div>
            )}
        </DetailCard>
    );
}

function ExtraVarsSection({ extraVars }: { extraVars: Record<string, unknown> }) {
    return (
        <div style={{ marginBottom: 20 }}>
            <div className="tpl-detail-subsection-title">
                <SettingOutlined /> 额外变量 (Extra Vars)
                <Tag style={{ margin: '0 0 0 8px', fontSize: 10 }}>
                    {Object.keys(extraVars).length}
                </Tag>
            </div>
            <pre className="tpl-detail-code-block">
                {JSON.stringify(extraVars, null, 2)}
            </pre>
        </div>
    );
}

function PlaybookVarsSection(props: {
    playbookVariables: ReturnType<typeof getPlaybookVariables>;
}) {
    const { playbookVariables } = props;
    return (
        <div>
            <div className="tpl-detail-subsection-title">
                <FileTextOutlined /> Playbook 变量
                <Tag style={{ margin: '0 0 0 8px', fontSize: 10 }}>{playbookVariables.length}</Tag>
            </div>
            <div className="tpl-detail-var-list">
                {playbookVariables.map((variable) => (
                    <div key={variable.name} className="tpl-detail-var-item">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 600, fontFamily: "'SFMono-Regular', Consolas, monospace", fontSize: 12 }}>
                                {variable.name}
                            </span>
                            <Space size={4}>
                                <Tag style={{ margin: 0, fontSize: 10 }}>{variable.type}</Tag>
                                {variable.required && <Tag color="red" style={{ margin: 0, fontSize: 10 }}>必填</Tag>}
                            </Space>
                        </div>
                        {variable.description && (
                            <div style={{ color: '#8c8c8c', fontSize: 11, marginTop: 4 }}>
                                {variable.description}
                            </div>
                        )}
                        {variable.default !== undefined && variable.default !== null && (
                            <div style={{ marginTop: 4, fontSize: 11 }}>
                                <Text type="secondary">默认值：</Text>
                                <code style={{ fontSize: 11, background: '#f5f5f5', padding: '1px 4px' }}>
                                    {formatVariableDisplayValue(variable.default)}
                                </code>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function NotificationCard(props: {
    channels: AutoHealing.NotificationChannel[];
    task: AutoHealing.ExecutionTask;
    templates: AutoHealing.NotificationTemplate[];
}) {
    const { channels, task, templates } = props;

    return (
        <DetailCard>
            <h4 className="tpl-detail-section-title">
                <BellOutlined />通知配置
            </h4>
            <NotificationConfigDisplay
                value={task.notification_config as never}
                channels={channels}
                templates={templates}
            />
        </DetailCard>
    );
}

interface TemplateDetailPageCardsProps {
    channels: AutoHealing.NotificationChannel[];
    secretsSources: AutoHealing.SecretsSource[];
    task: AutoHealing.ExecutionTask;
    templates: AutoHealing.NotificationTemplate[];
}

const TemplateDetailPageCards: React.FC<TemplateDetailPageCardsProps> = ({
    channels,
    secretsSources,
    task,
    templates,
}) => {
    const hosts = task.target_hosts ? task.target_hosts.split(',') : [];

    return (
        <>
            <BasicInfoCard task={task} />
            <EnvironmentCard hosts={hosts} />
            <SecretsCard task={task} secretsSources={secretsSources} />
            <VariablesCard task={task} />
            <NotificationCard task={task} channels={channels} templates={templates} />
        </>
    );
};

export default TemplateDetailPageCards;

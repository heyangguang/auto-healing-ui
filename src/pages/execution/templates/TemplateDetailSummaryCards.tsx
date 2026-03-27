import {
    BellOutlined,
    CheckCircleOutlined,
    DesktopOutlined,
    FileTextOutlined,
    GlobalOutlined,
    KeyOutlined,
    RocketOutlined,
    SearchOutlined,
    SendOutlined,
    SettingOutlined,
    StopOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import {
    Divider,
    Empty,
    Input,
    Space,
    Tag,
    Typography,
} from 'antd';
import React from 'react';
import dayjs from 'dayjs';
import { DockerExecIcon, LocalExecIcon } from './TemplateIcons';
import {
    type ExecutionTaskRecord,
    formatVariableDisplayValue,
    getTaskHosts,
} from './templateListHelpers';
const { Text } = Typography;
const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #f0f0f0',
    padding: '20px 24px',
};
const sectionTitleStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: '#262626',
    margin: '0 0 14px 0',
    paddingBottom: 8,
    borderBottom: '1px dashed #f0f0f0',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
};
const fieldLabelStyle: React.CSSProperties = { fontSize: 12, color: '#8c8c8c', fontWeight: 500 };
const fieldValueStyle: React.CSSProperties = { fontSize: 13, color: '#262626', fontWeight: 500, marginTop: 4 };
type TemplateDetailSummaryCardsProps = {
    hostSearch: string;
    notifyChannels: AutoHealing.NotificationChannel[];
    notifyTemplates: AutoHealing.NotificationTemplate[];
    secretsSources: AutoHealing.SecretsSource[];
    template: ExecutionTaskRecord;
    onHostSearchChange: (value: string) => void;
};

const TemplateDetailSummaryCards: React.FC<TemplateDetailSummaryCardsProps> = ({
    hostSearch,
    notifyChannels,
    notifyTemplates,
    secretsSources,
    template,
    onHostSearchChange,
}) => {
    const playbook = template.playbook;
    const vars = (template.extra_vars || {}) as Record<string, unknown>;
    const hosts = getTaskHosts(template);
    const filteredHosts = hosts.filter((host) => host.toLowerCase().includes(hostSearch.toLowerCase()));
    const notificationConfig = template.notification_config;
    const triggers = [
        { key: 'on_start', label: '开始时', icon: <RocketOutlined />, color: '#1890ff', config: notificationConfig?.on_start },
        { key: 'on_success', label: '成功时', icon: <CheckCircleOutlined />, color: '#52c41a', config: notificationConfig?.on_success },
        { key: 'on_failure', label: '失败时', icon: <StopOutlined />, color: '#ff4d4f', config: notificationConfig?.on_failure },
    ];
    const getChannelName = (channelId: string) => notifyChannels.find((item) => item.id === channelId)?.name || channelId?.slice(0, 8);
    const getTemplateName = (templateId: string) => notifyTemplates.find((item) => item.id === templateId)?.name || templateId?.slice(0, 8);
    return (
        <>
            <div style={cardStyle}>
                <h4 style={sectionTitleStyle}>
                    <ThunderboltOutlined style={{ color: '#1890ff' }} />基础信息
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                    <div>
                        <div style={fieldLabelStyle}>关联 Playbook</div>
                        <div style={fieldValueStyle}>
                            <Space size={6}>
                                <FileTextOutlined style={{ color: '#1890ff' }} />
                                <span style={{ fontWeight: 600 }}>{playbook?.name || template.playbook_id?.substring(0, 8)}</span>
                            </Space>
                        </div>
                    </div>
                    <div>
                        <div style={fieldLabelStyle}>执行器类型</div>
                        <div style={fieldValueStyle}>
                            <Space size={6}>
                                {template.executor_type === 'docker' ? <DockerExecIcon size={14} /> : <LocalExecIcon size={14} />}
                                <span>{template.executor_type === 'docker' ? '容器 (Docker)' : '本地进程 (SSH)'}</span>
                            </Space>
                        </div>
                    </div>
                    <div>
                        <div style={fieldLabelStyle}>创建时间</div>
                        <div style={fieldValueStyle}>{template.created_at ? dayjs(template.created_at).format('YYYY-MM-DD HH:mm') : '-'}</div>
                    </div>
                    <div>
                        <div style={fieldLabelStyle}>更新时间</div>
                        <div style={fieldValueStyle}>{template.updated_at ? dayjs(template.updated_at).format('YYYY-MM-DD HH:mm') : '-'}</div>
                    </div>
                </div>
                {template.description && (
                    <>
                        <Divider dashed style={{ margin: '12px 0' }} />
                        <div>
                            <div style={fieldLabelStyle}>描述</div>
                            <div style={{ ...fieldValueStyle, fontWeight: 400, color: '#595959' }}>{template.description}</div>
                        </div>
                    </>
                )}
            </div>

            <div style={cardStyle}>
                <h4 style={sectionTitleStyle}>
                    <GlobalOutlined style={{ color: '#1890ff' }} />执行环境
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={fieldLabelStyle}>目标主机 ({hosts.length})</div>
                    {hosts.length > 5 && (
                        <Input
                            placeholder="搜索主机..."
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            size="small"
                            style={{ width: 160, borderRadius: 0 }}
                            value={hostSearch}
                            onChange={(event) => onHostSearchChange(event.target.value)}
                            allowClear
                        />
                    )}
                </div>
                <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', padding: 10, maxHeight: 180, overflowY: 'auto' }}>
                    {filteredHosts.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {filteredHosts.map((host) => (
                                <div
                                    key={host}
                                    style={{
                                        border: '1px dashed #d9d9d9',
                                        background: '#fff',
                                        padding: '3px 10px',
                                        fontSize: 12,
                                        color: '#595959',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <DesktopOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
                                    {host}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配主机" />
                    )}
                </div>
            </div>

            <div style={cardStyle}>
                <h4 style={sectionTitleStyle}>
                    <KeyOutlined style={{ color: '#1890ff' }} />凭据配置
                </h4>
                <div>
                    <div style={fieldLabelStyle}>密钥源</div>
                    <div style={{ marginTop: 6 }}>
                        {template.secrets_source_ids?.length ? (
                            <Space size={4} wrap>
                                {template.secrets_source_ids.map((secretId) => {
                                    const source = secretsSources.find((item) => item.id === secretId);
                                    return (
                                        <Tag key={secretId} icon={<KeyOutlined />} color="blue" style={{ margin: 0, fontSize: 11 }}>
                                            {source?.name || secretId.slice(0, 8)}
                                        </Tag>
                                    );
                                })}
                            </Space>
                        ) : (
                            <Text type="secondary" style={{ fontSize: 12 }}>未指定</Text>
                        )}
                    </div>
                </div>
            </div>

            <div style={cardStyle}>
                <h4 style={sectionTitleStyle}>
                    <SettingOutlined style={{ color: '#1890ff' }} />变量配置
                    {Object.keys(vars).length > 0 && (
                        <Tag style={{ marginLeft: 'auto', fontSize: 10 }}>{Object.keys(vars).length} 已配置</Tag>
                    )}
                </h4>
                {Object.keys(vars).length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {Object.entries(vars).map(([key, value]) => {
                            const displayValue = formatVariableDisplayValue(value);
                            return (
                                <div
                                    key={key}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        padding: '4px 10px',
                                        background: '#fafafa',
                                        border: '1px solid #f0f0f0',
                                        fontSize: 12,
                                        fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
                                    }}
                                >
                                    <span style={{ color: '#262626', fontWeight: 600 }}>{key}</span>
                                    <span style={{ color: '#bfbfbf', margin: '0 6px' }}>=</span>
                                    <span style={{ color: '#8c8c8c' }} title={displayValue}>{displayValue}</span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ padding: '24px 0', textAlign: 'center' }}>
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无变量配置" />
                    </div>
                )}
            </div>

            <div style={cardStyle}>
                <h4 style={sectionTitleStyle}>
                    <BellOutlined style={{ color: '#1890ff' }} />通知配置
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {triggers.map((trigger) => {
                        const isEnabled = trigger.config?.enabled ?? false;
                        const channelIds = trigger.config?.channel_ids || [];
                        const templateId = trigger.config?.template_id;

                        return (
                            <div
                                key={trigger.key}
                                style={{
                                    border: `1px dashed ${isEnabled ? trigger.color : '#e8e8e8'}`,
                                    padding: '8px 14px',
                                    background: isEnabled ? `${trigger.color}06` : '#fafafa',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 12,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, minWidth: 90 }}>
                                    <span style={{ color: trigger.color, fontSize: 13 }}>{trigger.icon}</span>
                                    <Text strong style={{ fontSize: 13 }}>{trigger.label}</Text>
                                    <Tag color={isEnabled ? 'green' : 'default'} style={{ margin: 0, fontSize: 10, lineHeight: '16px' }}>
                                        {isEnabled ? '启用' : '关闭'}
                                    </Tag>
                                </div>
                                {isEnabled && channelIds.length > 0 ? (
                                    <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {channelIds.map((channelId: string) => (
                                            <div
                                                key={channelId}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    padding: '2px 8px',
                                                    background: '#fff',
                                                    border: '1px dashed #e8e8e8',
                                                    fontSize: 11,
                                                }}
                                            >
                                                <SendOutlined style={{ color: '#999', fontSize: 10, flexShrink: 0 }} />
                                                <span style={{ fontSize: 11 }}>{getChannelName(channelId)}</span>
                                                {templateId && (
                                                    <>
                                                        <Text type="secondary" style={{ fontSize: 10, flexShrink: 0 }}>→</Text>
                                                        <span style={{ fontSize: 11, color: '#8c8c8c' }}>{getTemplateName(templateId)}</span>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : isEnabled ? (
                                    <Text type="secondary" style={{ fontSize: 11 }}>无策略</Text>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export default TemplateDetailSummaryCards;

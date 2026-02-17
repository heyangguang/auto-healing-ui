import React, { useEffect, useState, useCallback, startTransition } from 'react';
import {
    SettingOutlined, DesktopOutlined, KeyOutlined, FileTextOutlined,
    BranchesOutlined, BellOutlined, ReloadOutlined, PlayCircleOutlined,
    InfoCircleOutlined, GlobalOutlined, RocketOutlined, CheckCircleOutlined,
    StopOutlined, SendOutlined, ExclamationCircleOutlined, CheckOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import { history, useParams } from '@umijs/max';
import {
    Button, Tag, Space, Typography, message, Spin, Divider, Empty, Alert,
} from 'antd';
import { getExecutionTask, confirmExecutionTaskReview } from '@/services/auto-healing/execution';
import { getSecretsSources } from '@/services/auto-healing/secrets';
import { getChannels } from '@/services/auto-healing/notification';
import SubPageHeader from '@/components/SubPageHeader';
import { ExecutorIcon, DockerExecIcon, LocalExecIcon } from './TemplateIcons';
import dayjs from 'dayjs';
import './detail.css';

const { Text } = Typography;

const TaskTemplateDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const fromUrl = new URLSearchParams(window.location.search).get('from');
    const handleGoBack = useCallback(() => {
        if (fromUrl) { history.push(fromUrl); }
        else if (window.history.length > 1) { history.back(); }
        else { history.push('/execution/templates'); }
    }, [fromUrl]);

    const [loading, setLoading] = useState(true);
    const [task, setTask] = useState<AutoHealing.ExecutionTask>();
    const [secretsSources, setSecretsSources] = useState<AutoHealing.SecretsSource[]>([]);
    const [channels, setChannels] = useState<any[]>([]);
    const [confirming, setConfirming] = useState(false);

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [taskRes, secretsRes, channelsRes] = await Promise.all([
                getExecutionTask(id),
                getSecretsSources().catch(() => ({ data: [] })),
                getChannels().catch(() => ({ data: [] })),
            ]);
            setTask(taskRes.data);
            setSecretsSources((secretsRes as any).data || []);
            setChannels((channelsRes as any).data || []);
        } catch (e: any) {
            message.error('获取任务模板失败');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // 确认变更
    const handleConfirmReview = async () => {
        if (!id) return;
        setConfirming(true);
        try {
            await confirmExecutionTaskReview(id);
            message.success('变量变更已确认');
            fetchData();
        } catch {
            message.error('确认失败');
        } finally {
            setConfirming(false);
        }
    };

    if (loading) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!task) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 16 }}>未找到任务模板</Text>
                <div style={{ marginTop: 16 }}><Button onClick={handleGoBack}>返回</Button></div>
            </div>
        );
    }

    // 通知配置
    const notifConfig = task.notification_config;
    const notifTriggers = [
        { key: 'on_start', label: '开始时', icon: <RocketOutlined />, color: '#1890ff', cls: 'active-start', config: notifConfig?.on_start },
        { key: 'on_success', label: '成功时', icon: <CheckCircleOutlined />, color: '#52c41a', cls: 'active-success', config: notifConfig?.on_success },
        { key: 'on_failure', label: '失败时', icon: <StopOutlined />, color: '#ff4d4f', cls: 'active-failure', config: notifConfig?.on_failure },
    ];

    // 变量
    const extraVars = task.extra_vars || {};
    const varsCount = Object.keys(extraVars).length;
    const playbookVars = task.playbook?.variables || [];
    const hosts = task.target_hosts ? task.target_hosts.split(',') : [];

    // 获取渠道名
    const getChannelName = (cid: string) => {
        const ch = channels.find((c: any) => c.id === cid);
        return ch?.name || cid.substring(0, 8);
    };

    return (
        <div className="tpl-detail-page">
            <SubPageHeader
                title={
                    <div className="tpl-detail-header-title">
                        <ExecutorIcon executorType={task.executor_type} size={32} iconSize={18} />
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span>{task.name}</span>
                                <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
                                    #{id?.substring(0, 8)}
                                </Text>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>任务模板</Tag>
                                {task.needs_review && <Tag color="orange" style={{ margin: 0, fontSize: 11 }}>变量待确认</Tag>}
                            </div>
                        </div>
                    </div>
                }
                onBack={handleGoBack}
                actions={
                    <Space size={8}>
                        <Button size="small" icon={<PlayCircleOutlined />}
                            onClick={() => startTransition(() => history.push(`/execution/execute?template=${task.id}`))}>
                            前往发射台
                        </Button>
                        <Button size="small" icon={<ReloadOutlined spin={loading} />} onClick={fetchData}>刷新</Button>
                    </Space>
                }
            />

            <div className="tpl-detail-cards">

                {/* ========== 变量漂移告警 ========== */}
                {task.needs_review && task.changed_variables && task.changed_variables.length > 0 && (
                    <Alert
                        type="warning"
                        showIcon
                        icon={<ExclamationCircleOutlined />}
                        message={<span style={{ fontWeight: 600 }}>Playbook 变量变更待确认</span>}
                        description={
                            <div style={{ marginTop: 8 }}>
                                <div style={{ color: '#595959', marginBottom: 10 }}>
                                    检测到 Playbook 定义已更新，以下变量发生了变更，请确认：
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                                    {task.changed_variables.map(v => (
                                        <Tag key={v} color="orange" style={{ margin: 0, fontSize: 11 }}>{v}</Tag>
                                    ))}
                                </div>
                                <Button
                                    type="primary"
                                    size="small"
                                    icon={<CheckOutlined />}
                                    loading={confirming}
                                    onClick={handleConfirmReview}
                                    style={{ background: '#faad14', borderColor: '#faad14' }}
                                >
                                    确认变更并同步
                                </Button>
                            </div>
                        }
                    />
                )}

                {/* ========== Card 1: 基础信息 ========== */}
                <div className="tpl-detail-card">
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
                                {task.playbook ? (
                                    <Space size={6}>
                                        <FileTextOutlined style={{ color: '#1890ff' }} />
                                        <span style={{ fontWeight: 600 }}>{task.playbook.name}</span>
                                        {task.playbook.file_path && (
                                            <code style={{ fontSize: 11, background: '#f5f5f5', padding: '2px 6px', color: '#595959' }}>
                                                {task.playbook.file_path}
                                            </code>
                                        )}
                                    </Space>
                                ) : <Text type="secondary">未关联</Text>}
                            </span>
                        </div>
                        <div className="tpl-detail-field">
                            <span className="tpl-detail-field-label">执行器类型</span>
                            <span className="tpl-detail-field-value">
                                <Space size={6}>
                                    {task.executor_type === 'docker'
                                        ? <DockerExecIcon size={14} />
                                        : <LocalExecIcon size={14} />
                                    }
                                    <span>{task.executor_type === 'docker' ? '容器 (Docker)' : '本地进程 (SSH)'}</span>
                                </Space>
                            </span>
                        </div>
                        <div className="tpl-detail-field">
                            <span className="tpl-detail-field-label">创建时间</span>
                            <span className="tpl-detail-field-value">{dayjs(task.created_at).format('YYYY-MM-DD HH:mm:ss')}</span>
                        </div>
                    </div>

                    {task.description && (
                        <>
                            <Divider style={{ margin: '14px 0' }} dashed />
                            <div className="tpl-detail-field">
                                <span className="tpl-detail-field-label">描述</span>
                                <span className="tpl-detail-field-value" style={{ color: '#595959', fontWeight: 400 }}>{task.description}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* ========== Card 2: 执行环境 ========== */}
                <div className="tpl-detail-card">
                    <h4 className="tpl-detail-section-title">
                        <GlobalOutlined />执行环境
                    </h4>

                    <div className="tpl-detail-field">
                        <span className="tpl-detail-field-label">目标主机 ({hosts.length})</span>
                        <span className="tpl-detail-field-value">
                            {hosts.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                    {hosts.map((h) => (
                                        <Tag key={h} style={{ margin: 0, fontSize: 11 }}>
                                            <DesktopOutlined style={{ marginRight: 4 }} />{h.trim()}
                                        </Tag>
                                    ))}
                                </div>
                            ) : <Text type="secondary" style={{ fontSize: 12 }}>未配置</Text>}
                        </span>
                    </div>
                </div>

                {/* ========== Card 3: 凭据配置 ========== */}
                <div className="tpl-detail-card">
                    <h4 className="tpl-detail-section-title">
                        <KeyOutlined />凭据配置
                    </h4>

                    <div className="tpl-detail-field">
                        <span className="tpl-detail-field-label">密钥源</span>
                        <span className="tpl-detail-field-value">
                            {task.secrets_source_ids?.length ? (
                                <Space size={4} wrap>
                                    {task.secrets_source_ids.map((sid: string) => {
                                        const s = secretsSources.find(x => x.id === sid);
                                        return (
                                            <Tag key={sid} color="blue" style={{ margin: 0, fontSize: 11 }}>
                                                <KeyOutlined style={{ marginRight: 4 }} />{s?.name || sid.substring(0, 8)}
                                            </Tag>
                                        );
                                    })}
                                </Space>
                            ) : <Text type="secondary" style={{ fontSize: 12 }}>未指定</Text>}
                        </span>
                    </div>
                </div>

                {/* ========== Card 4: 变量配置 ========== */}
                <div className="tpl-detail-card">
                    <h4 className="tpl-detail-section-title">
                        <SettingOutlined />变量配置
                        <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 400, color: '#8c8c8c' }}>
                            {varsCount + playbookVars.length > 0
                                ? `${varsCount} 已配置 / ${playbookVars.length} 定义`
                                : ''}
                        </span>
                    </h4>

                    {/* Extra Vars (JSON) */}
                    {varsCount > 0 && (
                        <div style={{ marginBottom: 20 }}>
                            <div className="tpl-detail-subsection-title">
                                <SettingOutlined /> 额外变量 (Extra Vars)
                                <Tag style={{ margin: '0 0 0 8px', fontSize: 10 }}>{varsCount}</Tag>
                            </div>
                            <pre className="tpl-detail-code-block">
                                {JSON.stringify(extraVars, null, 2)}
                            </pre>
                        </div>
                    )}

                    {/* Playbook 定义的变量 */}
                    {playbookVars.length > 0 && (
                        <div>
                            <div className="tpl-detail-subsection-title">
                                <FileTextOutlined /> Playbook 变量
                                <Tag style={{ margin: '0 0 0 8px', fontSize: 10 }}>{playbookVars.length}</Tag>
                            </div>
                            <div className="tpl-detail-var-list">
                                {playbookVars.map((v) => (
                                    <div key={v.name} className="tpl-detail-var-item">
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: 600, fontFamily: "'SFMono-Regular', Consolas, monospace", fontSize: 12 }}>
                                                {v.name}
                                            </span>
                                            <Space size={4}>
                                                <Tag style={{ margin: 0, fontSize: 10 }}>{v.type}</Tag>
                                                {v.required && <Tag color="red" style={{ margin: 0, fontSize: 10 }}>必填</Tag>}
                                            </Space>
                                        </div>
                                        {v.description && (
                                            <div style={{ color: '#8c8c8c', fontSize: 11, marginTop: 4 }}>{v.description}</div>
                                        )}
                                        {v.default !== undefined && v.default !== null && (
                                            <div style={{ marginTop: 4, fontSize: 11 }}>
                                                <Text type="secondary">默认值：</Text>
                                                <code style={{ fontSize: 11, background: '#f5f5f5', padding: '1px 4px' }}>
                                                    {String(v.default)}
                                                </code>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 空状态 */}
                    {varsCount === 0 && playbookVars.length === 0 && (
                        <div style={{ padding: '32px 0', textAlign: 'center' }}>
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无变量配置" />
                        </div>
                    )}
                </div>

                {/* ========== Card 5: 通知配置 ========== */}
                <div className="tpl-detail-card">
                    <h4 className="tpl-detail-section-title">
                        <BellOutlined />通知配置
                    </h4>

                    <div className="tpl-detail-notif-grid">
                        {notifTriggers.map(trigger => {
                            const isEnabled = trigger.config?.enabled ?? false;
                            const configList = trigger.config?.channel_ids?.length && trigger.config?.template_id
                                ? trigger.config.channel_ids.map((cid: string) => ({ channel_id: cid, template_id: trigger.config!.template_id! }))
                                : [];

                            return (
                                <div
                                    key={trigger.key}
                                    className={`tpl-detail-notif-trigger ${isEnabled ? trigger.cls : ''}`}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isEnabled && configList.length > 0 ? 8 : 0 }}>
                                        <Space size={4}>
                                            <span style={{ color: trigger.color, fontSize: 13 }}>{trigger.icon}</span>
                                            <Text strong style={{ fontSize: 13 }}>{trigger.label}</Text>
                                        </Space>
                                        <Tag color={isEnabled ? 'green' : 'default'} style={{ margin: 0, fontSize: 10 }}>
                                            {isEnabled ? '已启用' : '未启用'}
                                        </Tag>
                                    </div>

                                    {isEnabled && configList.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            {configList.map((cfg: any, idx: number) => (
                                                <div key={idx} style={{
                                                    display: 'flex', alignItems: 'center', gap: 4,
                                                    padding: '4px 8px', background: '#fff', border: '1px dashed #e8e8e8',
                                                    fontSize: 11
                                                }}>
                                                    <SendOutlined style={{ color: '#999', fontSize: 10 }} />
                                                    <Text ellipsis={{ tooltip: getChannelName(cfg.channel_id) }} style={{ fontSize: 11, maxWidth: 90 }}>
                                                        {getChannelName(cfg.channel_id)}
                                                    </Text>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {isEnabled && configList.length === 0 && (
                                        <Text type="secondary" style={{ fontSize: 11 }}>无策略</Text>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TaskTemplateDetail;

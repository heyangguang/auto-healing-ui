import {
    LeftOutlined,
    RocketOutlined,
    SettingOutlined,
    DesktopOutlined,
    KeyOutlined,
    FileTextOutlined,
    BranchesOutlined,
    ThunderboltOutlined,
    BellOutlined,
    LinkOutlined,
    ReloadOutlined,
    EditOutlined,
    PlayCircleOutlined,
    ClockCircleOutlined,
    InfoCircleOutlined,
    CodeOutlined,
} from '@ant-design/icons';
import { history, useParams } from '@umijs/max';
import {
    Button, Tag, Space, Typography, message, Tooltip, Spin,
} from 'antd';
import React, { useEffect, useState, useCallback, startTransition } from 'react';
import { getExecutionTask } from '@/services/auto-healing/execution';
import { getSecretsSources } from '@/services/auto-healing/secrets';
import dayjs from 'dayjs';

const { Text } = Typography;

/* ========== 区块标题 ========== */
const SectionTitle: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
    <div style={{
        fontSize: 12, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: 0.5,
        marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600,
    }}>
        {icon} {title}
    </div>
);

/* ========== 字段行 ========== */
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', padding: '5px 0', fontSize: 13, lineHeight: '22px' }}>
        <span style={{ width: 80, flexShrink: 0, color: '#8c8c8c', fontSize: 12 }}>{label}</span>
        <span style={{ flex: 1, color: '#262626', fontWeight: 500 }}>{children}</span>
    </div>
);

// ==================== 主组件 ====================
const TaskTemplateDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const fromUrl = new URLSearchParams(window.location.search).get('from');
    const handleGoBack = useCallback(() => {
        if (fromUrl) { history.push(fromUrl); }
        else if (window.history.length > 1) { history.goBack(); }
        else { history.push('/execution/templates'); }
    }, [fromUrl]);

    const [loading, setLoading] = useState(true);
    const [task, setTask] = useState<AutoHealing.ExecutionTask>();
    const [secretsSources, setSecretsSources] = useState<AutoHealing.SecretsSource[]>([]);

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [taskRes, secretsRes] = await Promise.all([
                getExecutionTask(id),
                getSecretsSources().catch(() => ({ data: [] })),
            ]);
            setTask(taskRes.data);
            setSecretsSources((secretsRes as any).data || []);
        } catch (e: any) {
            message.error('获取任务模板失败');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchData(); }, [fetchData]);

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

    // 通知配置解析
    const notifConfig = task.notification_config;
    const notifEnabled = notifConfig?.enabled !== false && notifConfig?.enabled !== undefined;
    const notifTriggers: string[] = [];
    if (notifConfig?.on_start?.enabled) notifTriggers.push('开始时');
    if (notifConfig?.on_success?.enabled) notifTriggers.push('成功时');
    if (notifConfig?.on_failure?.enabled) notifTriggers.push('失败时');
    if (notifConfig?.on_timeout?.enabled) notifTriggers.push('超时时');

    // 变量统计
    const varsCount = task.extra_vars ? Object.keys(task.extra_vars).length : 0;
    const playbookVarsCount = task.playbook?.variables?.length || 0;

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f5f5f5', overflow: 'hidden' }}>

            {/* ====== 块 1：标题栏（独立区块） ====== */}
            <div className="industrial-dashed-box" style={{
                padding: '16px 24px',
                margin: '16px 16px 0 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
                background: '#fff',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Button type="text" size="small" icon={<LeftOutlined />}
                        onClick={handleGoBack} style={{ color: '#595959' }} />
                    <SettingOutlined style={{ fontSize: 18, color: '#595959' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 16, fontWeight: 600 }}>{task.name}</span>
                            <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>#{id?.substring(0, 8)}</Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>任务模板</Tag>
                            {task.needs_review && <Tag color="orange" style={{ margin: 0, fontSize: 11 }}>需要审查</Tag>}
                        </div>
                    </div>
                </div>
                <Space size={8}>
                    <Button size="small" icon={<PlayCircleOutlined />}
                        onClick={() => startTransition(() => history.push(`/execution/execute?template=${task.id}`))}>
                        前往发射台
                    </Button>
                    <Button size="small" icon={<ReloadOutlined spin={loading} />} onClick={fetchData}>刷新</Button>
                </Space>
            </div>

            {/* ====== 块 2 + 3：左侧信息 + 右侧内容 ====== */}
            <div style={{ flex: 1, display: 'flex', gap: 16, padding: 16, overflow: 'hidden' }}>

                {/* ====== 左侧信息面板 ====== */}
                <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>

                    {/* 基本信息 */}
                    <div className="industrial-dashed-box">
                        <SectionTitle icon={<InfoCircleOutlined />} title="基本信息 / BASIC INFO" />
                        <Field label="模板名称">{task.name}</Field>
                        {task.description && (
                            <Field label="描述">
                                <Text style={{ fontSize: 12, color: '#595959' }}>{task.description}</Text>
                            </Field>
                        )}
                        <Field label="执行器">
                            <Tag icon={<ThunderboltOutlined />}
                                color={task.executor_type === 'docker' ? 'blue' : 'default'}
                                style={{ margin: 0, fontSize: 11 }}>
                                {task.executor_type || 'local'}
                            </Tag>
                        </Field>
                        <Field label="创建时间">{dayjs(task.created_at).format('YYYY-MM-DD HH:mm:ss')}</Field>
                        <Field label="更新时间">{dayjs(task.updated_at).format('YYYY-MM-DD HH:mm:ss')}</Field>
                    </div>

                    {/* 关联信息 */}
                    <div className="industrial-dashed-box">
                        <SectionTitle icon={<LinkOutlined />} title="关联信息 / ASSOCIATIONS" />
                        <Field label="Playbook">
                            {task.playbook ? (
                                <span>
                                    <FileTextOutlined style={{ marginRight: 4, fontSize: 11 }} />
                                    {task.playbook.name}
                                    <Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>
                                        ({task.playbook.file_path})
                                    </Text>
                                </span>
                            ) : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>}
                        </Field>
                        {task.playbook?.repository_id && (
                            <Field label="Git 仓库">
                                <Tag icon={<BranchesOutlined />} style={{ margin: 0, fontSize: 11 }}>
                                    {(task.playbook as any)?.repository?.name || task.playbook.repository_id.substring(0, 8)}
                                </Tag>
                            </Field>
                        )}
                        <Field label="Playbook变量">
                            <Tag style={{ margin: 0, fontSize: 11 }}>{playbookVarsCount} 个</Tag>
                        </Field>
                    </div>

                    {/* 目标与密钥 */}
                    <div className="industrial-dashed-box">
                        <SectionTitle icon={<DesktopOutlined />} title="目标配置 / TARGETS" />
                        <Field label="目标主机">
                            {task.target_hosts ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {task.target_hosts.split(',').map((h: string) => (
                                        <Tag key={h} style={{ margin: 0, fontSize: 11 }}><DesktopOutlined style={{ marginRight: 4 }} />{h.trim()}</Tag>
                                    ))}
                                </div>
                            ) : <Text type="secondary" style={{ fontSize: 12 }}>未配置</Text>}
                        </Field>
                        <Field label="主机数">
                            <Tag style={{ margin: 0, fontSize: 11 }}>
                                {task.target_hosts ? task.target_hosts.split(',').length : 0} 台
                            </Tag>
                        </Field>
                        <Field label="密钥源">
                            {task.secrets_source_ids?.length ? (
                                <Space size={4} wrap>
                                    {task.secrets_source_ids.map((sid: string) => {
                                        const s = secretsSources.find(x => x.id === sid);
                                        return <Tag key={sid} color="blue" style={{ margin: 0, fontSize: 11 }}><KeyOutlined style={{ marginRight: 4 }} />{s?.name || sid.substring(0, 8)}</Tag>;
                                    })}
                                </Space>
                            ) : <Text type="secondary" style={{ fontSize: 12 }}>未指定</Text>}
                        </Field>
                    </div>

                    {/* 通知配置 */}
                    <div className="industrial-dashed-box">
                        <SectionTitle icon={<BellOutlined />} title="通知配置 / NOTIFICATION" />
                        <Field label="通知状态">
                            {notifEnabled ? (
                                <Tag icon={<BellOutlined />} color="green" style={{ margin: 0, fontSize: 11 }}>已启用</Tag>
                            ) : (
                                <Tag style={{ margin: 0, fontSize: 11 }} color="default">未启用</Tag>
                            )}
                        </Field>
                        {notifEnabled && notifTriggers.length > 0 && (
                            <Field label="触发条件">
                                <Space size={4} wrap>
                                    {notifTriggers.map(t => (
                                        <Tag key={t} style={{ margin: 0, fontSize: 11 }}>{t}</Tag>
                                    ))}
                                </Space>
                            </Field>
                        )}
                    </div>
                </div>

                {/* ====== 右侧：变量与配置预览 ====== */}
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0,
                    border: '1px dashed #d9d9d9', background: '#fafafa', borderRadius: 4, overflow: 'hidden',
                }}>
                    {/* 标题 */}
                    <div style={{
                        padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderBottom: '1px dashed #d9d9d9', background: '#fff',
                    }}>
                        <Space>
                            <CodeOutlined style={{ fontSize: 14, color: '#595959' }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
                                变量与配置 / VARIABLES & CONFIG
                            </span>
                        </Space>
                        <Tag style={{ margin: 0, fontSize: 11 }}>{varsCount + playbookVarsCount} 项</Tag>
                    </div>
                    {/* 内容 */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

                        {/* Extra Vars */}
                        {varsCount > 0 && (
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#595959', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <SettingOutlined /> 额外变量 (Extra Vars)
                                    <Tag style={{ margin: 0, fontSize: 10 }}>{varsCount}</Tag>
                                </div>
                                <pre style={{
                                    margin: 0, fontSize: 12, background: '#1e1e1e', color: '#d4d4d4',
                                    padding: 16, borderRadius: 4, overflow: 'auto', maxHeight: 300,
                                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                }}>
                                    {JSON.stringify(task.extra_vars, null, 2)}
                                </pre>
                            </div>
                        )}

                        {/* Playbook Variables */}
                        {task.playbook?.variables && task.playbook.variables.length > 0 && (
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#595959', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <FileTextOutlined /> Playbook 变量
                                    <Tag style={{ margin: 0, fontSize: 10 }}>{task.playbook.variables.length}</Tag>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {task.playbook.variables.map((v) => (
                                        <div key={v.name} style={{
                                            padding: '8px 12px', background: '#fff', border: '1px solid #e8e8e8',
                                            borderRadius: 4, fontSize: 12,
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v.name}</span>
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
                                                    <code style={{ fontSize: 11, background: '#f0f0f0', padding: '1px 4px' }}>{String(v.default)}</code>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Playbook Variables Snapshot (如果有漂移提示) */}
                        {task.changed_variables && task.changed_variables.length > 0 && (
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#faad14', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    ⚠ 变量漂移 (Changed Variables)
                                    <Tag color="orange" style={{ margin: 0, fontSize: 10 }}>{task.changed_variables.length}</Tag>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {task.changed_variables.map(v => (
                                        <Tag key={v} color="orange" style={{ margin: 0, fontSize: 11 }}>{v}</Tag>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 无内容提示 */}
                        {varsCount === 0 && playbookVarsCount === 0 && (
                            <div style={{ textAlign: 'center', padding: 40, color: '#bfbfbf' }}>
                                <CodeOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                                <div style={{ fontSize: 13 }}>暂无变量配置</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskTemplateDetail;

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Form, Input, Select, Button, Space, message, Switch, Row, Col,
    Empty, Spin, Typography, Tag, Alert,
} from 'antd';
import {
    ThunderboltOutlined, DesktopOutlined,
    GlobalOutlined, KeyOutlined, BellOutlined, SearchOutlined,
    ExclamationCircleOutlined, SettingOutlined, PlusOutlined,
    SafetyCertificateOutlined,
} from '@ant-design/icons';
import { history, useParams } from '@umijs/max';
import SubPageHeader from '@/components/SubPageHeader';
import HostSelector from '@/components/HostSelector';
import VariableInput, { extractDefaultValue } from '@/components/VariableInput';
import PlaybookSelector from '@/components/PlaybookSelector';
import SecretsSourceSelector from '@/components/SecretsSourceSelector';
import NotificationSelector from '@/components/NotificationSelector';
import {
    getExecutionTask, createExecutionTask, updateExecutionTask,
    confirmExecutionTaskReview,
} from '@/services/auto-healing/execution';
import { getPlaybooks, getPlaybook } from '@/services/auto-healing/playbooks';
import { getSecretsSources } from '@/services/auto-healing/secrets';
import { getChannels, getTemplates } from '@/services/auto-healing/notification';
import { DockerExecIcon, LocalExecIcon } from './TemplateIcons';
import './TemplateForm.css';

const { Text } = Typography;

const TemplateFormPage: React.FC = () => {
    const params = useParams<{ id?: string }>();
    const isEdit = !!params.id;
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);

    // Playbook 相关
    const [playbooks, setPlaybooks] = useState<AutoHealing.Playbook[]>([]);
    const [selectedPlaybook, setSelectedPlaybook] = useState<AutoHealing.Playbook>();
    const [loadingPlaybook, setLoadingPlaybook] = useState(false);
    const [variableValues, setVariableValues] = useState<Record<string, any>>({});
    const [varSearch, setVarSearch] = useState('');
    const [showOnlyRequired, setShowOnlyRequired] = useState(false);

    // 引用数据
    const [secretsSources, setSecretsSources] = useState<any[]>([]);
    const [notifyChannels, setNotifyChannels] = useState<AutoHealing.NotificationChannel[]>([]);
    const [notifyTemplates, setNotifyTemplates] = useState<AutoHealing.NotificationTemplate[]>([]);

    // 审核状态
    const [needsReview, setNeedsReview] = useState(false);
    const [changedVariables, setChangedVariables] = useState<string[]>([]);

    // 凭据选择器
    const [secretsModalOpen, setSecretsModalOpen] = useState(false);
    const selectedSecretIds: string[] = Form.useWatch('secrets_source_ids', form) || [];

    // 变量列表
    const variables = useMemo((): any[] => {
        if (!selectedPlaybook) return [];
        const pb = selectedPlaybook as any;
        return (pb.variables && pb.variables.length > 0)
            ? pb.variables
            : (pb.scanned_variables || []);
    }, [selectedPlaybook]);

    const filteredVariables = useMemo(() => {
        let list = variables;
        if (showOnlyRequired) list = list.filter(v => v.required);
        if (varSearch) list = list.filter(v => v.name.toLowerCase().includes(varSearch.toLowerCase()));
        return list;
    }, [variables, varSearch, showOnlyRequired]);

    // 数据加载
    useEffect(() => {
        Promise.all([
            getPlaybooks().catch(() => ({ data: [] })),
            getSecretsSources().catch(() => ({ data: [] })),
            getChannels({ page: 1, page_size: 100 }).catch(() => ({ data: [] })),
            getTemplates({ page: 1, page_size: 100 }).catch(() => ({ data: [] })),
        ]).then(([pbRes, secRes, chRes, tplRes]) => {
            setPlaybooks((pbRes as any).data || []);
            setSecretsSources((secRes as any).data || []);
            setNotifyChannels((chRes as any).data || []);
            setNotifyTemplates((tplRes as any).data || []);
        });
    }, []);

    // 编辑模式加载
    useEffect(() => {
        if (!isEdit || !params.id) return;
        setLoading(true);
        getExecutionTask(params.id).then(async (res) => {
            const record = res.data;
            form.setFieldsValue({
                name: record.name,
                description: record.description,
                playbook_id: record.playbook_id,
                target_hosts: record.target_hosts ? record.target_hosts.split(',') : [],
                executor_type: record.executor_type || 'local',
                secrets_source_ids: record.secrets_source_ids || [],
                notification_config: record.notification_config || {},
            });
            setVariableValues(record.extra_vars || {});
            setNeedsReview(!!record.needs_review);
            setChangedVariables(record.changed_variables || []);

            if (record.playbook_id) {
                try {
                    const pbRes = await getPlaybook(record.playbook_id);
                    setSelectedPlaybook(pbRes.data);
                } catch {
                    /* ignore */
                }
            }
        }).catch(() => {
            message.error('加载任务模板失败');
        }).finally(() => {
            setLoading(false);
        });
    }, [isEdit, params.id, form]);

    // 处理 Playbook 选择
    const handleSelectPlaybook = async (playbookId: string) => {
        setLoadingPlaybook(true);
        form.setFieldsValue({ playbook_id: playbookId });
        try {
            const res = await getPlaybook(playbookId);
            if (res.data) {
                setSelectedPlaybook(res.data);
                const newVariables = (res.data.variables && res.data.variables.length > 0)
                    ? res.data.variables
                    : ((res.data as any).scanned_variables || []);
                const initials: Record<string, any> = {};
                newVariables.forEach((v: any) => {
                    const def = extractDefaultValue(v);
                    if (def !== undefined) initials[v.name] = def;
                });
                setVariableValues(initials);
            }
        } catch {
            message.error('加载 Playbook 详情失败');
        } finally {
            setLoadingPlaybook(false);
        }
    };

    const handleVariableChange = (name: string, value: any) => {
        setVariableValues(prev => ({ ...prev, [name]: value }));
    };

    // 凭据选择确认
    const handleSecretsConfirm = useCallback((sourceId: string) => {
        const current = form.getFieldValue('secrets_source_ids') || [];
        if (!current.includes(sourceId)) {
            form.setFieldsValue({ secrets_source_ids: [...current, sourceId] });
        }
        setSecretsModalOpen(false);
    }, [form]);

    // 移除凭据
    const handleRemoveSecret = useCallback((sourceId: string) => {
        const current = form.getFieldValue('secrets_source_ids') || [];
        form.setFieldsValue({ secrets_source_ids: current.filter((id: string) => id !== sourceId) });
    }, [form]);

    // 提交
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            const missingVars = variables.filter(v => v.required && (variableValues[v.name] === undefined || variableValues[v.name] === ''));
            if (missingVars.length > 0) {
                message.error(`缺少必填参数: ${missingVars.map(v => v.name).join(', ')}`);
                return;
            }

            setSubmitting(true);

            let cleanedNotificationConfig = values.notification_config;
            if (cleanedNotificationConfig?.enabled) {
                const triggers = ['on_start', 'on_success', 'on_failure'] as const;
                let hasAnyConfig = false;
                for (const trigger of triggers) {
                    const triggerConfig = cleanedNotificationConfig[trigger];
                    if (triggerConfig?.enabled) {
                        const hasConfigs = (triggerConfig.configs?.length || 0) > 0 ||
                            ((triggerConfig.channel_ids?.length || 0) > 0 && triggerConfig.template_id);
                        if (!hasConfigs) {
                            cleanedNotificationConfig = {
                                ...cleanedNotificationConfig,
                                [trigger]: { ...triggerConfig, enabled: false }
                            };
                        } else {
                            hasAnyConfig = true;
                        }
                    }
                }
                if (!hasAnyConfig) {
                    cleanedNotificationConfig = undefined;
                }
            }

            const payload = {
                name: values.name,
                description: values.description,
                playbook_id: values.playbook_id,
                target_hosts: Array.isArray(values.target_hosts) ? values.target_hosts.join(',') : values.target_hosts,
                extra_vars: variableValues,
                executor_type: values.executor_type,
                secrets_source_ids: values.secrets_source_ids || [],
                notification_config: cleanedNotificationConfig,
            };

            if (isEdit && params.id) {
                await updateExecutionTask(params.id, payload);
                message.success('更新成功');
            } else {
                await createExecutionTask(payload as any);
                message.success('创建成功');
            }

            history.push('/execution/templates');
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    // ============ 渲染 ============
    return (
        <div className="template-form-page">
            <SubPageHeader
                title={isEdit ? '编辑任务模板' : '创建任务模板'}
                onBack={() => history.push('/execution/templates')}
                actions={
                    <div className="template-form-actions">
                        <Button onClick={() => history.push('/execution/templates')}>取消</Button>
                        <Button type="primary" onClick={handleSubmit} loading={submitting}>
                            {isEdit ? '保存' : '创建'}
                        </Button>
                    </div>
                }
            />

            <Spin spinning={loading}>
                <Form form={form} layout="vertical" requiredMark={false} initialValues={{ executor_type: 'local' }} size="large">
                    <div className="template-form-cards">

                        {/* 审核警告 */}
                        {needsReview && (
                            <Alert
                                message={<span style={{ fontWeight: 600, fontSize: 15 }}>Playbook 变量变更待确认</span>}
                                description={
                                    <div style={{ marginTop: 8 }}>
                                        <div style={{ color: '#595959', marginBottom: 12 }}>
                                            检测到 Playbook 定义已更新。保存将自动确认变更。
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {changedVariables.map(v => (
                                                <Tag key={v} color="orange">{v}</Tag>
                                            ))}
                                        </div>
                                    </div>
                                }
                                type="warning"
                                showIcon
                                icon={<ExclamationCircleOutlined style={{ fontSize: 20 }} />}
                                style={{ border: '1px solid #ffe58f' }}
                            />
                        )}

                        {/* ========== Card 1: 基础信息 ========== */}
                        <div className="template-form-card">
                            <h4 className="template-form-section-title">
                                <ThunderboltOutlined />基础信息
                            </h4>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="name"
                                        label="模板名称"
                                        rules={[{ required: true, message: '请输入模板名称' }]}
                                        extra="简短描述该模板的用途，例如「日志轮转」「安全补丁」"
                                    >
                                        <Input placeholder="例如：生产环境 Nginx 日志轮转" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="playbook_id"
                                        label="关联 Playbook"
                                        rules={[{ required: true, message: '请选择 Playbook' }]}
                                        tooltip="选择要执行的自动化脚本蓝图，关联后将自动载入变量定义"
                                        extra="选择后将自动加载变量配置"
                                    >
                                        <PlaybookSelector
                                            playbooks={playbooks}
                                            value={form.getFieldValue('playbook_id')}
                                            onChange={handleSelectPlaybook}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item
                                name="description"
                                label="任务描述"
                                extra="可选，用于记录该模板的详细说明或注意事项"
                            >
                                <Input.TextArea
                                    placeholder="例如：每日凌晨 2 点执行日志轮转，保留 7 天..."
                                    rows={3}
                                    showCount
                                    maxLength={500}
                                />
                            </Form.Item>
                        </div>

                        {/* ========== Card 2: 执行环境 ========== */}
                        <div className="template-form-card">
                            <h4 className="template-form-section-title">
                                <GlobalOutlined />执行环境
                            </h4>

                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item
                                        name="executor_type"
                                        label="执行器类型"
                                        tooltip="本地进程：通过 SSH 连接远程主机执行；容器环境：在 Docker 容器内执行"
                                    >
                                        <Select options={[
                                            { label: <span><LocalExecIcon size={14} style={{ marginRight: 6, verticalAlign: '-2px' }} />本地进程 (SSH)</span>, value: 'local' },
                                            { label: <span><DockerExecIcon size={14} style={{ marginRight: 6, verticalAlign: '-2px' }} />容器 (Docker)</span>, value: 'docker' },
                                        ]} />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item
                                name="target_hosts"
                                label="目标主机"
                                rules={[{ required: true, message: '请至少选择一台目标主机' }]}
                                extra="从 CMDB 资产库选择目标主机，支持多选"
                                tooltip="选择该模板执行时的目标主机列表"
                            >
                                <HostSelector />
                            </Form.Item>
                        </div>

                        {/* ========== Card 3: 凭据配置 ========== */}
                        <div className="template-form-card">
                            <h4 className="template-form-section-title">
                                <KeyOutlined />凭据配置
                            </h4>

                            <Form.Item
                                name="secrets_source_ids"
                                label="密钥源"
                                extra="选择用于 SSH 连接的凭据，可选多个。执行时按顺序尝试匹配。"
                                tooltip="密钥源提供 SSH Key 或密码等认证信息"
                            >
                                <div>
                                    <div className="template-form-secrets-display">
                                        {selectedSecretIds.map((sid: string) => {
                                            const s = secretsSources.find((x: any) => x.id === sid);
                                            return (
                                                <Tag
                                                    key={sid}
                                                    closable
                                                    onClose={() => handleRemoveSecret(sid)}
                                                    color="blue"
                                                    style={{ fontSize: 12 }}
                                                >
                                                    <SafetyCertificateOutlined style={{ marginRight: 4 }} />
                                                    {s?.name || sid.substring(0, 8)}
                                                </Tag>
                                            );
                                        })}
                                        <Button
                                            type="dashed"
                                            size="small"
                                            icon={<PlusOutlined />}
                                            onClick={() => setSecretsModalOpen(true)}
                                            style={{ fontSize: 12, height: 24, borderRadius: 4 }}
                                        >
                                            添加密钥源
                                        </Button>
                                    </div>
                                </div>
                            </Form.Item>
                        </div>

                        {/* ========== Card 4: 变量配置 ========== */}
                        <div className="template-form-card">
                            <h4 className="template-form-section-title">
                                <SettingOutlined />变量配置
                                {selectedPlaybook && (
                                    <Tag color="blue" style={{ marginLeft: 8, fontWeight: 400 }}>
                                        {selectedPlaybook.name}
                                    </Tag>
                                )}
                                <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 400, color: '#8c8c8c' }}>
                                    {variables.length > 0 ? `${variables.filter(v => v.required).length} 必填 / ${variables.length} 总计` : ''}
                                </span>
                            </h4>

                            {variables.length > 0 && (
                                <div className="template-form-var-toolbar">
                                    <Input
                                        placeholder="搜索变量名..."
                                        prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                                        value={varSearch}
                                        onChange={e => setVarSearch(e.target.value)}
                                        allowClear
                                        style={{ width: 220 }}
                                    />
                                    <Space>
                                        <Text style={{ fontSize: 13 }}>仅必填</Text>
                                        <Switch size="small" checked={showOnlyRequired} onChange={setShowOnlyRequired} />
                                    </Space>
                                </div>
                            )}

                            {!selectedPlaybook ? (
                                <div className="template-form-var-empty">
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description="请先在上方选择 Playbook，变量将自动加载"
                                    />
                                </div>
                            ) : loadingPlaybook ? (
                                <div className="template-form-var-empty">
                                    <Spin tip="正在解析变量..." />
                                </div>
                            ) : filteredVariables.length === 0 ? (
                                <div className="template-form-var-empty">
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description={variables.length === 0 ? '该 Playbook 无可配置变量' : '未找到匹配的变量'}
                                    />
                                </div>
                            ) : (
                                filteredVariables.map((record) => (
                                    <div key={record.name} className="template-form-var-row">
                                        <div className="template-form-var-label">
                                            <div>
                                                <span className="var-name">{record.name}</span>
                                                {record.required && <span className="var-required">*</span>}
                                            </div>
                                            <div className="var-type">{record.type}</div>
                                        </div>
                                        <div className="template-form-var-input">
                                            <Form.Item
                                                style={{ marginBottom: 0 }}
                                                rules={[{ required: record.required, message: '必填' }]}
                                            >
                                                <VariableInput
                                                    variable={record}
                                                    value={variableValues[record.name]}
                                                    onChange={val => handleVariableChange(record.name, val)}
                                                />
                                            </Form.Item>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* ========== Card 5: 通知配置 ========== */}
                        <div className="template-form-card">
                            <h4 className="template-form-section-title">
                                <BellOutlined />通知配置
                            </h4>

                            <Form.Item name="notification_config" noStyle>
                                <NotificationSelector
                                    channels={notifyChannels}
                                    templates={notifyTemplates}
                                />
                            </Form.Item>
                        </div>

                    </div>
                </Form>
            </Spin>

            {/* 密钥源选择弹窗 */}
            <SecretsSourceSelector
                open={secretsModalOpen}
                sources={secretsSources}
                onConfirm={handleSecretsConfirm}
                onCancel={() => setSecretsModalOpen(false)}
            />
        </div>
    );
};

export default TemplateFormPage;

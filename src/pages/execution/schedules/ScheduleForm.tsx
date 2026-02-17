import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Button, message, Space, Tag, Typography, Input, Form, Alert,
    Tooltip, Select, Checkbox, Row, Col, Spin, Radio, DatePicker,
    Avatar, Pagination, Empty
} from 'antd';
import {
    ClockCircleOutlined, RocketOutlined, CodeOutlined,
    BellOutlined, SettingOutlined,
    SearchOutlined, ThunderboltOutlined,
    PlayCircleOutlined
} from '@ant-design/icons';
import { history, useParams } from '@umijs/max';
import dayjs from 'dayjs';
import SubPageHeader from '@/components/SubPageHeader';
import {
    getExecutionSchedule, createExecutionSchedule, updateExecutionSchedule,
    getExecutionTasks
} from '@/services/auto-healing/execution';
import { getPlaybooks, getPlaybook } from '@/services/auto-healing/playbooks';
import { getSecretsSources } from '@/services/auto-healing/secrets';
import { getChannels, getTemplates } from '@/services/auto-healing/notification';
import VariableInput, { extractDefaultValue } from '@/components/VariableInput';
import HostSelector from '@/components/HostSelector';
import HostList from '../execute/components/HostList';
import SecretsSelector from '@/components/SecretsSelector';
import CronEditor from '@/components/CronEditor';
import NotificationConfigDisplay from '@/components/NotificationSelector/NotificationConfigDisplay';
import '../templates/TemplateForm.css';
import '@/components/StandardTable/index.css';
import './schedule.css';

const { Text } = Typography;

const ScheduleForm: React.FC = () => {
    const params = useParams<{ id?: string }>();
    const isEdit = !!params.id;

    // Step: 'select' (choose template) or 'configure' (set schedule params)
    const [step, setStep] = useState<'select' | 'configure'>(isEdit ? 'configure' : 'select');

    // Data State
    const [templates, setTemplates] = useState<AutoHealing.ExecutionTask[]>([]);
    const [playbooks, setPlaybooks] = useState<AutoHealing.Playbook[]>([]);
    const [secretsSources, setSecretsSources] = useState<AutoHealing.SecretsSource[]>([]);
    const [channels, setChannels] = useState<AutoHealing.NotificationChannel[]>([]);
    const [notifyTemplates, setNotifyTemplates] = useState<{ id: string; name: string }[]>([]);

    // Loading
    const [loading, setLoading] = useState(true);
    const [loadingPlaybook, setLoadingPlaybook] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Selection & Form
    const [selectedTemplate, setSelectedTemplate] = useState<AutoHealing.ExecutionTask | null>(null);
    const [editingSchedule, setEditingSchedule] = useState<AutoHealing.ExecutionSchedule | null>(null);
    const [form] = Form.useForm();

    // Template Filters
    const [searchText, setSearchText] = useState('');
    const [filterExecutor, setFilterExecutor] = useState('');
    const [filterNotification, setFilterNotification] = useState<string>('');
    const [onlyReady, setOnlyReady] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);

    // Execution Parameter Overrides
    const [templatePlaybook, setTemplatePlaybook] = useState<AutoHealing.Playbook | null>(null);
    const [targetHostsOverride, setTargetHostsOverride] = useState<string[]>([]);
    const [secretsSourceIds, setSecretsSourceIds] = useState<string[]>([]);
    const [variableValues, setVariableValues] = useState<Record<string, any>>({});
    const [skipNotification, setSkipNotification] = useState(false);

    // ==================== Data Loading ====================
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [taskRes, pbRes, secretsRes, channelsRes, tplRes] = await Promise.all([
                    getExecutionTasks({ page: 1, page_size: 100 }),
                    getPlaybooks({ page_size: 100 }),
                    getSecretsSources(),
                    getChannels({ page_size: 100 }),
                    getTemplates({ page: 1, page_size: 100 }).catch(() => ({ data: [] })),
                ]);
                const templatesData = taskRes.data || [];
                setTemplates(templatesData);
                setPlaybooks(pbRes.data || pbRes.items || []);
                setSecretsSources(secretsRes.data || []);
                setChannels(channelsRes.data || []);
                setNotifyTemplates((tplRes as any).data || []);

                // If editing, load the schedule data
                if (isEdit && params.id) {
                    const scheduleRes = await getExecutionSchedule(params.id);
                    const schedule = scheduleRes?.data || (scheduleRes as any);
                    if (schedule) {
                        setEditingSchedule(schedule);
                        const template = templatesData.find((t: any) => t.id === schedule.task_id);
                        if (template) {
                            setSelectedTemplate(template);
                            // Load playbook
                            if (template.playbook_id) {
                                try {
                                    const pbDetail = await getPlaybook(template.playbook_id);
                                    setTemplatePlaybook(pbDetail.data || null);
                                } catch { }
                            }
                        }
                        // Populate form
                        form.setFieldsValue({
                            name: schedule.name,
                            task_id: schedule.task_id,
                            schedule_type: schedule.schedule_type,
                            schedule_expr: schedule.schedule_expr,
                            scheduled_at: schedule.scheduled_at ? dayjs(schedule.scheduled_at) : undefined,
                            description: schedule.description,
                        });
                        // Populate overrides
                        if (schedule.target_hosts_override) {
                            setTargetHostsOverride(schedule.target_hosts_override.split(',').filter(Boolean));
                        }
                        if (schedule.extra_vars_override) {
                            setVariableValues(schedule.extra_vars_override);
                        }
                        if (schedule.secrets_source_ids) {
                            setSecretsSourceIds(schedule.secrets_source_ids);
                        }
                        if (schedule.skip_notification) {
                            setSkipNotification(true);
                        }
                    }
                }
            } catch (e) {
                message.error('加载数据失败');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [isEdit, params.id]);

    // ==================== Template Selection ====================
    const filteredTemplates = useMemo(() => {
        let result = templates;
        if (searchText) {
            const lower = searchText.toLowerCase();
            result = result.filter(t =>
                t.name?.toLowerCase().includes(lower) ||
                t.playbook?.name?.toLowerCase().includes(lower) ||
                t.description?.toLowerCase().includes(lower)
            );
        }
        if (filterExecutor) result = result.filter(t => t.executor_type === filterExecutor);
        if (filterNotification === 'yes') result = result.filter(t => t.notification_config?.enabled);
        if (filterNotification === 'no') result = result.filter(t => !t.notification_config?.enabled);
        if (onlyReady) result = result.filter(t => !t.needs_review && t.playbook?.status === 'ready');
        return result;
    }, [templates, searchText, filterExecutor, filterNotification, onlyReady]);

    const paginatedTemplates = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredTemplates.slice(start, start + pageSize);
    }, [filteredTemplates, currentPage, pageSize]);

    const handleSelectTemplate = useCallback(async (t: AutoHealing.ExecutionTask) => {
        setSelectedTemplate(t);
        form.setFieldsValue({ task_id: t.id, schedule_type: 'cron' });

        // Load playbook for variable overrides
        if (t.playbook_id) {
            setLoadingPlaybook(true);
            try {
                const res = await getPlaybook(t.playbook_id);
                if (res.data) {
                    setTemplatePlaybook(res.data);
                    const vars = (res.data.variables && res.data.variables.length > 0)
                        ? res.data.variables
                        : ((res.data as any).scanned_variables || []);
                    const initials: Record<string, any> = {};
                    vars.forEach((v: any) => {
                        const def = extractDefaultValue(v);
                        if (def !== undefined && def !== '') initials[v.name] = def;
                    });
                    setVariableValues(initials);
                }
            } catch { }
            setLoadingPlaybook(false);
        }
        setStep('configure');
    }, [form]);

    const handleVariableChange = (name: string, value: any) => {
        setVariableValues(prev => ({ ...prev, [name]: value }));
    };

    // ==================== Submit ====================
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            const requestData = {
                ...values,
                schedule_expr: values.schedule_type === 'cron' ? values.schedule_expr : undefined,
                scheduled_at: values.schedule_type === 'once' && values.scheduled_at
                    ? (dayjs.isDayjs(values.scheduled_at) ? values.scheduled_at.format() : values.scheduled_at)
                    : undefined,
                target_hosts_override: targetHostsOverride.length > 0 ? targetHostsOverride.join(',') : undefined,
                extra_vars_override: Object.keys(variableValues).length > 0 ? variableValues : undefined,
                secrets_source_ids: secretsSourceIds.length > 0 ? secretsSourceIds : undefined,
                skip_notification: skipNotification || undefined,
            };

            if (isEdit && editingSchedule) {
                await updateExecutionSchedule(editingSchedule.id, requestData);
                message.success('调度已更新');
            } else {
                await createExecutionSchedule(requestData);
                message.success('调度已创建');
            }
            history.push('/execution/schedules');
        } catch (error) {
            if (!(error as any).errorFields) {
                message.error('提交失败，请重试');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // ==================== Notification ====================
    const hasNotificationConfig = useMemo(() => {
        return selectedTemplate?.notification_config?.enabled === true;
    }, [selectedTemplate]);

    // ==================== Render ====================
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <Spin size="large" tip="加载中..." />
            </div>
        );
    }

    // Step 1: Template Selection
    if (step === 'select') {
        return (
            <div className="template-form-page">
                <SubPageHeader
                    title="创建定时调度"
                    titleExtra={<span style={{ color: '#8c8c8c', fontSize: 13 }}>第 1 步：选择任务模板</span>}
                    onBack={() => history.push('/execution/schedules')}
                />
                <div className="template-form-cards" style={{ maxWidth: 1100 }}>

                    {/* ========== Card 1: 搜索筛选 ========== */}
                    <div className="template-form-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Space wrap>
                                <Input
                                    placeholder="搜索名称 / Playbook / 描述..."
                                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                    value={searchText}
                                    onChange={e => { setSearchText(e.target.value); setCurrentPage(1); }}
                                    allowClear
                                    style={{ width: 260 }}
                                />
                                <Select
                                    placeholder="执行器"
                                    allowClear
                                    style={{ width: 120 }}
                                    value={filterExecutor || undefined}
                                    onChange={v => { setFilterExecutor(v || ''); setCurrentPage(1); }}
                                    options={[
                                        { label: 'SSH/Local', value: 'local' },
                                        { label: 'Docker', value: 'docker' }
                                    ]}
                                />
                                <Select
                                    placeholder="通知"
                                    allowClear
                                    style={{ width: 110 }}
                                    value={filterNotification || undefined}
                                    onChange={v => { setFilterNotification(v || ''); setCurrentPage(1); }}
                                    options={[
                                        { label: '已配置通知', value: 'yes' },
                                        { label: '未配置通知', value: 'no' }
                                    ]}
                                />
                                <Checkbox checked={onlyReady} onChange={e => { setOnlyReady(e.target.checked); setCurrentPage(1); }}>
                                    <Text type="secondary">仅就绪</Text>
                                </Checkbox>
                            </Space>
                            <Text type="secondary">{filteredTemplates.length} 个模板</Text>
                        </div>
                    </div>

                    {/* ========== Card 2: 模板列表 ========== */}
                    <div className="template-form-card">
                        <h4 className="template-form-section-title">
                            <RocketOutlined />选择任务模板
                            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 400, color: '#8c8c8c' }}>
                                点击选择模板进入配置
                            </span>
                        </h4>

                        {paginatedTemplates.length === 0 ? (
                            <div className="template-form-var-empty">
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="没有匹配的模板"
                                />
                            </div>
                        ) : (
                            <Row gutter={[12, 12]}>
                                {paginatedTemplates.map(t => (
                                    <Col key={t.id} xs={24} sm={12} md={8} lg={6}>
                                        <div
                                            className="schedule-tpl-pick-card"
                                            onClick={() => handleSelectTemplate(t)}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                <Avatar
                                                    size={28}
                                                    style={{
                                                        background: t.executor_type === 'docker' ? '#e6f7ff' : '#f6ffed',
                                                        color: t.executor_type === 'docker' ? '#1890ff' : '#52c41a',
                                                        flexShrink: 0,
                                                    }}
                                                    icon={t.executor_type === 'docker' ? <ThunderboltOutlined /> : <CodeOutlined />}
                                                />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <Text strong ellipsis style={{ fontSize: 13 }}>{t.name}</Text>
                                                </div>
                                            </div>
                                            <Text type="secondary" ellipsis style={{ fontSize: 11, display: 'block', marginBottom: 6 }}>
                                                {t.playbook?.name || 'N/A'}
                                            </Text>
                                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                <Tag style={{ fontSize: 10, margin: 0 }}>
                                                    {t.executor_type === 'docker' ? 'Docker' : 'SSH/Local'}
                                                </Tag>
                                                {t.needs_review ? (
                                                    <Tag color="warning" style={{ fontSize: 10, margin: 0 }}>待审核</Tag>
                                                ) : t.playbook?.status === 'ready' ? (
                                                    <Tag color="success" style={{ fontSize: 10, margin: 0 }}>就绪</Tag>
                                                ) : (
                                                    <Tag color="default" style={{ fontSize: 10, margin: 0 }}>离线</Tag>
                                                )}
                                            </div>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        )}

                        <div className="standard-table-footer">
                            <Pagination
                                current={currentPage}
                                total={filteredTemplates.length}
                                pageSize={pageSize}
                                showTotal={(t) => `共 ${t} 条`}
                                showSizeChanger={{ showSearch: false }}
                                pageSizeOptions={[12, 24, 48]}
                                showQuickJumper
                                onChange={(p, ps) => { setCurrentPage(p); if (ps !== pageSize) setPageSize(ps); }}
                                onShowSizeChange={(_, size) => { setCurrentPage(1); setPageSize(size); }}
                            />
                        </div>
                    </div>

                </div>
            </div>
        );
    }

    // Step 2: Configure Schedule
    return (
        <div className="template-form-page">
            <SubPageHeader
                title={isEdit ? '编辑定时调度' : '创建定时调度'}
                titleExtra={<span style={{ color: '#8c8c8c', fontSize: 13 }}>{isEdit ? `编辑 #${editingSchedule?.id?.slice(0, 8).toUpperCase()}` : '第 2 步：配置调度参数'}</span>}
                onBack={() => isEdit ? history.push('/execution/schedules') : setStep('select')}
                actions={
                    <div className="template-form-actions">
                        <Button onClick={() => isEdit ? history.push('/execution/schedules') : setStep('select')}>取消</Button>
                        <Button type="primary" onClick={handleSubmit} loading={submitting}>
                            {isEdit ? '保存配置' : '创建调度'}
                        </Button>
                    </div>
                }
            />

            <Form form={form} layout="vertical" requiredMark={false} size="large">
                <div className="template-form-cards">

                    {/* ========== Card 1: 调度信息 ========== */}
                    <div className="template-form-card">
                        <h4 className="template-form-section-title">
                            <ClockCircleOutlined />调度信息
                        </h4>
                        <Form.Item name="task_id" hidden><Input /></Form.Item>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="name"
                                    label="调度名称"
                                    rules={[{ required: true, message: '请输入调度名称' }]}
                                    extra="简短描述该调度的用途，例如「每日数据库备份」"
                                >
                                    <Input placeholder="例如：每日数据库备份" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="schedule_type"
                                    label="调度类型"
                                    rules={[{ required: true, message: '请选择调度类型' }]}
                                    tooltip="循环执行：按 Cron 表达式周期性触发；单次执行：在指定时间执行一次"
                                >
                                    <Radio.Group>
                                        <Radio.Button value="cron">循环执行 (Cron)</Radio.Button>
                                        <Radio.Button value="once">单次执行</Radio.Button>
                                    </Radio.Group>
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.schedule_type !== curr.schedule_type}>
                            {({ getFieldValue }) => {
                                const scheduleType = getFieldValue('schedule_type');
                                if (scheduleType === 'once') {
                                    return (
                                        <Form.Item
                                            label="执行时间"
                                            name="scheduled_at"
                                            rules={[{ required: true, message: '请选择执行时间' }]}
                                            extra="选择具体的日期和时间"
                                        >
                                            <DatePicker
                                                showTime
                                                format="YYYY-MM-DD HH:mm:ss"
                                                placeholder="选择执行时间"
                                                style={{ width: '100%' }}
                                            />
                                        </Form.Item>
                                    );
                                }
                                return (
                                    <Form.Item
                                        label="Cron 表达式"
                                        name="schedule_expr"
                                        rules={[{ required: scheduleType === 'cron', message: '请设置 Cron 表达式' }]}
                                        extra="定义调度的执行周期"
                                    >
                                        <CronEditor size="middle" />
                                    </Form.Item>
                                );
                            }}
                        </Form.Item>
                        <Form.Item
                            name="description"
                            label="备注描述"
                            extra="可选，用于记录该调度的详细说明或注意事项"
                        >
                            <Input.TextArea rows={3} placeholder="可选：任务用途说明..." showCount maxLength={500} />
                        </Form.Item>
                    </div>

                    {/* ========== Card 2: 任务模板 ========== */}
                    {selectedTemplate && (
                        <div className="template-form-card">
                            <h4 className="template-form-section-title">
                                <RocketOutlined />任务模板
                                <Tag color="blue" style={{ marginLeft: 8, fontWeight: 400 }}>
                                    {selectedTemplate.executor_type === 'docker' ? 'Docker' : 'SSH/Local'}
                                </Tag>
                            </h4>
                            <Row gutter={16}>
                                <Col span={8}>
                                    <div style={{ marginBottom: 4 }}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>模板名称</Text>
                                    </div>
                                    <Text strong>{selectedTemplate.name}</Text>
                                </Col>
                                <Col span={8}>
                                    <div style={{ marginBottom: 4 }}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>Playbook</Text>
                                    </div>
                                    <Text>{selectedTemplate.playbook?.name || 'N/A'}</Text>
                                </Col>
                                <Col span={8}>
                                    <div style={{ marginBottom: 4 }}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>默认主机</Text>
                                    </div>
                                    <HostList hosts={selectedTemplate.target_hosts || ''} />
                                </Col>
                            </Row>
                        </div>
                    )}

                    {/* ========== Card 3: 执行参数覆盖 ========== */}
                    <div className="template-form-card">
                        <h4 className="template-form-section-title">
                            <SettingOutlined />执行参数覆盖
                            <Tag color="orange" style={{ marginLeft: 8, fontWeight: 400 }}>覆盖模式</Tag>
                            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 400, color: '#8c8c8c' }}>
                                留空则使用模板默认值
                            </span>
                        </h4>
                        <Alert
                            message="调度执行时，以下参数将覆盖任务模板的默认配置"
                            type="info"
                            showIcon
                            style={{ marginBottom: 20 }}
                        />
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="目标主机覆盖"
                                    extra="留空则使用模板的默认目标主机"
                                    tooltip="选择后将覆盖任务模板中配置的目标主机"
                                >
                                    <HostSelector
                                        value={targetHostsOverride}
                                        onChange={setTargetHostsOverride}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="密钥源覆盖"
                                    extra="可选，选择后将覆盖模板的默认凭据"
                                    tooltip="选择用于 SSH 连接的凭据"
                                >
                                    <SecretsSelector
                                        value={secretsSourceIds}
                                        onChange={setSecretsSourceIds}
                                        dataSource={secretsSources}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>

                    {/* ========== Card 4: 变量覆盖 ========== */}
                    <div className="template-form-card">
                        <h4 className="template-form-section-title">
                            <CodeOutlined />变量覆盖
                            {templatePlaybook && (
                                <Tag color="blue" style={{ marginLeft: 8, fontWeight: 400 }}>
                                    {templatePlaybook.name}
                                </Tag>
                            )}
                            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 400, color: '#8c8c8c' }}>
                                {(templatePlaybook?.variables || []).length > 0
                                    ? `${(templatePlaybook?.variables || []).filter(v => v.required).length} 必填 / ${(templatePlaybook?.variables || []).length} 总计`
                                    : ''}
                            </span>
                        </h4>
                        {loadingPlaybook ? (
                            <div className="template-form-var-empty">
                                <Spin tip="加载变量..." />
                            </div>
                        ) : (templatePlaybook?.variables || []).length === 0 ? (
                            <div className="template-form-var-empty">
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="该 Playbook 无可配置变量"
                                />
                            </div>
                        ) : (
                            (templatePlaybook?.variables || []).map(v => (
                                <div key={v.name} className="template-form-var-row">
                                    <div className="template-form-var-label">
                                        <div>
                                            <span className="var-name">{v.name}</span>
                                            {v.required && <span className="var-required">*</span>}
                                        </div>
                                        <div className="var-type">{v.type}</div>
                                    </div>
                                    <div className="template-form-var-input">
                                        <VariableInput
                                            variable={v}
                                            value={variableValues[v.name]}
                                            onChange={val => handleVariableChange(v.name, val)}
                                        />
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
                        <NotificationConfigDisplay
                            value={selectedTemplate?.notification_config}
                            channels={channels}
                            templates={notifyTemplates}
                            compact
                        />
                        {hasNotificationConfig && (
                            <div style={{ marginTop: 12 }}>
                                <Checkbox
                                    checked={skipNotification}
                                    onChange={e => setSkipNotification(e.target.checked)}
                                >
                                    <Text type="secondary">调度执行时跳过通知</Text>
                                </Checkbox>
                            </div>
                        )}
                    </div>

                </div>
            </Form>
        </div>
    );
};

export default ScheduleForm;

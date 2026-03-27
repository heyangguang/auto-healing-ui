import React, { useCallback, useState } from 'react';
import { history } from '@umijs/max';
import {
    Button, Col, Form, Input, Row, Select, Space, Tag, Typography, message,
} from 'antd';
import {
    CheckCircleOutlined,
    ExperimentOutlined,
    FileTextOutlined,
    SafetyCertificateOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import SubPageHeader from '@/components/SubPageHeader';
import TaskTemplateSelector from '@/pages/healing/flows/editor/TaskTemplateSelector';
import type { CommandBlacklistRule } from '@/services/auto-healing/commandBlacklist';
import { createBlacklistExemption } from '@/services/auto-healing/blacklistExemption';
import { extractErrorMsg } from '@/utils/errorMsg';
import ExemptionRuleSelector from './ExemptionRuleSelector';
import '../command-blacklist/BlacklistRuleForm.css';

const { TextArea } = Input;
const { Text } = Typography;

const SEVERITY_COLORS: Record<string, string> = {
    critical: 'red', high: 'orange', medium: 'gold',
};

const SEVERITY_LABELS: Record<string, string> = {
    critical: '严重', high: '高危', medium: '中危',
};

const VALIDITY_OPTIONS = [
    { value: 7, label: '7 天' },
    { value: 14, label: '14 天' },
    { value: 30, label: '30 天' },
    { value: 60, label: '60 天' },
    { value: 90, label: '90 天' },
];

const hasFormErrorFields = (error: unknown): error is { errorFields: unknown } =>
    typeof error === 'object' && error !== null && 'errorFields' in error;

/* ============================== 主表单组件 ============================== */

const ExemptionForm: React.FC = () => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    // 选择器状态
    const [taskSelectorOpen, setTaskSelectorOpen] = useState(false);
    const [ruleSelectorOpen, setRuleSelectorOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<AutoHealing.ExecutionTask | null>(null);
    const [selectedRule, setSelectedRule] = useState<CommandBlacklistRule | null>(null);

    // 任务模板选择回调
    const handleTaskSelect = useCallback((id: string, template: AutoHealing.ExecutionTask) => {
        setSelectedTask(template);
        form.setFieldsValue({ task_id: id });
        setTaskSelectorOpen(false);
    }, [form]);

    // 规则选择回调
    const handleRuleSelect = useCallback((id: string, rule: CommandBlacklistRule) => {
        setSelectedRule(rule);
        form.setFieldsValue({ rule_id: id });
        setRuleSelectorOpen(false);
    }, [form]);

    // 提交
    const handleSubmit = useCallback(async () => {
        try {
            const values = await form.validateFields();
            if (!selectedTask || !selectedRule) {
                message.warning('请选择任务模板和黑名单规则');
                return;
            }
            setSubmitting(true);

            await createBlacklistExemption({
                task_id: values.task_id,
                task_name: selectedTask.name,
                rule_id: values.rule_id,
                rule_name: selectedRule.name,
                rule_severity: selectedRule.severity,
                rule_pattern: selectedRule.pattern,
                reason: values.reason,
                validity_days: values.validity_days,
            });

            message.success('豁免申请已提交，等待审批');
            history.push('/security/exemptions');
        } catch (err: unknown) {
            if (hasFormErrorFields(err)) return;
            message.error(extractErrorMsg(err as Parameters<typeof extractErrorMsg>[0], '提交豁免申请失败，请稍后重试'));
        } finally {
            setSubmitting(false);
        }
    }, [form, selectedTask, selectedRule]);

    return (
        <div className="blacklist-form-page">
            <SubPageHeader
                title="申请安全豁免"
                onBack={() => history.push('/security/exemptions')}
                actions={
                    <div className="blacklist-form-header-actions">
                        <Button onClick={() => history.push('/security/exemptions')}>取消</Button>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            loading={submitting}
                            onClick={handleSubmit}
                        >
                            提交申请
                        </Button>
                    </div>
                }
            />

            <Form form={form} layout="vertical" requiredMark={false} initialValues={{ validity_days: 30 }} size="large">
                <div className="blacklist-form-cards">

                    {/* ========== Card 1: 任务模板 ========== */}
                    <div className="blacklist-form-card">
                        <h4 className="blacklist-form-section-title">
                            <FileTextOutlined />任务模板
                        </h4>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
                            选择需要申请安全豁免的任务模板。该任务模板在执行时将跳过已豁免的高危指令规则检查。
                        </Text>

                        <Form.Item
                            name="task_id"
                            rules={[{ required: true, message: '请选择任务模板' }]}
                        >
                            <Input style={{ display: 'none' }} />
                        </Form.Item>

                        <div
                            onClick={() => setTaskSelectorOpen(true)}
                            style={{
                                border: '1px dashed #d9d9d9',
                                padding: selectedTask ? '12px 16px' : '24px 16px',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                textAlign: selectedTask ? 'left' : 'center',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#1677ff'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#d9d9d9'; }}
                        >
                            {selectedTask ? (
                                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                    <Space>
                                        <Tag icon={<CheckCircleOutlined />} color="success" style={{ margin: 0 }}>已选择</Tag>
                                        <Text strong>{selectedTask.name}</Text>
                                    </Space>
                                    {selectedTask.playbook && (
                                        <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
                                            Playbook: {selectedTask.playbook.name}
                                        </Text>
                                    )}
                                </Space>
                            ) : (
                                <Space direction="vertical" size={2} align="center">
                                    <FileTextOutlined style={{ fontSize: 24, color: '#bfbfbf' }} />
                                    <Text type="secondary">点击选择任务模板</Text>
                                </Space>
                            )}
                        </div>
                    </div>

                    {/* ========== Card 2: 豁免规则 ========== */}
                    <div className="blacklist-form-card">
                        <h4 className="blacklist-form-section-title">
                            <SafetyCertificateOutlined />豁免规则
                        </h4>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
                            选择需要豁免的高危指令黑名单规则。只显示当前已启用的规则。
                        </Text>

                        <Form.Item
                            name="rule_id"
                            rules={[{ required: true, message: '请选择要豁免的规则' }]}
                        >
                            <Input style={{ display: 'none' }} />
                        </Form.Item>

                        <div
                            onClick={() => setRuleSelectorOpen(true)}
                            style={{
                                border: '1px dashed #d9d9d9',
                                padding: selectedRule ? '12px 16px' : '24px 16px',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                textAlign: selectedRule ? 'left' : 'center',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#1677ff'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#d9d9d9'; }}
                        >
                            {selectedRule ? (
                                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                    <Space>
                                        <Tag color={SEVERITY_COLORS[selectedRule.severity]} style={{ margin: 0 }}>
                                            {SEVERITY_LABELS[selectedRule.severity] || selectedRule.severity}
                                        </Tag>
                                        <Text strong>{selectedRule.name}</Text>
                                        <Tag style={{ margin: 0, fontSize: 10 }}>{selectedRule.match_type}</Tag>
                                    </Space>
                                    <Text code style={{ fontSize: 12 }}>{selectedRule.pattern}</Text>
                                    {selectedRule.description && (
                                        <Text type="secondary" style={{ fontSize: 12 }}>{selectedRule.description}</Text>
                                    )}
                                </Space>
                            ) : (
                                <Space direction="vertical" size={2} align="center">
                                    <SafetyCertificateOutlined style={{ fontSize: 24, color: '#bfbfbf' }} />
                                    <Text type="secondary">点击选择黑名单规则</Text>
                                </Space>
                            )}
                        </div>
                    </div>

                    {/* ========== Card 3: 豁免信息 ========== */}
                    <div className="blacklist-form-card">
                        <h4 className="blacklist-form-section-title">
                            <ExperimentOutlined />豁免信息
                        </h4>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
                            填写豁免原因和有效期。审批人将根据这些信息决定是否批准。
                        </Text>

                        <Form.Item
                            name="reason"
                            label="豁免原因"
                            rules={[{ required: true, message: '请填写豁免原因' }]}
                            extra="请详细说明为何需要在任务模板中使用该高危命令"
                        >
                            <TextArea
                                placeholder="例如：新服务器上线初始化脚本需要使用 mkfs 格式化数据盘..."
                                rows={4}
                            />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item
                                    name="validity_days"
                                    label="有效期"
                                    rules={[{ required: true, message: '请选择有效期' }]}
                                >
                                    <Select options={VALIDITY_OPTIONS} placeholder="选择有效期" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>

                </div>
            </Form>

            {/* ====== 任务模板选择器 ====== */}
            <TaskTemplateSelector
                open={taskSelectorOpen}
                value={selectedTask?.id}
                onSelect={handleTaskSelect}
                onCancel={() => setTaskSelectorOpen(false)}
            />

            {/* ====== 黑名单规则选择器 ====== */}
            <ExemptionRuleSelector
                open={ruleSelectorOpen}
                value={selectedRule?.id}
                onSelect={handleRuleSelect}
                onCancel={() => setRuleSelectorOpen(false)}
            />
        </div>
    );
};

export default ExemptionForm;

import React, { useState, useEffect, useCallback } from 'react';
import {
    Form, Input, InputNumber, Segmented, Alert, Button, Space, Spin, message,
    Tag, Typography,
} from 'antd';
import {
    SaveOutlined, SafetyCertificateOutlined, BranchesOutlined, AimOutlined,
    ExperimentOutlined, PlusOutlined, CloseCircleOutlined, CheckCircleOutlined,
    ThunderboltOutlined, AuditOutlined, BellOutlined, ForkOutlined,
    NodeIndexOutlined, ApiOutlined, EyeOutlined,
} from '@ant-design/icons';
import { history, useParams } from '@umijs/max';
import SubPageHeader from '@/components/SubPageHeader';
import { ConditionBuilder } from './ConditionBuilder';
import { RuleTester } from './RuleTester';
import FlowSelector from './FlowSelector';
import {
    getHealingRule, createHealingRule, updateHealingRule,
} from '@/services/auto-healing/healing-rules';
import { getFlows } from '@/services/auto-healing/healing';

// 节点类型元数据 — 与 FlowSelector 保持一致
const NODE_TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    execution: { label: '执行', icon: <ThunderboltOutlined />, color: '#1890ff' },
    approval: { label: '审批', icon: <AuditOutlined />, color: '#faad14' },
    condition: { label: '条件', icon: <ForkOutlined />, color: '#722ed1' },
    notification: { label: '通知', icon: <BellOutlined />, color: '#52c41a' },
    host_extractor: { label: '主机提取', icon: <ApiOutlined />, color: '#13c2c2' },
    cmdb_validator: { label: 'CMDB验证', icon: <EyeOutlined />, color: '#eb2f96' },
    compute: { label: '计算', icon: <NodeIndexOutlined />, color: '#fa8c16' },
};
import './RuleForm.css';

const { Text } = Typography;

const { TextArea } = Input;

const RuleFormPage: React.FC = () => {
    const params = useParams<{ id?: string }>();
    const isEdit = !!params.id;

    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [conditions, setConditions] = useState<AutoHealing.HealingRuleCondition[]>([]);
    const [testerOpen, setTesterOpen] = useState(false);

    // FlowSelector
    const [flowSelectorOpen, setFlowSelectorOpen] = useState(false);
    const [selectedFlow, setSelectedFlow] = useState<AutoHealing.HealingFlow | null>(null);

    // ==================== Load Selected Flow (for edit mode) ====================
    const loadFlowById = useCallback(async (flowId: string) => {
        try {
            const res = await getFlows({ page: 1, page_size: 200 });
            const found = (res.data || []).find(f => f.id === flowId);
            if (found) setSelectedFlow(found);
        } catch { /* */ }
    }, []);

    // ==================== Load Rule (Edit mode) ====================
    const loadRule = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const res = await getHealingRule(id);
            const rule = res.data;
            // Load linked flow data
            if (rule.flow_id) {
                loadFlowById(rule.flow_id);
            }
            form.setFieldsValue({
                name: rule.name,
                description: rule.description || '',
                priority: rule.priority,
                trigger_mode: rule.trigger_mode,
                flow_id: rule.flow_id || undefined,
                match_mode: rule.match_mode || 'all',
            });
            setConditions(rule.conditions || []);
        } catch {
            message.error('加载规则失败');
            history.push('/healing/rules');
        } finally {
            setLoading(false);
        }
    }, [form]);

    useEffect(() => {
        if (isEdit && params.id) {
            loadRule(params.id);
        }
    }, [isEdit, params.id, loadRule]);

    // ==================== Submit ====================
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSaving(true);

            const payload = {
                name: values.name,
                description: values.description || '',
                priority: values.priority,
                trigger_mode: values.trigger_mode,
                flow_id: selectedFlow?.id || '',
                match_mode: values.match_mode || 'all',
                conditions: conditions || [],
            };

            if (isEdit && params.id) {
                await updateHealingRule(params.id, payload);
                message.success('规则已更新');
            } else {
                await createHealingRule(payload);
                message.success('规则已创建');
            }
            history.push('/healing/rules');
        } catch (err: any) {
            if (err?.errorFields) return; // form validation error
        } finally {
            setSaving(false);
        }
    };

    // ==================== Render ====================
    if (loading) {
        return (
            <div className="rule-form-loading">
                <Spin size="large" tip="加载中..." />
            </div>
        );
    }

    return (
        <div className="rule-form-page">
            <SubPageHeader
                title={isEdit ? '编辑自愈规则' : '新建自愈规则'}
                onBack={() => history.push('/healing/rules')}
                actions={
                    <Space>
                        <Button
                            icon={<ExperimentOutlined />}
                            onClick={() => setTesterOpen(true)}
                        >
                            规则测试
                        </Button>
                        <Button onClick={() => history.push('/healing/rules')}>
                            取消
                        </Button>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            loading={saving}
                            onClick={handleSubmit}
                        >
                            {isEdit ? '保存修改' : '创建规则'}
                        </Button>
                    </Space>
                }
            />

            <div className="rule-form-cards">
                {/* Card 1: 基础信息 */}
                <div className="rule-form-card">
                    <h4 className="rule-form-section-title"><SafetyCertificateOutlined />基础信息</h4>
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={{
                            priority: 50,
                            trigger_mode: 'auto',
                            match_mode: 'all',
                        }}
                    >
                        <Form.Item
                            name="name"
                            label="规则名称"
                            rules={[{ required: true, message: '请输入规则名称' }]}
                        >
                            <Input placeholder="例如：磁盘空间不足自愈" maxLength={100} />
                        </Form.Item>

                        <Form.Item
                            name="priority"
                            label="优先级"
                            tooltip="优先级数值越大越优先匹配 (0-999)"
                            rules={[{ required: true, message: '请设置优先级' }]}
                        >
                            <InputNumber min={0} max={999} style={{ width: 180 }} />
                        </Form.Item>

                        <Form.Item
                            name="trigger_mode"
                            label="触发模式"
                            rules={[{ required: true, message: '请选择触发模式' }]}
                        >
                            <Segmented
                                options={[
                                    { label: '自动触发', value: 'auto' },
                                    { label: '人工确认', value: 'manual' },
                                ]}
                            />
                        </Form.Item>

                        <Form.Item
                            name="description"
                            label="描述"
                        >
                            <TextArea rows={3} placeholder="规则描述（可选）" maxLength={500} />
                        </Form.Item>
                    </Form>
                </div>

                {/* Card 2: 流程关联 */}
                <div className="rule-form-card">
                    <h4 className="rule-form-section-title"><BranchesOutlined />流程关联</h4>
                    <div style={{ marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>规则匹配成功后将执行所关联的自愈流程</Text>
                    </div>

                    {selectedFlow ? (
                        <div className="rule-form-selected-flow">
                            <div className="rule-form-selected-flow-main">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <BranchesOutlined style={{ color: '#1890ff' }} />
                                    <Text strong style={{ fontSize: 14 }}>{selectedFlow.name}</Text>
                                    {selectedFlow.is_active ? (
                                        <Tag icon={<CheckCircleOutlined />} color="success" style={{ margin: 0, fontSize: 10 }}>启用</Tag>
                                    ) : (
                                        <Tag color="default" style={{ margin: 0, fontSize: 10 }}>已停用</Tag>
                                    )}
                                </div>
                                {selectedFlow.description && (
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                                        {selectedFlow.description}
                                    </Text>
                                )}
                                <Space size={4} wrap>
                                    {(selectedFlow.nodes || []).filter(n => n.type !== 'start' && n.type !== 'end').length > 0 ? (
                                        Object.entries(
                                            (selectedFlow.nodes || []).reduce((acc, n) => {
                                                if (n.type !== 'start' && n.type !== 'end') {
                                                    acc[n.type] = (acc[n.type] || 0) + 1;
                                                }
                                                return acc;
                                            }, {} as Record<string, number>)
                                        ).map(([type, count]) => {
                                            const meta = NODE_TYPE_META[type] || { label: type, icon: <NodeIndexOutlined />, color: '#8c8c8c' };
                                            return (
                                                <Tag
                                                    key={type}
                                                    icon={meta.icon}
                                                    style={{
                                                        fontSize: 10,
                                                        lineHeight: '16px',
                                                        padding: '0 4px',
                                                        margin: 0,
                                                        color: meta.color,
                                                        borderColor: meta.color,
                                                        background: 'transparent',
                                                    }}
                                                >
                                                    {meta.label}×{count}
                                                </Tag>
                                            );
                                        })
                                    ) : (
                                        <Tag style={{ fontSize: 10, margin: 0, color: '#bfbfbf' }}>空流程</Tag>
                                    )}
                                    <Text type="secondary" style={{ fontSize: 10 }}>
                                        ({(selectedFlow.nodes || []).filter(n => n.type !== 'start' && n.type !== 'end').length}节点 · {(selectedFlow.edges || []).length}连线)
                                    </Text>
                                </Space>
                            </div>
                            <Space size={4}>
                                <Button
                                    type="link"
                                    size="small"
                                    onClick={() => setFlowSelectorOpen(true)}
                                >
                                    更换
                                </Button>
                                <Button
                                    type="link"
                                    danger
                                    size="small"
                                    icon={<CloseCircleOutlined />}
                                    onClick={() => {
                                        setSelectedFlow(null);
                                        form.setFieldValue('flow_id', undefined);
                                    }}
                                >
                                    清除
                                </Button>
                            </Space>
                        </div>
                    ) : (
                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            style={{ width: '100%', height: 56 }}
                            onClick={() => setFlowSelectorOpen(true)}
                        >
                            点击选择自愈流程
                        </Button>
                    )}

                    <FlowSelector
                        open={flowSelectorOpen}
                        value={selectedFlow?.id}
                        onSelect={(id, flow) => {
                            setSelectedFlow(flow);
                            form.setFieldValue('flow_id', id);
                            setFlowSelectorOpen(false);
                        }}
                        onCancel={() => setFlowSelectorOpen(false)}
                    />
                </div>

                {/* Card 3: 匹配条件 */}
                <div className="rule-form-card">
                    <h4 className="rule-form-section-title"><AimOutlined />匹配条件</h4>

                    <div className="rule-form-mode-selector">
                        <label>匹配逻辑：</label>
                        <Form form={form} layout="inline" style={{ flex: 1 }}>
                            <Form.Item name="match_mode" noStyle>
                                <Segmented
                                    options={[
                                        { label: 'AND 全部满足', value: 'all' },
                                        { label: 'OR 满足任一', value: 'any' },
                                    ]}
                                />
                            </Form.Item>
                        </Form>
                    </div>

                    <Alert
                        message="条件说明"
                        description="使用字段名匹配 ITSM 工单属性，支持嵌套逻辑组。常用字段：title（标题）、severity（严重级别）、category（分类）、affected_ci（影响CI）、raw_data.xxx（原始数据字段）。"
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />

                    <div className="rule-form-condition-area">
                        <ConditionBuilder
                            value={conditions}
                            onChange={setConditions}
                        />
                    </div>
                </div>
            </div>

            {/* Rule Tester Modal */}
            <RuleTester
                open={testerOpen}
                onCancel={() => setTesterOpen(false)}
                conditions={conditions}
                matchMode={form.getFieldValue('match_mode') || 'all'}
            />
        </div>
    );
};

export default RuleFormPage;

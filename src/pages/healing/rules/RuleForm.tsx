import React, { useState, useEffect, useCallback } from 'react';
import {
    Form, Input, InputNumber, Segmented, Alert, Button, Space, Spin, message,
    Typography,
} from 'antd';
import {
    SaveOutlined, SafetyCertificateOutlined, BranchesOutlined, AimOutlined,
    ExperimentOutlined,
    ThunderboltOutlined, AuditOutlined, BellOutlined, ForkOutlined,
    NodeIndexOutlined, ApiOutlined, EyeOutlined,
} from '@ant-design/icons';
import { history, useParams, useAccess } from '@umijs/max';
import SubPageHeader from '@/components/SubPageHeader';
import { ConditionBuilder } from './ConditionBuilder';
import { RuleTester } from './RuleTester';
import FlowSelector from './FlowSelector';
import { RuleSelectedFlowCard } from './RuleSelectedFlowCard';
import {
    getHealingRule, createHealingRule, updateHealingRule,
} from '@/services/auto-healing/healing-rules';
import { getFlows } from '@/services/auto-healing/healing';
import { fetchAllPages } from '@/utils/fetchAllPages';
import { NODE_TYPE_COLORS } from '../nodeConfig';

// 节点类型元数据 — 颜色从 nodeConfig 统一导入
const NODE_TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    execution: { label: '执行', icon: <ThunderboltOutlined />, color: NODE_TYPE_COLORS.execution },
    approval: { label: '审批', icon: <AuditOutlined />, color: NODE_TYPE_COLORS.approval },
    condition: { label: '条件', icon: <ForkOutlined />, color: NODE_TYPE_COLORS.condition },
    notification: { label: '通知', icon: <BellOutlined />, color: NODE_TYPE_COLORS.notification },
    host_extractor: { label: '主机提取', icon: <ApiOutlined />, color: NODE_TYPE_COLORS.host_extractor },
    cmdb_validator: { label: 'CMDB验证', icon: <EyeOutlined />, color: NODE_TYPE_COLORS.cmdb_validator },
    compute: { label: '计算', icon: <NodeIndexOutlined />, color: NODE_TYPE_COLORS.compute },
};
import './RuleForm.css';
const { Text } = Typography;
const { TextArea } = Input;
const hasErrorFields = (error: unknown): error is { errorFields: unknown } =>
    typeof error === 'object' && error !== null && 'errorFields' in error;

const RuleFormPage: React.FC = () => {
    const params = useParams<{ id?: string }>();
    const access = useAccess();
    const isEdit = !!params.id;

    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [conditions, setConditions] = useState<AutoHealing.HealingRuleCondition[]>([]);
    const [testerOpen, setTesterOpen] = useState(false);

    // FlowSelector
    const [flowSelectorOpen, setFlowSelectorOpen] = useState(false);
    const [selectedFlow, setSelectedFlow] = useState<AutoHealing.HealingFlow | null>(null);
    const [originalFlowId, setOriginalFlowId] = useState<string | null>(null);

    // ==================== Load Selected Flow (for edit mode) ====================
    const loadFlowById = useCallback(async (flowId: string) => {
        try {
            const flows = await fetchAllPages<AutoHealing.HealingFlow>((page, pageSize) => getFlows({ page, page_size: pageSize }));
            const found = flows.find(f => f.id === flowId);
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
                setOriginalFlowId(rule.flow_id);
                loadFlowById(rule.flow_id);
            } else {
                setOriginalFlowId(null);
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
            /* global error handler */
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
                flow_id: selectedFlow?.id || values.flow_id || originalFlowId || null,
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
        } catch (error) {
            if (hasErrorFields(error)) return; // form validation error
        } finally {
            setSaving(false);
        }
    };

    // ==================== Render ====================
    if (loading) {
        return (
            <div className="rule-form-loading">
                <Spin size="large" tip="加载中..."><div /></Spin>
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
                            disabled={isEdit ? !access.canUpdateRule : !access.canCreateRule}
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

                    <RuleSelectedFlowCard
                        nodeTypeMeta={NODE_TYPE_META}
                        onClear={() => {
                            setSelectedFlow(null);
                            setOriginalFlowId(null);
                            form.setFieldValue('flow_id', undefined);
                        }}
                        onOpenSelector={() => setFlowSelectorOpen(true)}
                        selectedFlow={selectedFlow}
                    />

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
                        <span>匹配逻辑：</span>
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

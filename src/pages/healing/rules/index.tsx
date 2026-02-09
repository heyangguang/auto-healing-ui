
import {
    PlusOutlined, SearchOutlined, ReloadOutlined,
    DeleteOutlined, EditOutlined, ThunderboltOutlined,
    CheckCircleOutlined, BranchesOutlined,
    SafetyCertificateOutlined, ExperimentOutlined, RobotOutlined, AimOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
    Button, message, Space, Tag, Typography, Input,
    Empty, Switch, Spin, Popconfirm, Row, Col,
    Segmented, Select, Tooltip, Divider, Form, Drawer,
    Badge, InputNumber, Alert
} from 'antd';
import React, { useState, useEffect, useCallback } from 'react';
import { useAccess } from '@umijs/max';
import {
    getHealingRules, updateHealingRule, deleteHealingRule, activateHealingRule, deactivateHealingRule, createHealingRule
} from '@/services/auto-healing/healing-rules';
import { request } from '@umijs/max';
import { RuleTester } from './RuleTester';
import { ConditionBuilder } from './ConditionBuilder';

const { Text, Title } = Typography;

// ==================== Constants ====================
const TRIGGER_MODE_CONFIG: Record<string, { icon: React.ReactElement; color: string; label: string; bg: string }> = {
    auto: { icon: <ThunderboltOutlined style={{ fontSize: 24 }} />, color: '#52c41a', label: '自动触发 (AUTO)', bg: '#f6ffed' },
    manual: { icon: <CheckCircleOutlined style={{ fontSize: 24 }} />, color: '#faad14', label: '人工确认 (MANUAL)', bg: '#fffbe6' },
};

// ==================== Main Page Component ====================
const HealingRulesPage: React.FC = () => {
    const access = useAccess();
    // Data State
    const [rules, setRules] = useState<AutoHealing.HealingRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Pagination & Filters
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [pageSize, setPageSize] = useState(16);
    const [searchText, setSearchText] = useState('');
    const [filterStatus, setFilterStatus] = useState<boolean | undefined>(undefined);

    // Drawer & Tester
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [testerOpen, setTesterOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<AutoHealing.HealingRule | null>(null);
    const [form] = Form.useForm();
    const [submitLoading, setSubmitLoading] = useState(false);
    const [flows, setFlows] = useState<{ label: string; value: string }[]>([]);

    // ==================== Data Loading ====================
    const loadRules = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getHealingRules({
                page: currentPage,
                page_size: pageSize,
                is_active: filterStatus,
            });
            let data = res.data || [];
            if (searchText) {
                const lower = searchText.toLowerCase();
                data = data.filter(r => r.name.toLowerCase().includes(lower) || r.description?.toLowerCase().includes(lower));
            }
            setRules(data);
            setTotal(res.total || data.length);
        } catch (error) {
            console.error('Failed to load rules:', error);
            message.error('加载自愈规则失败');
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, filterStatus, searchText]);

    useEffect(() => {
        loadRules();
    }, [loadRules]);

    // ==================== Actions ====================
    const handleToggle = async (rule: AutoHealing.HealingRule, checked: boolean) => {
        // 前置验证：启用规则时必须已关联流程
        if (checked && !rule.flow_id) {
            message.error('启用规则前必须关联自愈流程，请先编辑规则并选择流程');
            return;
        }

        const originalState = rule.is_active;
        setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: checked } : r));

        setActionLoading(rule.id);
        try {
            if (checked) {
                await activateHealingRule(rule.id);
                message.success('规则已启用');
            } else {
                await deactivateHealingRule(rule.id);
            }
        } catch {
            // 回滚状态，错误消息由全局错误处理器显示
            setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: originalState } : r));
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (rule: AutoHealing.HealingRule) => {
        setActionLoading(rule.id);
        try {
            await deleteHealingRule(rule.id);
            message.success('规则已删除');
            setRules(prev => prev.filter(r => r.id !== rule.id));
            setTotal(prev => Math.max(0, prev - 1));
        } catch {
            // 错误消息由全局错误处理器显示
        } finally {
            setActionLoading(null);
        }
    };

    // ==================== Drawer Helpers ====================
    const fetchFlows = async () => {
        try {
            const res = await request('/api/v1/healing/flows', { method: 'GET', params: { page: 1, page_size: 100 } });
            if (res.data) {
                setFlows(res.data.map((f: any) => ({ label: f.name, value: f.id })));
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (drawerOpen) {
            fetchFlows();
        }
    }, [drawerOpen]);

    const handleCreate = () => {
        setEditingRule(null);
        form.resetFields();
        setDrawerOpen(true);
    };

    const handleEdit = (rule: AutoHealing.HealingRule) => {
        setEditingRule(rule);
        form.setFieldsValue({
            ...rule,
        });
        setDrawerOpen(true);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            // 如果规则已激活，flow_id 不能清空
            if (editingRule?.is_active && !values.flow_id) {
                message.error('已激活的规则必须关联自愈流程，请选择流程或先停用规则');
                return;
            }

            setSubmitLoading(true);


            const payload = {
                ...values,
                priority: values.priority || 0,
                is_active: editingRule ? editingRule.is_active : false,
                // 显式传递 null 以清空 flow_id，让后端知道是"清空"而不是"不更新"
                flow_id: values.flow_id || null,
            };

            console.log('[HealingRules] Submitting payload:', JSON.stringify(payload, null, 2));

            if (editingRule) {
                const res = await updateHealingRule(editingRule.id, payload);
                message.success('规则已更新');
                // Optimistic update - replace rule in list
                setRules(prev => prev.map(r => r.id === editingRule.id ? (res.data || { ...editingRule, ...payload }) : r));
            } else {
                const createPayload: AutoHealing.CreateHealingRuleRequest = {
                    ...values,
                    priority: values.priority || 0,
                    is_active: false
                };
                const res = await createHealingRule(createPayload);
                message.success('规则已创建');
                // Optimistic update - add new rule to list
                if (res.data) {
                    setRules(prev => [res.data, ...prev]);
                    setTotal(prev => prev + 1);
                }
            }

            setDrawerOpen(false);
            // Silent background refresh (no loading spinner)
            getHealingRules({ page: currentPage, page_size: pageSize, is_active: filterStatus })
                .then(res => {
                    let data = res.data || [];
                    if (searchText) {
                        const lower = searchText.toLowerCase();
                        data = data.filter(r => r.name.toLowerCase().includes(lower) || r.description?.toLowerCase().includes(lower));
                    }
                    setRules(data);
                    setTotal(res.total || data.length);
                })
                .catch(console.error);
        } catch (error) {
            console.error(error);
            message.error('保存失败');
        } finally {
            setSubmitLoading(false);
        }
    };

    // ==================== Render Helpers ====================
    const getModeConfig = (mode: string) => TRIGGER_MODE_CONFIG[mode] || { icon: <RobotOutlined style={{ fontSize: 24 }} />, color: '#8c8c8c', label: mode.toUpperCase(), bg: '#f5f5f5' };

    const renderConditions = (conditions: AutoHealing.HealingRuleCondition[]) => {
        if (!conditions || conditions.length === 0) return <Text type="secondary" style={{ fontSize: 12 }}>无触发条件</Text>;

        // Count total conditions (including nested) for summary
        const count = conditions.length;
        const first = conditions[0];

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AimOutlined style={{ fontSize: 12, color: '#1890ff' }} />
                    <Text style={{ fontSize: 12 }}>{count} 个条件</Text>
                    {first.type === 'condition' && (
                        <Tag style={{ fontSize: 10, margin: 0 }}>
                            {first.field} {first.operator} ...
                        </Tag>
                    )}
                    {first.type === 'group' && <Tag>组合逻辑</Tag>}
                </div>
            </div>
        );
    };

    return (
        <PageContainer
            ghost
            header={{
                title: <><SafetyCertificateOutlined /> 自愈规则 / RULES</>,
                subTitle: '定义事件触发的自愈流程和条件',
            }}
        >
            <div className="mission-control-container" style={{ height: 'auto', overflow: 'visible' }}>
                <div className="launchpad-grid" style={{ height: 'auto', overflow: 'visible' }}>

                    {/* Toolbar */}
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, background: '#fff', padding: '16px 24px', borderRadius: 2, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        <Space size="middle">
                            <Input
                                placeholder="输入规则名称或描述搜索..."
                                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                                allowClear
                                style={{ width: 280 }}
                            />
                            <Select
                                placeholder="启用状态"
                                allowClear
                                style={{ width: 120 }}
                                onChange={(v) => {
                                    if (v === 'active') setFilterStatus(true);
                                    else if (v === 'inactive') setFilterStatus(false);
                                    else setFilterStatus(undefined);
                                }}
                                options={[
                                    { label: '已启用', value: 'active' },
                                    { label: '已禁用', value: 'inactive' },
                                ]}
                            />
                            <Button icon={<ReloadOutlined />} onClick={loadRules} loading={loading}>刷新</Button>
                        </Space>
                        <Button type="primary" icon={<PlusOutlined />} disabled={!access.canCreateRule} onClick={handleCreate}>
                            新建规则
                        </Button>
                    </div>

                    {/* Content Grid */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
                    ) : rules.length === 0 ? (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={<Text type="secondary">暂无自愈规则配置</Text>}
                        >
                            <Button type="dashed" onClick={handleCreate}>创建第一个规则</Button>
                        </Empty>
                    ) : (
                        <Row gutter={[16, 16]}>
                            {rules.map(rule => {
                                const modeConfig = getModeConfig(rule.trigger_mode);

                                return (
                                    <Col key={rule.id} xs={24} sm={12} md={12} lg={8} xl={6} xxl={6}>

                                        <div
                                            className="ticket-card" // Using existing styles but cleaner
                                            onClick={() => handleEdit(rule)}
                                            style={{
                                                display: 'flex',
                                                height: 140, // Reduced height
                                                borderRadius: 0, // 直角设计
                                                border: '1px solid #f0f0f0',
                                                overflow: 'hidden',
                                                background: '#fff',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                                                transition: 'all 0.2s',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {/* Left Stub */}
                                            <div style={{
                                                width: 48,
                                                background: rule.is_active ? '#fafafa' : '#f5f5f5',
                                                borderRight: '1px solid #f0f0f0',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 4,
                                                flexShrink: 0,
                                                borderLeft: `3px solid ${!rule.is_active ? '#d9d9d9' : (rule.priority >= 90 ? '#f5222d' : rule.priority >= 50 ? '#fa8c16' : '#1890ff')}`
                                            }}>
                                                <div style={{ color: rule.is_active ? modeConfig.color : '#bfbfbf', fontSize: 18 }}>
                                                    {modeConfig.icon}
                                                </div>
                                                <Text strong style={{ fontSize: 10, color: rule.is_active && rule.priority >= 50 ? '#8c8c8c' : '#bfbfbf' }}>
                                                    P{rule.priority}
                                                </Text>
                                            </div>

                                            {/* Right Section */}
                                            <div style={{
                                                flex: 1,
                                                padding: '12px 16px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                minWidth: 0
                                            }}>
                                                {/* Top */}
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, opacity: rule.is_active ? 1 : 0.6 }}>
                                                            {rule.is_active && <Badge status="processing" />}
                                                            <Text strong style={{ fontSize: 14, color: '#262626' }} ellipsis>
                                                                {rule.name}
                                                            </Text>
                                                        </div>
                                                        <div onClick={e => e.stopPropagation()}>
                                                            <Switch size="small" checked={rule.is_active} onChange={c => handleToggle(rule, c)} loading={actionLoading === rule.id} disabled={!access.canUpdateRule} />
                                                        </div>
                                                    </div>
                                                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }} ellipsis>
                                                        {rule.description || '无描述'}
                                                    </Text>
                                                    {renderConditions(rule.conditions)}
                                                </div>

                                                {/* Bottom */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                                                    <Space size={4}>
                                                        <BranchesOutlined style={{ fontSize: 12, color: '#1890ff' }} />
                                                        <Text style={{ fontSize: 12, color: '#1890ff' }}>
                                                            {rule.flow?.name || '未关联流程'}
                                                        </Text>
                                                    </Space>

                                                    <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                                                        <Button type="text" size="small" icon={<EditOutlined />} disabled={!access.canUpdateRule} onClick={() => handleEdit(rule)} />
                                                        <Popconfirm title="确定删除?" onConfirm={() => handleDelete(rule)}>
                                                            <Button type="text" danger size="small" disabled={!access.canDeleteRule} icon={<DeleteOutlined />} />
                                                        </Popconfirm>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Col>
                                );
                            })}
                        </Row>
                    )}
                </div>

                {/* Create/Edit Drawer */}
                <Drawer
                    title={
                        <Space>
                            {editingRule ? <EditOutlined /> : <PlusOutlined />}
                            {editingRule ? '编辑自愈规则' : '创建自愈规则'}
                        </Space>
                    }
                    width={720}
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    destroyOnClose
                    footer={
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Button icon={<ExperimentOutlined />} onClick={() => setTesterOpen(true)}>规则模拟测试</Button>
                            <Space>
                                <Button onClick={() => setDrawerOpen(false)}>取消</Button>
                                <Button onClick={handleSubmit} type="primary" loading={submitLoading}>
                                    提交保存
                                </Button>
                            </Space>
                        </div>
                    }
                >
                    <Form form={form} layout="vertical" initialValues={{ match_mode: 'all', priority: 0, trigger_mode: 'auto' }}>
                        <Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}>
                            <Input placeholder="例如: 核心服务高负载自愈" />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="priority" label="优先级" tooltip="数字越大优先级越高 (0-999)">
                                    <InputNumber min={0} max={999} style={{ width: '100%' }} placeholder="请输入优先级" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="trigger_mode" label="触发模式">
                                    <Segmented block options={[
                                        { label: '自动执行', value: 'auto', icon: <ThunderboltOutlined /> },
                                        { label: '人工确认', value: 'manual', icon: <CheckCircleOutlined /> },
                                    ]} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item name="description" label="规则描述">
                            <Input.TextArea placeholder="描述该规则的适用场景和处理逻辑..." autoSize={{ minRows: 2 }} />
                        </Form.Item>

                        <Form.Item
                            name="flow_id"
                            label="关联自愈流程"
                            tooltip="激活规则时必须关联流程，创建时可留空"
                        >
                            <Select
                                placeholder="选择当规则匹配时执行的流程（激活时必填）"
                                options={flows}
                                showSearch
                                allowClear
                                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                            />
                        </Form.Item>

                        <Divider orientation="left"><SafetyCertificateOutlined /> 匹配条件配置</Divider>

                        <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
                            <Col>
                                <Form.Item name="match_mode" label="顶层匹配逻辑" style={{ margin: 0 }}>
                                    <Segmented options={[
                                        { label: '满足所有条件 (AND)', value: 'all' },
                                        { label: '满足任一条件 (OR)', value: 'any' },
                                    ]} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Alert
                            type="info"
                            showIcon
                            style={{ marginBottom: 12 }}
                            message="匹配字段说明"
                            description="除下拉列表中的固定字段外，您还可以直接输入工单 raw_data 中的任意自定义字段名进行匹配。"
                        />

                        <Form.Item name="conditions" initialValue={[{ type: 'condition', field: '', operator: 'contains', value: '' }]}>
                            <ConditionBuilder />
                        </Form.Item>

                    </Form>
                </Drawer>

                {/* Rule Tester Modal */}
                <RuleTester
                    open={testerOpen}
                    onCancel={() => setTesterOpen(false)}
                    conditions={Form.useWatch('conditions', form) || []}
                    matchMode={Form.useWatch('match_mode', form) || 'all'}
                />
            </div>
        </PageContainer>
    );
};

export default HealingRulesPage;

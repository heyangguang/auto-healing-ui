import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { history } from '@umijs/max';
import {
    Form, Input, Button, message, Spin, Row, Col, Typography, Tag, Space,
    Modal, Empty, Skeleton, Select,
} from 'antd';
import {
    SafetyCertificateOutlined, FileTextOutlined, ExperimentOutlined,
    SaveOutlined, ThunderboltOutlined, SearchOutlined,
    ExclamationCircleOutlined, CheckCircleOutlined, LoadingOutlined,
} from '@ant-design/icons';
import SubPageHeader from '@/components/SubPageHeader';
import TaskTemplateSelector from '@/pages/healing/flows/editor/TaskTemplateSelector';
import { getCommandBlacklist } from '@/services/auto-healing/commandBlacklist';
import { createBlacklistExemption } from '@/services/auto-healing/blacklistExemption';
import { extractErrorMsg } from '@/utils/errorMsg';
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

const PAGE_SIZE = 50;

/* ============================== 黑名单规则选择器 ============================== */

interface RuleSelectorProps {
    open: boolean;
    value?: string;
    onSelect: (id: string, rule: any) => void;
    onCancel: () => void;
}

const RuleSelector: React.FC<RuleSelectorProps> = ({ open, value, onSelect, onCancel }) => {
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [search, setSearch] = useState('');
    const [severityFilter, setSeverityFilter] = useState<string | undefined>();
    const [selectedRule, setSelectedRule] = useState<any>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const loadRules = useCallback(async (pageNum: number, reset: boolean) => {
        if (loading && !reset) return;
        setLoading(true);
        try {
            const params: any = {
                page: pageNum,
                page_size: PAGE_SIZE,
                is_active: true,
            };
            if (search) params.name = search;
            if (severityFilter) params.severity = severityFilter;
            const res = await getCommandBlacklist(params);
            const newRules = res?.data || [];
            const t = Number(res?.total ?? 0);
            if (reset) setRules(newRules);
            else setRules(prev => [...prev, ...newRules]);
            setTotal(t);
            setPage(pageNum);
            setHasMore(pageNum * PAGE_SIZE < t);

            if (reset && value) {
                const found = newRules.find((r: any) => r.id === value);
                if (found) {
                    setSelectedRule(found);
                }
            }
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [loading, search, severityFilter, value]);

    useEffect(() => {
        if (open) {
            setRules([]);
            setPage(1);
            setHasMore(true);
            setSearch('');
            setSeverityFilter(undefined);
            setSelectedRule(null);
            loadRules(1, true);
        }
    }, [open]);

    useEffect(() => {
        if (open) {
            const timer = setTimeout(() => loadRules(1, true), 300);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [search, severityFilter]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 100 && !loading && hasMore) {
            loadRules(page + 1, false);
        }
    }, [loading, hasMore, page, loadRules]);

    return (
        <Modal
            title={<Space><SafetyCertificateOutlined /> 选择黑名单规则</Space>}
            open={open}
            onCancel={onCancel}
            onOk={() => selectedRule && onSelect(selectedRule.id, selectedRule)}
            okText="确定选择"
            okButtonProps={{ disabled: !selectedRule }}
            width={700}
            destroyOnHidden
        >
            <Row gutter={12} style={{ marginBottom: 16 }}>
                <Col span={14}>
                    <Input
                        placeholder="搜索规则名称"
                        prefix={<SearchOutlined />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        allowClear
                    />
                </Col>
                <Col span={10}>
                    <Select
                        placeholder="严重级别"
                        value={severityFilter}
                        onChange={setSeverityFilter}
                        allowClear
                        style={{ width: '100%' }}
                        options={[
                            { label: '严重', value: 'critical' },
                            { label: '高危', value: 'high' },
                            { label: '中危', value: 'medium' },
                        ]}
                    />
                </Col>
            </Row>

            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>仅显示已启用的规则</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>共 {total} 条</Text>
            </div>

            <div ref={listRef} style={{ height: 360, overflow: 'auto' }} onScroll={handleScroll}>
                {rules.length === 0 && !loading ? (
                    <Empty description="暂无匹配规则" style={{ marginTop: 80 }} />
                ) : (
                    <>
                        {rules.map(rule => {
                            const isSelected = selectedRule?.id === rule.id;
                            return (
                                <div
                                    key={rule.id}
                                    onClick={() => setSelectedRule(rule)}
                                    style={{
                                        cursor: 'pointer',
                                        background: isSelected ? '#e6f7ff' : 'transparent',
                                        borderLeft: isSelected ? '3px solid #1890ff' : '3px solid transparent',
                                        padding: '10px 12px',
                                        marginBottom: 4,
                                        borderBottom: '1px solid #f0f0f0',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <Tag color={SEVERITY_COLORS[rule.severity]} style={{ margin: 0 }}>
                                            {SEVERITY_LABELS[rule.severity] || rule.severity}
                                        </Tag>
                                        <Text strong style={{ fontSize: 13 }}>{rule.name}</Text>
                                        <Tag style={{ fontSize: 10, margin: 0 }}>{rule.match_type}</Tag>
                                    </div>
                                    <div style={{ marginLeft: 4 }}>
                                        <Text code style={{ fontSize: 11, color: '#595959' }}>{rule.pattern}</Text>
                                    </div>
                                    {rule.description && (
                                        <div style={{ marginTop: 4, marginLeft: 4 }}>
                                            <Text type="secondary" style={{ fontSize: 11 }}>{rule.description}</Text>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {loading && (
                            <div style={{ textAlign: 'center', padding: 12 }}>
                                <Space><LoadingOutlined /><Text type="secondary">加载中...</Text></Space>
                            </div>
                        )}
                        {!hasMore && rules.length > 0 && (
                            <div style={{ textAlign: 'center', padding: 8, color: '#ccc', fontSize: 12 }}>
                                已加载全部 {rules.length} 条规则
                            </div>
                        )}
                    </>
                )}
            </div>

            {selectedRule && (
                <div style={{
                    marginTop: 16, padding: '8px 12px',
                    background: '#e6f7ff', border: '1px solid #91d5ff',
                }}>
                    <Text strong>已选择：</Text> {selectedRule.name}
                    <Text type="secondary" style={{ marginLeft: 16 }}>
                        模式: <Text code style={{ fontSize: 11 }}>{selectedRule.pattern}</Text>
                    </Text>
                </div>
            )}
        </Modal>
    );
};

/* ============================== 主表单组件 ============================== */

const ExemptionForm: React.FC = () => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    // 选择器状态
    const [taskSelectorOpen, setTaskSelectorOpen] = useState(false);
    const [ruleSelectorOpen, setRuleSelectorOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [selectedRule, setSelectedRule] = useState<any>(null);

    // 任务模板选择回调
    const handleTaskSelect = useCallback((id: string, template: any) => {
        setSelectedTask(template);
        form.setFieldsValue({ task_id: id });
        setTaskSelectorOpen(false);
    }, [form]);

    // 规则选择回调
    const handleRuleSelect = useCallback((id: string, rule: any) => {
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
        } catch (err: any) {
            if (err?.errorFields) return;
            /* 全局 errorHandler 已显示错误 */
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
            <RuleSelector
                open={ruleSelectorOpen}
                value={selectedRule?.id}
                onSelect={handleRuleSelect}
                onCancel={() => setRuleSelectorOpen(false)}
            />
        </div>
    );
};

export default ExemptionForm;

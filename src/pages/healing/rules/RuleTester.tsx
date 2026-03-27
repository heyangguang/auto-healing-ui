import React, { useState } from 'react';
import { Modal, Input, Button, Alert, Space, Typography, Badge, Row, Col, Segmented, Tag } from 'antd';
import {
    ExperimentOutlined, CodeOutlined, CheckCircleOutlined, CloseCircleOutlined,
    DatabaseOutlined,
} from '@ant-design/icons';
import IncidentSelector from './IncidentSelector';
import { INCIDENT_SEVERITY_MAP } from '@/constants/incidentDicts';

const { Text } = Typography;
const KNOWN_FIELDS = ['title', 'description', 'severity', 'priority', 'status',
    'category', 'affected_ci', 'affected_service', 'assignee', 'reporter', 'source_plugin_name'];
type MatchMode = 'all' | 'any';
type InputMode = 'json' | 'incident';
type DataRecord = Record<string, unknown>;
interface ConditionCheckDetail { condition: string; pass: boolean; }
interface RuleTestResult { matches: boolean; details: ConditionCheckDetail[]; }

// 本地适配器：将集中化字典的 { text, color } 转为本文件需要的 { label, color }
const SEVERITY_META: Record<string, { label: string; color: string }> = Object.fromEntries(
    Object.entries(INCIDENT_SEVERITY_MAP).map(([k, v]) => [k, { label: v.text, color: v.color }])
);

interface RuleTesterProps {
    open: boolean;
    onCancel: () => void;
    conditions: AutoHealing.HealingRuleCondition[];
    matchMode: MatchMode;
}

export const RuleTester: React.FC<RuleTesterProps> = ({ open, onCancel, conditions, matchMode }) => {
    const [mode, setMode] = useState<InputMode>('json');
    const [jsonInput, setJsonInput] = useState<string>('{\n  "alertname": "TestAlert",\n  "severity": "critical",\n  "instance": "192.168.1.10"\n}');
    const [result, setResult] = useState<RuleTestResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [incidentSelectorOpen, setIncidentSelectorOpen] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState<AutoHealing.Incident | null>(null);
    const keyedDetails = React.useMemo(() => {
        const counts = new Map<string, number>();
        return (result?.details || []).map((detail) => {
            const count = (counts.get(detail.condition) || 0) + 1;
            counts.set(detail.condition, count);
            return { detail, key: `${detail.condition}-${count}` };
        });
    }, [result]);

    const handleSelectIncident = (incident: AutoHealing.Incident) => {
        setSelectedIncident(incident);
        setIncidentSelectorOpen(false);
        const testData = { ...incident, ...(incident.raw_data || {}) };
        setJsonInput(JSON.stringify(testData, null, 2));
    };

    const getFieldValue = (data: DataRecord, field: string): unknown => {
        if (KNOWN_FIELDS.includes(field) && data[field] !== undefined) {
            return data[field];
        }
        if (data[field] !== undefined) {
            return data[field];
        }
        if (isRecord(data.raw_data) && data.raw_data[field] !== undefined) {
            return data.raw_data[field];
        }
        return undefined;
    };

    const checkCondition = (condition: AutoHealing.HealingRuleCondition, data: DataRecord): boolean => {
        if (condition.type === 'group') {
            const subConds = condition.conditions || [];
            if (subConds.length === 0) return true;
            if (condition.logic === 'OR') return subConds.some(c => checkCondition(c, data));
            return subConds.every(c => checkCondition(c, data));
        }

        if (!condition.field) {
            return false;
        }

        const value = getFieldValue(data, condition.field);
        const targetValue = condition.value;
        const operator = condition.operator;

        if (value === undefined || value === null) {
            if (operator === 'equals') return targetValue === null || targetValue === undefined;
            return false;
        }

        switch (operator) {
            case 'equals': return String(value) === String(targetValue);
            case 'contains': return String(value).toLowerCase().includes(String(targetValue).toLowerCase());
            case 'regex': try { return new RegExp(String(targetValue)).test(String(value)); } catch { return false; }
            case 'gt': return Number(value) > Number(targetValue);
            case 'lt': return Number(value) < Number(targetValue);
            case 'gte': return Number(value) >= Number(targetValue);
            case 'lte': return Number(value) <= Number(targetValue);
            case 'in':
                if (Array.isArray(targetValue)) return targetValue.map(v => String(v).toLowerCase()).includes(String(value).toLowerCase());
                if (typeof targetValue === 'string') return targetValue.split(',').map(s => s.trim().toLowerCase()).includes(String(value).toLowerCase());
                return false;
            default: return false;
        }
    };

    const runTest = () => {
        setError(null);
        try {
            const parsed = JSON.parse(jsonInput);
            if (!isRecord(parsed)) {
                setError('Invalid JSON: 顶层必须是对象');
                setResult(null);
                return;
            }
            const data = parsed;

            if (!conditions || conditions.length === 0) {
                setResult({
                    matches: false,
                    details: [{ condition: '(无匹配条件)', pass: false }],
                });
                return;
            }

            const evaluate = (conds: AutoHealing.HealingRuleCondition[], evalMode: MatchMode): RuleTestResult => {
                const details = conds.map(c => {
                    const pass = checkCondition(c, data);
                    const label = c.type === 'group'
                        ? `(Group Logic: ${c.logic})`
                        : `${c.field} ${c.operator} ${formatConditionValue(c.value)}`;
                    return { condition: label, pass };
                });

                const hasPass = details.some(d => d.pass);
                const allPass = details.every(d => d.pass);
                const matches = evalMode === 'all' ? allPass : hasPass;
                return { matches, details };
            };

            setResult(evaluate(conditions, matchMode));
        } catch (error_) {
            const message = error_ instanceof Error ? error_.message : String(error_);
            setError(`Invalid JSON: ${message}`);
            setResult(null);
        }
    };

    return (
        <Modal
            title={<Space><ExperimentOutlined /> 规则匹配测试 (Simulation)</Space>}
            open={open}
            onCancel={onCancel}
            footer={null}
            width={880}
        >
            <div style={{ marginBottom: 16 }}>
                <Segmented
                    options={[
                        { label: '手动输入 JSON', value: 'json', icon: <CodeOutlined /> },
                        { label: '选择现有工单', value: 'incident', icon: <DatabaseOutlined /> }
                    ]}
                    value={mode}
                    onChange={value => {
                        if (value === 'json' || value === 'incident') {
                            setMode(value);
                        }
                    }}
                />
            </div>

            <Row gutter={16}>
                <Col span={12}>
                    {mode === 'incident' && (
                        <div style={{ marginBottom: 12 }}>
                            <Button
                                type="dashed"
                                block
                                icon={<DatabaseOutlined />}
                                onClick={() => setIncidentSelectorOpen(true)}
                                style={{ height: 56, marginBottom: 8 }}
                            >
                                {selectedIncident ? '重新选择工单' : '点击选择工单'}
                            </Button>

                            {selectedIncident && (
                                <div style={{
                                    padding: '8px 12px',
                                    background: '#e6f7ff',
                                    border: '1px solid #91d5ff',
                                    marginBottom: 8,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                        <CheckCircleOutlined style={{ color: '#1890ff' }} />
                                        <Tag
                                            color={(SEVERITY_META[selectedIncident.severity] || { color: '#8c8c8c' }).color}
                                            style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0 }}
                                        >
                                            {(SEVERITY_META[selectedIncident.severity] || { label: selectedIncident.severity }).label}
                                        </Tag>
                                        <Text strong ellipsis style={{ flex: 1, fontSize: 12 }}>
                                            {selectedIncident.title}
                                        </Text>
                                    </div>
                                    <div style={{ marginLeft: 20, fontSize: 10, color: '#8c8c8c' }}>
                                        {selectedIncident.affected_ci && (
                                            <span style={{ marginRight: 8 }}>CI: {selectedIncident.affected_ci}</span>
                                        )}
                                        {selectedIncident.category && (
                                            <span style={{ marginRight: 8 }}>分类: {selectedIncident.category}</span>
                                        )}
                                        <Text type="secondary" style={{ fontSize: 10 }}>
                                            数据已填入下方 ↓
                                        </Text>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{ marginBottom: 8 }}><Text strong>测试事件数据 (JSON Preview)</Text></div>
                    <Input.TextArea
                        value={jsonInput}
                        onChange={e => setJsonInput(e.target.value)}
                        autoSize={{ minRows: mode === 'incident' ? 8 : 12, maxRows: mode === 'incident' ? 8 : 12 }}
                        style={{ fontFamily: 'monospace', fontSize: 12 }}
                    />
                    <Button type="primary" block style={{ marginTop: 16 }} onClick={runTest}>
                        运行测试
                    </Button>
                </Col>

                <Col span={12}>
                    <div style={{ marginBottom: 8 }}><Text strong>测试结果</Text></div>
                    <div style={{
                        height: mode === 'incident' ? 500 : 380,
                        overflowY: 'auto',
                        background: '#f5f5f5',
                        border: '1px solid #f0f0f0',
                        padding: 16,
                    }}>
                        {error && <Alert type="error" message={error} showIcon style={{ borderRadius: 0 }} />}
                        {!error && !result && <div style={{ textAlign: 'center', marginTop: 100, color: '#999' }}>等待测试运行...</div>}
                        {result && (
                            <div>
                                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                    {result.matches ? (
                                        <Badge count="匹配成功 (MATCHED)" style={{ backgroundColor: '#52c41a', fontSize: 16, height: 28, lineHeight: '28px', padding: '0 12px', borderRadius: 0 }} />
                                    ) : (
                                        <Badge count="未匹配 (NO MATCH)" style={{ backgroundColor: '#ff4d4f', fontSize: 16, height: 28, lineHeight: '28px', padding: '0 12px', borderRadius: 0 }} />
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {keyedDetails.map(({ detail: d, key }) => (
                                        <div key={key} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            background: '#fff',
                                            padding: '8px 12px',
                                            borderRadius: 0,
                                            borderLeft: `4px solid ${d.pass ? '#52c41a' : '#ff4d4f'}`
                                        }}>
                                            <Text code style={{ fontSize: 12, maxWidth: 260, borderRadius: 0 }} ellipsis>{d.condition}</Text>
                                            {d.pass ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: 16, fontSize: 12, color: '#666', borderTop: '1px solid #e8e8e8', paddingTop: 8 }}>
                                    顶层逻辑模式: <Text strong>{matchMode === 'all' ? 'AND (必须满足所有)' : 'OR (满足任一即可)'}</Text>
                                </div>
                            </div>
                        )}
                    </div>
                </Col>
            </Row>

            <IncidentSelector
                open={incidentSelectorOpen}
                onSelect={handleSelectIncident}
                onCancel={() => setIncidentSelectorOpen(false)}
            />
        </Modal>
    );
};

const isRecord = (value: unknown): value is DataRecord =>
    typeof value === 'object' && value !== null;

const formatConditionValue = (value: unknown): string => {
    if (typeof value === 'object') {
        return JSON.stringify(value) ?? 'undefined';
    }
    return String(value);
};

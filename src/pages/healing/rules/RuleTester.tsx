
import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Alert, Space, Typography, Badge, Row, Col, Card, Segmented, Select } from 'antd';
import { ExperimentOutlined, CodeOutlined, CheckCircleOutlined, CloseCircleOutlined, DatabaseOutlined, ReloadOutlined } from '@ant-design/icons';
import { getIncidents } from '@/services/auto-healing/incidents';

const { Text } = Typography;

interface RuleTesterProps {
    open: boolean;
    onCancel: () => void;
    conditions: AutoHealing.HealingRuleCondition[];
    matchMode: 'all' | 'any';
}

export const RuleTester: React.FC<RuleTesterProps> = ({ open, onCancel, conditions, matchMode }) => {
    const [mode, setMode] = useState<'json' | 'incident'>('json');
    const [jsonInput, setJsonInput] = useState<string>('{\n  "alertname": "TestAlert",\n  "severity": "critical",\n  "instance": "192.168.1.10"\n}');
    const [result, setResult] = useState<{ matches: boolean; details: { condition: string; pass: boolean }[] } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Incident State
    const [incidents, setIncidents] = useState<AutoHealing.Incident[]>([]);
    const [loadingIncidents, setLoadingIncidents] = useState(false);

    useEffect(() => {
        if (open && mode === 'incident') {
            fetchIncidents();
        }
    }, [open, mode]);

    const fetchIncidents = async () => {
        setLoadingIncidents(true);
        try {
            const res = await getIncidents({ page: 1, page_size: 20 });
            setIncidents(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingIncidents(false);
        }
    };

    const handleSelectIncident = (id: string) => {
        const incident = incidents.find(i => i.id === id);
        if (incident) {
            // Flatten raw_data or attributes for testing
            const testData = {
                ...incident,
                ...(incident.raw_data || {}),
                // Ensure flat fields are available
            };
            setJsonInput(JSON.stringify(testData, null, 2));
        }
    };

    const checkCondition = (condition: AutoHealing.HealingRuleCondition, data: any): boolean => {
        if (condition.type === 'group') {
            const subResults = (condition.conditions || []).map(c => checkCondition(c, data));
            if (condition.logic === 'OR') return subResults.some(r => r);
            return subResults.every(r => r);
        }

        const value = data[condition.field!];
        const targetValue = condition.value;
        const operator = condition.operator;

        if (value === undefined) return false;

        switch (operator) {
            case 'equals': return String(value) === String(targetValue);
            case 'contains': return String(value).includes(String(targetValue));
            case 'regex': try { return new RegExp(String(targetValue)).test(String(value)); } catch { return false; }
            case 'gt': return Number(value) > Number(targetValue);
            case 'lt': return Number(value) < Number(targetValue);
            case 'gte': return Number(value) >= Number(targetValue);
            case 'lte': return Number(value) <= Number(targetValue);
            case 'in':
                if (Array.isArray(targetValue)) return targetValue.includes(String(value));
                if (typeof targetValue === 'string') return targetValue.split(',').map(s => s.trim()).includes(String(value));
                return false;
            default: return false;
        }
    };

    const runTest = () => {
        setError(null);
        try {
            const data = JSON.parse(jsonInput);

            const evaluate = (conds: AutoHealing.HealingRuleCondition[], mode: 'all' | 'any'): { matches: boolean; details: any[] } => {
                const details = conds.map(c => {
                    const pass = checkCondition(c, data);
                    let label = '';
                    if (c.type === 'group') {
                        label = `(Group Logic: ${c.logic})`;
                    } else {
                        label = `${c.field} ${c.operator} ${c.value}`;
                    }
                    return { condition: label, pass };
                });

                const hasPass = details.some(d => d.pass);
                const allPass = details.every(d => d.pass);
                const matches = mode === 'all' ? allPass : hasPass;
                return { matches, details };
            };

            setResult(evaluate(conditions, matchMode));
        } catch (e: any) {
            setError('Invalid JSON: ' + e.message);
            setResult(null);
        }
    };

    return (
        <Modal
            title={<Space><ExperimentOutlined /> 规则匹配测试 (Simulation)</Space>}
            open={open}
            onCancel={onCancel}
            footer={null}
            width={800}
        >
            <div style={{ marginBottom: 16 }}>
                <Segmented
                    options={[
                        { label: '手动输入 JSON', value: 'json', icon: <CodeOutlined /> },
                        { label: '选择现有工单', value: 'incident', icon: <DatabaseOutlined /> }
                    ]}
                    value={mode}
                    onChange={v => setMode(v as any)}
                />
            </div>

            <Row gutter={16}>
                <Col span={12}>
                    {mode === 'incident' && (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <Select
                                    style={{ flex: 1 }}
                                    placeholder="选择工单..."
                                    loading={loadingIncidents}
                                    options={incidents.map(i => ({ label: `${i.title} (${i.severity})`, value: i.id }))}
                                    onChange={handleSelectIncident}
                                />
                                <Button icon={<ReloadOutlined />} onClick={fetchIncidents} />
                            </div>
                        </div>
                    )}

                    <div style={{ marginBottom: 8 }}><Text strong>测试事件数据 (JSON Preview)</Text></div>
                    <Input.TextArea
                        value={jsonInput}
                        onChange={e => setJsonInput(e.target.value)}
                        autoSize={{ minRows: 12, maxRows: 12 }}
                        style={{ fontFamily: 'monospace', fontSize: 12 }}
                    />
                    <Button type="primary" block style={{ marginTop: 16 }} onClick={runTest}>
                        运行测试
                    </Button>
                </Col>
                <Col span={12}>
                    <div style={{ marginBottom: 8 }}><Text strong>测试结果</Text></div>
                    <Card style={{ height: 380, overflowY: 'auto', background: '#f5f5f5' }} bordered={false}>
                        {error && <Alert type="error" message={error} showIcon />}
                        {!error && !result && <div style={{ textAlign: 'center', marginTop: 100, color: '#999' }}>等待测试运行...</div>}
                        {result && (
                            <div>
                                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                    {result.matches ? (
                                        <Badge count="匹配成功 (MATCHED)" style={{ backgroundColor: '#52c41a', fontSize: 16, height: 28, lineHeight: '28px', padding: '0 12px' }} />
                                    ) : (
                                        <Badge count="未匹配 (NO MATCH)" style={{ backgroundColor: '#ff4d4f', fontSize: 16, height: 28, lineHeight: '28px', padding: '0 12px' }} />
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {result.details.map((d, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            background: '#fff',
                                            padding: '8px 12px',
                                            borderRadius: 4,
                                            borderLeft: `4px solid ${d.pass ? '#52c41a' : '#ff4d4f'}`
                                        }}>
                                            <Text code style={{ fontSize: 12, maxWidth: 260 }} ellipsis>{d.condition}</Text>
                                            {d.pass ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: 16, fontSize: 12, color: '#666', borderTop: '1px solid #e8e8e8', paddingTop: 8 }}>
                                    顶层逻辑模式: <Text strong>{matchMode === 'all' ? 'AND (必须满足所有)' : 'OR (满足任一即可)'}</Text>
                                </div>
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </Modal>
    );
};

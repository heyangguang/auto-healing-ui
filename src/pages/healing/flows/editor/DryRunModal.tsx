import React, { useState, useRef } from 'react';
import { Modal, Form, Input, Button, Radio, Space, Typography, message } from 'antd';
import { ExperimentOutlined, CopyOutlined, DatabaseOutlined, SelectOutlined, StopOutlined } from '@ant-design/icons';
import { createDryRunStream, SSENodeStartData, SSENodeCompleteData, SSEFlowCompleteData } from '@/services/auto-healing/sse';
import IncidentSelector from './IncidentSelector';

const { Text } = Typography;
const { TextArea } = Input;

interface DryRunModalProps {
    open: boolean;
    flowId: string;
    /** 流程中的审批节点列表，用于配置模拟结果 */
    approvalNodes?: { id: string; label: string }[];
    onClose: () => void;
    onStartRun: () => void; // Reset all nodes before running
    /** 节点结果回调，传递完整的 SSENodeCompleteData */
    onNodeResult: (data: SSENodeCompleteData) => void;
    onNodeLog?: (nodeId: string, level: string, message: string, details?: any) => void; // Log event
    onRunComplete: (success: boolean, message: string) => void;
}

const DryRunModal: React.FC<DryRunModalProps> = ({
    open,
    flowId,
    approvalNodes = [],
    onClose,
    onStartRun,
    onNodeResult,
    onNodeLog,
    onRunComplete
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [inputMode, setInputMode] = useState<'json' | 'select'>('json');
    const [incidentSelectorOpen, setIncidentSelectorOpen] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState<AutoHealing.Incident | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    // 审批节点模拟结果配置
    const [mockApprovals, setMockApprovals] = useState<Record<string, 'approved' | 'rejected'>>({});

    const handleRun = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            let mockIncident: any;

            if (inputMode === 'json') {
                try {
                    mockIncident = JSON.parse(values.rawJson);
                } catch (e) {
                    message.error('JSON 格式错误');
                    setLoading(false);
                    return;
                }
            } else {
                if (selectedIncident) {
                    mockIncident = {
                        title: selectedIncident.title,
                        severity: selectedIncident.severity,
                        affected_ci: selectedIncident.affected_ci,
                        raw_data: selectedIncident.raw_data,
                    };
                } else {
                    message.error('请选择一个工单');
                    setLoading(false);
                    return;
                }
            }

            // Notify parent to reset node statuses and close modal
            onStartRun();

            // Start SSE stream - 传递完整的 DryRunRequest（包含 mock_approvals）
            const requestBody: any = { mock_incident: mockIncident };
            // 只传递有配置的审批节点
            const effectiveMockApprovals = Object.fromEntries(
                Object.entries(mockApprovals).filter(([_, v]) => v)
            );
            if (Object.keys(effectiveMockApprovals).length > 0) {
                requestBody.mock_approvals = effectiveMockApprovals;
            }
            const controller = await createDryRunStream(flowId, requestBody, {
                onFlowStart: (flowId, flowName) => {
                    console.log('[DryRun] Flow started:', flowId, flowName);
                },
                onNodeStart: (data: SSENodeStartData) => {
                    console.log('[DryRun] Node start:', data);
                    onNodeResult({ node_id: data.node_id, node_name: data.node_name, node_type: data.node_type, status: 'running' });
                },
                onNodeLog: (data) => {
                    console.log('[DryRun] Node log:', data);
                    onNodeLog?.(data.node_id, data.level, data.message, data.details);
                },
                onNodeComplete: (data: SSENodeCompleteData) => {
                    console.log('[DryRun] Node complete:', data);
                    // 传递完整的节点结果数据（包含 input/process/output）
                    onNodeResult(data);
                },
                onFlowComplete: (data: SSEFlowCompleteData) => {
                    console.log('[DryRun] Flow complete:', data);
                    onRunComplete(data.success, data.message);
                    setLoading(false);
                    abortControllerRef.current = null;
                },
                onError: (error) => {
                    console.error('[DryRun] SSE Error:', error);
                    message.error('Dry-Run 连接失败: ' + error.message);
                    onRunComplete(false, '连接失败');
                    setLoading(false);
                    abortControllerRef.current = null;
                }
            });

            abortControllerRef.current = controller;

        } catch (error: any) {
            message.error('Dry-Run 执行失败');
            onRunComplete(false, '执行失败');
            setLoading(false);
        }
    };

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setLoading(false);
            message.info('Dry-Run 已停止');
        }
    };

    const handleClose = () => {
        if (loading) {
            handleStop();
        }
        form.resetFields();
        onClose();
    };

    return (
        <Modal
            title={<Space><ExperimentOutlined /> Dry-Run 模拟执行</Space>}
            open={open}
            onCancel={handleClose}
            width={600}
            footer={null}
            destroyOnHidden
            maskClosable={!loading}
        >
            <div style={{ marginBottom: 16 }}>
                <Text type="secondary">
                    Dry-Run 使用 SSE 实时推送执行状态，您可以在画布上看到每个节点的执行过程。
                    Modal 关闭后动画将开始播放。
                </Text>
            </div>

            <Form form={form} layout="vertical">
                <Form.Item label="数据来源">
                    <Radio.Group
                        value={inputMode}
                        onChange={e => setInputMode(e.target.value)}
                        buttonStyle="solid"
                    >
                        <Radio.Button value="json">
                            <CopyOutlined /> 粘贴 JSON
                        </Radio.Button>
                        <Radio.Button value="select">
                            <DatabaseOutlined /> 选择现有工单
                        </Radio.Button>
                    </Radio.Group>
                </Form.Item>

                {inputMode === 'json' ? (
                    <Form.Item
                        name="rawJson"
                        label="原始工单数据 (JSON)"
                        rules={[{ required: true, message: '请输入 JSON 数据' }]}
                        extra="输入模拟的工单 JSON 数据，包含 raw_data、affected_ci 等字段"
                    >
                        <TextArea
                            rows={10}
                            placeholder={`{
  "title": "测试告警",
  "severity": "2",
  "affected_ci": "192.168.1.100,192.168.1.101",
  "raw_data": {
    "cmdb_ci": "server-01,server-02"
  }
}`}
                            style={{ fontFamily: 'monospace', fontSize: 12 }}
                        />
                    </Form.Item>
                ) : (
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ marginBottom: 8 }}>
                            <Typography.Text>选择工单 <span style={{ color: '#ff4d4f' }}>*</span></Typography.Text>
                        </div>
                        <Space.Compact style={{ width: '100%' }}>
                            <Input
                                readOnly
                                value={selectedIncident ? `${selectedIncident.title} (${selectedIncident.severity})` : ''}
                                placeholder="点击选择一个现有工单"
                                style={{ flex: 1 }}
                            />
                            <Button
                                icon={<SelectOutlined />}
                                onClick={() => setIncidentSelectorOpen(true)}
                            >
                                选择
                            </Button>
                        </Space.Compact>
                        {selectedIncident && (
                            <div style={{ marginTop: 8, padding: 8, background: '#f6ffed', borderRadius: 4, border: '1px solid #b7eb8f', fontSize: 12 }}>
                                <Text type="secondary">CI: </Text>{selectedIncident.affected_ci || '-'}
                                <Text type="secondary" style={{ marginLeft: 12 }}>状态: </Text>{selectedIncident.status}
                            </div>
                        )}
                        <IncidentSelector
                            open={incidentSelectorOpen}
                            value={selectedIncident?.id}
                            onSelect={(id, incident) => {
                                setSelectedIncident(incident);
                                setIncidentSelectorOpen(false);
                            }}
                            onCancel={() => setIncidentSelectorOpen(false)}
                        />
                    </div>
                )}

                {/* 审批节点模拟配置 */}
                {approvalNodes.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ marginBottom: 8 }}>
                            <Typography.Text strong>审批节点模拟设置</Typography.Text>
                            <Typography.Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                                (默认: 通过)
                            </Typography.Text>
                        </div>
                        <div style={{ background: '#fafafa', padding: 12, borderRadius: 4, border: '1px solid #d9d9d9' }}>
                            {approvalNodes.map(node => (
                                <div key={node.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                                    <Text style={{ width: 120, flexShrink: 0 }}>{node.label || node.id}</Text>
                                    <Radio.Group
                                        size="small"
                                        value={mockApprovals[node.id] || 'approved'}
                                        onChange={e => setMockApprovals(prev => ({ ...prev, [node.id]: e.target.value }))}
                                    >
                                        <Radio.Button value="approved" style={{ color: '#52c41a' }}>✓ 通过</Radio.Button>
                                        <Radio.Button value="rejected" style={{ color: '#ff4d4f' }}>✗ 拒绝</Radio.Button>
                                    </Radio.Group>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <Space style={{ width: '100%' }}>
                    <Button
                        type="primary"
                        icon={<ExperimentOutlined />}
                        onClick={handleRun}
                        loading={loading}
                        style={{ flex: 1 }}
                        size="large"
                    >
                        {loading ? '正在执行...' : '开始 Dry-Run'}
                    </Button>
                    {loading && (
                        <Button
                            danger
                            icon={<StopOutlined />}
                            onClick={handleStop}
                            size="large"
                        >
                            停止
                        </Button>
                    )}
                </Space>
            </Form>
        </Modal>
    );
};

export default DryRunModal;

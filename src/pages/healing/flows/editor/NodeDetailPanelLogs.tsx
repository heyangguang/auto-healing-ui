import React from 'react';
import { Button, Typography } from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    CodeOutlined,
    LoadingOutlined,
    ReloadOutlined,
    StopOutlined,
} from '@ant-design/icons';
import type { FlowEditorNode } from './flowEditorTypes';

const { Text } = Typography;

const LOG_FONT_FAMILY = 'Menlo, Monaco, "Courier New", monospace';

interface NodeDetailPanelLogsProps {
    node: FlowEditorNode | null;
    onRetry?: () => void;
}

type LogStatusConfig = {
    color: string;
    bg: string;
    text: string;
    icon: React.ReactNode;
};

const hasRenderableValue = (value: unknown) => {
    if (Array.isArray(value)) {
        return value.length > 0;
    }
    if (value && typeof value === 'object') {
        return Object.keys(value).length > 0;
    }
    return Boolean(value);
};

const getLogStatusConfig = (status?: string): LogStatusConfig => {
    if (status === 'skipped') {
        return { color: '#8c8c8c', bg: '#3a3a3a', text: 'SKIPPED', icon: <StopOutlined /> };
    }
    if (status === 'error' || status === 'failed') {
        return { color: '#ff4d4f', bg: '#2a1215', text: 'FAILED', icon: <CloseCircleOutlined /> };
    }
    if (['ok', 'success', 'simulated', 'would_execute', 'would_send', 'partial'].includes(status || '')) {
        return { color: '#52c41a', bg: '#162312', text: 'SUCCESS', icon: <CheckCircleOutlined /> };
    }
    return { color: '#1890ff', bg: '#111d2c', text: 'RUNNING', icon: <LoadingOutlined spin /> };
};

const JsonSection: React.FC<{ label: string; value: unknown }> = ({ label, value }) => {
    if (!hasRenderableValue(value)) {
        return null;
    }

    return (
        <div>
            <div style={{ padding: '6px 12px', background: '#2d2d2d', borderBottom: '1px solid #404040', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: '#8c8c8c', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{label}</Text>
            </div>
            <pre
                style={{
                    margin: 0,
                    padding: 12,
                    background: '#1e1e1e',
                    color: '#d4d4d4',
                    fontSize: 12,
                    fontFamily: LOG_FONT_FAMILY,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                }}
            >
                {JSON.stringify(value, null, 2)}
            </pre>
        </div>
    );
};

const ProcessSection: React.FC<{ steps: string[] }> = ({ steps }) => {
    if (steps.length === 0) {
        return null;
    }

    return (
        <div>
            <div style={{ padding: '6px 12px', background: '#2d2d2d', borderBottom: '1px solid #404040', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CodeOutlined style={{ color: '#1890ff', fontSize: 12 }} />
                <Text style={{ color: '#8c8c8c', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>EXECUTION LOG</Text>
                <Text style={{ color: '#666', fontSize: 11, marginLeft: 'auto' }}>{steps.length} steps</Text>
            </div>
            <div style={{ background: '#1e1e1e', padding: '8px 0' }}>
                {steps.map((step, index) => {
                    const isSuccessLine = step.includes('成功') || step.includes('通过') || step.includes('完成');
                    const isFailedLine = step.includes('失败') || step.includes('错误');
                    const lineColor = isFailedLine ? '#ff4d4f' : isSuccessLine ? '#52c41a' : '#d4d4d4';
                    return (
                        <div
                            key={`${index}-${step}`}
                            style={{
                                padding: '4px 12px',
                                fontFamily: LOG_FONT_FAMILY,
                                fontSize: 12,
                                lineHeight: 1.6,
                                display: 'flex',
                                alignItems: 'flex-start',
                                background: isFailedLine ? 'rgba(255,77,79,0.1)' : 'transparent',
                            }}
                        >
                            <span style={{ color: '#666', marginRight: 12, minWidth: 28, textAlign: 'right', userSelect: 'none' }}>
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <span style={{ color: lineColor }}>{step}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const getProcessSteps = (value: unknown) => {
    return Array.isArray(value) ? value.map((step) => String(step)) : [];
};

export const NodeDetailPanelLogs: React.FC<NodeDetailPanelLogsProps> = ({ node, onRetry }) => {
    const data = node?.data;
    const status = typeof data?.status === 'string' ? data.status : undefined;
    if (!status) {
        return (
            <div style={{ padding: 40, textAlign: 'center', color: '#8c8c8c', background: '#1e1e1e', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                运行 Dry-Run 后查看日志
            </div>
        );
    }

    const statusConfig = getLogStatusConfig(status);
    const inputData = data?.dryRunInput || data?.input;
    const outputData = data?.dryRunOutput || data?.output;
    const processSteps = getProcessSteps(data?.dryRunProcess || data?.process);
    const showEmptyState = processSteps.length === 0 && !hasRenderableValue(inputData) && !hasRenderableValue(outputData);
    const isErrorStatus = status === 'error' || status === 'failed';

    return (
        <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', background: '#1e1e1e' }}>
            <div style={{ padding: '12px 16px', background: statusConfig.bg, borderBottom: '1px solid #404040', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: statusConfig.color, fontSize: 16 }}>{statusConfig.icon}</span>
                    <div>
                        <Text strong style={{ color: statusConfig.color, fontSize: 13 }}>{statusConfig.text}</Text>
                        {data?.dryRunMessage && (
                            <Text style={{ color: '#8c8c8c', fontSize: 12, marginLeft: 12 }}>{String(data.dryRunMessage)}</Text>
                        )}
                    </div>
                </div>
                {isErrorStatus && onRetry && (
                    <Button size="small" type="primary" danger icon={<ReloadOutlined />} onClick={onRetry}>
                        重试
                    </Button>
                )}
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: 0 }}>
                <ProcessSection steps={processSteps} />
                <JsonSection label="Output" value={outputData} />
                <JsonSection label="Input" value={inputData} />
                {showEmptyState && (
                    <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
                        该节点暂无详细日志
                    </div>
                )}
            </div>
        </div>
    );
};

import React from 'react';
import { Space, Typography } from 'antd';
import type { FlowEditorNode, FlowEditorNodeData } from './flowEditorTypes';
import type { ChannelInfo } from './nodeConfigPanelTypes';

const HINT_BOX_STYLE = {
    marginTop: -8,
    marginBottom: 16,
    padding: '8px 12px',
    background: '#fafafa',
    borderRadius: 4,
    border: '1px dashed #d9d9d9',
    fontSize: 12,
} as const;

const HINT_CODE_STYLE = {
    borderRadius: 2,
    padding: '0 4px',
} as const;

export const getSelectedChannelTypes = (channelIds: unknown, channels: ChannelInfo[]) => {
    if (!Array.isArray(channelIds) || channelIds.length === 0 || channels.length === 0) {
        return [];
    }

    const types = channels
        .filter((channel) => channelIds.includes(channel.id))
        .map((channel) => channel.type);

    return [...new Set(types)];
};

const HintGroup: React.FC<{ items: string[]; label: string; palette: { text: string; bg: string; border: string } }> = ({
    items,
    label,
    palette,
}) => (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: label === '输入依赖:' ? 4 : 0 }}>
        <span style={{ color: '#8c8c8c', marginRight: 4 }}>{label}</span>
        <Space size={4} wrap>
            {items.map((item) => (
                <code
                    key={item}
                    style={{ ...HINT_CODE_STYLE, color: palette.text, background: palette.bg, border: `1px solid ${palette.border}` }}
                >
                    {item}
                </code>
            ))}
        </Space>
    </div>
);

export const VariableHint: React.FC<{ inputs?: string[]; outputs?: string[] }> = ({ inputs, outputs }) => {
    if ((!inputs || inputs.length === 0) && (!outputs || outputs.length === 0)) {
        return null;
    }

    return (
        <div style={HINT_BOX_STYLE}>
            {inputs && inputs.length > 0 && (
                <HintGroup items={inputs} label="输入依赖:" palette={{ text: '#13c2c2', bg: '#e6fffb', border: '#87e8de' }} />
            )}
            {outputs && outputs.length > 0 && (
                <HintGroup items={outputs} label="产生变量:" palette={{ text: '#389e0d', bg: '#f6ffed', border: '#b7eb8f' }} />
            )}
        </div>
    );
};

function getRunResultMeta(status?: string) {
    if (status === 'error') {
        return { bg: '#fff1f0', border: '#ffa39e', color: '#cf1322', title: '执行失败' };
    }

    if (status === 'ok' || status === 'simulated') {
        return { bg: '#f6ffed', border: '#b7eb8f', color: '#389e0d', title: '执行成功' };
    }

    return { bg: '#e6f7ff', border: '#91d5ff', color: '#096dd9', title: '正在执行...' };
}

const RunResultOutput: React.FC<{ output: unknown }> = ({ output }) => (
    <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Output Payload:</div>
        <pre
            style={{
                background: 'rgba(255,255,255,0.6)',
                padding: 8,
                borderRadius: 4,
                margin: 0,
                maxHeight: 200,
                overflow: 'auto',
                fontSize: 11,
                fontFamily: 'Menlo, Monaco, monospace',
            }}
        >
            {JSON.stringify(output, null, 2)}
        </pre>
    </div>
);

export const RunResultView: React.FC<{ data?: FlowEditorNodeData }> = ({ data }) => {
    if (!data?.status && !data?.dryRunMessage) {
        return null;
    }

    const meta = getRunResultMeta(data.status);
    return (
        <div style={{ marginBottom: 24, padding: 12, background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: 4 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8, color: meta.color }}>{meta.title}</div>
            <div style={{ marginBottom: 8, fontSize: 13, color: 'rgba(0,0,0,0.85)' }}>{data.dryRunMessage}</div>
            {data.dryRunOutput !== undefined && data.dryRunOutput !== null && <RunResultOutput output={data.dryRunOutput} />}
        </div>
    );
};

export const NodeConfigPanelTitle: React.FC<{ node: FlowEditorNode | null }> = ({ node }) => (
    <Space>
        <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#1890ff' }} />
        <Typography.Text strong>{node?.data?.label || '节点配置'}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            ({node?.data?.type || node?.type})
        </Typography.Text>
    </Space>
);

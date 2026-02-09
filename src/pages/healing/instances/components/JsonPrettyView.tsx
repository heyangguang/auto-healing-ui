import React from 'react';
import { Button, Descriptions, Empty, Space, Tag, Typography, message } from 'antd';
import { CopyOutlined, CodeOutlined } from '@ant-design/icons';

/** 内部字段黑名单 - 不展示给用户 */
const HIDDEN_KEYS = new Set(['_nodeState', 'dryRunMessage', '__proto__']);

/** 判断值是否为"空" */
const isEmptyValue = (v: any): boolean => {
    if (v === null || v === undefined) return true;
    if (typeof v === 'string' && v.trim() === '') return true;
    return false;
};

/** 将值渲染为可读 React 节点 */
const renderValue = (value: any, depth: number = 0): React.ReactNode => {
    if (isEmptyValue(value)) return <Typography.Text type="secondary">-</Typography.Text>;
    if (typeof value === 'boolean') return <Tag color={value ? 'success' : 'default'}>{String(value)}</Tag>;
    if (typeof value === 'number') return <Typography.Text code>{value}</Typography.Text>;
    if (typeof value === 'string') {
        // Timestamp
        if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
            try { return new Date(value).toLocaleString('zh-CN'); } catch { return value; }
        }
        // Status-like values
        if (['success', 'completed'].includes(value)) return <Tag color="success">{value}</Tag>;
        if (['failed', 'error'].includes(value)) return <Tag color="error">{value}</Tag>;
        if (['running', 'pending'].includes(value)) return <Tag color="processing">{value}</Tag>;
        if (['skipped', 'cancelled'].includes(value)) return <Tag color="default">{value}</Tag>;
        // Long text
        if (value.length > 200) return <Typography.Paragraph ellipsis={{ rows: 3, expandable: true }} style={{ margin: 0, fontSize: 13 }}>{value}</Typography.Paragraph>;
        return <span style={{ fontSize: 13 }}>{value}</span>;
    }
    if (Array.isArray(value)) {
        if (value.length === 0) return <Typography.Text type="secondary">[]</Typography.Text>;
        if (value.every(v => typeof v !== 'object')) {
            return <Space size={4} wrap>{value.map((v, i) => <Tag key={i}>{String(v)}</Tag>)}</Space>;
        }
        return (
            <pre style={{ background: '#fafafa', padding: 8, borderRadius: 6, fontSize: 11, fontFamily: 'Menlo, Monaco, Consolas, monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, maxHeight: 200, overflow: 'auto' }}>
                {JSON.stringify(value, null, 2)}
            </pre>
        );
    }
    if (typeof value === 'object' && depth < 2) {
        const entries = Object.entries(value).filter(([k, v]) => !HIDDEN_KEYS.has(k) && !isEmptyValue(v));
        if (entries.length === 0) return <Typography.Text type="secondary">-</Typography.Text>;
        return (
            <Descriptions column={1} size="small" bordered labelStyle={{ background: '#fafafa', fontWeight: 500, width: 120, fontSize: 12 }} contentStyle={{ fontSize: 12 }}>
                {entries.map(([k, v]) => (
                    <Descriptions.Item key={k} label={k}>{renderValue(v, depth + 1)}</Descriptions.Item>
                ))}
            </Descriptions>
        );
    }
    return (
        <pre style={{ background: '#fafafa', padding: 8, borderRadius: 6, fontSize: 11, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, maxHeight: 150, overflow: 'auto' }}>
            {JSON.stringify(value, null, 2)}
        </pre>
    );
};

/** JSON 美化展示组件：key-value 表格 + 复制按钮 + 可折叠原始数据 */
const JsonPrettyView: React.FC<{ data: any }> = ({ data }) => {
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
        return <Empty description="暂无数据" style={{ marginTop: 40 }} />;
    }

    // 过滤掉内部字段和空值
    const entries = Object.entries(data).filter(([k, v]) => !HIDDEN_KEYS.has(k) && !isEmptyValue(v));

    if (entries.length === 0) {
        return <Empty description="暂无数据" style={{ marginTop: 40 }} />;
    }

    const jsonStr = JSON.stringify(data, null, 2);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => { navigator.clipboard.writeText(jsonStr); message.success('已复制到剪贴板'); }}
                >
                    复制 JSON
                </Button>
            </div>
            <Descriptions
                column={1}
                size="small"
                bordered
                labelStyle={{ background: '#fafafa', fontWeight: 500, width: 130, fontSize: 12 }}
                contentStyle={{ fontSize: 12 }}
            >
                {entries.map(([key, value]) => (
                    <Descriptions.Item key={key} label={key}>
                        {renderValue(value)}
                    </Descriptions.Item>
                ))}
            </Descriptions>
            <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: 'pointer', fontSize: 12, color: '#8c8c8c', userSelect: 'none' }}>
                    <CodeOutlined /> 查看原始 JSON
                </summary>
                <pre style={{ background: '#fafafa', padding: 12, borderRadius: 6, fontSize: 11, fontFamily: 'Menlo, Monaco, Consolas, monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: '8px 0 0', border: '1px solid #f0f0f0', maxHeight: 300, overflow: 'auto' }}>
                    {jsonStr}
                </pre>
            </details>
        </div>
    );
};

export default JsonPrettyView;

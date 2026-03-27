import React from 'react';
import {
    Card,
    Descriptions,
    Space,
    Tag,
    Typography,
} from 'antd';
import {
    NodeIndexOutlined,
    TagOutlined,
} from '@ant-design/icons';
import JsonPrettyView from '../components/JsonPrettyView';
import { CONFIG_LABELS, CONTEXT_LABELS } from './detailConstants';

type NodeConfigContextCardsProps = {
    configEntries: Array<[string, unknown]>;
    contextEntries: Array<[string, unknown]>;
    resolvedNames: Record<string, string>;
};

const isSimpleArray = (value: unknown[]): boolean => value.every((item) => typeof item !== 'object');
const buildTagItems = (value: unknown[]) => {
    const counts = new Map<string, number>();
    return value.map((item) => {
        const label = typeof item === 'object' ? JSON.stringify(item) : String(item);
        const count = (counts.get(label) || 0) + 1;
        counts.set(label, count);
        return { key: `${label}-${count}`, label };
    });
};

const renderDescriptionValue = (value: unknown) => {
    if (Array.isArray(value)) {
        return (
            <Space size={[4, 4]} wrap>
                {buildTagItems(value).map((item) => <Tag key={item.key} style={{ margin: 0 }}>{item.label}</Tag>)}
            </Space>
        );
    }
    if (typeof value === 'object' && value !== null) {
        return (
            <Typography.Paragraph copyable code style={{ fontSize: 11, margin: 0, maxWidth: '100%', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(value, null, 2)}
            </Typography.Paragraph>
        );
    }
    if (typeof value === 'boolean') {
        return <Tag color={value ? 'success' : 'default'} style={{ margin: 0 }}>{String(value)}</Tag>;
    }
    return <span>{String(value)}</span>;
};

const NodeConfigContextCards: React.FC<NodeConfigContextCardsProps> = ({
    configEntries,
    contextEntries,
    resolvedNames,
}) => (
    <>
        {configEntries.length > 0 && (
            <Card size="small" title={<span style={{ fontSize: 13, fontWeight: 600 }}><TagOutlined style={{ marginRight: 6 }} />输入配置</span>} style={{ marginBottom: 16 }}>
                <Descriptions column={2} size="small" bordered labelStyle={{ background: '#fafafa', color: '#595959', width: 120, fontSize: 12 }} contentStyle={{ color: '#262626', fontSize: 13 }}>
                    {configEntries.map(([key, value]) => {
                        const isIdField = ['channel_id', 'template_id', 'notification_channel_id', 'notification_template_id', 'task_id', 'task_template_id'].includes(key);
                        const displayValue = key === 'type'
                            ? value
                            : (isIdField && typeof value === 'string' && resolvedNames[value]) ? resolvedNames[value] : value;
                        const isLongString = typeof displayValue === 'string' && displayValue.length > 40;
                        const isObjectValue = typeof displayValue === 'object' && displayValue !== null && !Array.isArray(displayValue);
                        const isNonSimpleArray = Array.isArray(displayValue) && !isSimpleArray(displayValue);

                        return (
                            <Descriptions.Item key={key} label={CONFIG_LABELS[key] || key} span={isLongString || isObjectValue || isNonSimpleArray ? 2 : 1}>
                                {renderDescriptionValue(displayValue)}
                            </Descriptions.Item>
                        );
                    })}
                </Descriptions>
            </Card>
        )}

        {contextEntries.length > 0 && (
            <Card size="small" title={<span style={{ fontSize: 13, fontWeight: 600 }}><NodeIndexOutlined style={{ marginRight: 6 }} />运行输出</span>} style={{ marginBottom: 16 }}>
                <Descriptions column={1} size="small" bordered labelStyle={{ background: '#fafafa', color: '#595959', width: 130, fontSize: 12 }} contentStyle={{ color: '#262626', fontSize: 13 }}>
                    {contextEntries.map(([key, value]) => {
                        const label = CONTEXT_LABELS[key] || key;
                        if ((key.endsWith('_at') || key.endsWith('_time')) && typeof value === 'string') {
                            return <Descriptions.Item key={key} label={label}>{new Date(value).toLocaleString('zh-CN')}</Descriptions.Item>;
                        }
                        if (key.endsWith('_id') && typeof value === 'string' && resolvedNames[value]) {
                            return <Descriptions.Item key={key} label={label}><Tag color="blue" style={{ margin: 0 }}>{resolvedNames[value]}</Tag></Descriptions.Item>;
                        }
                        if (typeof value === 'string' && value.length > 120) {
                            return <Descriptions.Item key={key} label={label}><Typography.Paragraph ellipsis={{ rows: 2, expandable: true, symbol: '展开' }} style={{ margin: 0, fontSize: 13 }}>{value}</Typography.Paragraph></Descriptions.Item>;
                        }
                        if (Array.isArray(value) && isSimpleArray(value)) {
                            return <Descriptions.Item key={key} label={label}><Space size={[4, 4]} wrap>{buildTagItems(value).map((item) => <Tag key={item.key} style={{ margin: 0 }}>{item.label}</Tag>)}</Space></Descriptions.Item>;
                        }
                        if (typeof value === 'number' || typeof value === 'boolean') {
                            return <Descriptions.Item key={key} label={label}>{typeof value === 'boolean' ? <Tag color={value ? 'success' : 'default'} style={{ margin: 0 }}>{String(value)}</Tag> : String(value)}</Descriptions.Item>;
                        }
                        return <Descriptions.Item key={key} label={label}>{typeof value === 'string' ? value : <JsonPrettyView data={value} />}</Descriptions.Item>;
                    })}
                </Descriptions>
            </Card>
        )}
    </>
);

export default NodeConfigContextCards;

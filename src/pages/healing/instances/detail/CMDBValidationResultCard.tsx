import React from 'react';
import { CheckCircleOutlined } from '@ant-design/icons';
import { Card, Space, Tag } from 'antd';
import JsonPrettyView from '../components/JsonPrettyView';
import type { NodeStateLike } from './nodeDetailTypes';

type CMDBValidationResultCardProps = {
    invalidHosts?: NodeStateLike['invalid_hosts'];
    validatedHosts?: NodeStateLike['validated_hosts'];
    validationSummary?: NodeStateLike['validation_summary'];
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => (
    Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const getStringField = (value: Record<string, unknown>, key: string) => {
    const field = value[key];
    return typeof field === 'string' && field.trim() ? field.trim() : undefined;
};

const getNumberField = (value: Record<string, unknown>, key: string) => {
    const field = value[key];
    if (typeof field === 'number' && Number.isFinite(field)) {
        return field;
    }
    if (typeof field === 'string' && field.trim() && Number.isFinite(Number(field))) {
        return Number(field);
    }
    return undefined;
};

const formatHostLabel = (value: unknown) => {
    if (typeof value === 'string') {
        return value;
    }
    if (!isPlainObject(value)) {
        return JSON.stringify(value);
    }

    const hostname = getStringField(value, 'hostname') || getStringField(value, 'host');
    const name = getStringField(value, 'name');
    const ip = getStringField(value, 'ip_address') || getStringField(value, 'ip');
    const fallback = getStringField(value, 'id');
    const primary = hostname || name || ip || fallback;

    if (!primary) {
        return JSON.stringify(value);
    }
    if (ip && primary !== ip) {
        return `${primary} (${ip})`;
    }
    return primary;
};

function buildDuplicateSafeEntries(values: unknown[]) {
    const counts = new Map<string, number>();
    return values
        .map((value) => formatHostLabel(value))
        .filter((value): value is string => Boolean(value))
        .map((value) => {
            const count = (counts.get(value) || 0) + 1;
            counts.set(value, count);
            return { key: `${value}-${count}`, value };
        });
}

const normalizeHostEntries = (value: unknown) => {
    if (Array.isArray(value)) {
        return buildDuplicateSafeEntries(value);
    }
    if (typeof value === 'string') {
        return buildDuplicateSafeEntries(
            value.split(',').map((item) => item.trim()).filter(Boolean),
        );
    }
    return [];
};

const renderValidationSummary = (value: CMDBValidationResultCardProps['validationSummary']) => {
    if (typeof value === 'string') {
        return <div style={{ fontSize: 13 }}>{value}</div>;
    }
    if (!isPlainObject(value)) {
        return null;
    }

    const total = getNumberField(value, 'total');
    const valid = getNumberField(value, 'valid');
    const invalid = getNumberField(value, 'invalid');

    if ([total, valid, invalid].some((item) => item != null)) {
        return (
            <Space size={[8, 8]} wrap>
                {total != null && <Tag style={{ margin: 0 }}>总计 {total}</Tag>}
                {valid != null && <Tag color="success" style={{ margin: 0 }}>通过 {valid}</Tag>}
                {invalid != null && <Tag color="error" style={{ margin: 0 }}>未通过 {invalid}</Tag>}
            </Space>
        );
    }

    return <JsonPrettyView data={value} />;
};

const CMDBValidationResultCard: React.FC<CMDBValidationResultCardProps> = ({
    invalidHosts,
    validatedHosts,
    validationSummary,
}) => {
    const validatedHostEntries = normalizeHostEntries(validatedHosts);
    const invalidHostEntries = normalizeHostEntries(invalidHosts);
    const summaryNode = renderValidationSummary(validationSummary);

    if (!summaryNode && validatedHostEntries.length === 0 && invalidHostEntries.length === 0) {
        return null;
    }

    return (
        <Card
            size="small"
            title={(
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                    <CheckCircleOutlined style={{ color: '#1890ff', marginRight: 6 }} />
                    CMDB 验证结果
                </span>
            )}
            style={{ marginBottom: 16, borderLeft: '3px solid #1890ff' }}
        >
            {summaryNode && <div style={{ marginBottom: 10 }}>{summaryNode}</div>}
            {validatedHostEntries.length > 0 && (
                <div style={{ marginBottom: invalidHostEntries.length > 0 ? 8 : 0 }}>
                    <span style={{ fontSize: 12, color: '#52c41a', fontWeight: 500 }}>
                        ✓ 验证通过 ({validatedHostEntries.length})
                    </span>
                    <div style={{ marginTop: 4 }}>
                        <Space size={[4, 4]} wrap>
                            {validatedHostEntries.map((host) => (
                                <Tag key={host.key} color="success" style={{ margin: 0 }}>
                                    {host.value}
                                </Tag>
                            ))}
                        </Space>
                    </div>
                </div>
            )}
            {invalidHostEntries.length > 0 && (
                <div>
                    <span style={{ fontSize: 12, color: '#ff4d4f', fontWeight: 500 }}>
                        ✗ 未通过 ({invalidHostEntries.length})
                    </span>
                    <div style={{ marginTop: 4 }}>
                        <Space size={[4, 4]} wrap>
                            {invalidHostEntries.map((host) => (
                                <Tag key={host.key} color="error" style={{ margin: 0 }}>
                                    {host.value}
                                </Tag>
                            ))}
                        </Space>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default CMDBValidationResultCard;

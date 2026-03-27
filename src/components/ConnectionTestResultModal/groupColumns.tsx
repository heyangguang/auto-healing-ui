import React from 'react';
import { Space, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { ENV_COLORS, getOSIcon, TYPE_LABELS } from './constants';
import type { HostInfo } from './types';

const { Text } = Typography;

export const getGroupColumns = (isSuccess: boolean) => {
    const cols: TableColumnsType<HostInfo> = [
        {
            title: 'IP',
            dataIndex: 'host',
            key: 'host',
            width: 120,
            render: (v: string) => <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</Text>,
        },
        {
            title: '主机名',
            dataIndex: 'hostname',
            key: 'hostname',
            width: 120,
            ellipsis: { showTitle: true },
            render: (v: string) => v || '-',
        },
        {
            title: 'OS',
            dataIndex: 'os',
            key: 'os',
            width: 90,
            render: (v: string) => (
                <Space size={4}>
                    {getOSIcon(v)}
                    <span style={{ fontSize: 12 }}>{v || '-'}</span>
                </Space>
            ),
        },
        {
            title: '类型',
            dataIndex: 'type',
            key: 'type',
            width: 80,
            render: (v: string) => {
                const info = TYPE_LABELS[v];
                if (!info) return '-';
                return (
                    <Space size={4}>
                        {info.icon}
                        <span style={{ fontSize: 12 }}>{info.text}</span>
                    </Space>
                );
            },
        },
        {
            title: '环境',
            dataIndex: 'environment',
            key: 'environment',
            width: 70,
            render: (v: string) => v ? (
                <Tag color={ENV_COLORS[v] || 'default'} style={{ margin: 0, fontSize: 11 }}>
                    {v}
                </Tag>
            ) : '-',
        },
    ];

    if (isSuccess) {
        cols.push({
            title: '延迟',
            dataIndex: 'latency_ms',
            key: 'latency_ms',
            width: 60,
            align: 'right',
            render: (v: number) => v != null && v > 0
                ? <Text type="secondary" style={{ fontSize: 11 }}>{v}ms</Text>
                : '-',
        });
    }

    return cols;
};

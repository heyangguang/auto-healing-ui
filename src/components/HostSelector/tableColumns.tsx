import React from 'react';
import { Badge, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

export function createHostColumns(): ColumnsType<AutoHealing.CMDBItem> {
    return [
        {
            title: '主机 IP',
            dataIndex: 'ip_address',
            width: 150,
            render: (ip: string) => <Text copyable={{ text: ip }} style={{ color: '#314659' }}>{ip}</Text>,
        },
        {
            title: '主机名',
            dataIndex: 'hostname',
            ellipsis: true,
            render: (text: string) => <Text style={{ color: '#595959' }}>{text}</Text>,
        },
        {
            title: '操作系统',
            dataIndex: 'os_version',
            width: 140,
            render: (value: string, row: AutoHealing.CMDBItem) => <Text type="secondary" style={{ fontSize: 12 }}>{value || row.os || '-'}</Text>,
        },
        {
            title: '状态',
            dataIndex: 'status',
            width: 80,
            render: (value: string) => (
                <Badge
                    status={value === 'active' ? 'success' : 'default'}
                    text={<span style={{ fontSize: 12, color: value === 'active' ? '#52c41a' : '#bfbfbf' }}>{value === 'active' ? '正常' : '未知'}</span>}
                />
            ),
        },
        {
            title: '负责人',
            dataIndex: 'owner',
            width: 100,
            ellipsis: true,
            render: (value: string) => <Text type="secondary" style={{ fontSize: 12 }}>{value || '-'}</Text>,
        },
    ];
}

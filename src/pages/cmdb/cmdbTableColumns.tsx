import React from 'react';
import {
    ApiOutlined,
    CheckCircleOutlined,
    CloudServerOutlined,
    ToolOutlined,
} from '@ant-design/icons';
import {
    Badge,
    Button,
    Space,
    Tag,
    Tooltip,
    Typography,
} from 'antd';
import dayjs from 'dayjs';
import type { StandardColumnDef } from '@/components/StandardTable';
import {
    ENV_MAP,
    getOSIcon,
    STATUS_MAP,
    TYPE_MAP,
} from './cmdbPageConfig';

const { Text } = Typography;

type ColumnHandlers = {
    canTestPlugin: boolean;
    canUpdatePlugin: boolean;
    onOpenDetail: (record: AutoHealing.CMDBItem) => void;
    onOpenMaintenance: (record: AutoHealing.CMDBItem) => void;
    onOpenTestModal: (record: AutoHealing.CMDBItem) => void;
    onResumeMaintenance: (record: AutoHealing.CMDBItem) => boolean | Promise<boolean>;
};

export function createCMDBColumns({
    canTestPlugin,
    canUpdatePlugin,
    onOpenDetail,
    onOpenMaintenance,
    onOpenTestModal,
    onResumeMaintenance,
}: ColumnHandlers): StandardColumnDef<AutoHealing.CMDBItem>[] {
    return [
        {
            columnKey: 'name',
            columnTitle: '名称',
            fixedColumn: true,
            dataIndex: 'name',
            width: 160,
            sorter: true,
            render: (_: unknown, record: AutoHealing.CMDBItem) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <a
                        style={{ fontWeight: 500, color: '#1677ff', cursor: 'pointer' }}
                        onClick={(event) => {
                            event.stopPropagation();
                            onOpenDetail(record);
                        }}
                    >
                        {record.name || record.hostname}
                    </a>
                    <span
                        style={{
                            fontSize: 11,
                            fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
                            color: '#8590a6',
                            letterSpacing: '0.02em',
                        }}
                    >
                        {record.ip_address}
                    </span>
                </div>
            ),
        },
        {
            columnKey: 'hostname',
            columnTitle: '主机名',
            dataIndex: 'hostname',
            width: 150,
            ellipsis: true,
            defaultVisible: false,
            render: (_: unknown, record: AutoHealing.CMDBItem) => record.hostname || <Text type="secondary">-</Text>,
        },
        {
            columnKey: 'type',
            columnTitle: '类型',
            dataIndex: 'type',
            width: 60,
            sorter: true,
            headerFilters: Object.entries(TYPE_MAP).map(([value, type]) => ({ label: type.text, value })),
            render: (_: unknown, record: AutoHealing.CMDBItem) => {
                const info = TYPE_MAP[record.type] || {
                    text: record.type,
                    icon: <CloudServerOutlined />,
                    color: '#8c8c8c',
                };
                return (
                    <Tooltip title={info.text}>
                        <span style={{ fontSize: 16, color: info.color }}>{info.icon}</span>
                    </Tooltip>
                );
            },
        },
        {
            columnKey: 'status',
            columnTitle: '状态',
            dataIndex: 'status',
            width: 90,
            sorter: true,
            headerFilters: Object.entries(STATUS_MAP).map(([value, status]) => ({ label: status.text, value })),
            render: (_: unknown, record: AutoHealing.CMDBItem) => {
                const info = STATUS_MAP[record.status] || { text: record.status, badge: 'default' as const };
                return <Badge status={info.badge} text={info.text} />;
            },
        },
        {
            columnKey: 'environment',
            columnTitle: '环境',
            dataIndex: 'environment',
            width: 80,
            sorter: true,
            headerFilters: Object.entries(ENV_MAP).map(([value, environment]) => ({ label: environment.text, value })),
            render: (_: unknown, record: AutoHealing.CMDBItem) => {
                const info = ENV_MAP[record.environment] || { text: record.environment, color: 'default' };
                return <Tag color={info.color} style={{ margin: 0 }}>{info.text}</Tag>;
            },
        },
        {
            columnKey: 'os',
            columnTitle: 'OS',
            dataIndex: 'os',
            width: 60,
            sorter: true,
            render: (_: unknown, record: AutoHealing.CMDBItem) => {
                if (!record.os) return <Text type="secondary">-</Text>;
                return (
                    <Tooltip title={record.os}>
                        <span style={{ fontSize: 16 }}>{getOSIcon(record.os)}</span>
                    </Tooltip>
                );
            },
        },
        {
            columnKey: 'spec',
            columnTitle: 'CPU / 内存',
            width: 130,
            render: (_: unknown, record: AutoHealing.CMDBItem) => {
                if (!record.cpu && !record.memory) return <Text type="secondary">-</Text>;
                return (
                    <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>
                        {record.cpu || '-'} / {record.memory || '-'}
                    </Text>
                );
            },
        },
        {
            columnKey: 'owner',
            columnTitle: '负责人',
            dataIndex: 'owner',
            width: 100,
            sorter: true,
            ellipsis: true,
            defaultVisible: false,
            render: (_: unknown, record: AutoHealing.CMDBItem) => record.owner || <Text type="secondary">-</Text>,
        },
        {
            columnKey: 'department',
            columnTitle: '部门',
            dataIndex: 'department',
            width: 100,
            sorter: true,
            ellipsis: true,
            defaultVisible: false,
            render: (_: unknown, record: AutoHealing.CMDBItem) => record.department || <Text type="secondary">-</Text>,
        },
        {
            columnKey: 'source',
            columnTitle: '来源',
            dataIndex: 'source_plugin_name',
            width: 100,
            sorter: true,
            render: (_: unknown, record: AutoHealing.CMDBItem) =>
                record.source_plugin_name
                    ? <Tag style={{ margin: 0 }}>{record.source_plugin_name}</Tag>
                    : <Text type="secondary" style={{ fontSize: 12 }}>手动</Text>,
        },
        {
            columnKey: 'updated_at',
            columnTitle: '更新时间',
            dataIndex: 'updated_at',
            width: 170,
            sorter: true,
            render: (_: unknown, record: AutoHealing.CMDBItem) =>
                record.updated_at ? dayjs(record.updated_at).format('YYYY-MM-DD HH:mm:ss') : '-',
        },
        {
            columnKey: 'actions',
            columnTitle: '操作',
            fixedColumn: true,
            width: 140,
            render: (_: unknown, record: AutoHealing.CMDBItem) => (
                <Space size="small">
                    <Tooltip title="密钥测试">
                        <Button
                            type="link"
                            size="small"
                            icon={<ApiOutlined />}
                            disabled={!canTestPlugin}
                            onClick={(event) => {
                                event.stopPropagation();
                                onOpenTestModal(record);
                            }}
                        />
                    </Tooltip>
                    {record.status === 'maintenance' ? (
                        <Tooltip title="退出维护">
                            <Button
                                type="link"
                                size="small"
                                icon={<CheckCircleOutlined />}
                                style={{ color: '#52c41a' }}
                                disabled={!canUpdatePlugin}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    void onResumeMaintenance(record);
                                }}
                            />
                        </Tooltip>
                    ) : (
                        <Tooltip title="进入维护">
                            <Button
                                type="link"
                                size="small"
                                icon={<ToolOutlined />}
                                style={{ color: '#faad14' }}
                                disabled={!canUpdatePlugin}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onOpenMaintenance(record);
                                }}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];
}

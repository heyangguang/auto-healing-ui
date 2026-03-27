import React from 'react';
import { history } from '@umijs/max';
import { Badge, Button, Popconfirm, Space, Tag, Tooltip, Typography, message } from 'antd';
import {
    AppstoreOutlined,
    DeleteOutlined,
    EditOutlined,
    UsergroupAddOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { StandardColumnDef } from '@/components/StandardTable';
import { deleteRole } from '@/services/auto-healing/roles';

const { Text } = Typography;

type RoleAccess = {
    canUpdateRole: boolean;
    canDeleteRole: boolean;
};

type RoleTableColumnsProps = {
    access: RoleAccess;
    onOpenDetail: (record: AutoHealing.RoleWithStats) => void;
    onRefresh: () => void;
};

const RoleTableColumns = ({ access, onOpenDetail, onRefresh }: RoleTableColumnsProps): StandardColumnDef<AutoHealing.RoleWithStats>[] => [
    {
        columnKey: 'display_name',
        columnTitle: '角色名称 / 标识',
        fixedColumn: true,
        dataIndex: 'display_name',
        width: 200,
        sorter: true,
        render: (_, record) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <a
                        style={{ fontWeight: 500, color: '#1677ff', cursor: 'pointer' }}
                        onClick={(event) => {
                            event.stopPropagation();
                            onOpenDetail(record);
                        }}
                    >
                        {record.display_name || record.name}
                    </a>
                    {record.is_system && (
                        <Tag color="blue" style={{ margin: 0, fontSize: 11, lineHeight: '18px', padding: '0 4px' }}>
                            系统
                        </Tag>
                    )}
                </div>
                <span style={{ fontSize: 11, fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace", color: '#8590a6', letterSpacing: '0.02em' }}>
                    {record.name}
                </span>
            </div>
        ),
    },
    {
        columnKey: 'description',
        columnTitle: '描述',
        dataIndex: 'description',
        width: 240,
        ellipsis: true,
        render: (_, record) => record.description || <Text type="secondary">-</Text>,
    },
    {
        columnKey: 'user_count',
        columnTitle: '用户数',
        dataIndex: 'user_count',
        width: 90,
        sorter: true,
        render: (_, record) => (
            <Badge
                count={record.user_count ?? 0}
                showZero
                color={record.user_count && record.user_count > 0 ? '#1677ff' : '#d9d9d9'}
                overflowCount={999}
                style={{ fontSize: 12 }}
            />
        ),
    },
    {
        columnKey: 'permission_count',
        columnTitle: '权限数',
        dataIndex: 'permission_count',
        width: 90,
        sorter: true,
        render: (_, record) => (
            <Badge
                count={record.permission_count ?? 0}
                showZero
                color={record.permission_count && record.permission_count > 0 ? '#52c41a' : '#d9d9d9'}
                overflowCount={999}
                style={{ fontSize: 12 }}
            />
        ),
    },
    {
        columnKey: 'is_system',
        columnTitle: '类型',
        dataIndex: 'is_system',
        width: 90,
        headerFilters: [
            { label: '系统角色', value: 'true' },
            { label: '自定义角色', value: 'false' },
        ],
        render: (_, record) => (
            <Tag color={record.is_system ? 'blue' : 'default'}>
                {record.is_system ? '系统' : '自定义'}
            </Tag>
        ),
    },
    {
        columnKey: 'created_at',
        columnTitle: '创建时间',
        dataIndex: 'created_at',
        width: 170,
        sorter: true,
        render: (_, record) => record.created_at ? dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
        columnKey: 'actions',
        columnTitle: '操作',
        fixedColumn: true,
        width: 140,
        render: (_, record) => (
            <Space size="small">
                <Tooltip title="分配用户">
                    <Button
                        type="link"
                        size="small"
                        icon={<UsergroupAddOutlined />}
                        disabled={!access.canUpdateRole}
                        onClick={(event) => {
                            event.stopPropagation();
                            history.push(`/system/roles/${record.id}/edit`);
                        }}
                    />
                </Tooltip>
                <Tooltip title="分配工作区">
                    <Button
                        type="link"
                        size="small"
                        icon={<AppstoreOutlined />}
                        disabled={!access.canUpdateRole}
                        onClick={(event) => {
                            event.stopPropagation();
                            history.push(`/system/roles/${record.id}/edit`);
                        }}
                    />
                </Tooltip>
                {!record.is_system && (
                    <>
                        <Tooltip title="编辑">
                            <Button
                                type="link"
                                size="small"
                                icon={<EditOutlined />}
                                disabled={!access.canUpdateRole}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    history.push(`/system/roles/${record.id}/edit`);
                                }}
                            />
                        </Tooltip>
                        <Popconfirm
                            title="确定要删除此角色吗？"
                            description="删除后不可恢复，已分配该角色的用户将失去相应权限。"
                            onConfirm={async () => {
                                try {
                                    await deleteRole(record.id);
                                    message.success('删除成功');
                                    onRefresh();
                                } catch {
                                    /* global error handler */
                                }
                            }}
                        >
                            <Tooltip title="删除">
                                <Button
                                    type="link"
                                    size="small"
                                    danger
                                    disabled={!access.canDeleteRole}
                                    icon={<DeleteOutlined />}
                                />
                            </Tooltip>
                        </Popconfirm>
                    </>
                )}
            </Space>
        ),
    },
];

export default RoleTableColumns;

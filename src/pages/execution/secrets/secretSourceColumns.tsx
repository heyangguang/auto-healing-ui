import React from 'react';
import {
    ApiOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    StarFilled,
    StarOutlined,
} from '@ant-design/icons';
import { Badge, Button, Popconfirm, Space, Spin, Switch, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import type { StandardColumnDef } from '@/components/StandardTable';
import {
    CREDENTIAL_TYPE_OPTIONS,
    SECRETS_SOURCE_OPTIONS,
    SECRETS_STATUS_OPTIONS,
    getSecretsSourceStatusMeta,
} from '@/constants/secretsDicts';
import type { SecretsStatsSummary } from './secretSourcePageConfig';
import { getAuthTypeConfig, getSourceTypeConfig } from './secretSourcePageConfig';

const { Text } = Typography;

type SecretSourceColumnsOptions = {
    canDeleteSource: boolean;
    canTestSource: boolean;
    canUpdateSource: boolean;
    onCancelDefault: (source: AutoHealing.SecretsSource) => void;
    onDelete: (id: string) => void;
    onOpenDetail: (source: AutoHealing.SecretsSource) => void;
    onOpenEdit: (source: AutoHealing.SecretsSource) => void;
    onOpenTestQuery: (source: AutoHealing.SecretsSource) => void;
    onSetDefault: (source: AutoHealing.SecretsSource) => void;
    onToggleStatus: (source: AutoHealing.SecretsSource) => void;
    testingId?: string;
};

function SecretSourceNameCell(props: {
    onOpenDetail: (source: AutoHealing.SecretsSource) => void;
    record: AutoHealing.SecretsSource;
}) {
    const { onOpenDetail, record } = props;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <a style={{ fontWeight: 500, color: '#1677ff', cursor: 'pointer' }} onClick={(event) => {
                event.stopPropagation();
                onOpenDetail(record);
            }}>
                {record.name}
            </a>
            {record.is_default && <Tooltip title="默认密钥源"><StarFilled style={{ color: '#faad14', fontSize: 12 }} /></Tooltip>}
        </div>
    );
}

function SecretSourceActionsCell(props: {
    canDeleteSource: boolean;
    canTestSource: boolean;
    canUpdateSource: boolean;
    onCancelDefault: (source: AutoHealing.SecretsSource) => void;
    onDelete: (id: string) => void;
    onOpenDetail: (source: AutoHealing.SecretsSource) => void;
    onOpenEdit: (source: AutoHealing.SecretsSource) => void;
    onOpenTestQuery: (source: AutoHealing.SecretsSource) => void;
    onSetDefault: (source: AutoHealing.SecretsSource) => void;
    onToggleStatus: (source: AutoHealing.SecretsSource) => void;
    record: AutoHealing.SecretsSource;
    testingId?: string;
}) {
    const { canDeleteSource, canTestSource, canUpdateSource, onCancelDefault, onDelete, onOpenDetail, onOpenEdit, onOpenTestQuery, onSetDefault, onToggleStatus, record, testingId } = props;
    const isActive = record.status === 'active';
    return (
        <Space size="small" onClick={(event) => event.stopPropagation()}>
            <Tooltip title={isActive ? '测试凭据' : '需先启用'}>
                <Button type="link" size="small" icon={testingId === record.id ? <Spin size="small" /> : <ApiOutlined />} onClick={() => onOpenTestQuery(record)} disabled={!!testingId || !isActive || !canTestSource} />
            </Tooltip>
            <Tooltip title="查看"><Button type="link" size="small" icon={<EyeOutlined />} onClick={() => onOpenDetail(record)} /></Tooltip>
            <Tooltip title="编辑"><Button type="link" size="small" icon={<EditOutlined />} onClick={() => onOpenEdit(record)} disabled={!canUpdateSource} /></Tooltip>
            {record.is_default
                ? <Tooltip title="取消默认"><Button type="link" size="small" icon={<StarFilled style={{ color: '#faad14' }} />} onClick={() => onCancelDefault(record)} disabled={!canUpdateSource} /></Tooltip>
                : <Tooltip title={isActive ? '设为默认' : '需先启用'}><Button type="link" size="small" icon={<StarOutlined />} onClick={() => onSetDefault(record)} disabled={!isActive || !canUpdateSource} /></Tooltip>}
            <Switch size="small" checked={isActive} onChange={() => onToggleStatus(record)} disabled={!canUpdateSource} />
            <Popconfirm title="确定删除？" description="删除后不可恢复" onConfirm={() => onDelete(record.id)}>
                <Button type="link" size="small" danger icon={<DeleteOutlined />} disabled={!canDeleteSource} />
            </Popconfirm>
        </Space>
    );
}

export function createSecretSourceColumns(options: SecretSourceColumnsOptions): StandardColumnDef<AutoHealing.SecretsSource>[] {
    const {
        canDeleteSource,
        canTestSource,
        canUpdateSource,
        onCancelDefault,
        onDelete,
        onOpenDetail,
        onOpenEdit,
        onOpenTestQuery,
        onSetDefault,
        onToggleStatus,
        testingId,
    } = options;

    return [
        {
            columnKey: 'name',
            columnTitle: '名称',
            fixedColumn: true,
            dataIndex: 'name',
            width: 200,
            sorter: true,
            render: (_: unknown, record: AutoHealing.SecretsSource) => <SecretSourceNameCell onOpenDetail={onOpenDetail} record={record} />,
        },
        {
            columnKey: 'type',
            columnTitle: '类型',
            dataIndex: 'type',
            width: 120,
            sorter: true,
            headerFilters: SECRETS_SOURCE_OPTIONS,
            render: (_: unknown, record: AutoHealing.SecretsSource) => {
                const config = getSourceTypeConfig(record.type);
                return <Tag icon={config.icon} color={config.color} style={{ margin: 0 }}>{config.label}</Tag>;
            },
        },
        {
            columnKey: 'auth_type',
            columnTitle: '认证方式',
            dataIndex: 'auth_type',
            width: 110,
            sorter: true,
            headerFilters: CREDENTIAL_TYPE_OPTIONS,
            render: (_: unknown, record: AutoHealing.SecretsSource) => {
                const config = getAuthTypeConfig(record.auth_type);
                return <Tag icon={config.icon} color={config.color} style={{ margin: 0 }}>{config.label}</Tag>;
            },
        },
        {
            columnKey: 'priority',
            columnTitle: '优先级',
            dataIndex: 'priority',
            width: 80,
            sorter: true,
            render: (_: unknown, record: AutoHealing.SecretsSource) => (
                <Text strong style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{record.priority}</Text>
            ),
        },
        {
            columnKey: 'status',
            columnTitle: '状态',
            dataIndex: 'status',
            width: 80,
            sorter: true,
            headerFilters: SECRETS_STATUS_OPTIONS,
            render: (_: unknown, record: AutoHealing.SecretsSource) => {
                const status = getSecretsSourceStatusMeta(record.status);
                return <Badge status={status.badge} text={status.label} />;
            },
        },
        {
            columnKey: 'created_at',
            columnTitle: '创建时间',
            dataIndex: 'created_at',
            width: 170,
            sorter: true,
            render: (_: unknown, record: AutoHealing.SecretsSource) => (
                record.created_at ? dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss') : '-'
            ),
        },
        {
            columnKey: 'actions',
            columnTitle: '操作',
            fixedColumn: true,
            width: 200,
            render: (_: unknown, record: AutoHealing.SecretsSource) => (
                <SecretSourceActionsCell canDeleteSource={canDeleteSource} canTestSource={canTestSource} canUpdateSource={canUpdateSource} onCancelDefault={onCancelDefault} onDelete={onDelete} onOpenDetail={onOpenDetail} onOpenEdit={onOpenEdit} onOpenTestQuery={onOpenTestQuery} onSetDefault={onSetDefault} onToggleStatus={onToggleStatus} record={record} testingId={testingId} />
            ),
        },
    ];
}

export const INITIAL_SECRETS_STATS: SecretsStatsSummary = {
    active: 0,
    file: 0,
    total: 0,
    vault: 0,
    webhook: 0,
};

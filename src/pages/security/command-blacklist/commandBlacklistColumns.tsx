import React from 'react';
import {
    DeleteOutlined,
    EditOutlined,
    LockOutlined,
} from '@ant-design/icons';
import { Badge, Button, Popconfirm, Space, Switch, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import type { StandardColumnDef } from '@/components/StandardTable';
import {
    getBlacklistCategoryOptions,
    getBlacklistSeverityOptions,
} from '@/constants/securityDicts';
import type { CommandBlacklistRule } from '@/services/auto-healing/commandBlacklist';
import {
    getCategoryConfig,
    getMatchTypeConfig,
    getSeverityConfig,
} from './commandBlacklistPageConfig';

const { Text } = Typography;

interface BuildColumnsOptions {
    canDelete: boolean;
    canManage: boolean;
    onDelete: (id: string) => void;
    onEdit: (rule: CommandBlacklistRule) => void;
    onOpenDetail: (rule: CommandBlacklistRule) => void;
    onToggle: (rule: CommandBlacklistRule) => void;
}

const renderName = (
    rule: CommandBlacklistRule,
    onOpenDetail: (rule: CommandBlacklistRule) => void,
) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
        <Tooltip title={rule.name}>
            <a
                style={{
                    fontWeight: 500,
                    color: '#1677ff',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
                onClick={(event) => {
                    event.stopPropagation();
                    onOpenDetail(rule);
                }}
            >
                {rule.name}
            </a>
        </Tooltip>
        {rule.is_system && (
            <span className="blacklist-system-badge" style={{ flexShrink: 0 }}>
                <LockOutlined style={{ fontSize: 10 }} /> 内置
            </span>
        )}
    </div>
);

const renderPattern = (rule: CommandBlacklistRule) => {
    const matchConfig = getMatchTypeConfig(rule.match_type);

    return (
        <div className="blacklist-pattern-cell">
            <Tooltip title={`${matchConfig.label}: ${rule.pattern}`}>
                <code className="blacklist-pattern-code">{rule.pattern}</code>
            </Tooltip>
            <Tag style={{ fontSize: 11, lineHeight: '18px', margin: 0 }}>
                {matchConfig.label}
            </Tag>
        </div>
    );
};

const renderSeverity = (rule: CommandBlacklistRule) => {
    const config = getSeverityConfig(rule.severity);

    return (
        <Tag
            icon={config.icon}
            color={config.tagColor}
            className={rule.severity === 'critical' ? 'blacklist-severity-critical' : ''}
            style={{ margin: 0 }}
        >
            {config.label}
        </Tag>
    );
};

const renderCategory = (rule: CommandBlacklistRule) => {
    const config = getCategoryConfig(rule.category);
    return config ? (
        <Text style={{ fontSize: 13 }}>{config.label}</Text>
    ) : (
        <Text type="secondary" style={{ fontSize: 12 }}>-</Text>
    );
};

const renderActions = (
    rule: CommandBlacklistRule,
    options: Pick<BuildColumnsOptions, 'canDelete' | 'canManage' | 'onDelete' | 'onEdit' | 'onToggle'>,
) => (
    <Space size="small" onClick={(event) => event.stopPropagation()}>
        <Tooltip title={rule.is_system ? '内置规则不可编辑' : '编辑'}>
            <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => options.onEdit(rule)}
                disabled={rule.is_system || !options.canManage}
            />
        </Tooltip>
        <Switch
            size="small"
            checked={rule.is_active}
            onChange={() => options.onToggle(rule)}
            disabled={!options.canManage}
        />
        <Tooltip title={rule.is_system ? '内置规则不可删除' : '删除'}>
            {rule.is_system ? (
                <Button type="link" size="small" danger icon={<DeleteOutlined />} disabled />
            ) : (
                <Popconfirm
                    title="确定删除？"
                    description="删除后不可恢复"
                    onConfirm={() => options.onDelete(rule.id)}
                >
                    <Button
                        type="link"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        disabled={!options.canDelete}
                    />
                </Popconfirm>
            )}
        </Tooltip>
    </Space>
);

export const buildCommandBlacklistColumns = (
    options: BuildColumnsOptions,
): StandardColumnDef<CommandBlacklistRule>[] => [
    {
        columnKey: 'name',
        columnTitle: '规则名称',
        fixedColumn: true,
        dataIndex: 'name',
        width: 180,
        sorter: true,
        render: (_, record) => renderName(record, options.onOpenDetail),
    },
    {
        columnKey: 'pattern',
        columnTitle: '匹配模式',
        dataIndex: 'pattern',
        width: 240,
        render: (_, record) => renderPattern(record),
    },
    {
        columnKey: 'severity',
        columnTitle: '级别',
        dataIndex: 'severity',
        width: 90,
        sorter: true,
        headerFilters: getBlacklistSeverityOptions().map(item => ({ value: item.value, label: item.label })),
        render: (_, record) => renderSeverity(record),
    },
    {
        columnKey: 'category',
        columnTitle: '分类',
        dataIndex: 'category',
        width: 110,
        sorter: true,
        headerFilters: getBlacklistCategoryOptions().map(item => ({ value: item.value, label: item.label })),
        render: (_, record) => renderCategory(record),
    },
    {
        columnKey: 'is_active',
        columnTitle: '状态',
        dataIndex: 'is_active',
        width: 80,
        headerFilters: [
            { value: 'true', label: '启用' },
            { value: 'false', label: '禁用' },
        ],
        render: (_, record) => (
            <Badge status={record.is_active ? 'success' : 'default'} text={record.is_active ? '启用' : '禁用'} />
        ),
    },
    {
        columnKey: 'description',
        columnTitle: '描述',
        dataIndex: 'description',
        width: 200,
        defaultVisible: false,
        render: (_, record) => (
            <Tooltip title={record.description}>
                <span className="blacklist-desc-cell">{record.description || '-'}</span>
            </Tooltip>
        ),
    },
    {
        columnKey: 'updated_at',
        columnTitle: '更新时间',
        dataIndex: 'updated_at',
        width: 160,
        sorter: true,
        render: (_, record) =>
            record.updated_at ? dayjs(record.updated_at).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
        columnKey: 'actions',
        columnTitle: '操作',
        fixedColumn: true,
        width: 160,
        render: (_, record) => renderActions(record, options),
    },
];

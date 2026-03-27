import React from 'react';
import {
    ApiOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
    HistoryOutlined,
    PauseCircleOutlined,
    PlayCircleOutlined,
    SettingOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { Badge, Button, Popconfirm, Space, Spin, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import type { StandardColumnDef } from '@/components/StandardTable';
import { PLUGIN_STATUS_LABELS, PLUGIN_STATUS_MAP } from '@/constants/pluginDicts';
import type { PluginRecord } from '@/services/auto-healing/plugins';
import { getPluginTypeConfig } from './pluginShared';

const { Text } = Typography;

type PluginPageAccess = {
    canDeletePlugin?: boolean;
    canSyncPlugin?: boolean;
    canTestPlugin?: boolean;
    canUpdatePlugin?: boolean;
};

type BuildPluginColumnsOptions = {
    access: PluginPageAccess;
    activatingId?: string;
    onActivate: (id: string) => void;
    onDeactivate: (id: string) => void;
    onDelete: (id: string) => void;
    onEdit: (plugin: PluginRecord) => void;
    onOpenDetail: (plugin: PluginRecord, tab?: string) => void;
    onSync: (id: string) => void;
    onTest: (id: string) => void;
    syncingId?: string;
    testingId?: string;
};

export function buildPluginColumns({
    access,
    activatingId,
    onActivate,
    onDeactivate,
    onDelete,
    onEdit,
    onOpenDetail,
    onSync,
    onTest,
    syncingId,
    testingId,
}: BuildPluginColumnsOptions): StandardColumnDef<PluginRecord>[] {
    return [
        {
            columnKey: 'name',
            columnTitle: '名称',
            fixedColumn: true,
            dataIndex: 'name',
            width: 220,
            sorter: true,
            render: (_, record) => {
                const typeConfig = getPluginTypeConfig(record.type);
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{typeConfig.icon}</span>
                        <div>
                            <a
                                style={{ fontWeight: 500, color: '#1677ff', cursor: 'pointer' }}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onOpenDetail(record);
                                }}
                            >
                                {record.name}
                            </a>
                            <div style={{ fontSize: 11, color: '#8c8c8c' }}>{typeConfig.label.split(' - ')[0]}</div>
                        </div>
                    </div>
                );
            },
        },
        {
            columnKey: 'type',
            columnTitle: '类型',
            dataIndex: 'type',
            width: 100,
            sorter: true,
            headerFilters: [
                { label: 'ITSM', value: 'itsm' },
                { label: 'CMDB', value: 'cmdb' },
            ],
            render: (_, record) => {
                const typeConfig = getPluginTypeConfig(record.type);
                return <Tag color={typeConfig.color}>{typeConfig.label.split(' - ')[0]}</Tag>;
            },
        },
        {
            columnKey: 'status',
            columnTitle: '状态',
            dataIndex: 'status',
            width: 90,
            sorter: true,
            headerFilters: Object.entries(PLUGIN_STATUS_LABELS).map(([value, label]) => ({ label, value })),
            render: (_, record) => {
                const statusConfig = PLUGIN_STATUS_MAP[record.status] || { color: 'default', text: record.status };
                return <Badge status={statusConfig.color as 'default' | 'error' | 'processing' | 'success' | 'warning'} text={statusConfig.text} />;
            },
        },
        {
            columnKey: 'sync',
            columnTitle: '同步配置',
            width: 130,
            render: (_, record) => (
                record.sync_enabled
                    ? <Tag color="blue" icon={<SyncOutlined />}>每 {record.sync_interval_minutes} 分钟</Tag>
                    : <Tag>未开启</Tag>
            ),
        },
        {
            columnKey: 'last_sync_at',
            columnTitle: '上次同步',
            dataIndex: 'last_sync_at',
            width: 160,
            sorter: true,
            render: (_, record) => (
                record.last_sync_at
                    ? dayjs(record.last_sync_at).format('YYYY-MM-DD HH:mm')
                    : <Text type="secondary">暂无</Text>
            ),
        },
        {
            columnKey: 'description',
            columnTitle: '描述',
            dataIndex: 'description',
            width: 200,
            defaultVisible: false,
            render: (_, record) => (
                record.description
                    ? <Text ellipsis={{ tooltip: record.description }} style={{ maxWidth: 180 }}>{record.description}</Text>
                    : '-'
            ),
        },
        {
            columnKey: 'created_at',
            columnTitle: '创建时间',
            dataIndex: 'created_at',
            width: 160,
            sorter: true,
            render: (_, record) => dayjs(record.created_at).format('YYYY-MM-DD HH:mm'),
        },
        {
            columnKey: 'actions',
            columnTitle: '操作',
            fixedColumn: true,
            width: 220,
            render: (_, record) => {
                const isActive = record.status === 'active';
                return (
                    <Space size="small" onClick={(event) => event.stopPropagation()}>
                        <Tooltip title="测试连接">
                            <Button
                                type="link"
                                size="small"
                                icon={testingId === record.id ? <Spin size="small" /> : <ApiOutlined />}
                                onClick={() => onTest(record.id)}
                                disabled={!!testingId || !access.canTestPlugin}
                            />
                        </Tooltip>
                        {isActive ? (
                            <Tooltip title="停用">
                                <Button
                                    type="link"
                                    size="small"
                                    icon={activatingId === record.id ? <Spin size="small" /> : <PauseCircleOutlined />}
                                    onClick={() => onDeactivate(record.id)}
                                    disabled={!!activatingId || !access.canUpdatePlugin}
                                />
                            </Tooltip>
                        ) : (
                            <Tooltip title="激活">
                                <Button
                                    type="link"
                                    size="small"
                                    icon={activatingId === record.id ? <Spin size="small" /> : <PlayCircleOutlined />}
                                    onClick={() => onActivate(record.id)}
                                    disabled={!!activatingId || !access.canUpdatePlugin}
                                />
                            </Tooltip>
                        )}
                        <Tooltip title={isActive ? '手动同步' : '需先激活'}>
                            <Button
                                type="link"
                                size="small"
                                icon={syncingId === record.id ? <Spin size="small" /> : <SyncOutlined />}
                                onClick={() => onSync(record.id)}
                                disabled={!!syncingId || !isActive || !access.canSyncPlugin}
                            />
                        </Tooltip>
                        <Tooltip title="编辑">
                            <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => onEdit(record)} disabled={!access.canUpdatePlugin} />
                        </Tooltip>
                        <Tooltip title="同步历史">
                            <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => onOpenDetail(record, 'history')} />
                        </Tooltip>
                        <Popconfirm title="确定删除？" description="不可恢复" onConfirm={() => onDelete(record.id)}>
                            <Button type="link" size="small" danger icon={<DeleteOutlined />} disabled={!access.canDeletePlugin} />
                        </Popconfirm>
                    </Space>
                );
            },
        },
    ];
}

export function PluginStatsBar({ stats }: { stats: { active: number; cmdb: number; error: number; inactive: number; itsm: number; total: number } }) {
    const items = [
        { icon: <CheckCircleOutlined />, key: 'active', label: PLUGIN_STATUS_LABELS.active || '活跃', value: stats.active },
        { icon: <ExclamationCircleOutlined />, key: 'inactive', label: PLUGIN_STATUS_LABELS.inactive || '停用', value: stats.inactive },
        { icon: <CloseCircleOutlined />, key: 'error', label: PLUGIN_STATUS_LABELS.error || '异常', value: stats.error },
        { icon: <span style={{ fontSize: 18 }}>🎫</span>, key: 'itsm', label: 'ITSM', value: stats.itsm },
        { icon: <span style={{ fontSize: 18 }}>🗄️</span>, key: 'cmdb', label: 'CMDB', value: stats.cmdb },
    ];

    return (
        <div className="plugins-stats-bar">
            <div className="plugins-stat-item">
                <span className="plugins-stat-icon plugins-stat-icon-total">{<CheckCircleOutlined />}</span>
                <div className="plugins-stat-content">
                    <div className="plugins-stat-value">{stats.total}</div>
                    <div className="plugins-stat-label">总插件</div>
                </div>
            </div>
            {items.map((item) => (
                <React.Fragment key={item.key}>
                    <div className="plugins-stat-divider" />
                    <div className="plugins-stat-item">
                        <span className={`plugins-stat-icon plugins-stat-icon-${item.key}`}>{item.icon}</span>
                        <div className="plugins-stat-content">
                            <div className="plugins-stat-value">{item.value}</div>
                            <div className="plugins-stat-label">{item.label}</div>
                        </div>
                    </div>
                </React.Fragment>
            ))}
        </div>
    );
}

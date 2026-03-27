import React from 'react';
import {
    ApiOutlined,
    FilterOutlined,
    InfoCircleOutlined,
    LinkOutlined,
    SettingOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { Badge, Button, Drawer, Space, Table, Tabs, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { history } from '@umijs/max';
import { PLUGIN_STATUS_LABELS } from '@/constants/pluginDicts';
import type { PluginRecord } from '@/services/auto-healing/plugins';
import { getPluginAuthLabel, getPluginTypeConfig } from './pluginShared';

const { Text } = Typography;

type PluginPageAccess = {
    canSyncPlugin?: boolean;
    canTestPlugin?: boolean;
    canUpdatePlugin?: boolean;
};

type PluginDetailDrawerProps = {
    access: PluginPageAccess;
    activeTab: string;
    currentPlugin: PluginRecord | null;
    logsLoading: boolean;
    onActiveTabChange: (key: string) => void;
    onClose: () => void;
    onSync: (id: string) => void;
    onTest: (id: string) => void;
    open: boolean;
    syncLogs: AutoHealing.PluginSyncLog[];
};

function getPluginFieldMappingRows(plugin: PluginRecord) {
    const mapping = plugin.type === 'cmdb'
        ? plugin.field_mapping?.cmdb_mapping
        : plugin.field_mapping?.incident_mapping;
    if (!mapping || typeof mapping !== 'object') {
        return [];
    }

    return Object.entries(mapping).map(([standard, external]) => ({
        key: standard,
        external: String(external),
        standard,
    }));
}

export default function PluginDetailDrawer({
    access,
    activeTab,
    currentPlugin,
    logsLoading,
    onActiveTabChange,
    onClose,
    onSync,
    onTest,
    open,
    syncLogs,
}: PluginDetailDrawerProps) {
    if (!currentPlugin) {
        return (
            <Drawer open={open} title={null} size={640} onClose={onClose} styles={{ header: { display: 'none' }, body: { padding: 0 } }} />
        );
    }

    const typeConfig = getPluginTypeConfig(currentPlugin.type);
    const authLabel = getPluginAuthLabel(currentPlugin.config?.auth_type);
    const fieldMappingRows = getPluginFieldMappingRows(currentPlugin);

    return (
        <Drawer
            title={null}
            size={640}
            open={open}
            onClose={onClose}
            styles={{ header: { display: 'none' }, body: { padding: 0 } }}
            destroyOnHidden
        >
            <div className="plugins-detail-header">
                <div className="plugins-detail-header-top">
                    <div className="plugins-detail-header-icon" style={{ background: typeConfig.bgColor, color: typeConfig.color }}>{typeConfig.icon}</div>
                    <div className="plugins-detail-header-info">
                        <div className="plugins-detail-title">{currentPlugin.name}</div>
                        <div className="plugins-detail-sub">{typeConfig.label}</div>
                    </div>
                    <Badge
                        status={currentPlugin.status === 'active' ? 'success' : currentPlugin.status === 'error' ? 'error' : 'default'}
                        text={PLUGIN_STATUS_LABELS[currentPlugin.status] || currentPlugin.status}
                    />
                </div>
                <Space size="small">
                    <Button size="small" icon={<ApiOutlined />} onClick={() => onTest(currentPlugin.id)} disabled={!access.canTestPlugin}>测试</Button>
                    <Button size="small" icon={<SyncOutlined />} onClick={() => onSync(currentPlugin.id)} disabled={currentPlugin.status !== 'active' || !access.canSyncPlugin}>同步</Button>
                    <Button
                        size="small"
                        icon={<SettingOutlined />}
                        onClick={() => {
                            onClose();
                            history.push(`/resources/plugins/${currentPlugin.id}/edit`);
                        }}
                        disabled={!access.canUpdatePlugin}
                    >
                        编辑
                    </Button>
                </Space>
            </div>
            <Tabs
                activeKey={activeTab}
                onChange={onActiveTabChange}
                className="plugins-detail-tabs"
                items={[
                    {
                        key: 'detail',
                        label: '详情',
                        children: (
                            <div className="plugins-detail-body">
                                <div className="plugins-detail-card">
                                    <div className="plugins-detail-card-header">
                                        <InfoCircleOutlined className="plugins-detail-card-header-icon" />
                                        <span className="plugins-detail-card-header-title">基本信息</span>
                                    </div>
                                    <div className="plugins-detail-card-body">
                                        <div className="plugins-detail-grid">
                                            <div className="plugins-detail-field"><span className="plugins-detail-field-label">描述</span><div className="plugins-detail-field-value">{currentPlugin.description || '-'}</div></div>
                                            <div className="plugins-detail-field"><span className="plugins-detail-field-label">版本</span><div className="plugins-detail-field-value">{currentPlugin.version || '-'}</div></div>
                                            <div className="plugins-detail-field"><span className="plugins-detail-field-label">创建时间</span><div className="plugins-detail-field-value">{dayjs(currentPlugin.created_at).format('YYYY-MM-DD HH:mm')}</div></div>
                                            <div className="plugins-detail-field"><span className="plugins-detail-field-label">更新时间</span><div className="plugins-detail-field-value">{currentPlugin.updated_at ? dayjs(currentPlugin.updated_at).format('YYYY-MM-DD HH:mm') : '-'}</div></div>
                                            {currentPlugin.error_message && (
                                                <div className="plugins-detail-field" style={{ gridColumn: '1 / -1' }}>
                                                    <span className="plugins-detail-field-label">错误信息</span>
                                                    <div className="plugins-detail-field-value" style={{ color: '#ff4d4f' }}>{currentPlugin.error_message}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="plugins-detail-card">
                                    <div className="plugins-detail-card-header">
                                        <LinkOutlined className="plugins-detail-card-header-icon" />
                                        <span className="plugins-detail-card-header-title">连接配置</span>
                                    </div>
                                    <div className="plugins-detail-card-body">
                                        <div className="plugins-detail-grid">
                                            <div className="plugins-detail-field" style={{ gridColumn: '1 / -1' }}><span className="plugins-detail-field-label">API 地址</span><div className="plugins-detail-field-value"><Text code copyable style={{ wordBreak: 'break-all' }}>{currentPlugin.config?.url || '-'}</Text></div></div>
                                            <div className="plugins-detail-field"><span className="plugins-detail-field-label">认证方式</span><div className="plugins-detail-field-value"><Tag>{authLabel}</Tag></div></div>
                                            <div className="plugins-detail-field"><span className="plugins-detail-field-label">时间参数</span><div className="plugins-detail-field-value">{currentPlugin.config?.since_param || '-'}</div></div>
                                            {currentPlugin.config?.response_data_path && <div className="plugins-detail-field"><span className="plugins-detail-field-label">数据路径</span><div className="plugins-detail-field-value"><Text code>{currentPlugin.config.response_data_path}</Text></div></div>}
                                            {currentPlugin.config?.extra_params && Object.keys(currentPlugin.config.extra_params).length > 0 && (
                                                <div className="plugins-detail-field" style={{ gridColumn: '1 / -1' }}>
                                                    <span className="plugins-detail-field-label">额外参数</span>
                                                    <div className="plugins-detail-field-value">
                                                        {Object.entries(currentPlugin.config.extra_params).map(([key, value]) => (
                                                            <Tag key={key} style={{ margin: '0 4px 4px 0' }}>{key}={String(value)}</Tag>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="plugins-detail-card">
                                    <div className="plugins-detail-card-header">
                                        <SyncOutlined className="plugins-detail-card-header-icon" />
                                        <span className="plugins-detail-card-header-title">同步配置</span>
                                    </div>
                                    <div className="plugins-detail-card-body">
                                        <div className="plugins-detail-grid">
                                            <div className="plugins-detail-field"><span className="plugins-detail-field-label">定时同步</span><div className="plugins-detail-field-value">{currentPlugin.sync_enabled ? <Tag color="blue">每 {currentPlugin.sync_interval_minutes} 分钟</Tag> : <Tag>未开启</Tag>}</div></div>
                                            <div className="plugins-detail-field"><span className="plugins-detail-field-label">上次同步</span><div className="plugins-detail-field-value">{currentPlugin.last_sync_at ? dayjs(currentPlugin.last_sync_at).format('YYYY-MM-DD HH:mm') : '暂无'}</div></div>
                                            {currentPlugin.next_sync_at && currentPlugin.status === 'active' && <div className="plugins-detail-field"><span className="plugins-detail-field-label">下次同步</span><div className="plugins-detail-field-value" style={{ color: '#1890ff' }}>{dayjs(currentPlugin.next_sync_at).format('YYYY-MM-DD HH:mm')}</div></div>}
                                        </div>
                                    </div>
                                </div>
                                {currentPlugin.sync_filter?.rules?.length ? (
                                    <div className="plugins-detail-card">
                                        <div className="plugins-detail-card-header">
                                            <FilterOutlined className="plugins-detail-card-header-icon" />
                                            <span className="plugins-detail-card-header-title">过滤规则</span>
                                        </div>
                                        <div className="plugins-detail-card-body">
                                            {currentPlugin.sync_filter.rules.map((rule, index) => (
                                                <Tag key={`${rule.field}-${rule.operator}-${index}`} style={{ margin: '0 4px 4px 0' }}>
                                                    {rule.field} {rule.operator} {Array.isArray(rule.value) ? rule.value.join(',') : String(rule.value)}
                                                </Tag>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                                {fieldMappingRows.length ? (
                                    <div className="plugins-detail-card">
                                        <div className="plugins-detail-card-header">
                                            <SettingOutlined className="plugins-detail-card-header-icon" />
                                            <span className="plugins-detail-card-header-title">字段映射</span>
                                        </div>
                                        <div className="plugins-detail-card-body" style={{ padding: 0 }}>
                                            <Table
                                                size="small"
                                                pagination={false}
                                                dataSource={fieldMappingRows}
                                                columns={[
                                                    { title: '标准字段', dataIndex: 'standard', key: 'standard' },
                                                    { title: '外部字段', dataIndex: 'external', key: 'external' },
                                                ]}
                                            />
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ),
                    },
                    {
                        key: 'history',
                        label: '同步历史',
                        children: (
                            <div className="plugins-detail-body">
                                <Table
                                    size="small"
                                    loading={logsLoading}
                                    pagination={false}
                                    dataSource={syncLogs}
                                    rowKey="id"
                                    locale={{ emptyText: '暂无同步记录' }}
                                    expandable={{
                                        expandedRowRender: (record: AutoHealing.PluginSyncLog) => (
                                            <div style={{ padding: '4px 0', fontSize: 12, color: '#ff4d4f', wordBreak: 'break-all' }}>
                                                <Text type="danger" style={{ fontSize: 12 }}>{record.error_message}</Text>
                                            </div>
                                        ),
                                        rowExpandable: (record) => !!record.error_message,
                                        defaultExpandedRowKeys: syncLogs.filter((log) => log.status === 'failed' && log.error_message).slice(0, 3).map((log) => log.id),
                                        expandIcon: ({ expanded, onExpand, record }) => (
                                            record.error_message
                                                ? <span style={{ cursor: 'pointer', color: '#ff4d4f', fontSize: 12, display: 'inline-block', width: 16, textAlign: 'center' }} onClick={(event) => onExpand(record, event)}>{expanded ? '−' : '+'}</span>
                                                : <span style={{ display: 'inline-block', width: 16, textAlign: 'center', color: '#52c41a', fontSize: 14 }}>✓</span>
                                        ),
                                    }}
                                    columns={[
                                        {
                                            title: '状态',
                                            dataIndex: 'status',
                                            width: 80,
                                            render: (status: AutoHealing.PluginSyncLog['status']) => <Badge status={status === 'success' ? 'success' : status === 'failed' ? 'error' : 'processing'} text={status === 'success' ? '成功' : status === 'failed' ? '失败' : status} />,
                                        },
                                        {
                                            title: '类型',
                                            dataIndex: 'sync_type',
                                            width: 60,
                                            render: (syncType: AutoHealing.PluginSyncLog['sync_type']) => <Tag>{syncType === 'manual' ? '手动' : '定时'}</Tag>,
                                        },
                                        {
                                            title: '统计',
                                            key: 'stats',
                                            width: 180,
                                            render: (_, record) => (
                                                <Space size={4} wrap>
                                                    <span style={{ fontSize: 12 }}>获取 <Text strong>{record.records_fetched}</Text></span>
                                                    <span style={{ fontSize: 12 }}>处理 <Text strong>{record.records_processed}</Text></span>
                                                    {record.records_new > 0 && <span style={{ fontSize: 12, color: '#52c41a' }}>+{record.records_new}</span>}
                                                    {record.records_updated > 0 && <span style={{ fontSize: 12, color: '#1890ff' }}>~{record.records_updated}</span>}
                                                    {record.records_failed > 0 && <span style={{ fontSize: 12, color: '#ff4d4f' }}>✕{record.records_failed}</span>}
                                                </Space>
                                            ),
                                        },
                                        {
                                            title: '时间',
                                            dataIndex: 'started_at',
                                            width: 140,
                                            render: (startedAt: string) => <span style={{ fontSize: 12 }}>{dayjs(startedAt).format('MM-DD HH:mm:ss')}</span>,
                                        },
                                    ]}
                                />
                            </div>
                        ),
                    },
                ]}
            />
        </Drawer>
    );
}

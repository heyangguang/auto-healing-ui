import {
    ReloadOutlined, AlertOutlined, CheckCircleOutlined,
    ClockCircleOutlined, CloseCircleOutlined,
    EyeOutlined, UndoOutlined, FilterOutlined, SyncOutlined,
    ExclamationCircleOutlined, MinusCircleOutlined,
    LinkOutlined, CopyOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
    Drawer, Tag, Space, Card, Row, Col, Statistic, Button,
    Tooltip, message, Popconfirm, Tabs, Typography, Descriptions
} from 'antd';
import React, { useRef, useState, useEffect } from 'react';
import { Link } from '@umijs/max';
import {
    getIncidents, getIncident, resetIncidentScan, batchResetIncidentScan, getIncidentStats
} from '@/services/auto-healing/incidents';
import { getPlugins } from '@/services/auto-healing/plugins';

const { Text, Paragraph } = Typography;

// ==================== Severity 适配层 ====================
const severityMap: Record<string, { text: string; color: string }> = {
    critical: { text: '严重', color: '#ff4d4f' },
    high: { text: '高', color: '#fa8c16' },
    medium: { text: '中', color: '#faad14' },
    low: { text: '低', color: '#1890ff' },
    '1': { text: '严重', color: '#ff4d4f' },
    '2': { text: '高', color: '#fa8c16' },
    '3': { text: '中', color: '#faad14' },
    '4': { text: '低', color: '#1890ff' },
};

const getSeverityConfig = (severity: string) => {
    return severityMap[severity?.toLowerCase?.()] || severityMap[severity] || { text: severity || '未知', color: '#999' };
};

// ==================== Status 配置 ====================
const statusMap: Record<string, { text: string; color: string }> = {
    open: { text: '打开', color: 'processing' },
    in_progress: { text: '处理中', color: 'warning' },
    resolved: { text: '已解决', color: 'success' },
    closed: { text: '已关闭', color: 'default' },
    '': { text: '未知', color: 'default' },
};

const getStatusConfig = (status: string) => statusMap[status] || { text: status || '未知', color: 'default' };

// ==================== Healing Status 配置 ====================
const healingMap: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
    pending: { text: '待处理', color: 'default', icon: <ClockCircleOutlined /> },
    processing: { text: '自愈中', color: 'processing', icon: <SyncOutlined spin /> },
    healed: { text: '已自愈', color: 'success', icon: <CheckCircleOutlined /> },
    failed: { text: '自愈失败', color: 'error', icon: <CloseCircleOutlined /> },
    skipped: { text: '已跳过', color: 'warning', icon: <MinusCircleOutlined /> },
};

// ==================== 统计卡片配置 ====================
const statCardConfig: Record<string, { color: string }> = {
    total: { color: '#1890ff' },
    scanned: { color: '#722ed1' },
    unscanned: { color: '#faad14' },
    matched: { color: '#13c2c2' },
    pending: { color: '#faad14' },
    processing: { color: '#1890ff' },
    healed: { color: '#52c41a' },
    failed: { color: '#ff4d4f' },
};

interface StatsData {
    total: number;
    scanned: number;
    unscanned: number;
    matched: number;
    pending: number;
    processing: number;
    healed: number;
    failed: number;
    skipped: number;
}

const IncidentList: React.FC = () => {
    const actionRef = useRef<ActionType>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentRow, setCurrentRow] = useState<AutoHealing.Incident>();
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [stats, setStats] = useState<StatsData>({ total: 0, scanned: 0, unscanned: 0, matched: 0, pending: 0, processing: 0, healed: 0, failed: 0, skipped: 0 });
    const [loading, setLoading] = useState(false);

    // 加载统计数据
    const loadStats = async () => {
        try {
            const data = await getIncidentStats();
            setStats(data);
        } catch (error) {
            console.error('加载统计数据失败', error);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    // 获取详情
    const handleViewDetail = async (record: AutoHealing.Incident) => {
        try {
            const data = await getIncident(record.id);
            setCurrentRow(data);
            setDrawerOpen(true);
        } catch {
            setCurrentRow(record);
            setDrawerOpen(true);
        }
    };

    // 重置单个工单扫描状态
    const handleResetScan = async (id: string) => {
        try {
            await resetIncidentScan(id);
            message.success('扫描状态已重置');
            actionRef.current?.reload();
        } catch {
            // 错误由全局处理
        }
    };

    // 批量重置扫描状态
    const handleBatchReset = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning('请先选择工单');
            return;
        }
        setLoading(true);
        try {
            const res = await batchResetIncidentScan({ ids: selectedRowKeys as string[] });
            message.success(res.message || `成功重置 ${res.affected_count} 条工单`);
            setSelectedRowKeys([]);
            actionRef.current?.reload();
        } finally {
            setLoading(false);
        }
    };

    // 按自愈状态批量重置
    const handleBatchResetByStatus = async (healingStatus: AutoHealing.HealingStatus) => {
        setLoading(true);
        try {
            const res = await batchResetIncidentScan({ healing_status: healingStatus });
            message.success(res.message || `成功重置 ${res.affected_count} 条工单`);
            actionRef.current?.reload();
        } finally {
            setLoading(false);
        }
    };

    // 精简后的表格列 - 移除固定列，减少水平滚动
    const columns: ProColumns<AutoHealing.Incident>[] = [
        {
            title: '工单标题',
            dataIndex: 'title',
            width: 280,
            ellipsis: true,
            render: (_, record) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{record.title}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.external_id}</Text>
                </div>
            ),
        },
        {
            title: '来源',
            dataIndex: 'source_plugin_name',
            width: 120,
            ellipsis: true,
            valueType: 'select',
            dependencies: ['has_plugin'],
            fieldProps: (form) => {
                const hasPlugin = form?.getFieldValue?.('has_plugin');
                // 如果选择"已删除"，改为文本输入模式
                if (hasPlugin === 'false' || hasPlugin === false) {
                    return { showSearch: false, allowClear: true, placeholder: '输入来源名称模糊搜索' };
                }
                return { showSearch: true, allowClear: true };
            },
            request: async (params) => {
                // 如果是已删除模式，返回空让用户手动输入
                if (params?.has_plugin === 'false' || params?.has_plugin === false) {
                    return [];
                }
                try {
                    const res = await getPlugins({ type: 'itsm', page_size: 100 });
                    const plugins = res.data || [];
                    return plugins.map(p => ({ label: p.name, value: p.name }));
                } catch {
                    return [];
                }
            },
            // 当选择已删除时，变成文本输入
            renderFormItem: (_, { type, defaultRender, ...rest }, form) => {
                const hasPlugin = form?.getFieldValue?.('has_plugin');
                if (hasPlugin === 'false' || hasPlugin === false) {
                    return <input placeholder="输入来源名称模糊搜索" style={{ width: '100%', padding: '4px 11px', border: '1px solid #d9d9d9', borderRadius: 6 }} />;
                }
                return defaultRender(_);
            },
        },
        {
            title: '关联插件',
            dataIndex: 'has_plugin',
            valueType: 'select',
            valueEnum: { true: { text: '有关联' }, false: { text: '已删除' } },
            hideInTable: true,
            fieldProps: { allowClear: true },
        },
        {
            title: '级别',
            dataIndex: 'severity',
            width: 70,
            valueType: 'select',
            valueEnum: { critical: { text: '严重' }, high: { text: '高' }, medium: { text: '中' }, low: { text: '低' } },
            render: (_, record) => {
                const config = getSeverityConfig(record.severity);
                return <Tag color={config.color}>{config.text}</Tag>;
            },
        },
        {
            title: '自愈状态',
            dataIndex: 'healing_status',
            width: 100,
            valueType: 'select',
            valueEnum: {
                pending: { text: '待处理' },
                processing: { text: '自愈中' },
                healed: { text: '已自愈' },
                failed: { text: '失败' },
                skipped: { text: '跳过' },
            },
            render: (_, record) => {
                const config = healingMap[record.healing_status] || healingMap.pending;
                return <Tag icon={config.icon} color={config.color}>{config.text}</Tag>;
            },
        },
        {
            title: '扫描',
            dataIndex: 'scanned',
            width: 70,
            valueType: 'select',
            valueEnum: { true: { text: '已扫描' }, false: { text: '待扫描' } },
            render: (_, record) => (
                <Tag color={record.scanned ? 'success' : 'default'}>
                    {record.scanned ? '已扫描' : '待扫描'}
                </Tag>
            ),
        },
        {
            title: '创建时间',
            dataIndex: 'created_at',
            valueType: 'dateTime',
            width: 160,
            hideInSearch: true,
            sorter: true,
        },
        {
            title: '操作',
            valueType: 'option',
            width: 80,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="详情">
                        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
                    </Tooltip>
                    <Popconfirm title="重置扫描状态？" onConfirm={() => handleResetScan(record.id)}>
                        <Tooltip title="重置扫描">
                            <Button type="link" size="small" icon={<UndoOutlined />} />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // 渲染统计卡片
    const renderStatsCards = () => (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            {[
                { key: 'total', title: '总工单', value: stats.total, icon: <AlertOutlined /> },
                { key: 'scanned', title: '已扫描', value: stats.scanned, icon: <CheckCircleOutlined /> },
                { key: 'unscanned', title: '待扫描', value: stats.unscanned, icon: <ClockCircleOutlined /> },
                { key: 'matched', title: '已匹配规则', value: stats.matched, icon: <FilterOutlined /> },
                { key: 'pending', title: '待处理', value: stats.pending, icon: <ClockCircleOutlined /> },
                { key: 'processing', title: '自愈中', value: stats.processing, icon: <SyncOutlined /> },
                { key: 'healed', title: '已自愈', value: stats.healed, icon: <CheckCircleOutlined /> },
                { key: 'failed', title: '自愈失败', value: stats.failed, icon: <CloseCircleOutlined /> },
            ].map(item => (
                <Col span={6} key={item.key}>
                    <Card size="small">
                        <Statistic
                            title={item.title}
                            value={item.value}
                            valueStyle={{ color: statCardConfig[item.key]?.color }}
                            prefix={item.icon}
                        />
                    </Card>
                </Col>
            ))}
        </Row>
    );

    // 渲染详情抽屉 - 使用卡片式布局
    const renderDetailDrawer = () => {
        if (!currentRow) return null;
        const severityConfig = getSeverityConfig(currentRow.severity);
        const healingConfig = healingMap[currentRow.healing_status] || healingMap.pending;

        return (
            <Drawer
                title={<span><AlertOutlined style={{ marginRight: 8, color: severityConfig.color }} />工单详情</span>}
                width={600}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                extra={
                    <Popconfirm title="确定重置扫描状态？" onConfirm={() => { handleResetScan(currentRow.id); setDrawerOpen(false); }}>
                        <Button icon={<UndoOutlined />}>重置扫描</Button>
                    </Popconfirm>
                }
            >
                {/* 头部状态条 */}
                <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
                    <Row gutter={16}>
                        <Col span={6}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#999', fontSize: 12 }}>级别</div>
                                <Tag color={severityConfig.color} style={{ marginTop: 4 }}>{severityConfig.text}</Tag>
                            </div>
                        </Col>
                        <Col span={6}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#999', fontSize: 12 }}>工单状态</div>
                                <Tag color={getStatusConfig(currentRow.status).color} style={{ marginTop: 4 }}>
                                    {getStatusConfig(currentRow.status).text}
                                </Tag>
                            </div>
                        </Col>
                        <Col span={6}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#999', fontSize: 12 }}>自愈状态</div>
                                <Tag icon={healingConfig.icon} color={healingConfig.color} style={{ marginTop: 4 }}>
                                    {healingConfig.text}
                                </Tag>
                            </div>
                        </Col>
                        <Col span={6}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#999', fontSize: 12 }}>扫描状态</div>
                                <Tag color={currentRow.scanned ? 'success' : 'default'} style={{ marginTop: 4 }}>
                                    {currentRow.scanned ? '已扫描' : '待扫描'}
                                </Tag>
                            </div>
                        </Col>
                    </Row>
                </Card>

                <Tabs
                    items={[
                        {
                            key: 'basic',
                            label: '基本信息',
                            children: (
                                <>
                                    <Descriptions column={2} size="small" bordered labelStyle={{ whiteSpace: 'nowrap', width: 80 }}>
                                        <Descriptions.Item label="工单标题" span={2}>
                                            <Text strong>{currentRow.title}</Text>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="外部ID" span={2}>
                                            <Text copyable>{currentRow.external_id}</Text>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="优先级">{currentRow.priority || '-'}</Descriptions.Item>
                                        <Descriptions.Item label="分类">{currentRow.category || '-'}</Descriptions.Item>
                                        <Descriptions.Item label="来源插件">{currentRow.source_plugin_name}</Descriptions.Item>
                                        <Descriptions.Item label="处理人">{currentRow.assignee || '-'}</Descriptions.Item>
                                        <Descriptions.Item label="报告人">{currentRow.reporter || '-'}</Descriptions.Item>
                                        <Descriptions.Item label="创建时间">{new Date(currentRow.created_at).toLocaleString()}</Descriptions.Item>
                                        <Descriptions.Item label="更新时间" span={2}>{new Date(currentRow.updated_at).toLocaleString()}</Descriptions.Item>
                                        <Descriptions.Item label="受影响CI" span={2}>
                                            <div style={{ wordBreak: 'break-all' }}>{currentRow.affected_ci || '-'}</div>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="受影响服务" span={2}>
                                            <div style={{ wordBreak: 'break-all' }}>{currentRow.affected_service || '-'}</div>
                                        </Descriptions.Item>
                                    </Descriptions>
                                    {/* 描述单独展示区 */}
                                    <div style={{ marginTop: 16 }}>
                                        <Text strong style={{ display: 'block', marginBottom: 8 }}>描述</Text>
                                        <div style={{
                                            background: '#fafafa',
                                            border: '1px solid #f0f0f0',
                                            borderRadius: 8,
                                            padding: 16,
                                            maxHeight: 200,
                                            overflow: 'auto',
                                            whiteSpace: 'pre-wrap',
                                            fontSize: 13,
                                            lineHeight: 1.6,
                                        }}>
                                            {currentRow.description || '-'}
                                        </div>
                                    </div>
                                </>
                            ),
                        },
                        {
                            key: 'healing',
                            label: '自愈信息',
                            children: (
                                <Descriptions column={1} size="small" bordered labelStyle={{ whiteSpace: 'nowrap', width: 80 }}>
                                    <Descriptions.Item label="匹配规则">
                                        {currentRow.matched_rule_id ? (
                                            <Space>
                                                <Link to="/healing/rules"><LinkOutlined /> 查看规则</Link>
                                                <Text copyable={{ text: currentRow.matched_rule_id }} type="secondary" style={{ fontSize: 12 }}>
                                                    {currentRow.matched_rule_id.slice(0, 8)}...
                                                </Text>
                                            </Space>
                                        ) : <Text type="secondary">未匹配</Text>}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="流程实例">
                                        {currentRow.healing_flow_instance_id ? (
                                            <Space>
                                                <Link to={`/healing/instances/${currentRow.healing_flow_instance_id}`}>
                                                    <LinkOutlined /> 查看实例
                                                </Link>
                                                <Text copyable={{ text: currentRow.healing_flow_instance_id }} type="secondary" style={{ fontSize: 12 }}>
                                                    {currentRow.healing_flow_instance_id.slice(0, 8)}...
                                                </Text>
                                            </Space>
                                        ) : <Text type="secondary">无</Text>}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="工单 ID">
                                        <Text copyable style={{ fontSize: 12 }}>{currentRow.id}</Text>
                                    </Descriptions.Item>
                                </Descriptions>
                            ),
                        },
                        {
                            key: 'raw',
                            label: '原始数据',
                            children: (
                                <pre style={{
                                    background: '#1e1e1e',
                                    color: '#d4d4d4',
                                    padding: 16,
                                    borderRadius: 8,
                                    overflow: 'auto',
                                    maxHeight: 400,
                                    fontSize: 12,
                                    lineHeight: 1.5,
                                }}>
                                    {JSON.stringify(currentRow.raw_data, null, 2)}
                                </pre>
                            ),
                        },
                    ]}
                />
            </Drawer>
        );
    };

    return (
        <PageContainer
            ghost
            header={{ title: <><AlertOutlined /> 工单管理 / INCIDENTS</>, subTitle: '从 ITSM 插件同步的工单列表' }}
        >
            {renderStatsCards()}

            <ProTable<AutoHealing.Incident>
                headerTitle="工单列表"
                actionRef={actionRef}
                rowKey="id"
                search={{ labelWidth: 80, span: 6, defaultCollapsed: false }}
                rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
                tableAlertOptionRender={() => (
                    <Popconfirm title="确定批量重置选中工单的扫描状态？" onConfirm={handleBatchReset}>
                        <Button size="small" loading={loading}>重置扫描状态</Button>
                    </Popconfirm>
                )}
                toolBarRender={() => [
                    <Button key="refresh" icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()}>刷新</Button>,
                ]}
                options={{ reload: false }}
                request={async (params) => {
                    const res = await getIncidents({
                        page: params.current,
                        page_size: params.pageSize,
                        plugin_id: params.plugin_id,
                        status: params.status,
                        severity: params.severity,
                        healing_status: params.healing_status,
                        source_plugin_name: params.source_plugin_name,
                        has_plugin: params.has_plugin,
                    });

                    const data = res.data || [];
                    const total = res.total || res.pagination?.total || 0;

                    // 刷新统计数据
                    loadStats();

                    return { data, success: true, total };
                }}
                columns={columns}
                pagination={{
                    defaultPageSize: 16,
                    showSizeChanger: true,
                    pageSizeOptions: ['16', '32', '64'],
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 条`,
                    size: 'default',
                }}
            />

            {renderDetailDrawer()}
        </PageContainer>
    );
};

export default IncidentList;

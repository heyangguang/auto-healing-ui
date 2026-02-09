import {
    CheckCircleOutlined, CloseCircleOutlined, ToolOutlined,
    EyeOutlined, ApiOutlined, ReloadOutlined, CloudServerOutlined,
    DesktopOutlined, AppstoreOutlined, GlobalOutlined, HddOutlined,
    AppleOutlined, WindowsOutlined, LinuxOutlined, CloudOutlined,
    StopOutlined, PlayCircleOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
    Drawer, Space, Card, Row, Col, Statistic, Button, Alert,
    Tooltip, message, Tabs, Typography, Descriptions, Modal, Select, Progress, Badge, Input, DatePicker,
} from 'antd';
import React, { useRef, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import {
    getCMDBItems, getCMDBStats, getCMDBItem, testCMDBConnection, batchTestCMDBConnection,
    enterMaintenance, resumeFromMaintenance, batchEnterMaintenance, batchResumeFromMaintenance,
    getCMDBMaintenanceLogs,
} from '@/services/auto-healing/cmdb';
import { getSecretsSources } from '@/services/auto-healing/secrets';

const { Text, Paragraph } = Typography;

// ==================== 类型配置 ====================
const getTypeInfo = (type: string) => {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('server')) return { text: '服务器', icon: <DesktopOutlined />, color: '#1890ff' };
    if (lowerType.includes('app')) return { text: '应用', icon: <AppstoreOutlined />, color: '#13c2c2' };
    if (lowerType.includes('network')) return { text: '网络', icon: <GlobalOutlined />, color: '#722ed1' };
    if (lowerType.includes('db') || lowerType.includes('database')) return { text: '数据库', icon: <HddOutlined />, color: '#fa8c16' };
    return { text: type, icon: <CloudOutlined />, color: '#8c8c8c' };
};

const getStatusInfo = (status: string) => {
    const map: Record<string, { text: string; color: string; badge: 'success' | 'error' | 'warning' | 'default' }> = {
        active: { text: '活跃', color: '#52c41a', badge: 'success' },
        offline: { text: '离线', color: '#ff4d4f', badge: 'error' },
        maintenance: { text: '维护', color: '#faad14', badge: 'warning' },
    };
    return map[status] || { text: status, color: '#8c8c8c', badge: 'default' as const };
};

const getEnvInfo = (env: string) => {
    const lowerEnv = env?.toLowerCase() || '';
    if (lowerEnv.includes('prod')) return { text: '生产', color: '#ff4d4f' };
    if (lowerEnv.includes('stag')) return { text: '预发', color: '#fa8c16' };
    if (lowerEnv.includes('dev')) return { text: '开发', color: '#1890ff' };
    if (lowerEnv.includes('test')) return { text: '测试', color: '#52c41a' };
    return { text: env, color: '#8c8c8c' };
};

const getOSIcon = (os: string) => {
    const lowerOS = os?.toLowerCase() || '';
    if (lowerOS.includes('linux') || lowerOS.includes('ubuntu') || lowerOS.includes('centos') || lowerOS.includes('rhel'))
        return <LinuxOutlined style={{ color: '#E95420' }} />;
    if (lowerOS.includes('windows')) return <WindowsOutlined style={{ color: '#1890ff' }} />;
    if (lowerOS.includes('mac') || lowerOS.includes('darwin')) return <AppleOutlined style={{ color: '#8c8c8c' }} />;
    return <CloudOutlined style={{ color: '#8c8c8c' }} />;
};

interface StatsData {
    total: number;
    active: number;
    offline: number;
    maintenance: number;
    byType: Record<string, number>;
    byEnv: Record<string, number>;
}

const CMDBList: React.FC = () => {
    const actionRef = useRef<ActionType>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentRow, setCurrentRow] = useState<AutoHealing.CMDBItem>();
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [stats, setStats] = useState<StatsData>({ total: 0, active: 0, offline: 0, maintenance: 0, byType: {}, byEnv: {} });

    const [secretsSources, setSecretsSources] = useState<AutoHealing.SecretsSource[]>([]);
    const [selectedSecretsSource, setSelectedSecretsSource] = useState<string>();
    const [testResults, setTestResults] = useState<AutoHealing.CMDBBatchConnectionTestResult | null>(null);
    const [testing, setTesting] = useState(false);
    const [selectSourceModalOpen, setSelectSourceModalOpen] = useState(false);
    const [testResultModalOpen, setTestResultModalOpen] = useState(false);
    const [singleTestTarget, setSingleTestTarget] = useState<AutoHealing.CMDBItem | null>(null);

    // 维护模式相关状态
    const [disableModalOpen, setDisableModalOpen] = useState(false);
    const [disableTarget, setDisableTarget] = useState<AutoHealing.CMDBItem | null>(null);
    const [disableReason, setDisableReason] = useState('');
    const [maintenanceEndAt, setMaintenanceEndAt] = useState<string>('');
    const [disabling, setDisabling] = useState(false);

    // 批量维护状态
    const [batchDisableModalOpen, setBatchDisableModalOpen] = useState(false);
    const [batchDisableReason, setBatchDisableReason] = useState('');
    const [batchMaintenanceEndAt, setBatchMaintenanceEndAt] = useState<string>('');

    // 维护日志状态
    const [maintenanceLogs, setMaintenanceLogs] = useState<AutoHealing.CMDBMaintenanceLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [activeTabKey, setActiveTabKey] = useState('basic');

    const loadStats = async () => {
        try {
            const data = await getCMDBStats();
            const byStatus = data.by_status?.reduce((acc, item) => {
                acc[item.status] = item.count;
                return acc;
            }, {} as Record<string, number>) || {};

            const byType: Record<string, number> = {};
            data.by_type?.forEach(item => {
                let key = item.type.toLowerCase();
                if (key.includes('server')) key = 'server';
                else if (key.includes('database') || key.includes('db')) key = 'database';
                else if (key.includes('app')) key = 'application';
                else if (key.includes('network')) key = 'network';
                byType[key] = (byType[key] || 0) + item.count;
            });

            const byEnv: Record<string, number> = {};
            data.by_environment?.forEach(item => {
                let key = item.environment.toLowerCase();
                if (key.includes('prod')) key = 'production';
                else if (key.includes('stag')) key = 'staging';
                else if (key.includes('dev')) key = 'development';
                else if (key.includes('test')) key = 'test';
                byEnv[key] = (byEnv[key] || 0) + item.count;
            });

            setStats({
                total: data.total || 0,
                active: byStatus.active || 0,
                offline: byStatus.offline || 0,
                maintenance: byStatus.maintenance || 0,
                byType,
                byEnv,
            });
        } catch (e) { console.error(e); }
    };

    const loadSecretsSources = async () => {
        try {
            const res = await getSecretsSources();
            setSecretsSources(res.data || []);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { loadStats(); loadSecretsSources(); }, []);

    const handleViewDetail = async (record: AutoHealing.CMDBItem) => {
        // 立即打开抽屉，使用列表中的数据（不卡顿）
        setActiveTabKey('basic');
        setMaintenanceLogs([]);
        setCurrentRow(record);
        setDrawerOpen(true);
        // 异步获取最新详情
        try {
            const data = await getCMDBItem(record.id);
            setCurrentRow(data);
        } catch { /* 静默失败，已有列表数据 */ }
    };

    const loadMaintenanceLogs = async (id: string) => {
        setLogsLoading(true);
        try {
            const res = await getCMDBMaintenanceLogs(id, { page: 1, page_size: 20 });
            // API 返回格式: { code, message, data: { data: [...], page, page_size, total } }
            const logs = (res as any)?.data?.data || res.data || [];
            setMaintenanceLogs(Array.isArray(logs) ? logs : []);
        } catch (e) {
            console.error(e);
            setMaintenanceLogs([]);
        } finally {
            setLogsLoading(false);
        }
    };

    const handleOpenSingleTest = (record: AutoHealing.CMDBItem) => {
        setSingleTestTarget(record);
        setSelectSourceModalOpen(true);
    };

    const handleOpenBatchTest = () => {
        if (selectedRowKeys.length === 0) { message.warning('请选择配置项'); return; }
        setSingleTestTarget(null);
        setSelectSourceModalOpen(true);
    };

    const handleRunTest = async () => {
        if (!selectedSecretsSource) { message.warning('请选择密钥源'); return; }
        setTesting(true);
        setSelectSourceModalOpen(false);

        if (singleTestTarget) {
            // 单个测试：直接运行
            try {
                const result = await testCMDBConnection(singleTestTarget.id, selectedSecretsSource);
                if (result.success) message.success(`${result.host} 连接成功 (${result.latency_ms}ms)`);
                else message.error(`${result.host} 失败: ${result.message}`);
            } catch { /* 错误消息由全局错误处理器显示 */ }
            finally { setTesting(false); }
        } else {
            // 批量测试：先打开弹窗显示 loading，再调用 API
            setTestResults(null);
            setTestResultModalOpen(true);
            try {
                const result = await batchTestCMDBConnection(selectedRowKeys as string[], selectedSecretsSource);
                setTestResults(result);
            } catch { setTestResultModalOpen(false); }
            finally { setTesting(false); }
        }
    };

    // 单个维护模式
    const handleOpenDisable = (record: AutoHealing.CMDBItem) => {
        setDisableTarget(record);
        setDisableReason('');
        setMaintenanceEndAt('');
        setDisableModalOpen(true);
    };

    const handleDisable = async () => {
        if (!disableTarget || !disableReason.trim()) { message.warning('请输入原因'); return; }
        setDisabling(true);
        try {
            await enterMaintenance(disableTarget.id, disableReason, maintenanceEndAt || undefined);
            message.success('已进入维护模式');
            setDisableModalOpen(false);
            setDisableReason('');
            setMaintenanceEndAt('');
            actionRef.current?.reload();
            if (currentRow?.id === disableTarget.id) {
                const data = await getCMDBItem(disableTarget.id);
                setCurrentRow(data);
            }
        } catch { /* 错误消息由全局错误处理器显示 */ }
        finally { setDisabling(false); }
    };

    const handleEnable = async (record: AutoHealing.CMDBItem) => {
        try {
            await resumeFromMaintenance(record.id);
            message.success('已解除维护模式');
            actionRef.current?.reload();
            if (currentRow?.id === record.id) {
                const data = await getCMDBItem(record.id);
                setCurrentRow(data);
            }
        } catch { /* 错误消息由全局错误处理器显示 */ }
    };

    // 批量维护模式
    const handleOpenBatchDisable = () => {
        if (selectedRowKeys.length === 0) { message.warning('请选择配置项'); return; }
        setBatchDisableReason('');
        setBatchMaintenanceEndAt('');
        setBatchDisableModalOpen(true);
    };

    const handleBatchDisable = async () => {
        if (!batchDisableReason.trim()) { message.warning('请输入原因'); return; }
        setDisabling(true);
        try {
            const result = await batchEnterMaintenance(selectedRowKeys as string[], batchDisableReason, batchMaintenanceEndAt || undefined);
            message.success(`已完成：成功 ${result.success}，失败 ${result.failed}`);
            setBatchDisableModalOpen(false);
            setBatchDisableReason('');
            setBatchMaintenanceEndAt('');
            setSelectedRowKeys([]);
            actionRef.current?.reload();
        } catch { /* 错误消息由全局错误处理器显示 */ }
        finally { setDisabling(false); }
    };

    const handleBatchEnable = async () => {
        if (selectedRowKeys.length === 0) { message.warning('请选择配置项'); return; }
        try {
            const result = await batchResumeFromMaintenance(selectedRowKeys as string[]);
            message.success(`已完成：成功 ${result.success}，失败 ${result.failed}`);
            setSelectedRowKeys([]);
            actionRef.current?.reload();
        } catch { /* 错误消息由全局错误处理器显示 */ }
    };

    // 表格列
    const columns: ProColumns<AutoHealing.CMDBItem>[] = [
        {
            title: '主机',
            dataIndex: 'name',
            width: 280,
            render: (_, r) => {
                const typeInfo = getTypeInfo(r.type);
                const statusInfo = getStatusInfo(r.status);
                const isInMaintenance = r.status === 'maintenance';
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 8,
                            background: isInMaintenance ? '#f5f5f5' : `${typeInfo.color}15`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: isInMaintenance ? '#bfbfbf' : typeInfo.color, fontSize: 18,
                        }}>
                            {isInMaintenance ? <StopOutlined /> : typeInfo.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Text strong style={{ fontSize: 14, color: isInMaintenance ? '#bfbfbf' : undefined }}>{r.name}</Text>
                                {isInMaintenance ? (
                                    <Tooltip title={`维护中: ${r.maintenance_reason || '-'}`}>
                                        <Badge status="default" text={<Text type="secondary" style={{ fontSize: 12 }}>维护中</Text>} />
                                    </Tooltip>
                                ) : (
                                    <Badge status={statusInfo.badge} />
                                )}
                            </div>
                            <Text type="secondary" style={{ fontSize: 12 }}>{r.ip_address}</Text>
                        </div>
                    </div>
                );
            },
        },
        {
            title: '环境',
            dataIndex: 'environment',
            width: 80,
            valueEnum: { production: { text: '生产' }, staging: { text: '预发' }, development: { text: '开发' }, test: { text: '测试' } },
            render: (_, r) => {
                const info = getEnvInfo(r.environment);
                return <Text strong style={{ color: info.color }}>{info.text}</Text>;
            },
        },
        {
            title: '类型',
            dataIndex: 'type',
            hideInTable: true,
            valueEnum: { server: { text: '服务器' }, application: { text: '应用' }, network: { text: '网络' }, database: { text: '数据库' } },
        },
        {
            title: '状态',
            dataIndex: 'status',
            hideInTable: true,
            valueEnum: { active: { text: '活跃' }, offline: { text: '离线' }, maintenance: { text: '维护' } },
        },
        {
            title: '来源插件',
            dataIndex: 'source_plugin_name',
            hideInTable: true,
            fieldProps: { placeholder: '输入插件名称' },
        },
        {
            title: '关联状态',
            dataIndex: 'has_plugin',
            valueType: 'select',
            hideInTable: true,
            valueEnum: { true: { text: '有关联插件' }, false: { text: '插件已删除' } },
            fieldProps: { allowClear: true },
        },
        {
            title: '操作系统',
            dataIndex: 'os',
            width: 140,
            hideInSearch: true,
            render: (_, r) => (
                <Space size={6}>
                    {getOSIcon(r.os)}
                    <Text>{r.os || '-'}</Text>
                </Space>
            ),
        },
        {
            title: '负责人',
            dataIndex: 'owner',
            width: 100,
            hideInSearch: true,
            ellipsis: true,
        },
        {
            title: '来源',
            dataIndex: 'source_plugin_name',
            width: 120,
            hideInSearch: true,
            ellipsis: true,
            render: (_, r) => <Text type="secondary">{r.source_plugin_name || '-'}</Text>,
        },
        {
            title: '操作',
            valueType: 'option',
            width: 120,
            fixed: 'right',
            render: (_, r) => (
                <Space size={0}>
                    <Tooltip title="详情"><Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(r)} /></Tooltip>
                    <Tooltip title="测试密钥"><Button type="link" size="small" icon={<ApiOutlined />} onClick={() => handleOpenSingleTest(r)} /></Tooltip>
                    {r.status === 'maintenance' && (
                        <Tooltip title="恢复正常"><Button type="link" size="small" icon={<PlayCircleOutlined style={{ color: '#52c41a' }} />} onClick={() => handleEnable(r)} /></Tooltip>
                    )}
                    {r.status === 'active' && (
                        <Tooltip title="进入维护"><Button type="link" size="small" icon={<ToolOutlined style={{ color: '#faad14' }} />} onClick={() => handleOpenDisable(r)} /></Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    const renderStats = () => (
        <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
                <Card size="small">
                    <Statistic title="总数" value={stats.total} prefix={<CloudServerOutlined style={{ color: '#1890ff', marginRight: 8 }} />} valueStyle={{ color: '#1890ff' }} />
                </Card>
            </Col>
            <Col span={6}>
                <Card size="small">
                    <Statistic title="活跃" value={stats.active} prefix={<CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />} valueStyle={{ color: '#52c41a' }} />
                </Card>
            </Col>
            <Col span={6}>
                <Card size="small">
                    <Statistic title="维护" value={stats.maintenance} prefix={<ToolOutlined style={{ color: '#faad14', marginRight: 8 }} />} valueStyle={{ color: '#faad14' }} />
                </Card>
            </Col>
            <Col span={6}>
                <Card size="small">
                    <Statistic title="离线" value={stats.offline} prefix={<CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />} valueStyle={{ color: '#ff4d4f' }} />
                </Card>
            </Col>
            <Col span={12} style={{ marginTop: 16 }}>
                <Card size="small" title="类型分布">
                    <Space wrap>
                        {Object.entries(stats.byType).map(([type, count]) => (
                            <Text key={type}>{getTypeInfo(type).text}: <Text strong style={{ color: getTypeInfo(type).color }}>{count}</Text></Text>
                        ))}
                    </Space>
                </Card>
            </Col>
            <Col span={12} style={{ marginTop: 16 }}>
                <Card size="small" title="环境分布">
                    <Space wrap>
                        {Object.entries(stats.byEnv).map(([env, count]) => (
                            <Text key={env}>{getEnvInfo(env).text}: <Text strong style={{ color: getEnvInfo(env).color }}>{count}</Text></Text>
                        ))}
                    </Space>
                </Card>
            </Col>
        </Row>
    );

    const renderDrawer = () => {
        if (!currentRow) return null;
        const typeInfo = getTypeInfo(currentRow.type);
        const statusInfo = getStatusInfo(currentRow.status);
        const envInfo = getEnvInfo(currentRow.environment);
        return (
            <Drawer title={currentRow.name} width={600} open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                {/* 维护状态提示 */}
                {currentRow.status === 'maintenance' && (
                    <Alert
                        type="warning"
                        showIcon
                        icon={<StopOutlined />}
                        message="此主机正在维护中"
                        description={
                            <div>
                                <div>原因：{currentRow.maintenance_reason || '-'}</div>
                                <div>开始时间：{currentRow.maintenance_start_at ? new Date(currentRow.maintenance_start_at).toLocaleString() : '-'}</div>
                                <div>计划结束：{currentRow.maintenance_end_at ? new Date(currentRow.maintenance_end_at).toLocaleString() : '永久维护'}</div>
                                <Button type="primary" size="small" icon={<PlayCircleOutlined />} style={{ marginTop: 8 }} onClick={() => handleEnable(currentRow)}>
                                    恢复正常
                                </Button>
                            </div>
                        }
                        style={{ marginBottom: 16 }}
                    />
                )}

                <Card size="small" style={{ marginBottom: 16 }}>
                    <Row gutter={[24, 16]}>
                        <Col span={12}>
                            <Text type="secondary" style={{ fontSize: 12 }}>IP 地址</Text>
                            <div><Text strong copyable style={{ fontSize: 15 }}>{currentRow.ip_address}</Text></div>
                        </Col>
                        <Col span={12}>
                            <Text type="secondary" style={{ fontSize: 12 }}>主机名</Text>
                            <div><Text strong style={{ fontSize: 15 }}>{currentRow.hostname || '-'}</Text></div>
                        </Col>
                        <Col span={8}>
                            <Text type="secondary" style={{ fontSize: 12 }}>类型</Text>
                            <div><Space size={4}>{typeInfo.icon}<Text strong style={{ color: typeInfo.color }}>{typeInfo.text}</Text></Space></div>
                        </Col>
                        <Col span={8}>
                            <Text type="secondary" style={{ fontSize: 12 }}>状态</Text>
                            <div><Badge status={statusInfo.badge} text={<Text strong style={{ color: statusInfo.color }}>{statusInfo.text}</Text>} /></div>
                        </Col>
                        <Col span={8}>
                            <Text type="secondary" style={{ fontSize: 12 }}>环境</Text>
                            <div><Text strong style={{ color: envInfo.color }}>{envInfo.text}</Text></div>
                        </Col>
                    </Row>
                </Card>
                <Tabs
                    activeKey={activeTabKey}
                    onChange={(key) => {
                        setActiveTabKey(key);
                        if (key === 'logs' && currentRow && maintenanceLogs.length === 0 && !logsLoading) {
                            loadMaintenanceLogs(currentRow.id);
                        }
                    }}
                    items={[
                        {
                            key: 'basic', label: '基本信息', children: (
                                <Descriptions column={2} size="small" bordered>
                                    <Descriptions.Item label="负责人">{currentRow.owner || '-'}</Descriptions.Item>
                                    <Descriptions.Item label="位置">{currentRow.location || '-'}</Descriptions.Item>
                                    <Descriptions.Item label="部门">{currentRow.department || '-'}</Descriptions.Item>
                                    <Descriptions.Item label="来源">{currentRow.source_plugin_name || '-'}</Descriptions.Item>
                                    <Descriptions.Item label="外部 ID" span={2}><Text copyable style={{ fontSize: 12 }}>{currentRow.external_id}</Text></Descriptions.Item>
                                    <Descriptions.Item label="创建时间">{new Date(currentRow.created_at).toLocaleString()}</Descriptions.Item>
                                    <Descriptions.Item label="更新时间">{new Date(currentRow.updated_at).toLocaleString()}</Descriptions.Item>
                                </Descriptions>
                            )
                        },
                        {
                            key: 'hw', label: '硬件', children: (
                                <Descriptions column={2} size="small" bordered>
                                    <Descriptions.Item label="操作系统" span={2}><Space>{getOSIcon(currentRow.os)}{currentRow.os} {currentRow.os_version}</Space></Descriptions.Item>
                                    <Descriptions.Item label="CPU" span={2}>{currentRow.cpu || '-'}</Descriptions.Item>
                                    <Descriptions.Item label="内存">{currentRow.memory || '-'}</Descriptions.Item>
                                    <Descriptions.Item label="磁盘">{currentRow.disk || '-'}</Descriptions.Item>
                                </Descriptions>
                            )
                        },
                        {
                            key: 'logs', label: '维护日志', children: logsLoading ? (
                                <div style={{ textAlign: 'center', padding: 40 }}>
                                    <Text type="secondary">加载中...</Text>
                                </div>
                            ) : maintenanceLogs.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 40 }}>
                                    <Text type="secondary">暂无维护日志</Text>
                                </div>
                            ) : (
                                <div style={{ flex: 1, overflow: 'auto' }}>
                                    {maintenanceLogs.map((log) => (
                                        <Card key={log.id} size="small" style={{ marginBottom: 8 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Space>
                                                    {log.action === 'enter' ? (
                                                        <Badge status="warning" text={<Text strong>进入维护</Text>} />
                                                    ) : (
                                                        <Badge status="success" text={<Text strong>恢复正常</Text>} />
                                                    )}
                                                    <Text type="secondary">操作人: {log.operator}</Text>
                                                </Space>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {new Date(log.created_at).toLocaleString()}
                                                </Text>
                                            </div>
                                            {log.reason && <div style={{ marginTop: 8 }}><Text type="secondary">原因: </Text>{log.reason}</div>}
                                            {log.scheduled_end_at && (
                                                <div><Text type="secondary">计划结束: </Text>{new Date(log.scheduled_end_at).toLocaleString()}</div>
                                            )}
                                            {log.actual_end_at && (
                                                <div><Text type="secondary">实际结束: </Text>{new Date(log.actual_end_at).toLocaleString()} ({log.exit_type === 'auto' ? '自动' : '手动'})</div>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            )
                        },
                        {
                            key: 'raw', label: '原始数据', children: currentRow.raw_data ? (
                                <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: 12, margin: 0 }}>
                                    {JSON.stringify(currentRow.raw_data, null, 2)}
                                </pre>
                            ) : <Text type="secondary">无原始数据</Text>
                        },
                    ]} />
            </Drawer>
        );
    };

    return (
        <PageContainer
            header={{ title: <><CloudServerOutlined /> 资产管理 / CMDB</> }}
            content={
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    <InfoCircleOutlined style={{ marginRight: 8 }} />
                    资产管理展示从 CMDB 同步的主机信息。处于<Text strong>维护模式</Text>的主机在自愈流程中会被跳过，适用于临时停机维护等场景。
                </Paragraph>
            }
        >
            {renderStats()}
            <ProTable<AutoHealing.CMDBItem>
                headerTitle="配置项列表"
                actionRef={actionRef}
                rowKey="id"
                scroll={{ x: 900 }}
                search={{ labelWidth: 80 }}
                rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
                tableAlertOptionRender={() => (
                    <Space>
                        <Button type="primary" size="small" icon={<ApiOutlined />} onClick={handleOpenBatchTest} loading={testing}>
                            批量测密钥 ({selectedRowKeys.length})
                        </Button>
                        <Button size="small" icon={<ToolOutlined />} onClick={handleOpenBatchDisable}>
                            批量维护
                        </Button>
                        <Button size="small" icon={<PlayCircleOutlined />} onClick={handleBatchEnable}>
                            批量解除
                        </Button>
                    </Space>
                )}
                toolBarRender={() => [
                    <Button key="refresh" icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()}>刷新</Button>,
                ]}
                options={{ reload: false }}
                request={async (params) => {
                    const res = await getCMDBItems({
                        page: params.current,
                        page_size: params.pageSize,
                        type: params.type,
                        status: params.status,
                        environment: params.environment,
                        source_plugin_name: params.source_plugin_name,
                        has_plugin: params.has_plugin,
                    });
                    loadStats();
                    return { data: res.data || [], success: true, total: res.pagination?.total || res.total || 0 };
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
            {renderDrawer()}

            {/* 密钥源选择弹窗 */}
            <Modal
                title={singleTestTarget ? `测试密钥 - ${singleTestTarget.name}` : `批量测密钥 (${selectedRowKeys.length})`}
                open={selectSourceModalOpen}
                onCancel={() => setSelectSourceModalOpen(false)}
                onOk={handleRunTest}
                okText="开始测试"
                okButtonProps={{ disabled: !selectedSecretsSource, loading: testing }}
            >
                <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>请选择 SSH 密钥源：</Text>
                <Select
                    placeholder="搜索或选择密钥源"
                    style={{ width: '100%' }}
                    value={selectedSecretsSource}
                    onChange={setSelectedSecretsSource}
                    showSearch
                    allowClear
                    optionFilterProp="label"
                    filterOption={(input, option) =>
                        (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={[
                        { label: 'SSH 密钥', options: secretsSources.filter(s => s.auth_type === 'ssh_key').map(s => ({ label: s.name, value: s.id })) },
                        { label: '密码认证', options: secretsSources.filter(s => s.auth_type === 'password').map(s => ({ label: s.name, value: s.id })) },
                    ].filter(g => g.options.length > 0)}
                />
            </Modal>

            {/* 测试结果弹窗 */}
            <Modal
                title="测试结果"
                open={testResultModalOpen}
                onCancel={() => { setTestResultModalOpen(false); setTestResults(null); }}
                footer={<Button onClick={() => { setTestResultModalOpen(false); setTestResults(null); }}>关闭</Button>}
                width={550}
            >
                {testing && !testResults && (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <ApiOutlined spin style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
                        <div><Text type="secondary">正在测试 {selectedRowKeys.length} 台主机的密钥连接...</Text></div>
                        <div><Text type="secondary" style={{ fontSize: 12 }}>请稍候，这可能需要一些时间</Text></div>
                    </div>
                )}
                {testResults && (
                    <>
                        <Row gutter={12} style={{ marginBottom: 12 }}>
                            <Col span={8}><Card size="small"><Statistic title="总数" value={testResults.total} /></Card></Col>
                            <Col span={8}><Card size="small"><Statistic title="成功" value={testResults.success} valueStyle={{ color: '#52c41a' }} /></Card></Col>
                            <Col span={8}><Card size="small"><Statistic title="失败" value={testResults.failed} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
                        </Row>
                        <Progress percent={Math.round((testResults.success / testResults.total) * 100)} status={testResults.failed > 0 ? 'exception' : 'success'} />
                        <div style={{ maxHeight: 250, overflow: 'auto', marginTop: 12 }}>
                            {testResults.results.map((r, i) => (
                                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
                                    <Space>
                                        {r.success ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                                        <Text strong>{r.host}</Text>
                                    </Space>
                                    <Text type="secondary">{r.latency_ms ? `${r.latency_ms}ms` : r.message}</Text>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </Modal>

            {/* 维护弹窗 */}
            <Modal
                title={<><ToolOutlined style={{ color: '#faad14', marginRight: 8 }} />进入维护模式</>}
                open={disableModalOpen}
                onCancel={() => setDisableModalOpen(false)}
                onOk={handleDisable}
                okText="确认进入"
                okButtonProps={{ loading: disabling, disabled: !disableReason.trim() }}
                width={630}
            >
                <Alert
                    type="info"
                    showIcon
                    message="维护模式下此主机将不参与自愈流程"
                    description="当主机需要临时停机维护，但 CMDB 还未同步该状态时，可通过此功能标记为维护模式。维护模式的主机在自愈流程中会被跳过，不会执行任何脚本。"
                    style={{ marginBottom: 16 }}
                />
                {disableTarget && (
                    <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">主机：</Text>
                        <Text strong>{disableTarget.name}</Text>
                        <Text type="secondary" style={{ marginLeft: 8 }}>({disableTarget.ip_address})</Text>
                    </div>
                )}
                <div style={{ marginBottom: 16 }}>
                    <Text type="secondary">维护原因（必填）：</Text>
                    <Input.TextArea
                        placeholder="例如：临时停机维护、硬件更换中..."
                        value={disableReason}
                        onChange={(e) => setDisableReason(e.target.value)}
                        rows={3}
                        style={{ marginTop: 8 }}
                    />
                </div>
                <div>
                    <Text type="secondary">计划结束时间（可选，留空表示永久维护）：</Text>
                    <DatePicker
                        showTime
                        placeholder="选择结束时间"
                        style={{ width: '100%', marginTop: 8 }}
                        value={maintenanceEndAt ? dayjs(maintenanceEndAt) : null}
                        onChange={(date) => setMaintenanceEndAt(date ? date.format('YYYY-MM-DDTHH:mm:ssZ') : '')}
                        presets={[
                            { label: '2小时后', value: dayjs().add(2, 'hour') },
                            { label: '4小时后', value: dayjs().add(4, 'hour') },
                            { label: '8小时后', value: dayjs().add(8, 'hour') },
                            { label: '24小时后', value: dayjs().add(24, 'hour') },
                            { label: '3天后', value: dayjs().add(3, 'day') },
                            { label: '7天后', value: dayjs().add(7, 'day') },
                        ]}
                    />
                </div>
            </Modal>

            {/* 批量维护弹窗 */}
            <Modal
                title={<><ToolOutlined style={{ color: '#faad14', marginRight: 8 }} />批量进入维护模式 ({selectedRowKeys.length})</>}
                open={batchDisableModalOpen}
                onCancel={() => setBatchDisableModalOpen(false)}
                onOk={handleBatchDisable}
                okText="确认进入"
                okButtonProps={{ loading: disabling, disabled: !batchDisableReason.trim() }}
                width={750}
            >
                <Alert
                    type="info"
                    showIcon
                    message="维护模式下主机将不参与自愈流程"
                    description="选中的主机将被标记为维护模式，在自愈流程中会被跳过。"
                    style={{ marginBottom: 16 }}
                />
                <div style={{ marginBottom: 16 }}>
                    <Text type="secondary">维护原因（必填）：</Text>
                    <Input.TextArea
                        placeholder="例如：批量停机维护、系统升级..."
                        value={batchDisableReason}
                        onChange={(e) => setBatchDisableReason(e.target.value)}
                        rows={3}
                        style={{ marginTop: 8 }}
                    />
                </div>
                <div>
                    <Text type="secondary">计划结束时间（可选，留空表示永久维护）：</Text>
                    <DatePicker
                        showTime
                        placeholder="选择结束时间"
                        style={{ width: '100%', marginTop: 8 }}
                        value={batchMaintenanceEndAt ? dayjs(batchMaintenanceEndAt) : null}
                        onChange={(date) => setBatchMaintenanceEndAt(date ? date.format('YYYY-MM-DDTHH:mm:ssZ') : '')}
                        presets={[
                            { label: '2小时后', value: dayjs().add(2, 'hour') },
                            { label: '4小时后', value: dayjs().add(4, 'hour') },
                            { label: '8小时后', value: dayjs().add(8, 'hour') },
                            { label: '24小时后', value: dayjs().add(24, 'hour') },
                            { label: '3天后', value: dayjs().add(3, 'day') },
                            { label: '7天后', value: dayjs().add(7, 'day') },
                        ]}
                    />
                </div>
            </Modal>
        </PageContainer>
    );
};

export default CMDBList;

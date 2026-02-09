import {
    PlusOutlined, SyncOutlined, ApiOutlined, SettingOutlined,
    CheckCircleOutlined, DeleteOutlined, ExclamationCircleOutlined,
    SearchOutlined, CloseCircleOutlined, MinusCircleOutlined,
    PlayCircleOutlined, PauseCircleOutlined, HistoryOutlined
} from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import {
    Button, message, Popconfirm, Space, Tag, Card, Row, Col, Empty,
    Tooltip, Avatar, Typography, Spin, Input, Select, Statistic,
    Modal, Steps, Form, Tabs, Pagination, Drawer, Timeline, Badge
} from 'antd';
import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useAccess } from '@umijs/max';
import {
    getPlugins, getPluginsStats, createPlugin, updatePlugin, deletePlugin, testPlugin, syncPlugin,
    activatePlugin, deactivatePlugin, getPluginSyncLogs
} from '@/services/auto-healing/plugins';

const { Text, Paragraph } = Typography;

// ============ 配置常量 ============
const PLUGIN_TYPES = [
    { value: 'itsm', label: 'ITSM - 工单系统', icon: '🎫', color: '#1890ff', bgColor: '#e6f7ff' },
    { value: 'cmdb', label: 'CMDB - 配置管理', icon: '🗄️', color: '#52c41a', bgColor: '#f6ffed' },
];

const AUTH_TYPES = [
    { value: 'basic', label: 'Basic 认证 (用户名/密码)' },
    { value: 'bearer', label: 'Bearer Token' },
    { value: 'api_key', label: 'API Key' },
];

const FILTER_OPERATORS = [
    { value: 'equals', label: '等于' },
    { value: 'not_equals', label: '不等于' },
    { value: 'contains', label: '包含' },
    { value: 'not_contains', label: '不包含' },
    { value: 'starts_with', label: '以...开头' },
    { value: 'ends_with', label: '以...结尾' },
    { value: 'regex', label: '正则匹配' },
    { value: 'in', label: '在列表中 (逗号分隔)' },
    { value: 'not_in', label: '不在列表中 (逗号分隔)' },
];

// ITSM 工单可映射字段 - 完整列表
const ITSM_FIELDS = [
    { value: 'external_id', label: '外部工单ID (external_id)' },
    { value: 'title', label: '标题 (title)' },
    { value: 'description', label: '描述 (description)' },
    { value: 'severity', label: '严重程度 (severity)' },
    { value: 'priority', label: '优先级 (priority)' },
    { value: 'status', label: '状态 (status)' },
    { value: 'category', label: '分类 (category)' },
    { value: 'affected_ci', label: '受影响配置项 (affected_ci)' },
    { value: 'affected_service', label: '受影响服务 (affected_service)' },
    { value: 'assignee', label: '处理人 (assignee)' },
    { value: 'reporter', label: '报告人 (reporter)' },
];

// CMDB 配置项可映射字段 - 完整列表
const CMDB_FIELDS = [
    { value: 'external_id', label: '外部配置项ID (external_id)' },
    { value: 'name', label: '名称 (name)' },
    { value: 'type', label: '类型 (type)' },
    { value: 'status', label: '状态 (status)' },
    { value: 'ip_address', label: 'IP地址 (ip_address)' },
    { value: 'hostname', label: '主机名 (hostname)' },
    { value: 'os', label: '操作系统 (os)' },
    { value: 'os_version', label: '系统版本 (os_version)' },
    { value: 'cpu', label: 'CPU信息 (cpu)' },
    { value: 'memory', label: '内存 (memory)' },
    { value: 'disk', label: '磁盘 (disk)' },
    { value: 'location', label: '位置 (location)' },
    { value: 'owner', label: '负责人 (owner)' },
    { value: 'environment', label: '环境 (environment)' },
    { value: 'manufacturer', label: '厂商 (manufacturer)' },
    { value: 'model', label: '型号 (model)' },
    { value: 'serial_number', label: '序列号 (serial_number)' },
    { value: 'department', label: '所属部门 (department)' },
];


// ============ 主组件 ============
const PluginList: React.FC = () => {
    const access = useAccess();
    const [plugins, setPlugins] = useState<AutoHealing.Plugin[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterSync, setFilterSync] = useState<string>('all');
    const [testingId, setTestingId] = useState<string>();
    const [syncingId, setSyncingId] = useState<string>();
    const [activatingId, setActivatingId] = useState<string>();

    // 分页状态
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(16);
    const [total, setTotal] = useState(0);

    // 模态框状态
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [editingPlugin, setEditingPlugin] = useState<AutoHealing.Plugin | null>(null);

    // 同步日志抽屉状态
    const [logsDrawerOpen, setLogsDrawerOpen] = useState(false);
    const [logsPlugin, setLogsPlugin] = useState<AutoHealing.Plugin | null>(null);
    const [syncLogs, setSyncLogs] = useState<AutoHealing.PluginSyncLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);

    // 统计数据（从后端 API 获取，不受分页影响）
    const [stats, setStats] = useState({
        total: 0, active: 0, inactive: 0, error: 0,
        itsm: 0, cmdb: 0, syncEnabled: 0, syncDisabled: 0
    });

    // 加载插件列表 - 后端分页
    const loadPlugins = useCallback(async (page = currentPage, size = pageSize, type = filterType, silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await getPlugins({
                page,
                page_size: size,
                type: type === 'all' ? undefined : type as 'itsm' | 'cmdb',
            });
            setPlugins(res.data || []);
            setTotal(res.pagination?.total || res.total || 0);
        } catch {
            // 全局处理器已显示错误
        } finally {
            if (!silent) setLoading(false);
        }
    }, [currentPage, pageSize, filterType]);

    // 加载统计数据
    const loadStats = useCallback(async () => {
        try {
            const res = await getPluginsStats();
            const d = res.data;
            setStats({
                total: d.total || 0,
                active: d.active_count || d.by_status?.active || 0,
                inactive: d.inactive_count || d.by_status?.inactive || 0,
                error: d.error_count || d.by_status?.error || 0,
                itsm: d.by_type?.itsm || 0,
                cmdb: d.by_type?.cmdb || 0,
                syncEnabled: d.sync_enabled || 0,
                syncDisabled: d.sync_disabled || 0,
            });
        } catch {
            // 静默失败
        }
    }, []);

    // 静默刷新当前页和统计
    const refreshPlugins = useCallback(() => {
        loadPlugins(currentPage, pageSize, filterType, true);
        loadStats();
    }, [currentPage, pageSize, filterType, loadPlugins, loadStats]);

    // 初始加载
    useEffect(() => { loadPlugins(1, pageSize, filterType); loadStats(); }, []);

    // 分页或筛选变化时重新请求
    const handlePageChange = useCallback((page: number, size: number) => {
        setCurrentPage(page);
        setPageSize(size);
        loadPlugins(page, size, filterType);
    }, [filterType, loadPlugins]);

    const handleFilterChange = useCallback((type: string) => {
        setFilterType(type);
        setCurrentPage(1);
        loadPlugins(1, pageSize, type);
    }, [pageSize, loadPlugins]);

    // 前端搜索和筛选（后端不支持的筛选放在前端做）
    const filteredPlugins = useMemo(() => {
        return plugins.filter(p => {
            // 搜索
            const matchSearch = !searchText || p.name.toLowerCase().includes(searchText.toLowerCase());
            // 状态筛选
            const matchStatus = filterStatus === 'all' || p.status === filterStatus;
            // 同步状态筛选
            const matchSync = filterSync === 'all' ||
                (filterSync === 'enabled' && p.sync_enabled) ||
                (filterSync === 'disabled' && !p.sync_enabled);
            return matchSearch && matchStatus && matchSync;
        });
    }, [plugins, searchText, filterStatus, filterSync]);



    // 操作 - 错误由全局处理器统一显示 - 使用 useCallback 保持稳定引用
    const handleTest = useCallback(async (id: string) => {
        setTestingId(id);
        try {
            await testPlugin(id);
            message.success('连接测试成功');
        } catch {
            // 全局处理器已显示错误
        } finally {
            setTestingId(undefined);
            refreshPlugins(); // 静默刷新
        }
    }, [refreshPlugins]);

    const handleSync = useCallback(async (id: string) => {
        setSyncingId(id);
        try {
            await syncPlugin(id);
            message.success('同步已启动');
        } catch {
            // 全局处理器已显示错误
        } finally {
            setSyncingId(undefined);
            refreshPlugins();
        }
    }, [refreshPlugins]);

    const handleDelete = useCallback(async (id: string) => {
        try {
            await deletePlugin(id);
            message.success('已删除');
        } catch {
            // 全局处理器已显示错误
        } finally {
            refreshPlugins();
        }
    }, [refreshPlugins]);

    const handleActivate = useCallback(async (id: string) => {
        setActivatingId(id);
        try {
            await activatePlugin(id);
            message.success('激活成功');
        } catch {
            // 全局处理器已显示错误
        } finally {
            setActivatingId(undefined);
            refreshPlugins();
        }
    }, [refreshPlugins]);

    const handleDeactivate = useCallback(async (id: string) => {
        setActivatingId(id);
        try {
            await deactivatePlugin(id);
            message.success('已停用');
        } catch {
            // 全局处理器已显示错误
        } finally {
            setActivatingId(undefined);
            refreshPlugins();
        }
    }, [refreshPlugins]);

    const openCreate = useCallback(() => {
        setEditingPlugin(null);
        setModalMode('create');
        setModalOpen(true);
    }, []);

    const openEdit = useCallback((plugin: AutoHealing.Plugin) => {
        setEditingPlugin(plugin);
        setModalMode('edit');
        setModalOpen(true);
    }, []);

    // 加载同步日志
    const loadLogs = useCallback(async (pluginId: string, showLoading = false) => {
        if (showLoading) setLogsLoading(true);
        try {
            const res = await getPluginSyncLogs(pluginId, { page: 1, page_size: 20 });
            setSyncLogs(res.data || []);
        } catch {
            // 全局处理器已显示错误
        } finally {
            if (showLoading) setLogsLoading(false);
        }
    }, []);

    const openLogs = useCallback((plugin: AutoHealing.Plugin) => {
        setLogsPlugin(plugin);
        setLogsDrawerOpen(true);
        loadLogs(plugin.id, true);
    }, [loadLogs]);

    // 轮询刷新同步日志（5秒一次）
    useEffect(() => {
        if (!logsDrawerOpen || !logsPlugin) return;
        const interval = setInterval(() => {
            loadLogs(logsPlugin.id, false); // 静默刷新
        }, 5000);
        return () => clearInterval(interval);
    }, [logsDrawerOpen, logsPlugin, loadLogs]);

    const getTypeConfig = (type: string) => PLUGIN_TYPES.find(t => t.value === type) || PLUGIN_TYPES[0];

    // 渲染卡片
    const renderCard = (plugin: AutoHealing.Plugin) => {
        const typeConf = getTypeConfig(plugin.type);
        const isActive = plugin.status === 'active';
        const isError = String(plugin.status) === 'error';

        return (
            <Col xs={24} sm={12} lg={8} xl={6} key={plugin.id}>
                <Card hoverable style={{ height: '100%', borderRadius: 8 }} styles={{ body: { padding: 16 } }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                        <Avatar style={{ backgroundColor: typeConf.bgColor, marginRight: 12 }}>{typeConf.icon}</Avatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <Tooltip title={plugin.name} placement="topLeft">
                                <Paragraph strong style={{ margin: 0 }} ellipsis={{ rows: 1 }}>{plugin.name}</Paragraph>
                            </Tooltip>
                            <Text type="secondary" style={{ fontSize: 12 }}>{typeConf.label.split(' - ')[0]}</Text>
                        </div>
                        <Tag color={isActive ? 'success' : isError ? 'error' : 'default'}
                            icon={isActive ? <CheckCircleOutlined /> : isError ? <CloseCircleOutlined /> : <ExclamationCircleOutlined />}>
                            {isActive ? '运行中' : isError ? '异常' : '未激活'}
                        </Tag>
                    </div>
                    {/* 信息区域 */}
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 12, minHeight: 56 }}>
                        <div>同步: {plugin.sync_enabled ? `每 ${plugin.sync_interval_minutes} 分钟` : '未开启'}</div>
                        <div>上次: {plugin.last_sync_at ? new Date(plugin.last_sync_at).toLocaleString() : '暂无记录'}</div>
                        {plugin.sync_enabled && plugin.next_sync_at && isActive && (
                            <div style={{ color: '#1890ff' }}>下次: {new Date(plugin.next_sync_at).toLocaleString()}</div>
                        )}
                    </div>
                    <Space size="small" wrap>
                        <Tooltip title="测试连接（不改变状态）">
                            <Button size="small" icon={testingId === plugin.id ? <Spin size="small" /> : <ApiOutlined />}
                                onClick={() => handleTest(plugin.id)} disabled={testingId === plugin.id || !access.canTestPlugin} />
                        </Tooltip>
                        {isActive ? (
                            <Tooltip title="停用（停止定时同步）">
                                <Button size="small" icon={activatingId === plugin.id ? <Spin size="small" /> : <PauseCircleOutlined />}
                                    onClick={() => handleDeactivate(plugin.id)} disabled={activatingId === plugin.id || !access.canUpdatePlugin} />
                            </Tooltip>
                        ) : (
                            <Tooltip title="激活（先测试连接，成功后激活）">
                                <Button size="small" type="primary" ghost icon={activatingId === plugin.id ? <Spin size="small" /> : <PlayCircleOutlined />}
                                    onClick={() => handleActivate(plugin.id)} disabled={activatingId === plugin.id || !access.canUpdatePlugin} />
                            </Tooltip>
                        )}
                        <Tooltip title={isActive ? "手动触发同步" : "需先激活才能同步"}>
                            <Button size="small" icon={syncingId === plugin.id ? <Spin size="small" /> : <SyncOutlined />}
                                onClick={() => handleSync(plugin.id)} disabled={syncingId === plugin.id || !isActive || !access.canSyncPlugin} />
                        </Tooltip>
                        <Tooltip title="编辑配置">
                            <Button size="small" icon={<SettingOutlined />} disabled={!access.canUpdatePlugin} onClick={() => openEdit(plugin)} />
                        </Tooltip>
                        <Tooltip title="同步历史">
                            <Button size="small" icon={<HistoryOutlined />} onClick={() => openLogs(plugin)} />
                        </Tooltip>
                        <Popconfirm title="确定删除该插件？此操作不可恢复" onConfirm={() => handleDelete(plugin.id)}>
                            <Tooltip title="删除"><Button size="small" danger disabled={!access.canDeletePlugin} icon={<DeleteOutlined />} /></Tooltip>
                        </Popconfirm>
                    </Space>
                </Card>
            </Col>
        );
    };

    return (
        <PageContainer header={{ title: <><ApiOutlined /> 插件管理 / PLUGINS</>, subTitle: '管理 ITSM 和 CMDB 数据源' }}>
            {/* 统计 - 第一行：状态 */}
            <Row gutter={16} style={{ marginBottom: 8 }}>
                {[
                    { title: '总数', value: stats.total, color: '#1890ff' },
                    { title: '运行中', value: stats.active, color: '#52c41a' },
                    { title: '未激活', value: stats.inactive, color: '#8c8c8c' },
                    { title: '异常', value: stats.error, color: '#ff4d4f' },
                ].map((item, i) => (
                    <Col xs={12} sm={6} key={i}>
                        <ProCard><Statistic title={item.title} value={item.value} valueStyle={{ color: item.color }} /></ProCard>
                    </Col>
                ))}
            </Row>
            {/* 统计 - 第二行：类型 & 同步 */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
                {[
                    { title: 'ITSM', value: stats.itsm, color: '#722ed1' },
                    { title: 'CMDB', value: stats.cmdb, color: '#13c2c2' },
                    { title: '已启用同步', value: stats.syncEnabled, color: '#1890ff' },
                    { title: '未启用同步', value: stats.syncDisabled, color: '#faad14' },
                ].map((item, i) => (
                    <Col xs={12} sm={6} key={i}>
                        <ProCard><Statistic title={item.title} value={item.value} valueStyle={{ color: item.color }} /></ProCard>
                    </Col>
                ))}
            </Row>

            {/* 工具栏 */}
            <ProCard style={{ marginBottom: 16 }}>
                <Space wrap>
                    <Input placeholder="搜索名称..." prefix={<SearchOutlined />} value={searchText}
                        onChange={e => setSearchText(e.target.value)} allowClear style={{ width: 180 }} />
                    <Select value={filterType} onChange={handleFilterChange} style={{ width: 120 }}
                        options={[{ value: 'all', label: '全部类型' }, { value: 'itsm', label: 'ITSM' }, { value: 'cmdb', label: 'CMDB' }]} />
                    <Select value={filterStatus} onChange={v => setFilterStatus(v)} style={{ width: 120 }}
                        options={[
                            { value: 'all', label: '全部状态' },
                            { value: 'active', label: '运行中' },
                            { value: 'inactive', label: '未激活' },
                            { value: 'error', label: '异常' },
                        ]} />
                    <Select value={filterSync} onChange={v => setFilterSync(v)} style={{ width: 130 }}
                        options={[
                            { value: 'all', label: '全部同步' },
                            { value: 'enabled', label: '已启用同步' },
                            { value: 'disabled', label: '未启用同步' },
                        ]} />
                    <Button type="primary" icon={<PlusOutlined />} disabled={!access.canCreatePlugin} onClick={openCreate}>新建</Button>
                </Space>
            </ProCard>

            {/* 列表 */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
            ) : filteredPlugins.length === 0 ? (
                <Empty description="暂无插件"><Button type="primary" onClick={openCreate}>新建插件</Button></Empty>
            ) : (
                <>
                    <Row gutter={[16, 16]}>{filteredPlugins.map(renderCard)}</Row>
                    {/* 分页 - 始终显示以便调整每页数量 */}
                    <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', background: '#fff', padding: '12px 16px', borderRadius: 8 }}>
                        <Pagination
                            current={currentPage}
                            pageSize={pageSize}
                            total={total}
                            showSizeChanger
                            showQuickJumper
                            showTotal={(t) => `共 ${t} 条`}
                            pageSizeOptions={['16', '32', '64']}
                            onChange={handlePageChange}
                        />
                    </div>
                </>
            )}

            {/* 模态框 */}
            <PluginModal
                open={modalOpen}
                mode={modalMode}
                plugin={editingPlugin}
                onCancel={() => setModalOpen(false)}
                onSuccess={() => { setModalOpen(false); refreshPlugins(); }}
            />

            {/* 同步历史抽屉 */}
            <Drawer
                title={`同步历史 - ${logsPlugin?.name || ''}`}
                placement="right"
                width={480}
                open={logsDrawerOpen}
                onClose={() => setLogsDrawerOpen(false)}
            >
                {logsLoading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
                ) : syncLogs.length === 0 ? (
                    <Empty description="暂无同步记录" />
                ) : (
                    <Timeline
                        items={syncLogs.map(log => ({
                            color: log.status === 'success' ? 'green' : log.status === 'failed' ? 'red' : 'blue',
                            children: (
                                <div key={log.id}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Badge
                                            status={log.status === 'success' ? 'success' : log.status === 'failed' ? 'error' : 'processing'}
                                            text={log.status === 'success' ? '成功' : log.status === 'failed' ? '失败' : '进行中'}
                                        />
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {log.sync_type === 'manual' ? '手动' : '定时'}
                                        </Text>
                                    </div>
                                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                                        {new Date(log.started_at).toLocaleString()}
                                    </div>
                                    {/* 统计数据 */}
                                    <div style={{ fontSize: 12, marginTop: 4 }}>
                                        <span>获取 <Text strong>{log.records_fetched}</Text></span>
                                        {log.records_filtered > 0 && (
                                            <span style={{ color: '#faad14' }}> | 过滤 <Text strong style={{ color: '#faad14' }}>{log.records_filtered}</Text></span>
                                        )}
                                        <span> | 处理 <Text strong>{log.records_processed}</Text></span>
                                        {log.records_new > 0 && (
                                            <span style={{ color: '#52c41a' }}> | 新增 <Text strong style={{ color: '#52c41a' }}>{log.records_new}</Text></span>
                                        )}
                                        {log.records_updated > 0 && (
                                            <span style={{ color: '#1890ff' }}> | 更新 <Text strong style={{ color: '#1890ff' }}>{log.records_updated}</Text></span>
                                        )}
                                        {log.records_failed > 0 && (
                                            <span style={{ color: '#ff4d4f' }}> | 失败 <Text strong style={{ color: '#ff4d4f' }}>{log.records_failed}</Text></span>
                                        )}
                                    </div>
                                    {/* 过滤详情 */}
                                    {log.details?.filtered_records && log.details.filtered_records.length > 0 && (
                                        <div style={{ fontSize: 11, marginTop: 6, padding: 8, background: '#fffbe6', borderRadius: 4 }}>
                                            <div style={{ fontWeight: 500, marginBottom: 4, color: '#d48806' }}>被过滤的记录：</div>
                                            {log.details.filtered_records.slice(0, 5).map((r, i) => (
                                                <div key={i} style={{ color: '#8c8c8c', marginBottom: 2 }}>
                                                    <Text ellipsis style={{ maxWidth: 300 }}>{r.title}</Text>
                                                    <div style={{ fontSize: 10, color: '#bfbfbf' }}>{r.reason}</div>
                                                </div>
                                            ))}
                                            {log.details.filtered_records.length > 5 && (
                                                <div style={{ color: '#8c8c8c', fontStyle: 'italic' }}>
                                                    ...还有 {log.details.filtered_records.length - 5} 条
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {/* 错误信息 */}
                                    {log.error_message && (
                                        <div style={{ fontSize: 12, color: '#ff4d4f', marginTop: 4 }}>
                                            {log.error_message}
                                        </div>
                                    )}
                                </div>
                            ),
                        }))}
                    />
                )}
            </Drawer>
        </PageContainer>
    );
};

// ============ 模态框表单组件 ============
interface PluginModalProps {
    open: boolean;
    mode: 'create' | 'edit';
    plugin: AutoHealing.Plugin | null;
    onCancel: () => void;
    onSuccess: () => void;
}

const PluginModal: React.FC<PluginModalProps> = ({ open, mode, plugin, onCancel, onSuccess }) => {
    const [form] = Form.useForm();
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [mappings, setMappings] = useState<{ standard: string; external: string }[]>([]);
    const [filters, setFilters] = useState<{ field: string; operator: string; value: string }[]>([]);
    const [extraParams, setExtraParams] = useState<{ key: string; value: string }[]>([]);

    // 监听打开，初始化数据
    useEffect(() => {
        if (open) {
            setStep(0);
            if (mode === 'edit' && plugin) {
                form.setFieldsValue({
                    name: plugin.name,
                    type: plugin.type,
                    description: plugin.description,
                    url: plugin.config?.url,
                    auth_type: plugin.config?.auth_type || 'basic',
                    username: plugin.config?.username,
                    password: plugin.config?.password,
                    token: plugin.config?.token,
                    api_key: plugin.config?.api_key,
                    api_key_header: plugin.config?.api_key_header,
                    since_param: plugin.config?.since_param,
                    response_data_path: plugin.config?.response_data_path,
                    sync_enabled: plugin.sync_enabled,
                    sync_interval_minutes: plugin.sync_interval_minutes || 5,
                });
                const mapping = plugin.type === 'cmdb' ? plugin.field_mapping?.cmdb_mapping : plugin.field_mapping?.incident_mapping;
                setMappings(mapping ? Object.entries(mapping).map(([k, v]) => ({ standard: k, external: v as string })) : []);
                setFilters(plugin.sync_filter?.rules?.map((r: any) => ({
                    field: r.field || '', operator: r.operator || 'equals',
                    value: Array.isArray(r.value) ? r.value.join(',') : String(r.value || '')
                })) || []);
                // 加载额外参数
                const ep = plugin.config?.extra_params;
                setExtraParams(ep ? Object.entries(ep).map(([k, v]) => ({ key: k, value: String(v) })) : []);
            } else {
                form.resetFields();
                form.setFieldsValue({ type: 'itsm', auth_type: 'basic', sync_enabled: true, sync_interval_minutes: 5 });
                setMappings([]);
                setFilters([]);
                setExtraParams([]);
            }
        }
    }, [open, mode, plugin, form]);

    const currentType = Form.useWatch('type', form) || 'itsm';
    const authType = Form.useWatch('auth_type', form) || 'basic';
    const syncEnabled = Form.useWatch('sync_enabled', form);
    const standardFields = currentType === 'cmdb' ? CMDB_FIELDS : ITSM_FIELDS;

    // 下一步 (仅新建模式)
    const handleNext = async () => {
        try {
            if (step === 0) {
                await form.validateFields(['name', 'type']);
            } else if (step === 1) {
                const fieldsToValidate = ['url', 'auth_type'];
                if (authType === 'basic') fieldsToValidate.push('username', 'password');
                else if (authType === 'bearer') fieldsToValidate.push('token');
                else if (authType === 'api_key') fieldsToValidate.push('api_key');
                await form.validateFields(fieldsToValidate);
            }
            setStep(step + 1);
        } catch { /* 验证失败 */ }
    };

    // 提交
    const handleSubmit = async () => {
        try {
            // 编辑模式验证必填字段
            if (mode === 'edit') {
                const fieldsToValidate = ['url', 'auth_type'];
                if (authType === 'basic') fieldsToValidate.push('username', 'password');
                else if (authType === 'bearer') fieldsToValidate.push('token');
                else if (authType === 'api_key') fieldsToValidate.push('api_key');
                await form.validateFields(fieldsToValidate);
            }
        } catch { return; }

        setSubmitting(true);
        try {
            // 获取所有字段值（包括隐藏的）
            const values = form.getFieldsValue(true);

            const config: AutoHealing.PluginConfig = { url: values.url, auth_type: values.auth_type };
            if (values.auth_type === 'basic') { config.username = values.username; config.password = values.password; }
            else if (values.auth_type === 'bearer') { config.token = values.token; }
            else if (values.auth_type === 'api_key') { config.api_key = values.api_key; config.api_key_header = values.api_key_header; }
            if (values.since_param) config.since_param = values.since_param;
            if (values.response_data_path) config.response_data_path = values.response_data_path;
            // 额外参数 - 从可视化输入构建
            const validExtraParams = extraParams.filter(p => p.key && p.value);
            if (validExtraParams.length > 0) {
                const ep: Record<string, string> = {};
                validExtraParams.forEach(p => { ep[p.key] = p.value; });
                config.extra_params = ep;
            }
            if (values.close_incident_url) config.close_incident_url = values.close_incident_url;
            if (values.close_incident_method) config.close_incident_method = values.close_incident_method;

            // 字段映射 - 始终发送，为空时清除
            let field_mapping: AutoHealing.FieldMapping = {};
            const validMappings = mappings.filter(m => m.standard && m.external);
            if (validMappings.length > 0) {
                const map: Record<string, string> = {};
                validMappings.forEach(m => { map[m.standard] = m.external; });
                field_mapping = values.type === 'cmdb' ? { cmdb_mapping: map } : { incident_mapping: map };
            }

            // 同步过滤器 - 始终发送，包含所有已填写字段的规则
            const validFilters = filters.filter(f => f.field); // 只要有字段名就保留
            const sync_filter: AutoHealing.SyncFilter = {
                logic: 'and',
                rules: validFilters.map(f => ({
                    field: f.field,
                    operator: f.operator as any,
                    value: ['in', 'not_in'].includes(f.operator)
                        ? (f.value || '').split(',').map(v => v.trim()).filter(v => v)
                        : (f.value || ''),
                })),
            };

            const payload = {
                name: values.name,
                type: values.type,
                description: values.description,
                version: values.version,
                config,
                field_mapping,
                sync_filter,
                sync_enabled: Boolean(values.sync_enabled),
                sync_interval_minutes: Number(values.sync_interval_minutes) || 5,
            };

            if (mode === 'create') {
                await createPlugin(payload as AutoHealing.CreatePluginRequest);
                message.success('创建成功');
            } else {
                await updatePlugin(plugin!.id, payload as AutoHealing.UpdatePluginRequest);
                message.success('更新成功');
            }
            onSuccess();
        } catch {
            // 全局处理器已显示错误
        } finally {
            setSubmitting(false);
        }
    };

    // 映射操作
    const addMapping = () => setMappings([...mappings, { standard: '', external: '' }]);
    const removeMapping = (i: number) => setMappings(mappings.filter((_, idx) => idx !== i));
    const updateMapping = (i: number, field: 'standard' | 'external', value: string) => {
        const arr = [...mappings]; arr[i][field] = value; setMappings(arr);
    };

    // 过滤器操作
    const addFilter = () => setFilters([...filters, { field: '', operator: 'equals', value: '' }]);
    const removeFilter = (i: number) => setFilters(filters.filter((_, idx) => idx !== i));
    const updateFilter = (i: number, field: 'field' | 'operator' | 'value', value: string) => {
        const arr = [...filters]; arr[i][field] = value; setFilters(arr);
    };

    // 额外参数操作
    const addExtraParam = () => setExtraParams([...extraParams, { key: '', value: '' }]);
    const removeExtraParam = (i: number) => setExtraParams(extraParams.filter((_, idx) => idx !== i));
    const updateExtraParam = (i: number, field: 'key' | 'value', value: string) => {
        const arr = [...extraParams]; arr[i][field] = value; setExtraParams(arr);
    };

    // 渲染基本信息表单
    const renderBasicForm = () => (
        <>
            <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
                <Input placeholder="例如: 生产环境 ServiceNow" disabled={mode === 'edit'} />
            </Form.Item>
            <Form.Item name="type" label="类型" rules={[{ required: true }]}>
                <Select options={PLUGIN_TYPES.map(t => ({ value: t.value, label: t.label }))} disabled={mode === 'edit'} />
            </Form.Item>
            <Row gutter={16}>
                <Col span={16}>
                    <Form.Item name="description" label="描述 (可选)">
                        <Input placeholder="插件用途说明" />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name="version" label="版本号 (可选)">
                        <Input placeholder="1.0.0" />
                    </Form.Item>
                </Col>
            </Row>
        </>
    );

    // 渲染连接配置表单
    const renderConnectionForm = () => (
        <>
            <Form.Item name="url" label="API 地址" rules={[{ required: true, message: '请输入API地址' }]}>
                <Input placeholder="https://your-system.com/api/incidents" />
            </Form.Item>
            <Form.Item name="auth_type" label="认证方式" rules={[{ required: true }]}>
                <Select options={AUTH_TYPES} />
            </Form.Item>
            {authType === 'basic' && (
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="username" label="用户名" rules={[{ required: true }]}><Input /></Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="password" label="密码" rules={[{ required: true }]}><Input.Password /></Form.Item>
                    </Col>
                </Row>
            )}
            {authType === 'bearer' && (
                <Form.Item name="token" label="Token" rules={[{ required: true }]}><Input.Password /></Form.Item>
            )}
            {authType === 'api_key' && (
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="api_key" label="API Key" rules={[{ required: true }]}><Input.Password /></Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="api_key_header" label="Header名 (可选)"><Input placeholder="X-API-Key" /></Form.Item>
                    </Col>
                </Row>
            )}
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="since_param" label="时间参数">
                        <Input placeholder="updated_after（用于增量同步）" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="response_data_path" label="数据路径">
                        <Input placeholder="data.items（响应中的数据数组路径）" />
                    </Form.Item>
                </Col>
            </Row>
            {/* 额外查询参数 - 可视化键值对输入 */}
            <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>额外查询参数 (可选)</Text>
                <div style={{ marginTop: 8 }}>
                    {extraParams.map((p, i) => (
                        <Row gutter={8} key={i} style={{ marginBottom: 8 }}>
                            <Col span={10}>
                                <Input placeholder="参数名，如 sysparm_limit" value={p.key}
                                    onChange={e => updateExtraParam(i, 'key', e.target.value)} />
                            </Col>
                            <Col span={10}>
                                <Input placeholder="参数值，如 100" value={p.value}
                                    onChange={e => updateExtraParam(i, 'value', e.target.value)} />
                            </Col>
                            <Col span={4}>
                                <Button icon={<MinusCircleOutlined />} onClick={() => removeExtraParam(i)} />
                            </Col>
                        </Row>
                    ))}
                    <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addExtraParam}>
                        添加参数
                    </Button>
                </div>
            </div>
            {currentType === 'itsm' && (
                <div style={{ marginTop: 16 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>关闭工单回调 (可选)</Text>
                    <Row gutter={16} style={{ marginTop: 8 }}>
                        <Col span={16}>
                            <Form.Item name="close_incident_url" style={{ margin: 0 }}>
                                <Input placeholder="关闭接口URL，{external_id}会被替换为工单ID" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="close_incident_method" style={{ margin: 0 }}>
                                <Select
                                    options={[{ value: 'POST', label: 'POST' }, { value: 'PUT', label: 'PUT' }, { value: 'PATCH', label: 'PATCH' }]}
                                    placeholder="请求方法"
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        例: https://itsm.example.com/api/incidents/{'{external_id}'}/close
                    </Text>
                </div>
            )}
        </>
    );

    // 渲染同步设置表单
    const renderSyncForm = () => {
        // 根据操作符获取值输入的placeholder
        const getValuePlaceholder = (operator: string) => {
            switch (operator) {
                case 'regex': return '正则表达式，如: ^error.*';
                case 'in':
                case 'not_in': return '逗号分隔，如: val1,val2,val3';
                case 'contains':
                case 'not_contains': return '包含的文本';
                case 'starts_with': return '开头文本';
                case 'ends_with': return '结尾文本';
                default: return '匹配值';
            }
        };

        return (
            <>
                <Form.Item name="sync_enabled" label="启用定时同步" valuePropName="checked">
                    <Input type="checkbox" style={{ width: 'auto' }} />
                </Form.Item>
                {syncEnabled && (
                    <Form.Item name="sync_interval_minutes" label="同步间隔 (分钟)">
                        <Input type="number" min={1} max={1440} style={{ width: 120 }} />
                    </Form.Item>
                )}
                <div style={{ marginTop: 16 }}>
                    <div style={{ marginBottom: 8, fontWeight: 500 }}>过滤规则 (可选)</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>只同步满足条件的数据</Text>
                    <div style={{ marginTop: 8 }}>
                        {filters.map((f, i) => (
                            <Row gutter={8} key={i} style={{ marginBottom: 8 }} align="middle">
                                <Col span={6}>
                                    <Input placeholder="字段名" value={f.field} onChange={e => updateFilter(i, 'field', e.target.value)} />
                                </Col>
                                <Col span={5}>
                                    <Select style={{ width: '100%' }} value={f.operator} onChange={v => updateFilter(i, 'operator', v)} options={FILTER_OPERATORS} />
                                </Col>
                                <Col span={10}>
                                    <Tooltip title={f.operator === 'regex' ? '请输入有效的正则表达式' : f.operator === 'in' || f.operator === 'not_in' ? '多个值用逗号分隔' : undefined}>
                                        <Input
                                            placeholder={getValuePlaceholder(f.operator)}
                                            value={f.value}
                                            onChange={e => updateFilter(i, 'value', e.target.value)}
                                            style={f.operator === 'regex' ? { fontFamily: 'monospace' } : undefined}
                                        />
                                    </Tooltip>
                                </Col>
                                <Col span={3}><Button icon={<MinusCircleOutlined />} onClick={() => removeFilter(i)} /></Col>
                            </Row>
                        ))}
                        <Button type="dashed" block icon={<PlusOutlined />} onClick={addFilter}>添加规则</Button>
                    </div>
                </div>
            </>
        );
    };

    // 渲染字段映射表单
    const renderMappingForm = () => (
        <>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>字段映射 (可选)</div>
            <Text type="secondary" style={{ fontSize: 12 }}>外部系统字段名与标准字段名不同时使用</Text>
            <div style={{ marginTop: 12 }}>
                {mappings.map((m, i) => (
                    <Row gutter={8} key={i} style={{ marginBottom: 8 }}>
                        <Col span={10}>
                            <Select style={{ width: '100%' }} placeholder="标准字段" value={m.standard || undefined}
                                onChange={v => updateMapping(i, 'standard', v)} options={standardFields} />
                        </Col>
                        <Col span={10}>
                            <Input placeholder="外部字段名" value={m.external} onChange={e => updateMapping(i, 'external', e.target.value)} />
                        </Col>
                        <Col span={4}><Button icon={<MinusCircleOutlined />} onClick={() => removeMapping(i)} /></Col>
                    </Row>
                ))}
                <Button type="dashed" block icon={<PlusOutlined />} onClick={addMapping}>添加映射</Button>
            </div>
        </>
    );

    // ===== 新建模式：分步导航 =====
    if (mode === 'create') {
        return (
            <Modal
                title="新建插件"
                open={open}
                onCancel={onCancel}
                width={600}
                destroyOnClose
                footer={
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>{step > 0 && <Button onClick={() => setStep(step - 1)}>上一步</Button>}</div>
                        <Space>
                            <Button onClick={onCancel}>取消</Button>
                            {step < 3 ? (
                                <Button type="primary" onClick={handleNext}>下一步</Button>
                            ) : (
                                <Button type="primary" loading={submitting} onClick={handleSubmit}>创建</Button>
                            )}
                        </Space>
                    </div>
                }
            >
                <Steps current={step} size="small" style={{ marginBottom: 24 }}
                    items={[{ title: '基本信息' }, { title: '连接配置' }, { title: '同步设置' }, { title: '字段映射' }]} />
                <Form form={form} layout="vertical">
                    {step === 0 && renderBasicForm()}
                    {step === 1 && renderConnectionForm()}
                    {step === 2 && renderSyncForm()}
                    {step === 3 && renderMappingForm()}
                </Form>
            </Modal>
        );
    }

    // ===== 编辑模式：使用Tabs切换 =====
    return (
        <Modal
            title={`编辑插件: ${plugin?.name || ''}`}
            open={open}
            onCancel={onCancel}
            width={640}
            destroyOnClose
            footer={
                <Space>
                    <Button onClick={onCancel}>取消</Button>
                    <Button type="primary" loading={submitting} onClick={handleSubmit}>保存</Button>
                </Space>
            }
        >
            <Form form={form} layout="vertical">
                <Tabs
                    defaultActiveKey="basic"
                    items={[
                        {
                            key: 'basic',
                            label: '基本信息',
                            children: renderBasicForm(),
                        },
                        {
                            key: 'connection',
                            label: '连接配置',
                            children: renderConnectionForm(),
                        },
                        {
                            key: 'sync',
                            label: '同步设置',
                            children: renderSyncForm(),
                        },
                        {
                            key: 'mapping',
                            label: '字段映射',
                            children: renderMappingForm(),
                        },
                    ]}
                />
            </Form>
        </Modal>
    );
};

export default PluginList;

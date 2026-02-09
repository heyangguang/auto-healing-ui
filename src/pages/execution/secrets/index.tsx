import {
    PlusOutlined, ApiOutlined, KeyOutlined, LockOutlined, CloudOutlined,
    SettingOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined,
    SearchOutlined, StarOutlined, StarFilled, EyeOutlined, EditOutlined,
    SafetyCertificateOutlined, GlobalOutlined, FileOutlined,
} from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { useAccess } from '@umijs/max';
import {
    Button, message, Popconfirm, Space, Tag, Card, Row, Col, Empty,
    Tooltip, Avatar, Typography, Spin, Input, Select, Statistic, Checkbox,
    Modal, Steps, Form, Drawer, Descriptions, Badge, Switch, Pagination, Tabs, Alert,
} from 'antd';
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
    getSecretsSources, createSecretsSource, updateSecretsSource,
    deleteSecretsSource, testSecretsSource, testSecretsQuery,
    enableSecretsSource, disableSecretsSource,
} from '@/services/auto-healing/secrets';
import HostSelector from '@/components/HostSelector';

const { Text, Paragraph } = Typography;

// ==================== 配置常量 ====================
const SOURCE_TYPES = [
    { value: 'file', label: '本地密钥文件', icon: <FileOutlined />, color: '#1890ff', bgColor: '#e6f7ff', desc: '从本地密钥文件读取凭据（仅支持SSH Key）', supportPassword: false },
    { value: 'vault', label: 'HashiCorp Vault', icon: <SafetyCertificateOutlined />, color: '#722ed1', bgColor: '#f9f0ff', desc: '从 Vault 安全存储获取凭据', supportPassword: true },
    { value: 'webhook', label: 'Webhook', icon: <GlobalOutlined />, color: '#52c41a', bgColor: '#f6ffed', desc: '通过外部 HTTP 服务获取凭据', supportPassword: true },
];

const AUTH_TYPES = [
    { value: 'ssh_key', label: 'SSH 密钥', icon: <KeyOutlined />, color: '#1890ff' },
    { value: 'password', label: '密码认证', icon: <LockOutlined />, color: '#fa8c16' },
];

// Vault 认证方式
const VAULT_AUTH_TYPES = [
    { value: 'token', label: 'Token' },
    { value: 'approle', label: 'AppRole' },
];

// Webhook 认证方式
const WEBHOOK_AUTH_TYPES = [
    { value: 'none', label: '无认证' },
    { value: 'basic', label: 'Basic Auth' },
    { value: 'bearer', label: 'Bearer Token' },
    { value: 'api_key', label: 'API Key' },
];

const getSourceTypeConfig = (type: string) => SOURCE_TYPES.find(t => t.value === type) || SOURCE_TYPES[0];
const getAuthTypeConfig = (authType: string) => AUTH_TYPES.find(t => t.value === authType) || AUTH_TYPES[0];

// ==================== 卡片组件（使用 memo 优化） ====================
interface SourceCardProps {
    source: AutoHealing.SecretsSource;
    isTesting: boolean;
    canManage: boolean;
    onTest: (source: AutoHealing.SecretsSource) => void;
    onDetail: (source: AutoHealing.SecretsSource) => void;
    onEdit: (source: AutoHealing.SecretsSource) => void;
    onSetDefault: (source: AutoHealing.SecretsSource) => void;
    onCancelDefault: (source: AutoHealing.SecretsSource) => void;
    onToggleStatus: (source: AutoHealing.SecretsSource) => void;
    onDelete: (id: string) => void;
}

const SourceCard = memo<SourceCardProps>(({
    source, isTesting, canManage, onTest, onDetail, onEdit, onSetDefault, onCancelDefault, onToggleStatus, onDelete
}) => {
    const typeConfig = getSourceTypeConfig(source.type);
    const authConfig = getAuthTypeConfig(source.auth_type);
    const isActive = source.status === 'active';

    return (
        <Card
            hoverable
            style={{
                borderRadius: 0,
                height: '100%',
                border: source.is_default ? '2px solid #faad14' : undefined,
                opacity: isActive ? 1 : 0.7,
            }}
            styles={{ body: { padding: 20 } }}
        >
            {/* 头部 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
                <Avatar
                    size={48}
                    style={{
                        backgroundColor: typeConfig.bgColor,
                        color: typeConfig.color,
                        marginRight: 12,
                        flexShrink: 0,
                    }}
                    icon={typeConfig.icon}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Tooltip title={source.name}>
                            <Paragraph strong style={{ margin: 0, fontSize: 15 }} ellipsis={{ rows: 1 }}>
                                {source.name}
                            </Paragraph>
                        </Tooltip>
                        {source.is_default && (
                            <Tooltip title="默认密钥源：执行任务时如果未指定密钥源，将自动使用此密钥源">
                                <StarFilled style={{ color: '#faad14', fontSize: 14 }} />
                            </Tooltip>
                        )}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{typeConfig.label}</Text>
                </div>
                <Badge
                    status={isActive ? 'success' : 'default'}
                    text={<Text style={{ fontSize: 12 }}>{isActive ? '启用' : '禁用'}</Text>}
                />
            </div>

            {/* 信息区 */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <Tag color={authConfig.color} icon={authConfig.icon} style={{ margin: 0 }}>
                        {authConfig.label}
                    </Tag>
                    <Tag color="default" style={{ margin: 0 }}>
                        优先级: {source.priority}
                    </Tag>
                    {source.config?.query_key && (
                        <Tag color="blue" style={{ margin: 0 }}>
                            按 {source.config.query_key === 'ip' ? 'IP' : '主机名'} 查询
                        </Tag>
                    )}
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    创建于 {new Date(source.created_at).toLocaleString()}
                </Text>
            </div>

            {/* 操作按钮 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                <Space size={4}>
                    <Tooltip title={isActive ? "测试凭据" : "需要先启用才能测试"}>
                        <Button
                            type="text"
                            size="small"
                            icon={isTesting ? <Spin size="small" /> : <ApiOutlined />}
                            onClick={() => onTest(source)}
                            disabled={isTesting || !isActive}
                            style={{ color: isActive ? '#1890ff' : '#d9d9d9' }}
                        />
                    </Tooltip>
                    <Tooltip title="查看详情">
                        <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => onDetail(source)} />
                    </Tooltip>
                    <Tooltip title={canManage ? "编辑" : "无权限"}>
                        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(source)} disabled={!canManage} />
                    </Tooltip>
                    {source.is_default ? (
                        <Tooltip title="取消默认">
                            <Button type="text" size="small" icon={<StarFilled style={{ color: '#faad14' }} />} onClick={() => onCancelDefault(source)} />
                        </Tooltip>
                    ) : (
                        <Tooltip title={isActive ? "设为默认（执行任务时未指定密钥源将自动使用）" : "需要先启用才能设为默认"}>
                            <Button
                                type="text"
                                size="small"
                                icon={<StarOutlined style={{ color: isActive ? undefined : '#d9d9d9' }} />}
                                onClick={() => onSetDefault(source)}
                                disabled={!isActive}
                            />
                        </Tooltip>
                    )}
                </Space>
                <Space size={4}>
                    <Tooltip title={isActive ? '禁用' : '启用'}>
                        <Switch
                            size="small"
                            checked={isActive}
                            onChange={() => onToggleStatus(source)}
                            disabled={!canManage}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="确定删除该密钥源？"
                        description="删除后不可恢复"
                        onConfirm={() => onDelete(source.id)}
                    >
                        <Tooltip title={canManage ? "删除" : "无权限"}>
                            <Button type="text" size="small" danger icon={<DeleteOutlined />} disabled={!canManage} />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            </div>
        </Card>
    );
});

// ==================== 主组件 ====================
const SecretsSourceList: React.FC = () => {
    const access = useAccess();
    const [sources, setSources] = useState<AutoHealing.SecretsSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterAuthType, setFilterAuthType] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('priority_desc'); // 排序方式

    // 操作状态
    const [testingId, setTestingId] = useState<string>();

    // 模态框状态
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [editingSource, setEditingSource] = useState<AutoHealing.SecretsSource | null>(null);

    // 测试凭据弹窗状态 - 使用 HostSelector 简化逻辑
    const [testQueryModalOpen, setTestQueryModalOpen] = useState(false);
    const [testQuerySource, setTestQuerySource] = useState<AutoHealing.SecretsSource | null>(null);
    const [selectedTestHostIps, setSelectedTestHostIps] = useState<string[]>([]); // 选中的主机IP

    // 测试结果弹窗状态
    const [testResultModalOpen, setTestResultModalOpen] = useState(false);
    const [testResults, setTestResults] = useState<{
        success_count: number;
        fail_count: number;
        results: AutoHealing.TestQueryBatchResult[];
    } | null>(null);

    // 详情抽屉状态
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentSource, setCurrentSource] = useState<AutoHealing.SecretsSource | null>(null);

    // 分页状态
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(16);

    // 加载数据
    const loadSources = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await getSecretsSources();
            setSources(res.data || []);
        } catch {
            // 全局错误处理
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => { loadSources(); }, [loadSources]);

    // 使用 useMemo 缓存过滤结果
    const filteredSources = useMemo(() => {
        let result = sources.filter(s => {
            const matchSearch = !searchText || s.name.toLowerCase().includes(searchText.toLowerCase());
            const matchType = filterType === 'all' || s.type === filterType;
            const matchAuthType = filterAuthType === 'all' || s.auth_type === filterAuthType;
            return matchSearch && matchType && matchAuthType;
        });

        // 排序：默认排序方式时，默认的始终排最前
        result.sort((a, b) => {
            // 只有默认排序方式时，默认的优先
            if (sortBy === 'priority_desc') {
                if (a.is_default && !b.is_default) return -1;
                if (!a.is_default && b.is_default) return 1;
            }
            // 其他按选定规则排序
            switch (sortBy) {
                case 'priority_desc':
                    return (b.priority || 0) - (a.priority || 0);
                case 'priority_asc':
                    return (a.priority || 0) - (b.priority || 0);
                case 'created_desc':
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case 'created_asc':
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'name_asc':
                    return a.name.localeCompare(b.name);
                case 'name_desc':
                    return b.name.localeCompare(a.name);
                default:
                    return 0;
            }
        });

        return result;
    }, [sources, searchText, filterType, filterAuthType, sortBy]);

    // 分页后的数据
    const paginatedSources = useMemo(() =>
        filteredSources.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        , [filteredSources, currentPage, pageSize]);

    // 筛选条件变化时重置页码
    useEffect(() => { setCurrentPage(1); }, [searchText, filterType, filterAuthType]);

    // 使用 useMemo 缓存统计数据
    const stats = useMemo(() => ({
        total: sources.length,
        active: sources.filter(s => s.status === 'active').length,
        file: sources.filter(s => s.type === 'file').length,
        vault: sources.filter(s => s.type === 'vault').length,
        webhook: sources.filter(s => s.type === 'webhook').length,
        sshKey: sources.filter(s => s.auth_type === 'ssh_key').length,
        password: sources.filter(s => s.auth_type === 'password').length,
    }), [sources]);

    // 使用 useCallback 缓存回调函数
    // 打开测试弹窗
    const handleOpenTestQuery = useCallback(async (source: AutoHealing.SecretsSource) => {
        setTestQuerySource(source);
        setSelectedTestHostIps([]); // 重置选择
        setTestQueryModalOpen(true);
    }, []);

    // 执行测试凭据（批量）
    const handleTestQuery = useCallback(async () => {
        if (!testQuerySource) return;
        if (selectedTestHostIps.length === 0) {
            message.error('请先选择要测试的主机');
            return;
        }

        setTestingId(testQuerySource.id);

        try {
            // 构建批量请求 - HostSelector 只返回 IP, 这里直接映射
            const hosts = selectedTestHostIps.map(ip => ({
                hostname: ip, // HostSelector 只给 IP，暂用 IP 作为 Hostname
                ip_address: ip,
            }));

            const res = await testSecretsQuery(testQuerySource.id, { hosts });

            // 解析批量响应
            const data = res.data as { success_count: number; fail_count: number; results: AutoHealing.TestQueryBatchResult[] };

            // 关闭选择弹窗，显示结果弹窗
            setTestQueryModalOpen(false);
            setTestResults(data);
            setTestResultModalOpen(true);
            loadSources(true);
        } catch {
            message.error('测试请求失败');
        } finally {
            setTestingId(undefined);
        }
    }, [testQuerySource, selectedTestHostIps, loadSources]);

    const handleDelete = useCallback(async (id: string) => {
        try {
            await deleteSecretsSource(id);
            message.success('已删除');
            loadSources(true);
        } catch {
            // 错误由全局处理
        }
    }, [loadSources]);

    const handleSetDefault = useCallback(async (source: AutoHealing.SecretsSource) => {
        try {
            await updateSecretsSource(source.id, { is_default: true });
            message.success('已设为默认');
            loadSources(true);
        } catch {
            // 错误由全局处理
        }
    }, [loadSources]);

    // 取消默认
    const handleCancelDefault = useCallback(async (source: AutoHealing.SecretsSource) => {
        try {
            await updateSecretsSource(source.id, { is_default: false });
            message.success('已取消默认');
            loadSources(true);
        } catch {
            // 错误由全局处理
        }
    }, [loadSources]);

    // 启用/禁用（使用新 API）
    const handleToggleStatus = useCallback(async (source: AutoHealing.SecretsSource) => {
        try {
            if (source.status === 'active') {
                // 禁用
                await disableSecretsSource(source.id);
                message.success('已禁用');
            } else {
                // 启用（需要先通过 test-query）
                await enableSecretsSource(source.id);
                message.success('已启用');
            }
            loadSources(true);
        } catch {
            // 错误由全局处理
        }
    }, [loadSources]);

    const openCreate = useCallback(() => {
        setEditingSource(null);
        setModalMode('create');
        setModalOpen(true);
    }, []);

    const openEdit = useCallback((source: AutoHealing.SecretsSource) => {
        setEditingSource(source);
        setModalMode('edit');
        setModalOpen(true);
    }, []);

    const openDetail = useCallback((source: AutoHealing.SecretsSource) => {
        setCurrentSource(source);
        setDrawerOpen(true);
    }, []);

    const closeModal = useCallback(() => setModalOpen(false), []);
    const closeDrawer = useCallback(() => setDrawerOpen(false), []);

    const handleModalSuccess = useCallback(() => {
        setModalOpen(false);
        loadSources(true);
    }, [loadSources]);

    // 渲染统计卡片
    const statsCards = useMemo(() => (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={6} lg={4}>
                <ProCard hoverable>
                    <Statistic
                        title={<Text style={{ fontSize: 13 }}>总数</Text>}
                        value={stats.total}
                        valueStyle={{ color: '#1890ff', fontSize: 28 }}
                        prefix={<CloudOutlined style={{ marginRight: 4 }} />}
                    />
                </ProCard>
            </Col>
            <Col xs={12} sm={6} lg={4}>
                <ProCard hoverable>
                    <Statistic
                        title={<Text style={{ fontSize: 13 }}>已启用</Text>}
                        value={stats.active}
                        valueStyle={{ color: '#52c41a', fontSize: 28 }}
                        prefix={<CheckCircleOutlined style={{ marginRight: 4 }} />}
                    />
                </ProCard>
            </Col>
            <Col xs={12} sm={6} lg={4}>
                <ProCard hoverable>
                    <Statistic
                        title={<Text style={{ fontSize: 13 }}>文件类型</Text>}
                        value={stats.file}
                        valueStyle={{ color: '#1890ff', fontSize: 28 }}
                        prefix={<FileOutlined style={{ marginRight: 4 }} />}
                    />
                </ProCard>
            </Col>
            <Col xs={12} sm={6} lg={4}>
                <ProCard hoverable>
                    <Statistic
                        title={<Text style={{ fontSize: 13 }}>Vault</Text>}
                        value={stats.vault}
                        valueStyle={{ color: '#722ed1', fontSize: 28 }}
                        prefix={<SafetyCertificateOutlined style={{ marginRight: 4 }} />}
                    />
                </ProCard>
            </Col>
            <Col xs={12} sm={6} lg={4}>
                <ProCard hoverable>
                    <Statistic
                        title={<Text style={{ fontSize: 13 }}>SSH 密钥</Text>}
                        value={stats.sshKey}
                        valueStyle={{ color: '#1890ff', fontSize: 28 }}
                        prefix={<KeyOutlined style={{ marginRight: 4 }} />}
                    />
                </ProCard>
            </Col>
            <Col xs={12} sm={6} lg={4}>
                <ProCard hoverable>
                    <Statistic
                        title={<Text style={{ fontSize: 13 }}>密码认证</Text>}
                        value={stats.password}
                        valueStyle={{ color: '#fa8c16', fontSize: 28 }}
                        prefix={<LockOutlined style={{ marginRight: 4 }} />}
                    />
                </ProCard>
            </Col>
        </Row>
    ), [stats]);

    // 渲染详情抽屉
    const renderDrawer = () => {
        if (!currentSource) return null;
        const typeConfig = getSourceTypeConfig(currentSource.type);
        const authConfig = getAuthTypeConfig(currentSource.auth_type);

        return (
            <Drawer
                title={
                    <Space>
                        <Avatar size="small" style={{ backgroundColor: typeConfig.bgColor, color: typeConfig.color }} icon={typeConfig.icon} />
                        {currentSource.name}
                    </Space>
                }
                width={520}
                open={drawerOpen}
                onClose={closeDrawer}
            >
                {/* 状态卡片 */}
                <Card size="small" style={{ marginBottom: 16 }}>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Text type="secondary" style={{ fontSize: 12 }}>状态</Text>
                            <div>
                                <Badge
                                    status={currentSource.status === 'active' ? 'success' : 'default'}
                                    text={<Text strong>{currentSource.status === 'active' ? '已启用' : '已禁用'}</Text>}
                                />
                            </div>
                        </Col>
                        <Col span={8}>
                            <Text type="secondary" style={{ fontSize: 12 }}>类型</Text>
                            <div>
                                <Space size={4}>
                                    {typeConfig.icon}
                                    <Text strong style={{ color: typeConfig.color }}>{typeConfig.label}</Text>
                                </Space>
                            </div>
                        </Col>
                        <Col span={8}>
                            <Text type="secondary" style={{ fontSize: 12 }}>认证方式</Text>
                            <div>
                                <Tag color={authConfig.color} icon={authConfig.icon}>{authConfig.label}</Tag>
                            </div>
                        </Col>
                    </Row>
                </Card>

                {/* 基本信息 */}
                <Descriptions title="基本信息" column={2} size="small" bordered style={{ marginBottom: 16 }}>
                    <Descriptions.Item label="名称" span={2}>{currentSource.name}</Descriptions.Item>
                    <Descriptions.Item label="优先级">{currentSource.priority}</Descriptions.Item>
                    <Descriptions.Item label="默认">{currentSource.is_default ? '是' : '否'}</Descriptions.Item>
                    <Descriptions.Item label="创建时间" span={2}>
                        {new Date(currentSource.created_at).toLocaleString()}
                    </Descriptions.Item>
                </Descriptions>

                {/* 配置信息 */}
                <Descriptions title="连接配置" column={1} size="small" bordered style={{ marginBottom: 16 }}>
                    {currentSource.type === 'file' && (
                        <Descriptions.Item label="文件路径">
                            <Text code copyable>{currentSource.config?.path || '-'}</Text>
                        </Descriptions.Item>
                    )}
                    {currentSource.type === 'vault' && (
                        <>
                            <Descriptions.Item label="Vault 地址">
                                <Text code copyable>{currentSource.config?.address || '-'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Secret 路径">
                                <Text code>{currentSource.config?.path || currentSource.config?.path_template || '-'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Token">
                                <Text type="secondary">••••••••</Text>
                            </Descriptions.Item>
                        </>
                    )}
                    {currentSource.type === 'webhook' && (
                        <>
                            <Descriptions.Item label="URL">
                                <Text code copyable style={{ wordBreak: 'break-all' }}>{currentSource.config?.url || '-'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="请求方法">
                                <Tag>{currentSource.config?.method || 'POST'}</Tag>
                            </Descriptions.Item>
                        </>
                    )}
                </Descriptions>

                {/* 原始配置 */}
                <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>原始配置 (JSON)</Text>
                    <pre style={{
                        background: '#1e1e1e',
                        color: '#d4d4d4',
                        padding: 16,
                        // borderRadius: 8,
                        overflow: 'auto',
                        fontSize: 12,
                        margin: 0,
                        maxHeight: 200,
                    }}>
                        {JSON.stringify(currentSource.config, null, 2)}
                    </pre>
                </div>

                {/* 操作按钮 */}
                <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
                    <Button type="primary" icon={<ApiOutlined />} onClick={() => handleOpenTestQuery(currentSource)}>
                        测试凭据
                    </Button>
                    <Button icon={<EditOutlined />} onClick={() => { closeDrawer(); openEdit(currentSource); }}>
                        编辑配置
                    </Button>
                </div>
            </Drawer>
        );
    };

    return (
        <PageContainer
            ghost
            header={{
                title: <><KeyOutlined /> 密钥管理 / SECRETS</>,
                subTitle: '管理 SSH 凭据来源，支持文件、Vault、Webhook 等多种方式',
            }}
        >
            {statsCards}

            {/* 工具栏 */}
            <ProCard style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <Space wrap>
                        <Input
                            placeholder="搜索密钥源..."
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            allowClear
                            style={{ width: 220 }}
                        />
                        <Select
                            value={filterType}
                            onChange={setFilterType}
                            style={{ width: 140 }}
                            options={[
                                { value: 'all', label: '全部类型' },
                                { value: 'file', label: '📄 文件' },
                                { value: 'vault', label: '🔐 Vault' },
                                { value: 'webhook', label: '🌐 Webhook' },
                            ]}
                        />
                        <Select
                            value={filterAuthType}
                            onChange={setFilterAuthType}
                            style={{ width: 140 }}
                            options={[
                                { value: 'all', label: '全部认证' },
                                { value: 'ssh_key', label: '🔑 SSH 密钥' },
                                { value: 'password', label: '🔒 密码' },
                            ]}
                        />
                        <Select
                            value={sortBy}
                            onChange={setSortBy}
                            style={{ width: 160 }}
                            options={[
                                { value: 'priority_desc', label: '📊 优先级 高→低' },
                                { value: 'priority_asc', label: '📊 优先级 低→高' },
                                { value: 'created_desc', label: '🕐 创建时间 新→旧' },
                                { value: 'created_asc', label: '🕐 创建时间 旧→新' },
                                { value: 'name_asc', label: '🔤 名称 A→Z' },
                                { value: 'name_desc', label: '🔤 名称 Z→A' },
                            ]}
                        />
                    </Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} size="large" disabled={!access.canManageSecrets}>
                        添加密钥源
                    </Button>
                </div>
            </ProCard>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 80 }}>
                    <Spin size="large" />
                </div>
            ) : filteredSources.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={sources.length === 0 ? '暂无密钥源' : '没有匹配的结果'}
                >
                    {sources.length === 0 && (
                        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                            添加第一个密钥源
                        </Button>
                    )}
                </Empty>
            ) : (
                <>
                    <Row gutter={[16, 16]}>
                        {paginatedSources.map(source => (
                            <Col xs={24} sm={12} lg={8} xl={6} key={source.id}>
                                <SourceCard
                                    source={source}
                                    isTesting={testingId === source.id}
                                    onTest={handleOpenTestQuery}
                                    onDetail={openDetail}
                                    onEdit={openEdit}
                                    onSetDefault={handleSetDefault}
                                    onCancelDefault={handleCancelDefault}
                                    onToggleStatus={handleToggleStatus}
                                    onDelete={handleDelete}
                                    canManage={!!access.canManageSecrets}
                                />
                            </Col>
                        ))}
                    </Row>
                    {/* 分页 - 始终显示 */}
                    <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', background: '#fff', padding: '12px 16px' }}>
                        <Pagination
                            current={currentPage}
                            pageSize={pageSize}
                            total={filteredSources.length}
                            showSizeChanger
                            showQuickJumper
                            showTotal={(total) => `共 ${total} 条`}
                            pageSizeOptions={['16', '32', '64']}
                            onChange={(page, size) => {
                                setCurrentPage(page);
                                setPageSize(size);
                            }}
                        />
                    </div>
                </>
            )}

            {/* 创建/编辑模态框 */}
            <SourceModal
                open={modalOpen}
                mode={modalMode}
                source={editingSource}
                onCancel={closeModal}
                onSuccess={handleModalSuccess}
            />

            {/* 测试凭据弹窗 - 专业主机选择器 */}
            <Modal
                title={`测试凭据 - ${testQuerySource?.name || ''}`}
                open={testQueryModalOpen}
                onCancel={() => setTestQueryModalOpen(false)}
                onOk={handleTestQuery}
                okText="测试"
                cancelText="取消"
                confirmLoading={!!testingId}
                width={800}
                styles={{ body: { padding: 0 } }}
            >
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                    <Alert
                        type="info"
                        showIcon
                        message={testQuerySource?.config?.query_key
                            ? `当前密钥源按 ${testQuerySource.config.query_key === 'ip' ? 'IP' : '主机名'} 查询凭据`
                            : '当前密钥源所有主机共用同一凭据'}
                        style={{ marginBottom: 0 }}
                    />
                </div>

                {/* 使用 HostSelector 组件替代原有的手动选择/搜索逻辑 */}
                <div style={{ padding: 24 }}>
                    <div style={{ marginBottom: 12 }}>
                        <Text strong>选择要测试的主机：</Text>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                            请选择一到多台主机进行凭据有效性测试。测试过程将尝试使用该密钥源的配置连接到目标主机。
                        </div>
                    </div>
                    <HostSelector
                        value={selectedTestHostIps}
                        onChange={setSelectedTestHostIps}
                    />
                </div>
            </Modal>

            {/* 测试结果弹窗 */}
            <Modal
                title="测试结果"
                open={testResultModalOpen}
                onCancel={() => setTestResultModalOpen(false)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setTestResultModalOpen(false)}>
                        关闭
                    </Button>
                ]}
                width={600}
            >
                {testResults && (
                    <>
                        <Row gutter={12} style={{ marginBottom: 12 }}>
                            <Col span={8}>
                                <Card size="small">
                                    <Statistic title="总数" value={testResults.success_count + testResults.fail_count} />
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card size="small">
                                    <Statistic title="成功" value={testResults.success_count} valueStyle={{ color: '#52c41a' }} />
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card size="small">
                                    <Statistic title="失败" value={testResults.fail_count} valueStyle={{ color: '#ff4d4f' }} />
                                </Card>
                            </Col>
                        </Row>
                        <div style={{ maxHeight: 350, overflow: 'auto' }}>
                            {testResults.results.map((r, i) => (
                                <div key={i} style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid #f0f0f0',
                                    background: r.success ? '#f6ffed' : '#fff2f0',
                                    borderRadius: 6,
                                    marginBottom: 8,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: r.success ? 0 : 6 }}>
                                        {r.success ?
                                            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} /> :
                                            <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
                                        }
                                        <Text strong>{r.hostname || r.ip_address}</Text>
                                        {r.hostname && <Text type="secondary" style={{ fontSize: 12 }}>({r.ip_address})</Text>}
                                        {r.success && (
                                            <Tag color="green" style={{ marginLeft: 'auto' }}>
                                                {r.auth_type === 'ssh_key' ? 'SSH密钥' : '密码'}
                                            </Tag>
                                        )}
                                    </div>
                                    {!r.success && (
                                        <div style={{ marginLeft: 24 }}>
                                            <Text type="danger" style={{ fontSize: 12, wordBreak: 'break-all' }}>{r.message}</Text>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </Modal>

            {renderDrawer()}
        </PageContainer>
    );
};

// ==================== 模态框组件 ====================
interface SourceModalProps {
    open: boolean;
    mode: 'create' | 'edit';
    source: AutoHealing.SecretsSource | null;
    onCancel: () => void;
    onSuccess: () => void;
}

const SourceModal: React.FC<SourceModalProps> = ({ open, mode, source, onCancel, onSuccess }) => {
    const [form] = Form.useForm();
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const authType = Form.useWatch('auth_type', form) || 'ssh_key';
    const sourceType = Form.useWatch('type', form) || 'file';
    const vaultAuthType = Form.useWatch('vault_auth_type', form) || 'token';
    const webhookAuthType = Form.useWatch('webhook_auth_type', form) || 'none';

    // 根据认证类型过滤可用的密钥源类型
    const availableSourceTypes = SOURCE_TYPES.filter(t =>
        authType === 'ssh_key' || t.supportPassword
    );

    // 打开时初始化
    useEffect(() => {
        if (open) {
            setStep(0);
            if (mode === 'edit' && source) {
                const config = source.config || {};
                form.setFieldsValue({
                    name: source.name,
                    auth_type: source.auth_type,
                    type: source.type,
                    priority: source.priority,
                    is_default: source.is_default,
                    // File 配置
                    file_key_path: config.key_path,
                    file_username: config.username,
                    // Vault 配置
                    vault_address: config.address,
                    vault_secret_path: config.secret_path,
                    vault_query_key: config.query_key,
                    vault_auth_type: config.auth?.type || 'token',
                    vault_token: config.auth?.token,
                    vault_role_id: config.auth?.role_id,
                    vault_secret_id: config.auth?.secret_id,
                    vault_field_username: config.field_mapping?.username,
                    vault_field_password: config.field_mapping?.password,
                    vault_field_private_key: config.field_mapping?.private_key,
                    // Webhook 配置
                    webhook_url: config.url,
                    webhook_method: config.method || 'GET',
                    webhook_query_key: config.query_key,
                    webhook_auth_type: config.auth?.type || 'none',
                    webhook_basic_username: config.auth?.username,
                    webhook_basic_password: config.auth?.password,
                    webhook_bearer_token: config.auth?.token,
                    webhook_api_key_header: config.auth?.header_name,
                    webhook_api_key: config.auth?.api_key,
                    webhook_response_path: config.response_data_path,
                    webhook_field_username: config.field_mapping?.username,
                    webhook_field_password: config.field_mapping?.password,
                    webhook_field_private_key: config.field_mapping?.private_key,
                });
            } else {
                form.resetFields();
                // 默认值
                form.setFieldsValue({
                    auth_type: 'ssh_key',
                    type: 'file',
                    priority: 100,
                    is_default: false,
                    vault_auth_type: 'token',
                    webhook_auth_type: 'none',
                    webhook_method: 'GET',
                });
            }
        }
    }, [open, mode, source, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            // 构建 Config 对象
            let config: any = {};
            if (values.type === 'file') {
                config = {
                    key_path: values.file_key_path,
                    username: values.file_username,
                };
            } else if (values.type === 'vault') {
                config = {
                    address: values.vault_address,
                    secret_path: values.vault_secret_path,
                    query_key: values.vault_query_key || undefined,
                    auth: {
                        type: values.vault_auth_type,
                        token: values.vault_token,
                        role_id: values.vault_role_id,
                        secret_id: values.vault_secret_id,
                    },
                    field_mapping: {
                        username: values.vault_field_username,
                        password: values.vault_field_password,
                        private_key: values.vault_field_private_key,
                    },
                };
            } else if (values.type === 'webhook') {
                config = {
                    url: values.webhook_url,
                    method: values.webhook_method,
                    query_key: values.webhook_query_key || undefined,
                    auth: {
                        type: values.webhook_auth_type,
                        username: values.webhook_basic_username,
                        password: values.webhook_basic_password,
                        token: values.webhook_bearer_token,
                        header_name: values.webhook_api_key_header,
                        api_key: values.webhook_api_key,
                    },
                    response_data_path: values.webhook_response_path,
                    field_mapping: {
                        username: values.webhook_field_username,
                        password: values.webhook_field_password,
                        private_key: values.webhook_field_private_key,
                    },
                };
            }

            const payload: any = {
                name: values.name,
                type: values.type,
                auth_type: values.auth_type,
                priority: values.priority,
                is_default: values.is_default,
                config,
            };

            if (mode === 'edit' && source) {
                await updateSecretsSource(source.id, payload);
                message.success('更新成功');
            } else {
                await createSecretsSource(payload);
                message.success('创建成功');
            }
            onSuccess();
        } catch {
            // error
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title={mode === 'create' ? '添加密钥源' : '编辑密钥源'}
            open={open}
            onCancel={onCancel}
            onOk={handleSubmit}
            confirmLoading={submitting}
            width={700}
            destroyOnClose
            maskClosable={false}
        >
            <Form form={form} layout="vertical">
                {/* 
                   Steps 布局或长表单布局。为简单起见，这里直接平铺，但用 Tabs 或 Collapse 分组也可以。
                   鉴于之前用户的需求，这里保持结构清晰即可。
                */}

                {/* 1. 基础信息 */}
                <Card size="small" title="基础信息" style={{ marginBottom: 16 }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
                                <Input placeholder="例如：生产环境 Vault" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="priority" label="优先级" tooltip="数字越大越优先，多源共存时按优先级尝试获取" initialValue={100}>
                                <Input type="number" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="auth_type" label="凭据类型" rules={[{ required: true }]}>
                                <Select options={AUTH_TYPES} disabled={mode === 'edit'} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="type" label="密钥源类型" rules={[{ required: true }]}>
                                <Select options={availableSourceTypes} disabled={mode === 'edit'} />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="is_default" valuePropName="checked" noStyle>
                                <Checkbox>设为默认密钥源</Checkbox>
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                {/* 2. 差异化配置 */}
                <Card size="small" title="连接配置" style={{ marginBottom: 16 }}>
                    {/* ========== File ========== */}
                    {sourceType === 'file' && (
                        <>
                            <Alert type="info" message="从服务器本地文件系统读取私钥，适用于 Ansible 控制节点本地已有的密钥文件。" style={{ marginBottom: 16 }} />
                            <Form.Item name="file_key_path" label="私钥路径" rules={[{ required: true, message: '请输入私钥绝对路径' }]}>
                                <Input placeholder="/root/.ssh/id_rsa" />
                            </Form.Item>
                            <Form.Item name="file_username" label="默认用户名" tooltip="如果 Playbook 未指定用户名，将使用此用户名">
                                <Input placeholder="root" />
                            </Form.Item>
                        </>
                    )}

                    {/* ========== Vault ========== */}
                    {sourceType === 'vault' && (
                        <>
                            <Alert type="info" message="从 HashiCorp Vault读取凭据。支持 KV Secret Engine v1/v2。" style={{ marginBottom: 16 }} />
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="vault_address" label="Vault 地址" rules={[{ required: true }]}>
                                        <Input placeholder="http://127.0.0.1:8200" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="vault_auth_type" label="认证方式" initialValue="token">
                                        <Select options={VAULT_AUTH_TYPES} />
                                    </Form.Item>
                                </Col>
                            </Row>

                            {vaultAuthType === 'token' && (
                                <Form.Item name="vault_token" label="Token" rules={[{ required: true }]}>
                                    <Input.Password placeholder="Vault Token" />
                                </Form.Item>
                            )}

                            {vaultAuthType === 'approle' && (
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="vault_role_id" label="Role ID" rules={[{ required: true }]}>
                                            <Input />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="vault_secret_id" label="Secret ID" rules={[{ required: true }]}>
                                            <Input.Password />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            )}

                            <Form.Item name="vault_secret_path" label="Secret 路径/模板" tooltip="支持变量 {hostname} {ip}，例如 secret/data/servers/{ip}" rules={[{ required: true }]}>
                                <Input placeholder="secret/data/myserver" />
                            </Form.Item>

                            <Form.Item name="vault_query_key" label="查询键" tooltip="用于替换路径模板中的变量">
                                <Select allowClear options={[{ label: '主机名', value: 'hostname' }, { label: 'IP 地址', value: 'ip' }]} />
                            </Form.Item>

                            <Text strong style={{ display: 'block', marginBottom: 12, marginTop: 12 }}>字段映射 (JSON Key)</Text>
                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item name="vault_field_username" label="用户名 Key">
                                        <Input placeholder="username" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name="vault_field_password" label="密码 Key">
                                        <Input placeholder="password" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name="vault_field_private_key" label="私钥 Key">
                                        <Input placeholder="private_key" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </>
                    )}

                    {/* ========== Webhook ========== */}
                    {sourceType === 'webhook' && (
                        <>
                            <Alert type="info" message="通过 HTTP 请求从外部系统获取凭据。" style={{ marginBottom: 16 }} />
                            <Row gutter={16}>
                                <Col span={18}>
                                    <Form.Item name="webhook_url" label="URL 地址" rules={[{ required: true }]}>
                                        <Input placeholder="http://api.internal/get-secret?ip={ip}" />
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item name="webhook_method" label="方法" initialValue="GET">
                                        <Select options={[{ value: 'GET', label: 'GET' }, { value: 'POST', label: 'POST' }]} />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item name="webhook_auth_type" label="认证方式" initialValue="none">
                                <Select options={WEBHOOK_AUTH_TYPES} />
                            </Form.Item>

                            {webhookAuthType === 'basic' && (
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="webhook_basic_username" label="Username">
                                            <Input />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="webhook_basic_password" label="Password">
                                            <Input.Password />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            )}

                            {webhookAuthType === 'bearer' && (
                                <Form.Item name="webhook_bearer_token" label="Token">
                                    <Input.Password />
                                </Form.Item>
                            )}

                            {webhookAuthType === 'api_key' && (
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="webhook_api_key_header" label="Header Name">
                                            <Input placeholder="X-API-Key" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="webhook_api_key" label="API Key">
                                            <Input.Password />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            )}

                            <Form.Item name="webhook_response_path" label="响应数据路径" tooltip="JSON 路径，例如 data.credential">
                                <Input placeholder="data" />
                            </Form.Item>

                            <Text strong style={{ display: 'block', marginBottom: 12, marginTop: 12 }}>字段映射 (JSON Key)</Text>
                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item name="webhook_field_username" label="用户名 Key">
                                        <Input placeholder="username" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name="webhook_field_password" label="密码 Key">
                                        <Input placeholder="password" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name="webhook_field_private_key" label="私钥 Key">
                                        <Input placeholder="private_key" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </>
                    )}
                </Card>
            </Form>
        </Modal>
    );
};

export default SecretsSourceList;

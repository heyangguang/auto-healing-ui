import {
    PlayCircleOutlined, ThunderboltOutlined, SendOutlined, ReloadOutlined,
    SearchOutlined, CodeOutlined, RocketOutlined, ArrowLeftOutlined,
    ClusterOutlined, SafetyCertificateOutlined, WarningOutlined,
    SyncOutlined, PlusOutlined, DeleteOutlined, BellOutlined,
    MailOutlined, StopOutlined, CheckCircleOutlined, PhoneOutlined, ClockCircleOutlined, CalendarOutlined,
    UserOutlined, KeyOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
    Button, message, Space, Tag, Card, Row, Col, Typography, Select,
    Alert, Avatar, Empty, Spin, Input, Divider, Tooltip, Switch, Checkbox, Pagination
} from 'antd';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { history, useAccess } from '@umijs/max';
import { getExecutionTasks, executeTask, confirmExecutionTaskReview } from '@/services/auto-healing/execution';
import { getPlaybook } from '@/services/auto-healing/playbooks';
import { getSecretsSources } from '@/services/auto-healing/secrets';
import { getChannels, getTemplates } from '@/services/auto-healing/notification';
import VariableInput, { extractDefaultValue } from '@/components/VariableInput';
import HostList from './components/HostList';
import HostSelector from '@/components/HostSelector';
import SecretsSelector from '@/components/SecretsSelector';
import NotificationConfigDisplay from '@/components/NotificationSelector/NotificationConfigDisplay';

const { Text } = Typography;

const ExecuteTaskPage: React.FC = () => {
    const access = useAccess();
    const [mode, setMode] = useState<'selection' | 'execution'>('selection');
    const [templates, setTemplates] = useState<AutoHealing.ExecutionTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    // Advanced Filters
    const [filterExecutor, setFilterExecutor] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterPlaybook, setFilterPlaybook] = useState<string>('');
    const [onlyReady, setOnlyReady] = useState(false);
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalTemplates, setTotalTemplates] = useState(0);
    const [initialized, setInitialized] = useState(false); // 等待所有数据加载完成
    const [pageSize, setPageSize] = useState(16); // Default 16 for better grid fit

    // Execution Context
    const [selectedTemplate, setSelectedTemplate] = useState<AutoHealing.ExecutionTask>();
    const [templatePlaybook, setTemplatePlaybook] = useState<AutoHealing.Playbook>();
    const [loadingPlaybook, setLoadingPlaybook] = useState(false);

    // Configuration State
    const [variableValues, setVariableValues] = useState<Record<string, any>>({});
    const [executing, setExecuting] = useState(false);
    const [syncing, setSyncing] = useState(false);

    // Merge Logic State
    const [additionalHosts, setAdditionalHosts] = useState<string[]>([]);
    const [additionalSecretIds, setAdditionalSecretIds] = useState<string[]>([]);

    // Notification State
    const [skipNotification, setSkipNotification] = useState(false);
    const [channels, setChannels] = useState<AutoHealing.NotificationChannel[]>([]);
    const [notifyTemplates, setNotifyTemplates] = useState<AutoHealing.NotificationTemplate[]>([]);;

    // Reference Data
    const [secretsSources, setSecretsSources] = useState<AutoHealing.SecretsSource[]>([]);
    const [playbooksList, setPlaybooksList] = useState<AutoHealing.Playbook[]>([]);

    // ==================== Data Loading ====================

    const loadTemplates = useCallback(async (params?: {
        page?: number;
        search?: string;
        executor_type?: string;
        status?: string;
        playbook_id?: string;
    }) => {
        setLoading(true);
        try {
            const res = await getExecutionTasks({
                page: params?.page || 1,
                page_size: pageSize,
                search: params?.search || undefined,
                executor_type: params?.executor_type || undefined,
                status: params?.status || undefined,
                playbook_id: params?.playbook_id || undefined,
            });
            setTotalTemplates(res.total || 0);
            return res.data || [];
        } catch { return []; }
        finally { setLoading(false); }
    }, [pageSize]);

    const loadDependencies = useCallback(async () => {
        try {
            const [secretsRes, channelsRes, templatesRes, playbooksRes] = await Promise.all([
                getSecretsSources(),
                getChannels({ page_size: 100 }),
                getTemplates({ page_size: 100 }),
                import('@/services/auto-healing/playbooks').then(m => m.getPlaybooks({ page_size: 100 }))
            ]);
            setSecretsSources(secretsRes.data || []);
            setChannels(channelsRes.data || []);
            setNotifyTemplates(templatesRes.data || []);
            setPlaybooksList(playbooksRes.data || playbooksRes.items || []);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        const init = async () => {
            // 并行加载所有数据
            const [loadedTemplates] = await Promise.all([
                loadTemplates(),
                loadDependencies()
            ]);
            setTemplates(loadedTemplates);
            setInitialized(true); // 所有数据加载完成

            // Check URL for pre-selection
            const urlParams = new URLSearchParams(window.location.search);
            const templateId = urlParams.get('template');
            if (templateId && loadedTemplates.length > 0) {
                const found = loadedTemplates.find((t: AutoHealing.ExecutionTask) => t.id === templateId);
                if (found) handleSelectTemplate(found);
            }
        };
        init();
    }, []);

    // Server-side filtering - templates are already filtered by server
    // Only need client-side filter for 'onlyReady' toggle since backend doesn't support this specific logic
    const filteredTemplates = useMemo(() => {
        if (!onlyReady) return templates;
        return templates.filter(t => !t.needs_review && t.playbook?.status === 'ready');
    }, [templates, onlyReady]);

    // Reload templates when filters change
    useEffect(() => {
        const doLoad = async () => {
            // Map frontend status values to backend API values
            let apiStatus = '';
            if (filterStatus === 'ready') apiStatus = 'ready';
            else if (filterStatus === 'review') apiStatus = 'pending_review';
            // Note: 'offline' status is client-side only since backend doesn't directly support it

            const loadedTemplates = await loadTemplates({
                page: currentPage,
                search: searchText || undefined,
                executor_type: filterExecutor || undefined,
                status: apiStatus || undefined,
                playbook_id: filterPlaybook || undefined,
            });
            setTemplates(loadedTemplates);
        };
        doLoad();
    }, [currentPage, pageSize, searchText, filterExecutor, filterStatus, filterPlaybook]);

    // Reset page when filters change (except page itself)
    useEffect(() => {
        setCurrentPage(1);
    }, [searchText, filterExecutor, filterPlaybook, filterStatus, onlyReady]);

    // ==================== Actions ====================

    const handleSelectTemplate = async (template: AutoHealing.ExecutionTask) => {
        // Strict blocking: Cannot select if review is needed
        if (template.needs_review) {
            message.warning('任务模板需审核：请前往“任务模板管理”确认 Playbook 变更后方可执行。');
            return;
        }

        // Check Playbook status - use embedded playbook object from API
        if (!template.playbook || template.playbook.status !== 'ready') {
            message.warning('Playbook 未上线：只有上线状态的 Playbook 才能执行。');
            return;
        }

        setSelectedTemplate(template);
        setMode('execution');

        // Reset merge states
        setAdditionalHosts([]);
        setAdditionalSecretIds([]);
        setSkipNotification(false);

        // Initialize variables logic
        const initialVars: Record<string, any> = {};

        // 1. First, apply any existing extra_vars from the template (overrides)
        if (template.extra_vars) {
            Object.entries(template.extra_vars).forEach(([k, v]) => {
                initialVars[k] = v;
            });
        }
        setVariableValues(initialVars);

        // 2. Load Playbook Metadata to extract defaults for any missing variables
        if (template.playbook_id) {
            setLoadingPlaybook(true);
            try {
                const res = await getPlaybook(template.playbook_id);
                setTemplatePlaybook(res.data);

                // Merge defaults from playbook variables
                const vars = res.data.variables || res.data.scanned_variables || [];
                vars.forEach((v: AutoHealing.PlaybookVariable) => {
                    // Fix: Ensure object types are stringified for the editor
                    if (initialVars[v.name] !== undefined) {
                        if ((v.type === 'object' || v.type === 'dict') && typeof initialVars[v.name] === 'object') {
                            try {
                                initialVars[v.name] = JSON.stringify(initialVars[v.name], null, 2);
                            } catch { /* ignore */ }
                        }
                    }

                    // Only set default if not already provided by template.extra_vars
                    if (initialVars[v.name] === undefined) {
                        const def = extractDefaultValue(v.default);
                        if (def !== undefined && def !== null) {
                            initialVars[v.name] = def;
                        }
                    }
                });
                setVariableValues({ ...initialVars });
            } catch { /* ignore */ }
            finally { setLoadingPlaybook(false); }
        }
    };



    const handleBack = () => {
        setMode('selection');
        setSelectedTemplate(undefined);
        setTemplatePlaybook(undefined);
    };

    const handleExecute = async () => {
        if (!selectedTemplate) return;
        setExecuting(true);

        const mergedSecrets = [
            ...(selectedTemplate.secrets_source_ids || []),
            ...additionalSecretIds
        ];

        // Hosts merging logic
        let finalHosts = selectedTemplate.target_hosts || '';
        if (additionalHosts.length > 0) {
            const added = additionalHosts.join(',');
            finalHosts = finalHosts ? `${finalHosts},${added}` : added;
        }

        try {
            const res = await executeTask(selectedTemplate.id, {
                triggered_by: 'manual',
                secrets_source_ids: mergedSecrets.length > 0 ? Array.from(new Set(mergedSecrets)) : undefined,
                extra_vars: Object.keys(variableValues).length > 0 ? variableValues : undefined,
                target_hosts: finalHosts,
                skip_notification: skipNotification
            });
            message.success('任务已启动：执行初始化成功');
            history.push(`/execution/runs/${res.data.id}`);
        } catch {
            // 错误消息由全局错误处理器显示
        } finally { setExecuting(false); }
    };

    const handleVariableChange = (name: string, value: any) => {
        setVariableValues(prev => ({ ...prev, [name]: value }));
    };

    // ==================== Logic: Notifications ====================
    // 新格式下每个触发器有自己的渠道，这里只判断是否有通知配置
    const hasNotificationConfig = useMemo(() => {
        return selectedTemplate?.notification_config?.enabled === true;
    }, [selectedTemplate]);

    // ==================== Render: Launchpad (Selection) ====================
    // Same as before...
    const renderLaunchpad = () => (
        <div className="mission-control-container" style={{ height: 'auto', overflow: 'visible' }}>
            <div className="launchpad-grid" style={{ height: 'auto', overflow: 'visible' }}>
                <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <Space wrap>
                        <Input
                            placeholder="搜索模板名称/Playbook/描述..."
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            allowClear
                            style={{ width: 240, borderRadius: 2 }}
                        />
                        <Select
                            placeholder="执行器"
                            allowClear
                            style={{ width: 100 }}
                            value={filterExecutor || undefined}
                            onChange={v => setFilterExecutor(v || '')}
                            options={[
                                { label: 'SSH', value: 'local' },
                                { label: 'Docker', value: 'docker' }
                            ]}
                        />
                        <Select
                            placeholder="状态"
                            allowClear
                            style={{ width: 100 }}
                            value={filterStatus || undefined}
                            onChange={v => setFilterStatus(v || '')}
                            options={[
                                { label: '就绪', value: 'ready' },
                                { label: '需审核', value: 'review' },
                                { label: '未上线', value: 'offline' }
                            ]}
                        />
                        <Select
                            placeholder="Playbook"
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            style={{ width: 160 }}
                            value={filterPlaybook || undefined}
                            onChange={v => setFilterPlaybook(v || '')}
                            options={playbooksList.map(p => ({ label: p.name, value: p.id }))}
                        />
                        <Checkbox checked={onlyReady} onChange={e => setOnlyReady(e.target.checked)}>
                            仅可执行
                        </Checkbox>
                        <Button icon={<ReloadOutlined />} onClick={loadTemplates} loading={loading} />
                    </Space>
                </div>

                {loading || !initialized ? (
                    <div style={{ textAlign: 'center', padding: 100 }}>
                        <Spin size="large" tip="加载中..." />
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<Text type="secondary">没有可用的发射任务</Text>}
                    >
                        <Button type="dashed" onClick={() => history.push('/execution/templates')}>
                            创建新模板
                        </Button>
                    </Empty>
                ) : (
                    <>
                        <Row gutter={[16, 16]}>
                            {filteredTemplates.map(template => (
                                <Col key={template.id} xs={24} sm={12} md={8} lg={6} xl={4}>
                                    <div
                                        className={`template-card ${selectedTemplate?.id === template.id ? 'template-card-active' : ''}`}
                                        onClick={() => handleSelectTemplate(template)}
                                        style={{
                                            // Only apply disabled styles when:
                                            // 1. needs_review is true, OR
                                            // 2. playbook is not ready
                                            opacity: (template.needs_review || template.playbook?.status !== 'ready') ? 0.6 : 1,
                                            cursor: (template.needs_review || template.playbook?.status !== 'ready') ? 'not-allowed' : 'pointer',
                                            position: 'relative',
                                            filter: (template.needs_review || template.playbook?.status !== 'ready') ? 'grayscale(100%)' : 'none'
                                        }}
                                    >
                                        <div style={{ padding: '16px 16px 12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                                                <Avatar
                                                    shape="square"
                                                    size={48}
                                                    style={{ backgroundColor: template.executor_type === 'docker' ? '#722ed1' : '#1890ff' }}
                                                    icon={<ThunderboltOutlined style={{ fontSize: 24 }} />}
                                                />
                                                {template.needs_review ? (
                                                    <Tag color="error" style={{ margin: 0, fontSize: 10, lineHeight: '18px' }}>
                                                        需审核
                                                    </Tag>
                                                ) : template.playbook?.status !== 'ready' ? (
                                                    <Tag color="warning" style={{ margin: 0, fontSize: 10, lineHeight: '18px' }}>
                                                        未上线
                                                    </Tag>
                                                ) : (
                                                    <Tag color="success" style={{ margin: 0, fontSize: 10, lineHeight: '18px' }}>
                                                        就绪
                                                    </Tag>
                                                )}
                                            </div>
                                            <div style={{ marginBottom: 8 }}>
                                                <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 4 }} ellipsis>
                                                    {template.name || '未命名任务'}
                                                </Text>
                                                <Space size={4} className="industrial-font">
                                                    <CodeOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
                                                    <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                                                        {template.playbook?.name || '-'}
                                                    </Text>
                                                </Space>
                                            </div>
                                            <div style={{ marginTop: 8 }}>
                                                {template.needs_review ? (
                                                    <Tag icon={<WarningOutlined />} color="error" style={{ margin: 0 }}>
                                                        需审核 / REVIEW
                                                    </Tag>
                                                ) : template.playbook?.status !== 'ready' ? (
                                                    <Tag icon={<StopOutlined />} color="warning" style={{ margin: 0 }}>
                                                        未上线 / OFFLINE
                                                    </Tag>
                                                ) : (
                                                    <Tag icon={<CheckCircleOutlined />} color="success" style={{ margin: 0 }}>
                                                        就绪 / READY
                                                    </Tag>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{
                                            borderTop: '1px solid #f0f0f0',
                                            padding: '8px 16px',
                                            background: '#fafafa',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <Space size={4}>
                                                <ClusterOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {template.target_hosts ? template.target_hosts.split(',').length : 0} 目标
                                                </Text>
                                            </Space>
                                            <Text type="secondary" style={{ fontSize: 10 }}>ID: {template.id.slice(0, 8)}</Text>
                                        </div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                            <Pagination
                                current={currentPage}
                                total={totalTemplates}
                                pageSize={pageSize}
                                onChange={(page, size) => {
                                    setCurrentPage(page);
                                    setPageSize(size);
                                }}
                                showSizeChanger={true}
                                pageSizeOptions={['16', '32', '64']}
                                showQuickJumper
                                showTotal={t => `共 ${t} 条`}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    // ==================== Render: Mission Control (Execution) ====================

    const renderMissionControl = () => {
        if (!selectedTemplate) return null;

        const variables = templatePlaybook?.variables || templatePlaybook?.scanned_variables || [];
        const requiredVars = variables.filter(v => v.required);
        const optionalVars = variables.filter(v => !v.required);

        // Pre-calculated counts for merge UI
        const templateSecretsCount = selectedTemplate.secrets_source_ids?.length || 0;
        const totalSecretsCount = templateSecretsCount + additionalSecretIds.length;

        const templateHostsCount = selectedTemplate.target_hosts?.split(',').filter(Boolean).length || 0;
        const additionalHostsCount = additionalHosts.length;
        const totalHostsCount = templateHostsCount + additionalHostsCount;

        return (
            <div className="mission-control-container" style={{ height: 'auto', overflow: 'visible' }}>
                <div className="execution-cockpit">
                    {/* LEFT PANEL: CONTEXT INTELLIGENCE */}
                    <div className="cockpit-sidebar">
                        <div className="sidebar-header">
                            <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack} style={{ marginBottom: 8 }}>
                                返回发射台
                            </Button>
                            <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>任务 ID</Text>
                                <div className="industrial-tag" style={{ fontSize: 16, fontWeight: 600 }}>
                                    #{selectedTemplate.id.slice(0, 8).toUpperCase()}
                                </div>
                            </div>
                        </div>

                        <div className="sidebar-content">
                            {selectedTemplate.needs_review && (
                                <Alert
                                    message="需人工审核"
                                    description={
                                        <div style={{ fontSize: 12 }}>
                                            Playbook 变量已变更
                                            <ul style={{ paddingLeft: 16, margin: '4px 0' }}>
                                                {selectedTemplate.changed_variables?.map(v => (
                                                    <li key={v}><Text type="danger" code>{v}</Text></li>
                                                ))}
                                            </ul>
                                        </div>
                                    }
                                    type="error"
                                    showIcon
                                    icon={<WarningOutlined />}
                                    style={{ marginBottom: 16 }}
                                    action={
                                        <Button size="small" danger onClick={handleConfirmReview} loading={syncing} icon={<SyncOutlined spin={syncing} />}>
                                            确认
                                        </Button>
                                    }
                                />
                            )}

                            <div className="info-block">
                                <div className="info-block-title">任务概览</div>
                                <Card size="small" bordered={false} style={{ background: '#f5f5f5' }}>
                                    <Text strong style={{ fontSize: 16 }}>{selectedTemplate.name}</Text>
                                    <Text type="secondary" style={{ display: 'block', margin: '4px 0 8px', fontSize: 12 }}>{selectedTemplate.description || '无描述'}</Text>
                                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Space size={4} className="text-secondary"><PlayCircleOutlined /> 关联剧本</Space>
                                            <Text ellipsis style={{ maxWidth: 120 }}>{templatePlaybook?.name || '-'}</Text>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Space size={4} className="text-secondary"><RocketOutlined /> 执行方式</Space>
                                            <Tag style={{ margin: 0 }}>{selectedTemplate.executor_type?.toUpperCase()}</Tag>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Space size={4} className="text-secondary"><ClusterOutlined /> 目标主机</Space>
                                            <Text strong>{selectedTemplate.target_hosts ? selectedTemplate.target_hosts.split(',').length : 0} 台</Text>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Space size={4} className="text-secondary"><CodeOutlined /> 变量参数</Space>
                                            <Text strong>{variables.length} 个</Text>
                                        </div>
                                        <Divider style={{ margin: '4px 0' }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Space size={4} className="text-secondary"><CalendarOutlined /> 创建时间</Space>
                                            <Text style={{ fontSize: 12 }}>{new Date(selectedTemplate.created_at).toLocaleString()}</Text>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Space size={4} className="text-secondary"><ClockCircleOutlined /> 更新时间</Space>
                                            <Text style={{ fontSize: 12 }}>{new Date(selectedTemplate.updated_at).toLocaleString()}</Text>
                                        </div>
                                    </Space>
                                </Card>
                            </div>

                            <div className="info-block">
                                <div className="info-block-title">
                                    <Space><BellOutlined /> 通知配置 (Notification)</Space>
                                </div>
                                <NotificationConfigDisplay
                                    value={selectedTemplate.notification_config}
                                    channels={channels}
                                    templates={notifyTemplates}
                                    compact
                                />

                                {/* 跳过通知选项 */}
                                {hasNotificationConfig && (
                                    <div style={{ marginTop: 12 }}>
                                        <Checkbox
                                            checked={skipNotification}
                                            onChange={e => setSkipNotification(e.target.checked)}
                                        >
                                            <Text type="secondary">本次执行跳过通知</Text>
                                        </Checkbox>
                                        {skipNotification && (
                                            <div style={{ marginTop: 4, marginLeft: 24 }}>
                                                <Text type="warning" style={{ fontSize: 11, color: '#faad14' }}>
                                                    ⚠️ 将跳过所有通知
                                                </Text>
                                            </div>
                                        )}
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: OPERATION DECK */}
                    <div className="cockpit-main">
                        <div className="main-header">
                            <Space align="center">
                                <ThunderboltOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                                <Title level={4} style={{ margin: 0 }}>操作控制台</Title>
                            </Space>
                            <Space size="large">
                                <Space>
                                    <Text type="secondary">HOSTS:</Text>
                                    <Text strong>{totalHostsCount}</Text>
                                </Space>
                                <Space>
                                    <Text type="secondary">SECRETS:</Text>
                                    <Text strong>{totalSecretsCount}</Text>
                                </Space>
                            </Space>
                        </div>

                        <div className="main-content">
                            <Row gutter={24}>
                                {/* Target Hosts */}
                                <Col span={12}>
                                    <div className="industrial-dashed-box" style={{ height: '100%' }}>
                                        <div className="industrial-dashed-box-title">
                                            <span><ClusterOutlined /> 目标主机 (Target Hosts)</span>
                                            <Tag color="blue">Merge Mode</Tag>
                                        </div>

                                        {/* Template Hosts (Read Only) */}
                                        <div style={{ marginBottom: 8 }}>
                                            <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>模板预设:</Text>
                                            <HostList hosts={selectedTemplate.target_hosts || ''} />
                                        </div>

                                        <Divider style={{ margin: '8px 0' }} dashed />

                                        {/* Additional Hosts Selector */}
                                        <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>临时追加:</Text>
                                        <HostSelector
                                            value={additionalHosts}
                                            onChange={setAdditionalHosts}
                                            excludeHosts={selectedTemplate.target_hosts?.split(',').filter(Boolean) || []}
                                        />
                                    </div>
                                </Col>

                                {/* Secrets */}
                                <Col span={12}>
                                    <div className="industrial-dashed-box" style={{ height: '100%' }}>
                                        <div className="industrial-dashed-box-title">
                                            <span><SafetyCertificateOutlined /> 安全凭证 (Secrets)</span>
                                            <Tag color="cyan">Merge Mode</Tag>
                                        </div>

                                        {/* Template Secrets */}
                                        <div style={{ marginBottom: 8 }}>
                                            <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>模板预设:</Text>
                                            {(selectedTemplate.secrets_source_ids || []).length > 0 ? (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                    {selectedTemplate.secrets_source_ids?.map(id => {
                                                        const item = secretsSources.find(s => s.id === id);
                                                        return (
                                                            <div
                                                                key={id}
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    padding: '4px 8px',
                                                                    border: '1px solid #f0f0f0',
                                                                    borderRadius: 0,
                                                                    background: '#f5f5f5',
                                                                    fontSize: 12,
                                                                    color: '#595959',
                                                                    userSelect: 'none'
                                                                }}
                                                            >
                                                                <KeyOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
                                                                <span style={{ fontWeight: 500, marginRight: 4 }}>{item ? item.name : id.slice(0, 6)}</span>

                                                                {/* Priority & Type */}
                                                                {item && (
                                                                    <span style={{ color: '#999', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                        {item.priority !== undefined && <Tag style={{ margin: 0, padding: '0 4px', fontSize: 10, lineHeight: '16px', borderRadius: 0 }} color="default">P{item.priority}</Tag>}
                                                                        {item.auth_type === 'password' ? '密码' : '密钥'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : <Text type="secondary">-</Text>}
                                        </div>

                                        <Divider style={{ margin: '8px 0' }} dashed />

                                        {/* Additional Secrets Selector */}
                                        <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>临时追加:</Text>
                                        <SecretsSelector
                                            value={additionalSecretIds}
                                            onChange={setAdditionalSecretIds}
                                            dataSource={secretsSources}
                                        />
                                    </div>
                                </Col>
                            </Row>

                            <Divider orientation="left" style={{ margin: '24px 0 16px' }} plain>
                                <Space><CodeOutlined /> 变量参数 (Variables)</Space>
                            </Divider>

                            {/* Variables Section */}
                            {loadingPlaybook ? (
                                <div style={{ textAlign: 'center', padding: 40 }}><Spin tip="Loading Blueprint Variables..." /></div>
                            ) : variables.length === 0 ? (
                                <Alert message="此任务无需额外变量配置，可直接执行。" type="success" showIcon banner />
                            ) : (
                                <>
                                    {requiredVars.length > 0 && (
                                        <div style={{ marginBottom: 24 }}>
                                            <Text type="danger" strong style={{ marginBottom: 12, display: 'block' }}>必填参数 / REQUIRED</Text>
                                            <Row gutter={[24, 0]}>
                                                {requiredVars.map(v => (
                                                    <Col key={v.name} span={12}>
                                                        <div className="variable-form-item">
                                                            <div style={{ marginBottom: 4 }}>
                                                                <Text strong>{v.name}</Text>
                                                                <Text type="danger"> *</Text>
                                                                {v.description && <Tooltip title={v.description}><span style={{ marginLeft: 6, color: '#8c8c8c', cursor: 'help' }}>?</span></Tooltip>}
                                                            </div>
                                                            <VariableInput
                                                                variable={v}
                                                                value={variableValues[v.name]}
                                                                onChange={val => handleVariableChange(v.name, val)}
                                                            />
                                                        </div>
                                                    </Col>
                                                ))}
                                            </Row>
                                        </div>
                                    )}

                                    {optionalVars.length > 0 && (
                                        <div>
                                            <Text type="secondary" strong style={{ marginBottom: 12, display: 'block' }}>可选参数 / OPTIONAL</Text>
                                            <Row gutter={[24, 0]}>
                                                {optionalVars.map(v => (
                                                    <Col key={v.name} span={12}>
                                                        <div className="variable-form-item">
                                                            <div style={{ marginBottom: 4 }}>
                                                                <Text>{v.name}</Text>
                                                                {v.description && <Tooltip title={v.description}><span style={{ marginLeft: 6, color: '#8c8c8c', cursor: 'help' }}>?</span></Tooltip>}
                                                            </div>
                                                            <VariableInput
                                                                variable={v}
                                                                value={variableValues[v.name]}
                                                                onChange={val => handleVariableChange(v.name, val)}
                                                            />
                                                        </div>
                                                    </Col>
                                                ))}
                                            </Row>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer Action */}
                        <div className="main-footer">
                            <Space size="middle">
                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<SendOutlined />}
                                    onClick={handleExecute}
                                    loading={executing}
                                    disabled={(!selectedTemplate.target_hosts && additionalHosts.length === 0) || selectedTemplate.needs_review || !access.canExecuteTask}
                                    style={{
                                        height: 50,
                                        padding: '0 40px',
                                        fontSize: 16,
                                        borderRadius: 2,
                                        boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)'
                                    }}
                                >
                                    立即执行 / EXECUTE
                                </Button>
                            </Space>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <PageContainer
            header={{ title: <><RocketOutlined /> 任务发射台 / LAUNCH PAD</>, subTitle: `${totalTemplates} 个模板` }}
            ghost
        >
            {mode === 'selection' ? renderLaunchpad() : renderMissionControl()}
        </PageContainer>
    );
};

export default ExecuteTaskPage;

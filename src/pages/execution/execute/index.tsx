import {
    PlayCircleOutlined, ThunderboltOutlined, SendOutlined, ReloadOutlined,
    CodeOutlined, RocketOutlined, ArrowLeftOutlined,
    ClusterOutlined, SafetyCertificateOutlined, WarningOutlined,
    SyncOutlined, PlusOutlined, DeleteOutlined, BellOutlined,
    MailOutlined, StopOutlined, CheckCircleOutlined, PhoneOutlined, ClockCircleOutlined, CalendarOutlined,
    UserOutlined, KeyOutlined, DesktopOutlined, SettingOutlined, ProjectOutlined, ExclamationCircleOutlined,
    ContainerOutlined
} from '@ant-design/icons';

import {
    Button, message, Space, Tag, Card, Row, Col, Typography,
    Alert, Avatar, Empty, Spin, Divider, Tooltip, Switch, Checkbox, Pagination
} from 'antd';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { history, useAccess } from '@umijs/max';
import SubPageHeader from '@/components/SubPageHeader';
import StandardTable from '@/components/StandardTable';
import type { SearchField, AdvancedSearchField } from '@/components/StandardTable';
import { getExecutionTasks, getExecutionTaskStats, executeTask, confirmExecutionTaskReview } from '@/services/auto-healing/execution';
import { getPlaybook } from '@/services/auto-healing/playbooks';
import { getSecretsSources } from '@/services/auto-healing/secrets';
import { getChannels, getTemplates } from '@/services/auto-healing/notification';
import VariableInput, { extractDefaultValue } from '@/components/VariableInput';
import HostList from './components/HostList';
import HostSelector from '@/components/HostSelector';
import SecretsSelector from '@/components/SecretsSelector';
import NotificationConfigDisplay from '@/components/NotificationSelector/NotificationConfigDisplay';
import './style.css';
import '../templates/index.css';

const { Text, Title } = Typography;

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
    const [advancedParams, setAdvancedParams] = useState<Record<string, any>>({});
    const [onlyReady, setOnlyReady] = useState(false);
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalTemplates, setTotalTemplates] = useState(0);
    const [initialized, setInitialized] = useState(false); // 等待所有数据加载完成
    const [pageSize, setPageSize] = useState(16); // Default 16 for better grid fit

    // Stats
    const [stats, setStats] = useState({ total: 0, docker: 0, local: 0, needs_review: 0, changed_playbooks: 0, ready: 0, never_executed: 0, last_run_failed: 0 });

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
        playbook_name?: string;
        target_hosts?: string;
        needs_review?: boolean;
        last_run_status?: string;
        has_runs?: boolean;
        created_from?: string;
        created_to?: string;
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
                playbook_name: params?.playbook_name || undefined,
                target_hosts: params?.target_hosts || undefined,
                needs_review: params?.needs_review,
                last_run_status: params?.last_run_status || undefined,
                has_runs: params?.has_runs,
                created_from: params?.created_from || undefined,
                created_to: params?.created_to || undefined,
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

            // 加载统计数据
            refreshStats();

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

            const loadedTemplates = await loadTemplates({
                page: currentPage,
                search: searchText || undefined,
                executor_type: filterExecutor || undefined,
                status: apiStatus || undefined,
                playbook_id: filterPlaybook || undefined,
                ...advancedParams,
            });
            setTemplates(loadedTemplates);
        };
        doLoad();
    }, [currentPage, pageSize, searchText, filterExecutor, filterStatus, filterPlaybook, advancedParams]);

    // Reset page when filters change (except page itself)
    useEffect(() => {
        setCurrentPage(1);
    }, [searchText, filterExecutor, filterPlaybook, filterStatus, onlyReady]);

    // ==================== 数据刷新 ====================

    // 刷新统计数据
    const refreshStats = useCallback(async () => {
        try {
            const statsRes = await getExecutionTaskStats();
            const s = (statsRes as any)?.data || statsRes;
            if (s) setStats(prev => ({ ...prev, ...s }));
        } catch { /* ignore */ }
    }, []);

    // 刷新列表 + 统计（任何操作后调用）
    const refreshData = useCallback(async () => {
        // Map frontend status values to backend API values
        let apiStatus = '';
        if (filterStatus === 'ready') apiStatus = 'ready';
        else if (filterStatus === 'review') apiStatus = 'pending_review';

        const loadedTemplates = await loadTemplates({
            page: currentPage,
            search: searchText || undefined,
            executor_type: filterExecutor || undefined,
            status: apiStatus || undefined,
            playbook_id: filterPlaybook || undefined,
            ...advancedParams,
        });
        setTemplates(loadedTemplates);
        // 同时刷新统计
        refreshStats();
    }, [currentPage, searchText, filterExecutor, filterStatus, filterPlaybook, advancedParams, loadTemplates, refreshStats]);

    // ==================== Actions ====================

    const handleSelectTemplate = async (template: AutoHealing.ExecutionTask) => {
        // Strict blocking: Cannot select if review is needed
        if (template.needs_review) {
            message.warning('任务模板需审核：请前往"任务模板管理"确认 Playbook 变更后方可执行。');
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



    // 确认审核 — 操作后自动刷新数据
    const handleConfirmReview = async () => {
        if (!selectedTemplate) return;
        setSyncing(true);
        try {
            await confirmExecutionTaskReview(selectedTemplate.id);
            message.success('已确认变更');
            // 更新当前选中模板的状态
            setSelectedTemplate(prev => prev ? { ...prev, needs_review: false, changed_variables: [] } : prev);
            // 异步刷新列表和统计
            refreshData();
        } catch {
            message.error('确认审核失败');
        } finally { setSyncing(false); }
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

    const isDisabled = (template: AutoHealing.ExecutionTask) =>
        template.needs_review || template.playbook?.status !== 'ready';

    // ==================== Search Fields ====================
    const launchpadSearchFields: SearchField[] = [
        { key: 'search', label: '模板名称' },
        { key: 'playbook_name', label: 'Playbook' },
        { key: 'target_hosts', label: '目标主机' },
        {
            key: '__enum__executor_type', label: '执行器类型',
            options: [
                { label: 'SSH / Local', value: 'local' },
                { label: 'Docker', value: 'docker' },
            ],
        },
        {
            key: '__enum__status', label: '状态',
            options: [
                { label: '就绪', value: 'ready' },
                { label: '需审核', value: 'review' },
            ],
        },
        {
            key: '__enum__last_run_status', label: '最后执行',
            options: [
                { label: '成功', value: 'success' },
                { label: '失败', value: 'failed' },
                { label: '部分成功', value: 'partial' },
            ],
        },
    ];

    const launchpadAdvancedSearchFields: AdvancedSearchField[] = [
        { key: 'playbook_name', label: 'Playbook', type: 'input', placeholder: '输入 Playbook 名称' },
        { key: 'target_hosts', label: '目标主机', type: 'input', placeholder: '输入主机地址' },
        {
            key: 'needs_review', label: '审核状态', type: 'select', options: [
                { label: '需审核', value: 'true' },
                { label: '正常', value: 'false' },
            ]
        },
        {
            key: 'last_run_status', label: '最后执行状态', type: 'select',
            description: '按最后一次执行记录的状态筛选',
            options: [
                { label: '成功', value: 'success' },
                { label: '失败', value: 'failed' },
                { label: '部分成功', value: 'partial' },
                { label: '取消', value: 'cancelled' },
            ]
        },
        {
            key: 'has_runs', label: '执行记录', type: 'select',
            description: '筛选是否有执行记录',
            options: [
                { label: '有执行记录', value: 'true' },
                { label: '无执行记录', value: 'false' },
            ]
        },
        { key: 'created_at', label: '创建时间', type: 'dateRange' },
    ];

    const handleLaunchpadSearch = useCallback((params: {
        searchField?: string;
        searchValue?: string;
        advancedSearch?: Record<string, any>;
        filters?: { field: string; value: string }[];
    }) => {
        const filters = params.filters || [];
        let newSearch = '';
        let newExecutor = '';
        let newStatus = '';
        const extra: Record<string, any> = {};

        for (const f of filters) {
            if (f.field === 'search') newSearch = f.value;
            else if (f.field === 'playbook_name') extra.playbook_name = f.value;
            else if (f.field === 'target_hosts') extra.target_hosts = f.value;
            else if (f.field === '__enum__executor_type') newExecutor = f.value;
            else if (f.field === '__enum__status') newStatus = f.value;
            else if (f.field === '__enum__last_run_status') extra.last_run_status = f.value;
        }

        setSearchText(newSearch);
        setFilterExecutor(newExecutor);
        setFilterStatus(newStatus);

        // 高级搜索参数
        if (params.advancedSearch) {
            const adv = params.advancedSearch;
            if (adv.playbook_name) extra.playbook_name = adv.playbook_name;
            if (adv.target_hosts) extra.target_hosts = adv.target_hosts;
            if (adv.needs_review !== undefined && adv.needs_review !== null && adv.needs_review !== '') {
                extra.needs_review = adv.needs_review === 'true' || adv.needs_review === true;
            }
            if (adv.last_run_status) extra.last_run_status = adv.last_run_status;
            if (adv.has_runs !== undefined && adv.has_runs !== null && adv.has_runs !== '') {
                extra.has_runs = adv.has_runs === 'true' || adv.has_runs === true;
            }
            if (adv.created_at && Array.isArray(adv.created_at) && adv.created_at.length === 2) {
                extra.created_from = adv.created_at[0].toISOString();
                extra.created_to = adv.created_at[1].toISOString();
            }
        }
        setAdvancedParams(extra);
    }, []);

    const renderLaunchpad = () => (
        <StandardTable<AutoHealing.ExecutionTask>
            tabs={[{ key: 'launchpad', label: '任务列表' }]}
            title="任务执行"
            description={`${totalTemplates} 个任务模板 · 选择模板 → 配置参数 → 执行`}
            headerIcon={
                <ThunderboltOutlined style={{ fontSize: 28 }} />
            }
            headerExtra={
                <div className="template-stats-bar">
                    {[
                        {
                            icon: <CheckCircleOutlined />, cls: 'total', val: stats.ready, lbl: '就绪可执行',
                            tip: `${stats.ready} / ${stats.total} 个模板就绪`
                        },
                        {
                            icon: <ExclamationCircleOutlined />, cls: 'review', val: stats.needs_review, lbl: '待审核',
                            tip: stats.needs_review > 0 ? `${stats.needs_review} 个模板需审核（涉及 ${stats.changed_playbooks} 个 Playbook 变更）` : undefined
                        },
                        {
                            icon: <ClockCircleOutlined />, cls: 'local', val: stats.never_executed, lbl: '从未执行',
                            tip: stats.never_executed > 0 ? `${stats.never_executed} 个模板创建后从未执行` : undefined
                        },
                        {
                            icon: <WarningOutlined />, cls: 'failed', val: stats.last_run_failed, lbl: '最近失败',
                            tip: stats.last_run_failed > 0 ? `${stats.last_run_failed} 个模板最后一次执行失败` : undefined
                        },
                    ].map((s: any, i: number) => (
                        <React.Fragment key={i}>
                            {i > 0 && <div className="template-stat-divider" />}
                            <Tooltip title={s.tip} placement="bottom">
                                <div className="template-stat-item" style={{ cursor: s.tip ? 'help' : undefined }}>
                                    <span className={`template-stat-icon template-stat-icon-${s.cls}`}>{s.icon}</span>
                                    <div className="template-stat-content">
                                        <div className="template-stat-value">{s.val}</div>
                                        <div className="template-stat-label">{s.lbl}</div>
                                    </div>
                                </div>
                            </Tooltip>
                        </React.Fragment>
                    ))}
                </div>
            }
            searchFields={launchpadSearchFields}
            advancedSearchFields={launchpadAdvancedSearchFields}
            onSearch={handleLaunchpadSearch}
            primaryActionLabel="新建模板"
            onPrimaryAction={() => history.push('/execution/templates/create')}
        >
            {/* ===== Card Grid ===== */}
            {loading || !initialized ? (
                <div style={{ textAlign: 'center', padding: 80 }}>
                    <Spin size="large" tip="加载任务模板..."><div /></Spin>
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
                    <Row gutter={[20, 20]} className="launchpad-grid">
                        {filteredTemplates.map(template => {
                            const hosts = template.target_hosts ? template.target_hosts.split(',').filter(Boolean) : [];
                            const varCount = template.playbook_variables_snapshot?.length || 0;
                            const configuredCount = Object.keys(template.extra_vars || {}).length;
                            const secretCount = template.secrets_source_ids?.length || 0;
                            const disabled = isDisabled(template);
                            const isDocker = template.executor_type === 'docker';
                            const hasNotify = !!template.notification_config?.enabled;

                            // Card state class
                            const cardClass = [
                                'launchpad-card',
                                disabled ? 'launchpad-card-disabled' : '',
                                template.needs_review ? 'launchpad-card-review' : '',
                                template.playbook?.status !== 'ready' && !template.needs_review ? 'launchpad-card-offline' : '',
                            ].filter(Boolean).join(' ');

                            return (
                                <Col key={template.id} xs={24} sm={12} md={12} lg={8} xl={6} xxl={6}>
                                    <div
                                        className={cardClass}
                                        onClick={() => !disabled && handleSelectTemplate(template)}
                                    >
                                        {/* 左侧标识条 */}
                                        <div className={`launchpad-card-stub ${isDocker ? 'launchpad-stub-docker' : 'launchpad-stub-ssh'}`}>
                                            <div className="launchpad-card-stub-icon">
                                                {isDocker ? (
                                                    <svg viewBox="0 0 640 512" fill="currentColor">
                                                        <path d="M349.9 236.3h-66.1v-59.4h66.1v59.4zm0-204.3h-66.1v60.7h66.1V32zm78.2 144.8H362v59.4h66.1v-59.4zm-156.3-72.1h-66.1v60.1h66.1v-60.1zm78.1 0h-66.1v60.1h66.1v-60.1zm276.8 100c-14.4-9.7-47.6-13.2-73.1-8.4-3.3-24-16.7-44.9-41.1-63.7l-14-9.3-9.3 14c-18.4 27.8-23.4 73.6-3.7 103.8-8.7 4.7-25.8 11.1-48.4 10.7H2.4c-7.6 42.6-3.4 97.6 28.6 144.4 30 44 75.4 66.4 134.2 66.4 127.6 0 221.9-58.7 266.4-165.1 17.3.3 54.7.3 73.8-36.4.5-1 11.1-22.9 11.1-22.9l-14.5-9.5zM349.9 32h-66.1v60.7h66.1V32zm-78.2 72.1h-66.1v60.1h66.1v-60.1zm0-72.1h-66.1v60.7h66.1V32zm-78.1 72.1h-66.1v60.1h66.1v-60.1z" />
                                                    </svg>
                                                ) : (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="4 17 10 11 4 5" />
                                                        <line x1="12" y1="19" x2="20" y2="19" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="launchpad-card-type-label">
                                                {isDocker ? 'DOCKER' : 'SSH'}
                                            </div>
                                        </div>

                                        {/* 右侧内容 — 高密度紧凑 */}
                                        <div className="launchpad-card-body">
                                            {/* 标题 + 状态 */}
                                            <div className="launchpad-card-header">
                                                <div className="launchpad-card-title">
                                                    {template.name || '未命名任务'}
                                                </div>
                                                {template.needs_review ? (
                                                    <span className="launchpad-card-review-badge">需审核</span>
                                                ) : (
                                                    <span className="launchpad-card-ready">
                                                        <CheckCircleOutlined /> Ready
                                                    </span>
                                                )}
                                            </div>

                                            {/* 描述 / 目标主机预览 */}
                                            <div className="launchpad-card-desc">
                                                {template.description || `目标: ${hosts.slice(0, 3).join(', ')}${hosts.length > 3 ? ` +${hosts.length - 3}` : ''}`}
                                            </div>

                                            {/* Playbook */}
                                            <div className="launchpad-card-playbook">
                                                <ProjectOutlined style={{ fontSize: 10, flexShrink: 0 }} />
                                                <span className="launchpad-card-playbook-text">
                                                    {template.playbook?.name || template.playbook_id?.slice(0, 8) || '-'}
                                                </span>
                                            </div>

                                            {/* 2x2 信息网格 */}
                                            <div className="launchpad-card-info-grid">
                                                <span className="launchpad-card-info-item">
                                                    <DesktopOutlined /> <span className="info-value">{hosts.length}</span> 主机
                                                </span>
                                                <span className="launchpad-card-info-item">
                                                    <SettingOutlined /> <span className="info-value">{configuredCount}/{varCount}</span> 参数
                                                </span>
                                                <span className="launchpad-card-info-item">
                                                    <KeyOutlined style={{ color: secretCount > 0 ? '#fa8c16' : undefined }} /> <span className="info-value">{secretCount}</span> 凭据
                                                </span>
                                                <span className="launchpad-card-info-item">
                                                    <BellOutlined style={{ color: hasNotify ? '#1890ff' : undefined }} /> {hasNotify ? '已配置' : '未配置'}
                                                </span>
                                            </div>

                                            {/* 底部 */}
                                            <div className="launchpad-card-footer">
                                                <span className="launchpad-card-footer-left">
                                                    <ClockCircleOutlined /> {template.updated_at ? new Date(template.updated_at).toLocaleDateString() : '-'}
                                                </span>
                                                <span style={{ fontSize: 10, color: '#bfbfbf', fontFamily: 'monospace' }}>
                                                    #{template.id.slice(0, 6)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                            );
                        })}
                    </Row>

                    {/* ===== Pagination ===== */}
                    <div className="launchpad-pagination">
                        <Pagination
                            current={currentPage}
                            total={totalTemplates}
                            pageSize={pageSize}
                            onChange={(page, size) => {
                                setCurrentPage(page);
                                setPageSize(size);
                            }}
                            showSizeChanger={{ showSearch: false }}
                            pageSizeOptions={['16', '24', '48']}
                            showQuickJumper
                            showTotal={t => `共 ${t} 条`}
                        />
                    </div>
                </>
            )}
        </StandardTable>
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
            <div style={{ height: 'auto', overflow: 'visible' }}>
                {/* ===== SubPageHeader（跟添加代码仓库页面对齐）===== */}
                <SubPageHeader
                    title={selectedTemplate.name || '未命名任务'}
                    titleExtra={
                        <Tag color={selectedTemplate.executor_type === 'docker' ? 'blue' : 'purple'}>
                            {selectedTemplate.executor_type === 'docker' ? 'Docker' : 'SSH'}
                        </Tag>
                    }
                    onBack={handleBack}
                />

                {/* ===== 操作控制台内容卡片（对齐 git-form-card） ===== */}
                <div style={{ background: '#fff', margin: '16px 24px 24px', border: '1px solid #f0f0f0' }}>
                    <div className="execution-cockpit" style={{ margin: 0 }}>
                        {/* LEFT PANEL: CONTEXT INTELLIGENCE */}
                        <div className="cockpit-sidebar">
                            <div className="sidebar-header">
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
                                        <Space orientation="vertical" size={8} style={{ width: '100%' }}>
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
                                    <div style={{ textAlign: 'center', padding: 40 }}><Spin tip="Loading Blueprint Variables..."><div /></Spin></div>
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
            </div>
        );
    };

    return mode === 'selection' ? renderLaunchpad() : renderMissionControl();
};

export default ExecuteTaskPage;

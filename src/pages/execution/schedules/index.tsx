import {
    ClockCircleOutlined, ScheduleOutlined, PlusOutlined,
    ThunderboltOutlined, CheckCircleOutlined, StopOutlined,
    SearchOutlined, ArrowLeftOutlined, DeleteOutlined, EditOutlined,
    FieldTimeOutlined, CodeOutlined, RocketOutlined, CalendarOutlined,
    PlayCircleOutlined, ReloadOutlined, WarningOutlined, ClusterOutlined,
    SafetyCertificateOutlined, BellOutlined, MailOutlined, PhoneOutlined, SettingOutlined,
    SyncOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useAccess } from '@umijs/max';
import {
    Button, message, Space, Tag, Typography, Input,
    Empty, Switch, Spin, Row, Col, Popconfirm,
    Form, Alert, Divider, Tooltip, Select, Checkbox, Pagination, Avatar,
    DatePicker, Radio, Modal
} from 'antd';
import dayjs from 'dayjs';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { history } from '@umijs/max';
import {
    getExecutionSchedules, createExecutionSchedule, updateExecutionSchedule,
    deleteExecutionSchedule, enableExecutionSchedule, disableExecutionSchedule,
    getExecutionTasks
} from '@/services/auto-healing/execution';
import { getPlaybooks, getPlaybook } from '@/services/auto-healing/playbooks';
import { getSecretsSources } from '@/services/auto-healing/secrets';
import { getChannels } from '@/services/auto-healing/notification';
import HostSelector from '@/components/HostSelector';
import SecretsSelector from '@/components/SecretsSelector';
import VariableInput, { extractDefaultValue } from '@/components/VariableInput';
import HostList from '../execute/components/HostList';
import CronEditor from '@/components/CronEditor';
import NotificationConfigDisplay from '@/components/NotificationSelector/NotificationConfigDisplay';
import '../execute/style.css'; // Reuse existing industrial styles


const { Text, Title } = Typography;

const ExecutionSchedulePage: React.FC = () => {
    const access = useAccess();
    // Modes: 'list' | 'create-step-1' (select template) | 'create-step-2' (config) | 'edit'
    const [mode, setMode] = useState<'list' | 'create-step-1' | 'create-step-2' | 'edit'>('list');

    // Data State
    const [schedules, setSchedules] = useState<AutoHealing.ExecutionSchedule[]>([]);
    const [templates, setTemplates] = useState<AutoHealing.ExecutionTask[]>([]);
    const [playbooks, setPlaybooks] = useState<AutoHealing.Playbook[]>([]);
    const [secretsSources, setSecretsSources] = useState<AutoHealing.SecretsSource[]>([]);
    const [channels, setChannels] = useState<AutoHealing.NotificationChannel[]>([]);

    // Loading State
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [loadingPlaybook, setLoadingPlaybook] = useState(false);

    // Selection & Form State
    const [selectedTemplate, setSelectedTemplate] = useState<AutoHealing.ExecutionTask | null>(null);
    const [editingSchedule, setEditingSchedule] = useState<AutoHealing.ExecutionSchedule | null>(null);
    const [searchText, setSearchText] = useState('');
    const [form] = Form.useForm();

    // Template Filters (for Step 1)
    const [filterExecutor, setFilterExecutor] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterPlaybook, setFilterPlaybook] = useState<string>('');
    const [onlyReady, setOnlyReady] = useState(true); // Default to only show ready templates

    // Pagination for Step 1 (Template Selection)
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(16); // Default 16

    // Pagination for Schedule List
    const [scheduleCurrentPage, setScheduleCurrentPage] = useState(1);
    const [scheduleTotal, setScheduleTotal] = useState(0);
    const [schedulePageSize, setSchedulePageSize] = useState(16); // Default 16

    // Schedule List Filters
    const [filterTaskId, setFilterTaskId] = useState<string>('');
    const [filterScheduleType, setFilterScheduleType] = useState<string>(''); // '', 'cron', 'once'
    const [filterScheduleStatus, setFilterScheduleStatus] = useState<string>(''); // '', 'running', 'pending', 'completed', 'disabled'

    // Execution Parameter Overrides State
    const [templatePlaybook, setTemplatePlaybook] = useState<AutoHealing.Playbook | null>(null);
    const [targetHostsOverride, setTargetHostsOverride] = useState<string[]>([]);
    const [secretsSourceIds, setSecretsSourceIds] = useState<string[]>([]);
    const [variableValues, setVariableValues] = useState<Record<string, any>>({});
    const [skipNotification, setSkipNotification] = useState(false);

    // Once-mode enable modal state
    const [enableOnceModal, setEnableOnceModal] = useState<{ visible: boolean; schedule: AutoHealing.ExecutionSchedule | null; newScheduledAt: any }>({
        visible: false,
        schedule: null,
        newScheduledAt: null
    });

    // ==================== Data Loading ====================

    // Load schedules with server-side pagination, search and filters
    const loadSchedules = useCallback(async (params?: {
        page?: number;
        search?: string;
        task_id?: string;
        schedule_type?: string;
        status?: string;
    }) => {
        try {
            const res = await getExecutionSchedules({
                page: params?.page || 1,
                page_size: schedulePageSize,
                search: params?.search || undefined,
                task_id: params?.task_id || undefined,
                schedule_type: params?.schedule_type || undefined,
                status: params?.status || undefined,
            });
            setSchedules(res.data || []);
            setScheduleTotal(res.total || 0);
        } catch (error) {
            console.error('Failed to load schedules:', error);
        }
    }, [schedulePageSize]);

    // Load reference data (templates, playbooks, etc.)
    const loadReferenceData = useCallback(async () => {
        try {
            const [taskRes, pbRes, secretsRes, channelsRes] = await Promise.all([
                getExecutionTasks({ page: 1, page_size: 100 }),
                getPlaybooks({ page_size: 100 }),
                getSecretsSources(),
                getChannels({ page_size: 100 })
            ]);
            setTemplates(taskRes.data || []);
            setPlaybooks(pbRes.data || pbRes.items || []);
            setSecretsSources(secretsRes.data || []);
            setChannels(channelsRes.data || []);
        } catch (error) {
            console.error('Failed to load reference data:', error);
        }
    }, []);

    // Initial load all data
    const loadAllData = useCallback(async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadSchedules({ page: 1, search: searchText || undefined }),
                loadReferenceData()
            ]);
        } catch (error) {
            console.error(error);
            message.error('加载数据失败');
        } finally {
            setLoading(false);
        }
    }, [loadSchedules, loadReferenceData, searchText]);

    useEffect(() => {
        loadAllData();
    }, []); // Only run on mount

    // Reload schedules when search, filters or page changes (with debounce for search)
    useEffect(() => {
        const timer = setTimeout(() => {
            loadSchedules({
                page: scheduleCurrentPage,
                search: searchText || undefined,
                task_id: filterTaskId || undefined,
                schedule_type: filterScheduleType || undefined,
                status: filterScheduleStatus || undefined,
            });
        }, searchText ? 300 : 0); // Debounce only for search typing
        return () => clearTimeout(timer);
    }, [scheduleCurrentPage, schedulePageSize, searchText, filterTaskId, filterScheduleType, filterScheduleStatus, loadSchedules]);

    // Reset schedule page when search or filters change
    useEffect(() => {
        setScheduleCurrentPage(1);
    }, [searchText, filterTaskId, filterScheduleType, filterScheduleStatus]);

    // Reset template page when template filters change (for Step 1)
    useEffect(() => {
        setCurrentPage(1);
    }, [filterExecutor, filterPlaybook, onlyReady]);

    // ==================== Computed / Helpers ====================

    const templateMap = useMemo(() => {
        const map: Record<string, AutoHealing.ExecutionTask> = {};
        templates.forEach(t => map[t.id] = t);
        return map;
    }, [templates]);

    const filteredSchedules = useMemo(() => {
        if (!searchText) return schedules;
        const lower = searchText.toLowerCase();
        return schedules.filter(s =>
            s.name?.toLowerCase().includes(lower) ||
            s.schedule_expr?.toLowerCase().includes(lower) ||
            templateMap[s.task_id]?.name?.toLowerCase().includes(lower)
        );
    }, [schedules, searchText, templateMap]);

    // Filtered Templates for Selection (Step 1) with all filters
    const filteredTemplates = useMemo(() => {
        let result = templates;

        // Text search
        if (searchText) {
            const lower = searchText.toLowerCase();
            result = result.filter(t =>
                t.name?.toLowerCase().includes(lower) ||
                t.playbook?.name?.toLowerCase().includes(lower) ||
                t.description?.toLowerCase().includes(lower)
            );
        }

        // Executor filter
        if (filterExecutor) {
            result = result.filter(t => t.executor_type === filterExecutor);
        }

        // Playbook filter
        if (filterPlaybook) {
            result = result.filter(t => t.playbook_id === filterPlaybook);
        }

        // Status filter
        if (filterStatus === 'ready') {
            result = result.filter(t => !t.needs_review && t.playbook?.status === 'ready');
        } else if (filterStatus === 'review') {
            result = result.filter(t => t.needs_review);
        } else if (filterStatus === 'offline') {
            result = result.filter(t => t.playbook?.status !== 'ready');
        }

        // Only ready toggle
        if (onlyReady) {
            result = result.filter(t => !t.needs_review && t.playbook?.status === 'ready');
        }

        return result;
    }, [templates, searchText, filterExecutor, filterPlaybook, filterStatus, onlyReady]);

    // Paginated Templates
    const paginatedTemplates = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredTemplates.slice(start, start + pageSize);
    }, [filteredTemplates, currentPage, pageSize]);

    const formatNextRun = (nextRun: string | null | undefined) => {
        if (!nextRun) return <Text type="secondary">N/A</Text>;
        const date = new Date(nextRun);
        const now = new Date();
        const diff = date.getTime() - now.getTime();

        let color = '#8c8c8c';
        let text = date.toLocaleString();

        if (diff < 0) {
            color = '#ff4d4f';
            text = '已过期';
        } else if (diff < 3600 * 1000) {
            color = '#52c41a';
        }

        return <span style={{ fontFamily: 'monospace', color }}>{text}</span>;
    };

    const getTemplateStatus = (t: AutoHealing.ExecutionTask) => {
        if (t.needs_review) return { status: 'error', text: '需审核' };
        // Use embedded playbook object from API instead of local list lookup
        if (!t.playbook || t.playbook.status !== 'ready') return { status: 'warning', text: '未上线' };
        return { status: 'success', text: '就绪' };
    };

    // Notification channel logic - 新格式下每个触发器有自己的渠道，这里只判断是否有通知配置
    const hasNotificationConfig = useMemo(() => {
        return selectedTemplate?.notification_config?.enabled === true;
    }, [selectedTemplate]);

    const handleVariableChange = (name: string, value: any) => {
        setVariableValues(prev => ({ ...prev, [name]: value }));
    };

    // ==================== Actions ====================

    const handleToggle = async (schedule: AutoHealing.ExecutionSchedule, enabled: boolean) => {
        // For once-mode: show modal to input new scheduled_at when enabling
        if (enabled && schedule.schedule_type === 'once') {
            setEnableOnceModal({
                visible: true,
                schedule,
                newScheduledAt: null
            });
            return;
        }

        setActionLoading(schedule.id);
        try {
            if (enabled) {
                await enableExecutionSchedule(schedule.id);
                message.success('调度已启用');
            } else {
                await disableExecutionSchedule(schedule.id);
                message.success('调度已禁用');
            }
            loadSchedules({ page: scheduleCurrentPage });
        } catch {
            // 错误消息由全局错误处理器显示
        } finally {
            setActionLoading(null);
        }
    };

    // Handle once-mode enable with new scheduled_at
    const handleEnableOnce = async () => {
        const { schedule, newScheduledAt } = enableOnceModal;
        if (!schedule || !newScheduledAt) {
            message.warning('请选择新的执行时间');
            return;
        }

        setActionLoading(schedule.id);
        try {
            // First update scheduled_at, then enable
            await updateExecutionSchedule(schedule.id, {
                scheduled_at: dayjs.isDayjs(newScheduledAt) ? newScheduledAt.format() : newScheduledAt
            });
            await enableExecutionSchedule(schedule.id);
            message.success('调度已启用');
            loadSchedules({ page: scheduleCurrentPage });
            setEnableOnceModal({ visible: false, schedule: null, newScheduledAt: null });
        } catch {
            // 错误消息由全局错误处理器显示
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (schedule: AutoHealing.ExecutionSchedule) => {
        if (schedule.enabled) {
            message.error('无法删除：调度任务正在运行中，请先禁用');
            return;
        }
        setActionLoading(schedule.id);
        try {
            await deleteExecutionSchedule(schedule.id);
            message.success('调度已删除');
            setSchedules(prev => prev.filter(s => s.id !== schedule.id));
        } catch {
            // 错误消息由全局错误处理器显示
        } finally {
            setActionLoading(null);
        }
    };

    const handleStartCreate = () => {
        setSearchText('');
        setFilterExecutor('');
        setFilterStatus('');
        setFilterPlaybook('');
        setOnlyReady(true);
        setCurrentPage(1);
        setMode('create-step-1');
    };

    const handleSelectTemplate = async (t: AutoHealing.ExecutionTask) => {
        const { status } = getTemplateStatus(t);
        if (status !== 'success') {
            message.warning('该模板当前不可用 (需审核或Playbook未上线)');
            return;
        }
        setSelectedTemplate(t);
        setEditingSchedule(null);

        // Reset override states
        setTargetHostsOverride([]);
        setSecretsSourceIds([]);
        setVariableValues({});
        setSkipNotification(false);

        form.resetFields();
        form.setFieldsValue({
            name: `${t.name} - 定时`,
            task_id: t.id,
            schedule_type: 'cron',
            schedule_expr: ''
        });

        // Load Playbook details
        if (t.playbook_id) {
            setLoadingPlaybook(true);
            try {
                const res = await getPlaybook(t.playbook_id);
                setTemplatePlaybook(res.data);
            } catch { /* ignore */ }
            finally { setLoadingPlaybook(false); }
        }

        setMode('create-step-2');
    };

    const handleEdit = async (schedule: AutoHealing.ExecutionSchedule) => {
        console.log('[DEBUG handleEdit] schedule:', schedule);
        console.log('[DEBUG handleEdit] schedule_type:', schedule.schedule_type);
        console.log('[DEBUG handleEdit] scheduled_at:', schedule.scheduled_at);
        console.log('[DEBUG handleEdit] schedule_expr:', schedule.schedule_expr);

        const t = templateMap[schedule.task_id];
        setSelectedTemplate(t || null);
        setEditingSchedule(schedule);

        // Initialize override states from schedule
        setTargetHostsOverride(schedule.target_hosts_override?.split(',').filter(Boolean) || []);
        setSecretsSourceIds(schedule.secrets_source_ids || []);
        setVariableValues(schedule.extra_vars_override || {});
        setSkipNotification(schedule.skip_notification || false);

        // Load Playbook details
        if (t?.playbook_id) {
            setLoadingPlaybook(true);
            try {
                const res = await getPlaybook(t.playbook_id);
                setTemplatePlaybook(res.data);
            } catch { /* ignore */ }
            finally { setLoadingPlaybook(false); }
        }

        // Set mode FIRST so Form component renders
        setMode('edit');

        // Then set form values after a small delay to ensure Form is mounted
        setTimeout(() => {
            form.resetFields();
            const formValues: any = {
                name: schedule.name,
                task_id: schedule.task_id,
                schedule_type: schedule.schedule_type,
                schedule_expr: schedule.schedule_expr || undefined,
                description: schedule.description
            };
            // Only set scheduled_at when it exists and is for once mode
            if (schedule.schedule_type === 'once' && schedule.scheduled_at) {
                formValues.scheduled_at = dayjs(schedule.scheduled_at);
            }
            console.log('[DEBUG handleEdit] formValues to set:', formValues);
            if (formValues.scheduled_at) {
                console.log('[DEBUG handleEdit] scheduled_at isDayjs:', dayjs.isDayjs(formValues.scheduled_at));
            }
            form.setFieldsValue(formValues);
        }, 0);
    };

    const handleBack = () => {
        if (mode === 'create-step-2') {
            // From config step, go back to template selection
            setMode('create-step-1');
            setSelectedTemplate(null);
        } else {
            // From Step 1 or Edit mode, go back to list
            setMode('list');
            setSelectedTemplate(null);
            setEditingSchedule(null);
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setActionLoading('submit');

            // Build request with execution parameter overrides
            const requestData = {
                ...values,
                // For once mode: format scheduled_at to ISO string; for cron mode: clear scheduled_at
                schedule_expr: values.schedule_type === 'cron' ? values.schedule_expr : undefined,
                scheduled_at: values.schedule_type === 'once' && values.scheduled_at
                    ? (dayjs.isDayjs(values.scheduled_at) ? values.scheduled_at.format() : values.scheduled_at)
                    : undefined,
                target_hosts_override: targetHostsOverride.length > 0 ? targetHostsOverride.join(',') : undefined,
                extra_vars_override: Object.keys(variableValues).length > 0 ? variableValues : undefined,
                secrets_source_ids: secretsSourceIds.length > 0 ? secretsSourceIds : undefined,
                skip_notification: skipNotification || undefined,
            };

            if (mode === 'edit' && editingSchedule) {
                await updateExecutionSchedule(editingSchedule.id, requestData);
                message.success('调度已更新');
            } else {
                await createExecutionSchedule(requestData);
                message.success('调度已创建');
            }

            loadAllData();
            setMode('list');
            setEditingSchedule(null);
            setSelectedTemplate(null);
        } catch (error) {
            if (!(error as any).errorFields) {
                message.error('提交失败，请重试');
            }
        } finally {
            setActionLoading(null);
        }
    };

    // ==================== Renderers ====================

    // --- VIEW: LIST (Launchpad Style) - Cards are wider now ---
    const renderList = () => (
        <div className="mission-control-container" style={{ height: 'auto', overflow: 'visible' }}>
            <div className="launchpad-grid" style={{ height: 'auto', overflow: 'visible' }}>
                {/* Header - Aligned with ExecuteTaskPage */}
                <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <Space size="large">
                        <Title level={4} style={{ margin: 0 }}><ScheduleOutlined /> 轨道控制台 / ORBIT CONTROL</Title>
                        <Text type="secondary">{scheduleTotal} 个调度</Text>
                    </Space>
                    <Space wrap>
                        <Input
                            placeholder="搜索调度名称/表达式..."
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            allowClear
                            style={{ width: 200, borderRadius: 2 }}
                        />
                        <Select
                            placeholder="任务模板"
                            value={filterTaskId || undefined}
                            onChange={v => setFilterTaskId(v || '')}
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            style={{ width: 220, borderRadius: 2 }}
                            options={templates.map(t => ({ label: t.name, value: t.id }))}
                        />
                        <Select
                            placeholder="调度类型"
                            value={filterScheduleType || undefined}
                            onChange={v => setFilterScheduleType(v || '')}
                            allowClear
                            style={{ width: 100, borderRadius: 2 }}
                            options={[
                                { label: '循环', value: 'cron' },
                                { label: '单次', value: 'once' },
                            ]}
                        />
                        <Select
                            placeholder="状态"
                            value={filterScheduleStatus || undefined}
                            onChange={v => setFilterScheduleStatus(v || '')}
                            allowClear
                            style={{ width: 100, borderRadius: 2 }}
                            options={[
                                { label: '运行中', value: 'running' },
                                { label: '待执行', value: 'pending' },
                                { label: '已完成', value: 'completed' },
                                { label: '已禁用', value: 'disabled' },
                            ]}
                        />
                        <Button icon={<ReloadOutlined />} onClick={loadAllData} loading={loading} />
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleStartCreate} disabled={!access.canManageSchedule}>
                            创建调度
                        </Button>
                    </Space>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
                ) : schedules.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<Text type="secondary">暂无定时调度</Text>}
                    >
                        <Button type="dashed" onClick={handleStartCreate} disabled={!access.canManageSchedule}>创建第一个调度</Button>
                    </Empty>
                ) : (
                    <>
                        <Row gutter={[16, 16]}>
                            {schedules.map(schedule => {
                                const template = templateMap[schedule.task_id];

                                return (
                                    <Col key={schedule.id} xs={24} sm={12} md={8} lg={6} xl={4}>
                                        <div
                                            className="template-card"
                                            style={{
                                                position: 'relative',
                                                overflow: 'hidden',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => handleEdit(schedule)}
                                        >
                                            {/* 使用后端返回的状态 */}
                                            {(() => {
                                                // 状态颜色映射
                                                const statusColorMap: Record<string, string> = {
                                                    running: '#52c41a',   // 绿色
                                                    pending: '#1890ff',   // 蓝色
                                                    completed: '#faad14', // 黄色
                                                    disabled: '#d9d9d9',  // 灰色
                                                };
                                                const statusColor = statusColorMap[schedule.status] || '#d9d9d9';

                                                return (
                                                    <>
                                                        {/* Status Indicator Strip */}
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            right: 0,
                                                            height: 3,
                                                            background: statusColor
                                                        }} />

                                                        {/* Card Content */}
                                                        <div style={{ padding: '16px 16px 12px' }}>
                                                            {/* Row 1: Icon + Switch */}
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                                                                <Avatar
                                                                    shape="square"
                                                                    size={48}
                                                                    style={{ backgroundColor: statusColor }}
                                                                    icon={schedule.schedule_type === 'cron'
                                                                        ? <SyncOutlined style={{ fontSize: 24 }} />
                                                                        : <RocketOutlined style={{ fontSize: 24 }} />}
                                                                />
                                                                <div
                                                                    onClick={e => { e.stopPropagation(); e.preventDefault(); }}
                                                                    onMouseDown={e => e.stopPropagation()}
                                                                >
                                                                    <Switch
                                                                        size="small"
                                                                        checked={schedule.enabled}
                                                                        onChange={checked => handleToggle(schedule, checked)}
                                                                        loading={actionLoading === schedule.id}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Row 2: Name */}
                                                            <div style={{ marginBottom: 8 }}>
                                                                <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 4 }} ellipsis>
                                                                    {schedule.name || '未命名'}
                                                                </Text>
                                                                <Space size={4}>
                                                                    <ThunderboltOutlined style={{ fontSize: 11, color: '#8c8c8c' }} />
                                                                    <Text type="secondary" style={{ fontSize: 11 }} ellipsis>
                                                                        {template?.name || schedule.task_id.slice(0, 8)}
                                                                    </Text>
                                                                </Space>
                                                            </div>

                                                            {/* Row 3: Expression/Time + Status Tag */}
                                                            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                                                                {/* Expression or Scheduled Time */}
                                                                {schedule.schedule_type === 'cron' ? (
                                                                    <Tag style={{ margin: 0, fontFamily: 'monospace', fontWeight: 600, background: '#f9f0ff', borderColor: '#d3adf7', color: '#531dab' }}>
                                                                        {schedule.schedule_expr}
                                                                    </Tag>
                                                                ) : (
                                                                    <Tag style={{ margin: 0, background: '#fff7e6', borderColor: '#ffd591', color: '#d46b08' }}>
                                                                        {schedule.scheduled_at ? new Date(schedule.scheduled_at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '未设置'}
                                                                    </Tag>
                                                                )}
                                                                {/* Status Tag */}
                                                                {schedule.status === 'running' ? (
                                                                    <Tag color="green" style={{ margin: 0 }}>运行中</Tag>
                                                                ) : schedule.status === 'pending' ? (
                                                                    <Tag color="processing" style={{ margin: 0 }}>待执行</Tag>
                                                                ) : schedule.status === 'completed' ? (
                                                                    <Tag color="warning" style={{ margin: 0 }}>已完成</Tag>
                                                                ) : (
                                                                    <Tag style={{ margin: 0 }}>已禁用</Tag>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Card Footer */}
                                                        <div style={{
                                                            borderTop: '1px solid #f0f0f0',
                                                            padding: '8px 16px',
                                                            background: '#fafafa',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}>
                                                            <Space size={4}>
                                                                <FieldTimeOutlined style={{ color: (schedule.status === 'running' || schedule.status === 'pending') ? '#1890ff' : '#8c8c8c', fontSize: 11 }} />
                                                                <Text type={(schedule.status === 'running' || schedule.status === 'pending') ? undefined : "secondary"} style={{ fontSize: 11, color: (schedule.status === 'running' || schedule.status === 'pending') ? '#1890ff' : undefined }}>
                                                                    {schedule.next_run_at ? new Date(schedule.next_run_at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '无计划'}
                                                                </Text>
                                                            </Space>
                                                            <Popconfirm
                                                                title={schedule.enabled ? "无法删除运行中的调度" : "确认删除？"}
                                                                description={schedule.enabled ? "请先禁用此调度任务" : undefined}
                                                                onConfirm={() => handleDelete(schedule)}
                                                                okText="删除"
                                                                okButtonProps={{ danger: true, disabled: schedule.enabled }}
                                                                onPopupClick={e => e.stopPropagation()}
                                                            >
                                                                <Tooltip title={schedule.enabled ? "运行中的调度无法删除" : "删除"}>
                                                                    <Button
                                                                        type="text"
                                                                        danger={!schedule.enabled}
                                                                        size="small"
                                                                        icon={<DeleteOutlined style={{ fontSize: 12, color: (schedule.enabled || !access.canManageSchedule) ? '#d9d9d9' : undefined }} />}
                                                                        onClick={e => e.stopPropagation()}
                                                                        disabled={!access.canManageSchedule}
                                                                    />
                                                                </Tooltip>
                                                            </Popconfirm>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </Col>
                                );
                            })}
                        </Row>
                        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                            <Pagination
                                current={scheduleCurrentPage}
                                pageSize={schedulePageSize}
                                total={scheduleTotal}
                                onChange={(page, size) => {
                                    setScheduleCurrentPage(page);
                                    setSchedulePageSize(size);
                                }}
                                showSizeChanger={true}
                                pageSizeOptions={['16', '32', '64']}
                                showQuickJumper
                                showTotal={(total) => `共 ${total} 条`}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    // --- STEP 1: SELECT TEMPLATE (with Full Filters & Pagination like ExecuteTaskPage) ---
    const renderStep1 = () => (
        <div className="mission-control-container" style={{ height: 'auto', overflow: 'visible' }}>
            <div className="launchpad-grid" style={{ height: 'auto', overflow: 'visible' }}>
                <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <Space size="large">
                        <Title level={4} style={{ margin: 0 }}><RocketOutlined /> 选择任务模板</Title>
                        <Text type="secondary">{filteredTemplates.length} 个模板</Text>
                    </Space>
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
                            options={playbooks.map(p => ({ label: p.name, value: p.id }))}
                        />
                        <Checkbox checked={onlyReady} onChange={e => setOnlyReady(e.target.checked)}>
                            仅可用
                        </Checkbox>
                        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
                            返回列表
                        </Button>
                    </Space>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
                ) : filteredTemplates.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<Text type="secondary">没有可用的任务模板</Text>}
                    >
                        <Button type="dashed" onClick={() => history.push('/execution/templates')}>
                            创建新模板
                        </Button>
                    </Empty>
                ) : (
                    <>
                        <Row gutter={[16, 16]}>
                            {paginatedTemplates.map(t => {
                                const { status, text } = getTemplateStatus(t);
                                const disabled = status !== 'success';
                                return (
                                    <Col key={t.id} xs={24} sm={12} md={8} lg={6} xl={4}>
                                        <div
                                            className={`template-card ${selectedTemplate?.id === t.id ? 'template-card-active' : ''}`}
                                            style={{
                                                opacity: disabled ? 0.6 : 1,
                                                cursor: disabled ? 'not-allowed' : 'pointer',
                                                filter: disabled ? 'grayscale(100%)' : 'none'
                                            }}
                                            onClick={() => !disabled && handleSelectTemplate(t)}
                                        >
                                            <div style={{ padding: '16px 16px 12px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                                                    <Avatar
                                                        shape="square"
                                                        size={48}
                                                        style={{ backgroundColor: t.executor_type === 'docker' ? '#722ed1' : '#1890ff' }}
                                                        icon={<ThunderboltOutlined style={{ fontSize: 24 }} />}
                                                    />
                                                    {t.needs_review ? (
                                                        <Tag color="error" style={{ margin: 0, fontSize: 10, lineHeight: '18px' }}>需审核</Tag>
                                                    ) : t.playbook?.status !== 'ready' ? (
                                                        <Tag color="warning" style={{ margin: 0, fontSize: 10, lineHeight: '18px' }}>未上线</Tag>
                                                    ) : (
                                                        <Tag color="success" style={{ margin: 0, fontSize: 10, lineHeight: '18px' }}>就绪</Tag>
                                                    )}
                                                </div>
                                                <div style={{ marginBottom: 8 }}>
                                                    <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 4 }} ellipsis>
                                                        {t.name || '未命名任务'}
                                                    </Text>
                                                    <Space size={4} className="industrial-font">
                                                        <CodeOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
                                                        <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                                                            {t.playbook?.name || '-'}
                                                        </Text>
                                                    </Space>
                                                </div>
                                                <div style={{ marginTop: 8 }}>
                                                    {t.needs_review ? (
                                                        <Tag icon={<WarningOutlined />} color="error" style={{ margin: 0 }}>需审核 / REVIEW</Tag>
                                                    ) : t.playbook?.status !== 'ready' ? (
                                                        <Tag icon={<StopOutlined />} color="warning" style={{ margin: 0 }}>未上线 / OFFLINE</Tag>
                                                    ) : (
                                                        <Tag icon={<CheckCircleOutlined />} color="success" style={{ margin: 0 }}>就绪 / READY</Tag>
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
                                                        {t.target_hosts ? t.target_hosts.split(',').length : 0} 目标
                                                    </Text>
                                                </Space>
                                                <Text type="secondary" style={{ fontSize: 10 }}>ID: {t.id.slice(0, 8)}</Text>
                                            </div>
                                        </div>
                                    </Col>
                                );
                            })}
                        </Row>
                        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                            <Pagination
                                current={currentPage}
                                total={filteredTemplates.length}
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

    // --- STEP 2 & EDIT: COCKPIT LAYOUT ---
    const renderCockpit = () => {
        const isEdit = mode === 'edit';
        const targetTask = isEdit ? templateMap[editingSchedule?.task_id || ''] : selectedTemplate;

        return (
            <div className="mission-control-container" style={{ height: 'auto', overflow: 'visible' }}>
                <div className="execution-cockpit">
                    {/* LEFT PANEL: CONTEXT SIDEBAR */}
                    <div className="cockpit-sidebar">
                        <div className="sidebar-header">
                            <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack} style={{ marginBottom: 8 }}>
                                {isEdit ? '取消编辑' : '重新选择'}
                            </Button>
                            <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>调度 ID</Text>
                                <div className="industrial-tag" style={{ fontSize: 16, fontWeight: 600 }}>
                                    {isEdit ? `#${editingSchedule?.id.slice(0, 8).toUpperCase()}` : '#NEW'}
                                </div>
                            </div>
                        </div>

                        <div className="sidebar-content">

                            {isEdit && editingSchedule && (
                                <div className="info-block">
                                    <div className="info-block-title">当前状态</div>
                                    <div className="industrial-dashed-box" style={{ background: '#fff' }}>
                                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Space size={4} className="text-secondary"><SyncOutlined /> 调度类型</Space>
                                                {editingSchedule.schedule_type === 'cron' ?
                                                    <Tag color="purple" style={{ margin: 0 }}>循环执行</Tag> :
                                                    <Tag color="orange" style={{ margin: 0 }}>单次执行</Tag>
                                                }
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Space size={4} className="text-secondary"><PlayCircleOutlined /> 运行状态</Space>
                                                {editingSchedule.status === 'running' ?
                                                    <Tag color="success" style={{ margin: 0 }}>运行中</Tag> :
                                                    editingSchedule.status === 'pending' ?
                                                        <Tag color="processing" style={{ margin: 0 }}>待执行</Tag> :
                                                        editingSchedule.status === 'completed' ?
                                                            <Tag color="warning" style={{ margin: 0 }}>已完成</Tag> :
                                                            <Tag style={{ margin: 0 }}>已禁用</Tag>
                                                }
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Space size={4} className="text-secondary"><FieldTimeOutlined /> 下次执行</Space>
                                                {formatNextRun(editingSchedule.next_run_at)}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Space size={4} className="text-secondary"><CalendarOutlined /> 创建时间</Space>
                                                <Text style={{ fontSize: 12 }}>{new Date(editingSchedule.created_at).toLocaleDateString()}</Text>
                                            </div>
                                        </Space>
                                    </div>
                                </div>
                            )}

                            {/* 时间配置 - 移到左侧 */}
                            <div className="info-block">
                                <div className="info-block-title">
                                    <Space><ClockCircleOutlined /> 时间配置 (Timing)</Space>
                                </div>
                                <Form form={form} layout="vertical">
                                    <Form.Item name="task_id" hidden><Input /></Form.Item>
                                    <Form.Item
                                        label={<Text strong>调度名称</Text>}
                                        name="name"
                                        rules={[{ required: true, message: '请输入调度名称' }]}
                                        style={{ marginBottom: 12 }}
                                    >
                                        <Input placeholder="例如：每日数据库备份" size="middle" style={{ borderRadius: 2 }} />
                                    </Form.Item>
                                    <Form.Item
                                        label={<Text strong>调度类型</Text>}
                                        name="schedule_type"
                                        rules={[{ required: true, message: '请选择调度类型' }]}
                                        style={{ marginBottom: 12 }}
                                    >
                                        <Radio.Group>
                                            <Radio.Button value="cron">循环执行 (Cron)</Radio.Button>
                                            <Radio.Button value="once">单次执行</Radio.Button>
                                        </Radio.Group>
                                    </Form.Item>
                                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.schedule_type !== curr.schedule_type}>
                                        {({ getFieldValue }) => {
                                            const scheduleType = getFieldValue('schedule_type');
                                            if (scheduleType === 'once') {
                                                return (
                                                    <Form.Item
                                                        label={<Text strong>执行时间</Text>}
                                                        name="scheduled_at"
                                                        rules={[{ required: true, message: '请选择执行时间' }]}
                                                        style={{ marginBottom: 12 }}
                                                    >
                                                        <DatePicker
                                                            showTime
                                                            format="YYYY-MM-DD HH:mm:ss"
                                                            placeholder="选择执行时间"
                                                            style={{ width: '100%' }}
                                                        />
                                                    </Form.Item>
                                                );
                                            }
                                            // Default to CronEditor (for 'cron' or when schedule_type not yet set)
                                            return (
                                                <Form.Item
                                                    label={<Text strong>Cron 表达式</Text>}
                                                    name="schedule_expr"
                                                    rules={[{ required: scheduleType === 'cron', message: '请设置 Cron 表达式' }]}
                                                    style={{ marginBottom: 12 }}
                                                >
                                                    <CronEditor size="middle" />
                                                </Form.Item>
                                            );
                                        }}
                                    </Form.Item>
                                </Form>
                            </div>

                            {/* 通知设置 - 始终显示 */}
                            <div className="info-block">
                                <div className="info-block-title">
                                    <Space><BellOutlined /> 通知配置 (Notification)</Space>
                                </div>
                                <NotificationConfigDisplay
                                    value={selectedTemplate?.notification_config}
                                    channels={channels}
                                    compact
                                />
                                {hasNotificationConfig && (
                                    <div style={{ marginTop: 8 }}>
                                        <Checkbox
                                            checked={skipNotification}
                                            onChange={e => setSkipNotification(e.target.checked)}
                                        >
                                            <Text type="secondary">调度执行时跳过通知</Text>
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

                    {/* RIGHT PANEL: CONFIGURATION CONSOLE */}
                    <div className="cockpit-main">
                        <div className="main-header">
                            <Space align="center">
                                <RocketOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                                <Title level={4} style={{ margin: 0 }}>执行参数覆盖 (Override)</Title>
                            </Space>
                        </div>

                        <div className="main-content">
                            <Alert
                                message="调度执行时，以下参数将覆盖任务模板的默认配置"
                                type="info"
                                showIcon
                                style={{ marginBottom: 16 }}
                            />

                            <Row gutter={24}>
                                {/* Target Hosts Override */}
                                <Col span={12}>
                                    <div className="industrial-dashed-box" style={{ height: '100%' }}>
                                        <div className="industrial-dashed-box-title">
                                            <span><ClusterOutlined /> 目标主机覆盖</span>
                                            <Tag color="orange">覆盖模式</Tag>
                                        </div>

                                        {/* Template Hosts (Read Only) */}
                                        <div style={{ marginBottom: 8 }}>
                                            <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>模板默认:</Text>
                                            <HostList hosts={selectedTemplate?.target_hosts || ''} />
                                        </div>

                                        <Divider style={{ margin: '8px 0' }} dashed />

                                        {/* Override Hosts Selector */}
                                        <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>覆盖主机:</Text>
                                        <HostSelector
                                            value={targetHostsOverride}
                                            onChange={setTargetHostsOverride}
                                        />
                                        <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
                                            留空则使用模板默认主机
                                        </Text>
                                    </div>
                                </Col>

                                {/* Secrets Override */}
                                <Col span={12}>
                                    <div className="industrial-dashed-box" style={{ height: '100%' }}>
                                        <div className="industrial-dashed-box-title">
                                            <span><SafetyCertificateOutlined /> 密钥源覆盖</span>
                                            <Tag color="cyan">可选</Tag>
                                        </div>

                                        <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>选择密钥源:</Text>
                                        <SecretsSelector
                                            value={secretsSourceIds}
                                            onChange={setSecretsSourceIds}
                                            dataSource={secretsSources}
                                        />
                                    </div>
                                </Col>
                            </Row>

                            {/* Variables Override */}
                            {loadingPlaybook ? (
                                <div style={{ textAlign: 'center', padding: 40 }}><Spin tip="加载变量..." /></div>
                            ) : (templatePlaybook?.variables || []).length > 0 && (
                                <>
                                    <Divider orientation="left" style={{ margin: '24px 0 16px' }} plain>
                                        <Space><CodeOutlined /> 变量覆盖 (Variables)</Space>
                                    </Divider>
                                    <Row gutter={[24, 0]}>
                                        {(templatePlaybook?.variables || []).map(v => (
                                            <Col key={v.name} span={12}>
                                                <div className="variable-form-item" style={{ marginBottom: 12 }}>
                                                    <div style={{ marginBottom: 4 }}>
                                                        <Text>{v.name}</Text>
                                                        {v.required && <Text type="danger"> *</Text>}
                                                        {v.description && (
                                                            <Tooltip title={v.description}>
                                                                <span style={{ marginLeft: 6, color: '#8c8c8c', cursor: 'help' }}>?</span>
                                                            </Tooltip>
                                                        )}
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
                                </>
                            )}

                            {/* 备注描述 */}
                            <Divider orientation="left" style={{ margin: '24px 0 16px' }} plain>
                                <Space><SettingOutlined /> 其他设置</Space>
                            </Divider>
                            <Form form={form}>
                                <Form.Item label={<Text strong>备注描述</Text>} name="description" style={{ marginBottom: 0 }}>
                                    <Input.TextArea rows={3} placeholder="可选：任务用途说明..." style={{ borderRadius: 2 }} />
                                </Form.Item>
                            </Form>
                        </div>

                        {/* 右侧底部保存按钮 */}
                        <div className="main-footer">
                            <Button
                                type="primary"
                                size="large"
                                onClick={handleSubmit}
                                loading={actionLoading === 'submit'}
                                style={{
                                    height: 50,
                                    padding: '0 40px',
                                    fontSize: 16,
                                    borderRadius: 2,
                                    boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)'
                                }}
                            >
                                {isEdit ? '保存配置 / SAVE' : '初始化调度 / INITIALIZE'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <PageContainer ghost header={{ title: null, breadcrumb: {} }}>
            {mode === 'list' && renderList()}
            {mode === 'create-step-1' && renderStep1()}
            {(mode === 'create-step-2' || mode === 'edit') && renderCockpit()}

            {/* Modal for enabling once-mode schedule */}
            <Modal
                title="设置执行时间"
                open={enableOnceModal.visible}
                onCancel={() => setEnableOnceModal({ visible: false, schedule: null, newScheduledAt: null })}
                onOk={handleEnableOnce}
                okText="启用调度"
                cancelText="取消"
                confirmLoading={actionLoading === enableOnceModal.schedule?.id}
            >
                <Alert
                    type="info"
                    message="单次执行调度需要设置新的执行时间才能启用"
                    style={{ marginBottom: 16 }}
                    showIcon
                />
                <Form.Item label="执行时间" required>
                    <DatePicker
                        showTime
                        format="YYYY-MM-DD HH:mm:ss"
                        placeholder="选择新的执行时间"
                        style={{ width: '100%' }}
                        value={enableOnceModal.newScheduledAt}
                        onChange={v => setEnableOnceModal(prev => ({ ...prev, newScheduledAt: v }))}
                    />
                </Form.Item>
            </Modal>
        </PageContainer>
    );
};

export default ExecutionSchedulePage;

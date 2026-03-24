import {
    ClockCircleOutlined, ScheduleOutlined, PlusOutlined,
    PlayCircleOutlined, DeleteOutlined, EditOutlined,
    FieldTimeOutlined, RocketOutlined, CodeOutlined,
    ThunderboltOutlined, BellOutlined, SettingOutlined,
    SyncOutlined, PauseCircleOutlined, EyeOutlined
} from '@ant-design/icons';
import {
    Button, message, Space, Tag, Typography,
    Switch, Popconfirm, Tooltip, Card, Spin,
    DatePicker, Modal, Form, Alert, Drawer, Divider
} from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { history, useAccess } from '@umijs/max';
import {
    getExecutionSchedule, getExecutionSchedules, deleteExecutionSchedule,
    enableExecutionSchedule, disableExecutionSchedule, updateExecutionSchedule,
    getExecutionTasks, getExecutionScheduleStats, getScheduleTimeline
} from '@/services/auto-healing/execution';
import { getChannels, getTemplates } from '@/services/auto-healing/notification';
import { getSecretsSources } from '@/services/auto-healing/secrets';
import NotificationConfigDisplay from '@/components/NotificationSelector/NotificationConfigDisplay';
import StandardTable from '@/components/StandardTable';
import type { StandardColumnDef, AdvancedSearchField } from '@/components/StandardTable';
import ScheduleTimeline from './components/ScheduleTimeline';
import { toDayRangeEndISO, toDayRangeStartISO } from '@/utils/dateRange';
import { fetchAllPages } from '@/utils/fetchAllPages';

import './schedule.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

// ==================== SVG Header Icon ====================
const headerIcon = (
    <svg viewBox="0 0 48 48" fill="none">
        <rect x="8" y="6" width="32" height="36" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M8 16h32" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="11" r="1.5" fill="currentColor" />
        <circle cx="24" cy="11" r="1.5" fill="currentColor" />
        <circle cx="32" cy="11" r="1.5" fill="currentColor" />
        <rect x="14" y="22" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="26" y="22" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="14" y="30" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="26" y="30" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
);

const ExecutionSchedulePage: React.FC = () => {
    const access = useAccess();
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Stats — updated from tableRequest
    const [stats, setStats] = useState({ total: 0, active: 0, paused: 0, cron: 0 });

    // Data for sub-components (timeline, upcoming, calendar)
    const [allSchedules, setAllSchedules] = useState<AutoHealing.ExecutionSchedule[]>([]);
    const [templates, setTemplates] = useState<AutoHealing.ExecutionTask[]>([]);
    const [channels, setChannels] = useState<AutoHealing.NotificationChannel[]>([]);
    const [notifyTemplates, setNotifyTemplates] = useState<{ id: string; name: string }[]>([]);
    const [secretsSources, setSecretsSources] = useState<AutoHealing.SecretsSource[]>([]);
    const [vizLoading, setVizLoading] = useState(true);

    // Template map for name resolution
    const templateMap = useMemo(() => {
        const map: Record<string, AutoHealing.ExecutionTask> = {};
        templates.forEach(t => map[t.id] = t);
        return map;
    }, [templates]);

    // Load all schedules & templates for visualization components
    const loadAllData = useCallback(async () => {
        try {
            const [timelineRes, taskRes, chRes, tplRes, secRes] = await Promise.all([
                getScheduleTimeline({ date: dayjs().format('YYYY-MM-DD') }),
                fetchAllPages<AutoHealing.ExecutionTask>((page, pageSize) => getExecutionTasks({ page, page_size: pageSize })),
                fetchAllPages<AutoHealing.NotificationChannel>((page, pageSize) => getChannels({ page, page_size: pageSize })).catch(() => []),
                fetchAllPages<AutoHealing.NotificationTemplate>((page, pageSize) => getTemplates({ page, page_size: pageSize })).catch(() => []),
                getSecretsSources().catch(() => ({ data: [] })),
            ]);
            // 时间轴轻量数据映射为 ExecutionSchedule 形状（仅含时间轴需要的字段）
            const allItems = (timelineRes.data || []).map((t: any) => ({
                ...t,
                // 确保 ScheduleTimeline 组件能读取 task_id
            })) as AutoHealing.ExecutionSchedule[];
            setAllSchedules(allItems);
            setTemplates(taskRes);
            setChannels(chRes as any);
            setNotifyTemplates(tplRes as any);
            setSecretsSources((secRes as any).data || []);
            // 统计从后端 stats API 获取
            getExecutionScheduleStats().then(statsRes => {
                if (statsRes?.data) {
                    const byType = statsRes.data.by_schedule_type || [];
                    const getCronCount = byType.find((x: any) => x.schedule_type === 'cron')?.count || 0;
                    setStats({
                        total: statsRes.data.total || 0,
                        active: statsRes.data.enabled_count || 0,
                        paused: (statsRes.data.disabled_count || 0)
                            + (((statsRes.data.by_status || []).find((x: any) => x.status === 'auto_paused')?.count) || 0),
                        cron: getCronCount,
                    });
                }
            }).catch(() => { });
        } catch (e) {
            console.error(e);
        } finally {
            setVizLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    // Reload when refreshTrigger changes
    useEffect(() => {
        if (refreshTrigger > 0) loadAllData();
    }, [refreshTrigger, loadAllData]);

    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Detail Drawer
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<AutoHealing.ExecutionSchedule | null>(null);

    // Once-mode enable modal
    const [enableOnceModal, setEnableOnceModal] = useState<{
        visible: boolean;
        schedule: AutoHealing.ExecutionSchedule | null;
        newScheduledAt: any;
    }>({ visible: false, schedule: null, newScheduledAt: null });

    const openScheduleDetail = useCallback(async (schedule: AutoHealing.ExecutionSchedule) => {
        setSelectedSchedule(schedule);
        setDrawerVisible(true);
        try {
            const res = await getExecutionSchedule(schedule.id);
            const detail = res?.data || schedule;
            setSelectedSchedule(detail);
        } catch {
            // keep lightweight payload as fallback
        }
    }, []);

    // ==================== Actions ====================
    const handleToggle = async (schedule: AutoHealing.ExecutionSchedule, enabled: boolean) => {
        if (enabled && schedule.schedule_type === 'once') {
            setEnableOnceModal({ visible: true, schedule, newScheduledAt: null });
            return;
        }
        setActionLoading(schedule.id);
        try {
            if (enabled) {
                await enableExecutionSchedule(schedule.id);
                message.success('调度已启用');
            } else {
                await disableExecutionSchedule(schedule.id);
                message.success('调度已暂停');
            }
            setRefreshTrigger(t => t + 1);
        } catch {
            message.error(enabled ? '启用失败' : '暂停失败');
        }
        setActionLoading(null);
    };

    const handleEnableOnce = async () => {
        if (!enableOnceModal.schedule || !enableOnceModal.newScheduledAt) {
            message.warning('请选择新的执行时间');
            return;
        }
        setActionLoading(enableOnceModal.schedule.id);
        try {
            const detailRes = await getExecutionSchedule(enableOnceModal.schedule.id);
            const detail = detailRes?.data || enableOnceModal.schedule;
            await updateExecutionSchedule(enableOnceModal.schedule.id, {
                name: detail.name,
                schedule_type: detail.schedule_type,
                schedule_expr: detail.schedule_expr || undefined,
                scheduled_at: dayjs.isDayjs(enableOnceModal.newScheduledAt)
                    ? enableOnceModal.newScheduledAt.format()
                    : enableOnceModal.newScheduledAt,
                description: detail.description,
                max_failures: detail.max_failures,
                target_hosts_override: detail.target_hosts_override,
                extra_vars_override: detail.extra_vars_override,
                secrets_source_ids: detail.secrets_source_ids,
                skip_notification: detail.skip_notification,
            } as any);
            await enableExecutionSchedule(enableOnceModal.schedule.id);
            message.success('调度已启用');
            setEnableOnceModal({ visible: false, schedule: null, newScheduledAt: null });
            setRefreshTrigger(t => t + 1);
        } catch {
            /* global error handler */
        }
        setActionLoading(null);
    };

    const handleDelete = async (schedule: AutoHealing.ExecutionSchedule) => {
        setActionLoading(schedule.id);
        try {
            await deleteExecutionSchedule(schedule.id);
            message.success('调度已删除');
            setRefreshTrigger(t => t + 1);
        } catch {
            /* global error handler */
        }
        setActionLoading(null);
    };

    const formatNextRun = (nextRun: string | null | undefined) => {
        if (!nextRun) return <Text type="secondary">N/A</Text>;
        const d = dayjs(nextRun);
        const now = dayjs();
        const diff = d.diff(now);
        if (diff < 0) return <Text type="secondary">已过期</Text>;
        return (
            <Tooltip title={d.format('YYYY-MM-DD HH:mm:ss')}>
                <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{d.fromNow()}</Text>
            </Tooltip>
        );
    };

    // ==================== Stats Bar ====================
    const statsBar = useMemo(() => (
        <div className="schedule-stats-bar">
            {[
                { icon: <ScheduleOutlined />, cls: 'total', val: stats.total, lbl: '全部调度' },
                { icon: <PlayCircleOutlined />, cls: 'active', val: stats.active, lbl: '活跃' },
                { icon: <PauseCircleOutlined />, cls: 'paused', val: stats.paused, lbl: '已暂停' },
                { icon: <SyncOutlined />, cls: 'cron', val: stats.cron, lbl: '定时循环' },
            ].map((s, i) => (
                <React.Fragment key={i}>
                    {i > 0 && <div className="schedule-stat-divider" />}
                    <div className="schedule-stat-item">
                        <span className={`schedule-stat-icon schedule-stat-icon-${s.cls}`}>{s.icon}</span>
                        <div className="schedule-stat-content">
                            <div className="schedule-stat-value">{s.val}</div>
                            <div className="schedule-stat-label">{s.lbl}</div>
                        </div>
                    </div>
                </React.Fragment>
            ))}
        </div>
    ), [stats]);

    // ==================== Table Columns ====================
    const columns: StandardColumnDef<AutoHealing.ExecutionSchedule>[] = [
        {
            columnKey: 'name',
            columnTitle: '调度名称',
            dataIndex: 'name',
            width: 200,
            fixedColumn: true,
            sorter: true,
            render: (name: string, record: AutoHealing.ExecutionSchedule) => (
                <Space orientation="vertical" size={0}>
                    <Text strong style={{ fontSize: 13 }}>{name || '未命名'}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        {templateMap[record.task_id]?.name || record.task_id?.slice(0, 8)}
                    </Text>
                </Space>
            ),
        },
        {
            columnKey: 'schedule_type',
            columnTitle: '类型',
            dataIndex: 'schedule_type',
            width: 90,
            render: (type: string) => (
                <Tag color={type === 'cron' ? 'blue' : 'purple'} style={{ margin: 0 }}>
                    {type === 'cron' ? '定时循环' : '单次执行'}
                </Tag>
            ),
        },
        {
            columnKey: 'schedule_expr',
            columnTitle: '表达式',
            dataIndex: 'schedule_expr',
            width: 160,
            render: (expr: string, record: AutoHealing.ExecutionSchedule) => (
                <Text code style={{ fontSize: 11 }}>
                    {record.schedule_type === 'cron' ? expr : (record.scheduled_at ? dayjs(record.scheduled_at).format('MM-DD HH:mm') : '-')}
                </Text>
            ),
        },
        {
            columnKey: 'enabled',
            columnTitle: '状态',
            dataIndex: 'enabled',
            width: 80,
            render: (enabled: boolean, record: AutoHealing.ExecutionSchedule) => (
                <Switch
                    size="small"
                    checked={enabled}
                    loading={actionLoading === record.id}
                    onChange={checked => handleToggle(record, checked)}
                    disabled={!access.canUpdateTask}
                />
            ),
        },
        {
            columnKey: 'next_run_at',
            columnTitle: '下次执行',
            dataIndex: 'next_run_at',
            width: 130,
            sorter: true,
            render: (nextRun: string) => formatNextRun(nextRun),
        },
        {
            columnKey: 'last_run_at',
            columnTitle: '上次执行',
            dataIndex: 'last_run_at',
            width: 130,
            sorter: true,
            render: (lastRun: string) => lastRun
                ? <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>{dayjs(lastRun).format('MM-DD HH:mm')}</Text>
                : <Text type="secondary">-</Text>,
        },
        {
            columnKey: 'actions',
            columnTitle: '操作',
            width: 140,
            fixed: 'right',
            fixedColumn: true,
            render: (_: any, record: AutoHealing.ExecutionSchedule) => (
                <Space separator={<Divider orientation="vertical" />}>
                    <a onClick={() => { openScheduleDetail(record); }}>
                        <Tooltip title="查看详情"><EyeOutlined style={{ fontSize: 16 }} /></Tooltip>
                    </a>
                    {access.canUpdateTask && (
                        <a onClick={() => history.push(`/execution/schedules/${record.id}/edit`)}>
                            <Tooltip title="编辑"><EditOutlined style={{ fontSize: 16 }} /></Tooltip>
                        </a>
                    )}
                    {access.canDeleteTask && (
                        <Popconfirm
                            title="确认删除此调度？"
                            onConfirm={() => handleDelete(record)}
                            okText="确认"
                            cancelText="取消"
                        >
                            <a style={{ color: '#ff4d4f' }}>
                                <Tooltip title="删除"><DeleteOutlined style={{ fontSize: 16 }} /></Tooltip>
                            </a>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    // ==================== Search Fields ====================
    const searchFields = [
        {
            key: 'name',
            label: '调度名称',
            placeholder: '输入调度名称搜索...',
            description: '按调度名称模糊搜索',
        },
        {
            key: '__enum__schedule_type',
            label: '调度类型',
            description: '筛选调度类型（定时循环/单次执行）',
            options: [
                { label: '全部', value: '' },
                { label: '定时循环', value: 'cron' },
                { label: '单次执行', value: 'once' },
            ],
        },
        {
            key: '__enum__enabled',
            label: '启用状态',
            description: '筛选调度启用/禁用状态',
            options: [
                { label: '全部', value: '' },
                { label: '已启用', value: 'true' },
                { label: '已禁用', value: 'false' },
            ],
        },
        {
            key: '__enum__status',
            label: '调度状态',
            description: '筛选调度执行状态',
            options: [
                { label: '全部', value: '' },
                { label: '运行中', value: 'running' },
                { label: '待执行', value: 'pending' },
                { label: '已完成', value: 'completed' },
                { label: '已禁用', value: 'disabled' },
            ],
        },
    ];

    // ==================== Advanced Search Fields ====================
    const advancedSearchFields: AdvancedSearchField[] = [
        { key: 'name', label: '调度名称', type: 'input', placeholder: '输入调度名称（模糊匹配）' },
        {
            key: 'schedule_type', label: '调度类型', type: 'select', options: [
                { label: '定时循环', value: 'cron' },
                { label: '单次执行', value: 'once' },
            ]
        },
        {
            key: 'enabled', label: '启用状态', type: 'select', options: [
                { label: '已启用', value: 'true' },
                { label: '已禁用', value: 'false' },
            ]
        },
        {
            key: 'skip_notification', label: '跳过通知', type: 'select',
            description: '筛选是否跳过执行通知',
            options: [
                { label: '跳过通知', value: 'true' },
                { label: '发送通知', value: 'false' },
            ]
        },
        {
            key: 'has_overrides', label: '执行覆盖', type: 'select',
            description: '筛选是否有主机/变量/密钥覆盖参数',
            options: [
                { label: '有覆盖参数', value: 'true' },
                { label: '无覆盖参数', value: 'false' },
            ]
        },
        {
            key: 'status', label: '调度状态', type: 'select', options: [
                { label: '运行中', value: 'running' },
                { label: '待执行', value: 'pending' },
                { label: '已完成', value: 'completed' },
                { label: '已禁用', value: 'disabled' },
                { label: '自动暂停', value: 'auto_paused' },
            ]
        },
        { key: 'created_at', label: '创建时间', type: 'dateRange' },
    ];

    // ==================== Table Request ====================
    const tableRequest = useCallback(async (params: any) => {
        try {
            const apiParams: any = {
                page: params.page || 1,
                page_size: params.pageSize || 15,
            };

            // 高级搜索 — 通用字段传递（支持 __exact 后缀）
            if (params.advancedSearch) {
                const adv = params.advancedSearch;
                // 布尔字段转换
                const boolKeys = ['enabled', 'skip_notification', 'has_overrides'];
                boolKeys.forEach(bk => {
                    if (adv[bk] !== undefined && adv[bk] !== null && adv[bk] !== '') {
                        apiParams[bk] = adv[bk] === 'true' || adv[bk] === true;
                    }
                });
                // 日期范围
                if (adv.created_at && Array.isArray(adv.created_at) && adv.created_at.length === 2) {
                    apiParams.created_from = toDayRangeStartISO(adv.created_at[0]);
                    apiParams.created_to = toDayRangeEndISO(adv.created_at[1]);
                }
                // 通用字段传递
                const specialKeys = [...boolKeys, 'created_at'];
                Object.entries(adv).forEach(([key, value]) => {
                    if (specialKeys.includes(key) || value === undefined || value === null || value === '') return;
                    apiParams[key] = value;
                });
            }

            // 排序
            if (params.sorter) {
                apiParams.sort_by = params.sorter.field;
                apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
            }

            const res = await getExecutionSchedules(apiParams);
            const items = res.data || [];
            const total = res.total || 0;

            return { data: items, total };
        } catch {
            return { data: [], total: 0 };
        }
    }, []);

    // ==================== Detail Drawer ====================
    const renderDetailDrawer = () => {
        if (!selectedSchedule) return null;
        const template = templateMap[selectedSchedule.task_id];
        const overrideHosts = selectedSchedule.target_hosts_override?.split(',').filter(Boolean) || [];
        const overrideVars = selectedSchedule.extra_vars_override || {};
        const overrideSecrets = selectedSchedule.secrets_source_ids || [];
        const hasOverrides = overrideHosts.length > 0 || Object.keys(overrideVars).length > 0 || overrideSecrets.length > 0;

        const resolveSecretsName = (id: string) => {
            const src = secretsSources.find(s => s.id === id);
            return src?.name || id.slice(0, 8);
        };

        // 统一样式 — 与 TemplateDetailDrawer 一致
        const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #f0f0f0', padding: '20px 24px' };
        const sectionTitleStyle: React.CSSProperties = {
            fontSize: 14, fontWeight: 600, color: '#262626', margin: '0 0 14px 0',
            paddingBottom: 8, borderBottom: '1px dashed #f0f0f0',
            display: 'flex', alignItems: 'center', gap: 8,
        };
        const fieldLabelStyle: React.CSSProperties = { fontSize: 12, color: '#8c8c8c', fontWeight: 500 };
        const fieldValueStyle: React.CSSProperties = { fontSize: 13, color: '#262626', fontWeight: 500, marginTop: 4 };

        return (
            <Drawer
                title="调度详情"
                open={drawerVisible}
                onClose={() => { setDrawerVisible(false); setSelectedSchedule(null); }}
                size={600}
                extra={
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => history.push(`/execution/schedules/${selectedSchedule.id}/edit`)}
                        disabled={!access.canUpdateTask}
                    >
                        编辑
                    </Button>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* 头部 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 16, borderBottom: '1px dashed #f0f0f0' }}>
                        <div style={{
                            width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: selectedSchedule.enabled ? '#e6f7ff' : '#fafafa',
                            border: `1px solid ${selectedSchedule.enabled ? '#91d5ff' : '#d9d9d9'}`,
                        }}>
                            <ScheduleOutlined style={{ fontSize: 20, color: selectedSchedule.enabled ? '#1890ff' : '#bfbfbf' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                                {selectedSchedule.name}
                                <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
                                    #{selectedSchedule.id?.substring(0, 8)}
                                </Text>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                <Tag color={selectedSchedule.schedule_type === 'cron' ? 'blue' : 'purple'} style={{ margin: 0, fontSize: 11 }}>
                                    {selectedSchedule.schedule_type === 'cron' ? '循环执行' : '单次执行'}
                                </Tag>
                                <Tag
                                    color={selectedSchedule.status === 'auto_paused' ? 'orange' : selectedSchedule.enabled ? 'green' : 'default'}
                                    style={{ margin: 0, fontSize: 11 }}
                                >
                                    {selectedSchedule.status === 'auto_paused' ? '自动暂停' : selectedSchedule.enabled ? '已启用' : '已暂停'}
                                </Tag>
                            </div>
                        </div>
                        <Switch
                            size="small"
                            checked={selectedSchedule.enabled}
                            loading={actionLoading === selectedSchedule.id}
                            onChange={checked => handleToggle(selectedSchedule, checked)}
                            disabled={!access.canUpdateTask}
                        />
                    </div>

                    {/* Card: 调度信息 */}
                    <div style={cardStyle}>
                        <h4 style={sectionTitleStyle}>
                            <ClockCircleOutlined style={{ color: '#1890ff' }} />调度信息
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                            <div>
                                <div style={fieldLabelStyle}>{selectedSchedule.schedule_type === 'cron' ? 'Cron 表达式' : '执行时间'}</div>
                                <div style={fieldValueStyle}>
                                    <Text code style={{ fontSize: 12 }}>
                                        {selectedSchedule.schedule_type === 'cron'
                                            ? selectedSchedule.schedule_expr
                                            : (selectedSchedule.scheduled_at ? dayjs(selectedSchedule.scheduled_at).format('YYYY-MM-DD HH:mm:ss') : '-')}
                                    </Text>
                                </div>
                            </div>
                            <div>
                                <div style={fieldLabelStyle}>下次执行</div>
                                <div style={{ ...fieldValueStyle, color: '#1677ff' }}>{formatNextRun(selectedSchedule.next_run_at)}</div>
                            </div>
                            <div>
                                <div style={fieldLabelStyle}>上次执行</div>
                                <div style={fieldValueStyle}>
                                    {selectedSchedule.last_run_at ? dayjs(selectedSchedule.last_run_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
                                </div>
                            </div>
                            <div>
                                <div style={fieldLabelStyle}>创建时间</div>
                                <div style={fieldValueStyle}>
                                    {dayjs(selectedSchedule.created_at).format('YYYY-MM-DD HH:mm')}
                                </div>
                            </div>
                        </div>
                        {selectedSchedule.description && (
                            <>
                                <Divider dashed style={{ margin: '12px 0' }} />
                                <div>
                                    <div style={fieldLabelStyle}>描述</div>
                                    <div style={{ ...fieldValueStyle, fontWeight: 400, color: '#595959' }}>{selectedSchedule.description}</div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Card: 任务模板 */}
                    <div style={cardStyle}>
                        <h4 style={sectionTitleStyle}>
                            <RocketOutlined style={{ color: '#1890ff' }} />任务模板
                        </h4>
                        {template ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                                <div>
                                    <div style={fieldLabelStyle}>模板名称</div>
                                    <div style={fieldValueStyle}>
                                        <Space size={6}>
                                            <RocketOutlined style={{ color: '#1890ff' }} />
                                            <span style={{ fontWeight: 600 }}>{template.name}</span>
                                        </Space>
                                    </div>
                                </div>
                                <div>
                                    <div style={fieldLabelStyle}>执行器类型</div>
                                    <div style={fieldValueStyle}>
                                        {template.executor_type === 'docker' ? 'Docker' : 'SSH/Local'}
                                    </div>
                                </div>
                                <div>
                                    <div style={fieldLabelStyle}>Playbook</div>
                                    <div style={fieldValueStyle}>{template.playbook?.name || '-'}</div>
                                </div>
                                <div>
                                    <div style={fieldLabelStyle}>状态</div>
                                    <div style={fieldValueStyle}>
                                        {template.needs_review
                                            ? <Tag color="warning" style={{ margin: 0 }}>待审核</Tag>
                                            : <Tag color="success" style={{ margin: 0 }}>就绪</Tag>
                                        }
                                    </div>
                                </div>
                                {template.target_hosts && (
                                    <>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <div style={fieldLabelStyle}>默认主机 ({template.target_hosts.split(',').filter(Boolean).length})</div>
                                            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                {template.target_hosts.split(',').filter(Boolean).slice(0, 8).map((h, i) => (
                                                    <div key={i} style={{
                                                        border: '1px dashed #d9d9d9', background: '#fafafa',
                                                        padding: '3px 10px', fontSize: 12, color: '#595959',
                                                    }}>{h.trim()}</div>
                                                ))}
                                                {template.target_hosts.split(',').filter(Boolean).length > 8 && (
                                                    <Text type="secondary" style={{ fontSize: 11, alignSelf: 'center' }}>
                                                        +{template.target_hosts.split(',').filter(Boolean).length - 8}
                                                    </Text>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <Text type="secondary" style={{ fontSize: 12 }}>模板已删除或不可用</Text>
                        )}
                    </div>

                    {/* Card: 执行覆盖 */}
                    <div style={cardStyle}>
                        <h4 style={sectionTitleStyle}>
                            <SettingOutlined style={{ color: '#1890ff' }} />执行覆盖
                            {hasOverrides && (
                                <Tag style={{ marginLeft: 'auto', fontSize: 10 }}>已覆盖</Tag>
                            )}
                        </h4>
                        {!hasOverrides ? (
                            <div style={{ padding: '12px 0', textAlign: 'center', color: '#bfbfbf', fontSize: 12 }}>
                                未配置覆盖参数，将使用模板默认配置
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {overrideHosts.length > 0 && (
                                    <div>
                                        <div style={fieldLabelStyle}>目标主机 ({overrideHosts.length})</div>
                                        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {overrideHosts.slice(0, 8).map((h, i) => (
                                                <div key={i} style={{
                                                    border: '1px dashed #d9d9d9', background: '#fafafa',
                                                    padding: '3px 10px', fontSize: 12, color: '#595959',
                                                }}>{h}</div>
                                            ))}
                                            {overrideHosts.length > 8 && (
                                                <Text type="secondary" style={{ fontSize: 11, alignSelf: 'center' }}>+{overrideHosts.length - 8}</Text>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {Object.keys(overrideVars).length > 0 && (
                                    <div>
                                        <div style={fieldLabelStyle}>变量覆盖 ({Object.keys(overrideVars).length})</div>
                                        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {Object.entries(overrideVars).map(([k, v]) => (
                                                <div key={k} style={{
                                                    display: 'inline-flex', alignItems: 'center',
                                                    padding: '4px 10px', background: '#fafafa',
                                                    border: '1px solid #f0f0f0', fontSize: 12,
                                                    fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
                                                }}>
                                                    <span style={{ color: '#262626', fontWeight: 600 }}>{k}</span>
                                                    <span style={{ color: '#bfbfbf', margin: '0 6px' }}>=</span>
                                                    <span style={{ color: '#8c8c8c' }}>{typeof v === 'string' ? v : JSON.stringify(v)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {overrideSecrets.length > 0 && (
                                    <div>
                                        <div style={fieldLabelStyle}>密钥源</div>
                                        <div style={{ marginTop: 6 }}>
                                            <Space size={4} wrap>
                                                {overrideSecrets.map((id, i) => (
                                                    <Tag key={i} icon={<EyeOutlined />} color="blue" style={{ margin: 0, fontSize: 11 }}>
                                                        {resolveSecretsName(id)}
                                                    </Tag>
                                                ))}
                                            </Space>
                                        </div>
                                    </div>
                                )}

                            </div>
                        )}
                    </div>

                    {/* Card: 通知配置 */}
                    <div style={cardStyle}>
                        <h4 style={sectionTitleStyle}>
                            <BellOutlined style={{ color: '#1890ff' }} />通知配置
                        </h4>
                        {selectedSchedule.skip_notification ? (
                            <div style={{ padding: '12px 0', textAlign: 'center', color: '#faad14', fontSize: 12 }}>
                                <Tag color="warning" style={{ margin: 0 }}>已跳过通知</Tag>
                                <div style={{ marginTop: 6, color: '#8c8c8c', fontSize: 11 }}>本次调度执行将不发送通知</div>
                            </div>
                        ) : (
                            <NotificationConfigDisplay
                                value={template?.notification_config}
                                channels={channels}
                                templates={notifyTemplates}
                                compact
                            />
                        )}
                    </div>

                </div>
            </Drawer>
        );
    };

    // ==================== Visualization Section (between header and table) ====================
    const vizSection = useMemo(() => (
        <div className="schedule-viz-section">
            {/* 今日时间轴 */}
            <Card
                size="small"
                title={
                    <Space>
                        <FieldTimeOutlined style={{ color: '#722ed1' }} />
                        <span>今日时间轴</span>
                        <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
                            {dayjs().format('YYYY年M月D日 dddd')}
                        </Text>
                    </Space>
                }
                className="schedule-viz-card"
            >
                {vizLoading ? (
                    <div style={{ textAlign: 'center', padding: 24 }}><Spin size="small" /></div>
                ) : (
                    <ScheduleTimeline
                        schedules={allSchedules}
                        templateMap={templateMap}
                        onScheduleClick={openScheduleDetail}
                    />
                )}
            </Card>

        </div>
    ), [vizLoading, allSchedules, templateMap]);

    return (
        <>
            <StandardTable<AutoHealing.ExecutionSchedule>
                tabs={[{ key: 'list', label: '调度列表' }]}
                title="定时调度"
                description="管理定时调度任务，配置执行频率和时间窗口。"
                headerIcon={headerIcon}
                headerExtra={statsBar}
                afterHeader={vizSection}
                searchFields={searchFields}
                advancedSearchFields={advancedSearchFields}
                columns={columns}
                rowKey="id"
                request={tableRequest}
                defaultPageSize={15}
                preferenceKey="execution_schedules"
                refreshTrigger={refreshTrigger}
                primaryActionLabel="创建调度"
                primaryActionIcon={<PlusOutlined />}
                primaryActionDisabled={!access.canCreateTask}
                onPrimaryAction={() => history.push('/execution/schedules/create')}
                onRowClick={openScheduleDetail}
            />

            {/* Detail Drawer */}
            {renderDetailDrawer()}

            {/* Enable Once Modal */}
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
        </>
    );
};

export default ExecutionSchedulePage;

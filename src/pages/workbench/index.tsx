import React, { useEffect, useState, useCallback } from 'react';
import TeamsAvatar from '@/components/TeamsAvatar';
import {
    ACTION_LABELS as _ACTION_LABELS,
    ALL_RESOURCE_LABELS as _ALL_RESOURCE_LABELS,
} from '@/constants/auditDicts';
import {
    INCIDENT_SEVERITY_MAP as _SEVERITY_MAP,
} from '@/constants/incidentDicts';
import { LockOutlined } from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import {
    CheckCircleOutlined,
    WarningOutlined,
    PlusOutlined,
    PlayCircleOutlined,
    ReadOutlined,
    BugOutlined,
    DatabaseOutlined,
    ToolOutlined,
    ThunderboltOutlined,
    BellOutlined,
    KeyOutlined,
    UserOutlined,
    CloudServerOutlined,
    AppstoreOutlined,
    RocketOutlined,
    ClockCircleOutlined,
    RightOutlined,
    SyncOutlined,
    CloseCircleOutlined,
    AlertOutlined,
    ScheduleOutlined,
    HistoryOutlined,

    ApiOutlined,
    HddOutlined,
    ImportOutlined,
    FolderAddOutlined,
    BranchesOutlined,
    LoadingOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import { Button, Card, Tag, Avatar, Calendar, Spin, Empty, message } from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import {
    getWorkbenchOverview,
    getScheduleCalendar,
    getWorkbenchFavorites,
    type WorkbenchOverview,
    type ScheduleTask,
    type FavoriteItem,
} from '@/services/auto-healing/workbench';
import { getSiteMessages, markAsRead, type SiteMessage } from '@/services/auto-healing/siteMessage';
import { getAuditLogs } from '@/services/auto-healing/auditLogs';
import { SERVICES } from '@/config/navData';
import { getPendingApprovals, getPendingTriggers } from '@/services/auto-healing/healing';
import { GUIDE_ARTICLES, type GuideArticle } from '@/pages/guide/guideData';
import GuideDrawer from './GuideDrawer';

/* ══════════════════════════════════════════════════
   ██  图标映射表
   ══════════════════════════════════════════════════ */

const iconMap: Record<string, React.ReactNode> = {
    DatabaseOutlined: <DatabaseOutlined />,
    ToolOutlined: <ToolOutlined />,
    ThunderboltOutlined: <ThunderboltOutlined />,
    RocketOutlined: <RocketOutlined />,
    ReadOutlined: <ReadOutlined />,
    BellOutlined: <BellOutlined />,
    KeyOutlined: <KeyOutlined />,
    UserOutlined: <UserOutlined />,
    CloudServerOutlined: <CloudServerOutlined />,
    ScheduleOutlined: <ScheduleOutlined />,
    PlayCircleOutlined: <PlayCircleOutlined />,
    AppstoreOutlined: <AppstoreOutlined />,
};

/** 根据收藏项的 key 从菜单配置中查找对应图标 */
function resolveFavIcon(key: string): React.ReactNode {
    for (const items of Object.values(SERVICES)) {
        const match = items.find((svc) => svc.id === key);
        if (match?.icon) return match.icon;
    }
    return <AppstoreOutlined />;
}

/** 默认收藏（用户未设置时使用） */
const DEFAULT_FAVORITES: FavoriteItem[] = [
    { key: 'cmdb', label: '资产管理', icon: 'DatabaseOutlined', path: '/cmdb' },
    { key: 'rules', label: '自愈规则', icon: 'ToolOutlined', path: '/healing/rules' },
    { key: 'flows', label: '自愈流程', icon: 'ThunderboltOutlined', path: '/healing/flows' },
    { key: 'exec', label: '执行管理', icon: 'RocketOutlined', path: '/execution' },
    { key: 'playbook', label: 'Playbook', icon: 'ReadOutlined', path: '/execution/playbooks' },
    { key: 'notify', label: '通知模板', icon: 'BellOutlined', path: '/notification/templates' },
    { key: 'secrets', label: '密钥管理', icon: 'KeyOutlined', path: '/resources/secrets' },
    { key: 'users', label: '用户管理', icon: 'UserOutlined', path: '/system/users' },
];

/* ── 帮助指南（纯前端静态数据） ── */
/* helpGuides 数据已迁移到 guideData.tsx 统一维护 */



/* ══════════════════════════════════════════════════
   ██  工具函数
   ══════════════════════════════════════════════════ */

/** 将秒数格式化为 "Xd Xh" */
function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}天 ${hours}小时`;
    if (hours > 0) return `${hours}小时`;
    const mins = Math.floor((seconds % 3600) / 60);
    return `${mins}分钟`;
}

/** 将 ISO 时间格式化为相对时间 */
function formatRelativeTime(isoStr: string): string {
    const now = dayjs();
    const t = dayjs(isoStr);
    const diffMin = now.diff(t, 'minute');
    if (diffMin < 1) return '刚刚';
    if (diffMin < 60) return `${diffMin}分钟前`;
    const diffHour = now.diff(t, 'hour');
    if (diffHour < 24) return `${diffHour}小时前`;
    const diffDay = now.diff(t, 'day');
    if (diffDay < 30) return `${diffDay}天前`;
    return t.format('MM-DD');
}

/* ── 合并高频定时任务 ── */
interface MergedTask {
    name: string;
    schedule_id: string;
    /** 原始次数 */
    count: number;
    /** 展示用时间：单次显示具体时间，高频显示摘要 */
    displayTime: string;
    /** 是否被合并 */
    isMerged: boolean;
}

/** 频率阈值：同一任务每天超过此次数则合并展示 */
const MERGE_THRESHOLD = 3;

function mergeScheduleTasks(tasks: ScheduleTask[]): MergedTask[] {
    // 按 schedule_id 分组
    const groups = new Map<string, ScheduleTask[]>();
    for (const t of tasks) {
        const key = t.schedule_id;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(t);
    }

    const result: MergedTask[] = [];
    for (const [sid, items] of groups) {
        if (items.length <= MERGE_THRESHOLD) {
            // 次数少，逐条展示
            for (const it of items) {
                result.push({ name: it.name, schedule_id: sid, count: 1, displayTime: it.time, isMerged: false });
            }
        } else {
            // 高频任务：合并为一条，智能生成频率摘要
            const summary = buildFrequencySummary(items);
            result.push({ name: items[0].name, schedule_id: sid, count: items.length, displayTime: summary, isMerged: true });
        }
    }

    // 未合并的按时间排序，合并的排在最后
    result.sort((a, b) => {
        if (a.isMerged !== b.isMerged) return a.isMerged ? 1 : -1;
        return a.displayTime.localeCompare(b.displayTime);
    });

    return result;
}

/** 分析任务时间列表，生成可读的频率描述 */
function buildFrequencySummary(items: ScheduleTask[]): string {
    const times = items.map(t => t.time).sort();
    const count = times.length;

    // 检查是否等间距
    if (count >= 2) {
        const minutes = times.map(t => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        });
        const intervals = new Set<number>();
        for (let i = 1; i < minutes.length; i++) {
            intervals.add(minutes[i] - minutes[i - 1]);
        }
        if (intervals.size === 1) {
            const interval = [...intervals][0];
            const minutePart = times[0].split(':')[1];
            if (interval === 60) return `每小时 :${minutePart}`;
            if (interval === 30) return `每30分钟`;
            if (interval === 120) return `每2小时 :${minutePart}`;
            if (interval === 180) return `每3小时 :${minutePart}`;
            if (interval === 240) return `每4小时 :${minutePart}`;
            if (interval === 360) return `每6小时 :${minutePart}`;
            return `每${interval}分钟`;
        }
    }

    // 非等间距，显示首尾 + 次数
    return `${times[0]}~${times[times.length - 1]}`;
}

/* ══════════════════════════════════════════════════
   ██  平台资源概览映射
   ══════════════════════════════════════════════════ */

function buildPlatformStats(overview?: WorkbenchOverview['resource_overview']) {
    if (!overview) return [];
    const r = overview;
    return [
        { icon: <ThunderboltOutlined />, label: '自愈流程', value: r.flows.total, sub: `${r.flows.enabled ?? 0} 已启用`, color: '#1677ff', path: '/healing/flows', locked: r.flows.total === 0 && !r.flows.enabled },
        { icon: <ToolOutlined />, label: '自愈规则', value: r.rules.total, sub: `${r.rules.enabled ?? 0} 已启用`, color: '#52c41a', path: '/healing/rules', locked: r.rules.total === 0 && !r.rules.enabled },
        { icon: <DatabaseOutlined />, label: '纳管主机', value: r.hosts.total, sub: `${r.hosts.offline ?? 0} 离线`, color: '#722ed1', path: '/cmdb', locked: r.hosts.total === 0 && !r.hosts.offline },
        { icon: <ReadOutlined />, label: 'Playbook', value: r.playbooks.total, sub: `${r.playbooks.needs_review ?? 0} 需审查`, color: '#eb2f96', path: '/execution/playbooks', locked: r.playbooks.total === 0 && !r.playbooks.needs_review },
        { icon: <ScheduleOutlined />, label: '定时任务', value: r.schedules.total, sub: `${r.schedules.enabled ?? 0} 已启用`, color: '#fa8c16', path: '/execution/schedules', locked: r.schedules.total === 0 && !r.schedules.enabled },
        { icon: <BellOutlined />, label: '通知模板', value: r.notification_templates.total, sub: `${r.notification_templates.channels ?? 0} 个渠道`, color: '#13c2c2', path: '/notification/templates', locked: r.notification_templates.total === 0 && !r.notification_templates.channels },
        { icon: <KeyOutlined />, label: '密钥管理', value: r.secrets.total, sub: r.secrets.types || '', color: '#2f54eb', path: '/resources/secrets', locked: r.secrets.total === 0 && !r.secrets.types },
        { icon: <UserOutlined />, label: '系统用户', value: r.users.total, sub: `${r.users.admins ?? 0} 管理员`, color: '#8c8c8c', path: '/system/users', locked: r.users.total === 0 && !r.users.admins },
    ];
}

/* ══════════════════════════════════════════════════
   ██  样式
   ══════════════════════════════════════════════════ */

const useStyles = createStyles(({ token }) => ({
    page: {
        padding: 24,
        minHeight: 'calc(100vh - 48px)',
    },
    container: {
        maxWidth: 1600,
        margin: '0 auto',
        display: 'flex',
        gap: 20,
    },
    leftCol: {
        flex: 3,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 16,
        minWidth: 0,
    },
    rightCol: {
        flex: 1,
        minWidth: 280,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 12,
        alignSelf: 'flex-start',
        position: 'sticky' as const,
        top: 24,
    },

    /* ── 卡片 ── */
    card: {
        boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
    },
    cardHeader: {
        padding: '12px 16px',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: 600,
        color: '#595959',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    cardTitleIcon: {
        fontSize: 16,
        color: '#8c8c8c',
    },
    cardLink: {
        fontSize: 12,
        color: token.colorPrimary,
        cursor: 'pointer',
        '&:hover': { textDecoration: 'underline' },
    },
    cardBody: {
        padding: 16,
    },

    /* ── 顶部行 ── */
    topRow: {
        display: 'flex',
        gap: 20,
        alignItems: 'stretch',
    },

    /* ── 待办审批（紧凑版） ── */
    pendingItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderBottom: '1px solid #f5f5f5',
        cursor: 'pointer',
        transition: 'background 0.15s',
        '&:hover': { background: '#fafafa' },
        '&:last-child': { borderBottom: 'none' },
    },
    pendingDot: {
        width: 6,
        height: 6,
        borderRadius: '50%',
        flexShrink: 0,
    },
    pendingContent: {
        flex: 1,
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    pendingTitle: {
        fontSize: 13,
        fontWeight: 500,
        color: '#262626',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
    },
    pendingType: {
        fontSize: 11,
        color: '#bfbfbf',
        flexShrink: 0,
    },
    pendingTime: {
        fontSize: 11,
        color: '#bfbfbf',
        flexShrink: 0,
    },
    pendingAction: {
        flexShrink: 0,
    },

    /* ── 我的收藏 ── */
    favGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: 0,
    },
    favItem: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: 6,
        padding: '14px 8px 12px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        '&:hover': {
            background: '#f5f7fa',
        },
    },
    favIconWrap: {
        fontSize: 22,
        color: '#595959',
    },
    favName: {
        fontSize: 12,
        color: '#595959',
    },

    /* ── 指标行 ── */
    metricsRow: {
        display: 'flex',
        gap: 16,
    },
    metricCenter: {
        display: 'flex',
        justifyContent: 'space-around',
        padding: '12px 0',
    },
    metricValue: {
        textAlign: 'center' as const,
    },
    metricNumber: {
        fontSize: 24,
        fontWeight: 600,
        lineHeight: '30px',
    },
    metricLabel: {
        fontSize: 12,
        color: '#8c8c8c',
        marginTop: 2,
    },

    /* ── 我的流程 + 规则通用 ── */
    flowRuleRow: {
        display: 'flex',
        gap: 16,
    },

    /* ── 右侧卡片 ── */
    actionBtn: {
        width: '100%',
        justifyContent: 'flex-start',
        marginBottom: 8,
    },
    userHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
    },
    userName: {
        fontSize: 15,
        fontWeight: 600,
        color: '#262626',
    },
    userRole: {
        fontSize: 12,
        color: '#8c8c8c',
    },
    announcement: {
        padding: '10px 0',
        borderBottom: '1px solid #f5f5f5',
        cursor: 'pointer',
        '&:last-child': { borderBottom: 'none' },
        '&:hover': { background: '#fafafa', marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16 },
    },
    announcementTitle: {
        fontSize: 13,
        fontWeight: 500,
        color: '#262626',
        '&:hover': { color: token.colorPrimary },
    },
    announcementSummary: {
        fontSize: 12,
        color: '#8c8c8c',
        marginTop: 2,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
    },
    announcementDate: {
        fontSize: 11,
        color: '#bfbfbf',
        marginTop: 2,
    },



    /* ── 定时任务日历 ── */
    calendarWrap: {
        '.ant-picker-calendar': {
            '.ant-picker-panel': {
                borderTop: 'none',
            },
            '.ant-picker-date-panel': {
                '.ant-picker-body': {
                    padding: '0 4px 4px',
                },
                'th': {
                    padding: '4px 0',
                    fontSize: 11,
                    color: '#8c8c8c',
                },
                '.ant-picker-cell': {
                    padding: '2px 0',
                    '.ant-picker-cell-inner': {
                        height: 28,
                        width: 28,
                        lineHeight: '28px',
                        fontSize: 12,
                    },
                },
                '.ant-picker-cell:not(.ant-picker-cell-in-view)': {
                    visibility: 'hidden' as const,
                },
            },
        },
    },
    scheduleTaskItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 8px',
        marginBottom: 4,
        borderLeft: '3px solid #1677ff',
        background: '#f6f8ff',
        '&:last-child': { marginBottom: 0 },
    },
    scheduleTaskTime: {
        fontSize: 11,
        fontWeight: 600,
        color: '#1677ff',
        flexShrink: 0,
        fontFamily: 'monospace',
    },
    scheduleTaskName: {
        fontSize: 12,
        color: '#262626',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
    },

    /* ── 平台资源概览 ── */
    resourceGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 0,
    },
    resourceItem: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        padding: '14px 8px',
        cursor: 'pointer',
        borderRight: '1px solid #f5f5f5',
        borderBottom: '1px solid #f5f5f5',
        '&:nth-child(4n)': { borderRight: 'none' },
        '&:nth-child(n+5)': { borderBottom: 'none' },
        '&:hover': { background: '#fafafa' },
    },
    resourceIcon: {
        fontSize: 22,
        marginBottom: 4,
    },
    resourceValue: {
        fontSize: 20,
        fontWeight: 700,
        color: '#262626',
        lineHeight: 1.2,
    },
    resourceLabel: {
        fontSize: 12,
        color: '#595959',
        marginTop: 2,
    },
    resourceSub: {
        fontSize: 10,
        color: '#bfbfbf',
        marginTop: 1,
    },

    /* ── 变更记录 ── */
    changeItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        borderBottom: '1px solid #f5f5f5',
        '&:last-child': { borderBottom: 'none' },
    },
    changeAvatar: {
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: '#e6f4ff',
        color: '#1677ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        fontWeight: 600,
        flexShrink: 0,
    },
    changeContent: {
        flex: 1,
        minWidth: 0,
    },
    changeText: {
        fontSize: 13,
        color: '#262626',
    },
    changeDetail: {
        fontSize: 11,
        color: '#8c8c8c',
        marginTop: 1,
    },
    changeTime: {
        fontSize: 11,
        color: '#bfbfbf',
        flexShrink: 0,
    },

    /* ── 帮助指南 ── */
    guideItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        borderBottom: '1px solid #f5f5f5',
        cursor: 'pointer',
        '&:last-child': { borderBottom: 'none' },
        '&:hover': { background: '#f6f8ff' },
    },
    guideIcon: {
        width: 32,
        height: 32,
        background: '#e6f4ff',
        color: '#1677ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        flexShrink: 0,
    },
    guideContent: {
        flex: 1,
        minWidth: 0,
    },
    guideTitle: {
        fontSize: 13,
        fontWeight: 500,
        color: '#262626',
    },
    guideDesc: {
        fontSize: 11,
        color: '#8c8c8c',
        marginTop: 1,
    },

    /* ── Loading/Empty ── */
    loadingWrap: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px 0',
    },

    /* ── 权限锁定遮罩 ── */
    lockedOverlay: {
        position: 'absolute' as const,
        inset: 0,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        background: 'rgba(250, 250, 250, 0.85)',
        backdropFilter: 'blur(2px)',
        zIndex: 2,
        cursor: 'not-allowed',
    },
    lockedIcon: {
        fontSize: 20,
        color: '#d9d9d9',
    },
    lockedText: {
        fontSize: 11,
        color: '#bfbfbf',
        fontWeight: 500,
    },
    lockedResourceItem: {
        opacity: 0.35,
        cursor: 'not-allowed',
        '&:hover': { background: 'transparent' },
    },
}));

/* ══════════════════════════════════════════════════
   ██  组件
   ══════════════════════════════════════════════════ */

const WorkbenchPage: React.FC = () => {
    const { styles, cx } = useStyles();
    const { initialState } = useModel('@@initialState');
    const user = initialState?.currentUser;
    const displayName = user?.name || (user as any)?.display_name || (user as any)?.username || '用户';
    const seed = (user as any)?.username || displayName;
    const role = (user as any)?.access === 'admin' ? '系统管理员' : '普通用户';

    /* ══ 数据状态 ══ */
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<WorkbenchOverview | null>(null);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);

    const [pendingApprovals, setPendingApprovals] = useState<{ total: number; items: any[] }>({ total: 0, items: [] });
    const [scheduleData, setScheduleData] = useState<Record<string, ScheduleTask[]>>({});
    const [announcements, setAnnouncements] = useState<SiteMessage[]>([]);
    const [favorites, setFavorites] = useState<FavoriteItem[]>(DEFAULT_FAVORITES);

    /* 引导 Drawer */
    const [guideDrawerOpen, setGuideDrawerOpen] = useState(false);
    const [guideDrawerArticle, setGuideDrawerArticle] = useState<GuideArticle | null>(null);

    /* 日历选中日期 */
    const [selectedDate, setSelectedDate] = useState<string>(() => dayjs().format('YYYY-MM-DD'));
    const [calendarMonth, setCalendarMonth] = useState<Dayjs>(dayjs());

    /* ══ 数据加载 ══ */
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [overviewRes, calendarRes, announcementsRes, favoritesRes, auditRes, approvalsRes, triggersRes] =
                await Promise.allSettled([
                    getWorkbenchOverview(),
                    getScheduleCalendar(dayjs().year(), dayjs().month() + 1),
                    getSiteMessages({ category: 'announcement', page: 1, page_size: 5 }),
                    getWorkbenchFavorites(),
                    getAuditLogs({ page: 1, page_size: 10, exclude_action: 'login', sort_by: 'created_at', sort_order: 'desc' }),
                    getPendingApprovals({ page: 1, page_size: 5 }),
                    getPendingTriggers({ page: 1, page_size: 5 }),
                ]);

            if (overviewRes.status === 'fulfilled' && overviewRes.value?.data) {
                setOverview(overviewRes.value.data);
            }
            if (calendarRes.status === 'fulfilled' && calendarRes.value?.data?.dates) {
                setScheduleData(calendarRes.value.data.dates);
            }
            if (announcementsRes.status === 'fulfilled' && announcementsRes.value?.data) {
                const items = Array.isArray(announcementsRes.value.data) ? announcementsRes.value.data : [];
                setAnnouncements(items);
            }
            if (favoritesRes.status === 'fulfilled' && favoritesRes.value?.data?.items) {
                const items = favoritesRes.value.data.items;
                if (items.length > 0) {
                    setFavorites(items);
                }
            }
            if (auditRes.status === 'fulfilled' && auditRes.value?.data) {
                const logs = Array.isArray(auditRes.value.data) ? auditRes.value.data : [];
                setAuditLogs(logs);
            }

            // 合并待触发工单 + 待审批任务
            {
                const triggers = triggersRes.status === 'fulfilled' ? (Array.isArray(triggersRes.value?.data) ? triggersRes.value.data : []) : [];
                const approvals = approvalsRes.status === 'fulfilled' ? (Array.isArray(approvalsRes.value?.data) ? approvalsRes.value.data : []) : [];
                const triggerTotal = triggersRes.status === 'fulfilled' ? (triggersRes.value?.total ?? 0) : 0;
                const approvalTotal = approvalsRes.status === 'fulfilled' ? (approvalsRes.value?.total ?? 0) : 0;
                // 给每条加上类型标记
                const mergedItems = [
                    ...triggers.map((t: any) => ({ ...t, _pendingType: 'trigger' })),
                    ...approvals.map((a: any) => ({ ...a, _pendingType: 'approval' })),
                ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setPendingApprovals({ total: triggerTotal + approvalTotal, items: mergedItems });
            }
        } catch (err) {
            console.error('[Workbench] Load data failed:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    /* 切换日历月份时重新加载日历数据 */
    const handleCalendarMonthChange = useCallback(async (date: Dayjs) => {
        setCalendarMonth(date);
        try {
            const res = await getScheduleCalendar(date.year(), date.month() + 1);
            if (res?.data?.dates) {
                setScheduleData(res.data.dates);
            }
        } catch {
            // ignore
        }
    }, []);

    /* ══ 系统健康状态颜色映射 ══ */
    const healthStatus = overview?.system_health?.status || 'healthy';
    const healthColor = healthStatus === 'healthy' ? '#52c41a' : healthStatus === 'degraded' ? '#faad14' : '#ff4d4f';
    const healthLabel = healthStatus === 'healthy' ? '正常' : healthStatus === 'degraded' ? '降级' : '异常';
    const healthTagColor = healthStatus === 'healthy' ? 'success' : healthStatus === 'degraded' ? 'warning' : 'error';
    const healthTagLabel = healthStatus === 'healthy' ? '运行中' : healthStatus === 'degraded' ? '降级运行' : '异常';
    const HealthIcon = healthStatus === 'healthy' ? CheckCircleOutlined : healthStatus === 'degraded' ? ExclamationCircleOutlined : CloseCircleOutlined;

    const platformStats = buildPlatformStats(overview?.resource_overview);

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* ══════ 左栏 ══════ */}
                <div className={styles.leftCol}>

                    {/* ── 顶部行：系统健康 + 待办审批 ── */}
                    <div id="tour-overview" className={styles.topRow}>
                        {/* 系统健康 */}
                        <Card className={styles.card} style={{ flex: 1, minHeight: 260, display: 'flex', flexDirection: 'column' }} styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', flex: 1 } }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>
                                    <HealthIcon className={styles.cardTitleIcon} style={{ color: healthColor }} /> 系统健康状态
                                </span>
                                <Tag color={healthTagColor} style={{ margin: 0, fontSize: 10, height: 20, lineHeight: '20px' }}>{healthTagLabel}</Tag>
                            </div>
                            {loading ? (
                                <div className={styles.loadingWrap}><Spin /></div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr 1fr', flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderRight: '1px solid #f5f5f5', borderBottom: '1px solid #f5f5f5' }}>
                                        <HealthIcon style={{ fontSize: 22, color: healthColor }} />
                                        <div>
                                            <div style={{ fontSize: 11, color: '#8c8c8c' }}>运行状态</div>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: healthColor }}>{healthLabel}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderBottom: '1px solid #f5f5f5' }}>
                                        <SyncOutlined style={{ fontSize: 22, color: '#1677ff' }} />
                                        <div>
                                            <div style={{ fontSize: 11, color: '#8c8c8c' }}>系统版本</div>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: '#262626' }}>{overview?.system_health?.version || '-'}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderRight: '1px solid #f5f5f5', borderBottom: '1px solid #f5f5f5' }}>
                                        <ClockCircleOutlined style={{ fontSize: 22, color: '#722ed1' }} />
                                        <div>
                                            <div style={{ fontSize: 11, color: '#8c8c8c' }}>运行时间</div>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: '#262626' }}>{overview?.system_health ? formatUptime(overview.system_health.uptime_seconds) : '-'}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderBottom: '1px solid #f5f5f5' }}>
                                        <CloudServerOutlined style={{ fontSize: 22, color: '#13c2c2' }} />
                                        <div>
                                            <div style={{ fontSize: 11, color: '#8c8c8c' }}>环境</div>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: '#262626' }}>{overview?.system_health?.environment || '-'}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderRight: '1px solid #f5f5f5' }}>
                                        <ApiOutlined style={{ fontSize: 22, color: '#fa8c16' }} />
                                        <div>
                                            <div style={{ fontSize: 11, color: '#8c8c8c' }}>API 响应</div>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: '#262626' }}>{overview?.system_health?.api_latency_ms ?? '-'}ms</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px' }}>
                                        <DatabaseOutlined style={{ fontSize: 22, color: '#eb2f96' }} />
                                        <div>
                                            <div style={{ fontSize: 11, color: '#8c8c8c' }}>数据库</div>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: '#262626' }}>{overview?.system_health?.db_latency_ms ?? '-'}ms</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* 待办审批（待触发工单 + 待审批任务） */}
                        <Card className={styles.card} style={{ flex: 1 }} styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', flex: 1 } }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>
                                    <ScheduleOutlined className={styles.cardTitleIcon} /> 待办审批
                                </span>
                                <span className={styles.cardLink} onClick={() => history.push('/pending/triggers')}>
                                    查看全部 <RightOutlined style={{ fontSize: 10 }} />
                                </span>
                            </div>
                            {loading ? (
                                <div className={styles.loadingWrap}><Spin /></div>
                            ) : pendingApprovals.total === 0 ? (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无待办任务" />
                                </div>
                            ) : (
                                <div style={{ padding: 0, flex: 1 }}>
                                    {pendingApprovals.items.slice(0, 5).map((item: any) => {
                                        const sev = _SEVERITY_MAP[item.severity] || _SEVERITY_MAP.medium;
                                        return (
                                            <div key={item.id} className={styles.pendingItem} onClick={() => history.push(item._pendingType === 'trigger' ? '/pending/triggers' : '/pending/approvals')}>
                                                <span className={styles.pendingDot} style={{ background: sev.color }} />
                                                <div className={styles.pendingContent}>
                                                    <span className={styles.pendingTitle} style={{ flex: 1, minWidth: 0 }}>{item.title || item.node_name || '待办任务'}</span>
                                                    <Tag color={sev.color} style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px', borderRadius: 2, flexShrink: 0 }}>{sev.text}</Tag>
                                                    <span className={styles.pendingType}>{item._pendingType === 'trigger' ? '自愈' : '任务'}</span>
                                                </div>
                                                <span className={styles.pendingTime}>{item.created_at ? formatRelativeTime(item.created_at) : ''}</span>
                                            </div>
                                        );
                                    })}
                                    {pendingApprovals.total > 5 && (
                                        <div style={{ textAlign: 'center', padding: '8px 0' }}>
                                            <Button type="link" size="small" onClick={() => history.push('/pending/triggers')}>
                                                还有 {pendingApprovals.total - 5} 条待审批
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* ── 我的收藏 ── */}
                    <Card id="tour-favorites" className={styles.card} styles={{ body: { padding: 0 } }}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>
                                <AppstoreOutlined className={styles.cardTitleIcon} /> 我的收藏
                            </span>
                        </div>
                        {loading ? (
                            <div className={styles.loadingWrap}><Spin /></div>
                        ) : (
                            <div className={styles.favGrid}>
                                {favorites.map((item) => (
                                    <div key={item.key} className={styles.favItem} onClick={() => history.push(item.path)}>
                                        <span className={styles.favIconWrap} style={{ color: '#1677ff' }}>{resolveFavIcon(item.key)}</span>
                                        <span className={styles.favName}>{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* ── 指标行（始终显示三张卡片，无权限时显示锁定遮罩） ── */}
                    <div className={styles.metricsRow}>
                        <Card className={styles.card} style={{ flex: 1, position: 'relative' }} styles={{ body: { padding: 0 } }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>
                                    <BugOutlined className={styles.cardTitleIcon} /> 自愈执行
                                </span>
                            </div>
                            {loading ? (
                                <div className={styles.loadingWrap}><Spin /></div>
                            ) : (
                                <div className={cx(styles.cardBody, styles.metricCenter)}>
                                    <div className={styles.metricValue}>
                                        <div className={styles.metricNumber} style={{ color: '#52c41a' }}>{overview?.healing_stats?.today_success ?? 0}</div>
                                        <div className={styles.metricLabel}>今日成功</div>
                                    </div>
                                    <div className={styles.metricValue}>
                                        <div className={styles.metricNumber} style={{ color: '#ff4d4f' }}>{overview?.healing_stats?.today_failed ?? 0}</div>
                                        <div className={styles.metricLabel}>今日失败</div>
                                    </div>
                                </div>
                            )}
                            {!overview?.healing_stats && !loading && (
                                <div className={styles.lockedOverlay}>
                                    <LockOutlined className={styles.lockedIcon} />
                                    <span className={styles.lockedText}>暂无权限查看</span>
                                </div>
                            )}
                        </Card>

                        <Card className={styles.card} style={{ flex: 1, position: 'relative' }} styles={{ body: { padding: 0 } }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>
                                    <AlertOutlined className={styles.cardTitleIcon} /> 工单统计
                                </span>
                            </div>
                            {loading ? (
                                <div className={styles.loadingWrap}><Spin /></div>
                            ) : (
                                <div className={cx(styles.cardBody, styles.metricCenter)}>
                                    <div className={styles.metricValue}>
                                        <div className={styles.metricNumber} style={{ color: '#faad14' }}>{overview?.incident_stats?.pending_count ?? 0}</div>
                                        <div className={styles.metricLabel}>待处理</div>
                                    </div>
                                    <div className={styles.metricValue}>
                                        <div className={styles.metricNumber} style={{ color: '#262626' }}>{overview?.incident_stats?.last_7_days_total ?? 0}</div>
                                        <div className={styles.metricLabel}>近 7 天总计</div>
                                    </div>
                                </div>
                            )}
                            {!overview?.incident_stats && !loading && (
                                <div className={styles.lockedOverlay}>
                                    <LockOutlined className={styles.lockedIcon} />
                                    <span className={styles.lockedText}>暂无权限查看</span>
                                </div>
                            )}
                        </Card>

                        <Card className={styles.card} style={{ flex: 1, position: 'relative' }} styles={{ body: { padding: 0 } }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>
                                    <CloudServerOutlined className={styles.cardTitleIcon} /> 纳管主机
                                </span>
                            </div>
                            {loading ? (
                                <div className={styles.loadingWrap}><Spin /></div>
                            ) : (
                                <div className={cx(styles.cardBody, styles.metricCenter)}>
                                    <div className={styles.metricValue}>
                                        <div className={styles.metricNumber} style={{ color: '#1677ff' }}>{overview?.host_stats?.online_count ?? 0}</div>
                                        <div className={styles.metricLabel}>在线主机</div>
                                    </div>
                                    <div className={styles.metricValue}>
                                        <div className={styles.metricNumber} style={{ color: '#bfbfbf' }}>{overview?.host_stats?.offline_count ?? 0}</div>
                                        <div className={styles.metricLabel}>离线</div>
                                    </div>
                                </div>
                            )}
                            {!overview?.host_stats && !loading && (
                                <div className={styles.lockedOverlay}>
                                    <LockOutlined className={styles.lockedIcon} />
                                    <span className={styles.lockedText}>暂无权限查看</span>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* ── 平台资源概览 ── */}
                    <Card className={styles.card} styles={{ body: { padding: 0 } }}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>
                                <AppstoreOutlined className={styles.cardTitleIcon} /> 平台资源概览
                            </span>
                        </div>
                        {loading ? (
                            <div className={styles.loadingWrap}><Spin /></div>
                        ) : (
                            <div className={styles.resourceGrid}>
                                {platformStats.map((item, i) => (
                                    <div
                                        key={i}
                                        className={cx(styles.resourceItem, item.locked && styles.lockedResourceItem)}
                                        onClick={() => !item.locked && history.push(item.path)}
                                    >
                                        <span className={styles.resourceIcon} style={{ color: item.locked ? '#d9d9d9' : item.color }}>
                                            {item.locked ? <LockOutlined /> : item.icon}
                                        </span>
                                        <span className={styles.resourceValue} style={item.locked ? { color: '#d9d9d9' } : undefined}>
                                            {item.locked ? '-' : item.value}
                                        </span>
                                        <span className={styles.resourceLabel} style={item.locked ? { color: '#d9d9d9' } : undefined}>{item.label}</span>
                                        <span className={styles.resourceSub} style={item.locked ? { color: '#e8e8e8' } : undefined}>
                                            {item.locked ? '无权限' : item.sub}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* ── 变更记录 + 快速指南 ── */}
                    <div className={styles.flowRuleRow}>
                        {/* 变更记录 */}
                        <Card className={styles.card} style={{ flex: 1 }} styles={{ body: { padding: 0 } }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>
                                    <HistoryOutlined className={styles.cardTitleIcon} /> 变更记录
                                </span>
                                <span className={styles.cardLink} onClick={() => history.push('/system/audit-logs')}>
                                    查看全部 <RightOutlined style={{ fontSize: 10 }} />
                                </span>
                            </div>
                            {loading ? (
                                <div className={styles.loadingWrap}><Spin /></div>
                            ) : auditLogs.length === 0 ? (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无变更记录" style={{ padding: '20px 0' }} />
                            ) : (
                                <div>
                                    {auditLogs.slice(0, 6).map((log: any) => {
                                        const actionLabel = _ACTION_LABELS[log.action] || log.action;
                                        const resLabel = _ALL_RESOURCE_LABELS[log.resource_type] || log.resource_type;
                                        const userName = log.username || log.user?.username || '系统';
                                        return (
                                            <div key={log.id} className={styles.changeItem}>
                                                <TeamsAvatar seed={userName} name={userName} size={32} />
                                                <div className={styles.changeContent}>
                                                    <div className={styles.changeText}>
                                                        <strong>{userName}</strong> {actionLabel} <span style={{ color: '#1677ff' }}>{log.resource_name || resLabel}</span>
                                                    </div>
                                                    {log.resource_name && <div className={styles.changeDetail}>{resLabel}</div>}
                                                </div>
                                                <span className={styles.changeTime}>{formatRelativeTime(log.created_at)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>

                        {/* 快速指南 */}
                        <Card id="tour-quick-guide" className={styles.card} style={{ flex: 1 }} styles={{ body: { padding: 0 } }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>
                                    <ReadOutlined className={styles.cardTitleIcon} /> 快速指南
                                </span>
                                <span className={styles.cardLink} onClick={() => history.push('/guide')}>
                                    查看全部 <RightOutlined style={{ fontSize: 10 }} />
                                </span>
                            </div>
                            <div>
                                {GUIDE_ARTICLES.filter(g => g.category === 'quick').map((guide) => (
                                    <div key={guide.id} className={styles.guideItem} onClick={() => { setGuideDrawerArticle(guide); setGuideDrawerOpen(true); }}>
                                        <div className={styles.guideIcon}>{guide.icon}</div>
                                        <div className={styles.guideContent}>
                                            <div className={styles.guideTitle}>{guide.title}</div>
                                            <div className={styles.guideDesc}>{guide.desc}</div>
                                        </div>
                                        <RightOutlined style={{ color: '#bfbfbf', fontSize: 12 }} />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
                <div className={styles.rightCol}>
                    {/* 快速操作 */}
                    <Card id="tour-quick-actions" className={styles.card} styles={{ body: { padding: 0 } }}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>
                                <ThunderboltOutlined className={styles.cardTitleIcon} /> 快速操作
                            </span>
                        </div>
                        <div className={styles.cardBody} style={{ padding: '4px 12px' }}>
                            <Button className={styles.actionBtn} icon={<ScheduleOutlined />} block onClick={() => history.push('/pending/triggers')}>
                                待办中心
                            </Button>
                            <Button className={styles.actionBtn} icon={<FolderAddOutlined />} block onClick={() => history.push('/resources/git-repos')}>
                                添加仓库
                            </Button>
                            <Button className={styles.actionBtn} icon={<ImportOutlined />} block onClick={() => history.push('/execution/playbooks')}>
                                导入剧本
                            </Button>
                            <Button className={styles.actionBtn} icon={<PlayCircleOutlined />} block onClick={() => history.push('/execution/execute')}>
                                执行任务
                            </Button>
                            <Button className={styles.actionBtn} icon={<BranchesOutlined />} block onClick={() => history.push('/healing/flows')}>
                                新建流程
                            </Button>
                        </div>
                    </Card>

                    {/* 用户信息 */}
                    <Card className={styles.card} styles={{ body: { padding: 16 } }}>
                        <div className={styles.userHeader}>
                            <TeamsAvatar seed={seed} name={displayName} size={44} />
                            <div>
                                <div className={styles.userName}>{displayName}</div>
                                <div className={styles.userRole}><Tag color="blue" style={{ margin: 0, fontSize: 11 }}>{role}</Tag></div>
                            </div>
                        </div>
                    </Card>

                    {/* 系统公告 */}
                    <Card className={styles.card} styles={{ body: { padding: 0 } }}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>
                                <BellOutlined className={styles.cardTitleIcon} /> 系统公告
                                {announcements.filter(a => !a.is_read).length > 0 && (
                                    <span style={{ fontSize: 11, color: '#fff', background: '#ff4d4f', borderRadius: 8, padding: '0 6px', marginLeft: 6, lineHeight: '16px', display: 'inline-block' }}>
                                        {announcements.filter(a => !a.is_read).length}
                                    </span>
                                )}
                            </span>
                            <span className={styles.cardLink} onClick={() => history.push('/system/messages')}>
                                查看全部 <RightOutlined style={{ fontSize: 10 }} />
                            </span>
                        </div>
                        <div className={styles.cardBody} style={{ padding: '4px 16px' }}>
                            {announcements.length === 0 ? (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无公告" style={{ padding: '8px 0' }} />
                            ) : (
                                announcements.slice(0, 5).map((item) => {
                                    const plainText = item.content
                                        ? item.content.replace(/<[^>]*>/g, '').trim()
                                        : '';
                                    return (
                                        <div
                                            key={item.id}
                                            className={styles.announcement}
                                            onClick={async () => {
                                                if (!item.is_read) {
                                                    try {
                                                        await markAsRead([item.id]);
                                                        setAnnouncements(prev => prev.map(a => a.id === item.id ? { ...a, is_read: true } : a));
                                                    } catch { /* ignore */ }
                                                }
                                                history.push('/system/messages');
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {!item.is_read && (
                                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1677ff', flexShrink: 0, display: 'inline-block' }} />
                                                )}
                                                <span className={styles.announcementTitle} style={item.is_read ? { color: '#8c8c8c', fontWeight: 400 } : undefined}>{item.title}</span>
                                            </div>
                                            {plainText && <div className={styles.announcementSummary} style={!item.is_read ? undefined : { marginLeft: 0 }}>{plainText}</div>}
                                            <div className={styles.announcementDate}>{dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}</div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </Card>

                    {/* 定时任务日历 */}
                    <Card className={styles.card} style={{ flex: 1 }} styles={{ body: { padding: 0 } }}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>
                                <ScheduleOutlined className={styles.cardTitleIcon} /> 定时任务
                            </span>
                            <span className={styles.cardLink} onClick={() => history.push('/execution/schedules')}>
                                查看全部 <RightOutlined style={{ fontSize: 10 }} />
                            </span>
                        </div>
                        <div className={styles.calendarWrap}>
                            <Calendar
                                fullscreen={false}
                                headerRender={() => {
                                    return (
                                        <div style={{ padding: '8px 12px', fontSize: 13, fontWeight: 500, color: '#262626', textAlign: 'right' }}>
                                            {calendarMonth.year()}年 {calendarMonth.month() + 1}月
                                        </div>
                                    );
                                }}
                                onSelect={(date: any) => {
                                    const dateStr = date.format?.('YYYY-MM-DD') || '';
                                    setSelectedDate(dateStr);
                                }}
                                onPanelChange={(date: any) => {
                                    handleCalendarMonthChange(dayjs(date));
                                }}
                                cellRender={(current: any) => {
                                    const dateStr = current.format?.('YYYY-MM-DD') || '';
                                    const tasks = scheduleData[dateStr];
                                    if (!tasks || tasks.length === 0) return null;
                                    return (
                                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 1 }}>
                                            <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: '#1677ff' }} />
                                        </div>
                                    );
                                }}
                            />
                        </div>
                        {/* 选中日期的任务列表 */}
                        <div style={{ padding: '6px 10px 8px', borderTop: '1px solid #f0f0f0' }}>
                            <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 4, fontWeight: 500 }}>
                                {selectedDate.replace(/-/g, '/')} 的定时任务
                            </div>
                            {scheduleData[selectedDate] && scheduleData[selectedDate].length > 0 ? (
                                mergeScheduleTasks(scheduleData[selectedDate]).map((task, i) => (
                                    <div key={i} className={styles.scheduleTaskItem} style={task.isMerged ? { borderLeftColor: '#722ed1', background: '#f9f0ff' } : undefined}>
                                        <span className={styles.scheduleTaskTime} style={task.isMerged ? { color: '#722ed1' } : undefined}>{task.displayTime}</span>
                                        <span className={styles.scheduleTaskName}>{task.name}</span>
                                        {task.isMerged && <span style={{ fontSize: 10, color: '#722ed1', background: '#f0e6ff', padding: '1px 6px', borderRadius: 2, flexShrink: 0 }}>{task.count}次/天</span>}
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 12, color: '#bfbfbf' }}>无定时任务</div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
            <GuideDrawer
                open={guideDrawerOpen}
                article={guideDrawerArticle}
                onClose={() => setGuideDrawerOpen(false)}
            />
        </div>
    );
};

export default WorkbenchPage;

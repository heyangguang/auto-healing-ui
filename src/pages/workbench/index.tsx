import React from 'react';
import { history, useModel } from '@umijs/max';
import {
    CheckCircleOutlined,
    WarningOutlined,
    FileTextOutlined,
    PlusOutlined,
    PlayCircleOutlined,
    ReadOutlined,
    BugOutlined,
    DashboardOutlined,
    DatabaseOutlined,
    ToolOutlined,
    ThunderboltOutlined,
    BellOutlined,
    KeyOutlined,
    UserOutlined,
    SafetyCertificateOutlined,
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
    FieldTimeOutlined,
    ApiOutlined,
    HddOutlined,
    NodeIndexOutlined,
    ImportOutlined,
    FolderAddOutlined,
    BranchesOutlined,
} from '@ant-design/icons';
import { Button, Card, Tag, Avatar, Calendar, Badge } from 'antd';
import { createStyles } from 'antd-style';

/* ══════════════════════════════════════════════════
   ██  Mock 数据
   ══════════════════════════════════════════════════ */

const myFavorites = [
    { key: 'cmdb', label: '资产管理', icon: <DatabaseOutlined />, path: '/cmdb' },
    { key: 'rules', label: '自愈规则', icon: <ToolOutlined />, path: '/healing/rules' },
    { key: 'flows', label: '自愈流程', icon: <ThunderboltOutlined />, path: '/healing/flows' },
    { key: 'exec', label: '执行管理', icon: <RocketOutlined />, path: '/execution' },
    { key: 'playbook', label: 'Playbook', icon: <ReadOutlined />, path: '/execution/playbooks' },
    { key: 'notify', label: '通知模板', icon: <BellOutlined />, path: '/notification/templates' },
    { key: 'secrets', label: '密钥管理', icon: <KeyOutlined />, path: '/resources/secrets' },
    { key: 'users', label: '用户管理', icon: <UserOutlined />, path: '/system/users' },
];

const pendingApprovals = [
    { id: 1, title: '生产环境变更审批 #1024', type: 'trigger' as const, time: '5分钟前', severity: 'warning' as const },
    { id: 2, title: '权限申请 #1025', type: 'manual' as const, time: '15分钟前', severity: 'info' as const },
    { id: 3, title: '数据库备份流程 #1026', type: 'trigger' as const, time: '1小时前', severity: 'warning' as const },
    { id: 4, title: '磁盘清理变更 #1028', type: 'manual' as const, time: '3小时前', severity: 'info' as const },
    { id: 5, title: 'Redis重启审批 #1030', type: 'trigger' as const, time: '5小时前', severity: 'warning' as const },
];

/* ── 平台资源概览 ── */
const platformStats = [
    { icon: <ThunderboltOutlined />, label: '自愈流程', value: 18, sub: '5 已启用', color: '#1677ff', path: '/healing/flows' },
    { icon: <ToolOutlined />, label: '自愈规则', value: 24, sub: '18 已启用', color: '#52c41a', path: '/healing/rules' },
    { icon: <DatabaseOutlined />, label: '纳管主机', value: 148, sub: '3 离线', color: '#722ed1', path: '/cmdb' },
    { icon: <ReadOutlined />, label: 'Playbook', value: 36, sub: '4 需审查', color: '#eb2f96', path: '/execution/playbooks' },
    { icon: <ScheduleOutlined />, label: '定时任务', value: 12, sub: '10 已启用', color: '#fa8c16', path: '/execution/schedules' },
    { icon: <BellOutlined />, label: '通知模板', value: 8, sub: '3 个渠道', color: '#13c2c2', path: '/notification/templates' },
    { icon: <KeyOutlined />, label: '密钥管理', value: 15, sub: 'SSH + API', color: '#2f54eb', path: '/resources/secrets' },
    { icon: <UserOutlined />, label: '系统用户', value: 12, sub: '3 管理员', color: '#8c8c8c', path: '/system/users' },
];

/* ── 变更记录 ── */
const changeLog = [
    { id: '1', user: '李明', action: '修改流程', target: 'Web服务监控流程', detail: '新增重启节点', time: '10分钟前' },
    { id: '2', user: '王强', action: '创建规则', target: 'Pod OOM自愈', detail: '新建规则', time: '25分钟前' },
    { id: '3', user: '张伟', action: '更新剧本', target: 'nginx_reload.yml', detail: '修复变量类型', time: '1小时前' },
    { id: '4', user: 'admin', action: '禁用流程', target: 'SSL证书更新', detail: '临时停用', time: '2小时前' },
    { id: '5', user: '赵杰', action: '新增通知', target: '微信告警模板', detail: '新建模板', time: '3小时前' },
    { id: '6', user: '李明', action: '修改密钥', target: 'prod-ssh-key', detail: '轮换密钥', time: '5小时前' },
];

/* ── 帮助指南 ── */
const helpGuides = [
    { id: '1', icon: <ThunderboltOutlined />, title: '快速创建自愈流程', desc: '从零开始配置一个完整的自动化运维流程', path: '/healing/flows' },
    { id: '2', icon: <ReadOutlined />, title: 'Playbook 编写规范', desc: '了解 Ansible Playbook 最佳实践和变量管理', path: '/execution/playbooks' },
    { id: '3', icon: <ToolOutlined />, title: '规则配置指南', desc: '如何配置触发条件、匹配策略和执行动作', path: '/healing/rules' },
    { id: '4', icon: <BellOutlined />, title: '通知模板配置', desc: '配置邮件、钉钉、Webhook 多渠道告警通知', path: '/notification/templates' },
];

const activityFeed = [
    { id: '1', type: 'execution' as const, text: '执行完成：Web服务健康检查', time: '2分钟前' },
    { id: '2', type: 'flow' as const, text: '创建流程：数据库自动备份', time: '10分钟前' },
    { id: '3', type: 'rule' as const, text: '更新规则：磁盘空间监控', time: '15分钟前' },
    { id: '4', type: 'execution' as const, text: '执行失败：磁盘空间清理', time: '15分钟前' },
    { id: '5', type: 'system' as const, text: '系统通知：插件更新可用', time: '30分钟前' },
    { id: '6', type: 'flow' as const, text: '启用流程：Nginx配置同步', time: '45分钟前' },
    { id: '7', type: 'execution' as const, text: '执行完成：Redis缓存刷新', time: '1小时前' },
    { id: '8', type: 'rule' as const, text: '触发规则：CPU使用率超过80%', time: '2小时前' },
];

/* ── 定时任务日历数据 ── */
const scheduleData: Record<string, { name: string; time: string }[]> = {
    '2026-02-17': [
        { name: 'Web服务健康检查', time: '00:00' },
        { name: '日志归档', time: '02:00' },
        { name: '数据库备份', time: '03:00' },
    ],
    '2026-02-18': [
        { name: 'Web服务健康检查', time: '00:00' },
        { name: 'SSL证书检查', time: '06:00' },
    ],
    '2026-02-19': [
        { name: 'Web服务健康检查', time: '00:00' },
        { name: '日志归档', time: '02:00' },
        { name: 'Redis缓存刷新', time: '04:00' },
        { name: '磁盘空间清理', time: '05:00' },
    ],
    '2026-02-20': [
        { name: 'Web服务健康检查', time: '00:00' },
        { name: '数据库备份', time: '03:00' },
    ],
    '2026-02-21': [
        { name: 'Web服务健康检查', time: '00:00' },
        { name: '日志归档', time: '02:00' },
    ],
    '2026-02-22': [
        { name: 'Web服务健康检查', time: '00:00' },
    ],
    '2026-02-23': [
        { name: 'Web服务健康检查', time: '00:00' },
        { name: '数据库备份', time: '03:00' },
        { name: 'K8s Pod健康检查', time: '06:00' },
    ],
    '2026-02-24': [
        { name: 'Web服务健康检查', time: '00:00' },
        { name: '磁盘空间清理', time: '05:00' },
    ],
    '2026-02-25': [
        { name: 'Web服务健康检查', time: '00:00' },
        { name: '日志归档', time: '02:00' },
        { name: 'SSL证书检查', time: '06:00' },
    ],
};



const activityIcon: Record<string, React.ReactNode> = {
    execution: <PlayCircleOutlined style={{ color: '#722ed1' }} />,
    flow: <ThunderboltOutlined style={{ color: '#1677ff' }} />,
    rule: <ToolOutlined style={{ color: '#52c41a' }} />,
    system: <BellOutlined style={{ color: '#faad14' }} />,
};

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
    },

    /* ── 系统健康（重排版） ── */
    healthTop: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
        padding: '6px 10px',
        background: '#f6ffed',
        border: '1px solid #b7eb8f',
    },
    healthIconSmall: {
        fontSize: 22,
        color: '#52c41a',
    },
    healthInfo: {
        flex: 1,
    },
    healthTitleSmall: {
        fontSize: 14,
        fontWeight: 600,
        color: '#262626',
    },
    healthSubSmall: {
        fontSize: 11,
        color: '#8c8c8c',
    },
    resourceRow: {
        display: 'flex',
        gap: 16,
        marginBottom: 10,
    },
    resourceItem: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    resourceLabel: {
        fontSize: 12,
        color: '#8c8c8c',
        width: 28,
        flexShrink: 0,
    },
    resourcePercent: {
        fontSize: 12,
        fontWeight: 600,
        width: 32,
        textAlign: 'right' as const,
        flexShrink: 0,
    },
    componentTable: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0',
    },
    componentRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '5px 10px',
        borderBottom: '1px solid #f5f5f5',
        fontSize: 12,
    },
    componentName: {
        color: '#595959',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
    },
    componentDot: {
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: '#52c41a',
    },
    componentMeta: {
        display: 'flex',
        gap: 12,
        color: '#8c8c8c',
        fontSize: 11,
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

    /* ── 最近执行 ── */
    /* ── 最近执行（表格式） ── */
    execHeader: {
        display: 'flex',
        alignItems: 'center',
        padding: '6px 16px',
        background: '#fafafa',
        borderBottom: '1px solid #f0f0f0',
        fontSize: 12,
        color: '#8c8c8c',
        fontWeight: 500,
    },
    execItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '7px 16px',
        borderBottom: '1px solid #f5f5f5',
        '&:last-child': { borderBottom: 'none' },
        '&:hover': { background: '#fafafa' },
    },
    execCol1: { width: 22, flexShrink: 0 },
    execCol2: { flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, color: '#262626', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
    execCol3: { flex: 1, minWidth: 0, fontSize: 12, color: '#595959', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
    execCol4: { flex: 1, minWidth: 0, fontSize: 12, color: '#8c8c8c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
    execCol5: { width: 40, fontSize: 12, color: '#8c8c8c', textAlign: 'center' as const, flexShrink: 0 },
    execCol6: { width: 44, fontSize: 12, color: '#8c8c8c', textAlign: 'center' as const, flexShrink: 0 },
    execCol7: { width: 60, fontSize: 12, color: '#bfbfbf', textAlign: 'right' as const, flexShrink: 0 },
    execCol8: { width: 54, textAlign: 'right' as const, flexShrink: 0 },

    /* ── 我的流程 + 规则通用 ── */
    flowRuleRow: {
        display: 'flex',
        gap: 16,
    },
    listItem: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 0',
        borderBottom: '1px solid #f5f5f5',
        '&:last-child': { borderBottom: 'none' },
    },
    listItemLeft: {
        flex: 1,
        minWidth: 0,
    },
    listItemName: {
        fontSize: 13,
        fontWeight: 500,
        color: '#262626',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
    },
    listItemMeta: {
        fontSize: 12,
        color: '#bfbfbf',
        marginTop: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
    },
    listItemRight: {
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
    },
    progressWrap: {
        width: 80,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
    },
    progressText: {
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap' as const,
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
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 6,
        fontSize: 13,
    },
    infoLabel: {
        color: '#8c8c8c',
    },
    infoValue: {
        fontWeight: 500,
        color: '#262626',
    },
    announcement: {
        marginBottom: 8,
    },
    announcementTitle: {
        fontSize: 13,
        fontWeight: 500,
        color: '#262626',
        cursor: 'pointer',
        '&:hover': { color: token.colorPrimary },
    },
    announcementDate: {
        fontSize: 12,
        color: '#bfbfbf',
        marginTop: 1,
    },

    /* ── 活动动态（紧凑） ── */
    activityItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 0',
        borderBottom: '1px solid #f5f5f5',
        '&:last-child': { borderBottom: 'none' },
    },
    activityIconWrap: {
        fontSize: 14,
        flexShrink: 0,
    },
    activityText: {
        flex: 1,
        fontSize: 12,
        color: '#595959',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
    },
    activityTime: {
        fontSize: 11,
        color: '#bfbfbf',
        flexShrink: 0,
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
                '.ant-picker-cell-in-view': {
                    // current month dates
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
        alignItems: 'flex-start',
        gap: 10,
        padding: '8px 16px',
        borderBottom: '1px solid #f5f5f5',
        '&:last-child': { borderBottom: 'none' },
    },
    changeAvatar: {
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: '#e6f4ff',
        color: '#1677ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
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
        width: 36,
        height: 36,
        background: '#e6f4ff',
        color: '#1677ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
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
}));

/* ══════════════════════════════════════════════════
   ██  组件
   ══════════════════════════════════════════════════ */

const WorkbenchPage: React.FC = () => {
    const { styles, cx } = useStyles();
    const { initialState } = useModel('@@initialState');
    const user = initialState?.currentUser;
    const displayName = user?.name || (user as any)?.display_name || (user as any)?.username || '用户';
    const firstChar = displayName.charAt(0).toUpperCase();
    const role = (user as any)?.access === 'admin' ? '系统管理员' : '普通用户';



    /* 日历选中日期 */
    const [selectedDate, setSelectedDate] = React.useState<string>(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    });

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* ══════ 左栏 ══════ */}
                <div className={styles.leftCol}>

                    {/* ── 顶部行：系统健康 + 待办审批 ── */}
                    <div className={styles.topRow}>
                        {/* 系统健康 */}
                        <Card className={styles.card} style={{ flex: 1 }} styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>
                                    <CheckCircleOutlined className={styles.cardTitleIcon} style={{ color: '#52c41a' }} /> 系统健康状态
                                </span>
                                <Tag color="success" style={{ margin: 0, fontSize: 10, height: 20, lineHeight: '20px' }}>运行中</Tag>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr 1fr', flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderRight: '1px solid #f5f5f5', borderBottom: '1px solid #f5f5f5' }}>
                                    <CheckCircleOutlined style={{ fontSize: 22, color: '#52c41a' }} />
                                    <div>
                                        <div style={{ fontSize: 11, color: '#8c8c8c' }}>运行状态</div>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: '#52c41a' }}>正常</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderBottom: '1px solid #f5f5f5' }}>
                                    <SyncOutlined style={{ fontSize: 22, color: '#1677ff' }} />
                                    <div>
                                        <div style={{ fontSize: 11, color: '#8c8c8c' }}>系统版本</div>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: '#262626' }}>v2.5.0</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderRight: '1px solid #f5f5f5', borderBottom: '1px solid #f5f5f5' }}>
                                    <ClockCircleOutlined style={{ fontSize: 22, color: '#722ed1' }} />
                                    <div>
                                        <div style={{ fontSize: 11, color: '#8c8c8c' }}>运行时间</div>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: '#262626' }}>12天 4小时</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderBottom: '1px solid #f5f5f5' }}>
                                    <CloudServerOutlined style={{ fontSize: 22, color: '#13c2c2' }} />
                                    <div>
                                        <div style={{ fontSize: 11, color: '#8c8c8c' }}>环境</div>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: '#262626' }}>Production</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderRight: '1px solid #f5f5f5' }}>
                                    <ApiOutlined style={{ fontSize: 22, color: '#fa8c16' }} />
                                    <div>
                                        <div style={{ fontSize: 11, color: '#8c8c8c' }}>API 响应</div>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: '#262626' }}>23ms</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px' }}>
                                    <DatabaseOutlined style={{ fontSize: 22, color: '#eb2f96' }} />
                                    <div>
                                        <div style={{ fontSize: 11, color: '#8c8c8c' }}>数据库</div>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: '#262626' }}>5ms</div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* 待办审批（紧凑+更多条目） */}
                        <Card className={styles.card} style={{ flex: 1 }} styles={{ body: { padding: 0 } }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>
                                    <ScheduleOutlined className={styles.cardTitleIcon} /> 待办审批
                                </span>
                                <span className={styles.cardLink} onClick={() => history.push('/pending/triggers')}>
                                    全部 {pendingApprovals.length} 项 <RightOutlined style={{ fontSize: 10 }} />
                                </span>
                            </div>
                            <div style={{ padding: '4px 0' }}>
                                {pendingApprovals.map((item) => (
                                    <div key={item.id} className={styles.pendingItem}>
                                        <div
                                            className={styles.pendingDot}
                                            style={{ background: item.severity === 'warning' ? '#faad14' : '#1677ff' }}
                                        />
                                        <div className={styles.pendingContent}>
                                            <span className={styles.pendingTitle}>{item.title}</span>
                                            <span className={styles.pendingType}>{item.type === 'trigger' ? '触发器' : '人工'}</span>
                                        </div>
                                        <span className={styles.pendingTime}>{item.time}</span>
                                        <div className={styles.pendingAction}>
                                            <Button size="small" type="primary" ghost style={{ fontSize: 12, height: 24 }}>
                                                处理
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* ── 我的收藏 ── */}
                    <Card className={styles.card} styles={{ body: { padding: 0 } }}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>
                                <AppstoreOutlined className={styles.cardTitleIcon} /> 我的收藏
                            </span>
                        </div>
                        <div className={styles.favGrid}>
                            {myFavorites.map((item) => (
                                <div key={item.key} className={styles.favItem} onClick={() => history.push(item.path)}>
                                    <span className={styles.favIconWrap} style={{ color: '#1677ff' }}>{item.icon}</span>
                                    <span className={styles.favName}>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* ── 指标行 ── */}
                    <div className={styles.metricsRow}>
                        <Card className={styles.card} style={{ flex: 1 }} styles={{ body: { padding: 0 } }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>
                                    <BugOutlined className={styles.cardTitleIcon} /> 自愈执行
                                </span>
                            </div>
                            <div className={cx(styles.cardBody, styles.metricCenter)}>
                                <div className={styles.metricValue}>
                                    <div className={styles.metricNumber} style={{ color: '#52c41a' }}>12</div>
                                    <div className={styles.metricLabel}>今日成功</div>
                                </div>
                                <div className={styles.metricValue}>
                                    <div className={styles.metricNumber} style={{ color: '#ff4d4f' }}>1</div>
                                    <div className={styles.metricLabel}>今日失败</div>
                                </div>
                            </div>
                        </Card>

                        <Card className={styles.card} style={{ flex: 1 }} styles={{ body: { padding: 0 } }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>
                                    <AlertOutlined className={styles.cardTitleIcon} /> 工单统计
                                </span>
                            </div>
                            <div className={cx(styles.cardBody, styles.metricCenter)}>
                                <div className={styles.metricValue}>
                                    <div className={styles.metricNumber} style={{ color: '#faad14' }}>3</div>
                                    <div className={styles.metricLabel}>待处理</div>
                                </div>
                                <div className={styles.metricValue}>
                                    <div className={styles.metricNumber} style={{ color: '#262626' }}>45</div>
                                    <div className={styles.metricLabel}>近 7 天总计</div>
                                </div>
                            </div>
                        </Card>

                        <Card className={styles.card} style={{ flex: 1 }} styles={{ body: { padding: 0 } }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>
                                    <CloudServerOutlined className={styles.cardTitleIcon} /> 纳管主机
                                </span>
                            </div>
                            <div className={cx(styles.cardBody, styles.metricCenter)}>
                                <div className={styles.metricValue}>
                                    <div className={styles.metricNumber} style={{ color: '#1677ff' }}>145</div>
                                    <div className={styles.metricLabel}>在线主机</div>
                                </div>
                                <div className={styles.metricValue}>
                                    <div className={styles.metricNumber} style={{ color: '#bfbfbf' }}>3</div>
                                    <div className={styles.metricLabel}>离线</div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* ── 平台资源概览 ── */}
                    <Card className={styles.card} styles={{ body: { padding: 0 } }}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>
                                <AppstoreOutlined className={styles.cardTitleIcon} /> 平台资源概览
                            </span>
                        </div>
                        <div className={styles.resourceGrid}>
                            {platformStats.map((item, i) => (
                                <div key={i} className={styles.resourceItem} onClick={() => history.push(item.path)}>
                                    <span className={styles.resourceIcon} style={{ color: item.color }}>{item.icon}</span>
                                    <span className={styles.resourceValue}>{item.value}</span>
                                    <span className={styles.resourceLabel}>{item.label}</span>
                                    <span className={styles.resourceSub}>{item.sub}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* ── 变更记录 + 帮助指南 ── */}
                    <div className={styles.flowRuleRow}>
                        <Card className={styles.card} style={{ flex: 1 }} styles={{ body: { padding: 0 } }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>
                                    <HistoryOutlined className={styles.cardTitleIcon} /> 变更记录
                                </span>
                                <span className={styles.cardLink} onClick={() => history.push('/system/audit')}>
                                    查看全部 <RightOutlined style={{ fontSize: 10 }} />
                                </span>
                            </div>
                            <div>
                                {changeLog.map((item) => (
                                    <div key={item.id} className={styles.changeItem}>
                                        <div className={styles.changeAvatar}>{item.user.charAt(0)}</div>
                                        <div className={styles.changeContent}>
                                            <div className={styles.changeText}>
                                                <strong>{item.user}</strong> {item.action} <span style={{ color: '#1677ff' }}>{item.target}</span>
                                            </div>
                                            <div className={styles.changeDetail}>{item.detail}</div>
                                        </div>
                                        <span className={styles.changeTime}>{item.time}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card className={styles.card} style={{ flex: 1 }} styles={{ body: { padding: 0 } }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>
                                    <ReadOutlined className={styles.cardTitleIcon} /> 快速指南
                                </span>
                            </div>
                            <div>
                                {helpGuides.map((guide) => (
                                    <div key={guide.id} className={styles.guideItem} onClick={() => history.push(guide.path)}>
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

                {/* ══════ 右栏 ══════ */}
                <div className={styles.rightCol}>
                    {/* 快速操作 */}
                    <Card className={styles.card} styles={{ body: { padding: 0 } }}>
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
                            <Avatar size={44} style={{ background: '#0f62fe', fontWeight: 600 }}>{firstChar}</Avatar>
                            <div>
                                <div className={styles.userName}>{displayName}</div>
                                <div className={styles.userRole}><Tag color="blue" style={{ margin: 0, fontSize: 11 }}>{role}</Tag></div>
                            </div>
                        </div>
                    </Card>


                    {/* 活动动态（紧凑） */}
                    <Card className={styles.card} styles={{ body: { padding: 0 } }}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>
                                <FieldTimeOutlined className={styles.cardTitleIcon} /> 活动动态
                            </span>
                        </div>
                        <div className={styles.cardBody} style={{ padding: '4px 12px' }}>
                            {activityFeed.map((item) => (
                                <div key={item.id} className={styles.activityItem}>
                                    <span className={styles.activityIconWrap}>{activityIcon[item.type]}</span>
                                    <span className={styles.activityText}>{item.text}</span>
                                    <span className={styles.activityTime}>{item.time}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* 系统公告 */}
                    <Card className={styles.card} styles={{ body: { padding: 0 } }}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>系统公告</span>
                        </div>
                        <div className={styles.cardBody} style={{ padding: '8px 16px' }}>
                            <div className={styles.announcement}>
                                <div className={styles.announcementTitle}>v2.5.0 版本发布更新说明</div>
                                <div className={styles.announcementDate}>2026-02-12</div>
                            </div>
                            <div className={styles.announcement}>
                                <div className={styles.announcementTitle}>系统维护计划通知</div>
                                <div className={styles.announcementDate}>2026-02-10</div>
                            </div>
                        </div>
                    </Card>

                    {/* 定时任务日历 */}
                    <Card className={styles.card} styles={{ body: { padding: 0 } }}>
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
                                    const now = new Date();
                                    return (
                                        <div style={{ padding: '8px 12px', fontSize: 13, fontWeight: 500, color: '#262626', textAlign: 'right' }}>
                                            {now.getFullYear()}年 {now.getMonth() + 1}月
                                        </div>
                                    );
                                }}
                                onSelect={(date: any) => {
                                    const dateStr = date.format?.('YYYY-MM-DD') || '';
                                    setSelectedDate(dateStr);
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
                                scheduleData[selectedDate].map((task, i) => (
                                    <div key={i} className={styles.scheduleTaskItem}>
                                        <span className={styles.scheduleTaskTime}>{task.time}</span>
                                        <span className={styles.scheduleTaskName}>{task.name}</span>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 12, color: '#bfbfbf' }}>无定时任务</div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default WorkbenchPage;

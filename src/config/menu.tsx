/**
 * 全站导航配置（顶部"产品与服务"弹窗 + 全站搜索数据源）
 *
 * ⚠️  维护须知：
 * 每次在 config/routes.ts 中新增或删除路由时，必须同步更新本文件中对应的 SERVICES 数组，
 * 否则新路由不会出现在全站导航和搜索中。
 *
 * 对应关系：
 *   routes.ts /platform/xxx  →  SERVICES.platform[]
 *   routes.ts /system/xxx    →  SERVICES.system[]
 *   routes.ts /execution/xxx →  SERVICES.execution[]
 *   ... 以此类推
 */
import React from 'react';
import {
    DashboardOutlined,
    ToolOutlined,
    ThunderboltOutlined,
    DatabaseOutlined,
    AlertOutlined,
    BellOutlined,
    SettingOutlined,
    KeyOutlined,
    AppstoreOutlined,
    CarryOutOutlined,
    SafetyCertificateOutlined,
    ApartmentOutlined,
    PlayCircleOutlined,
    CodeOutlined,
    BookOutlined,
    FileTextOutlined,
    ReadOutlined,
    ScheduleOutlined,
    HistoryOutlined,
    MailOutlined,
    UserOutlined,
    LockOutlined,
    AuditOutlined,
    ClusterOutlined,
    TeamOutlined,
    GlobalOutlined,
    ControlOutlined,
    FundProjectionScreenOutlined,
    SolutionOutlined,
    MessageOutlined,
} from '@ant-design/icons';

/* ──── 模块分类 ──── */
export interface Category {
    id: string;
    label: string;
    icon: React.ReactNode;
}

export const CATEGORIES: Category[] = [
    { id: 'dashboard', label: '仪表盘', icon: <DashboardOutlined /> },
    { id: 'assets', label: '资源配置', icon: <DatabaseOutlined /> },
    { id: 'execution', label: '作业中心', icon: <ThunderboltOutlined /> },
    { id: 'healing', label: '自愈引擎', icon: <ToolOutlined /> },
    { id: 'notification', label: '通知中心', icon: <BellOutlined /> },
    { id: 'pending', label: '待办审批', icon: <CarryOutOutlined /> },
    { id: 'system', label: '系统管理', icon: <SettingOutlined /> },
    { id: 'platform', label: '平台管理', icon: <ClusterOutlined /> },
    { id: 'guide', label: '产品指南', icon: <ReadOutlined /> },
];

/* ──── 服务列表 ──── */
export interface ServiceItem {
    id: string;
    name: string;
    path: string;
    desc?: string;
    icon?: React.ReactNode;
    /** access.ts 中的权限变量名，用于菜单可见性过滤 */
    access?: string;
}

export const SERVICES: Record<string, ServiceItem[]> = {
    dashboard: [
        { id: 'monitoring', name: '监控面板', path: '/dashboard', desc: '系统运行态势总览', icon: <FundProjectionScreenOutlined />, access: 'canViewDashboard' },
    ],
    healing: [
        { id: 'rules', name: '自愈规则', path: '/healing/rules', desc: '故障自愈规则配置', icon: <SafetyCertificateOutlined />, access: 'canViewRules' },
        { id: 'flows', name: '自愈流程', path: '/healing/flows', desc: '可视化自愈流程编排', icon: <ApartmentOutlined />, access: 'canViewFlows' },
        { id: 'instances', name: '自愈实例', path: '/healing/instances', desc: '自愈流程运行实例', icon: <PlayCircleOutlined />, access: 'canViewInstances' },
    ],
    execution: [
        { id: 'git', name: '代码仓库', path: '/execution/git-repos', desc: '代码与配置仓库管理', icon: <CodeOutlined />, access: 'canViewRepositories' },
        { id: 'playbook', name: '剧本管理', path: '/execution/playbooks', desc: 'Ansible Playbook 管理', icon: <BookOutlined />, access: 'canViewPlaybooks' },
        { id: 'templates', name: '任务模板', path: '/execution/templates', desc: '常用任务参数模板', icon: <FileTextOutlined />, access: 'canViewTasks' },
        { id: 'execute', name: '任务执行', path: '/execution/execute', desc: '任务即时执行', icon: <ThunderboltOutlined />, access: 'canViewTasks' },
        { id: 'schedules', name: '定时任务', path: '/execution/schedules', desc: '周期性任务调度管理', icon: <ScheduleOutlined />, access: 'canViewTasks' },
        { id: 'logs', name: '执行记录', path: '/execution/logs', desc: '任务执行历史记录', icon: <HistoryOutlined />, access: 'canViewTasks' },
    ],
    assets: [
        { id: 'cmdb', name: '资产管理', path: '/resources/cmdb', desc: '主机与云资源统一管理', icon: <DatabaseOutlined />, access: 'canViewPlugins' },
        { id: 'incidents', name: '工单管理', path: '/resources/incidents', desc: '故障事件工单跟踪', icon: <AlertOutlined />, access: 'canViewPlugins' },
        { id: 'secrets', name: '密钥管理', path: '/resources/secrets', desc: 'SSH 与 API 凭证安全存储', icon: <KeyOutlined />, access: 'canViewTasks' },
        { id: 'plugins', name: '插件管理', path: '/resources/plugins', desc: '扩展插件安装与配置', icon: <AppstoreOutlined />, access: 'canViewPlugins' },
    ],
    pending: [
        { id: 'pending-triggers', name: '自愈审批', path: '/pending/triggers', desc: '待触发自愈工单', icon: <CarryOutOutlined />, access: 'canViewPendingTrigger' },
        { id: 'pending-approvals', name: '任务审批', path: '/pending/approvals', desc: '待审批任务处理', icon: <SolutionOutlined />, access: 'canViewApprovals' },
    ],
    notification: [
        { id: 'channels', name: '通知渠道', path: '/notification/channels', desc: '邮件、钉钉等通知方式', icon: <MailOutlined />, access: 'canViewChannels' },
        { id: 'templates', name: '通知模板', path: '/notification/templates', desc: '告警消息模板配置', icon: <FileTextOutlined />, access: 'canViewTemplates' },
        { id: 'records', name: '通知记录', path: '/notification/records', desc: '历史通知发送记录', icon: <HistoryOutlined />, access: 'canViewNotifications' },
    ],
    platform: [
        { id: 'tenants', name: '租户管理', path: '/platform/tenants', desc: '多租户创建与配置', icon: <GlobalOutlined />, access: 'isPlatformAdmin' },
        { id: 'platform-users', name: '平台用户', path: '/platform/users', desc: '跨租户用户管理', icon: <TeamOutlined />, access: 'isPlatformAdmin' },
        { id: 'platform-roles', name: '平台角色', path: '/platform/roles', desc: '平台级角色与权限管理', icon: <SafetyCertificateOutlined />, access: 'isPlatformAdmin' },
        { id: 'platform-messages', name: '平台消息', path: '/platform/messages', desc: '平台级消息推送', icon: <MailOutlined />, access: 'isPlatformAdmin' },
        { id: 'platform-settings', name: '平台设置', path: '/platform/settings', desc: '全局平台参数配置', icon: <ControlOutlined />, access: 'isPlatformAdmin' },
        { id: 'platform-audit-logs', name: '平台审计日志', path: '/platform/audit-logs', desc: '平台管理员操作审计', icon: <AuditOutlined />, access: 'isPlatformAdmin' },
    ],
    system: [
        { id: 'users', name: '用户管理', path: '/system/users', desc: '系统账户与登录管理', icon: <UserOutlined />, access: 'canViewUsers' },
        { id: 'roles', name: '角色管理', path: '/system/roles', desc: 'RBAC 角色定义与分配', icon: <SafetyCertificateOutlined />, access: 'canViewRoles' },
        { id: 'permissions', name: '权限列表', path: '/system/permissions', desc: '系统功能权限点查询', icon: <LockOutlined />, access: 'canViewPlatformPermissions' },
        { id: 'audit', name: '审计日志', path: '/system/audit-logs', desc: '全量操作行为记录', icon: <AuditOutlined />, access: 'canViewAuditLogs' },
        { id: 'messages', name: '站内通知', path: '/system/messages', desc: '系统消息与通知管理', icon: <MessageOutlined />, access: 'canViewSiteMessages' },
    ],
};

/* ──── 根据路径查找菜单项（用于记录最近访问） ──── */
export function findServiceByPath(pathname: string): ServiceItem | null {
    for (const items of Object.values(SERVICES)) {
        const match = items.find(
            (item) => pathname === item.path || pathname.startsWith(item.path + '/'),
        );
        if (match) return match;
    }
    return null;
}

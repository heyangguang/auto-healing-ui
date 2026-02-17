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
    ScheduleOutlined,
    HistoryOutlined,
    MailOutlined,
    UserOutlined,
    LockOutlined,
    AuditOutlined,
    FundProjectionScreenOutlined,
    SolutionOutlined,
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
];

/* ──── 服务列表 ──── */
export interface ServiceItem {
    id: string;
    name: string;
    path: string;
    desc?: string;
    icon?: React.ReactNode;
}

export const SERVICES: Record<string, ServiceItem[]> = {
    dashboard: [
        { id: 'monitoring', name: '监控面板', path: '/dashboard', desc: '系统运行态势总览', icon: <FundProjectionScreenOutlined /> },
    ],
    healing: [
        { id: 'rules', name: '自愈规则', path: '/healing/rules', desc: '故障自愈规则配置', icon: <SafetyCertificateOutlined /> },
        { id: 'flows', name: '自愈流程', path: '/healing/flows', desc: '可视化自愈流程编排', icon: <ApartmentOutlined /> },
        { id: 'instances', name: '自愈实例', path: '/healing/instances', desc: '自愈流程运行实例', icon: <PlayCircleOutlined /> },
    ],
    execution: [
        { id: 'git', name: '代码仓库', path: '/execution/git-repos', desc: '代码与配置仓库管理', icon: <CodeOutlined /> },
        { id: 'playbook', name: '剧本管理', path: '/execution/playbooks', desc: 'Ansible Playbook 管理', icon: <BookOutlined /> },
        { id: 'templates', name: '任务模板', path: '/execution/templates', desc: '常用任务参数模板', icon: <FileTextOutlined /> },
        { id: 'execute', name: '任务执行', path: '/execution/execute', desc: '任务即时执行', icon: <ThunderboltOutlined /> },
        { id: 'schedules', name: '定时任务', path: '/execution/schedules', desc: '周期性任务调度管理', icon: <ScheduleOutlined /> },
        { id: 'logs', name: '执行记录', path: '/execution/logs', desc: '任务执行历史记录', icon: <HistoryOutlined /> },
    ],
    assets: [
        { id: 'cmdb', name: '资产管理', path: '/resources/cmdb', desc: '主机与云资源统一管理', icon: <DatabaseOutlined /> },
        { id: 'incidents', name: '工单管理', path: '/resources/incidents', desc: '故障事件工单跟踪', icon: <AlertOutlined /> },
        { id: 'secrets', name: '密钥管理', path: '/resources/secrets', desc: 'SSH 与 API 凭证安全存储', icon: <KeyOutlined /> },
        { id: 'plugins', name: '插件管理', path: '/resources/plugins', desc: '扩展插件安装与配置', icon: <AppstoreOutlined /> },
    ],
    pending: [
        { id: 'pending-center', name: '待办中心', path: '/pending-center', desc: '审批与待处理事项', icon: <CarryOutOutlined /> },
    ],
    notification: [
        { id: 'channels', name: '通知渠道', path: '/notification/channels', desc: '邮件、钉钉等通知方式', icon: <MailOutlined /> },
        { id: 'templates', name: '通知模板', path: '/notification/templates', desc: '告警消息模板配置', icon: <FileTextOutlined /> },
        { id: 'records', name: '通知记录', path: '/notification/records', desc: '历史通知发送记录', icon: <HistoryOutlined /> },
    ],
    system: [
        { id: 'users', name: '用户管理', path: '/system/users', desc: '系统账户与登录管理', icon: <UserOutlined /> },
        { id: 'roles', name: '角色管理', path: '/system/roles', desc: 'RBAC 角色定义与分配', icon: <SafetyCertificateOutlined /> },
        { id: 'permissions', name: '权限列表', path: '/system/permissions', desc: '系统功能权限点查询', icon: <LockOutlined /> },
        { id: 'audit', name: '审计日志', path: '/system/audit-logs', desc: '全量操作行为记录', icon: <AuditOutlined /> },
    ],
};

/* ──── 收藏 & 最近 ──── */
export const FAVORITES = [
    { id: 'healing', name: '自愈规则', path: '/healing/rules' },
    { id: 'pending', name: '待办中心', path: '/pending-center' },
];

export const RECENTS = [
    { id: 'execution', name: '执行记录', path: '/execution/logs' },
    { id: 'cmdb', name: '资产管理', path: '/resources/cmdb' },
];

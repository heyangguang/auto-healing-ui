import React from 'react';
import dayjs from 'dayjs';
import {
    AppstoreOutlined,
    BellOutlined,
    DatabaseOutlined,
    KeyOutlined,
    ReadOutlined,
    RocketOutlined,
    ScheduleOutlined,
    ThunderboltOutlined,
    ToolOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { SERVICES } from '@/config/navData';
import { canAccessPath } from '@/utils/pathAccess';
import type { FavoriteItem, ScheduleTask, WorkbenchOverview } from '@/services/auto-healing/workbench';
import type { MergedTask } from './workbenchTypes';

const MERGE_THRESHOLD = 3;

type AccessLike = Record<string, unknown>;
type PlatformStatItem = {
    color: string;
    icon: React.ReactNode;
    label: string;
    locked: boolean;
    path: string;
    sub: string;
    value: number;
};

export const DEFAULT_FAVORITES: FavoriteItem[] = [
    { key: 'cmdb', label: '资产管理', icon: 'DatabaseOutlined', path: '/resources/cmdb' },
    { key: 'rules', label: '自愈规则', icon: 'ToolOutlined', path: '/healing/rules' },
    { key: 'flows', label: '自愈流程', icon: 'ThunderboltOutlined', path: '/healing/flows' },
    { key: 'exec', label: '执行管理', icon: 'RocketOutlined', path: '/execution/templates' },
    { key: 'playbook', label: 'Playbook', icon: 'ReadOutlined', path: '/execution/playbooks' },
    { key: 'notify', label: '通知模板', icon: 'BellOutlined', path: '/notification/templates' },
    { key: 'secrets', label: '密钥管理', icon: 'KeyOutlined', path: '/resources/secrets' },
    { key: 'users', label: '用户管理', icon: 'UserOutlined', path: '/system/users' },
];

export function resolveFavoriteIcon(key: string): React.ReactNode {
    for (const items of Object.values(SERVICES)) {
        const match = items.find((item) => item.id === key);
        if (match?.icon) {
            return match.icon;
        }
    }
    return <AppstoreOutlined />;
}

export function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}天 ${hours}小时`;
    if (hours > 0) return `${hours}小时`;
    return `${Math.floor((seconds % 3600) / 60)}分钟`;
}

export function formatRelativeTime(isoTime: string): string {
    const now = dayjs();
    const target = dayjs(isoTime);
    const diffMinutes = now.diff(target, 'minute');
    if (diffMinutes < 1) return '刚刚';
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;
    const diffHours = now.diff(target, 'hour');
    if (diffHours < 24) return `${diffHours}小时前`;
    const diffDays = now.diff(target, 'day');
    if (diffDays < 30) return `${diffDays}天前`;
    return target.format('MM-DD');
}

function buildFrequencySummary(tasks: ScheduleTask[]): string {
    const times = tasks.map((task) => task.time).sort();
    if (times.length < 2) {
        return times[0] || '';
    }

    const minutes = times.map((time) => {
        const [hour, minute] = time.split(':').map(Number);
        return hour * 60 + minute;
    });
    const intervals = new Set<number>();
    for (let index = 1; index < minutes.length; index += 1) {
        intervals.add(minutes[index] - minutes[index - 1]);
    }

    if (intervals.size !== 1) {
        return `${times[0]}~${times[times.length - 1]}`;
    }

    const interval = [...intervals][0];
    const minutePart = times[0].split(':')[1];
    if (interval === 60) return `每小时 :${minutePart}`;
    if (interval === 30) return '每30分钟';
    if (interval === 120) return `每2小时 :${minutePart}`;
    if (interval === 180) return `每3小时 :${minutePart}`;
    if (interval === 240) return `每4小时 :${minutePart}`;
    if (interval === 360) return `每6小时 :${minutePart}`;
    return `每${interval}分钟`;
}

export function mergeScheduleTasks(tasks: ScheduleTask[]): MergedTask[] {
    const groups = new Map<string, ScheduleTask[]>();
    for (const task of tasks) {
        const items = groups.get(task.schedule_id) || [];
        groups.set(task.schedule_id, [...items, task]);
    }

    const mergedTasks: MergedTask[] = [];
    for (const [scheduleId, items] of groups) {
        if (items.length <= MERGE_THRESHOLD) {
            items.forEach((item) => {
                mergedTasks.push({ name: item.name, schedule_id: scheduleId, count: 1, displayTime: item.time, isMerged: false });
            });
            continue;
        }

        mergedTasks.push({
            name: items[0].name,
            schedule_id: scheduleId,
            count: items.length,
            displayTime: buildFrequencySummary(items),
            isMerged: true,
        });
    }

    return mergedTasks.sort((left, right) => {
        if (left.isMerged !== right.isMerged) {
            return left.isMerged ? 1 : -1;
        }
        return left.displayTime.localeCompare(right.displayTime);
    });
}

export function buildPlatformStats(
    overview: WorkbenchOverview['resource_overview'] | undefined,
    access: AccessLike,
): PlatformStatItem[] {
    if (!overview) {
        return [];
    }

    return [
        { icon: <ThunderboltOutlined />, label: '自愈流程', value: overview.flows.total, sub: `${overview.flows.enabled ?? 0} 已启用`, color: '#1677ff', path: '/healing/flows', locked: !canAccessPath('/healing/flows', access) },
        { icon: <ToolOutlined />, label: '自愈规则', value: overview.rules.total, sub: `${overview.rules.enabled ?? 0} 已启用`, color: '#52c41a', path: '/healing/rules', locked: !canAccessPath('/healing/rules', access) },
        { icon: <DatabaseOutlined />, label: '纳管主机', value: overview.hosts.total, sub: `${overview.hosts.offline ?? 0} 离线`, color: '#722ed1', path: '/resources/cmdb', locked: !canAccessPath('/resources/cmdb', access) },
        { icon: <ReadOutlined />, label: 'Playbook', value: overview.playbooks.total, sub: `${overview.playbooks.needs_review ?? 0} 需审查`, color: '#eb2f96', path: '/execution/playbooks', locked: !canAccessPath('/execution/playbooks', access) },
        { icon: <ScheduleOutlined />, label: '定时任务', value: overview.schedules.total, sub: `${overview.schedules.enabled ?? 0} 已启用`, color: '#fa8c16', path: '/execution/schedules', locked: !canAccessPath('/execution/schedules', access) },
        { icon: <BellOutlined />, label: '通知模板', value: overview.notification_templates.total, sub: `${overview.notification_templates.channels ?? 0} 个渠道`, color: '#13c2c2', path: '/notification/templates', locked: !canAccessPath('/notification/templates', access) },
        { icon: <KeyOutlined />, label: '密钥管理', value: overview.secrets.total, sub: overview.secrets.types || '', color: '#2f54eb', path: '/resources/secrets', locked: !canAccessPath('/resources/secrets', access) },
        { icon: <UserOutlined />, label: '系统用户', value: overview.users.total, sub: `${overview.users.admins ?? 0} 管理员`, color: '#8c8c8c', path: '/system/users', locked: !canAccessPath('/system/users', access) },
    ];
}

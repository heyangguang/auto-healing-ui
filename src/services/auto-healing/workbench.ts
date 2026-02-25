import { request } from '@umijs/max';

/**
 * 工作台 API 服务层
 * 对接 /api/v1/common/workbench 后端接口
 */

// ==================== 类型定义 ====================

export interface SystemHealth {
    status: 'healthy' | 'degraded' | 'down';
    version: string;
    uptime_seconds: number;
    environment: string;
    api_latency_ms: number;
    db_latency_ms: number;
}

export interface HealingStats {
    today_success: number;
    today_failed: number;
}

export interface IncidentStats {
    pending_count: number;
    last_7_days_total: number;
}

export interface HostStats {
    online_count: number;
    offline_count: number;
}

export interface ResourceCount {
    total: number;
    enabled?: number;
    offline?: number;
    needs_review?: number;
    channels?: number;
    types?: string;
    admins?: number;
}

export interface ResourceOverview {
    flows: ResourceCount;
    rules: ResourceCount;
    hosts: ResourceCount;
    playbooks: ResourceCount;
    schedules: ResourceCount;
    notification_templates: ResourceCount;
    secrets: ResourceCount;
    users: ResourceCount;
}

export interface WorkbenchOverview {
    system_health: SystemHealth;
    healing_stats?: HealingStats;
    incident_stats?: IncidentStats;
    host_stats?: HostStats;
    resource_overview: ResourceOverview;
}

export interface ActivityItem {
    id: string;
    type: 'execution' | 'flow' | 'rule' | 'system';
    text: string;
    created_at: string;
}

export interface ScheduleTask {
    name: string;
    time: string;
    schedule_id: string;
}

export interface ScheduleCalendar {
    dates: Record<string, ScheduleTask[]>;
}

export interface AnnouncementItem {
    id: string;
    title: string;
    content: string;
    created_at: string;
}

export interface FavoriteItem {
    key: string;
    label: string;
    icon: string;
    path: string;
}

// ==================== API 函数 ====================

/** GET /api/v1/common/workbench/overview */
export async function getWorkbenchOverview() {
    return request<{ code: number; message: string; data: WorkbenchOverview }>(
        '/api/v1/common/workbench/overview',
        { method: 'GET', skipErrorHandler: true },
    );
}

/** GET /api/v1/common/workbench/activities */
export async function getWorkbenchActivities(limit: number = 10) {
    return request<{ code: number; message: string; data: { items: ActivityItem[] } }>(
        '/api/v1/common/workbench/activities',
        { method: 'GET', params: { limit }, skipErrorHandler: true },
    );
}

/** GET /api/v1/common/workbench/schedule-calendar */
export async function getScheduleCalendar(year: number, month: number) {
    return request<{ code: number; message: string; data: ScheduleCalendar }>(
        '/api/v1/common/workbench/schedule-calendar',
        { method: 'GET', params: { year, month }, skipErrorHandler: true },
    );
}

/** GET /api/v1/common/workbench/announcements */
export async function getWorkbenchAnnouncements(limit: number = 5) {
    return request<{ code: number; message: string; data: { items: AnnouncementItem[] } }>(
        '/api/v1/common/workbench/announcements',
        { method: 'GET', params: { limit }, skipErrorHandler: true },
    );
}

/** GET /api/v1/common/workbench/favorites */
export async function getWorkbenchFavorites() {
    return request<{ code: number; message: string; data: { items: FavoriteItem[] } }>(
        '/api/v1/common/workbench/favorites',
        { method: 'GET', skipErrorHandler: true },
    );
}

/** PUT /api/v1/common/workbench/favorites */
export async function updateWorkbenchFavorites(items: FavoriteItem[]) {
    return request<{ code: number; message: string }>(
        '/api/v1/common/workbench/favorites',
        { method: 'PUT', data: { items } },
    );
}

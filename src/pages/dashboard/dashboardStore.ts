/**
 * Dashboard Builder - 状态管理与持久化
 * 管理 Workspace 的创建/删除/重命名，Widget 的添加/删除，布局的保存/恢复
 */

// ==================== 类型定义 ====================

export interface LayoutItem {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
    static?: boolean;
}

export interface WidgetInstance {
    /** 唯一实例 ID (如 widget-1707123456789) */
    instanceId: string;
    /** Widget 注册表中的类型 ID (如 stat-incident-total) */
    widgetId: string;
}

export interface DashboardWorkspace {
    id: string;
    name: string;
    widgets: WidgetInstance[];
    layouts: LayoutItem[];
    /** 是否为系统工作区（角色分配） */
    isSystem?: boolean;
    /** 是否只读（系统工作区默认只读） */
    isReadOnly?: boolean;
}

export interface DashboardState {
    workspaces: DashboardWorkspace[];
    activeWorkspaceId: string;
}

// ==================== 常量 ====================

const STORAGE_KEY = 'auto_healing_dashboard_v5';

// ==================== 默认布局 ====================

/**
 * 默认"运维总览"工作区 — 专业 3 行布局
 *
 * 12 列网格, rowHeight=80px
 *
 * Row 1 (y=0): 4 个 Stat 卡片 (w=3, h=2) = 160px
 * Row 2 (y=2): 2 个 Chart 并排 (w=6, h=3) = 240px — 饼图紧凑
 * Row 3 (y=5): 2 个 List 并排 (w=6, h=5) = 400px — 列表充足
 */
const DEFAULT_WORKSPACE: DashboardWorkspace = {
    id: 'default',
    name: '运维总览',
    widgets: [
        // 第一行: 4 个核心 KPI
        { instanceId: 'w-1', widgetId: 'stat-incident-total' },
        { instanceId: 'w-2', widgetId: 'stat-healing-rate' },
        { instanceId: 'w-3', widgetId: 'stat-pending-items' },
        { instanceId: 'w-4', widgetId: 'stat-exec-success' },
        // 第二行: 2 个 Chart
        { instanceId: 'w-5', widgetId: 'chart-incident-status' },
        { instanceId: 'w-6', widgetId: 'chart-instance-status' },
        // 第三行: 2 个 List
        { instanceId: 'w-7', widgetId: 'list-recent-instances' },
        { instanceId: 'w-8', widgetId: 'list-pending-approvals' },
    ],
    layouts: [
        // Row 1: stat cards (每个 w=3, 4 列 = 12)
        { i: 'w-1', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
        { i: 'w-2', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
        { i: 'w-3', x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
        { i: 'w-4', x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
        // Row 2: charts — 紧凑
        { i: 'w-5', x: 0, y: 2, w: 6, h: 3, minW: 4, minH: 3 },
        { i: 'w-6', x: 6, y: 2, w: 6, h: 3, minW: 4, minH: 3 },
        // Row 3: lists — 充足空间
        { i: 'w-7', x: 0, y: 5, w: 6, h: 5, minW: 4, minH: 3 },
        { i: 'w-8', x: 6, y: 5, w: 6, h: 5, minW: 4, minH: 3 },
    ],
};

const DEFAULT_STATE: DashboardState = {
    workspaces: [DEFAULT_WORKSPACE],
    activeWorkspaceId: 'default',
};

// ==================== 持久化函数 ====================

export function loadDashboardState(): DashboardState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as DashboardState;
            // 验证基本结构
            if (parsed.workspaces && parsed.workspaces.length > 0 && parsed.activeWorkspaceId) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn('[Dashboard] Failed to load saved state, using defaults:', e);
    }
    return { ...DEFAULT_STATE, workspaces: [{ ...DEFAULT_WORKSPACE }] };
}

export function saveDashboardState(state: DashboardState): void {
    try {
        // Only persist user workspaces, not system workspaces (managed by backend)
        const userState: DashboardState = {
            ...state,
            workspaces: state.workspaces.filter(ws => !ws.isSystem),
        };
        // If active workspace is a system one, reset to first user workspace
        if (!userState.workspaces.find(ws => ws.id === userState.activeWorkspaceId)) {
            userState.activeWorkspaceId = userState.workspaces[0]?.id || 'default';
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userState));
    } catch (e) {
        console.warn('[Dashboard] Failed to save state:', e);
    }
}

/**
 * 清除旧版本缓存
 */
export function clearLegacyCache(): void {
    try {
        localStorage.removeItem('auto_healing_dashboard_v1');
        localStorage.removeItem('auto_healing_dashboard_v2');
        localStorage.removeItem('auto_healing_dashboard_v3');
        localStorage.removeItem('auto_healing_dashboard_v4');
    } catch { /* ignore */ }
}

// ==================== 辅助函数 ====================

let counter = Date.now();
export function generateInstanceId(): string {
    return `w-${counter++}`;
}

export function generateWorkspaceId(): string {
    return `ws-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/** 获取默认 Workspace 配置（用于重置） */
export function getDefaultWorkspace(): DashboardWorkspace {
    return { ...DEFAULT_WORKSPACE, widgets: [...DEFAULT_WORKSPACE.widgets], layouts: [...DEFAULT_WORKSPACE.layouts] };
}

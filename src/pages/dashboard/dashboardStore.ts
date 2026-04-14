import { getActiveImpersonationSession, getCurrentAuthScopeKey, loadTenantState } from '@/utils/tenantContext';
import {
    createDefaultOverviewWorkspace,
    upgradeDashboardOverviewState,
} from './dashboardDefaultWorkspace';

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
    description?: string;
    widgets: WidgetInstance[];
    layouts: LayoutItem[];
    /** 是否为系统工作区（角色分配） */
    isSystem?: boolean;
    /** 是否为默认系统工作区 */
    isDefault?: boolean;
    /** 是否只读（系统工作区默认只读） */
    isReadOnly?: boolean;
}

export interface DashboardState {
    workspaces: DashboardWorkspace[];
    activeWorkspaceId: string;
}

// ==================== 常量 ====================

const STORAGE_KEY_PREFIX = 'auto_healing_dashboard_v5';
const LEGACY_STORAGE_PREFIXES = [
    'auto_healing_dashboard_v1',
    'auto_healing_dashboard_v2',
    'auto_healing_dashboard_v3',
    'auto_healing_dashboard_v4',
] as const;

const DEFAULT_WORKSPACE = createDefaultOverviewWorkspace();

const DEFAULT_STATE: DashboardState = {
    workspaces: [DEFAULT_WORKSPACE],
    activeWorkspaceId: 'default',
};

function getDashboardStorageKey() {
    const impersonationSession = getActiveImpersonationSession();
    const tenantId = loadTenantState().currentTenantId;
    const userScope = getCurrentAuthScopeKey();

    if (impersonationSession?.tenantId) {
        return `${STORAGE_KEY_PREFIX}:${userScope}:impersonation:${impersonationSession.tenantId}`;
    }

    if (tenantId) {
        return `${STORAGE_KEY_PREFIX}:${userScope}:tenant:${tenantId}`;
    }

    return `${STORAGE_KEY_PREFIX}:${userScope}:platform`;
}

// ==================== 持久化函数 ====================

export function loadDashboardState(): DashboardState {
    try {
        const raw = localStorage.getItem(getDashboardStorageKey());
        if (raw) {
            const parsed = JSON.parse(raw) as DashboardState;
            // 验证基本结构
            if (Array.isArray(parsed.workspaces) && typeof parsed.activeWorkspaceId === 'string') {
                const migratedState = upgradeDashboardOverviewState(parsed);
                if (migratedState !== parsed) {
                    localStorage.setItem(getDashboardStorageKey(), JSON.stringify(migratedState));
                }
                return migratedState;
            }
        }
    } catch (e) {
        console.warn('[Dashboard] Failed to load saved state, using defaults:', e);
    }
    return { ...DEFAULT_STATE, workspaces: [getDefaultWorkspace()] };
}

export function saveDashboardState(state: DashboardState): void {
    try {
        // Only persist user workspaces, not system workspaces (managed by backend)
        const userState: DashboardState = {
            ...state,
            workspaces: state.workspaces.filter(ws => !ws.isSystem),
        };
        if (userState.workspaces.length === 0) {
            localStorage.setItem(getDashboardStorageKey(), JSON.stringify(userState));
            return;
        }
        // If active workspace is a system one, reset to first user workspace
        if (!userState.workspaces.find(ws => ws.id === userState.activeWorkspaceId)) {
            userState.activeWorkspaceId = userState.workspaces[0]?.id || 'default';
        }
        localStorage.setItem(getDashboardStorageKey(), JSON.stringify(userState));
    } catch (e) {
        console.warn('[Dashboard] Failed to save state:', e);
    }
}

/**
 * 清除旧版本缓存
 */
export function clearLegacyCache(): void {
    try {
        const scopedKeys: string[] = [];
        for (let index = 0; index < localStorage.length; index += 1) {
            const key = localStorage.key(index);
            if (!key) {
                continue;
            }
            if (LEGACY_STORAGE_PREFIXES.some((prefix) => key === prefix || key.startsWith(`${prefix}:`))) {
                scopedKeys.push(key);
            }
        }
        for (const key of scopedKeys) {
            localStorage.removeItem(key);
        }
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
    return createDefaultOverviewWorkspace();
}

export const __TEST_ONLY__ = {
    getDashboardStorageKey,
};

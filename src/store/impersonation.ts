/**
 * Impersonation 状态管理工具
 * 使用 localStorage 持久化（与 TenantSwitcher 的 tenant-storage 模式一致）
 * 不使用 UmiJS Model（项目无 src/models 目录）
 */

const STORAGE_KEY = 'impersonation-storage';

export interface ImpersonationSession {
    requestId: string;
    tenantId: string;
    tenantName: string;
    expiresAt: string;
    startedAt: string;
}

interface ImpersonationState {
    isImpersonating: boolean;
    session: ImpersonationSession | null;
}

/** 从 localStorage 读取 Impersonation 状态 */
export const loadImpersonationState = (): ImpersonationState => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { isImpersonating: false, session: null };
        const parsed = JSON.parse(raw);
        if (!parsed.isImpersonating || !parsed.session) {
            return { isImpersonating: false, session: null };
        }
        // 检查是否已过期
        if (new Date(parsed.session.expiresAt) <= new Date()) {
            localStorage.removeItem(STORAGE_KEY);
            return { isImpersonating: false, session: null };
        }
        return { isImpersonating: true, session: parsed.session };
    } catch {
        return { isImpersonating: false, session: null };
    }
};

/** 保存 Impersonation 状态 */
export const saveImpersonationState = (session: ImpersonationSession) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            isImpersonating: true,
            session,
        }));
    } catch { /* ignore */ }
};

/** 清除 Impersonation 状态 */
export const clearImpersonationState = () => {
    localStorage.removeItem(STORAGE_KEY);
};

/** 检查当前是否在 Impersonation 模式 */
export const isCurrentlyImpersonating = (): boolean => {
    return loadImpersonationState().isImpersonating;
};

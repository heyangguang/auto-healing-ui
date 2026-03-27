import type { CurrentUserTenant } from '@/services/auto-healing/commonTenants';

const TENANT_STORAGE_KEY = 'tenant-storage';

export type TenantStorageState = {
    currentTenantId: string | null;
    tenants: CurrentUserTenant[];
};

export function loadTenantStorageState(): TenantStorageState {
    try {
        const raw = localStorage.getItem(TENANT_STORAGE_KEY);
        if (!raw) {
            return {
                currentTenantId: null,
                tenants: [],
            };
        }

        const parsed = JSON.parse(raw) as Partial<TenantStorageState>;
        return {
            currentTenantId: typeof parsed.currentTenantId === 'string' ? parsed.currentTenantId : null,
            tenants: Array.isArray(parsed.tenants) ? parsed.tenants : [],
        };
    } catch (error) {
        console.error('[TenantSwitcher] 读取 tenant-storage 失败:', error);
        return {
            currentTenantId: null,
            tenants: [],
        };
    }
}

export function saveTenantStorageState(state: TenantStorageState) {
    try {
        localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error('[TenantSwitcher] 写入 tenant-storage 失败:', error);
    }
}

export function resolveCurrentTenantId(
    tenants: CurrentUserTenant[],
    preferredTenantId: string | null,
) {
    if (preferredTenantId && tenants.some((tenant) => tenant.id === preferredTenantId)) {
        return preferredTenantId;
    }

    return tenants[0]?.id ?? null;
}

export function updateStoredCurrentTenantId(nextTenantId: string) {
    const previousState = loadTenantStorageState();
    saveTenantStorageState({
        ...previousState,
        currentTenantId: nextTenantId,
    });
}

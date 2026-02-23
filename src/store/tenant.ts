/**
 * 租户上下文管理 Store
 * 使用 UmiJS Model 管理租户状态
 */
import { useState, useCallback } from 'react';

export interface TenantBrief {
    id: string;
    name: string;
    code: string;
    icon?: string;
}

interface TenantState {
    currentTenantId: string | null;
    tenants: TenantBrief[];
}

// 从 localStorage 加载租户信息
const loadTenantState = (): TenantState => {
    try {
        const storedState = localStorage.getItem('tenant-storage');
        if (storedState) {
            const parsed = JSON.parse(storedState);
            return {
                currentTenantId: parsed.currentTenantId || null,
                tenants: parsed.tenants || [],
            };
        }
    } catch (error) {
        console.error('[TenantStore] 加载租户信息失败:', error);
    }
    return {
        currentTenantId: null,
        tenants: [],
    };
};

// 保存到 localStorage
const saveTenantState = (state: TenantState) => {
    try {
        localStorage.setItem('tenant-storage', JSON.stringify(state));
    } catch (error) {
        console.error('[TenantStore] 保存租户信息失败:', error);
    }
};

/**
 * 租户管理 Model
 */
export default function useTenantModel() {
    const initialState = loadTenantState();
    const [currentTenantId, setCurrentTenantId] = useState<string | null>(initialState.currentTenantId);
    const [tenants, setTenantsState] = useState<TenantBrief[]>(initialState.tenants);

    // 设置当前租户
    const setCurrentTenant = useCallback((tenantId: string) => {
        setCurrentTenantId(tenantId);
        saveTenantState({
            currentTenantId: tenantId,
            tenants,
        });
    }, [tenants]);

    // 设置租户列表（保留当前选择，除非当前租户已被移除）
    const setTenants = useCallback((newTenants: TenantBrief[]) => {
        setTenantsState(newTenants);
        // 如果用户当前选择的租户在新列表中仍存在，则保留
        const stillExists = currentTenantId && newTenants.some(t => t.id === currentTenantId);
        const newCurrentTenantId = stillExists ? currentTenantId : (newTenants.length > 0 ? newTenants[0].id : null);
        setCurrentTenantId(newCurrentTenantId);
        saveTenantState({
            currentTenantId: newCurrentTenantId,
            tenants: newTenants,
        });
    }, [currentTenantId]);

    // 重置租户信息
    const reset = useCallback(() => {
        setCurrentTenantId(null);
        setTenantsState([]);
        saveTenantState({
            currentTenantId: null,
            tenants: [],
        });
    }, []);

    return {
        currentTenantId,
        tenants,
        setCurrentTenant,
        setTenants,
        reset,
    };
}

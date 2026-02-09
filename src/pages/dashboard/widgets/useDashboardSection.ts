import { useRequest } from '@umijs/max';
import { getDashboardOverview } from '@/services/auto-healing/dashboard';

/**
 * Dashboard Section 数据 Hook
 *
 * 调用 /api/v1/dashboard/overview 接口获取指定 section 的数据
 *
 * 性能优化策略：
 * 1. cacheKey — 同一 section 在多个组件间共享缓存，避免重复请求
 * 2. staleTime — 30秒内不重新请求（SWR 策略）
 * 3. pollingInterval — 60秒自动刷新
 */
export function useDashboardSection(section: string) {
    const { data: rawData, loading, refresh } = useRequest(
        () => getDashboardOverview([section]),
        {
            cacheKey: `dashboard-section-${section}`,
            staleTime: 30000,     // 30s 内使用缓存，不重新请求
            refreshDeps: [section],
            pollingInterval: 60000, // 60s 自动刷新
            formatResult: (res: any) => res,
        }
    );

    // 后端返回结构为 { code: 0, data: { [section]: { ... } } }
    // umi request 返回完整 body，需要先访问 .data
    const data = rawData?.data?.[section] || rawData?.[section] || null;

    return {
        data,
        loading,
        refresh,
    };
}

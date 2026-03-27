import { request } from '@umijs/max';
import type {
    ServiceDataEnvelope,
    ServiceItemsEnvelope,
    ServicePaginatedEnvelope,
} from './contracts';
import { normalizePaginatedResponse, unwrapData, unwrapItems } from '../responseAdapters';

const normalizePlatformAuditPage = <T>(
    response: AutoHealing.PaginatedResponse<T>,
    requestedPageSize?: number,
): AutoHealing.PaginatedResponse<T> => ({
    ...response,
    page_size: (response.page_size ?? 0) > 0 ? response.page_size : requestedPageSize ?? 1,
});

type PlatformAuditLogListParams = {
    page?: number;
    page_size?: number;
    search?: string;
    category?: string;
    action?: string;
    resource_type?: string;
    username?: string;
    user_id?: string;
    status?: string;
    created_after?: string;
    created_before?: string;
    sort_by?: string;
    sort_order?: string;
};

type PlatformAuditLogRecord = {
    id: string;
    username?: string;
    user?: { display_name?: string };
    action?: string;
    resource_type?: string;
    resource_name?: string;
    resource_id?: string;
    request_method?: string;
    request_path?: string;
    request_body?: unknown;
    response_status?: number;
    status?: string;
    risk_level?: string;
    risk_reason?: string;
    ip_address?: string;
    user_agent?: string;
    error_message?: string;
    created_at?: string;
    updated_at?: string;
    changes?: Record<string, { old?: unknown; new?: unknown }> & {
        deleted?: Record<string, unknown>;
    };
};

type PlatformAuditStatsSummary = {
    total_count?: number;
    success_count?: number;
    failed_count?: number;
    high_risk_count?: number;
    today_count?: number;
};

type PlatformAuditTrendPoint = {
    date: string;
    count: number;
};

type PlatformAuditUserRankingItem = {
    username?: string;
    count?: number;
};

type PlatformAuditHighRiskParams = {
    page?: number;
    page_size?: number;
};

type PlatformAuditRankingEnvelope<T> =
    | ServiceItemsEnvelope<T>
    | {
        data?: { rankings?: T[] };
        rankings?: T[];
        code?: number;
        message?: string;
    };

const unwrapPlatformRankingItems = <T>(response: PlatformAuditRankingEnvelope<T>) => {
    if (Array.isArray(response)) {
        return response;
    }
    const nestedRankings = response?.data && 'rankings' in response.data ? response.data.rankings : undefined;
    if (Array.isArray(nestedRankings)) {
        return nestedRankings;
    }
    if (Array.isArray((response as { rankings?: T[] }).rankings)) {
        return (response as { rankings?: T[] }).rankings || [];
    }
    return unwrapItems(response as ServiceItemsEnvelope<T>);
};

/**
 * 平台审计日志 API
 * 对应 /api/v1/platform/audit-logs
 * 注意：响应中不包含 user 关联对象，仅有 username 字段
 */

export async function getPlatformAuditLogs(params?: PlatformAuditLogListParams) {
    return normalizePlatformAuditPage(
        normalizePaginatedResponse(
            await request<ServicePaginatedEnvelope<PlatformAuditLogRecord>>('/api/v1/platform/audit-logs', { method: 'GET', params }),
        ),
        params?.page_size,
    );
}

export async function getPlatformAuditLogDetail(id: string) {
    return unwrapData(
        await request<ServiceDataEnvelope<PlatformAuditLogRecord>>(`/api/v1/platform/audit-logs/${id}`, { method: 'GET' }),
    );
}

export async function getPlatformAuditStats() {
    return unwrapData(
        await request<ServiceDataEnvelope<PlatformAuditStatsSummary>>('/api/v1/platform/audit-logs/stats', { method: 'GET' }),
    );
}

export async function getPlatformAuditTrend(days: number = 7) {
    return unwrapItems(
        await request<ServiceItemsEnvelope<PlatformAuditTrendPoint>>('/api/v1/platform/audit-logs/trend', {
            method: 'GET',
            params: { days },
        }),
    );
}

export async function getPlatformAuditUserRanking(days: number = 30, limit: number = 10) {
    return unwrapPlatformRankingItems(
        await request<PlatformAuditRankingEnvelope<PlatformAuditUserRankingItem>>('/api/v1/platform/audit-logs/user-ranking', {
            method: 'GET',
            params: { days, limit },
        }),
    );
}

export async function getPlatformAuditHighRisk(params?: PlatformAuditHighRiskParams) {
    return normalizePlatformAuditPage(
        normalizePaginatedResponse(
            await request<ServicePaginatedEnvelope<PlatformAuditLogRecord>>('/api/v1/platform/audit-logs/high-risk', {
                method: 'GET',
                params,
            }),
        ),
        params?.page_size,
    );
}

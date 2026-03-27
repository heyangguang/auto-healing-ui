import { request } from '@umijs/max';
import { normalizePaginatedResponse, unwrapData, unwrapItems } from './responseAdapters';

const normalizeAuditLogsPage = <T>(
    response: AutoHealing.PaginatedResponse<T>,
    requestedPageSize?: number,
): AutoHealing.PaginatedResponse<T> => ({
    ...response,
    page_size: (response.page_size ?? 0) > 0 ? response.page_size : requestedPageSize ?? 1,
});

type AuditLogListParams = {
    page?: number;
    page_size?: number;
    search?: string;
    category?: string;
    action?: string;
    resource_type?: string;
    username?: string;
    user_id?: string;
    status?: string;
    risk_level?: string;
    created_after?: string;
    created_before?: string;
    sort_by?: string;
    sort_order?: string;
    exclude_action?: string;
    exclude_resource_type?: string;
};

type AuditLogRecord = {
    id: string;
    action?: string;
    username?: string;
    user?: { display_name?: string };
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

type AuditStatsSummary = {
    total_count?: number;
    success_count?: number;
    failed_count?: number;
    high_risk_count?: number;
    today_count?: number;
};

type AuditTrendPoint = {
    date: string;
    count: number;
};

type AuditUserRankingItem = {
    username?: string;
    count?: number;
};

type AuditResourceStatItem = {
    resource_type?: string;
    count?: number;
};

type PaginatedEnvelope<T> =
    | AutoHealing.PaginatedResponse<T>
    | {
        data?: T[] | { items?: T[]; total?: number; page?: number; page_size?: number };
        items?: T[];
        total?: number;
        page?: number;
        page_size?: number;
        pagination?: { total?: number; page?: number; page_size?: number };
    };

type DataEnvelope<T> = { data?: T; code?: number; message?: string };

type ItemEnvelope<T> =
    | T[]
    | {
        data?: T[] | { items?: T[] };
        items?: T[];
        code?: number;
        message?: string;
    };

type RankingEnvelope<T> =
    | ItemEnvelope<T>
    | {
        data?: { rankings?: T[] };
        rankings?: T[];
        code?: number;
        message?: string;
    };

type AuditLogExportParams = Record<string, string | number | boolean | undefined>;

const unwrapRankingItems = <T>(response: RankingEnvelope<T>) => {
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
    return unwrapItems(response as ItemEnvelope<T>);
};

/**
 * 获取审计日志列表
 */
export async function getAuditLogs(params?: AuditLogListParams) {
    return normalizeAuditLogsPage(
        normalizePaginatedResponse(
            await request<PaginatedEnvelope<AuditLogRecord>>('/api/v1/tenant/audit-logs', { method: 'GET', params }),
        ),
        params?.page_size,
    );
}

/**
 * 获取审计日志详情
 */
export async function getAuditLogDetail(id: string) {
    return unwrapData(await request<DataEnvelope<AuditLogRecord>>(`/api/v1/tenant/audit-logs/${id}`, { method: 'GET' }));
}

/**
 * 获取审计统计概览
 */
export async function getAuditStats() {
    return unwrapData(await request<DataEnvelope<AuditStatsSummary>>('/api/v1/tenant/audit-logs/stats', { method: 'GET' }));
}

/**
 * 获取操作趋势
 */
export async function getAuditTrend(days: number = 7) {
    return unwrapItems(
        await request<ItemEnvelope<AuditTrendPoint>>('/api/v1/tenant/audit-logs/trend', { method: 'GET', params: { days } }),
    );
}

/**
 * 导出审计日志 CSV
 */
export async function exportAuditLogs(params?: AuditLogExportParams) {
    return request<Blob>('/api/v1/tenant/audit-logs/export', {
        method: 'GET',
        params,
        responseType: 'blob',
        getResponse: true,
    });
}

/**
 * 用户操作排行（按用户聚合）
 */
export async function getAuditUserRanking(days: number = 30, limit: number = 50) {
    return unwrapRankingItems(
        await request<RankingEnvelope<AuditUserRankingItem>>('/api/v1/tenant/audit-logs/user-ranking', {
            method: 'GET',
            params: { days, limit },
        }),
    );
}

/**
 * 资源类型统计（按资源聚合）
 */
export async function getAuditResourceStats(days: number = 30) {
    return unwrapItems(
        await request<ItemEnvelope<AuditResourceStatItem>>('/api/v1/tenant/audit-logs/resource-stats', {
            method: 'GET',
            params: { days },
        }),
    );
}

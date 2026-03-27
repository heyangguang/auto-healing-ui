import { request } from '@umijs/max';
import {
    getTenantSecretsSources,
    postTenantSecretsSources,
} from '@/services/generated/auto-healing/secrets';
import { normalizePaginatedResponse, unwrapData } from './responseAdapters';

type SecretsSourceStatsSummary = {
    total: number;
    by_status: Array<{ status: string; count: number }>;
    by_type: Array<{ type: string; count: number }>;
};

type SecretsSourcesQueryParams = {
    page?: number;
    page_size?: number;
    search?: string;
    name?: string;
    type?: AutoHealing.SecretsSourceType;
    auth_type?: string;
    status?: string;
    is_default?: boolean;
    sort_by?: string;
    sort_order?: string;
};

type RawTestSecretsQueryResult = AutoHealing.TestQuerySingleResult | {
    success_count: number;
    fail_count: number;
    results: AutoHealing.TestQueryBatchResult[];
};

export type TestSecretsQueryResult = {
    success_count: number;
    fail_count: number;
    results: AutoHealing.TestQueryBatchResult[];
};

function normalizeTestSecretsQueryResult(
    result: RawTestSecretsQueryResult,
    requestData: { hostname: string; ip_address: string } | { hosts: Array<{ hostname: string; ip_address: string }> },
): TestSecretsQueryResult {
    if ('results' in result) {
        return result;
    }

    const fallbackHost = 'hosts' in requestData ? requestData.hosts[0] : requestData;
    return {
        success_count: result.success ? 1 : 0,
        fail_count: result.success ? 0 : 1,
        results: [{
            auth_type: result.auth_type,
            has_credential: result.has_credential,
            hostname: fallbackHost?.hostname || '',
            ip_address: fallbackHost?.ip_address || '',
            message: result.message,
            success: result.success,
            username: result.username,
        }],
    };
}

/**
 * 获取密钥源列表
 */
export async function getSecretsSources(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    name?: string;
    type?: AutoHealing.SecretsSourceType;
    auth_type?: string;
    status?: string;
    is_default?: boolean;
    sort_by?: string;
    sort_order?: string;
}) {
    return normalizePaginatedResponse(
        await getTenantSecretsSources({ params: params as SecretsSourcesQueryParams }) as AutoHealing.PaginatedResponse<AutoHealing.SecretsSource>,
    );
}

/**
 * 获取密钥源详情
 */
export async function getSecretsSource(id: string) {
    return unwrapData(
        await request<{ data?: AutoHealing.SecretsSource } | AutoHealing.SecretsSource>(`/api/v1/tenant/secrets-sources/${id}`, {
        method: 'GET',
        }),
    ) as AutoHealing.SecretsSource;
}

/**
 * 创建密钥源
 */
export async function createSecretsSource(data: AutoHealing.CreateSecretsSourceRequest) {
    return unwrapData(
        await postTenantSecretsSources({ data }) as { data?: AutoHealing.SecretsSource } | AutoHealing.SecretsSource,
    ) as AutoHealing.SecretsSource;
}

/**
 * 更新密钥源
 */
export async function updateSecretsSource(id: string, data: AutoHealing.UpdateSecretsSourceRequest) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/secrets-sources/${id}`, {
        method: 'PUT',
        data,
    });
}

/**
 * 删除密钥源
 */
export async function deleteSecretsSource(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/secrets-sources/${id}`, {
        method: 'DELETE',
    });
}

/**
 * 测试密钥源连接（旧接口，保留兼容）
 */
export async function testSecretsSource(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/secrets-sources/${id}/test`, {
        method: 'POST',
    });
}

/**
 * 测试密钥源凭据获取
 * 支持单主机测试和批量测试
 */
export async function testSecretsQuery(
    id: string,
    data: { hostname: string; ip_address: string } | { hosts: Array<{ hostname: string; ip_address: string }> }
) {
    return normalizeTestSecretsQueryResult(unwrapData(
        await request<{ data?: RawTestSecretsQueryResult } | RawTestSecretsQueryResult | AutoHealing.TestQueryResponse>(`/api/v1/tenant/secrets-sources/${id}/test-query`, {
            method: 'POST',
            data,
        }),
    ) as RawTestSecretsQueryResult, data);
}

/**
 * 启用密钥源（必须先通过 test-query）
 */
export async function enableSecretsSource(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/secrets-sources/${id}/enable`, {
        method: 'POST',
    });
}

/**
 * 禁用密钥源
 */
export async function disableSecretsSource(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/secrets-sources/${id}/disable`, {
        method: 'POST',
    });
}

/**
 * 按主机查询密钥
 */
export async function querySecret(data: AutoHealing.SecretQuery) {
    return request<AutoHealing.Secret>('/api/v1/tenant/secrets/query', {
        method: 'POST',
        data,
    });
}

/**
 * 获取密钥源统计数据
 * GET /api/v1/tenant/secrets-sources/stats
 */
export async function getSecretsSourcesStats() {
    return unwrapData(
        await request<{ data?: SecretsSourceStatsSummary } | SecretsSourceStatsSummary>(
            '/api/v1/tenant/secrets-sources/stats',
            { method: 'GET' },
        ),
    ) as SecretsSourceStatsSummary;
}

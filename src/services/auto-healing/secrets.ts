import { request } from '@umijs/max';

/**
 * 获取密钥源列表
 */
export async function getSecretsSources(params?: {
    type?: AutoHealing.SecretsSourceType;
    status?: string;
}) {
    return request<{ data: AutoHealing.SecretsSource[] }>('/api/v1/tenant/secrets-sources', {
        method: 'GET',
        params,
    });
}

/**
 * 获取密钥源详情
 */
export async function getSecretsSource(id: string) {
    return request<AutoHealing.SecretsSource>(`/api/v1/tenant/secrets-sources/${id}`, {
        method: 'GET',
    });
}

/**
 * 创建密钥源
 */
export async function createSecretsSource(data: AutoHealing.CreateSecretsSourceRequest) {
    return request<AutoHealing.SecretsSource>('/api/v1/tenant/secrets-sources', {
        method: 'POST',
        data,
    });
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
    return request<AutoHealing.TestQueryResponse>(`/api/v1/tenant/secrets-sources/${id}/test-query`, {
        method: 'POST',
        data,
    });
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
    return request<{
        code: number;
        data: {
            total: number;
            by_status: Array<{ status: string; count: number }>;
            by_type: Array<{ type: string; count: number }>;
        };
    }>('/api/v1/tenant/secrets-sources/stats', { method: 'GET' });
}

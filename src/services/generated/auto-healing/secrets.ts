// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 获取密钥源列表 GET /api/v1/tenant/secrets-sources */
export async function getTenantSecretsSources(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantSecretsSourcesParams,
  options?: Record<string, unknown>
) {
  return request<{ data?: GeneratedAutoHealing.SecretsSource[] }>(
    "/api/v1/tenant/secrets-sources",
    {
      method: "GET",
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** 创建密钥源 POST /api/v1/tenant/secrets-sources */
export async function postTenantSecretsSources(
  body: GeneratedAutoHealing.CreateSecretsSourceRequest,
  options?: Record<string, unknown>
) {
  return request<GeneratedAutoHealing.SecretsSource>(
    "/api/v1/tenant/secrets-sources",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: body,
      ...(options || {}),
    }
  );
}

/** 获取密钥源详情 GET /api/v1/tenant/secrets-sources/${param0} */
export async function getTenantSecretsSourcesById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantSecretsSourcesByIdParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<GeneratedAutoHealing.SecretsSource>(
    `/api/v1/tenant/secrets-sources/${param0}`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 更新密钥源 PUT /api/v1/tenant/secrets-sources/${param0} */
export async function putTenantSecretsSourcesById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.putTenantSecretsSourcesByIdParams,
  body: {
    config?: Record<string, unknown>;
    status?: string;
  },
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<unknown>(`/api/v1/tenant/secrets-sources/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 删除密钥源 DELETE /api/v1/tenant/secrets-sources/${param0} */
export async function deleteTenantSecretsSourcesById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.deleteTenantSecretsSourcesByIdParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>(`/api/v1/tenant/secrets-sources/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 禁用密钥源 POST /api/v1/tenant/secrets-sources/${param0}/disable */
export async function postTenantSecretsSourcesByIdDisable(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantSecretsSourcesByIdDisableParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>(`/api/v1/tenant/secrets-sources/${param0}/disable`, {
    method: "POST",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 启用密钥源 自动测试连接，通过后启用 POST /api/v1/tenant/secrets-sources/${param0}/enable */
export async function postTenantSecretsSourcesByIdEnable(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantSecretsSourcesByIdEnableParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>(`/api/v1/tenant/secrets-sources/${param0}/enable`, {
    method: "POST",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 测试密钥源连接 测试连接并更新 last_test_at POST /api/v1/tenant/secrets-sources/${param0}/test */
export async function postTenantSecretsSourcesByIdTest(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantSecretsSourcesByIdTestParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>(`/api/v1/tenant/secrets-sources/${param0}/test`, {
    method: "POST",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 测试主机凭据获取 支持单选和多选模式。单选传 hostname/ip_address，多选传 hosts 数组。 POST /api/v1/tenant/secrets-sources/${param0}/test-query */
export async function postTenantSecretsSourcesByIdTestQuery(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantSecretsSourcesByIdTestQueryParams,
  body: {
    /** 单选模式 - 主机名 */
    hostname?: string;
    /** 单选模式 - IP 地址 */
    ip_address?: string;
    /** 多选模式 - 主机列表 */
    hosts?: { hostname?: string; ip_address?: string }[];
  },
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    results?: {
      hostname?: string;
      ip_address?: string;
      success?: boolean;
      auth_type?: string;
      username?: string;
      has_credential?: boolean;
      message?: string;
    }[];
    success_count?: number;
    fail_count?: number;
  }>(`/api/v1/tenant/secrets-sources/${param0}/test-query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 获取密钥源统计 GET /api/v1/tenant/secrets-sources/stats */
export async function getTenantSecretsSourcesStats(options?: {
  [key: string]: unknown;
}) {
  return request<GeneratedAutoHealing.Success & { data?: Record<string, unknown> }>(
    "/api/v1/tenant/secrets-sources/stats",
    {
      method: "GET",
      ...(options || {}),
    }
  );
}

/** 按主机查询密钥 POST /api/v1/tenant/secrets/query */
export async function postTenantSecretsQuery(
  body: GeneratedAutoHealing.SecretQuery,
  options?: Record<string, unknown>
) {
  return request<GeneratedAutoHealing.Secret>("/api/v1/tenant/secrets/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

export { getTenantSecretsSourcesById as getTenantSecretsSourcesId };
export { putTenantSecretsSourcesById as putTenantSecretsSourcesId };
export { deleteTenantSecretsSourcesById as deleteTenantSecretsSourcesId };
export { postTenantSecretsSourcesByIdEnable as postTenantSecretsSourcesIdEnable };
export { postTenantSecretsSourcesByIdDisable as postTenantSecretsSourcesIdDisable };
export { postTenantSecretsSourcesByIdTest as postTenantSecretsSourcesIdTest };
export { postTenantSecretsSourcesByIdTestQuery as postTenantSecretsSourcesIdTestQuery };

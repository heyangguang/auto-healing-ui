// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 获取自愈规则列表 GET /api/v1/tenant/healing/rules */
export async function getTenantHealingRules(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantHealingRulesParams,
  options?: Record<string, unknown>
) {
  return request<
    GeneratedAutoHealing.PaginatedResponse & {
      data?: GeneratedAutoHealing.HealingRule[];
    }
  >("/api/v1/tenant/healing/rules", {
    method: "GET",
    params: {
      // page has a default value: 1
      page: "1",
      // page_size has a default value: 20
      page_size: "20",

      ...params,
    },
    ...(options || {}),
  });
}

/** 创建自愈规则 POST /api/v1/tenant/healing/rules */
export async function postTenantHealingRules(
  body: GeneratedAutoHealing.HealingRuleCreate,
  options?: Record<string, unknown>
) {
  return request<GeneratedAutoHealing.HealingRule>(
    "/api/v1/tenant/healing/rules",
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

/** 获取自愈规则详情 GET /api/v1/tenant/healing/rules/${param0} */
export async function getTenantHealingRulesById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantHealingRulesByIdParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<GeneratedAutoHealing.HealingRule>(
    `/api/v1/tenant/healing/rules/${param0}`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 更新自愈规则 PUT /api/v1/tenant/healing/rules/${param0} */
export async function putTenantHealingRulesById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.putTenantHealingRulesByIdParams,
  body: GeneratedAutoHealing.HealingRuleUpdate,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<GeneratedAutoHealing.HealingRule>(
    `/api/v1/tenant/healing/rules/${param0}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      params: { ...queryParams },
      data: body,
      ...(options || {}),
    }
  );
}

/** 删除自愈规则 删除规则时，如果有关联的流程实例：
- 不带 `force` 参数：返回 409 Conflict
- 带 `force=true`：将关联实例的 rule_id 设为 NULL，然后删除规则
 DELETE /api/v1/tenant/healing/rules/${param0} */
export async function deleteTenantHealingRulesById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.deleteTenantHealingRulesByIdParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>(`/api/v1/tenant/healing/rules/${param0}`, {
    method: "DELETE",
    params: {
      ...queryParams,
    },
    ...(options || {}),
  });
}

/** 启用自愈规则 POST /api/v1/tenant/healing/rules/${param0}/activate */
export async function postTenantHealingRulesByIdActivate(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantHealingRulesByIdActivateParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>(`/api/v1/tenant/healing/rules/${param0}/activate`, {
    method: "POST",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 停用自愈规则 POST /api/v1/tenant/healing/rules/${param0}/deactivate */
export async function postTenantHealingRulesByIdDeactivate(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantHealingRulesByIdDeactivateParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>(`/api/v1/tenant/healing/rules/${param0}/deactivate`, {
    method: "POST",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 获取规则搜索字段定义 GET /api/v1/tenant/healing/rules/search-schema */
export async function getTenantHealingRulesSearchSchema(options?: {
  [key: string]: unknown;
}) {
  return request<
    GeneratedAutoHealing.Success & {
      data?: GeneratedAutoHealing.SearchableField[];
    }
  >("/api/v1/tenant/healing/rules/search-schema", {
    method: "GET",
    ...(options || {}),
  });
}

/** 获取规则统计 GET /api/v1/tenant/healing/rules/stats */
export async function getTenantHealingRulesStats(options?: {
  [key: string]: unknown;
}) {
  return request<GeneratedAutoHealing.Success & { data?: Record<string, unknown> }>(
    "/api/v1/tenant/healing/rules/stats",
    {
      method: "GET",
      ...(options || {}),
    }
  );
}

export { getTenantHealingRulesById as getTenantHealingRulesId };
export { putTenantHealingRulesById as putTenantHealingRulesId };
export { deleteTenantHealingRulesById as deleteTenantHealingRulesId };
export { postTenantHealingRulesByIdActivate as postTenantHealingRulesIdActivate };
export { postTenantHealingRulesByIdDeactivate as postTenantHealingRulesIdDeactivate };

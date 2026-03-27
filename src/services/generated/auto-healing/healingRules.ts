// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** List healing rules GET /api/v1/tenant/healing/rules */
export async function getTenantHealingRules(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantHealingRulesParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/v1/tenant/healing/rules", {
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

/** Create healing rule POST /api/v1/tenant/healing/rules */
export async function postTenantHealingRules(options?: { [key: string]: any }) {
  return request<any>("/api/v1/tenant/healing/rules", {
    method: "POST",
    ...(options || {}),
  });
}

/** Get healing rule details GET /api/v1/tenant/healing/rules/${param0} */
export async function getTenantHealingRulesId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantHealingRulesIdParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/v1/tenant/healing/rules/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Activate a healing rule POST /api/v1/tenant/healing/rules/${param0}/activate */
export async function postTenantHealingRulesIdActivate(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantHealingRulesIdActivateParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/v1/tenant/healing/rules/${param0}/activate`, {
    method: "POST",
    params: { ...queryParams },
    ...(options || {}),
  });
}

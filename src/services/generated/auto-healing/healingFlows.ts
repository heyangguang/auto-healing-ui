// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** List healing flows GET /api/v1/tenant/healing/flows */
export async function getTenantHealingFlows(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantHealingFlowsParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/v1/tenant/healing/flows", {
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

/** Create healing flow POST /api/v1/tenant/healing/flows */
export async function postTenantHealingFlows(options?: { [key: string]: any }) {
  return request<any>("/api/v1/tenant/healing/flows", {
    method: "POST",
    ...(options || {}),
  });
}

/** Get healing flow details GET /api/v1/tenant/healing/flows/${param0} */
export async function getTenantHealingFlowsId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantHealingFlowsIdParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/v1/tenant/healing/flows/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Update healing flow PUT /api/v1/tenant/healing/flows/${param0} */
export async function putTenantHealingFlowsId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.putTenantHealingFlowsIdParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/v1/tenant/healing/flows/${param0}`, {
    method: "PUT",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Delete healing flow DELETE /api/v1/tenant/healing/flows/${param0} */
export async function deleteTenantHealingFlowsId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.deleteTenantHealingFlowsIdParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/v1/tenant/healing/flows/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Dry-run a healing flow (simulate without side effects) POST /api/v1/tenant/healing/flows/${param0}/dry-run */
export async function postTenantHealingFlowsIdDryRun(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantHealingFlowsIdDryRunParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/v1/tenant/healing/flows/${param0}/dry-run`, {
    method: "POST",
    params: { ...queryParams },
    ...(options || {}),
  });
}

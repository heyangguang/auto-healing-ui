// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** List plugins GET /api/v1/tenant/plugins */
export async function getTenantPlugins(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantPluginsParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/v1/tenant/plugins", {
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

/** Create plugin POST /api/v1/tenant/plugins */
export async function postTenantPlugins(options?: { [key: string]: any }) {
  return request<any>("/api/v1/tenant/plugins", {
    method: "POST",
    ...(options || {}),
  });
}

/** Get plugin details GET /api/v1/tenant/plugins/${param0} */
export async function getTenantPluginsId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantPluginsIdParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/v1/tenant/plugins/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Update plugin PUT /api/v1/tenant/plugins/${param0} */
export async function putTenantPluginsId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.putTenantPluginsIdParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/v1/tenant/plugins/${param0}`, {
    method: "PUT",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Delete plugin DELETE /api/v1/tenant/plugins/${param0} */
export async function deleteTenantPluginsId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.deleteTenantPluginsIdParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/v1/tenant/plugins/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Trigger plugin sync POST /api/v1/tenant/plugins/${param0}/sync */
export async function postTenantPluginsIdSync(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantPluginsIdSyncParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/v1/tenant/plugins/${param0}/sync`, {
    method: "POST",
    params: { ...queryParams },
    ...(options || {}),
  });
}

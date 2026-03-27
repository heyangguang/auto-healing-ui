// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** List CMDB items GET /api/v1/tenant/cmdb */
export async function getTenantCmdb(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantCmdbParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/v1/tenant/cmdb", {
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

/** Enter maintenance mode POST /api/v1/tenant/cmdb/${param0}/maintenance */
export async function postTenantCmdbIdMaintenance(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantCmdbIdMaintenanceParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/v1/tenant/cmdb/${param0}/maintenance`, {
    method: "POST",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Exit maintenance mode POST /api/v1/tenant/cmdb/${param0}/resume */
export async function postTenantCmdbIdResume(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantCmdbIdResumeParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/v1/tenant/cmdb/${param0}/resume`, {
    method: "POST",
    params: { ...queryParams },
    ...(options || {}),
  });
}

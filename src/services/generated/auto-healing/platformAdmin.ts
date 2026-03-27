// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** List tenants GET /api/v1/platform/tenants */
export async function getPlatformTenants(options?: { [key: string]: any }) {
  return request<any>("/api/v1/platform/tenants", {
    method: "GET",
    ...(options || {}),
  });
}

/** Create tenant POST /api/v1/platform/tenants */
export async function postPlatformTenants(options?: { [key: string]: any }) {
  return request<any>("/api/v1/platform/tenants", {
    method: "POST",
    ...(options || {}),
  });
}

/** List platform users GET /api/v1/platform/users */
export async function getPlatformUsers(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getPlatformUsersParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/v1/platform/users", {
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

/** Create platform user POST /api/v1/platform/users */
export async function postPlatformUsers(options?: { [key: string]: any }) {
  return request<any>("/api/v1/platform/users", {
    method: "POST",
    ...(options || {}),
  });
}

// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** List notification channels GET /api/v1/tenant/channels */
export async function getTenantChannels(options?: { [key: string]: any }) {
  return request<any>("/api/v1/tenant/channels", {
    method: "GET",
    ...(options || {}),
  });
}

/** Create notification channel POST /api/v1/tenant/channels */
export async function postTenantChannels(options?: { [key: string]: any }) {
  return request<any>("/api/v1/tenant/channels", {
    method: "POST",
    ...(options || {}),
  });
}

/** List notification logs GET /api/v1/tenant/notifications */
export async function getTenantNotifications(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantNotificationsParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/v1/tenant/notifications", {
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

/** List notification templates GET /api/v1/tenant/templates */
export async function getTenantTemplates(options?: { [key: string]: any }) {
  return request<any>("/api/v1/tenant/templates", {
    method: "GET",
    ...(options || {}),
  });
}

/** Create notification template POST /api/v1/tenant/templates */
export async function postTenantTemplates(options?: { [key: string]: any }) {
  return request<any>("/api/v1/tenant/templates", {
    method: "POST",
    ...(options || {}),
  });
}

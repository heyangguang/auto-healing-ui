// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** Get dashboard overview (KPIs, trends) GET /api/v1/tenant/dashboard/overview */
export async function getTenantDashboardOverview(options?: {
  [key: string]: any;
}) {
  return request<any>("/api/v1/tenant/dashboard/overview", {
    method: "GET",
    ...(options || {}),
  });
}

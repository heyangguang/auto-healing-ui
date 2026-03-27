// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** List flow instances GET /api/v1/tenant/healing/instances */
export async function getTenantHealingInstances(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantHealingInstancesParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/v1/tenant/healing/instances", {
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

/** Get flow instance details GET /api/v1/tenant/healing/instances/${param0} */
export async function getTenantHealingInstancesId(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantHealingInstancesIdParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/v1/tenant/healing/instances/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** SSE event stream for flow instance Server-Sent Events stream providing real-time updates for a running flow instance. GET /api/v1/tenant/healing/instances/${param0}/events */
export async function getTenantHealingInstancesIdEvents(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantHealingInstancesIdEventsParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<{ id?: number }>(
    `/api/v1/tenant/healing/instances/${param0}/events`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

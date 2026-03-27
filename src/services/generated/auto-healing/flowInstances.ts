// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 获取流程实例列表 GET /api/v1/tenant/healing/instances */
export async function getTenantHealingInstances(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantHealingInstancesParams,
  options?: Record<string, unknown>
) {
  return request<
    GeneratedAutoHealing.PaginatedResponse & {
      data?: GeneratedAutoHealing.FlowInstance[];
    }
  >("/api/v1/tenant/healing/instances", {
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

/** 获取流程实例详情 GET /api/v1/tenant/healing/instances/${param0} */
export async function getTenantHealingInstancesById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantHealingInstancesByIdParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<GeneratedAutoHealing.FlowInstance>(
    `/api/v1/tenant/healing/instances/${param0}`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 取消流程实例 POST /api/v1/tenant/healing/instances/${param0}/cancel */
export async function postTenantHealingInstancesByIdCancel(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantHealingInstancesByIdCancelParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>(`/api/v1/tenant/healing/instances/${param0}/cancel`, {
    method: "POST",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 流程实例事件流 Server-Sent Events (SSE) 实时推送流程实例状态与节点事件。
 GET /api/v1/tenant/healing/instances/${param0}/events */
export async function getTenantHealingInstancesByIdEvents(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantHealingInstancesByIdEventsParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<string>(`/api/v1/tenant/healing/instances/${param0}/events`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 重试流程实例 POST /api/v1/tenant/healing/instances/${param0}/retry */
export async function postTenantHealingInstancesByIdRetry(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantHealingInstancesByIdRetryParams,
  body: {
    /** 从指定节点 ID 开始重试，不传则从头重试 */
    from_node_id?: string;
  },
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>(`/api/v1/tenant/healing/instances/${param0}/retry`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 获取流程实例搜索字段定义 GET /api/v1/tenant/healing/instances/search-schema */
export async function getTenantHealingInstancesSearchSchema(options?: {
  [key: string]: unknown;
}) {
  return request<
    GeneratedAutoHealing.Success & {
      data?: GeneratedAutoHealing.SearchableField[];
    }
  >("/api/v1/tenant/healing/instances/search-schema", {
    method: "GET",
    ...(options || {}),
  });
}

/** 获取流程实例统计 GET /api/v1/tenant/healing/instances/stats */
export async function getTenantHealingInstancesStats(options?: {
  [key: string]: unknown;
}) {
  return request<{
    code?: number;
    message?: string;
    data?: {
      total?: number;
      by_status?: {
        status?:
          | "pending"
          | "running"
          | "waiting_approval"
          | "completed"
          | "failed"
          | "cancelled";
        count?: number;
      }[];
    };
  }>("/api/v1/tenant/healing/instances/stats", {
    method: "GET",
    ...(options || {}),
  });
}

export { getTenantHealingInstancesById as getTenantHealingInstancesId };

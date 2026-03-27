// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 获取自愈流程列表 GET /api/v1/tenant/healing/flows */
export async function getTenantHealingFlows(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantHealingFlowsParams,
  options?: Record<string, unknown>
) {
  return request<
    GeneratedAutoHealing.PaginatedResponse & {
      data?: GeneratedAutoHealing.HealingFlow[];
    }
  >("/api/v1/tenant/healing/flows", {
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

/** 创建自愈流程 POST /api/v1/tenant/healing/flows */
export async function postTenantHealingFlows(
  body: GeneratedAutoHealing.HealingFlowCreate,
  options?: Record<string, unknown>
) {
  return request<GeneratedAutoHealing.HealingFlow>(
    "/api/v1/tenant/healing/flows",
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

/** 获取自愈流程详情 GET /api/v1/tenant/healing/flows/${param0} */
export async function getTenantHealingFlowsById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantHealingFlowsByIdParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<GeneratedAutoHealing.HealingFlow>(
    `/api/v1/tenant/healing/flows/${param0}`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 更新自愈流程 PUT /api/v1/tenant/healing/flows/${param0} */
export async function putTenantHealingFlowsById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.putTenantHealingFlowsByIdParams,
  body: GeneratedAutoHealing.HealingFlowUpdate,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<GeneratedAutoHealing.HealingFlow>(
    `/api/v1/tenant/healing/flows/${param0}`,
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

/** 删除自愈流程 DELETE /api/v1/tenant/healing/flows/${param0} */
export async function deleteTenantHealingFlowsById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.deleteTenantHealingFlowsByIdParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>(`/api/v1/tenant/healing/flows/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 试运行流程 POST /api/v1/tenant/healing/flows/${param0}/dry-run */
export async function postTenantHealingFlowsByIdDryRun(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantHealingFlowsByIdDryRunParams,
  body: Record<string, unknown>,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<GeneratedAutoHealing.Success & { data?: Record<string, unknown> }>(
    `/api/v1/tenant/healing/flows/${param0}/dry-run`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      params: { ...queryParams },
      data: body,
      ...(options || {}),
    }
  );
}

/** 流式试运行流程 POST /api/v1/tenant/healing/flows/${param0}/dry-run-stream */
export async function postTenantHealingFlowsByIdDryRunStream(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantHealingFlowsByIdDryRunStreamParams,
  body: Record<string, unknown>,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<string>(
    `/api/v1/tenant/healing/flows/${param0}/dry-run-stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      params: { ...queryParams },
      data: body,
      ...(options || {}),
    }
  );
}

/** 获取节点类型 Schema GET /api/v1/tenant/healing/flows/node-schema */
export async function getTenantHealingFlowsNodeSchema(options?: {
  [key: string]: unknown;
}) {
  return request<
    GeneratedAutoHealing.Success & {
      data?: GeneratedAutoHealing.HealingNodeSchema;
    }
  >("/api/v1/tenant/healing/flows/node-schema", {
    method: "GET",
    ...(options || {}),
  });
}

/** 获取流程搜索字段定义 GET /api/v1/tenant/healing/flows/search-schema */
export async function getTenantHealingFlowsSearchSchema(options?: {
  [key: string]: unknown;
}) {
  return request<
    GeneratedAutoHealing.Success & {
      data?: GeneratedAutoHealing.SearchableField[];
    }
  >("/api/v1/tenant/healing/flows/search-schema", {
    method: "GET",
    ...(options || {}),
  });
}

/** 获取流程统计 GET /api/v1/tenant/healing/flows/stats */
export async function getTenantHealingFlowsStats(options?: {
  [key: string]: unknown;
}) {
  return request<GeneratedAutoHealing.Success & { data?: Record<string, unknown> }>(
    "/api/v1/tenant/healing/flows/stats",
    {
      method: "GET",
      ...(options || {}),
    }
  );
}

export { getTenantHealingFlowsById as getTenantHealingFlowsId };
export { putTenantHealingFlowsById as putTenantHealingFlowsId };
export { deleteTenantHealingFlowsById as deleteTenantHealingFlowsId };
export { postTenantHealingFlowsByIdDryRun as postTenantHealingFlowsIdDryRun };
export { postTenantHealingFlowsByIdDryRunStream as postTenantHealingFlowsIdDryRunStream };

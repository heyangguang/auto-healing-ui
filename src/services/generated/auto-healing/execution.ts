// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** List all execution runs GET /api/v1/tenant/execution-runs */
export async function getTenantExecutionRuns(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantExecutionRunsParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/v1/tenant/execution-runs", {
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

/** SSE log stream for execution run Server-Sent Events stream for real-time Ansible execution logs. GET /api/v1/tenant/execution-runs/${param0}/stream */
export async function getTenantExecutionRunsIdStream(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantExecutionRunsIdStreamParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<{ id?: number }>(
    `/api/v1/tenant/execution-runs/${param0}/stream`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** List execution task templates GET /api/v1/tenant/execution-tasks */
export async function getTenantExecutionTasks(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantExecutionTasksParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/v1/tenant/execution-tasks", {
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

/** Create execution task template POST /api/v1/tenant/execution-tasks */
export async function postTenantExecutionTasks(options?: {
  [key: string]: any;
}) {
  return request<any>("/api/v1/tenant/execution-tasks", {
    method: "POST",
    ...(options || {}),
  });
}

/** Execute a task (manual trigger) POST /api/v1/tenant/execution-tasks/${param0}/execute */
export async function postTenantExecutionTasksIdExecute(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantExecutionTasksIdExecuteParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/v1/tenant/execution-tasks/${param0}/execute`, {
    method: "POST",
    params: { ...queryParams },
    ...(options || {}),
  });
}

// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 获取 Dashboard 配置 GET /api/v1/tenant/dashboard/config */
export async function getTenantDashboardConfig(options?: {
  [key: string]: unknown;
}) {
  return request<
    GeneratedAutoHealing.Success & {
      data?: GeneratedAutoHealing.DashboardConfigPayload;
    }
  >("/api/v1/tenant/dashboard/config", {
    method: "GET",
    ...(options || {}),
  });
}

/** 更新 Dashboard 配置 PUT /api/v1/tenant/dashboard/config */
export async function putTenantDashboardConfig(
  body: Record<string, unknown>,
  options?: Record<string, unknown>
) {
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>("/api/v1/tenant/dashboard/config", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取 Dashboard 概览 GET /api/v1/tenant/dashboard/overview */
export async function getTenantDashboardOverview(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantDashboardOverviewParams,
  options?: Record<string, unknown>
) {
  return request<
    GeneratedAutoHealing.Success & {
      data?: GeneratedAutoHealing.DashboardOverview;
    }
  >("/api/v1/tenant/dashboard/overview", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取角色关联工作区 GET /api/v1/tenant/dashboard/roles/${param0}/workspaces */
export async function getTenantDashboardRolesByRoleIdWorkspaces(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantDashboardRolesByRoleIdWorkspacesParams,
  options?: Record<string, unknown>
) {
  const { roleId: param0, ...queryParams } = params;
  return request<
    GeneratedAutoHealing.Success & { data?: { workspace_ids?: string[] } }
  >(`/api/v1/tenant/dashboard/roles/${param0}/workspaces`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 设置角色关联工作区 PUT /api/v1/tenant/dashboard/roles/${param0}/workspaces */
export async function putTenantDashboardRolesByRoleIdWorkspaces(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.putTenantDashboardRolesByRoleIdWorkspacesParams,
  body: {
    workspace_ids: string[];
  },
  options?: Record<string, unknown>
) {
  const { roleId: param0, ...queryParams } = params;
  return request<GeneratedAutoHealing.Success & { data?: Record<string, unknown> }>(
    `/api/v1/tenant/dashboard/roles/${param0}/workspaces`,
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

/** 获取系统工作区列表 GET /api/v1/tenant/dashboard/workspaces */
export async function getTenantDashboardWorkspaces(options?: {
  [key: string]: unknown;
}) {
  return request<
    GeneratedAutoHealing.Success & { data?: Record<string, unknown>[] }
  >("/api/v1/tenant/dashboard/workspaces", {
    method: "GET",
    ...(options || {}),
  });
}

/** 创建系统工作区 POST /api/v1/tenant/dashboard/workspaces */
export async function postTenantDashboardWorkspaces(
  body: {
    name: string;
    description?: string;
    config: Record<string, unknown>;
  },
  options?: Record<string, unknown>
) {
  return request<GeneratedAutoHealing.Success & { data?: Record<string, unknown> }>(
    "/api/v1/tenant/dashboard/workspaces",
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

/** 更新系统工作区 PUT /api/v1/tenant/dashboard/workspaces/${param0} */
export async function putTenantDashboardWorkspacesById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.putTenantDashboardWorkspacesByIdParams,
  body: Record<string, unknown>,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<GeneratedAutoHealing.Success & { data?: Record<string, unknown> }>(
    `/api/v1/tenant/dashboard/workspaces/${param0}`,
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

/** 删除系统工作区 DELETE /api/v1/tenant/dashboard/workspaces/${param0} */
export async function deleteTenantDashboardWorkspacesById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.deleteTenantDashboardWorkspacesByIdParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>(`/api/v1/tenant/dashboard/workspaces/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

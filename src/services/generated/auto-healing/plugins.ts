// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 获取插件列表 GET /api/v1/tenant/plugins */
export async function getTenantPlugins(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantPluginsParams,
  options?: Record<string, unknown>
) {
  return request<
    GeneratedAutoHealing.PaginatedResponse & {
      data?: GeneratedAutoHealing.Plugin[];
    }
  >("/api/v1/tenant/plugins", {
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

/** 创建插件 POST /api/v1/tenant/plugins */
export async function postTenantPlugins(
  body: AutoHealing.CreatePluginRequest,
  options?: Record<string, unknown>
) {
  return request<GeneratedAutoHealing.Plugin>("/api/v1/tenant/plugins", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取插件详情 GET /api/v1/tenant/plugins/${param0} */
export async function getTenantPluginsById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantPluginsByIdParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<GeneratedAutoHealing.Plugin>(
    `/api/v1/tenant/plugins/${param0}`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 更新插件 更新插件配置。只需传递需要修改的字段。
**可更新字段：** description, version, config, field_mapping, sync_filter, sync_enabled, sync_interval_minutes
**不可修改：** name, type
 PUT /api/v1/tenant/plugins/${param0} */
export async function putTenantPluginsById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.putTenantPluginsByIdParams,
  body: AutoHealing.UpdatePluginRequest,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<GeneratedAutoHealing.Plugin>(
    `/api/v1/tenant/plugins/${param0}`,
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

/** 删除插件 DELETE /api/v1/tenant/plugins/${param0} */
export async function deleteTenantPluginsById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.deleteTenantPluginsByIdParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>(`/api/v1/tenant/plugins/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 激活插件 测试连接成功后激活插件。只有激活状态的插件才会参与定时同步。 POST /api/v1/tenant/plugins/${param0}/activate */
export async function postTenantPluginsByIdActivate(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantPluginsByIdActivateParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{ message?: string }>(
    `/api/v1/tenant/plugins/${param0}/activate`,
    {
      method: "POST",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 停用插件 直接停用插件，不需要测试。停用后插件不再参与定时同步。 POST /api/v1/tenant/plugins/${param0}/deactivate */
export async function postTenantPluginsByIdDeactivate(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantPluginsByIdDeactivateParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{ message?: string }>(
    `/api/v1/tenant/plugins/${param0}/deactivate`,
    {
      method: "POST",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 获取插件同步日志 GET /api/v1/tenant/plugins/${param0}/logs */
export async function getTenantPluginsByIdLogs(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantPluginsByIdLogsParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<
    GeneratedAutoHealing.PaginatedResponse & {
      data?: GeneratedAutoHealing.PluginSyncLog[];
    }
  >(`/api/v1/tenant/plugins/${param0}/logs`, {
    method: "GET",
    params: {
      // page has a default value: 1
      page: "1",
      // page_size has a default value: 20
      page_size: "20",
      ...queryParams,
    },
    ...(options || {}),
  });
}

/** 触发手动同步 POST /api/v1/tenant/plugins/${param0}/sync */
export async function postTenantPluginsByIdSync(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantPluginsByIdSyncParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<GeneratedAutoHealing.PluginSyncLog>(
    `/api/v1/tenant/plugins/${param0}/sync`,
    {
      method: "POST",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 测试插件连接 只测试连接，不改变插件状态 POST /api/v1/tenant/plugins/${param0}/test */
export async function postTenantPluginsByIdTest(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantPluginsByIdTestParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{ message?: string }>(
    `/api/v1/tenant/plugins/${param0}/test`,
    {
      method: "POST",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 获取插件搜索字段定义 GET /api/v1/tenant/plugins/search-schema */
export async function getTenantPluginsSearchSchema(options?: {
  [key: string]: unknown;
}) {
  return request<
    GeneratedAutoHealing.Success & {
      data?: GeneratedAutoHealing.SearchableField[];
    }
  >("/api/v1/tenant/plugins/search-schema", {
    method: "GET",
    ...(options || {}),
  });
}

/** 获取插件统计 返回插件的总数、类型分布、状态分布、同步配置统计等信息 GET /api/v1/tenant/plugins/stats */
export async function getTenantPluginsStats(options?: Record<string, unknown>) {
  return request<
    GeneratedAutoHealing.Success & { data?: GeneratedAutoHealing.PluginStats }
  >("/api/v1/tenant/plugins/stats", {
    method: "GET",
    ...(options || {}),
  });
}

export { getTenantPluginsById as getTenantPluginsId };
export { putTenantPluginsById as putTenantPluginsId };
export { deleteTenantPluginsById as deleteTenantPluginsId };
export { postTenantPluginsByIdSync as postTenantPluginsIdSync };
export { postTenantPluginsByIdActivate as postTenantPluginsIdActivate };
export { postTenantPluginsByIdDeactivate as postTenantPluginsIdDeactivate };
export { postTenantPluginsByIdTest as postTenantPluginsIdTest };
export { getTenantPluginsByIdLogs as getTenantPluginsIdLogs };

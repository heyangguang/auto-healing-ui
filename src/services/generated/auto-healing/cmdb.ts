// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 获取 CMDB 配置项列表 GET /api/v1/tenant/cmdb */
export async function getTenantCmdb(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantCmdbParams,
  options?: Record<string, unknown>
) {
  return request<
    GeneratedAutoHealing.PaginatedResponse & {
      data?: GeneratedAutoHealing.CMDBItem[];
    }
  >("/api/v1/tenant/cmdb", {
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

/** 获取 CMDB 配置项详情 GET /api/v1/tenant/cmdb/${param0} */
export async function getTenantCmdbById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantCmdbByIdParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<GeneratedAutoHealing.CMDBItem>(
    `/api/v1/tenant/cmdb/${param0}`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 进入维护模式 将配置项设置为维护状态，到期后自动恢复 POST /api/v1/tenant/cmdb/${param0}/maintenance */
export async function postTenantCmdbByIdMaintenance(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantCmdbByIdMaintenanceParams,
  body: {
    /** 维护原因 */
    reason: string;
    /** 维护结束时间（RFC3339格式） */
    end_at?: string;
  },
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<GeneratedAutoHealing.MessageResponse>(
    `/api/v1/tenant/cmdb/${param0}/maintenance`,
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

/** 获取维护日志 获取配置项的维护历史记录 GET /api/v1/tenant/cmdb/${param0}/maintenance-logs */
export async function getTenantCmdbByIdMaintenanceLogs(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantCmdbByIdMaintenanceLogsParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    data?: GeneratedAutoHealing.CMDBMaintenanceLog[];
    total?: number;
    page?: number;
    page_size?: number;
  }>(`/api/v1/tenant/cmdb/${param0}/maintenance-logs`, {
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

/** 退出维护模式 手动恢复配置项为正常状态 POST /api/v1/tenant/cmdb/${param0}/resume */
export async function postTenantCmdbByIdResume(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantCmdbByIdResumeParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<GeneratedAutoHealing.MessageResponse>(
    `/api/v1/tenant/cmdb/${param0}/resume`,
    {
      method: "POST",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 测试单个 CMDB 配置项的 SSH 连接 POST /api/v1/tenant/cmdb/${param0}/test-connection */
export async function postTenantCmdbByIdTestConnection(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantCmdbByIdTestConnectionParams,
  body: {
    /** 密钥源 ID */
    secrets_source_id: string;
  },
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<GeneratedAutoHealing.ConnectionTestResult>(
    `/api/v1/tenant/cmdb/${param0}/test-connection`,
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

/** 批量测试 SSH 连接 批量测试多个 CMDB 配置项的 SSH 连接 POST /api/v1/tenant/cmdb/batch-test-connection */
export async function postTenantCmdbBatchTestConnection(
  body: {
    /** CMDB 配置项 ID 列表（最多 50 个） */
    cmdb_ids: string[];
    /** 密钥源 ID */
    secrets_source_id: string;
  },
  options?: Record<string, unknown>
) {
  return request<
    GeneratedAutoHealing.Success & {
      data?: {
        total?: number;
        success?: number;
        failed?: number;
        results?: GeneratedAutoHealing.ConnectionTestResult[];
      };
    }
  >("/api/v1/tenant/cmdb/batch-test-connection", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 批量进入维护模式 批量将配置项设置为维护状态，最多支持 100 个 POST /api/v1/tenant/cmdb/batch/maintenance */
export async function postTenantCmdbBatchMaintenance(
  body: {
    /** 配置项 ID 列表 */
    ids: string[];
    /** 维护原因 */
    reason: string;
    /** 维护结束时间 */
    end_at?: string;
  },
  options?: Record<string, unknown>
) {
  return request<{ total?: number; success?: number; failed?: number }>(
    "/api/v1/tenant/cmdb/batch/maintenance",
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

/** 批量退出维护模式 批量恢复配置项为正常状态，最多支持 100 个 POST /api/v1/tenant/cmdb/batch/resume */
export async function postTenantCmdbBatchResume(
  body: {
    /** 配置项 ID 列表 */
    ids: string[];
  },
  options?: Record<string, unknown>
) {
  return request<{ total?: number; success?: number; failed?: number }>(
    "/api/v1/tenant/cmdb/batch/resume",
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

/** 获取符合筛选条件的 CMDB ID 列表 GET /api/v1/tenant/cmdb/ids */
export async function getTenantCmdbIds(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantCmdbIdsParams,
  options?: Record<string, unknown>
) {
  return request<
    GeneratedAutoHealing.Success & {
      data?: { items?: Record<string, unknown>[]; total?: number };
    }
  >("/api/v1/tenant/cmdb/ids", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取 CMDB 搜索字段定义 GET /api/v1/tenant/cmdb/search-schema */
export async function getTenantCmdbSearchSchema(options?: {
  [key: string]: unknown;
}) {
  return request<
    GeneratedAutoHealing.Success & {
      data?: GeneratedAutoHealing.SearchableField[];
    }
  >("/api/v1/tenant/cmdb/search-schema", {
    method: "GET",
    ...(options || {}),
  });
}

/** 获取 CMDB 统计信息 GET /api/v1/tenant/cmdb/stats */
export async function getTenantCmdbStats(options?: Record<string, unknown>) {
  return request<GeneratedAutoHealing.CMDBStats>("/api/v1/tenant/cmdb/stats", {
    method: "GET",
    ...(options || {}),
  });
}

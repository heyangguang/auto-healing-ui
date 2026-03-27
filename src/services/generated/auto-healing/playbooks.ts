// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 获取 Playbook 模板列表 GET /api/v1/tenant/playbooks */
export async function getTenantPlaybooks(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantPlaybooksParams,
  options?: Record<string, unknown>
) {
  return request<GeneratedAutoHealing.PaginatedPlaybooks>(
    "/api/v1/tenant/playbooks",
    {
      method: "GET",
      params: {
        // page has a default value: 1
        page: "1",
        // page_size has a default value: 20
        page_size: "20",

        ...params,
      },
      ...(options || {}),
    }
  );
}

/** 创建 Playbook 模板 POST /api/v1/tenant/playbooks */
export async function postTenantPlaybooks(
  body: {
    /** 关联的 Git 仓库 ID */
    repository_id: string;
    /** 模板名称（全局唯一） */
    name: string;
    /** 入口文件相对路径，如 site.yml */
    file_path: string;
    /** 扫描模式（创建时必须指定，之后不可更改） */
    config_mode: "auto" | "enhanced";
    /** 描述 */
    description?: string;
  },
  options?: Record<string, unknown>
) {
  return request<GeneratedAutoHealing.Playbook>("/api/v1/tenant/playbooks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取 Playbook 模板详情 GET /api/v1/tenant/playbooks/${param0} */
export async function getTenantPlaybooksById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantPlaybooksByIdParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<GeneratedAutoHealing.Playbook>(
    `/api/v1/tenant/playbooks/${param0}`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 更新 Playbook 模板 PUT /api/v1/tenant/playbooks/${param0} */
export async function putTenantPlaybooksById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.putTenantPlaybooksByIdParams,
  body: {
    name?: string;
    description?: string;
  },
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>(`/api/v1/tenant/playbooks/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 删除 Playbook 模板 DELETE /api/v1/tenant/playbooks/${param0} */
export async function deleteTenantPlaybooksById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.deleteTenantPlaybooksByIdParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>(`/api/v1/tenant/playbooks/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 获取文件列表 获取 Playbook 扫描过的所有文件列表 GET /api/v1/tenant/playbooks/${param0}/files */
export async function getTenantPlaybooksByIdFiles(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantPlaybooksByIdFilesParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    code?: number;
    data?: {
      files?: {
        path?: string;
        type?:
          | "entry"
          | "task"
          | "vars"
          | "defaults"
          | "handlers"
          | "template"
          | "file"
          | "role"
          | "include";
      }[];
    };
  }>(`/api/v1/tenant/playbooks/${param0}/files`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 下线（设置为 Pending 状态） 将 Playbook 设置为 pending 状态，下线后无法被执行任务使用 POST /api/v1/tenant/playbooks/${param0}/offline */
export async function postTenantPlaybooksByIdOffline(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantPlaybooksByIdOfflineParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>(`/api/v1/tenant/playbooks/${param0}/offline`, {
    method: "POST",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 上线（设置为 Ready 状态） 将 Playbook 设置为 ready 状态，允许被执行任务使用 POST /api/v1/tenant/playbooks/${param0}/ready */
export async function postTenantPlaybooksByIdReady(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantPlaybooksByIdReadyParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>(`/api/v1/tenant/playbooks/${param0}/ready`, {
    method: "POST",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 扫描 Playbook 变量 递归扫描 Playbook 及其引用的所有文件，智能推断变量类型。

类型推断优先级：
1. 增强模式 (.auto-healing.yml)
2. Jinja2 default 表达式
3. 变量名启发式
4. 默认 string
 POST /api/v1/tenant/playbooks/${param0}/scan */
export async function postTenantPlaybooksByIdScan(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantPlaybooksByIdScanParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<GeneratedAutoHealing.PlaybookScanLog>(
    `/api/v1/tenant/playbooks/${param0}/scan`,
    {
      method: "POST",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 获取扫描日志 GET /api/v1/tenant/playbooks/${param0}/scan-logs */
export async function getTenantPlaybooksByIdScanLogs(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantPlaybooksByIdScanLogsParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<GeneratedAutoHealing.PaginatedPlaybookScanLogs>(
    `/api/v1/tenant/playbooks/${param0}/scan-logs`,
    {
      method: "GET",
      params: {
        // page has a default value: 1
        page: "1",
        // page_size has a default value: 20
        page_size: "20",
        ...queryParams,
      },
      ...(options || {}),
    }
  );
}

/** 更新变量配置 手动修改变量的 required、description、default 等配置 PUT /api/v1/tenant/playbooks/${param0}/variables */
export async function putTenantPlaybooksByIdVariables(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.putTenantPlaybooksByIdVariablesParams,
  body: {
    variables: GeneratedAutoHealing.PlaybookVariable[];
  },
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>(`/api/v1/tenant/playbooks/${param0}/variables`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 获取 Playbook 统计 GET /api/v1/tenant/playbooks/stats */
export async function getTenantPlaybooksStats(options?: {
  [key: string]: unknown;
}) {
  return request<GeneratedAutoHealing.Success & { data?: Record<string, unknown> }>(
    "/api/v1/tenant/playbooks/stats",
    {
      method: "GET",
      ...(options || {}),
    }
  );
}

export { postTenantPlaybooksByIdScan as postTenantPlaybooksIdScan };
export { getTenantPlaybooksById as getTenantPlaybooksId };
export { putTenantPlaybooksById as putTenantPlaybooksId };
export { deleteTenantPlaybooksById as deleteTenantPlaybooksId };
export { getTenantPlaybooksByIdFiles as getTenantPlaybooksIdFiles };
export { postTenantPlaybooksByIdReady as postTenantPlaybooksIdReady };
export { postTenantPlaybooksByIdOffline as postTenantPlaybooksIdOffline };
export { getTenantPlaybooksByIdScanLogs as getTenantPlaybooksIdScanLogs };
export { putTenantPlaybooksByIdVariables as putTenantPlaybooksIdVariables };

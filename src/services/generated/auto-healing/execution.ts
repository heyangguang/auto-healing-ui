// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 获取任务模板列表 获取任务模板列表，支持多条件筛选。
- **search**: 模糊搜索任务名称或描述
- **executor_type**: 筛选执行器类型
- **status**: 筛选任务状态（pending_review = 需审核，ready = 就绪）
- **playbook_id**: 筛选关联的 Playbook
 GET /api/v1/tenant/execution-tasks */
export async function getTenantExecutionTasks(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantExecutionTasksParams,
  options?: Record<string, unknown>
) {
  return request<
    GeneratedAutoHealing.PaginatedResponse & {
      data?: GeneratedAutoHealing.ExecutionTask[];
    }
  >("/api/v1/tenant/execution-tasks", {
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

/** 创建任务模板 POST /api/v1/tenant/execution-tasks */
export async function postTenantExecutionTasks(
  body: {
    /** 任务名称 */
    name?: string;
    /** Playbook ID（状态必须为 ready 或 outdated） */
    playbook_id: string;
    /** 目标主机 */
    target_hosts: string;
    /** 变量值 */
    extra_vars?: Record<string, unknown>;
    executor_type?: "local" | "docker";
    notification_config?: GeneratedAutoHealing.TaskNotificationConfig;
    description?: string;
    secrets_source_ids?: string[];
  },
  options?: Record<string, unknown>
) {
  return request<GeneratedAutoHealing.ExecutionTask>(
    "/api/v1/tenant/execution-tasks",
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

/** 获取任务模板详情 GET /api/v1/tenant/execution-tasks/${param0} */
export async function getTenantExecutionTasksById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantExecutionTasksByIdParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<GeneratedAutoHealing.ExecutionTask>(
    `/api/v1/tenant/execution-tasks/${param0}`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 更新任务模板 PUT /api/v1/tenant/execution-tasks/${param0} */
export async function putTenantExecutionTasksById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.putTenantExecutionTasksByIdParams,
  body: {
    /** 任务名称 */
    name: string;
    /** 关联的 Playbook ID */
    playbook_id: string;
    /** 目标主机 */
    target_hosts: string;
    /** 变量值 */
    extra_vars?: Record<string, unknown>;
    executor_type?: "local" | "docker";
    /** 任务描述 */
    description?: string;
    /** 关联的密钥源 ID 列表 */
    secrets_source_ids?: string[];
    /** 定时表达式 (cron 格式) */
    schedule_expr?: string;
    is_recurring?: boolean;
    notification_config?: GeneratedAutoHealing.TaskNotificationConfig;
  },
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<GeneratedAutoHealing.ExecutionTask>(
    `/api/v1/tenant/execution-tasks/${param0}`,
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

/** 删除任务模板（级联删除执行记录和日志） DELETE /api/v1/tenant/execution-tasks/${param0} */
export async function deleteTenantExecutionTasksById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.deleteTenantExecutionTasksByIdParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<unknown>(`/api/v1/tenant/execution-tasks/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 确认审核变量变更 当 Playbook 变量变更后，关联的任务模板会被标记为 needs_review = true。
调用此接口确认审核完成，清除 needs_review 状态并更新变量快照。
 POST /api/v1/tenant/execution-tasks/${param0}/confirm-review */
export async function postTenantExecutionTasksByIdConfirmReview(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantExecutionTasksByIdConfirmReviewParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<GeneratedAutoHealing.ExecutionTask>(
    `/api/v1/tenant/execution-tasks/${param0}/confirm-review`,
    {
      method: "POST",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 执行任务（创建执行记录并运行） 如果任务模板的 needs_review = true，将返回错误，必须先调用确认审核接口。
 POST /api/v1/tenant/execution-tasks/${param0}/execute */
export async function postTenantExecutionTasksByIdExecute(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantExecutionTasksByIdExecuteParams,
  body: {
    /** 触发者 */
    triggered_by?: string;
    /** 密钥源ID（可选，向后兼容） */
    secrets_source_id?: string;
    /** 多密钥源ID（可选，优先使用，用于混合认证场景） */
    secrets_source_ids?: string[];
    /** 运行时覆盖变量 */
    extra_vars?: Record<string, unknown>;
    /** 覆盖目标主机（逗号分隔） */
    target_hosts?: string;
    /** 跳过本次通知（全局） */
    skip_notification?: boolean;
  },
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<GeneratedAutoHealing.ExecutionRun>(
    `/api/v1/tenant/execution-tasks/${param0}/execute`,
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

/** 获取任务的执行历史 GET /api/v1/tenant/execution-tasks/${param0}/runs */
export async function getTenantExecutionTasksByIdRuns(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantExecutionTasksByIdRunsParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    data?: GeneratedAutoHealing.ExecutionRun[];
    total?: number;
  }>(`/api/v1/tenant/execution-tasks/${param0}/runs`, {
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

/** 批量确认审核 POST /api/v1/tenant/execution-tasks/batch-confirm-review */
export async function postTenantExecutionTasksBatchConfirmReview(
  body: {
    task_ids?: string[];
    playbook_id?: string;
  },
  options?: Record<string, unknown>
) {
  return request<
    GeneratedAutoHealing.Success & {
      data?: { confirmed_count?: number; message?: string };
    }
  >("/api/v1/tenant/execution-tasks/batch-confirm-review", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取任务模板搜索字段定义 GET /api/v1/tenant/execution-tasks/search-schema */
export async function getTenantExecutionTasksSearchSchema(options?: {
  [key: string]: unknown;
}) {
  return request<
    GeneratedAutoHealing.Success & {
      data?: GeneratedAutoHealing.SearchableField[];
    }
  >("/api/v1/tenant/execution-tasks/search-schema", {
    method: "GET",
    ...(options || {}),
  });
}

/** 获取任务模板统计 GET /api/v1/tenant/execution-tasks/stats */
export async function getTenantExecutionTasksStats(options?: {
  [key: string]: unknown;
}) {
  return request<
    GeneratedAutoHealing.Success & {
      data?: GeneratedAutoHealing.ExecutionTaskStats;
    }
  >("/api/v1/tenant/execution-tasks/stats", {
    method: "GET",
    ...(options || {}),
  });
}

export { getTenantExecutionTasksById as getTenantExecutionTasksId };
export { putTenantExecutionTasksById as putTenantExecutionTasksId };
export { deleteTenantExecutionTasksById as deleteTenantExecutionTasksId };
export { postTenantExecutionTasksByIdConfirmReview as postTenantExecutionTasksIdConfirmReview };
export { postTenantExecutionTasksByIdExecute as postTenantExecutionTasksIdExecute };
export { getTenantExecutionTasksByIdRuns as getTenantExecutionTasksIdRuns };

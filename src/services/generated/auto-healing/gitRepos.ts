// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 获取 Git 仓库列表 GET /api/v1/tenant/git-repos */
export async function getTenantGitRepos(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantGitReposParams,
  options?: Record<string, unknown>
) {
  return request<
    GeneratedAutoHealing.PaginatedResponse & {
      data?: GeneratedAutoHealing.GitRepository[];
    }
  >("/api/v1/tenant/git-repos", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 创建 Git 仓库 POST /api/v1/tenant/git-repos */
export async function postTenantGitRepos(
  body: GeneratedAutoHealing.CreateGitRepoRequest,
  options?: Record<string, unknown>
) {
  return request<GeneratedAutoHealing.GitRepository>(
    "/api/v1/tenant/git-repos",
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

/** 获取仓库详情 GET /api/v1/tenant/git-repos/${param0} */
export async function getTenantGitReposById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantGitReposByIdParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<GeneratedAutoHealing.GitRepository>(
    `/api/v1/tenant/git-repos/${param0}`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 更新仓库 更新仓库配置。只需传递需要修改的字段。
**可更新字段：** default_branch, auth_type, auth_config, sync_enabled, sync_interval
 PUT /api/v1/tenant/git-repos/${param0} */
export async function putTenantGitReposById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.putTenantGitReposByIdParams,
  body: GeneratedAutoHealing.UpdateGitRepoRequest,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<GeneratedAutoHealing.GitRepository>(
    `/api/v1/tenant/git-repos/${param0}`,
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

/** 删除仓库 DELETE /api/v1/tenant/git-repos/${param0} */
export async function deleteTenantGitReposById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.deleteTenantGitReposByIdParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>(`/api/v1/tenant/git-repos/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 获取 Commit 历史 GET /api/v1/tenant/git-repos/${param0}/commits */
export async function getTenantGitReposByIdCommits(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantGitReposByIdCommitsParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{ code?: number; data?: GeneratedAutoHealing.CommitInfo[] }>(
    `/api/v1/tenant/git-repos/${param0}/commits`,
    {
      method: "GET",
      params: {
        // limit has a default value: 10
        limit: "10",
        ...queryParams,
      },
      ...(options || {}),
    }
  );
}

/** 获取文件树 GET /api/v1/tenant/git-repos/${param0}/files */
export async function getTenantGitReposByIdFiles(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantGitReposByIdFilesParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<
    GeneratedAutoHealing.Success & {
      data?: { path?: string; content?: string } | string[];
    }
  >(`/api/v1/tenant/git-repos/${param0}/files`, {
    method: "GET",
    params: {
      ...queryParams,
    },
    ...(options || {}),
  });
}

/** 获取同步日志 GET /api/v1/tenant/git-repos/${param0}/logs */
export async function getTenantGitReposByIdLogs(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantGitReposByIdLogsParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<
    GeneratedAutoHealing.PaginatedResponse & { data?: Record<string, unknown>[] }
  >(`/api/v1/tenant/git-repos/${param0}/logs`, {
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

/** 重置仓库状态 POST /api/v1/tenant/git-repos/${param0}/reset-status */
export async function postTenantGitReposByIdResetStatus(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantGitReposByIdResetStatusParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>(`/api/v1/tenant/git-repos/${param0}/reset-status`, {
    method: "POST",
    params: {
      ...queryParams,
    },
    ...(options || {}),
  });
}

/** 同步仓库 POST /api/v1/tenant/git-repos/${param0}/sync */
export async function postTenantGitReposByIdSync(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantGitReposByIdSyncParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>(`/api/v1/tenant/git-repos/${param0}/sync`, {
    method: "POST",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 获取 Git 仓库搜索字段定义 GET /api/v1/tenant/git-repos/search-schema */
export async function getTenantGitReposSearchSchema(options?: {
  [key: string]: unknown;
}) {
  return request<
    GeneratedAutoHealing.Success & {
      data?: GeneratedAutoHealing.SearchableField[];
    }
  >("/api/v1/tenant/git-repos/search-schema", {
    method: "GET",
    ...(options || {}),
  });
}

/** 获取 Git 仓库统计 GET /api/v1/tenant/git-repos/stats */
export async function getTenantGitReposStats(options?: Record<string, unknown>) {
  return request<GeneratedAutoHealing.Success & { data?: Record<string, unknown> }>(
    "/api/v1/tenant/git-repos/stats",
    {
      method: "GET",
      ...(options || {}),
    }
  );
}

/** 验证仓库（创建前获取分支列表） 在创建仓库之前，验证 URL 和认证是否有效，并获取可用分支列表。
前端可使用此接口让用户先选择分支，再提交创建请求。
 POST /api/v1/tenant/git-repos/validate */
export async function postTenantGitReposValidate(
  body: {
    /** Git 仓库 URL */
    url: string;
    auth_type?: "none" | "token" | "password" | "ssh_key";
    /** 认证配置 */
    auth_config?: Record<string, unknown>;
  },
  options?: Record<string, unknown>
) {
  return request<unknown>("/api/v1/tenant/git-repos/validate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

export { getTenantGitReposById as getTenantGitReposId };
export { putTenantGitReposById as putTenantGitReposId };
export { deleteTenantGitReposById as deleteTenantGitReposId };
export { postTenantGitReposByIdSync as postTenantGitReposIdSync };
export { getTenantGitReposByIdCommits as getTenantGitReposIdCommits };
export { getTenantGitReposByIdFiles as getTenantGitReposIdFiles };
export { getTenantGitReposByIdLogs as getTenantGitReposIdLogs };
export { postTenantGitReposByIdResetStatus as postTenantGitReposIdResetStatus };

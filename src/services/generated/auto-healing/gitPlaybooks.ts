// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** List Git repositories GET /api/v1/tenant/git-repos */
export async function getTenantGitRepos(options?: { [key: string]: any }) {
  return request<any>("/api/v1/tenant/git-repos", {
    method: "GET",
    ...(options || {}),
  });
}

/** Register a Git repository POST /api/v1/tenant/git-repos */
export async function postTenantGitRepos(options?: { [key: string]: any }) {
  return request<any>("/api/v1/tenant/git-repos", {
    method: "POST",
    ...(options || {}),
  });
}

/** Trigger Git repository sync POST /api/v1/tenant/git-repos/${param0}/sync */
export async function postTenantGitReposIdSync(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantGitReposIdSyncParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/v1/tenant/git-repos/${param0}/sync`, {
    method: "POST",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** List playbook templates GET /api/v1/tenant/playbooks */
export async function getTenantPlaybooks(options?: { [key: string]: any }) {
  return request<any>("/api/v1/tenant/playbooks", {
    method: "GET",
    ...(options || {}),
  });
}

/** Scan playbook variables POST /api/v1/tenant/playbooks/${param0}/scan */
export async function postTenantPlaybooksIdScan(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantPlaybooksIdScanParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/v1/tenant/playbooks/${param0}/scan`, {
    method: "POST",
    params: { ...queryParams },
    ...(options || {}),
  });
}

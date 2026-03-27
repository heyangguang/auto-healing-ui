// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** List approval tasks GET /api/v1/tenant/healing/approvals */
export async function getTenantHealingApprovals(options?: {
  [key: string]: any;
}) {
  return request<any>("/api/v1/tenant/healing/approvals", {
    method: "GET",
    ...(options || {}),
  });
}

/** Approve a task POST /api/v1/tenant/healing/approvals/${param0}/approve */
export async function postTenantHealingApprovalsIdApprove(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantHealingApprovalsIdApproveParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/v1/tenant/healing/approvals/${param0}/approve`, {
    method: "POST",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Reject a task POST /api/v1/tenant/healing/approvals/${param0}/reject */
export async function postTenantHealingApprovalsIdReject(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantHealingApprovalsIdRejectParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<any>(`/api/v1/tenant/healing/approvals/${param0}/reject`, {
    method: "POST",
    params: { ...queryParams },
    ...(options || {}),
  });
}

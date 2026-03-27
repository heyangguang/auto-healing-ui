// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 获取审批任务列表 GET /api/v1/tenant/healing/approvals */
export async function getTenantHealingApprovals(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantHealingApprovalsParams,
  options?: Record<string, unknown>
) {
  return request<
    GeneratedAutoHealing.PaginatedResponse & {
      data?: GeneratedAutoHealing.ApprovalTask[];
    }
  >("/api/v1/tenant/healing/approvals", {
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

/** 获取审批任务详情 GET /api/v1/tenant/healing/approvals/${param0} */
export async function getTenantHealingApprovalsById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantHealingApprovalsByIdParams,
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<GeneratedAutoHealing.ApprovalTask>(
    `/api/v1/tenant/healing/approvals/${param0}`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 批准审批任务 POST /api/v1/tenant/healing/approvals/${param0}/approve */
export async function postTenantHealingApprovalsByIdApprove(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantHealingApprovalsByIdApproveParams,
  body: {
    /** 审批意见 */
    comment?: string;
  },
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>(`/api/v1/tenant/healing/approvals/${param0}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 拒绝审批任务 POST /api/v1/tenant/healing/approvals/${param0}/reject */
export async function postTenantHealingApprovalsByIdReject(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.postTenantHealingApprovalsByIdRejectParams,
  body: {
    /** 拒绝理由 */
    comment?: string;
  },
  options?: Record<string, unknown>
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>(`/api/v1/tenant/healing/approvals/${param0}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 获取待审批任务列表 GET /api/v1/tenant/healing/approvals/pending */
export async function getTenantHealingApprovalsPending(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getTenantHealingApprovalsPendingParams,
  options?: Record<string, unknown>
) {
  return request<
    GeneratedAutoHealing.PaginatedResponse & {
      data?: GeneratedAutoHealing.ApprovalTask[];
    }
  >("/api/v1/tenant/healing/approvals/pending", {
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

export { getTenantHealingApprovalsById as getTenantHealingApprovalsId };
export { postTenantHealingApprovalsByIdApprove as postTenantHealingApprovalsIdApprove };
export { postTenantHealingApprovalsByIdReject as postTenantHealingApprovalsIdReject };

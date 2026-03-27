// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 校验邀请令牌 GET /api/v1/auth/invitation/${param0} */
export async function getAuthInvitationByToken(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getAuthInvitationByTokenParams,
  options?: Record<string, unknown>
) {
  const { token: param0, ...queryParams } = params;
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>(`/api/v1/auth/invitation/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 用户登录 POST /api/v1/auth/login */
export async function postAuthLogin(
  body: {
    username: string;
    password: string;
  },
  options?: Record<string, unknown>
) {
  return request<
    GeneratedAutoHealing.Success & { data?: GeneratedAutoHealing.LoginPayload }
  >("/api/v1/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 用户登出 POST /api/v1/auth/logout */
export async function postAuthLogout(options?: Record<string, unknown>) {
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>("/api/v1/auth/logout", {
    method: "POST",
    ...(options || {}),
  });
}

/** 获取当前用户信息 GET /api/v1/auth/me */
export async function getAuthMe(options?: Record<string, unknown>) {
  return request<
    GeneratedAutoHealing.Success & { data?: GeneratedAutoHealing.UserInfo }
  >("/api/v1/auth/me", {
    method: "GET",
    ...(options || {}),
  });
}

/** 修改密码 PUT /api/v1/auth/password */
export async function putAuthPassword(
  body: {
    old_password: string;
    new_password: string;
  },
  options?: Record<string, unknown>
) {
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>("/api/v1/auth/password", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取当前用户资料 GET /api/v1/auth/profile */
export async function getAuthProfile(options?: Record<string, unknown>) {
  return request<{
    code?: number;
    message?: string;
    data?: GeneratedAutoHealing.UserProfile;
  }>("/api/v1/auth/profile", {
    method: "GET",
    ...(options || {}),
  });
}

/** 更新当前用户资料 PUT /api/v1/auth/profile */
export async function putAuthProfile(
  body: {
    display_name?: string;
    email?: string;
    phone?: string;
  },
  options?: Record<string, unknown>
) {
  return request<{
    code?: number;
    message?: string;
    data?: GeneratedAutoHealing.UserProfile;
  }>("/api/v1/auth/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取当前用户近期活动 GET /api/v1/auth/profile/activities */
export async function getAuthProfileActivities(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getAuthProfileActivitiesParams,
  options?: Record<string, unknown>
) {
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>("/api/v1/auth/profile/activities", {
    method: "GET",
    params: {
      // limit has a default value: 10
      limit: "10",
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取当前用户登录历史 GET /api/v1/auth/profile/login-history */
export async function getAuthProfileLoginHistory(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.getAuthProfileLoginHistoryParams,
  options?: Record<string, unknown>
) {
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>("/api/v1/auth/profile/login-history", {
    method: "GET",
    params: {
      // limit has a default value: 10
      limit: "10",
      ...params,
    },
    ...(options || {}),
  });
}

/** 刷新令牌 POST /api/v1/auth/refresh */
export async function postAuthRefresh(
  body: {
    refresh_token: string;
  },
  options?: Record<string, unknown>
) {
  return request<
    GeneratedAutoHealing.Success & { data?: GeneratedAutoHealing.LoginPayload }
  >("/api/v1/auth/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 通过邀请注册用户 POST /api/v1/auth/register */
export async function postAuthRegister(
  body: Record<string, unknown>,
  options?: Record<string, unknown>
) {
  return request<{
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>("/api/v1/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

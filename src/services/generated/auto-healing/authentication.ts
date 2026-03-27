// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** User login POST /api/v1/auth/login */
export async function postAuthLogin(
  body: GeneratedAutoHealing.LoginRequest,
  options?: { [key: string]: any }
) {
  return request<GeneratedAutoHealing.LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** Get current user info GET /api/v1/auth/me */
export async function getAuthMe(options?: { [key: string]: any }) {
  return request<any>("/api/v1/auth/me", {
    method: "GET",
    ...(options || {}),
  });
}

/** Change password PUT /api/v1/auth/password */
export async function putAuthPassword(
  body: {
    old_password?: string;
    new_password?: string;
  },
  options?: { [key: string]: any }
) {
  return request<any>("/api/v1/auth/password", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** Get user profile GET /api/v1/auth/profile */
export async function getAuthProfile(options?: { [key: string]: any }) {
  return request<any>("/api/v1/auth/profile", {
    method: "GET",
    ...(options || {}),
  });
}

/** Update user profile PUT /api/v1/auth/profile */
export async function putAuthProfile(
  body: Record<string, any>,
  options?: { [key: string]: any }
) {
  return request<any>("/api/v1/auth/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** Refresh access token POST /api/v1/auth/refresh */
export async function postAuthRefresh(
  body: {
    refresh_token?: string;
  },
  options?: { [key: string]: any }
) {
  return request<any>("/api/v1/auth/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

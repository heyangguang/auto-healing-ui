// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** List secret sources GET /api/v1/tenant/secrets-sources */
export async function getTenantSecretsSources(options?: {
  [key: string]: any;
}) {
  return request<any>("/api/v1/tenant/secrets-sources", {
    method: "GET",
    ...(options || {}),
  });
}

/** Create secret source POST /api/v1/tenant/secrets-sources */
export async function postTenantSecretsSources(options?: {
  [key: string]: any;
}) {
  return request<any>("/api/v1/tenant/secrets-sources", {
    method: "POST",
    ...(options || {}),
  });
}

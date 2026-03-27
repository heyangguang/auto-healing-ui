// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** Health check GET /api/v1/health */
export async function getHealth(options?: { [key: string]: any }) {
  return request<{ status?: string }>("/api/v1/health", {
    method: "GET",
    ...(options || {}),
  });
}
